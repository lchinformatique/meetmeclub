// src/lib/member-plan.ts
// Formule réellement active d'un membre (Supabase fait foi, pass expiré = FREE).

import type { SessionPayload } from "./session";

export type MemberPlan = "FREE" | "ESSENTIAL" | "COMPLICE" | "VIP";

export async function getMemberPlan(session: SessionPayload): Promise<MemberPlan> {
  const { getEffectivePlan, getProfileByUserId } = await import("./db-store");
  let source: any = getProfileByUserId(session.userId);
  try {
    const { getProfileFromSupabase } = await import("./supabase-server");
    const supa = await getProfileFromSupabase(session.userId, session.email || undefined);
    if (supa) source = { ...source, ...supa, userId: session.userId, email: session.email || supa.email };
  } catch {}
  return getEffectivePlan(source || { userId: session.userId, email: session.email });
}
