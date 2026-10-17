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
  notifyAdminsOfRequest,
  planFromAmount,
  recordActivationRequest,
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

  // Paiement réellement lancé (le client a rempli ses informations et validé sur SasPay)
  // → alerte à l'administrateur + demande à valider
  if (event === "transaction.created" && data?.id) {
    try {
      const plan = planFromAmount(data.amount, data.net_amount, data.charged);
      if (!plan) return NextResponse.json({ received: true, ignored: "montant hors pass" });
      const userId = (await findMemberByPhone(data.msisdn)) || (await findMemberByIntent(plan));
      if (userId) {
        const isNew = await recordActivationRequest(userId, plan, data.msisdn || undefined, data.reference || data.id);
        if (isNew) await notifyAdminsOfRequest({ userId, plan, phone: data.msisdn || undefined, reference: data.reference || data.id, attempt: true });
      } else {
        const { sendAdminAlert, siteUrl } = await import("@/lib/admin-notify");
        await sendAdminAlert({
          title: "💳 Paiement lancé (membre non identifié)",
          body: `${Number(data.amount).toLocaleString("fr-FR")} F depuis ${data.msisdn || "un numéro inconnu"}. À attribuer après confirmation.`,
          url: "/admin/paiements",
          tag: "activation-request",
          emailSubject: `Paiement lancé — ${Number(data.amount).toLocaleString("fr-FR")} F — membre non identifié`,
          emailHtml: `<p>Un paiement de <strong>${Number(data.amount).toLocaleString("fr-FR")} F</strong> vient d'être lancé depuis le numéro <strong>${data.msisdn || "—"}</strong> (réf. ${data.reference || data.id}).</p><p>Le membre n'a pas pu être identifié automatiquement : attribuez-le après confirmation SasPay.</p><p><a href="${siteUrl()}/admin/paiements" style="display:inline-block;background:#E10600;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:bold">Ouvrir les paiements</a></p>`,
        });
      }
      return NextResponse.json({ received: true, attempt: plan, userId: userId || null });
    } catch (err) {
      console.error("[saspay-webhook created]", err);
      return NextResponse.json({ error: "Traitement impossible" }, { status: 500 });
    }
  }

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
      // Information de l'administrateur : paiement confirmé par SasPay, pass activé
      try {
        const { sendAdminAlert, siteUrl } = await import("@/lib/admin-notify");
        const { getProfileFromSupabase } = await import("@/lib/supabase-server");
        const m = await getProfileFromSupabase(userId).catch(() => null);
        const who = m?.pseudo ? `${m.firstName || ""} (@${m.pseudo})` : m?.firstName || "Un membre";
        await sendAdminAlert({
          title: `✅ Paiement confirmé : ${who}`,
          body: `${Number(payment.amount).toLocaleString("fr-FR")} F reçus · pass activé automatiquement.`,
          url: "/admin/paiements",
          tag: "payment-confirmed",
          emailSubject: `Paiement confirmé — ${Number(payment.amount).toLocaleString("fr-FR")} F — ${who}`,
          emailHtml: `<p>SasPay a confirmé le paiement de <strong>${who}</strong> (${Number(payment.amount).toLocaleString("fr-FR")} F). Le pass a été activé automatiquement.</p><p><a href="${siteUrl()}/admin/paiements">Voir les paiements</a></p>`,
        });
      } catch {}
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
