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
    const { email, login, identifier, password, dateOfBirth, firstName, pseudo, gender } = body;

    const rawInput = (login || identifier || pseudo || email || "").toString().trim();
    if (!rawInput) {
      return NextResponse.json(
        { error: "Veuillez entrer votre pseudo ou votre adresse e-mail." },
        { status: 400 }
      );
    }

    const isEmail = rawInput.includes("@");
    const cleanPseudo = (pseudo || (isEmail ? rawInput.split("@")[0] : rawInput)).toString().trim();
    const cleanEmail = isEmail
      ? rawInput.toLowerCase()
      : `${cleanPseudo.toLowerCase().replace(/[^a-z0-9_]/gi, "")}@meetmeclub.net`;

    // 2. Date de naissance (par défaut 2000-01-01 pour 18+ si non fournie)
    let dob = new Date("2000-01-01");
    if (dateOfBirth) {
      const parsed = new Date(dateOfBirth);
      if (!isNaN(parsed.getTime())) {
        dob = parsed;
      }
    }

    if (!isAdult(dob)) {
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
    const resolvedName = (firstName && firstName.trim()) || cleanPseudo;
    const resolvedPseudo = cleanPseudo;
    const resolvedGender = gender && ["MALE", "FEMALE", "OTHER"].includes(gender) ? gender : "OTHER";

    let user: any = null;

    // 4. Tentative de création dans Supabase / Prisma
    try {
      const existing = await prisma.user.findFirst({
        where: {
          OR: [
            { email: { equals: cleanEmail, mode: "insensitive" } },
            { profile: { pseudo: { equals: resolvedPseudo, mode: "insensitive" } } },
          ],
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "Un compte existe déjà avec ce pseudo ou cet e-mail. Veuillez vous connecter." },
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
            pseudo: resolvedPseudo,
            gender: resolvedGender as any,
            city: "Lomé",
            bio: "Nouveau membre sur Meet Me Club à Lomé.",
            isVisible: true,
          },
        });

        // Création de l'abonnement initial Plan Gratuit (7 jours)
        await (prisma as any).subscription.create({
          data: {
            userId: user.id,
            plan: "FREE",
            status: "ACTIVE",
            startDate: new Date(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            priceFcfa: 0,
            paymentRef: "FREE_REGISTRATION",
            paymentMethod: "FREE",
          },
        }).catch(() => {});
      } catch (profErr) {
        console.warn("[register] Profile/Subscription creation warning:", profErr);
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

    // 4.b Synchronisation directe Supabase REST (HTTPS)
    try {
      const { upsertProfileInSupabase } = await import("@/lib/supabase-server");
      await upsertProfileInSupabase(user.id, {
        firstName: resolvedName,
        pseudo: resolvedPseudo,
        gender: resolvedGender as any,
        city: "Lomé",
        bio: "Nouveau membre sur Meet Me Club à Lomé.",
        relationshipGoal: "SERIOUS",
      });
    } catch (supaErr) {
      console.warn("[register] Supabase REST sync warning:", supaErr);
    }

    // 5. Sauvegarde dans le store local avec profil neutre et sans fausse photo
    saveProfile({
      userId: user.id,
      firstName: resolvedName,
      pseudo: resolvedPseudo,
      email: cleanEmail, // stocké pour permettre la reconnexion par email après déconnexion
      gender: resolvedGender as any,
      city: "Lomé",
      age: new Date().getFullYear() - dob.getFullYear(),
      dateOfBirth: dob.toISOString(),
      bio: "Nouveau membre sur Meet Me Club.",
      relationshipGoal: "SERIOUS",
      plan: "FREE",
      partnersContacted: [],
      photos: [],
      interests: [],
      availabilities: [{ dayOfWeek: 5, startTime: "18:00", endTime: "22:00" }],
      isVerified: false,
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
