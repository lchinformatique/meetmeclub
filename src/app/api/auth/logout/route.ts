// src/app/api/auth/logout/route.ts
// POST /api/auth/logout — clears session cookie

import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/session";

export async function POST() {
  await deleteSession();
  return Response.json({ success: true });
}
