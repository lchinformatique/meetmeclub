// src/app/api/messages/route.ts
// GET  /api/messages           — list conversations for the current user
// POST /api/messages           — send a message

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ── GET: list conversations ──────────────────────────────────
export async function GET() {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const conversations = await (prisma as any).conversation.findMany({
      where: {
        OR: [
          { participantA: session.userId },
          { participantB: session.userId },
        ],
        isBlockedBy: null,
      },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: "desc" },
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.warn("[GET /api/messages] DB not available:", error);
    // Return empty list gracefully (dev mode without DB)
    return NextResponse.json({ conversations: [] });
  }
}

// ── POST: send a message ─────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await req.json();
  const { conversationId, body: messageBody } = body;

  if (!conversationId || !messageBody?.trim()) {
    return NextResponse.json(
      { error: "conversationId et body sont requis" },
      { status: 400 }
    );
  }
  if (messageBody.trim().length > 2000) {
    return NextResponse.json(
      { error: "Message trop long (max 2000 caractères)" },
      { status: 400 }
    );
  }

  try {
    // Verify the caller is a participant of this conversation
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
      return NextResponse.json(
        { error: "Conversation introuvable ou accès refusé" },
        { status: 404 }
      );
    }

    const [message] = await (prisma as any).$transaction([
      (prisma as any).message.create({
        data: {
          conversationId,
          senderId: session.userId,
          body: messageBody.trim(),
          status: "SENT",
        },
      }),
      (prisma as any).conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      }),
    ]);

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/messages]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
