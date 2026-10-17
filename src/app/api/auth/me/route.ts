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

    let user: any = null;
    try {
      user = await prisma.user.findUnique({
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
    } catch (dbErr) {
      console.warn("Prisma lookup in /api/auth/me non-fatal warning:", dbErr);
    }

    const { getProfileByUserId } = await import("@/lib/db-store");
    let local = getProfileByUserId(session.userId);

    // If local store does not have it, try Supabase REST
    if (!local) {
      try {
        const { getProfileFromSupabase } = await import("@/lib/supabase-server");
        const supa = await getProfileFromSupabase(session.userId);
        if (supa) {
          const { saveProfile } = await import("@/lib/db-store");
          local = saveProfile({
            userId: session.userId,
            firstName: supa.firstName || "Membre",
            pseudo: supa.pseudo || undefined,
            email: session.email || undefined,
            city: supa.city || "",
            gender: (supa.gender as any) || "OTHER",
            plan: (supa.plan as any) || "FREE",
            subscriptionStartedAt: supa.subscriptionStartedAt || undefined,
            subscriptionExpiresAt: supa.subscriptionExpiresAt || undefined,
            photos: (supa.photos || []).map((ph: any) => ({ id: ph.id, url: ph.url, isMain: ph.isMain })),
            bio: supa.bio || "Membre Meet Me Club.",
            relationshipGoal: (supa.relationshipGoal as any) || "SERIOUS",
            isVerified: supa.isVerified ?? true,
            isVisible: true,
          });
        }
      } catch (supaErr) {
        console.warn("Supabase lookup in /api/auth/me non-fatal warning:", supaErr);
      }
    }

    let resolvedFirstName = local?.firstName || user?.profile?.firstName || session.email?.split("@")[0] || "Membre";
    if (resolvedFirstName.startsWith("google_")) {
      resolvedFirstName = "Membre";
    }
    const resolvedCity = local?.city || user?.profile?.city || "";
    const validPhoto =
      local?.photos?.find((p) => p.isMain && !p.url.includes("dicebear.com/7.x/initials"))?.url ||
      local?.photos?.find((p) => !p.url.includes("dicebear.com/7.x/initials"))?.url ||
      user?.profile?.photos?.find((p: any) => p.isMain && !p.url.includes("dicebear.com/7.x/initials"))?.url ||
      user?.profile?.photos?.[0]?.url ||
      null;
    const resolvedAvatar = validPhoto && !validPhoto.includes("dicebear.com/7.x/initials") ? validPhoto : null;
    const resolvedPlan = local?.plan || "FREE";
    // Seul l'administrateur voit l'espace de gestion (menu « Admin »)
    const { isAdminSession } = await import("@/lib/admin-auth");
    const isAdmin = await isAdminSession(session);

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
        isAdmin,
      },
    });
  } catch (error) {
    console.error("Error in /api/auth/me:", error);
    return NextResponse.json({ authenticated: false, user: null });
  }
}
