// src/app/api/push/subscribe/route.ts
// GET    /api/push/subscribe — clé publique VAPID
// POST   /api/push/subscribe — enregistre l'abonnement push de cet appareil
// DELETE /api/push/subscribe — supprime l'abonnement de cet appareil

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { isPushConfigured, removePushSubscription, savePushSubscription } from "@/lib/push-server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    configured: isPushConfigured(),
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null,
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { subscription } = await req.json().catch(() => ({ subscription: null }));
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return NextResponse.json({ error: "Abonnement invalide" }, { status: 400 });
  }
  const ok = await savePushSubscription(session.userId, {
    endpoint: subscription.endpoint,
    keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
  });
  return NextResponse.json({ success: ok }, { status: ok ? 201 : 500 });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const { endpoint } = await req.json().catch(() => ({ endpoint: null }));
  if (endpoint) await removePushSubscription(endpoint);
  return NextResponse.json({ success: true });
}
