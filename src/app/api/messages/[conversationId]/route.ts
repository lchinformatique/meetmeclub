// src/app/api/messages/[conversationId]/route.ts
// GET  /api/messages/[conversationId] — fetch messages in a conversation (paginated)

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { conversationId } = await params;
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor"); // message id for pagination
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

  let messages: any[] = [];

  // 1. Tenter via Prisma
  try {
    const dbMessages = await (prisma as any).message.findMany({
      where: {
        conversationId,
        deletedAt: null,
        ...(cursor ? { id: { lt: cursor } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    if (Array.isArray(dbMessages) && dbMessages.length > 0) {
      messages = dbMessages.reverse();
    }
  } catch (err) {
    // Prisma indisponible ou hors ligne
  }

  // 2. Si aucun message trouvé via Prisma, interroger Supabase PostgREST
  if (messages.length === 0) {
    try {
      const { getMessagesFromSupabase } = await import("@/lib/supabase-server");
      const supaMessages = await getMessagesFromSupabase(conversationId);
      if (Array.isArray(supaMessages) && supaMessages.length > 0) {
        messages = supaMessages;
      }
    } catch {}
  }

  // 3. Fallback sur le store local (mémoire / JSON)
  if (messages.length === 0) {
    try {
      const { getMessagesByConversationId } = await import("@/lib/db-store");
      const localMsgs = getMessagesByConversationId(conversationId);
      if (Array.isArray(localMsgs) && localMsgs.length > 0) {
        messages = localMsgs;
      }
    } catch {}
  }

  // Formatage uniforme
  const formatted = messages.map((m) => ({
    id: m.id,
    conversationId: m.conversationId || conversationId,
    senderId: m.senderId,
    body: m.body,
    mediaUrl: m.mediaUrl || undefined,
    createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : new Date().toISOString(),
    status: m.status || "SENT",
  }));

  return NextResponse.json({
    messages: formatted,
    hasMore: formatted.length === limit,
  });
}

