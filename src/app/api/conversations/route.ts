// src/app/api/conversations/route.ts
// POST /api/conversations — create or find an existing conversation between two users
// GET  /api/conversations — list all conversations for the current user

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getProfileByUserId, getAllProfiles } from "@/lib/db-store";

export const dynamic = "force-dynamic";

// ── GET: list conversations with last message + partner info ──
export async function GET() {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const conversations = await prisma.conversation.findMany({
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

    // Enrich with partner profile info
    const enriched = await Promise.all(
      conversations.map(async (conv) => {
        const partnerId =
          conv.participantA === session.userId
            ? conv.participantB
            : conv.participantA;

        let partnerName = "Membre";
        let partnerPseudo = "@membre";
        let partnerPhotoUrl = "";
        let isVerified = false;

        // Try Prisma profile
        try {
          const profile = await prisma.profile.findUnique({
            where: { userId: partnerId },
            include: {
              photos: { where: { isMain: true }, take: 1 },
            },
          });
          if (profile) {
            partnerName = profile.firstName;
            partnerPseudo = profile.pseudo || profile.firstName;
            partnerPhotoUrl = profile.photos?.[0]?.url || "";
            isVerified = true;
          }
        } catch {
          // Fallback to local store
          const localProfile = getProfileByUserId(partnerId);
          if (localProfile) {
            partnerName = localProfile.firstName;
            partnerPseudo = localProfile.pseudo || localProfile.firstName;
            partnerPhotoUrl = localProfile.photos?.[0]?.url || "";
            isVerified = localProfile.isVerified;
          }
        }

        const lastMsg = conv.messages[0];
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: session.userId },
            status: { not: "READ" },
          },
        }).catch(() => 0);

        return {
          id: conv.id,
          participantId: partnerId,
          firstName: partnerName,
          pseudo: partnerPseudo,
          photoUrl: partnerPhotoUrl,
          lastMessage: lastMsg?.body || "Nouvelle conversation",
          lastMessageAt: conv.lastMessageAt.toISOString(),
          unreadCount,
          isOnline: true,
          isVerified,
        };
      })
    );

    // Garantir que chaque utilisateur a une conversation d'accueil avec Victoire
    const hasVictoire = enriched.some(
      (c) => c.participantId === "user_victoire_lome" || c.id === "conv_victoire_welcome"
    );
    if (!hasVictoire && session.userId !== "user_victoire_lome") {
      enriched.unshift({
        id: "conv_victoire_welcome",
        participantId: "user_victoire_lome",
        firstName: "Victoire",
        pseudo: "@victoire_lome",
        photoUrl: "/victoire_profile.jpg",
        lastMessage: "Coucou ! 👋 Ravie de faire ta connaissance sur Meet Me Club ! Comment s'est passée ta journée ? 😊",
        lastMessageAt: new Date().toISOString(),
        unreadCount: 1,
        isOnline: true,
        isVerified: true,
      });
    }

    return NextResponse.json({ conversations: enriched });
  } catch (error) {
    console.warn("[GET /api/conversations] DB error, returning Victoire welcome:", error);
    return NextResponse.json({
      conversations: [
        {
          id: "conv_victoire_welcome",
          participantId: "user_victoire_lome",
          firstName: "Victoire",
          pseudo: "@victoire_lome",
          photoUrl: "/victoire_profile.jpg",
          lastMessage: "Coucou ! 👋 Ravie de faire ta connaissance sur Meet Me Club ! Comment s'est passée ta journée ? 😊",
          lastMessageAt: new Date().toISOString(),
          unreadCount: 1,
          isOnline: true,
          isVerified: true,
        },
      ],
    });
  }
}

// ── POST: create or find existing conversation ───────────────
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await req.json();
  const { targetUserId } = body;

  if (!targetUserId) {
    return NextResponse.json(
      { error: "targetUserId est requis" },
      { status: 400 }
    );
  }

  if (targetUserId === session.userId) {
    return NextResponse.json(
      { error: "Vous ne pouvez pas chatter avec vous-même." },
      { status: 400 }
    );
  }

  // Si c'est avec Victoire, retourner immédiatement la conversation active
  if (targetUserId === "user_victoire_lome") {
    return NextResponse.json({
      conversation: {
        id: "conv_victoire_welcome",
        participantId: "user_victoire_lome",
        firstName: "Victoire",
        pseudo: "@victoire_lome",
        photoUrl: "/victoire_profile.jpg",
        lastMessage: "Coucou ! 👋 Ravie de faire ta connaissance sur Meet Me Club ! Comment s'est passée ta journée ? 😊",
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0,
        isOnline: true,
        isVerified: true,
      },
    });
  }

  // Tout utilisateur authentifie avec son Plan Gratuit ou superieur peut initier une conversation
  const senderProfile = getProfileByUserId(session.userId);
  const isIdVerified = Boolean(senderProfile?.idDocumentSubmitted || senderProfile?.idDocumentVerified);

  try {
    // Check if conversation already exists (in either direction)
    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { participantA: session.userId, participantB: targetUserId },
          { participantA: targetUserId, participantB: session.userId },
        ],
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          participantA: session.userId,
          participantB: targetUserId,
        },
      });
    }

    // Get partner info
    let partnerName = "Membre";
    let partnerPseudo = "@membre";
    let partnerPhotoUrl = "";

    try {
      const profile = await prisma.profile.findUnique({
        where: { userId: targetUserId },
        include: { photos: { where: { isMain: true }, take: 1 } },
      });
      if (profile) {
        partnerName = profile.firstName;
        partnerPseudo = profile.pseudo || profile.firstName;
        partnerPhotoUrl = profile.photos?.[0]?.url || "";
      }
    } catch {
      const localProfile = getProfileByUserId(targetUserId);
      if (localProfile) {
        partnerName = localProfile.firstName;
        partnerPseudo = localProfile.pseudo || localProfile.firstName;
        partnerPhotoUrl = localProfile.photos?.[0]?.url || "";
      }
    }

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        participantId: targetUserId,
        firstName: partnerName,
        pseudo: partnerPseudo,
        photoUrl: partnerPhotoUrl,
        lastMessage: "Nouvelle conversation",
        lastMessageAt: conversation.lastMessageAt.toISOString(),
        unreadCount: 0,
        isOnline: true,
        isVerified: true,
      },
    });
  } catch (error) {
    console.error("[POST /api/conversations]", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la conversation." },
      { status: 500 }
    );
  }
}
