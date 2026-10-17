// src/app/api/auth/activity/route.ts
// POST /api/auth/activity — signal d'activité réelle du membre (toucher, clavier, défilement).
// Prolonge la session de 30 minutes. Les rafraîchissements automatiques en arrière-plan
// n'appellent jamais cette route : un téléphone posé se verrouille donc bien après 30 min.

import { NextResponse } from "next/server";
import { getSession, setSessionCookie } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getSession(); // null si déjà verrouillée
  if (!session) return NextResponse.json({ locked: true }, { status: 401 });
  await setSessionCookie({ ...session, la: Date.now() });
  return NextResponse.json({ ok: true });
}
