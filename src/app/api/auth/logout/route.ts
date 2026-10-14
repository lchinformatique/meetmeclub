// src/app/api/auth/logout/route.ts
// POST /api/auth/logout — Supprime le cookie de session et renvoie vers /connexion

import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/session";

export async function POST() {
  await deleteSession();
  return NextResponse.json({ success: true, redirect: "/connexion" });
}
