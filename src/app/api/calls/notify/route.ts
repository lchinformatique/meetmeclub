// src/app/api/calls/notify/route.ts
// POST /api/calls/notify — notification téléphone d'un appel entrant ou manqué
// { targetUserId, callType: "audio" | "video", kind: "call" | "missed-call", conversationId? }

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sendPushToUser } from "@/lib/push-server";
import { getProfileByUserId } from "@/lib/db-store";
import { isVideoVerified, VIDEO_REQUIRED_ERROR } from "@/lib/verification";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  // Appels : vidéo de vérification VIP validée obligatoire
  if (!(await isVideoVerified(session.userId))) {
    return NextResponse.json(VIDEO_REQUIRED_ERROR, { status: 403 });
  }

  const { targetUserId, callType, kind, conversationId } = await req.json().catch(() => ({}));
  if (!targetUserId || targetUserId === session.userId) {
    return NextResponse.json({ error: "Destinataire invalide" }, { status: 400 });
  }

  let callerName = getProfileByUserId(session.userId)?.firstName;
  if (!callerName) {
    try {
      const { getProfileFromSupabase } = await import("@/lib/supabase-server");
      callerName = (await getProfileFromSupabase(session.userId))?.firstName;
    } catch {}
  }
  callerName = callerName || "Un membre";

  const label = callType === "video" ? "vidéo" : "vocal";
  const missed = kind === "missed-call";
  const sent = await sendPushToUser(targetUserId, {
    kind: missed ? "missed-call" : "call",
    title: missed ? `📵 Appel ${label} manqué` : `📞 Appel ${label} entrant`,
    body: missed ? `${callerName} a essayé de vous appeler.` : `${callerName} vous appelle sur Meet Me Club`,
    url: conversationId ? `/messages?conv=${encodeURIComponent(conversationId)}` : "/messages",
    tag: `call-${session.userId}`,
  });
  return NextResponse.json({ success: true, sent });
}
