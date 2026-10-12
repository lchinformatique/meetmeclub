// src/app/api/auth/login/route.ts
// Direct login via Email & Password

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/session";
import { getProfileByUserId, saveProfile } from "@/lib/db-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, login, identifier, password } = body;
    const loginInput = (login || identifier || email || "").toString().trim();

    if (!loginInput) {
      return NextResponse.json(
        { error: "Veuillez entrer votre adresse e-mail ou votre pseudo." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Veuillez entrer votre mot de passe." },
        { status: 400 }
      );
    }

    const isEmail = loginInput.includes("@");
    const cleanEmail = isEmail ? loginInput.toLowerCase() : "";
    const cleanPseudo = loginInput.toLowerCase();

    // 1. Recherche dans Supabase / Prisma (par Email ou par Pseudo)
    let user: any = null;
    try {
      if (isEmail) {
        user = await prisma.user.findFirst({
          where: { email: cleanEmail },
          include: { profile: true },
        });
      } else {
        // Recherche par Pseudo
        user = await prisma.user.findFirst({
          where: {
            profile: {
              pseudo: {
                equals: cleanPseudo,
                mode: "insensitive",
              },
            },
          },
          include: { profile: true },
        });
      }
    } catch (e) {
      console.warn("[login] Supabase find error:", e);
    }

    // Fallback: recherche dans le store local par pseudo ou email
    if (!user) {
      const allProfiles = (await import("@/lib/db-store")).getAllProfiles();
      const match = allProfiles.find(
        (p) =>
          (p.pseudo && p.pseudo.toLowerCase() === cleanPseudo) ||
          (p.userId && p.userId === loginInput)
      );
      if (match) {
        user = {
          id: match.userId,
          email: `${(match.pseudo || "membre").toLowerCase()}@meetmeclub.tg`,
          role: "MEMBER",
          status: "ACTIVE",
          passwordHash: null,
          profile: match,
        };
      }
    }

    if (user) {
      if (user.passwordHash && password) {
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
          return NextResponse.json(
            { error: "Mot de passe incorrect. Veuillez réessayer." },
            { status: 401 }
          );
        }
      }

      await setSessionCookie({
        userId: user.id,
        role: user.role || "MEMBER",
        status: user.status || "ACTIVE",
        email: user.email || cleanEmail || `${cleanPseudo}@meetmeclub.tg`,
      });

      return NextResponse.json({
        success: true,
        redirect: "/profil",
      });
    }

    // 2. Si l'utilisateur est introuvable
    return NextResponse.json(
      { error: "Aucun compte trouvé avec cet identifiant (e-mail ou pseudo). Veuillez vérifier ou vous inscrire." },
      { status: 404 }
    );
  } catch (error) {
    console.error("[POST /api/auth/login]", error);
    return NextResponse.json(
      { error: "Erreur de connexion. Veuillez réessayer." },
      { status: 500 }
    );
  }
}
