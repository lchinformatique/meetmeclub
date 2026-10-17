// src/lib/admin-auth.ts
// Qui est administrateur ? Rôle ADMIN en base, ou compte vip_master (reconnu par
// identifiant, e-mail OU pseudo — l'identifiant réel en base peut différer).

import type { SessionPayload } from "./session";
import { findPermanentVipAccount, PERMANENT_VIP_ACCOUNTS } from "./subscription-constants";

export async function isAdminSession(session: SessionPayload | null): Promise<boolean> {
  if (!session?.userId) return false;
  if (session.role === "ADMIN" || session.role === "SUPER_ADMIN") return true;
  if (findPermanentVipAccount({ userId: session.userId, email: session.email })?.role === "ADMIN") return true;
  try {
    const { getSupabaseAdmin } = await import("./supabase-server");
    const admin = getSupabaseAdmin();
    const [{ data: user }, { data: profile }] = await Promise.all([
      admin.from("users").select("role, email").eq("id", session.userId).maybeSingle(),
      admin.from("profiles").select("pseudo").eq("userId", session.userId).maybeSingle(),
    ]);
    if (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") return true;
    return findPermanentVipAccount({ email: user?.email, pseudo: profile?.pseudo })?.role === "ADMIN";
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
    const adminPseudos = PERMANENT_VIP_ACCOUNTS.filter((a) => a.role === "ADMIN").map((a) => a.pseudo);
    const adminEmails = PERMANENT_VIP_ACCOUNTS.filter((a) => a.role === "ADMIN").map((a) => a.email);
    const [{ data: byRole }, { data: byPseudo }, { data: byEmail }] = await Promise.all([
      admin.from("users").select("id").in("role", ["ADMIN", "SUPER_ADMIN"]).limit(20),
      admin.from("profiles").select("userId").in("pseudo", adminPseudos),
      admin.from("users").select("id").in("email", adminEmails),
    ]);
    (byRole || []).forEach((u: any) => ids.add(u.id));
    (byPseudo || []).forEach((p: any) => ids.add(p.userId));
    (byEmail || []).forEach((u: any) => ids.add(u.id));
  } catch {}
  PERMANENT_VIP_ACCOUNTS.filter((a) => a.role === "ADMIN").forEach((a) => ids.add(a.userId));
  return Array.from(ids);
}
