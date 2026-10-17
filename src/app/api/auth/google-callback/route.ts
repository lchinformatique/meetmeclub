// src/app/api/auth/google-callback/route.ts
// Connexion / inscription avec un vrai compte Google.
// L'identité est VÉRIFIÉE côté serveur à partir du jeton Supabase (jamais l'e-mail envoyé par le navigateur).
// À l'inscription : prénom, nom, pseudo et date de naissance (18 ans minimum) sont enregistrés.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/session";
import { saveProfile } from "@/lib/db-store";
import { FREE_TRIAL_DAYS, FREE_TRIAL_MS } from "@/lib/subscription-constants";

interface SignupData {
  firstName?: string;
  lastName?: string;
  pseudo?: string;
  dateOfBirth?: string;
}

function ageFrom(dob: Date) {
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

function cleanPseudo(raw: string) {
  return raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/^@/, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_.-]/g, "")
    .slice(0, 24)
    .toLowerCase();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const accessToken: string | undefined = body.accessToken;
    const signup: SignupData | null = body.signup && typeof body.signup === "object" ? body.signup : null;

    if (!accessToken) {
      return NextResponse.json({ error: "Session Google manquante. Veuillez réessayer." }, { status: 400 });
    }

    // ── 1. Vérification de l'identité Google auprès de Supabase ─────────────
    const { getSupabaseAdmin, getProfileFromSupabase, upsertProfileInSupabase, savePhotoInSupabase } =
      await import("@/lib/supabase-server");
    const admin = getSupabaseAdmin();
    const { data: verified, error: verifyErr } = await admin.auth.getUser(accessToken);
    if (verifyErr || !verified?.user?.email) {
      return NextResponse.json({ error: "Compte Google non vérifié. Veuillez réessayer." }, { status: 401 });
    }
    const gUser = verified.user;
    const supabaseId = gUser.id;
    const cleanEmail = gUser.email!.toLowerCase().trim();
    const meta = (gUser.user_metadata || {}) as Record<string, any>;
    const googleName: string = meta.full_name || meta.name || "";
    const googleAvatar: string | null = meta.avatar_url || meta.picture || null;

    // ── 2. Contrôle des informations d'inscription (18 ans minimum) ─────────
    let dob: Date | null = null;
    if (signup?.dateOfBirth) {
      const parsed = new Date(signup.dateOfBirth);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json({ error: "Date de naissance invalide." }, { status: 400 });
      }
      if (ageFrom(parsed) < 18) {
        return NextResponse.json(
          { error: "Meet Me Club est réservé aux personnes de 18 ans et plus. 🔞", underage: true },
          { status: 403 }
        );
      }
      dob = parsed;
    }

    const firstName =
      signup?.firstName?.trim() || googleName.split(" ")[0]?.trim() || cleanEmail.split("@")[0] || "Membre";
    const lastName = signup?.lastName?.trim() || googleName.split(" ").slice(1).join(" ").trim() || undefined;
    let pseudo = cleanPseudo(signup?.pseudo || googleName || cleanEmail.split("@")[0]) || cleanPseudo(cleanEmail.split("@")[0]);

    // ── 3. Compte existant ? (même Gmail ou même identifiant Google) ────────
    let user: { id: string; email: string | null; role: any; status: any } | null = null;
    try {
      const found = await prisma.user.findFirst({
        where: { OR: [{ email: { equals: cleanEmail, mode: "insensitive" } }, { googleId: supabaseId }] },
        select: { id: true, email: true, role: true, status: true, googleId: true },
      });
      if (found) {
        user = found;
        if (!found.googleId) {
          await prisma.user
            .update({ where: { id: found.id }, data: { googleId: supabaseId, emailVerifiedAt: new Date() } })
            .catch(() => {});
        }
      }
    } catch {}
    if (!user) {
      const { data: supaUser } = await admin
        .from("users")
        .select("id, email, role, status")
        .ilike("email", cleanEmail)
        .maybeSingle();
      if (supaUser) user = supaUser as any;
    }

    let existingProfile: any = user ? await getProfileFromSupabase(user.id, cleanEmail) : null;
    const isNew = !existingProfile;

    // Pseudo unique : on ajoute un numéro si déjà pris par un autre membre
    if (isNew) {
      for (let i = 0; i < 5; i++) {
        const { data: taken } = await admin.from("profiles").select("userId").ilike("pseudo", pseudo).maybeSingle();
        if (!taken || taken.userId === user?.id) break;
        pseudo = `${pseudo.slice(0, 20)}${Math.floor(100 + Math.random() * 900)}`;
      }
    }

    // ── 4. Création du compte ───────────────────────────────────────────────
    if (!user) {
      try {
        const created = await prisma.user.create({
          data: {
            email: cleanEmail,
            googleId: supabaseId,
            emailVerifiedAt: new Date(),
            dateOfBirth: dob || new Date("2000-01-01"),
            isAdult: true,
            status: "ACTIVE",
            role: "MEMBER",
          },
        });
        user = { id: created.id, email: created.email!, role: created.role, status: created.status };
      } catch {
        user = { id: `google_${supabaseId.replace(/[^a-zA-Z0-9_-]/g, "")}`, email: cleanEmail, role: "MEMBER", status: "ACTIVE" };
      }
    }

    if (user.status === "BANNED" || user.status === "SUSPENDED") {
      return NextResponse.json({ error: "Votre compte a été suspendu. Contactez le support." }, { status: 403 });
    }

    // ── 5. Profil : création, ou complément des infos d'inscription ─────────
    if (isNew) {
      const now = new Date();
      existingProfile = await upsertProfileInSupabase(user.id, {
        firstName,
        lastName: lastName || null,
        pseudo,
        email: cleanEmail,
        gender: "OTHER",
        city: "Lomé",
        bio: "",
        relationshipGoal: "SERIOUS",
        dateOfBirth: dob ? dob.toISOString() : null,
        age: dob ? ageFrom(dob) : null,
        plan: "FREE",
        subscriptionStartedAt: now.toISOString(),
        subscriptionExpiresAt: new Date(now.getTime() + FREE_TRIAL_MS).toISOString(),
      });
      if (googleAvatar) await savePhotoInSupabase(user.id, googleAvatar, true).catch(() => null);
      existingProfile = (await getProfileFromSupabase(user.id, cleanEmail)) || existingProfile;
    } else if (dob && !existingProfile?.dateOfBirth) {
      await upsertProfileInSupabase(user.id, { email: cleanEmail, dateOfBirth: dob.toISOString(), age: ageFrom(dob) });
    }

    // Store local de ce serveur (cache), sans jamais écraser les vraies données
    try {
      saveProfile({
        userId: user.id,
        firstName: existingProfile?.firstName || firstName,
        lastName: existingProfile?.lastName || lastName,
        pseudo: existingProfile?.pseudo || pseudo,
        email: cleanEmail,
        gender: existingProfile?.gender || "OTHER",
        city: existingProfile?.city || "Lomé",
        bio: existingProfile?.bio ?? "",
        relationshipGoal: existingProfile?.relationshipGoal || "SERIOUS",
        dateOfBirth: existingProfile?.dateOfBirth || (dob ? dob.toISOString() : undefined),
        age: existingProfile?.age || (dob ? ageFrom(dob) : undefined),
        plan: existingProfile?.plan || "FREE",
        subscriptionStartedAt: existingProfile?.subscriptionStartedAt,
        subscriptionExpiresAt: existingProfile?.subscriptionExpiresAt,
        photos: existingProfile?.photos?.length
          ? existingProfile.photos
          : googleAvatar
            ? [{ id: `p_${user.id}`, url: googleAvatar, isMain: true }]
            : [],
        coverUrl: existingProfile?.coverUrl,
        isVerified: true,
        isVisible: true,
      });
    } catch {}

    // ── 6. Session ──────────────────────────────────────────────────────────
    await setSessionCookie({
      userId: user.id,
      role: user.role || "MEMBER",
      status: user.status || "ACTIVE",
      email: cleanEmail,
    });

    // Nouveau membre (ou date de naissance manquante) → compléter son profil et sa bio
    const needsCompletion = isNew || !(existingProfile?.dateOfBirth || dob);
    return NextResponse.json({
      success: true,
      isNew,
      pseudo: existingProfile?.pseudo || pseudo,
      email: cleanEmail,
      redirect: needsCompletion ? "/profil/edit?welcome=1" : "/messages",
    });
  } catch (error) {
    console.error("[POST /api/auth/google-callback]", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la connexion Google. Veuillez réessayer." },
      { status: 500 }
    );
  }
}
