// src/app/api/presence/online/route.ts
// POST /api/presence/online — le membre vient d'ouvrir l'application :
// ses interlocuteurs reçoivent « X est en ligne » sur leur téléphone
// (au plus une fois toutes les 6 heures par personne, pour ne pas déranger).

import { NextResponse, after } from "next/server";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

const PING_TYPE = "ONLINE_PING";
const QUIET_HOURS = 6;

export async function POST() {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ ok: false }, { status: 401 });
  const userId = session.userId;

  after(async () => {
    try {
      const { getSupabaseAdmin, getProfileFromSupabase } = await import("@/lib/supabase-server");
      const { sendPushToUser } = await import("@/lib/push-server");
      const admin = getSupabaseAdmin();

      // Déjà signalé récemment ?
      const since = new Date(Date.now() - QUIET_HOURS * 3600 * 1000).toISOString();
      const { data: recent } = await admin
        .from("notifications")
        .select("id")
        .eq("userId", userId)
        .eq("type", PING_TYPE)
        .gte("createdAt", since)
        .limit(1);
      if (recent?.length) return;

      await admin.from("notifications").insert({
        id: `ping_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        userId,
        type: PING_TYPE,
        title: "online",
        body: "",
        createdAt: new Date().toISOString(),
      });

      // Interlocuteurs du membre
      const { data: convs } = await admin
        .from("conversations")
        .select("id, participantA, participantB")
        .or(`participantA.eq.${userId},participantB.eq.${userId}`)
        .limit(50);
      if (!convs?.length) return;

      const me = await getProfileFromSupabase(userId);
      const name = me?.firstName || "Un membre";
      const photo = me?.avatarUrl && String(me.avatarUrl).startsWith("http") ? me.avatarUrl : undefined;

      await Promise.allSettled(
        convs.map((c: any) => {
          const partnerId = c.participantA === userId ? c.participantB : c.participantA;
          if (!partnerId || partnerId === "user_victoire_lome") return Promise.resolve(0);
          return sendPushToUser(partnerId, {
            kind: "message",
            title: `🟢 ${name} est en ligne`,
            body: "C'est le moment idéal pour lui écrire !",
            url: `/messages?conv=${encodeURIComponent(c.id)}`,
            tag: `online-${userId}`,
            icon: photo,
          });
        })
      );
    } catch (err) {
      console.warn("[presence/online]", err);
    }
  });

  return NextResponse.json({ ok: true });
}
