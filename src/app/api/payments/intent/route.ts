// src/app/api/payments/intent/route.ts
// POST /api/payments/intent { plan } — le membre vient de toucher « Payer » pour ce pass.
// Permet d'attribuer automatiquement le paiement SasPay reçu juste après, même payé
// avec un autre numéro que celui du profil.

import { NextRequest, NextResponse, after } from "next/server";
import { getSession } from "@/lib/session";
import {
  notifyAdminsOfRequest,
  recordActivationRequest,
  recordPaymentIntent,
  type PaidPlan,
} from "@/lib/payments-server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ ok: false }, { status: 401 });
  const { plan } = await req.json().catch(() => ({}));
  if (!["ESSENTIAL", "COMPLICE", "VIP"].includes(plan)) return NextResponse.json({ ok: false }, { status: 400 });
  const paidPlan = plan as PaidPlan;
  const userId = session.userId;

  await recordPaymentIntent(userId, paidPlan).catch(() => null);

  // Tentative de paiement → demande à valider + notification immédiate à l'administrateur
  after(async () => {
    try {
      const { getProfileFromSupabase } = await import("@/lib/supabase-server");
      const me = await getProfileFromSupabase(userId, session.email || undefined).catch(() => null);
      const phone = (me as any)?.phone || undefined;
      const isNew = await recordActivationRequest(userId, paidPlan, phone, undefined);
      if (isNew) await notifyAdminsOfRequest({ userId, plan: paidPlan, phone, attempt: true });
    } catch (err) {
      console.warn("[payments/intent]", err);
    }
  });

  return NextResponse.json({ ok: true });
}
