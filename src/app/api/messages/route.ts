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

  const { getProfileByUserId } = await import("@/lib/db-store");
  const senderProfile = getProfileByUserId(session.userId);

  const body = await req.json();
  const { conversationId, body: messageBody, mediaUrl } = body;

  if (!conversationId || (!messageBody?.trim() && !mediaUrl)) {
    return NextResponse.json(
      { error: "conversationId et body ou mediaUrl sont requis" },
      { status: 400 }
    );
  }
  if (messageBody && messageBody.trim().length > 2000) {
    return NextResponse.json(
      { error: "Message trop long (max 2000 caractères)" },
      { status: 400 }
    );
  }

  // Si le message est adressé à Victoire, générer la réponse automatique
  if (conversationId === "conv_victoire_welcome" || conversationId.includes("victoire")) {
    const { getVictoireReply } = await import("@/lib/victoire-bot");
    let mediaType: "image" | "audio" | "location" | undefined;
    if (mediaUrl) {
      if (mediaUrl.includes("video") || mediaUrl.includes("image") || mediaUrl.startsWith("data:image")) mediaType = "image";
      else if (mediaUrl.includes("audio") || mediaUrl.startsWith("data:audio")) mediaType = "audio";
    }
    if (messageBody?.includes("📍")) mediaType = "location";

    const userMessage = {
      id: `msg_${Date.now()}`,
      conversationId,
      senderId: session.userId,
      body: (messageBody || "Média partagé").trim(),
      mediaUrl: mediaUrl || null,
      createdAt: new Date().toISOString(),
      status: "SENT",
    };

    const replyBody = getVictoireReply(messageBody || "", mediaType);
    const victoireReply = {
      id: `msg_victoire_${Date.now() + 1}`,
      conversationId,
      senderId: "user_victoire_lome",
      body: replyBody,
      mediaUrl: null,
      createdAt: new Date(Date.now() + 1500).toISOString(),
      status: "DELIVERED",
    };

    const { saveMessage, saveConversation } = await import("@/lib/db-store");
    saveMessage(userMessage as any);
    saveMessage(victoireReply as any);
    saveConversation({
      id: conversationId,
      participantA: "user_victoire_lome",
      participantB: session.userId,
      lastMessage: replyBody,
      lastMessageAt: new Date().toISOString(),
    });

    return NextResponse.json({ message: userMessage, reply: victoireReply }, { status: 201 });
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

    let activeConversation = conv;
    if (!activeConversation) {
      const partnerId = conversationId.startsWith("local_") ? conversationId.replace("local_", "") : conversationId;
      try {
        activeConversation = await (prisma as any).conversation.findFirst({
          where: {
            OR: [
              { participantA: session.userId, participantB: partnerId },
              { participantA: partnerId, participantB: session.userId },
            ],
          },
        });
        if (!activeConversation) {
          activeConversation = await (prisma as any).conversation.create({
            data: {
              participantA: session.userId,
              participantB: partnerId,
            },
          });
        }
      } catch {
        activeConversation = {
          id: conversationId,
          participantA: session.userId,
          participantB: partnerId,
        };
      }
    }

    const realConvId = activeConversation.id;

    let message: any = null;
    try {
      const [msg] = await (prisma as any).$transaction([
        (prisma as any).message.create({
          data: {
            conversationId: realConvId,
            senderId: session.userId,
            body: (messageBody || "Média partagé").trim(),
            mediaUrl: mediaUrl || null,
            status: "SENT",
          },
        }),
        (prisma as any).conversation.update({
          where: { id: realConvId },
          data: { lastMessageAt: new Date() },
        }),
      ]);
      message = msg;
    } catch {
      message = {
        id: `msg_${Date.now()}`,
        conversationId: realConvId,
        senderId: session.userId,
        body: (messageBody || "Média partagé").trim(),
        mediaUrl: mediaUrl || null,
        createdAt: new Date().toISOString(),
        status: "SENT",
      };
    }

    const { saveMessage, saveConversation } = await import("@/lib/db-store");
    const { saveMessageInSupabase } = await import("@/lib/supabase-server");

    const messageRecord = {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      body: message.body,
      mediaUrl: message.mediaUrl,
      createdAt: message.createdAt ? new Date(message.createdAt).toISOString() : new Date().toISOString(),
      status: (message.status || "SENT") as any,
    };

    saveMessage(messageRecord);
    saveConversation({
      id: realConvId,
      participantA: activeConversation.participantA,
      participantB: activeConversation.participantB,
      lastMessage: message.body,
      lastMessageAt: messageRecord.createdAt,
    });

    // Sauvegarde asynchrone dans Supabase PostgREST
    saveMessageInSupabase(messageRecord).catch(() => {});

    return NextResponse.json({ message: messageRecord }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/messages]", error);
    // Local fallback persistence
    try {
      const { saveMessage, saveConversation } = await import("@/lib/db-store");
      const { saveMessageInSupabase } = await import("@/lib/supabase-server");
      const fallbackMsg = {
        id: `msg_${Date.now()}`,
        conversationId,
        senderId: session.userId,
        body: (messageBody || "Média partagé").trim(),
        mediaUrl: mediaUrl || null,
        createdAt: new Date().toISOString(),
        status: "SENT" as const,
      };
      saveMessage(fallbackMsg);
      saveConversation({
        id: conversationId,
        participantA: session.userId,
        participantB: conversationId.startsWith("local_") ? conversationId.replace("local_", "") : "partner",
        lastMessage: fallbackMsg.body,
        lastMessageAt: fallbackMsg.createdAt,
      });
      saveMessageInSupabase(fallbackMsg).catch(() => {});
      return NextResponse.json({ message: fallbackMsg }, { status: 201 });
    } catch {}
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

