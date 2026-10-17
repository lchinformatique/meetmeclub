// src/app/api/payments/admin/route.ts
// Réservé aux administrateurs.
// GET  — derniers paiements SasPay reçus (attribués ou non) + état de la configuration
// POST — activer manuellement un pass pour un membre { identifier, plan, paymentId? }

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { isAdminSession } from "@/lib/admin-auth";
import {
  activatePlan,
  claimPayment,
  closeActivationRequest,
  listActivationRequests,
  type PaidPlan,
} from "@/lib/payments-server";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getSession();
  return (await isAdminSession(session)) ? session : null;
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Réservé aux administrateurs" }, { status: 403 });
  const { getSupabaseAdmin } = await import("@/lib/supabase-server");
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("saspay_payments")
    .select("id, reference, status, amount, charged, msisdn, plan, userId, claimedAt, createdAt")
    .order("createdAt", { ascending: false })
    .limit(100);

  // Pseudo / e-mail des membres crédités
  const ids = Array.from(new Set((data || []).map((p: any) => p.userId).filter(Boolean)));
  let names: Record<string, string> = {};
  if (ids.length) {
    const { data: profs } = await admin.from("profiles").select("userId, pseudo, firstName").in("userId", ids);
    names = Object.fromEntries((profs || []).map((p: any) => [p.userId, p.pseudo || p.firstName]));
  }

  const requests = await listActivationRequests().catch(() => []);

  return NextResponse.json({
    requests,
    tableReady: !error,
    tableError: error?.message || null,
    webhookSecretConfigured: Boolean(process.env.SASPAY_WEBHOOK_SECRET),
    payments: (data || []).map((p: any) => ({ ...p, member: p.userId ? names[p.userId] || p.userId : null })),
  });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Réservé aux administrateurs" }, { status: 403 });
  const { identifier, plan, paymentId, requestId, action } = await req.json().catch(() => ({}));

  // Demande d'un membre : Valider (active le pass) ou Refuser
  if (requestId && (action === "approve" || action === "reject")) {
    const closed = await closeActivationRequest(String(requestId));
    if (!closed) return NextResponse.json({ error: "Demande introuvable ou déjà traitée" }, { status: 404 });
    if (action === "reject") {
      const { sendPushToUser } = await import("@/lib/push-server");
      await sendPushToUser(closed.userId, {
        kind: "message",
        title: "Paiement non retrouvé",
        body: "Nous n'avons pas trouvé votre paiement. Contactez le support WhatsApp avec votre reçu SasPay.",
        url: "/paiement/activation",
        tag: "activation-request",
      }).catch(() => 0);
      return NextResponse.json({ success: true, rejected: true });
    }
    const approvedPlan = (["ESSENTIAL", "COMPLICE", "VIP"].includes(plan) ? plan : closed.title) as PaidPlan;
    const result = await activatePlan(closed.userId, approvedPlan, { paymentRef: `VALIDATION_${closed.id}` });
    return NextResponse.json({ success: true, userId: closed.userId, ...result });
  }
  if (!identifier || !["ESSENTIAL", "COMPLICE", "VIP"].includes(plan)) {
    return NextResponse.json({ error: "Pseudo/e-mail du membre et pass obligatoires" }, { status: 400 });
  }

  // E-mail exact ou pseudo exact uniquement (jamais le prénom : risque de créditer le mauvais membre)
  const { getSupabaseAdmin } = await import("@/lib/supabase-server");
  const admin = getSupabaseAdmin();
  const clean = String(identifier).trim().replace(/^@/, "");
  let userId: string | null = null;
  if (clean.includes("@")) {
    const { data } = await admin.from("users").select("id").ilike("email", clean.toLowerCase()).maybeSingle();
    userId = data?.id || null;
  } else {
    const { data } = await admin.from("profiles").select("userId").ilike("pseudo", clean).maybeSingle();
    userId = data?.userId || null;
  }
  if (!userId) return NextResponse.json({ error: "Membre introuvable (vérifiez le pseudo ou l'e-mail exact)" }, { status: 404 });

  if (paymentId) await claimPayment(String(paymentId), userId).catch(() => null);
  const result = await activatePlan(userId, plan as PaidPlan, { paymentRef: paymentId || `MANUEL_${Date.now()}` });
  return NextResponse.json({ success: true, userId, ...result });
}
