// src/app/api/subscription/status/route.ts
// GET /api/subscription/status — plan réellement actif (Supabase fait foi) et date d'activation.
// Utilisé par la page d'activation pour détecter le déblocage automatique après paiement.

import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getEffectivePlan } from "@/lib/db-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const { getProfileFromSupabase } = await import("@/lib/supabase-server");
  const p = await getProfileFromSupabase(session.userId, session.email || undefined).catch(() => null);
  const profile = p ? { ...p, userId: session.userId, email: session.email || p.email } : { userId: session.userId, email: session.email };
  return NextResponse.json({
    plan: getEffectivePlan(profile as any),
    startedAt: (p as any)?.subscriptionStartedAt || null,
    expiresAt: (p as any)?.subscriptionExpiresAt || null,
  });
}
