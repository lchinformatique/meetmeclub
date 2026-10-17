// src/lib/admin-auth.ts
// Qui est administrateur ? Rôle ADMIN en base, ou compte vip_master (reconnu par
// identifiant, e-mail OU pseudo — l'identifiant réel en base peut différer).

import type { SessionPayload } from "./session";
import { findPermanentVipAccount, PERMANENT_VIP_ACCOUNTS } from "./subscription-constants";

// Résultat mémorisé 5 minutes par membre : évite 2 requêtes Supabase à chaque page/appel
const adminCache = new Map<string, { value: boolean; at: number }>();

export async function isAdminSession(session: SessionPayload | null): Promise<boolean> {
  if (!session?.userId) return false;
  if (session.role === "ADMIN" || session.role === "SUPER_ADMIN") return true;
  if (findPermanentVipAccount({ userId: session.userId, email: session.email })?.role === "ADMIN") return true;
  const cached = adminCache.get(session.userId);
  if (cached && Date.now() - cached.at < 5 * 60 * 1000) return cached.value;
  const value = await lookupAdmin(session);
  adminCache.set(session.userId, { value, at: Date.now() });
  return value;
}

async function lookupAdmin(session: SessionPayload): Promise<boolean> {
  try {
    const { getSupabaseAdmin } = await import("./supabase-server");
    const admin = getSupabaseAdmin();
    const { data: user } = await admin.from("users").select("role").eq("id", session.userId).maybeSingle();
    return user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  } catch {
    return false;
  }
}

/** Identifiants réels des administrateurs (pour leur envoyer les notifications) */
export async function getAdminUserIds(): Promise<string[]> {
  const ids = new Set<string>();
  try {
    const { getSupabaseAdmin } = await import("./supabase-server");
    const admin = getSupabaseAdmin();
    const { data: byRole } = await admin.from("users").select("id").in("role", ["ADMIN", "SUPER_ADMIN"]).limit(20);
    (byRole || []).forEach((u: any) => ids.add(u.id));
  } catch {}
  PERMANENT_VIP_ACCOUNTS.filter((a) => a.role === "ADMIN").forEach((a) => ids.add(a.userId));
  return Array.from(ids);
}
