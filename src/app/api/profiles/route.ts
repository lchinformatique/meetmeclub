// src/app/api/profiles/route.ts
// GET /api/profiles — Browse member profiles with filters (Discovery)

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getAllProfiles } from "@/lib/db-store";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const gender = searchParams.get("gender");
  const city = searchParams.get("city");
  const goal = searchParams.get("goal");

  try {
    // 1. Try to fetch live profiles from Supabase PostgreSQL
    try {
      const dbProfiles = await prisma.profile.findMany({
        where: {
          isVisible: true,
          userId: { not: session.userId },
          ...(gender && ["MALE", "FEMALE", "OTHER"].includes(gender) ? { gender: gender as any } : {}),
          ...(goal && ["FRIENDSHIP", "SERIOUS", "MARRIAGE", "CASUAL"].includes(goal) ? { relationshipGoal: goal as any } : {}),
          ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
        },
        include: {
          photos: { where: { status: "APPROVED" }, orderBy: { order: "asc" } },
          interests: { include: { interest: true } },
          verifications: { where: { status: "APPROVED" } },
          user: { select: { dateOfBirth: true, phoneVerifiedAt: true, emailVerifiedAt: true } },
        },
        orderBy: { updatedAt: "desc" },
      });

      if (dbProfiles && dbProfiles.length > 0) {
        const formatted = dbProfiles.map((p) => {
          let calculatedAge = 25;
          if (p.user?.dateOfBirth) {
            const birthDate = new Date(p.user.dateOfBirth);
            const now = new Date();
            calculatedAge = now.getFullYear() - birthDate.getFullYear();
          }
          return {
            id: p.id,
            userId: p.userId,
            firstName: p.firstName,
            pseudo: p.pseudo || p.firstName,
            gender: p.gender,
            city: p.city,
            neighborhood: p.neighborhood || "Lomé",
            profession: p.profession,
            bio: p.bio,
            relationshipGoal: p.relationshipGoal,
            plan: "FREE",
            profileCompleteness: p.profileCompleteness || 90,
            photos: p.photos.map((ph) => ({ url: ph.url, isMain: ph.isMain })),
            interests: p.interests.map((pi) => ({ interest: { name: pi.interest.name, icon: pi.interest.icon || "✨" } })),
            verifications: p.verifications.map((v) => ({ type: v.type })),
            user: p.user,
            age: calculatedAge,
          };
        });

        return NextResponse.json({ profiles: formatted });
      }
    } catch (dbErr) {
      console.warn("[GET /api/profiles] Supabase query fallback to local store:", dbErr);
    }

    // 2. Fallback to local store
    let profiles = getAllProfiles().filter((p) => p.isVisible && p.userId !== session.userId);

    if (gender && ["MALE", "FEMALE", "OTHER"].includes(gender)) {
      profiles = profiles.filter((p) => p.gender === gender);
    }
    if (city) {
      profiles = profiles.filter((p) => p.city.toLowerCase().includes(city.toLowerCase()));
    }
    if (goal) {
      profiles = profiles.filter((p) => p.relationshipGoal === goal);
    }

    const formatted = profiles.map((p) => ({
      id: p.id,
      userId: p.userId,
      firstName: p.firstName,
      pseudo: p.pseudo || p.firstName,
      gender: p.gender,
      city: p.city,
      neighborhood: p.neighborhood || "Lomé",
      profession: p.profession,
      bio: p.bio,
      relationshipGoal: p.relationshipGoal,
      plan: p.plan,
      profileCompleteness: 90,
      photos: p.photos.map((ph) => ({ url: ph.url, isMain: ph.isMain })),
      interests: p.interests.map((name) => ({ interest: { name, icon: "✨" } })),
      verifications: p.isVerified ? [{ type: "PHONE" }, { type: "SELFIE" }] : [],
      user: {
        dateOfBirth: new Date(Date.now() - p.age * 365.25 * 24 * 3600 * 1000).toISOString(),
        phoneVerifiedAt: new Date().toISOString(),
      },
    }));

    return NextResponse.json({ profiles: formatted });
  } catch (error) {
    console.error("[GET /api/profiles] Error:", error);
    return NextResponse.json({ profiles: [] });
  }
}
