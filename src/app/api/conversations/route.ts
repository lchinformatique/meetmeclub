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
          // Fallback to local store or Supabase
          const localProfile = getProfileByUserId(partnerId);
          if (localProfile) {
            partnerName = localProfile.firstName;
            partnerPseudo = localProfile.pseudo || localProfile.firstName;
            partnerPhotoUrl = localProfile.photos?.[0]?.url || "";
            isVerified = localProfile.isVerified;
          } else {
            try {
              const { getProfileFromSupabase } = await import("@/lib/supabase-server");
              const supa = await getProfileFromSupabase(partnerId);
              if (supa) {
                partnerName = supa.firstName || partnerName;
                partnerPseudo = supa.pseudo || supa.firstName || partnerPseudo;
                partnerPhotoUrl = supa.avatarUrl || supa.photos?.[0]?.url || "";
                isVerified = true;
              }
            } catch {}
          }
        }

        if (partnerName === "Membre" || !partnerPhotoUrl) {
          const localProfile = getProfileByUserId(partnerId);
          if (localProfile) {
            partnerName = localProfile.firstName || partnerName;
            partnerPseudo = localProfile.pseudo || partnerPseudo;
            partnerPhotoUrl = partnerPhotoUrl || localProfile.photos?.find((p) => p.isMain)?.url || localProfile.photos?.[0]?.url || "";
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
          lastMessageSenderId: lastMsg?.senderId,
          lastMessageStatus: lastMsg?.status,
          unreadCount,
          isOnline: false,
          isVerified,
        };
      })
    );

    return NextResponse.json({ conversations: enriched });
  } catch (error) {
    console.warn("[GET /api/conversations] DB fallback to Supabase and db-store:", error);
    try {
      const { getConversationsFromSupabase } = await import("@/lib/supabase-server");
      const { getConversationsForUser } = await import("@/lib/db-store");

      const supaConvs = await getConversationsFromSupabase(session.userId);
      const localConvs = getConversationsForUser(session.userId);

      const { getUnreadCounts } = await import("@/lib/messaging-server");
      const { getProfileFromSupabase, getMessagesFromSupabase } = await import("@/lib/supabase-server");
      const unread = await getUnreadCounts(session.userId).catch(() => ({} as Record<string, number>));

      const allCombined = [...supaConvs, ...localConvs];
      const seenIds = new Set<string>();
      const result: any[] = [];

      for (const conv of allCombined) {
        if (!conv.id || seenIds.has(conv.id)) continue;
        seenIds.add(conv.id);
        const partnerId = conv.participantA === session.userId ? conv.participantB : conv.participantA;
        const p = getProfileByUserId(partnerId);
        const supa = !p || !p.photos?.length ? await getProfileFromSupabase(partnerId).catch(() => null) : null;
        const last = !conv.lastMessage ? (await getMessagesFromSupabase(conv.id, 1).catch(() => []))[0] : null;
        result.push({
          id: conv.id,
          participantId: partnerId,
          firstName: p?.firstName || supa?.firstName || "Membre",
          pseudo: p?.pseudo || supa?.pseudo || "@membre",
          photoUrl: p?.photos?.find((ph) => ph.isMain)?.url || p?.photos?.[0]?.url || supa?.avatarUrl || "",
          lastMessage: conv.lastMessage || last?.body || "Nouvelle conversation",
          lastMessageAt: conv.lastMessageAt || last?.createdAt || new Date().toISOString(),
          lastMessageSenderId: last?.senderId,
          unreadCount: unread[conv.id] || 0,
          isOnline: false,
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


  // Plan gratuit : 3 interlocuteurs maximum (hors Victoire, l'hôtesse du club)
  if (targetUserId !== "user_victoire_lome") {
    try {
      const { getEffectivePlan } = await import("@/lib/db-store");
      const { getSupabaseAdmin, getProfileFromSupabase } = await import("@/lib/supabase-server");
      let me: any = getProfileByUserId(session.userId);
      if (!me?.plan || me.plan === "FREE") {
        const supaMe = await getProfileFromSupabase(session.userId, session.email || undefined);
        if (supaMe) me = { ...me, ...supaMe, userId: session.userId, email: session.email };
      }
      if (getEffectivePlan(me || { userId: session.userId, email: session.email }) === "FREE") {
        const { data: convs } = await getSupabaseAdmin()
          .from("conversations")
          .select("participantA, participantB")
          .or(`participantA.eq.${session.userId},participantB.eq.${session.userId}`);
        const partners = new Set(
          (convs || [])
            .map((c: any) => (c.participantA === session.userId ? c.participantB : c.participantA))
            .filter((id: string) => id !== "user_victoire_lome")
        );
        if (!partners.has(targetUserId) && partners.size >= 3) {
          return NextResponse.json(
            { error: "Plan gratuit : 3 discussions maximum. Passez à un pass pour en ouvrir d'autres." },
            { status: 403 }
          );
        }
      }
    } catch (quotaErr) {
      console.warn("[POST /api/conversations] quota check:", quotaErr);
    }
  }

  // Obtenir infos partenaire
  const localProfile = getProfileByUserId(targetUserId);
  let partnerName = localProfile?.firstName || "Membre";
  let partnerPseudo = localProfile?.pseudo || localProfile?.firstName || "@membre";
  let partnerPhotoUrl = localProfile?.photos?.[0]?.url || "";

  if (!localProfile || !partnerPhotoUrl) {
    try {
      const { getProfileFromSupabase } = await import("@/lib/supabase-server");
      const supaPartner = await getProfileFromSupabase(targetUserId);
      if (supaPartner) {
        if (supaPartner.firstName) partnerName = supaPartner.firstName;
        if (supaPartner.pseudo || supaPartner.firstName) partnerPseudo = supaPartner.pseudo || supaPartner.firstName;
        if (supaPartner.avatarUrl || supaPartner.photos?.[0]?.url) {
          partnerPhotoUrl = supaPartner.avatarUrl || supaPartner.photos?.[0]?.url || partnerPhotoUrl;
        }
      }
    } catch {}
  }

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

