// src/app/api/support/route.ts
// GET — identifiant du compte de l'équipe Meet Me Club, pour ouvrir une conversation
// d'assistance dans la messagerie interne (plus de WhatsApp).

import { NextResponse } from "next/server";
import { getAdminUserIds } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

let cached: { userId: string; at: number } | null = null;

export async function GET() {
  if (cached && Date.now() - cached.at < 10 * 60 * 1000) return NextResponse.json({ userId: cached.userId });
  try {
    const ids = await getAdminUserIds();
    // Premier administrateur qui possède un vrai profil (joignable dans la messagerie)
    const { data } = await getSupabaseAdmin().from("profiles").select("userId").in("userId", ids).limit(1);
    const userId = data?.[0]?.userId || ids[0] || null;
    if (userId) cached = { userId, at: Date.now() };
    return NextResponse.json({ userId });
  } catch {
    return NextResponse.json({ userId: null });
  }
}
