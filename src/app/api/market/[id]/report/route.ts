// src/app/api/market/[id]/report/route.ts
// POST { reason } — un membre connecté signale une annonce (arnaque, contenu interdit…).
// L'administrateur est alerté et peut la retirer.

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Connectez-vous pour signaler une annonce." }, { status: 401 });
  const { id } = await params;

  const { reason } = (await req.json().catch(() => ({}))) as { reason?: string };
  const admin = getSupabaseAdmin();
  const { data: listing } = await admin.from("pro_listings").select("id, title, userId, reportsCount").eq("id", id).maybeSingle();
  if (!listing) return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
  if (listing.userId === session.userId) return NextResponse.json({ error: "Vous ne pouvez pas signaler votre propre annonce." }, { status: 400 });

  const { error } = await admin.from("pro_reports").insert({
    id: `rep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    listingId: id,
    reporterId: session.userId,
    reason: (reason || "").toString().slice(0, 200) || null,
  });
  if (error) {
    // Déjà signalée par ce membre
    if (error.code === "23505") return NextResponse.json({ success: true, already: true });
    console.error("[report]", error);
    return NextResponse.json({ error: "Signalement impossible" }, { status: 500 });
  }
  await admin.from("pro_listings").update({ reportsCount: (listing.reportsCount || 0) + 1 }).eq("id", id);

  try {
    const { sendAdminAlert, siteUrl } = await import("@/lib/admin-notify");
    await sendAdminAlert({
      title: "🚩 Annonce signalée",
      body: `« ${listing.title} » : ${reason || "signalement"}`,
      url: "/admin/marche",
      tag: "market-report",
      emailSubject: `Annonce signalée : ${listing.title}`,
      emailHtml: `<p>L'annonce <strong>${listing.title}</strong> a été signalée.</p><p>Motif : ${reason || "—"}</p>
        <p><a href="${siteUrl()}/admin/marche" style="display:inline-block;background:#0B2559;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:bold">Voir les annonces signalées</a></p>`,
    });
  } catch (e) {
    console.warn("[report alert]", e);
  }

  return NextResponse.json({ success: true });
}
