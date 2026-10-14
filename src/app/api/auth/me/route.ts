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

    if (!user) {
      const { getProfileByUserId } = await import("@/lib/db-store");
      const local = getProfileByUserId(session.userId);
      if (local) {
        return NextResponse.json({
          authenticated: true,
          user: {
            id: local.userId,
            email: session.email || null,
            role: session.role || "MEMBER",
            status: session.status || "ACTIVE",
            firstName: local.firstName || "Membre",
            city: local.city || "Lomé",
            avatarUrl: local.photos?.find((p) => p.isMain)?.url || local.photos?.[0]?.url || null,
            subscriptionTier: local.plan || "FREE",
          },
        });
      }
      return NextResponse.json({ authenticated: false, user: null });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        firstName: user.profile?.firstName || user.email?.split("@")[0] || "Membre",
        city: user.profile?.city || "Lomé",
        avatarUrl: user.profile?.photos?.[0]?.url || null,
        subscriptionTier: "FREE",
      },
    });
  } catch (error) {
    console.error("Error in /api/auth/me:", error);
    return NextResponse.json({ authenticated: false, user: null });
  }
}
