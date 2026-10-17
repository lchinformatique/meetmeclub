// src/app/api/announcements/route.ts
// POST /api/announcements — notification envoyée à TOUS les membres abonnés
// (nouveautés, mises à jour du site, événements). Réservé aux administrateurs.
// { title, body, url? }

import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { getSession } from "@/lib/session";
import { isAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!(await isAdminSession(session))) return NextResponse.json({ error: "Réservé aux administrateurs" }, { status: 403 });

  const { title, body, url } = await req.json().catch(() => ({}));
  if (!title?.trim() || !body?.trim()) {
    return NextResponse.json({ error: "Titre et message obligatoires" }, { status: 400 });
  }

  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return NextResponse.json({ error: "Notifications non configurées (clés VAPID)" }, { status: 500 });
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:contact@meetmeclub.net", pub, priv);

  const { getSupabaseAdmin } = await import("@/lib/supabase-server");
  const admin = getSupabaseAdmin();
  const { data: rows } = await admin.from("notifications").select("id, data").eq("type", "PUSH_SUBSCRIPTION").limit(10000);

  const payload = JSON.stringify({
    kind: "message",
    title: `📣 ${String(title).trim().slice(0, 80)}`,
    body: String(body).trim().slice(0, 220),
    url: typeof url === "string" && url.startsWith("/") ? url : "/",
    tag: `announce-${Date.now()}`,
  });

  let sent = 0;
  let removed = 0;
  // Envois par paquets de 50 pour rester rapide
  const list = rows || [];
  for (let i = 0; i < list.length; i += 50) {
    await Promise.all(
      list.slice(i, i + 50).map(async (row: any) => {
        try {
          await webpush.sendNotification(row.data, payload, { TTL: 24 * 3600, urgency: "normal" });
          sent++;
        } catch (err: any) {
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            await admin.from("notifications").delete().eq("id", row.id);
            removed++;
          }
        }
      })
    );
  }

  return NextResponse.json({ success: true, sent, devices: list.length, removed });
}
