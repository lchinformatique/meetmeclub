// src/app/api/auth/register/route.ts
// Direct registration via Email — No OTP required

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/session";
import { saveProfile } from "@/lib/db-store";

function isAdult(dateOfBirth: Date): boolean {
  const today = new Date();
  const eighteenYearsAgo = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate()
  );
  return dateOfBirth <= eighteenYearsAgo;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, dateOfBirth, firstName, pseudo, gender } = body;

    // 1. Validation de base
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Veuillez entrer une adresse e-mail valide." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // 2. Vérification de l'âge (18+ obligatoire)
    if (!dateOfBirth) {
      return NextResponse.json(
        { error: "La date de naissance est obligatoire pour valider votre majorité (18+)." },
        { status: 400 }
      );
    }

    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime()) || !isAdult(dob)) {
      return NextResponse.json(
        { error: "Désolé, Meet Me Club est réservé exclusivement aux adultes de 18 ans et plus. 🔞" },
        { status: 403 }
      );
    }

    // 3. Mot de passe (min 6 caractères)
    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Le mot de passe doit comporter au moins 6 caractères." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const resolvedName = (firstName && firstName.trim()) || cleanEmail.split("@")[0];
    const resolvedPseudo = (pseudo && pseudo.trim()) || resolvedName;
    const resolvedGender = gender && ["MALE", "FEMALE", "OTHER"].includes(gender) ? gender : "OTHER";

    let user: any = null;

    // 4. Tentative de création dans Supabase
    try {
      const existing = await prisma.user.findFirst({
        where: { email: cleanEmail },
      });

      if (existing) {
        return NextResponse.json(
          { error: "Un compte existe déjà avec cette adresse email. Veuillez vous connecter." },
          { status: 409 }
        );
      }

      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          passwordHash,
          emailVerifiedAt: new Date(),
          dateOfBirth: dob,
          isAdult: true,
          status: "ACTIVE",
          role: "MEMBER",
        },
      });

      // Création du profil initial Supabase
      try {
        await prisma.profile.create({
          data: {
            userId: user.id,
            firstName: resolvedName,
            pseudo: `${resolvedPseudo}_${Math.floor(100 + Math.random() * 900)}`,
            gender: resolvedGender as any,
            city: "Lomé",
            bio: "Nouveau membre sur Meet Me Club à Lomé.",
            relationshipGoal: "SERIOUS",
            profileCompleteness: 60,
            isVisible: true,
          },
        });
      } catch (profErr) {
        console.warn("[register] Profile creation warning:", profErr);
      }
    } catch (dbErr) {
      console.warn("[register] Supabase direct error, using local fallback:", dbErr);
      user = {
        id: `usr_${Date.now()}`,
        email: cleanEmail,
        role: "MEMBER",
        status: "ACTIVE",
      };
    }

    // 5. Sauvegarde dans le store local pour compatibilité absolue
    saveProfile({
      userId: user.id,
      firstName: resolvedName,
      pseudo: resolvedPseudo,
      gender: resolvedGender as any,
      city: "Lomé",
      age: new Date().getFullYear() - dob.getFullYear(),
      dateOfBirth: dob.toISOString(),
      bio: "Nouveau membre sur Meet Me Club à Lomé.",
      relationshipGoal: "SERIOUS",
      plan: "FREE",
      partnersContacted: [],
      photos: [
        {
          id: `p_${user.id}`,
          url: resolvedGender === "FEMALE"
            ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80"
            : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80",
          isMain: true,
        },
      ],
      interests: ["Discussions", "Sorties Lomé", "Cafés"],
      availabilities: [{ dayOfWeek: 5, startTime: "18:00", endTime: "22:00" }],
      isVerified: true,
      isVisible: true,
    });

    // 6. Création de la session JWT sécurisée
    await setSessionCookie({
      userId: user.id,
      role: user.role,
      status: user.status,
      email: cleanEmail,
    });

    return NextResponse.json({
      success: true,
      message: "Compte créé avec succès ! Bienvenue sur Meet Me Club.",
      redirect: "/profil?welcome=1",
    });
  } catch (error) {
    console.error("[POST /api/auth/register]", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'inscription. Veuillez réessayer." },
      { status: 500 }
    );
  }
}
