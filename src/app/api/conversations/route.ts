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

    // Conversation d'accueil avec Victoire
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
        lastMessage: "En ligne à Lomé · Écrivez-lui pour faire connaissance",
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0,
        isOnline: true,
        isVerified: true,
      });
    }

    return NextResponse.json({ conversations: enriched });
  } catch (error) {
    console.warn("[GET /api/conversations] DB fallback to Supabase and db-store:", error);
    try {
      const { getConversationsFromSupabase } = await import("@/lib/supabase-server");
      const { getConversationsForUser } = await import("@/lib/db-store");

      const supaConvs = await getConversationsFromSupabase(session.userId);
      const localConvs = getConversationsForUser(session.userId);

      const allCombined = [...supaConvs, ...localConvs];
      const seenIds = new Set<string>();
      const result: any[] = [];

      for (const conv of allCombined) {
        if (!conv.id || seenIds.has(conv.id)) continue;
        seenIds.add(conv.id);
        const partnerId = conv.participantA === session.userId ? conv.participantB : conv.participantA;
        const p = getProfileByUserId(partnerId);
        result.push({
          id: conv.id,
          participantId: partnerId,
          firstName: p?.firstName || "Membre",
          pseudo: p?.pseudo || "@membre",
          photoUrl: p?.photos?.[0]?.url || "",
          lastMessage: conv.lastMessage || "Nouvelle conversation",
          lastMessageAt: conv.lastMessageAt || new Date().toISOString(),
          unreadCount: 0,
          isOnline: true,
          isVerified: p?.isVerified ?? true,
        });
      }

      if (!result.some((c) => c.participantId === "user_victoire_lome")) {
        result.unshift({
          id: "conv_victoire_welcome",
          participantId: "user_victoire_lome",
          firstName: "Victoire",
          pseudo: "@victoire_lome",
          photoUrl: "/victoire_profile.jpg",
          lastMessage: "En ligne à Lomé · Écrivez-lui pour faire connaissance",
          lastMessageAt: new Date().toISOString(),
          unreadCount: 0,
          isOnline: true,
          isVerified: true,
        });
      }

      return NextResponse.json({ conversations: result });
    } catch {
      return NextResponse.json({
        conversations: [
          {
            id: "conv_victoire_welcome",
            participantId: "user_victoire_lome",
            firstName: "Victoire",
            pseudo: "@victoire_lome",
            photoUrl: "/victoire_profile.jpg",
            lastMessage: "En ligne à Lomé · Écrivez-lui pour faire connaissance",
            lastMessageAt: new Date().toISOString(),
            unreadCount: 0,
            isOnline: true,
            isVerified: true,
          },
        ],
      });
    }
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
        lastMessage: "En ligne à Lomé · Écrivez-lui pour faire connaissance",
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0,
        isOnline: true,
        isVerified: true,
      },
    });
  }

  // Obtenir infos partenaire
  const localProfile = getProfileByUserId(targetUserId);
  const partnerName = localProfile?.firstName || "Membre";
  const partnerPseudo = localProfile?.pseudo || localProfile?.firstName || "@membre";
  const partnerPhotoUrl = localProfile?.photos?.[0]?.url || "";

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

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        participantId: targetUserId,
        firstName: partnerName,
        pseudo: partnerPseudo,
        photoUrl: partnerPhotoUrl,
        lastMessage: "Nouvelle conversation",
        lastMessageAt: conversation.lastMessageAt ? new Date(conversation.lastMessageAt).toISOString() : new Date().toISOString(),
        unreadCount: 0,
        isOnline: true,
        isVerified: true,
      },
    });
  } catch (error) {
    console.warn("[POST /api/conversations] Prisma fallback to Supabase and db-store:", error);
    try {
      const { findOrCreateConversationInSupabase } = await import("@/lib/supabase-server");
      const { saveConversation } = await import("@/lib/db-store");

      const supaConv = await findOrCreateConversationInSupabase(session.userId, targetUserId);
      const convId = supaConv?.id || `conv_${Date.now()}`;

      saveConversation({
        id: convId,
        participantA: session.userId,
        participantB: targetUserId,
        lastMessage: "Nouvelle conversation",
        lastMessageAt: new Date().toISOString(),
      });

      return NextResponse.json({
        conversation: {
          id: convId,
          participantId: targetUserId,
          firstName: partnerName,
          pseudo: partnerPseudo,
          photoUrl: partnerPhotoUrl,
          lastMessage: "Nouvelle conversation",
          lastMessageAt: new Date().toISOString(),
          unreadCount: 0,
          isOnline: true,
          isVerified: true,
        },
      });
    } catch (e2) {
      const fallbackId = `local_${targetUserId}`;
      return NextResponse.json({
        conversation: {
          id: fallbackId,
          participantId: targetUserId,
          firstName: partnerName,
          pseudo: partnerPseudo,
          photoUrl: partnerPhotoUrl,
          lastMessage: "Nouvelle conversation",
          lastMessageAt: new Date().toISOString(),
          unreadCount: 0,
          isOnline: true,
          isVerified: true,
        },
      });
    }
  }
}

