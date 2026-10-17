// src/app/api/payments/intent/route.ts
// POST /api/payments/intent { plan } — le membre vient de toucher « Payer » pour ce pass.
// Permet d'attribuer automatiquement le paiement SasPay reçu juste après, même payé
// avec un autre numéro que celui du profil.

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { recordPaymentIntent, type PaidPlan } from "@/lib/payments-server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ ok: false }, { status: 401 });
  const { plan } = await req.json().catch(() => ({}));
  if (!["ESSENTIAL", "COMPLICE", "VIP"].includes(plan)) return NextResponse.json({ ok: false }, { status: 400 });
  await recordPaymentIntent(session.userId, plan as PaidPlan).catch(() => null);
  return NextResponse.json({ ok: true });
}
