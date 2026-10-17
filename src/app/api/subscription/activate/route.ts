// src/app/api/subscription/activate/route.ts
// POST /api/subscription/activate — activation d'un pass APRÈS paiement SasPay vérifié.
// Le pass n'est débloqué que si SasPay a réellement confirmé le paiement (webhook) :
// le membre fournit la référence de son reçu ou le numéro mobile money utilisé.
// Le pass activé est celui qui correspond au montant réellement payé.

import { NextRequest, NextResponse, after } from "next/server";
import { getSession } from "@/lib/session";
import { PLAN_LIMITS } from "@/lib/db-store";
import {
  activatePlan,
  claimPayment,
  findUnclaimedPayment,
  notifyAdminsOfRequest,
  recordActivationRequest,
  type PaidPlan,
} from "@/lib/payments-server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: "Connectez-vous à votre compte pour activer votre pass.", needLogin: true },
        { status: 401 }
      );
    }

    const { phone, transactionRef, plan } = await req.json().catch(() => ({}));
    if (!phone && !transactionRef) {
      return NextResponse.json(
        { error: "Indiquez la référence de votre reçu SasPay ou le numéro mobile money utilisé pour payer." },
        { status: 400 }
      );
    }

    const payment = await findUnclaimedPayment(transactionRef, phone);

    // Déjà activé automatiquement (numéro du payeur reconnu par le webhook) ?
    if (!payment?.plan) {
      const { getSupabaseAdmin } = await import("@/lib/supabase-server");
      const { data: mine } = await getSupabaseAdmin()
        .from("saspay_payments")
        .select("plan, claimedAt")
        .eq("userId", session.userId)
        .gte("claimedAt", new Date(Date.now() - 24 * 3600 * 1000).toISOString())
        .order("claimedAt", { ascending: false })
        .limit(1);
      const recent = mine?.[0];
      if (recent?.plan) {
        return NextResponse.json({
          success: true,
          plan: recent.plan,
          message: `Votre ${PLAN_LIMITS[recent.plan as keyof typeof PLAN_LIMITS].label} est déjà actif !`,
        });
      }
    }

    if (!payment?.plan) {
      // Paiement pas reconnu automatiquement : demande de validation envoyée à l'administrateur
      const requestedPlan = ["ESSENTIAL", "COMPLICE", "VIP"].includes(plan) ? (plan as PaidPlan) : "ESSENTIAL";
      const isNew = await recordActivationRequest(session.userId, requestedPlan, phone, transactionRef).catch(() => false);
      if (isNew) {
        after(() => notifyAdminsOfRequest({ userId: session.userId, plan: requestedPlan, phone, reference: transactionRef }).catch(() => {}));
      }
      return NextResponse.json(
        {
          pending: true,
          requested: true,
          message:
            "Demande envoyée ✓ Notre équipe vérifie votre paiement SasPay et active votre pass très vite. Vous recevrez une notification, inutile de rester sur cette page.",
        },
        { status: 202 }
      );
    }

    await claimPayment(payment.id, session.userId);
    const result = await activatePlan(session.userId, payment.plan, {
      email: session.email || undefined,
      paymentRef: payment.reference || payment.id,
    });

    return NextResponse.json({
      success: true,
      plan: result.plan,
      expiresAt: result.expiresAt,
      message: `Votre ${PLAN_LIMITS[result.plan].label} est désormais actif !`,
    });
  } catch (error) {
    console.error("[POST /api/subscription/activate]", error);
    return NextResponse.json({ error: "Erreur lors de l'activation" }, { status: 500 });
  }
}
