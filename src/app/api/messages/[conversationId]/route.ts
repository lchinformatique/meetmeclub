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

  if (conversationId === "conv_victoire_welcome" || conversationId.includes("victoire")) {
    return NextResponse.json({
      messages: [
        {
          id: "msg_victoire_intro",
          conversationId,
          senderId: "user_victoire_lome",
          body: "Coucou ! 👋 Bienvenue sur Meet Me Club Lomé. Je suis ravie de faire ta connaissance ! Comment s'est passée ta journée ? 😊",
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          status: "DELIVERED",
        },
      ],
      hasMore: false,
    });
  }

  try {
    // Verify caller is a participant
    const conv = await (prisma as any).conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { participantA: session.userId },
          { participantB: session.userId },
        ],
        isBlockedBy: null,
      },
    });

    if (!conv) {
      return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
    }

    const messages = await (prisma as any).message.findMany({
      where: {
        conversationId,
        deletedAt: null,
        ...(cursor ? { id: { lt: cursor } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Mark delivered messages as READ for the other participant
    const unreadIds = messages
      .filter(
        (m: { senderId: string; status: string }) =>
          m.senderId !== session.userId && m.status !== "READ"
      )
      .map((m: { id: string }) => m.id);

    if (unreadIds.length > 0) {
      await (prisma as any).message.updateMany({
        where: { id: { in: unreadIds } },
        data: { status: "READ" },
      });
    }

    return NextResponse.json({
      messages: messages.reverse(), // chronological order
      hasMore: messages.length === limit,
    });
  } catch (error) {
    console.warn("[GET /api/messages/[conversationId]] DB not available:", error);
    return NextResponse.json({ messages: [], hasMore: false });
  }
}
