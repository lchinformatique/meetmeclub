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
    let user: {
      id: string;
      email: string | null;
      role: "MEMBER" | "PARTNER" | "MODERATOR" | "ADMIN" | "SUPER_ADMIN";
      status:
        | "PENDING_VERIFICATION"
        | "ONBOARDING"
        | "ACTIVE"
        | "SUSPENDED"
        | "BANNED";
      googleId: string | null;
      profile: { firstName: string } | null;
    } | null = null;

    try {
      user = await prisma.user.findFirst({
        where: {
          OR: [{ email: cleanEmail }, { googleId: supabaseId }],
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

    // ── 2. Créer l'utilisateur s'il n'existe pas ───────────────────────────
    if (!user) {
      try {
        const firstName =
          (name as string)?.split(" ")[0]?.trim() ||
          cleanEmail.split("@")[0] ||
          "Membre";

        const newUser = await prisma.user.create({
          data: {
            email: cleanEmail,
            googleId: supabaseId,
            emailVerifiedAt: new Date(),
            dateOfBirth: new Date("2000-01-01"), // valeur par défaut — à mettre à jour en onboarding
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
              pseudo: `${firstName.toLowerCase()}_${Math.floor(100 + Math.random() * 900)}`,
              gender: "OTHER",
              city: "Lomé",
              bio: "Nouveau membre sur Meet Me Club à Lomé.",
              relationshipGoal: "SERIOUS",
              profileCompleteness: 40,
              isVisible: true,
            },
          });
        } catch (profErr) {
          console.warn("[google-callback] Profile creation warning:", profErr);
        }

        // Store local fallback
        saveProfile({
          userId: newUser.id,
          firstName,
          pseudo: firstName.toLowerCase(),
          gender: "OTHER",
          city: "Lomé",
          age: 25,
          dateOfBirth: "2000-01-01",
          bio: "Nouveau membre sur Meet Me Club à Lomé.",
          relationshipGoal: "SERIOUS",
          plan: "FREE",
          partnersContacted: [],
          photos: avatarUrl
            ? [{ id: `p_${newUser.id}`, url: avatarUrl as string, isMain: true }]
            : [],
          interests: [],
          availabilities: [],
          isVerified: true,
          isVisible: true,
        });

        user = {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          status: newUser.status,
          googleId: newUser.googleId,
          profile: { firstName },
        };
      } catch (createErr) {
        console.warn("[google-callback] User creation error:", createErr);
        // Fallback: créer un utilisateur virtuel si la DB est inaccessible
        user = {
          id: `google_${supabaseId}`,
          email: cleanEmail,
          role: "MEMBER",
          status: "ACTIVE",
          googleId: supabaseId,
          profile: null,
        };
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
      role: user.role,
      status: user.status,
      email: cleanEmail,
    });

    // ── 5. Déterminer la redirection ────────────────────────────────────────
    const redirect =
      user.status === "ONBOARDING" ? "/onboarding" : "/decouverte";

    return NextResponse.json({
      success: true,
      redirect,
      isNew: !user.profile,
    });
  } catch (error) {
    console.error("[POST /api/auth/google-callback]", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la connexion Google." },
      { status: 500 }
    );
  }
}
