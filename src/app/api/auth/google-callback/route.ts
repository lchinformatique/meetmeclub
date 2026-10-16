// src/app/api/auth/google-callback/route.ts
// Synchronise un utilisateur Google OAuth (Supabase) avec notre base Prisma
// Crée ou récupère le profil, pose le cookie JWT de session, et retourne la redirection

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/session";
import { saveProfile } from "@/lib/db-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { supabaseId, email, name, avatarUrl } = body;

    if (!supabaseId || !email) {
      return NextResponse.json(
        { error: "Données Google manquantes (supabaseId ou email)." },
        { status: 400 }
      );
    }

    const cleanEmail = (email as string).toLowerCase().trim();

    // ── 1. Chercher un utilisateur existant par email ou googleId ──────────
    let user: any = null;

    try {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: { equals: cleanEmail, mode: "insensitive" } },
            { googleId: supabaseId },
          ],
        },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          googleId: true,
          profile: { select: { firstName: true } },
        },
      });
    } catch (dbErr) {
      console.warn("[google-callback] DB lookup error:", dbErr);
    }

    const firstName =
      (name as string)?.split(" ")[0]?.trim() ||
      cleanEmail.split("@")[0] ||
      "Membre";

    const emailPrefix = cleanEmail.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
    const cleanPseudo = (name as string)?.trim().replace(/\s+/g, "_").toLowerCase() || emailPrefix;

    // ── 2. Créer l'utilisateur s'il n'existe pas ───────────────────────────
    if (!user) {
      try {
        const newUser = await prisma.user.create({
          data: {
            email: cleanEmail,
            googleId: supabaseId,
            emailVerifiedAt: new Date(),
            dateOfBirth: new Date("2000-01-01"),
            isAdult: true,
            status: "ACTIVE",
            role: "MEMBER",
          },
        });

        // Créer le profil initial
        try {
          await prisma.profile.create({
            data: {
              userId: newUser.id,
              firstName,
              pseudo: cleanPseudo,
              gender: "OTHER",
              city: "Lomé",
              bio: "Nouveau membre sur Meet Me Club à Lomé.",
              relationshipGoal: "SERIOUS",
              profileCompleteness: 50,
              isVisible: true,
            },
          });
        } catch (profErr) {
          console.warn("[google-callback] Profile creation warning:", profErr);
        }

        user = {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          status: newUser.status,
          googleId: newUser.googleId,
          profile: { firstName, pseudo: cleanPseudo },
        };
      } catch (createErr) {
        console.warn("[google-callback] User creation error, checking existing:", createErr);
        // If create failed (e.g. user already existed), try finding again
        try {
          user = await prisma.user.findFirst({
            where: { email: { equals: cleanEmail, mode: "insensitive" } },
            select: {
              id: true,
              email: true,
              role: true,
              status: true,
              googleId: true,
              profile: { select: { firstName: true, pseudo: true } },
            },
          });
        } catch {}

        if (!user) {
          // Fallback utilisateur virtuel
          user = {
            id: `google_${supabaseId.replace(/[^a-zA-Z0-9_-]/g, "")}`,
            email: cleanEmail,
            role: "MEMBER",
            status: "ACTIVE",
            googleId: supabaseId,
            profile: { firstName, pseudo: cleanPseudo },
          };
        }
      }
    } else {
      // ── 3. Mettre à jour le googleId si l'utilisateur existe déjà ─────────
      if (!user.googleId) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { googleId: supabaseId, emailVerifiedAt: new Date() },
          });
        } catch (updateErr) {
          console.warn("[google-callback] Update googleId error:", updateErr);
        }
      }
    }

    // Déterminer la photo de profil réelle (photo de profil du compte si fournie)
    const finalAvatar = (avatarUrl as string) || null;

    // ── 3. Synchronisation Supabase REST intelligente ───────────────────────
    // Ne jamais écraser un profil existant avec des valeurs par défaut !
    let currentProfile: any = null;
    try {
      const { getProfileFromSupabase, upsertProfileInSupabase, savePhotoInSupabase } = await import("@/lib/supabase-server");
      
      // Chercher d'abord avec user.id puis avec supabaseId
      currentProfile = await getProfileFromSupabase(user.id);
      if (!currentProfile && supabaseId !== user.id) {
        currentProfile = await getProfileFromSupabase(supabaseId);
      }

      if (!currentProfile) {
        // Premier enregistrement uniquement : création du profil initial
        await upsertProfileInSupabase(user.id, {
          firstName,
          pseudo: cleanPseudo,
          gender: "OTHER",
          city: "Lomé",
          bio: "Nouveau membre sur Meet Me Club à Lomé.",
          relationshipGoal: "SERIOUS",
          avatarUrl: finalAvatar || undefined,
        });
        if (finalAvatar) {
          await savePhotoInSupabase(user.id, finalAvatar, true);
        }
      }
    } catch (supaErr) {
      console.warn("[google-callback] Supabase REST sync warning:", supaErr);
    }

    // Sauvegarde / synchronisation store local sans écraser les données réelles
    try {
      saveProfile({
        userId: user.id,
        firstName: currentProfile?.firstName || firstName,
        lastName: currentProfile?.lastName || undefined,
        pseudo: currentProfile?.pseudo || cleanPseudo,
        email: cleanEmail,
        gender: currentProfile?.gender || "OTHER",
        city: currentProfile?.city || "Lomé",
        neighborhood: currentProfile?.neighborhood || undefined,
        profession: currentProfile?.profession || undefined,
        relationshipStatus: currentProfile?.relationshipStatus || "Célibataire",
        hasChildren: currentProfile?.hasChildren ?? false,
        religion: currentProfile?.religion || undefined,
        height: currentProfile?.height || null,
        languages: currentProfile?.languages || ["fr", "en"],
        age: currentProfile?.age || 25,
        dateOfBirth: currentProfile?.dateOfBirth || "2000-01-01",
        placeOfBirth: currentProfile?.placeOfBirth || undefined,
        bio: currentProfile?.bio || "Nouveau membre sur Meet Me Club à Lomé.",
        relationshipGoal: currentProfile?.relationshipGoal || "SERIOUS",
        plan: currentProfile?.plan || "FREE",
        partnersContacted: currentProfile?.partnersContacted || [],
        photos: (currentProfile?.photos && currentProfile.photos.length > 0)
          ? currentProfile.photos
          : [{ id: `p_${user.id}`, url: finalAvatar, isMain: true }],
        coverUrl: currentProfile?.coverUrl || undefined,
        interests: currentProfile?.interests || ["Discussions", "Sorties"],
        availabilities: currentProfile?.availabilities || [{ dayOfWeek: 5, startTime: "18:00", endTime: "22:00" }],
        isVerified: true,
        isVisible: true,
      });
    } catch (saveErr) {
      console.warn("[google-callback] saveProfile non-fatal warning:", saveErr);
    }

    // Vérification compte suspendu/banni
    if (user.status === "BANNED" || user.status === "SUSPENDED") {
      return NextResponse.json(
        { error: "Votre compte a été suspendu. Contactez le support." },
        { status: 403 }
      );
    }

    // ── 4. Créer la session JWT ────────────────────────────────────────────
    await setSessionCookie({
      userId: user.id,
      role: user.role || "MEMBER",
      status: user.status || "ACTIVE",
      email: cleanEmail,
    });

    // ── 5. Déterminer la redirection ────────────────────────────────────────
    return NextResponse.json({
      success: true,
      redirect: "/profil?welcome=1",
      isNew: !user.profile,
    });
  } catch (error) {
    console.error("[POST /api/auth/google-callback]", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la connexion Google. Veuillez réessayer." },
      { status: 500 }
    );
  }
}
