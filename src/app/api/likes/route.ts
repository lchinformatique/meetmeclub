// src/app/api/likes/route.ts
// POST /api/likes — like a profile (creates a match if mutual)
// GET  /api/likes — list profiles that liked you

import { NextRequest, NextResponse, after } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isMemberVerified, NOT_VERIFIED_ERROR } from "@/lib/verification";

export const dynamic = "force-dynamic";

// ── GET: who liked me ────────────────────────────────────────
export async function GET() {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const likes = await (prisma as any).like.findMany({
      where: { toUserId: session.userId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ likes });
  } catch {
    return NextResponse.json({ likes: [] });
  }
}

// ── POST: like a profile ─────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (!(await isMemberVerified(session.userId))) {
    return NextResponse.json(NOT_VERIFIED_ERROR, { status: 403 });
  }

  const body = await req.json();
  const { toUserId } = body;

  if (!toUserId || typeof toUserId !== "string") {
    return NextResponse.json({ error: "toUserId est requis" }, { status: 400 });
  }
  if (toUserId === session.userId) {
    return NextResponse.json({ error: "Vous ne pouvez pas vous liker vous-même" }, { status: 400 });
  }

  try {
    // Nouveau like ? (pour ne prévenir le membre qu'une seule fois)
    const already = await (prisma as any).like
      .findUnique({ where: { fromUserId_toUserId: { fromUserId: session.userId, toUserId } } })
      .catch(() => null);

    // Upsert the like (idempotent)
    await (prisma as any).like.upsert({
      where: {
        fromUserId_toUserId: {
          fromUserId: session.userId,
          toUserId,
        },
      },
      update: {},
      create: {
        fromUserId: session.userId,
        toUserId,
      },
    });

    // Check for mutual like → create match
    const mutualLike = await (prisma as any).like.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId: toUserId,
          toUserId: session.userId,
        },
      },
    });

    let isMatch = false;
    if (mutualLike) {
      // Create match (idempotent using canonical ordering of user IDs)
      const [userA, userB] =
        session.userId < toUserId
          ? [session.userId, toUserId]
          : [toUserId, session.userId];

      await (prisma as any).match.upsert({
        where: { userAId_userBId: { userAId: userA, userBId: userB } },
        update: {},
        create: { userAId: userA, userBId: userB },
      });

      isMatch = true;
    }

    if (!already) {
      after(async () => {
        try {
          const { getProfileByUserId } = await import("@/lib/db-store");
          const { getSupabaseAdmin, getProfileFromSupabase } = await import("@/lib/supabase-server");
          const { broadcastToUser } = await import("@/lib/realtime-server");
          const { sendPushToUser } = await import("@/lib/push-server");
          const me = getProfileByUserId(session.userId) || (await getProfileFromSupabase(session.userId));
          const name = me?.firstName || "Un membre";

          // Compteur de likes affiché sur le profil
          const admin = getSupabaseAdmin();
          const { data: target } = await admin.from("profiles").select("id, likesCount").eq("userId", toUserId).maybeSingle();
          if (target) await admin.from("profiles").update({ likesCount: (target.likesCount || 0) + 1 }).eq("id", target.id);

          await Promise.allSettled([
            broadcastToUser(toUserId, "like", { fromUserId: session.userId, fromName: name, isMatch }),
            sendPushToUser(toUserId, {
              kind: "message",
              title: isMatch ? "💞 C'est réciproque !" : "❤️ Nouveau like",
              body: isMatch
                ? `${name} et vous vous plaisez mutuellement. Écrivez-lui !`
                : `${name} a aimé votre profil.`,
              url: isMatch ? `/messages?contact=${encodeURIComponent(session.userId)}` : "/decouverte",
              tag: `like-${session.userId}`,
            }),
          ]);
        } catch (e) {
          console.warn("[likes] notification", e);
        }
      });
    }

    return NextResponse.json({ liked: true, isMatch }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/likes]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
