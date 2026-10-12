// src/app/api/profiles/me/route.ts
// GET  /api/profiles/me — get current user's profile, plan & quota
// POST /api/profiles/me — create profile
// PATCH /api/profiles/me — update profile fields

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getProfileByUserId, saveProfile, PLAN_LIMITS } from "@/lib/db-store";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let profile = getProfileByUserId(session.userId);

  // If not created yet, look up in Prisma or create a default draft for this session
  if (!profile) {
    let dbUser: any = null;
    try {
      const { prisma } = await import("@/lib/prisma");
      dbUser = await prisma.user.findFirst({
        where: {
          OR: [
            { id: session.userId },
            ...(session.email ? [{ email: { equals: session.email, mode: "insensitive" as const } }] : []),
          ],
        },
        include: { profile: true },
      });
    } catch {}

    const fallbackFirstName = dbUser?.profile?.firstName || session.email?.split("@")[0] || "Nouveau Membre";
    const fallbackPseudo = dbUser?.profile?.pseudo || fallbackFirstName;

    profile = saveProfile({
      userId: session.userId,
      firstName: fallbackFirstName,
      pseudo: fallbackPseudo,
      phone: session.phone || undefined,
      gender: (dbUser?.profile?.gender as any) || "OTHER",
      city: dbUser?.profile?.city || "Lomé",
      age: 26,
      bio: dbUser?.profile?.bio || "Nouveau membre sur Meet Me Club à Lomé.",
      relationshipGoal: (dbUser?.profile?.relationshipGoal as any) || "SERIOUS",
      plan: "FREE",
      partnersContacted: [],
      photos: [
        { id: "p_init", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80", isMain: true }
      ],
      interests: ["Discussions", "Sorties"],
      availabilities: [{ dayOfWeek: 5, startTime: "18:00", endTime: "22:00" }],
      isVerified: true,
      isVisible: true,
    });
  }

  const planInfo = PLAN_LIMITS[profile.plan] || PLAN_LIMITS.FREE;

  return NextResponse.json({
    profile: {
      ...profile,
      planInfo,
      contactsRemaining: Math.max(0, (planInfo.maxPartners || 3) - (profile.partnersContacted?.length || 0)),
    },
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  try {
    const body = await request.json();
    const saved = saveProfile({
      ...body,
      userId: session.userId,
    });
    return NextResponse.json({ profile: saved }, { status: 201 });
  } catch (error) {
    console.error("[profiles/me POST]", error);
    return NextResponse.json({ error: "Erreur d'enregistrement du profil" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  try {
    const body = await request.json();
    const saved = saveProfile({
      ...body,
      userId: session.userId,
    });

    return NextResponse.json({ profile: saved });
  } catch (error) {
    console.error("[profiles/me PATCH]", error);
    return NextResponse.json({ error: "Erreur de mise à jour" }, { status: 500 });
  }
}
