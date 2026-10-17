// src/app/api/auth/password/route.ts
// GET  /api/auth/password — le compte a-t-il déjà un mot de passe ?
// POST /api/auth/password — créer ou changer son mot de passe Meet Me Club
//   { newPassword, currentPassword? }  (currentPassword obligatoire s'il en existe déjà un)
// Permet aux membres inscrits avec Google de se connecter aussi avec leur pseudo.

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

async function currentHash(userId: string, email?: string | null): Promise<{ id: string; hash: string | null } | null> {
  const { getSupabaseAdmin } = await import("@/lib/supabase-server");
  const admin = getSupabaseAdmin();
  const { data } = await admin.from("users").select("id, passwordHash").eq("id", userId).maybeSingle();
  if (data) return { id: data.id, hash: data.passwordHash || null };
  if (email) {
    const { data: byEmail } = await admin.from("users").select("id, passwordHash").ilike("email", email).maybeSingle();
    if (byEmail) return { id: byEmail.id, hash: byEmail.passwordHash || null };
  }
  return null;
}

export async function GET() {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const user = await currentHash(session.userId, session.email).catch(() => null);
  return NextResponse.json({ hasPassword: Boolean(user?.hash) });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Session expirée, reconnectez-vous." }, { status: 401 });

  const { newPassword, currentPassword } = await req.json().catch(() => ({}));
  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return NextResponse.json({ error: "Le mot de passe doit comporter au moins 8 caractères." }, { status: 400 });
  }

  const user = await currentHash(session.userId, session.email);
  if (!user) return NextResponse.json({ error: "Compte introuvable." }, { status: 404 });

  // Changement : l'ancien mot de passe est exigé
  if (user.hash) {
    const ok = typeof currentPassword === "string" && (await bcrypt.compare(currentPassword, user.hash));
    if (!ok) return NextResponse.json({ error: "Mot de passe actuel incorrect." }, { status: 401 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  const { getSupabaseAdmin } = await import("@/lib/supabase-server");
  const { error } = await getSupabaseAdmin()
    .from("users")
    .update({ passwordHash, updatedAt: new Date().toISOString() })
    .eq("id", user.id);
  if (error) return NextResponse.json({ error: "Enregistrement impossible, réessayez." }, { status: 500 });

  return NextResponse.json({ success: true });
}
