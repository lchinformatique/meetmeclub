// src/app/api/auth/login/route.ts
// POST /api/auth/login — Connexion par Email, Pseudo ou Mot de passe
// Fonctionne après déconnexion : retrouve le compte dans Supabase + store local

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/session";
import { getAllProfiles, saveProfile } from "@/lib/db-store";
import { findPermanentVipAccount, PERMANENT_VIP_START, PERMANENT_VIP_EXPIRY } from "@/lib/subscription-constants";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Accepte les champs : email, login, identifier, pseudo (compatibilité frontend)
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

    // Nettoyer l'entrée : retirer le '@' initial si l'utilisateur a saisi @pseudo
    let cleanInput = loginInput.trim();
    if (cleanInput.startsWith("@")) {
      cleanInput = cleanInput.substring(1).trim();
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmail = emailRegex.test(cleanInput);
    const cleanLower = cleanInput.toLowerCase();

    // ── 1. Recherche dans Supabase / Prisma ────────────────────────────────
    let user: any = null;
    try {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            // Par email exact
            { email: { equals: cleanLower, mode: "insensitive" } },
            // Par pseudo (dans la table profile)
            { profile: { pseudo: { equals: cleanLower, mode: "insensitive" } } },
            // Par prénom (tolérant)
            { profile: { firstName: { equals: cleanLower, mode: "insensitive" } } },
            // Par début d'email (si l'utilisateur a tapé son pseudo qui correspond au début de l'email)
            ...(isEmail ? [] : [{ email: { startsWith: `${cleanLower}@`, mode: "insensitive" as const } }]),
          ],
        },
        include: { profile: true },
      });
    } catch (e) {
      console.warn("[login] Supabase find error (fallback to local):", e);
    }

    // ── 1.b Recherche directe dans Supabase (REST HTTPS) ─────────────────
    if (!user) {
      try {
        const { findUserInSupabase } = await import("@/lib/supabase-server");
        const supaResult = await findUserInSupabase(cleanInput);
        if (supaResult?.user) {
          const sUser = supaResult.user as any;
          user = {
            id: sUser.id,
            email: sUser.email,
            passwordHash: sUser.passwordHash,
            role: sUser.role || "MEMBER",
            status: sUser.status || "ACTIVE",
            profile: supaResult.profile,
          };
        }
      } catch (supaErr) {
        console.warn("[login] Supabase REST search warning:", supaErr);
      }
    }

    // ── 2. Fallback : Recherche dans le store local ─────────────────────────
    // Couvre les comptes créés hors PostgreSQL et permet la reconnexion après déconnexion
    if (!user) {
      const allProfiles = getAllProfiles();
      const match = allProfiles.find(
        (p) =>
          // Recherche par pseudo
          (p.pseudo && p.pseudo.toLowerCase() === cleanLower) ||
          // Recherche par prénom
          (p.firstName && p.firstName.toLowerCase() === cleanLower) ||
          // Recherche par userId
          p.userId === cleanInput ||
          // Recherche par email stocké dans le profil local
          (p.email && p.email.toLowerCase() === cleanLower) ||
          // Recherche par début d'email (pseudo@meetmeclub.net)
          (p.email && !isEmail && p.email.toLowerCase().startsWith(`${cleanLower}@`))
      );

      if (match) {
        user = {
          id: match.userId,
          email: match.email || `${(match.pseudo || "membre").toLowerCase().replace(/[^a-z0-9_]/gi, "")}@meetmeclub.net`,
          role: "MEMBER",
          status: "ACTIVE",
          passwordHash: null, // les comptes locaux n'ont pas de hash — on accepte le mot de passe saisi
          profile: match,
          _isLocalOnly: true,
        };
      }
    }

    // ── 2.b Comptes VIP permanents de test (vip_master / vip_tester) ───────
    // Toujours disponibles, même si la base n'a pas encore été seedée.
    const permanentVip = findPermanentVipAccount({
      userId: user?.id,
      email: user?.email || (isEmail ? cleanLower : undefined),
      pseudo: user?.profile?.pseudo || (isEmail ? undefined : cleanLower),
    });
    if (!user && permanentVip && password === "123456") {
      user = {
        id: permanentVip.userId,
        email: permanentVip.email,
        role: permanentVip.role,
        status: "ACTIVE",
        passwordHash: null,
        profile: {
          firstName: permanentVip.firstName,
          lastName: permanentVip.lastName,
          pseudo: permanentVip.pseudo,
          gender: permanentVip.gender,
        },
        _isLocalOnly: true,
      };
    }

    // ── 3. Vérification du mot de passe ────────────────────────────────────
    if (user) {
      // Les deux comptes de test (vip_master / vip_tester) restent accessibles avec 123456
      const testAccountOk = Boolean(permanentVip) && password === "123456";

      if (user.passwordHash && !user._isLocalOnly) {
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch && !testAccountOk) {
          return NextResponse.json(
            { error: "Mot de passe incorrect. Veuillez réessayer." },
            { status: 401 }
          );
        }
      } else if (!testAccountOk) {
        // Compte sans mot de passe (créé avec Google) : JAMAIS de mot de passe « au premier essai »,
        // sinon n'importe qui connaissant le pseudo prendrait le compte.
        return NextResponse.json(
          {
            error:
              "Ce compte a été créé avec Google. Touchez « Continuer avec Google », ou créez un mot de passe dans Profil › Sécurité pour vous connecter avec votre pseudo.",
            googleOnly: true,
          },
          { status: 401 }
        );
      }

      // S'assurer que le profil existe dans Supabase et dans le store local
      try {
        const { getProfileFromSupabase, upsertProfileInSupabase } = await import("@/lib/supabase-server");
        const effectiveEmail = user.email || (isEmail ? cleanLower : undefined);
        let supaProf = await getProfileFromSupabase(user.id, effectiveEmail);

        // Déterminer le plan réel — on préfère toujours la valeur Supabase/Prisma sur le fallback
        const prismaProfilePlan = user.profile?.plan || null;
        const realPlan = permanentVip ? "VIP" : (supaProf?.plan || prismaProfilePlan || "FREE");

        if (permanentVip) {
          // VIP illimité garanti dans Supabase pour les comptes de test
          supaProf = (await upsertProfileInSupabase(user.id, {
            firstName: supaProf?.firstName || permanentVip.firstName,
            lastName: supaProf?.lastName || permanentVip.lastName,
            pseudo: supaProf?.pseudo || permanentVip.pseudo,
            email: permanentVip.email,
            gender: supaProf?.gender || permanentVip.gender,
            city: supaProf?.city || "Lomé",
            plan: "VIP",
            subscriptionStartedAt: PERMANENT_VIP_START,
            subscriptionExpiresAt: PERMANENT_VIP_EXPIRY,
          })) || supaProf;
          if (supaProf) {
            supaProf.plan = "VIP";
            supaProf.subscriptionStartedAt = PERMANENT_VIP_START;
            supaProf.subscriptionExpiresAt = PERMANENT_VIP_EXPIRY;
          }
        } else if (!supaProf) {
          supaProf = await upsertProfileInSupabase(user.id, {
            firstName: user.profile?.firstName || cleanInput.split("@")[0] || "Membre",
            pseudo: user.profile?.pseudo || cleanInput.split("@")[0] || "membre",
            email: effectiveEmail,
            gender: user.profile?.gender || "OTHER",
            city: user.profile?.city || "Lomé",
            bio: user.profile?.bio || "Nouveau membre sur Meet Me Club à Lomé.",
            plan: realPlan,
          });
        } else if (supaProf.plan !== realPlan && realPlan !== "FREE") {
          // Mettre à jour le plan dans Supabase si le profil Prisma est plus élevé
          await upsertProfileInSupabase(user.id, { plan: realPlan });
          supaProf.plan = realPlan;
        }

        if (supaProf) {
          // Calculer les timestamps d'abonnement
          const subStart = supaProf.subscriptionStartedAt || user.profile?.subscriptionStartedAt || null;
          const subExpiry = supaProf.subscriptionExpiresAt || user.profile?.subscriptionExpiresAt || null;

          saveProfile({
            userId: user.id,
            firstName: supaProf.firstName || "Membre",
            lastName: supaProf.lastName || "",
            pseudo: supaProf.pseudo || supaProf.firstName,
            email: effectiveEmail,
            gender: (supaProf.gender as any) || "OTHER",
            city: supaProf.city || "Lomé",
            bio: supaProf.bio || "Nouveau membre sur Meet Me Club.",
            // Plan Supabase toujours prioritaire — ne jamais forcer FREE sur un VIP
            plan: supaProf.plan || realPlan,
            subscriptionStartedAt: subStart || undefined,
            subscriptionExpiresAt: subExpiry || undefined,
            photos: supaProf.photos || [],
            age: supaProf.age || undefined,
            profession: supaProf.profession || undefined,
            isVerified: true,
            isVisible: true,
          });
        }
      } catch (profErr) {
        console.warn("[login] Profile hydrate warning:", profErr);
      }

      // ── 4. Création de la session JWT ──────────────────────────────────
      await setSessionCookie({
        userId: user.id,
        role: user.role || "MEMBER",
        status: user.status || "ACTIVE",
        email: user.email || `${cleanLower}@meetmeclub.net`,
        phone: user.profile?.phone || undefined,
      });

      return NextResponse.json({
        success: true,
        redirect: "/messages",
      });
    }

    // ── 5. Aucun compte trouvé ─────────────────────────────────────────────
    return NextResponse.json(
      {
        error:
          "Aucun compte trouvé avec cet identifiant (e-mail ou pseudo). Vérifiez votre saisie ou créez un compte.",
      },
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
