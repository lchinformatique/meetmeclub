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
    const { email, password } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Veuillez entrer une adresse e-mail valide." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Recherche dans Supabase
    let user: any = null;
    try {
      user = await prisma.user.findFirst({
        where: { email: cleanEmail },
      });
    } catch (e) {
      console.warn("[login] Supabase find error:", e);
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
        role: user.role,
        status: user.status,
        email: cleanEmail,
      });

      return NextResponse.json({
        success: true,
        redirect: "/decouverte",
      });
    }

    // 2. Si le mot de passe est fourni mais utilisateur introuvable
    return NextResponse.json(
      { error: "Aucun compte trouvé avec cet email. Veuillez d'abord vous inscrire." },
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
