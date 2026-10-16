// src/app/api/messages/read/route.ts
// POST /api/messages/read { conversationId } — marque la conversation comme lue

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { markConversationRead } from "@/lib/messaging-server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const { conversationId } = await req.json().catch(() => ({ conversationId: null }));
  if (!conversationId) return NextResponse.json({ error: "conversationId requis" }, { status: 400 });
  const ok = await markConversationRead(session.userId, conversationId).catch(() => false);
  return NextResponse.json({ success: ok });
}
