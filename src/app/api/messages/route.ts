// src/app/api/messages/route.ts
// GET  /api/messages           — list conversations for the current user
// POST /api/messages           — send a message

import { NextRequest, NextResponse, after } from "next/server";
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

interface ConvRef {
  id: string;
  participantA: string;
  participantB: string;
}

// Retrouve (ou crée) la conversation réelle : Prisma d'abord, puis Supabase REST
async function resolveConversation(userId: string, conversationId: string): Promise<ConvRef | null> {
  const isMine = (c: any) => c && (c.participantA === userId || c.participantB === userId);

  try {
    const conv = await (prisma as any).conversation.findFirst({
      where: { id: conversationId, OR: [{ participantA: userId }, { participantB: userId }], isBlockedBy: null },
    });
    if (conv) return conv;
  } catch {}

  const { getSupabaseAdmin, findOrCreateConversationInSupabase } = await import("@/lib/supabase-server");
  try {
    const { data } = await getSupabaseAdmin()
      .from("conversations")
      .select("id, participantA, participantB, isBlockedBy")
      .eq("id", conversationId)
      .maybeSingle();
    if (data) return isMine(data) && !data.isBlockedBy ? data : null;
  } catch {}

  // Identifiant provisoire côté client ("local_<userId>") → conversation avec ce membre
  const partnerId = conversationId.startsWith("local_") ? conversationId.slice(6) : null;
  if (!partnerId || partnerId === userId) return null;

  try {
    const existing = await (prisma as any).conversation.findFirst({
      where: {
        OR: [
          { participantA: userId, participantB: partnerId },
          { participantA: partnerId, participantB: userId },
        ],
      },
    });
    if (existing) return existing;
    return await (prisma as any).conversation.create({ data: { participantA: userId, participantB: partnerId } });
  } catch {}

  return await findOrCreateConversationInSupabase(userId, partnerId);
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

  // Période terminée (essai gratuit de 7 jours ou pass expiré) → proposer le Pass Essentiel
  try {
    const { findPermanentVipAccount } = await import("@/lib/subscription-constants");
    const isExpired = (p: any) => p?.subscriptionExpiresAt && new Date(p.subscriptionExpiresAt).getTime() < Date.now();
    if (!findPermanentVipAccount({ userId: session.userId, email: session.email }) && isExpired(senderProfile)) {
      // Le cache local peut être périmé : confirmation auprès de Supabase avant de bloquer
      const { getProfileFromSupabase } = await import("@/lib/supabase-server");
      const fresh = await getProfileFromSupabase(session.userId, session.email || undefined);
      if (!fresh || isExpired(fresh)) {
        return NextResponse.json(
          {
            error: "Votre période d'accès est terminée. Activez le Pass Essentiel (3 000 F) pour continuer à discuter.",
            code: "PLAN_EXPIRED",
          },
          { status: 402 }
        );
      }
    }
  } catch {}

  try {
    const conversation = await resolveConversation(session.userId, conversationId);
    if (!conversation) {
      return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
    }
    const realConvId = conversation.id;
    const text = (messageBody || "Média partagé").trim();

    // 1. Enregistrement : Prisma, sinon Supabase REST (toujours attendu → aucun message perdu)
    let messageRecord: {
      id: string;
      conversationId: string;
      senderId: string;
      body: string;
      mediaUrl: string | null;
      createdAt: string;
      status: "SENT";
    } | null = null;

    try {
      const [msg] = await (prisma as any).$transaction([
        (prisma as any).message.create({
          data: { conversationId: realConvId, senderId: session.userId, body: text, mediaUrl: mediaUrl || null, status: "SENT" },
        }),
        (prisma as any).conversation.update({ where: { id: realConvId }, data: { lastMessageAt: new Date() } }),
      ]);
      messageRecord = {
        id: msg.id,
        conversationId: realConvId,
        senderId: session.userId,
        body: msg.body,
        mediaUrl: msg.mediaUrl || null,
        createdAt: new Date(msg.createdAt).toISOString(),
        status: "SENT",
      };
    } catch {
      const { saveMessageInSupabase } = await import("@/lib/supabase-server");
      const candidate = {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        conversationId: realConvId,
        senderId: session.userId,
        body: text,
        mediaUrl: mediaUrl || null,
        createdAt: new Date().toISOString(),
        status: "SENT" as const,
      };
      const saved = await saveMessageInSupabase(candidate);
      if (!saved) {
        return NextResponse.json({ error: "Le message n'a pas pu être enregistré. Réessayez." }, { status: 503 });
      }
      messageRecord = candidate;
    }

    const { saveMessage, saveConversation } = await import("@/lib/db-store");
    saveMessage(messageRecord);
    saveConversation({
      id: realConvId,
      participantA: conversation.participantA,
      participantB: conversation.participantB,
      lastMessage: messageRecord.body,
      lastMessageAt: messageRecord.createdAt,
    });

    // 2. Notification du destinataire (temps réel + téléphone) après la réponse
    const recipientId =
      conversation.participantA === session.userId ? conversation.participantB : conversation.participantA;
    const record = messageRecord;
    after(async () => {
      const { notifyNewMessage } = await import("@/lib/messaging-server");
      await notifyNewMessage({
        conversationId: realConvId,
        messageId: record.id,
        senderId: session.userId,
        recipientId,
        body: record.body,
        mediaUrl: record.mediaUrl,
        senderName: senderProfile?.firstName,
        senderPhoto: senderProfile?.photos?.find((p) => p.isMain)?.url || senderProfile?.photos?.[0]?.url,
      }).catch((e) => console.warn("[notifyNewMessage]", e));
    });

    return NextResponse.json({ message: messageRecord }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/messages]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
