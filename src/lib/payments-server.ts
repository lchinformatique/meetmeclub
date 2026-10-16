// src/lib/payments-server.ts
// Paiements SasPay vérifiés : signature des webhooks, enregistrement, rattachement au membre
// et activation du pass correspondant au montant payé.

import crypto from "crypto";
import { getSupabaseAdmin } from "./supabase-server";

export type PaidPlan = "ESSENTIAL" | "COMPLICE" | "VIP";

// Montant du lien de paiement → pass débloqué
const PLAN_BY_AMOUNT: Record<number, PaidPlan> = {
  3000: "ESSENTIAL",
  6000: "COMPLICE",
  15000: "VIP",
};

const PLAN_LABEL: Record<PaidPlan, string> = {
  ESSENTIAL: "Pass Essentiel",
  COMPLICE: "Pass Complice",
  VIP: "Pass VIP",
};

const PLAN_DAYS = 30;

export function planFromAmount(...amounts: Array<number | string | null | undefined>): PaidPlan | null {
  for (const a of amounts) {
    const n = Math.round(Number(a));
    if (PLAN_BY_AMOUNT[n]) return PLAN_BY_AMOUNT[n];
  }
  return null;
}

/** Vérifie la signature SasPay : HMAC-SHA256 hex de "{timestamp}.{corps brut}" */
export function verifySaspaySignature(rawBody: string, signature: string | null, timestamp: string | null) {
  const secret = process.env.SASPAY_WEBHOOK_SECRET;
  if (!secret || !signature || !timestamp) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature.trim().toLowerCase(), "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** 8 derniers chiffres : compare des numéros écrits différemment (+228 90 12 34 56 / 22890123456) */
export function phoneKey(phone?: string | null) {
  const digits = (phone || "").replace(/\D/g, "");
  return digits.length >= 8 ? digits.slice(-8) : "";
}

export interface SaspayPayment {
  id: string;
  reference?: string | null;
  status?: string | null;
  amount?: number | null;
  charged?: number | null;
  msisdn?: string | null;
  plan?: PaidPlan | null;
  userId?: string | null;
  createdAt?: string;
}

/** Enregistre (une seule fois) un paiement reçu de SasPay */
export async function recordPayment(event: string, data: any): Promise<SaspayPayment | null> {
  const admin = getSupabaseAdmin();
  const row = {
    id: String(data.id || data.reference),
    reference: data.reference ? String(data.reference) : null,
    event,
    status: data.status || null,
    amount: data.amount != null ? Number(data.amount) : null,
    charged: data.charged != null ? Number(data.charged) : null,
    currency: data.currency || null,
    country: data.country || null,
    network: data.network || null,
    msisdn: data.msisdn || null,
    plan: planFromAmount(data.amount, data.net_amount, data.charged),
    raw: data,
  };
  const { data: existing } = await admin.from("saspay_payments").select("*").eq("id", row.id).maybeSingle();
  if (existing) return existing as SaspayPayment;
  const { data: inserted, error } = await admin.from("saspay_payments").insert(row).select().maybeSingle();
  if (error) {
    console.warn("[recordPayment] table saspay_payments indisponible (migration v3 à exécuter ?)", error.message);
    return { ...row, userId: null } as SaspayPayment;
  }
  return inserted as SaspayPayment;
}

/** Membre dont le numéro de téléphone correspond à celui du payeur */
export async function findMemberByPhone(msisdn?: string | null): Promise<string | null> {
  const key = phoneKey(msisdn);
  if (!key) return null;
  const admin = getSupabaseAdmin();
  const { data } = await admin.from("users").select("id, phone").not("phone", "is", null).limit(5000);
  const matches = (data || []).filter((u: any) => phoneKey(u.phone) === key);
  return matches.length === 1 ? matches[0].id : null; // jamais en cas d'ambiguïté
}

/** Active (ou prolonge) le pass d'un membre pour 30 jours */
export async function activatePlan(userId: string, plan: PaidPlan, opts: { email?: string; paymentRef?: string } = {}) {
  const { getProfileFromSupabase, upsertProfileInSupabase } = await import("./supabase-server");
  const { saveProfile } = await import("./db-store");

  const current = await getProfileFromSupabase(userId, opts.email).catch(() => null);
  const now = Date.now();
  const currentExpiry = current?.subscriptionExpiresAt ? new Date(current.subscriptionExpiresAt).getTime() : 0;
  // Même pass encore actif → on prolonge à partir de sa date de fin
  const extending = current?.plan === plan && currentExpiry > now;
  const startedAt = extending && current?.subscriptionStartedAt ? String(current.subscriptionStartedAt) : new Date(now).toISOString();
  const expiresAt = new Date((extending ? currentExpiry : now) + PLAN_DAYS * 24 * 3600 * 1000).toISOString();

  await upsertProfileInSupabase(userId, {
    email: opts.email,
    plan,
    subscriptionStartedAt: startedAt,
    subscriptionExpiresAt: expiresAt,
  });
  try {
    saveProfile({ userId, plan, subscriptionStartedAt: startedAt, subscriptionExpiresAt: expiresAt });
  } catch {}

  // Historique (best effort)
  try {
    const { prisma } = await import("./prisma");
    await (prisma as any).subscription.create({
      data: {
        userId,
        plan,
        status: "ACTIVE",
        startDate: new Date(startedAt),
        endDate: new Date(expiresAt),
        priceFcfa: { ESSENTIAL: 3000, COMPLICE: 6000, VIP: 15000 }[plan],
        paymentRef: opts.paymentRef || `SASPAY_${now}`,
        paymentMethod: "SASPAY",
      },
    });
  } catch {}

  // Prévenir le membre (temps réel + téléphone)
  try {
    const { broadcastToUser } = await import("./realtime-server");
    const { sendPushToUser } = await import("./push-server");
    await Promise.allSettled([
      broadcastToUser(userId, "plan-activated", { plan, expiresAt }),
      sendPushToUser(userId, {
        kind: "message",
        title: `👑 ${PLAN_LABEL[plan]} activé !`,
        body: "Votre paiement a été reçu. Tous vos avantages sont débloqués.",
        url: "/profil?activated=" + plan,
        tag: "plan-activated",
      }),
    ]);
  } catch {}

  return { plan, startedAt, expiresAt };
}

/** Rattache un paiement reçu à un membre */
export async function claimPayment(paymentId: string, userId: string) {
  const admin = getSupabaseAdmin();
  await admin
    .from("saspay_payments")
    .update({ userId, claimedAt: new Date().toISOString() })
    .eq("id", paymentId)
    .is("userId", null);
}

/** Paiement réussi non encore rattaché, retrouvé par sa référence ou le numéro du payeur */
export async function findUnclaimedPayment(ref?: string | null, phone?: string | null): Promise<SaspayPayment | null> {
  const admin = getSupabaseAdmin();
  const since = new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString();
  const { data } = await admin
    .from("saspay_payments")
    .select("*")
    .is("userId", null)
    .not("plan", "is", null)
    .gte("createdAt", since)
    .order("createdAt", { ascending: false })
    .limit(500);
  const rows = (data || []) as SaspayPayment[];
  const cleanRef = (ref || "").trim().toLowerCase();
  if (cleanRef.length >= 4) {
    const byRef = rows.find((p) => p.reference?.toLowerCase() === cleanRef || p.id.toLowerCase() === cleanRef);
    if (byRef) return byRef;
  }
  const key = phoneKey(phone);
  if (key) {
    const byPhone = rows.filter((p) => phoneKey(p.msisdn) === key);
    if (byPhone.length >= 1) return byPhone[0];
  }
  return null;
}
