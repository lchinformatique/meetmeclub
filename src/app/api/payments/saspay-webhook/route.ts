// src/app/api/payments/saspay-webhook/route.ts
// POST /api/payments/saspay-webhook — notifications de paiement envoyées par SasPay.
// À déclarer dans app.saspay.me > Webhooks (événement transaction.success) :
//   https://www.meetmeclub.net/api/payments/saspay-webhook

import { NextRequest, NextResponse } from "next/server";
import {
  activatePlan,
  claimPayment,
  findMemberByIntent,
  findMemberByPhone,
  recordPayment,
  verifySaspaySignature,
} from "@/lib/payments-server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const ok = verifySaspaySignature(
    rawBody,
    req.headers.get("x-webhook-signature"),
    req.headers.get("x-webhook-timestamp")
  );
  if (!ok) return NextResponse.json({ error: "Signature invalide" }, { status: 403 });

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const event: string = payload?.event || req.headers.get("x-webhook-event") || "";
  const data = payload?.data || {};

  if (event === "webhook.test") return NextResponse.json({ received: true, test: true });

  // Seuls les paiements réussis débloquent un pass
  if (event !== "transaction.success" || !data?.id) return NextResponse.json({ received: true, ignored: event });

  try {
    const payment = await recordPayment(event, data);
    if (!payment?.plan || payment.userId) {
      return NextResponse.json({ received: true, plan: payment?.plan || null, alreadyClaimed: Boolean(payment?.userId) });
    }

    // 1. Numéro du payeur = téléphone d'un membre → activation immédiate
    // 2. Sinon : le membre qui a touché « Payer » pour ce pass dans les 45 dernières minutes
    const userId = (await findMemberByPhone(payment.msisdn)) || (await findMemberByIntent(payment.plan));
    if (userId) {
      await claimPayment(payment.id, userId);
      await activatePlan(userId, payment.plan, { paymentRef: payment.reference || payment.id });
      return NextResponse.json({ received: true, activated: payment.plan, userId });
    }

    // Sinon : le membre le réclamera sur /paiement/activation (référence ou numéro utilisé)
    return NextResponse.json({ received: true, pending: payment.plan });
  } catch (err) {
    console.error("[saspay-webhook]", err);
    // 500 → SasPay réessaiera automatiquement
    return NextResponse.json({ error: "Traitement impossible" }, { status: 500 });
  }
}
