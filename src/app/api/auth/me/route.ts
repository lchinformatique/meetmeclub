// src/app/api/auth/me/route.ts
// Returns the currently logged-in user and basic profile info

import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        profile: {
          select: {
            firstName: true,
            city: true,
            gender: true,
            photos: {
              where: { isMain: true },
              take: 1,
              select: { url: true },
            },
          },
        },
      },
    });

    const { getProfileByUserId } = await import("@/lib/db-store");
    const local = getProfileByUserId(session.userId);

    const resolvedFirstName = local?.firstName || user?.profile?.firstName || session.email?.split("@")[0] || "Membre";
    const resolvedCity = local?.city || user?.profile?.city || "Lomé";
    const resolvedAvatar = local?.photos?.find((p) => p.isMain)?.url || local?.photos?.[0]?.url || user?.profile?.photos?.[0]?.url || null;
    const resolvedPlan = local?.plan || "FREE";

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.userId,
        email: user?.email || session.email || null,
        role: user?.role || session.role || "MEMBER",
        status: user?.status || session.status || "ACTIVE",
        firstName: resolvedFirstName,
        city: resolvedCity,
        avatarUrl: resolvedAvatar,
        subscriptionTier: resolvedPlan,
      },
    });
  } catch (error) {
    console.error("Error in /api/auth/me:", error);
    return NextResponse.json({ authenticated: false, user: null });
  }
}
