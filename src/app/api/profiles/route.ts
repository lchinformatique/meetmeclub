// src/app/api/profiles/route.ts
// GET /api/profiles — Membres visibles (Découverte, messagerie)
// Source de vérité : Supabase (plan réel, photos, âge), complétée par Prisma puis le store local.
// Règles de visibilité par plan + classement (VIP en tête, puis likes).

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  canViewMember,
  getAllProfiles,
  getEffectivePlan,
  getProfileByUserId,
  isAccessExpired,
  sortProfilesByPriorityAndLikes,
} from "@/lib/db-store";
import { prisma } from "@/lib/prisma";
import { asAssistant } from "@/lib/victoire-bot";

export const dynamic = "force-dynamic";

const VICTOIRE_ID = "user_victoire_lome";

function fromLocal(p: ReturnType<typeof getAllProfiles>[number]) {
  return {
    id: p.id,
    userId: p.userId,
    firstName: p.firstName,
    pseudo: p.pseudo || p.firstName,
    gender: p.gender,
    city: p.city,
    country: (p as any).country,
    profession: p.profession,
    bio: p.bio,
    coverUrl: p.coverUrl,
    relationshipGoal: p.relationshipGoal,
    plan: getEffectivePlan(p),
    likesCount: p.likesCount ?? 0,
    profileCompleteness: 90,
    photos: (p.photos || []).map((ph) => ({ url: ph.url, isMain: ph.isMain })),
    interests: (p.interests || []).map((name) => ({ interest: { name, icon: "✨" } })),
    verifications: p.isVerified ? [{ type: "PHONE" }, { type: "SELFIE" }] : [],
    age: p.age,
    isVerified: p.isVerified,
  };
}

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
    // 1. Plan réel du membre connecté (Supabase fait foi, le store local peut être périmé)
    let viewerSource: any = getProfileByUserId(session.userId);
    try {
      const { getProfileFromSupabase } = await import("@/lib/supabase-server");
      const supaMe = await getProfileFromSupabase(session.userId, session.email || undefined);
      if (supaMe) viewerSource = { ...viewerSource, ...supaMe, userId: session.userId, email: session.email || supaMe.email };
    } catch {}
    const viewerPlan = getEffectivePlan(viewerSource || { userId: session.userId, email: session.email });

    // Essai de 3 jours terminé (ou pass expiré) : la liste des membres demande un pass payant
    if (viewerSource && isAccessExpired({ ...viewerSource, userId: session.userId, email: session.email })) {
      return NextResponse.json({ profiles: [], viewerPlan, accessExpired: true });
    }

    // 2. Membres : Supabase REST d'abord
    let profiles: any[] = [];
    try {
      const { getPublicProfilesFromSupabase } = await import("@/lib/supabase-server");
      const supa = await getPublicProfilesFromSupabase(session.userId);
      profiles = supa.map((p: any) => ({ ...p, plan: getEffectivePlan(p) }));
    } catch (supaErr) {
      console.warn("[GET /api/profiles] Supabase:", supaErr);
    }

    // 3. Secours Prisma si Supabase ne répond pas
    if (profiles.length === 0) {
      try {
        const dbProfiles = await prisma.profile.findMany({
          where: { isVisible: true, userId: { not: session.userId } },
          include: {
            photos: { orderBy: { order: "asc" } },
            user: { select: { dateOfBirth: true } },
          },
          orderBy: { updatedAt: "desc" },
        });
        profiles = dbProfiles.map((p) => {
          const local = getProfileByUserId(p.userId);
          let age: number | undefined;
          if (p.user?.dateOfBirth) {
            const dob = new Date(p.user.dateOfBirth);
            const now = new Date();
            age = now.getFullYear() - dob.getFullYear() - (now < new Date(now.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
          }
          return {
            id: p.id,
            userId: p.userId,
            firstName: p.firstName,
            pseudo: p.pseudo || p.firstName,
            gender: p.gender,
            city: p.city,
            country: (p as any).country,
            profession: p.profession,
            bio: p.bio,
            relationshipGoal: p.relationshipGoal,
            plan: getEffectivePlan(local),
            likesCount: local?.likesCount ?? 0,
            photos: p.photos.filter((ph) => ph.status !== ("COVER" as any)).map((ph) => ({ url: ph.url, isMain: ph.isMain })),
            age: age ?? local?.age,
            isVerified: true,
          };
        });
      } catch (dbErr) {
        console.warn("[GET /api/profiles] Prisma:", dbErr);
      }
    }

    // 4. Membres connus uniquement de ce serveur
    const known = new Set(profiles.map((p) => p.userId));
    const extraLocal = getAllProfiles()
      .filter((lp) => lp.isVisible && lp.userId !== session.userId && !known.has(lp.userId))
      .map(fromLocal);
    profiles = [...profiles, ...extraLocal];

    // 4.b Membres vérifiés (ou nouveaux dans leurs 3 jours d'essai) uniquement.
    let strict: Set<string> | null = null;
    //     Victoire est l'assistante automatique du club : jamais présentée comme membre vérifiée.
    try {
      const { getApprovedUserIds, getStrictlyVerifiedUserIds } = await import("@/lib/verification");
      const approved = await getApprovedUserIds();
      if (approved) profiles = profiles.filter((p) => approved.has(p.userId));
      strict = await getStrictlyVerifiedUserIds();
    } catch (verifErr) {
      console.warn("[GET /api/profiles] Vérification:", verifErr);
      profiles = profiles.filter((p) => p.userId === VICTOIRE_ID);
    }
    profiles = profiles.map((p) =>
      p.userId === VICTOIRE_ID
        ? asAssistant(p)
        : strict && !strict.has(p.userId)
        ? { ...p, isVerified: false, verifications: [] }
        : { ...p, isVerified: true, verifications: [{ type: "SELFIE" }] }
    );

    // 5. Filtres de recherche
    if (gender && ["MALE", "FEMALE", "OTHER"].includes(gender)) profiles = profiles.filter((p) => p.gender === gender);
    if (city) profiles = profiles.filter((p) => p.city?.toLowerCase().includes(city.toLowerCase()));
    if (goal) profiles = profiles.filter((p) => p.relationshipGoal === goal);

    // 6. Visibilité selon le plan (Victoire, l'hôtesse du club, reste visible de tous)
    const visible = profiles.filter((p) => p.userId === VICTOIRE_ID || canViewMember(viewerPlan, p.plan));

    return NextResponse.json({ profiles: sortProfilesByPriorityAndLikes(visible), viewerPlan });
  } catch (error) {
    console.error("[GET /api/profiles] Error:", error);
    return NextResponse.json({ profiles: [] });
  }
}
