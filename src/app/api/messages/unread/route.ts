// src/app/api/messages/unread/route.ts
// GET /api/messages/unread — total des messages non lus + détail par conversation

import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getUnreadCounts } from "@/lib/messaging-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ total: 0, byConversation: {} }, { status: 401 });
  try {
    const byConversation = await getUnreadCounts(session.userId);
    const total = Object.values(byConversation).reduce((s, n) => s + n, 0);
    return NextResponse.json({ total, byConversation });
  } catch (err) {
    console.warn("[GET /api/messages/unread]", err);
    return NextResponse.json({ total: 0, byConversation: {} });
  }
}
