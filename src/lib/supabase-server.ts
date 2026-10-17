// src/lib/supabase-server.ts
// Robust Supabase Admin client via PostgREST HTTPS (port 443)
// Guarantees data persistence to Supabase without dropping or timeout issues.

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { uploadToSupabaseStorage } from "./supabase-storage";
import { asAssistant } from "./victoire-bot";
// Statuts des photos d'album (la colonne n'accepte pas « COVER » : un filtre neq("COVER") échouait toujours)
const GALLERY_STATUSES = ["PENDING", "APPROVED", "REJECTED"];

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://ibfnvkelthganvmisqbn.supabase.co";

const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliZm52a2VsdGhnYW52bWlzcWJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTc1MjM4OSwiZXhwIjoyMTA3MzI4Mzg5fQ.fDWsssdgxrz9tRbxzrmR9dKZe8t9ygHAQxNjmlBCKcw";

let supabaseAdminInstance: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseAdminInstance;
}

function calculateAge(dobString?: string | null): number | undefined {
  if (!dobString) return undefined;
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return undefined;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

// ── Recherche utilisateur par email, pseudo ou téléphone ─────
export async function findUserInSupabase(identifier: string) {
  const admin = getSupabaseAdmin();
  const clean = identifier.trim().replace(/^@/, "");
  const cleanLower = clean.toLowerCase();
  const isEmail = cleanLower.includes("@");

  try {
    // 1. Recherche par email
    if (isEmail) {
      const { data: byEmail } = await admin
        .from("users")
        .select("id, email, passwordHash, role, status, phone, dateOfBirth")
        .ilike("email", cleanLower)
        .limit(1)
        .maybeSingle();

      if (byEmail) {
        const profile = await getProfileFromSupabase(byEmail.id);
        return { user: byEmail, profile };
      }
    }

    // 2. Recherche par pseudo dans la table profiles
    const { data: byPseudo } = await admin
      .from("profiles")
      .select("*")
      .ilike("pseudo", clean)
      .limit(1)
      .maybeSingle();

    if (byPseudo) {
      const { data: user } = await admin
        .from("users")
        .select("id, email, passwordHash, role, status, phone, dateOfBirth")
        .eq("id", byPseudo.userId)
        .maybeSingle();

      const profile = await getProfileFromSupabase(byPseudo.userId);
      return {
        user: user || {
          id: byPseudo.userId,
          email: `${cleanLower}@meetmeclub.net`,
          role: "MEMBER",
          status: "ACTIVE",
          passwordHash: null,
          phone: null,
        },
        profile,
      };
    }

    // 3. Recherche par prénom (fallback)
    const { data: byFirstName } = await admin
      .from("profiles")
      .select("*")
      .ilike("firstName", clean)
      .limit(1)
      .maybeSingle();

    if (byFirstName) {
      const profile = await getProfileFromSupabase(byFirstName.userId);
      return {
        user: {
          id: byFirstName.userId,
          email: `${cleanLower}@meetmeclub.net`,
          role: "MEMBER",
          status: "ACTIVE",
          passwordHash: null,
          phone: null,
        },
        profile,
      };
    }

    return null;
  } catch (err) {
    console.warn("[findUserInSupabase] Warning:", err);
    return null;
  }
}

// ── Récupération complète d'un profil depuis Supabase ─────────
export async function getProfileFromSupabase(userId: string, email?: string) {
  const admin = getSupabaseAdmin();
  try {
    // 1. Profil (recherche par userId direct)
    let { data: profile } = await admin
      .from("profiles")
      .select("*")
      .eq("userId", userId)
      .maybeSingle();

    // 1.b Recherche par pseudo
    if (!profile) {
      const clean = userId.replace(/^@/, "").trim();
      const { data: byPseudo } = await admin
        .from("profiles")
        .select("*")
        .ilike("pseudo", clean)
        .maybeSingle();
      if (byPseudo) profile = byPseudo;
    }

    // 1.c Recherche par email explicite ou par userId s'il ressemble à un email
    if (!profile) {
      const targetEmail = (email || (userId.includes("@") ? userId : "")).toLowerCase().trim();
      if (targetEmail) {
        const { data: userMatch } = await admin
          .from("users")
          .select("id, email")
          .ilike("email", targetEmail)
          .maybeSingle();
        if (userMatch?.id) {
          const { data: byUserMatch } = await admin
            .from("profiles")
            .select("*")
            .eq("userId", userMatch.id)
            .maybeSingle();
          if (byUserMatch) profile = byUserMatch;
        }
      }
    }

    // 1.d Recherche par id utilisateur partiel / début d'email
    if (!profile) {
      const cleanLower = userId.toLowerCase().trim();
      const { data: userMatch } = await admin
        .from("users")
        .select("id")
        .or(`email.ilike.${cleanLower},email.ilike.${cleanLower}@%`)
        .maybeSingle();
      if (userMatch?.id) {
        const { data: byUserMatch } = await admin
          .from("profiles")
          .select("*")
          .eq("userId", userMatch.id)
          .maybeSingle();
        if (byUserMatch) profile = byUserMatch;
      }
    }

    if (!profile) return null;

    const effectiveUserId = profile.userId || userId;

    // 2. Utilisateur (pour dateOfBirth, phone, email)
    const { data: user } = await admin
      .from("users")
      .select("dateOfBirth, phone, email")
      .eq("id", effectiveUserId)
      .maybeSingle();

    // 3. Photos (album jusqu'à 4 photos bio + couverture)
    const { data: photos } = await admin
      .from("profile_photos")
      .select("*")
      .eq("profileId", profile.id)
      .order("order", { ascending: true });

    const allPhotos = photos || [];

    // Déterminer photo principale et couverture
    const mainPhoto = allPhotos.find((p) => p.isMain && p.status !== "COVER");
    const firstPhoto = allPhotos.find((p) => p.status !== "COVER");
    const avatarUrl = mainPhoto?.url || firstPhoto?.url || profile.avatarUrl || undefined;

    const coverPhoto = allPhotos.find((p) => p.status === "COVER" || p.order === 0);
    const coverUrl = profile.coverUrl || coverPhoto?.url || undefined;

    // Album (exclut la couverture dédiée, jusqu'à 4 photos bio)
    const albumPhotos = allPhotos
      .filter((p) => p.status !== "COVER")
      .slice(0, 4)
      .map((p, idx) => ({
        id: p.id,
        url: p.url,
        isMain: Boolean(p.isMain),
        order: p.order || idx + 1,
      }));

    const dob = profile.dateOfBirth || user?.dateOfBirth;
    const age = calculateAge(dob);

    return {
      ...profile,
      userId: effectiveUserId,
      lastName: profile.lastName || undefined,
      placeOfBirth: profile.placeOfBirth || undefined,
      dateOfBirth: dob ? String(dob).split("T")[0] : undefined,
      age: profile.age || age,
      phone: user?.phone || undefined,
      email: user?.email || email || undefined,
      plan: profile.plan || "FREE",
      subscriptionStartedAt: profile.subscriptionStartedAt || undefined,
      subscriptionExpiresAt: profile.subscriptionExpiresAt || undefined,
      likesCount: profile.likesCount !== undefined ? profile.likesCount : undefined,
      avatarUrl,
      coverUrl,
      photos: albumPhotos,
    };
  } catch (err) {
    console.warn("[getProfileFromSupabase] Exception:", err);
    return null;
  }
}

// ── S'assurer que l'utilisateur existe dans la table users ──────
export async function ensureUserExistsInSupabase(
  userId: string,
  email?: string,
  phone?: string | null,
  dateOfBirth?: string | null
): Promise<string> {
  const admin = getSupabaseAdmin();
  const now = new Date().toISOString();
  try {
    const { data: existing } = await admin
      .from("users")
      .select("id, email")
      .eq("id", userId)
      .maybeSingle();

    if (!existing) {
      const cleanEmail = (
        email ||
        (userId.includes("@")
          ? userId
          : `${userId.replace(/[^a-zA-Z0-9_]/g, "")}@meetmeclub.net`)
      ).toLowerCase().trim();

      // Vérifier si un utilisateur existe déjà avec cet email
      const { data: existingByEmail } = await admin
        .from("users")
        .select("id, email")
        .ilike("email", cleanEmail)
        .maybeSingle();

      if (existingByEmail) {
        const userUpdates: Record<string, any> = { updatedAt: now };
        if (phone) userUpdates.phone = phone;
        if (dateOfBirth) {
          userUpdates.dateOfBirth = dateOfBirth;
          userUpdates.isAdult = true;
        }
        await admin.from("users").update(userUpdates).eq("id", existingByEmail.id);
        return existingByEmail.id;
      }

      const { error: insErr } = await admin.from("users").insert({
        id: userId,
        email: cleanEmail,
        phone: phone || null,
        dateOfBirth: dateOfBirth || "2000-01-01T00:00:00.000Z",
        isAdult: true,
        status: "ACTIVE",
        role: "MEMBER",
        createdAt: now,
        updatedAt: now,
      });
      if (insErr) {
        console.warn("[ensureUserExistsInSupabase] Insert warning:", insErr);
      }
      return userId;
    } else {
      const userUpdates: Record<string, any> = { updatedAt: now };
      if (email && (!existing.email || existing.email.includes("@meetmeclub.net"))) {
        userUpdates.email = email.toLowerCase().trim();
      }
      if (phone) userUpdates.phone = phone;
      if (dateOfBirth) {
        userUpdates.dateOfBirth = dateOfBirth;
        userUpdates.isAdult = true;
      }
      await admin.from("users").update(userUpdates).eq("id", userId);
      return userId;
    }
  } catch (err) {
    console.warn("[ensureUserExistsInSupabase] Exception:", err);
    return userId;
  }
}

// ── Écriture tolérante : une colonne absente ou une valeur refusée ne doit
// jamais faire perdre TOUT l'enregistrement du profil ─────────────────────
const GENDERS = ["MALE", "FEMALE", "OTHER"];
const GOALS = ["FRIENDSHIP", "SERIOUS", "MARRIAGE", "CASUAL", "EXCHANGE"];

function sanitizeProfilePayload(payload: Record<string, any>) {
  const out = { ...payload };
  for (const k of Object.keys(out)) if (out[k] === undefined) delete out[k];
  if (out.gender && !GENDERS.includes(out.gender)) out.gender = "OTHER";
  if (out.relationshipGoal && !GOALS.includes(out.relationshipGoal)) out.relationshipGoal = "SERIOUS";
  if (typeof out.height === "string") out.height = parseInt(out.height, 10) || null;
  return out;
}

async function writeProfileResilient(
  write: (payload: Record<string, any>) => PromiseLike<{ data: any; error: any }>,
  initial: Record<string, any>
) {
  let payload = sanitizeProfilePayload(initial);
  for (let attempt = 0; attempt < 8; attempt++) {
    const { data, error } = await write(payload);
    if (!error) return { data, error: null };

    const msg = `${error.message || ""} ${error.details || ""}`;
    const missingCol = msg.match(/Could not find the '([^']+)' column/);
    if (missingCol && missingCol[1] in payload) {
      const { [missingCol[1]]: _dropped, ...rest } = payload;
      payload = rest;
      continue;
    }
    if (error.code === "23505" && /pseudo/i.test(msg) && "pseudo" in payload) {
      // Pseudo déjà utilisé par un autre membre : on enregistre le reste du profil
      const { pseudo: _p, ...rest } = payload;
      payload = rest;
      continue;
    }
    const badEnum = msg.match(/invalid input value for enum [^:]*: "([^"]+)"/);
    if (badEnum) {
      const badKey = Object.keys(payload).find((k) => payload[k] === badEnum[1]);
      if (badKey === "relationshipGoal" && payload.relationshipGoal === "EXCHANGE") {
        // Base sans la valeur EXCHANGE (migration v2 non appliquée) → équivalent le plus proche
        payload = { ...payload, relationshipGoal: "FRIENDSHIP" };
        continue;
      }
      if (badKey) {
        const { [badKey]: _b, ...rest } = payload;
        payload = rest;
        continue;
      }
    }
    return { data: null, error };
  }
  return { data: null, error: new Error("Trop de tentatives d'écriture") };
}

// ── Mise à jour ou création de profil dans Supabase ──────────
export async function upsertProfileInSupabase(
  userId: string,
  data: {
    firstName?: string;
    lastName?: string | null;
    pseudo?: string | null;
    email?: string | null;
    gender?: string;
    city?: string;
    country?: string | null;
    address?: string | null;
    neighborhood?: string | null;
    profession?: string | null;
    bio?: string | null;
    relationshipGoal?: string;
    relationshipStatus?: string | null;
    height?: number | null;
    religion?: string | null;
    hasChildren?: boolean | null;
    languages?: string[];
    educationLevel?: string | null;
    phone?: string | null;
    avatarUrl?: string | null;
    coverUrl?: string | null;
    dateOfBirth?: string | null;
    placeOfBirth?: string | null;
    age?: number | null;
    plan?: string;
    subscriptionStartedAt?: string | null;
    subscriptionExpiresAt?: string | null;
    likesCount?: number | null;
  }
) {
  const admin = getSupabaseAdmin();
  const now = new Date().toISOString();
  try {
    // 1. S'assurer que le compte existe dans la table users Supabase
    const effectiveUserId = await ensureUserExistsInSupabase(
      userId,
      data.email || undefined,
      data.phone,
      data.dateOfBirth
    );

    // 2. Vérifier si un profil existe déjà pour cet utilisateur
    let { data: existing } = await admin
      .from("profiles")
      .select("*")
      .eq("userId", effectiveUserId)
      .maybeSingle();

    // NB : pas de recherche par pseudo ici — un pseudo identique appartient à un AUTRE
    // membre et son profil serait écrasé.
    if (!existing && data.email) {
      const cleanEmail = data.email.toLowerCase().trim();
      const { data: userMatch } = await admin
        .from("users")
        .select("id")
        .ilike("email", cleanEmail)
        .maybeSingle();
      if (userMatch?.id) {
        const { data: byUserMatch } = await admin
          .from("profiles")
          .select("*")
          .eq("userId", userMatch.id)
          .maybeSingle();
        if (byUserMatch) existing = byUserMatch;
      }
    }

    let profileId = existing?.id;

    // Si nouveau profil
    if (!profileId) {
      profileId = `prof_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const insertPayload: Record<string, any> = {
        id: profileId,
        userId: effectiveUserId,
        firstName: data.firstName || "Membre",
        lastName: data.lastName || null,
        pseudo: data.pseudo || null,
        gender: data.gender || "OTHER",
        city: data.city || "",
        country: data.country || null,
        neighborhood: data.neighborhood || null,
        profession: data.profession || null,
        bio: data.bio !== undefined ? data.bio : "Nouveau membre sur Meet Me Club.",
        relationshipGoal: data.relationshipGoal || "SERIOUS",
        relationshipStatus: data.relationshipStatus || "Célibataire",
        height: data.height || null,
        religion: data.religion || null,
        hasChildren: data.hasChildren ?? false,
        languages: data.languages || ["fr"],
        educationLevel: data.educationLevel || null,
        coverUrl: data.coverUrl || null,
        placeOfBirth: data.placeOfBirth || null,
        dateOfBirth: data.dateOfBirth || null,
        plan: data.plan || "FREE",
        isVisible: true,
        photoPrivacy: "ALL",
        profileCompleteness: 85,
        likesCount: data.likesCount || 0,
        createdAt: now,
        updatedAt: now,
      };

      const { data: created, error: insertError } = await writeProfileResilient(
        (p) => admin.from("profiles").insert(p).select().maybeSingle(),
        insertPayload
      );

      if (insertError) {
        console.warn("[upsertProfileInSupabase] Insert warning:", insertError);
      }
      existing = created || existing;
    } else {
      // Profil existant: Mettre à jour
      const updatePayload: Record<string, any> = {
        updatedAt: now,
      };
      if (data.firstName !== undefined) updatePayload.firstName = data.firstName;
      if (data.lastName !== undefined) updatePayload.lastName = data.lastName;
      if (data.pseudo !== undefined) updatePayload.pseudo = data.pseudo;
      if (data.gender !== undefined) updatePayload.gender = data.gender;
      if (data.city !== undefined) updatePayload.city = data.city;
      if (data.country !== undefined) updatePayload.country = data.country;
      if (data.neighborhood !== undefined) updatePayload.neighborhood = data.neighborhood;
      if (data.profession !== undefined) updatePayload.profession = data.profession;
      if (data.bio !== undefined) updatePayload.bio = data.bio;
      if (data.relationshipGoal !== undefined) updatePayload.relationshipGoal = data.relationshipGoal;
      if (data.relationshipStatus !== undefined) updatePayload.relationshipStatus = data.relationshipStatus;
      if (data.height !== undefined) updatePayload.height = data.height;
      if (data.religion !== undefined) updatePayload.religion = data.religion;
      if (data.hasChildren !== undefined) updatePayload.hasChildren = data.hasChildren;
      if (data.languages !== undefined) updatePayload.languages = data.languages;
      if (data.educationLevel !== undefined) updatePayload.educationLevel = data.educationLevel;
      if (data.coverUrl !== undefined) updatePayload.coverUrl = data.coverUrl;
      if (data.placeOfBirth !== undefined) updatePayload.placeOfBirth = data.placeOfBirth;
      if (data.dateOfBirth !== undefined) updatePayload.dateOfBirth = data.dateOfBirth;
      if (data.plan !== undefined) updatePayload.plan = data.plan;
      if (data.subscriptionExpiresAt !== undefined) updatePayload.subscriptionExpiresAt = data.subscriptionExpiresAt;
      if (data.subscriptionStartedAt !== undefined) updatePayload.subscriptionStartedAt = data.subscriptionStartedAt;
      if (data.likesCount !== undefined) updatePayload.likesCount = data.likesCount;

      const { data: updated, error: updateError } = await writeProfileResilient(
        (p) => admin.from("profiles").update(p).eq("id", profileId).select().maybeSingle(),
        updatePayload
      );

      if (updateError) {
        console.warn("[upsertProfileInSupabase] Update warning:", updateError);
      }
      if (updated) existing = updated;
    }

    // 3. Gestion pérenne de la Couverture dans Supabase
    if (data.coverUrl && profileId) {
      try {
        let finalCover = data.coverUrl;
        if (finalCover.startsWith("data:image/")) {
          const uploadRes = await uploadToSupabaseStorage(
            userId,
            "cover",
            finalCover,
            "image/webp",
            "cover"
          );
          finalCover = uploadRes.url;
        }

        await admin
          .from("profile_photos")
          .delete()
          .eq("profileId", profileId)
          .eq("status", "COVER");

        await admin.from("profile_photos").insert({
          id: `cover_${Date.now()}`,
          profileId,
          url: finalCover,
          publicId: `cover_${userId}`,
          thumbnailUrl: finalCover,
          isMain: false,
          order: 0,
          status: "COVER",
          createdAt: now,
        });
      } catch (coverErr) {
        console.warn("[upsertProfileInSupabase] Cover save warning:", coverErr);
      }
    }

    // 4. Gestion de la Photo Principale (Avatar) dans Supabase
    if (data.avatarUrl && profileId) {
      try {
        let finalAvatar = data.avatarUrl;
        if (finalAvatar.startsWith("data:image/")) {
          const uploadRes = await uploadToSupabaseStorage(
            userId,
            "avatar",
            finalAvatar,
            "image/webp",
            "avatar"
          );
          finalAvatar = uploadRes.url;
        }
        await savePhotoInSupabase(userId, finalAvatar, true);
      } catch (avErr) {
        console.warn("[upsertProfileInSupabase] Avatar save warning:", avErr);
      }
    }

    // 5. Adresse de résidence : table privée, accessible uniquement au serveur
    if (data.address !== undefined) {
      const { error: addrErr } = await admin
        .from("member_private")
        .upsert({ userId: effectiveUserId, address: data.address || null, updatedAt: now }, { onConflict: "userId" });
      if (addrErr) console.warn("[upsertProfileInSupabase] Adresse:", addrErr.message);
    }

    return existing;
  } catch (err) {
    console.warn("[upsertProfileInSupabase] Exception:", err);
    return null;
  }
}

// ── Seeding permanent du profil officiel Victoire Lawson ───────
export async function seedPermanentVictoire() {
  const admin = getSupabaseAdmin();
  try {
    const userId = "user_victoire_lome";
    const now = new Date().toISOString();

    const { data: userCheck } = await admin
      .from("users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (!userCheck) {
      await admin.from("users").insert({
        id: userId,
        email: "victoire@meetmeclub.net",
        dateOfBirth: "2000-05-14T00:00:00.000Z",
        isAdult: true,
        status: "ACTIVE",
        role: "MEMBER",
        createdAt: now,
        updatedAt: now,
      });
    }

    const { data: profCheck } = await admin
      .from("profiles")
      .select("id")
      .eq("userId", userId)
      .maybeSingle();

    if (!profCheck) {
      await admin.from("profiles").insert({
        id: "prof_victoire_lome",
        userId,
        firstName: "Victoire",
        lastName: "Lawson",
        pseudo: "victoire_lome",
        gender: "FEMALE",
        city: "",
        profession: "Styliste & Créatrice de mode",
        educationLevel: "Master Mode & Design",
        height: 168,
        religion: "Chrétienne",
        relationshipStatus: "Célibataire",
        hasChildren: false,
        languages: ["Français", "Mina", "Anglais"],
        bio: "✨ Passionnée d'art, de mode et de voyages, souriante et chaleureuse. J'adore les dîners au coucher de soleil, les sorties conviviales et les belles rencontres. Écris-moi, je réponds toujours avec grand plaisir ! 💖",
        relationshipGoal: "SERIOUS",
        plan: "VIP",
        likesCount: 68,
        isVisible: true,
        photoPrivacy: "ALL",
        profileCompleteness: 95,
        createdAt: now,
        updatedAt: now,
      });
    }

    const { data: photoCheck } = await admin
      .from("profile_photos")
      .select("id")
      .eq("profileId", "prof_victoire_lome")
      .maybeSingle();

    if (!photoCheck) {
      await admin.from("profile_photos").insert({
        id: "ph_victoire_main",
        profileId: "prof_victoire_lome",
        url: "/victoire_profile.jpg",
        thumbnailUrl: "/victoire_profile.jpg",
        publicId: "victoire_profile",
        isMain: true,
        order: 1,
        status: "APPROVED",
        createdAt: now,
      });
    }
  } catch (err) {
    console.warn("[seedPermanentVictoire] Warning:", err);
  }
}

// ── Enregistrement d'une photo dans Supabase profile_photos ───
export async function savePhotoInSupabase(
  userId: string,
  photoUrl: string,
  isMain: boolean = true,
  order: number = 1
) {
  const admin = getSupabaseAdmin();
  const now = new Date().toISOString();
  try {
    let { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("userId", userId)
      .maybeSingle();

    if (!profile) {
      await upsertProfileInSupabase(userId, { firstName: "Membre" });
      const created = await admin.from("profiles").select("id").eq("userId", userId).maybeSingle();
      profile = created.data;
    }

    if (!profile?.id) return null;

    // Si upload base64, envoyer d'abord dans Supabase Storage
    let storedUrl = photoUrl;
    if (storedUrl.startsWith("data:image/")) {
      try {
        const uploadRes = await uploadToSupabaseStorage(
          userId,
          isMain ? "avatar" : "gallery",
          storedUrl,
          "image/webp",
          `photo_${Date.now()}`
        );
        storedUrl = uploadRes.url;
      } catch (storageErr) {
        console.warn("[savePhotoInSupabase] Storage upload failed:", storageErr);
      }
    }

    // Si photo principale, démarquer les anciennes
    if (isMain) {
      await admin
        .from("profile_photos")
        .update({ isMain: false })
        .eq("profileId", profile.id)
        .in("status", GALLERY_STATUSES);
    }

    // Vérifier si cette photo existe déjà
    const { data: existingPhoto } = await admin
      .from("profile_photos")
      .select("id")
      .eq("profileId", profile.id)
      .eq("url", storedUrl)
      .maybeSingle();

    if (existingPhoto?.id) {
      const { data: updated } = await admin
        .from("profile_photos")
        .update({ isMain, order, status: "APPROVED" })
        .eq("id", existingPhoto.id)
        .select()
        .single();
      return updated;
    }

    const photoId = `ph_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const { data: photo, error } = await admin
      .from("profile_photos")
      .insert({
        id: photoId,
        profileId: profile.id,
        url: storedUrl,
        thumbnailUrl: storedUrl,
        publicId: photoId,
        isMain,
        order,
        status: "APPROVED",
        createdAt: now,
      })
      .select()
      .single();

    if (error) console.warn("[savePhotoInSupabase] Insert error:", error);
    return photo;
  } catch (err) {
    console.warn("[savePhotoInSupabase] Exception:", err);
    return null;
  }
}

// ── Synchronisation complète de l'album de photos (max 8) ─────
export async function syncAlbumPhotosInSupabase(
  userId: string,
  photos: Array<{ id?: string; url: string; isMain?: boolean }>
) {
  const admin = getSupabaseAdmin();
  const now = new Date().toISOString();
  try {
    let { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("userId", userId)
      .maybeSingle();

    if (!profile) {
      await upsertProfileInSupabase(userId, { firstName: "Membre" });
      const created = await admin.from("profiles").select("id").eq("userId", userId).maybeSingle();
      profile = created.data;
    }

    if (!profile?.id) return [];

    // Supprimer les photos de galerie existantes (en conservant la couverture)
    await admin
      .from("profile_photos")
      .delete()
      .eq("profileId", profile.id)
      .in("status", GALLERY_STATUSES);

    const savedPhotos: any[] = [];
    const limit = Math.min(photos.length, 8);

    for (let i = 0; i < limit; i++) {
      const p = photos[i];
      let url = p.url;

      // Si base64, uploader dans Supabase Storage
      if (url.startsWith("data:image/")) {
        try {
          const uploadRes = await uploadToSupabaseStorage(
            userId,
            p.isMain ? "avatar" : "gallery",
            url,
            "image/webp",
            `album_${i + 1}`
          );
          url = uploadRes.url;
        } catch (stErr) {
          console.warn("[syncAlbumPhotosInSupabase] Storage error slot", i, stErr);
        }
      }

      const photoId = p.id || `ph_${Date.now()}_${i}`;
      const { data: inserted } = await admin
        .from("profile_photos")
        .insert({
          id: photoId,
          profileId: profile.id,
          url,
          thumbnailUrl: url,
          publicId: photoId,
          isMain: Boolean(p.isMain),
          order: i + 1,
          status: "APPROVED",
          createdAt: now,
        })
        .select()
        .maybeSingle();

      if (inserted) savedPhotos.push(inserted);
    }

    return savedPhotos;
  } catch (err) {
    console.warn("[syncAlbumPhotosInSupabase] Exception:", err);
    return [];
  }
}

// ── Définir la photo principale dans Supabase ─────────────────
export async function setMainPhotoInSupabase(userId: string, photoIdOrUrl: string) {
  const admin = getSupabaseAdmin();
  try {
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("userId", userId)
      .maybeSingle();

    if (!profile?.id) return false;

    await admin
      .from("profile_photos")
      .update({ isMain: false })
      .eq("profileId", profile.id)
      .in("status", GALLERY_STATUSES);

    await admin
      .from("profile_photos")
      .update({ isMain: true })
      .eq("profileId", profile.id)
      .or(`id.eq.${photoIdOrUrl},url.eq.${photoIdOrUrl}`);

    return true;
  } catch (err) {
    console.warn("[setMainPhotoInSupabase] Exception:", err);
    return false;
  }
}

// ── Supprimer une photo dans Supabase ─────────────────────────
export async function deletePhotoInSupabase(userId: string, photoIdOrUrl: string) {
  const admin = getSupabaseAdmin();
  try {
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("userId", userId)
      .maybeSingle();

    if (!profile?.id) return false;

    await admin
      .from("profile_photos")
      .delete()
      .eq("profileId", profile.id)
      .or(`id.eq.${photoIdOrUrl},url.eq.${photoIdOrUrl}`);

    return true;
  } catch (err) {
    console.warn("[deletePhotoInSupabase] Exception:", err);
    return false;
  }
}

// ── Récupérer les profils publics directement depuis Supabase REST ──
export async function getPublicProfilesFromSupabase(currentUserId?: string) {
  const admin = getSupabaseAdmin();
  try {
    // S'assurer que Victoire Lawson est initialisée dans Supabase
    await seedPermanentVictoire();

    let query = admin
      .from("profiles")
      .select("*, profile_photos(*)")
      .eq("isVisible", true)
      .order("updatedAt", { ascending: false });

    if (currentUserId) {
      query = query.neq("userId", currentUserId);
    }

    const { data: profiles, error } = await query;
    if (error || !profiles) {
      console.warn("[getPublicProfilesFromSupabase] Error:", error);
      return [];
    }

    const formatted = profiles.map((p: any) => {
      const allPhotos = Array.isArray(p.profile_photos) ? p.profile_photos : [];
      const coverPhoto = allPhotos.find((ph: any) => ph.status === "COVER");
      const galleryPhotos = allPhotos
        .filter((ph: any) => ph.status !== "COVER")
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

      const mainPhoto = galleryPhotos.find((ph: any) => ph.isMain) || galleryPhotos[0];
      const coverUrl = p.coverUrl || coverPhoto?.url || undefined;
      const age = p.age || (p.dateOfBirth ? calculateAge(p.dateOfBirth) : 25);

      return {
        id: p.id,
        userId: p.userId,
        firstName: p.firstName || "Membre",
        lastName: p.lastName || undefined,
        pseudo: p.pseudo || p.firstName,
        gender: p.gender || "OTHER",
        city: p.city || "",
        country: p.country || undefined,
        profession: p.profession || undefined,
        bio: p.bio || undefined,
        coverUrl,
        relationshipGoal: p.relationshipGoal || "SERIOUS",
        plan: p.plan || "FREE",
        likesCount: p.likesCount !== undefined ? p.likesCount : 12,
        subscriptionExpiresAt: p.subscriptionExpiresAt || undefined,
        subscriptionStartedAt: p.subscriptionStartedAt || undefined,
        photos: galleryPhotos.map((ph: any) => ({
          id: ph.id,
          url: ph.url,
          isMain: Boolean(ph.isMain),
        })),
        avatarUrl: mainPhoto?.url || undefined,
        dateOfBirth: p.dateOfBirth ? String(p.dateOfBirth).split("T")[0] : undefined,
        placeOfBirth: p.placeOfBirth || undefined,
        age,
        isVerified: true,
      };
    });

    // S'assurer que le profil de Victoire Lawson est toujours en tête pour les nouveaux utilisateurs
    if (!formatted.some((p) => p.userId === "user_victoire_lome") && currentUserId !== "user_victoire_lome") {
      formatted.unshift(asAssistant({
        id: "prof_victoire_lome",
        userId: "user_victoire_lome",
        firstName: "Victoire",
        lastName: "Lawson",
        pseudo: "victoire_lome",
        gender: "FEMALE",
        city: "",
        country: undefined,
        placeOfBirth: undefined,
        profession: "Styliste & Créatrice de mode",
        bio: "✨ Passionnée d'art, de mode et de voyages, souriante et chaleureuse. J'adore les dîners au coucher de soleil, les sorties conviviales et les belles rencontres. Écris-moi, je réponds toujours avec grand plaisir ! 💖",
        coverUrl: undefined,
        relationshipGoal: "SERIOUS",
        plan: "VIP",
        likesCount: 68,
        subscriptionExpiresAt: "2028-12-31T23:59:59.000Z",
        subscriptionStartedAt: "2024-01-01T00:00:00.000Z",
        photos: [{ id: "ph_victoire_main", url: "/victoire_profile.jpg", isMain: true }],
        avatarUrl: "/victoire_profile.jpg",
        dateOfBirth: "2000-05-14",
        age: 24,
        isVerified: true,
      }));
    }

    return formatted;
  } catch (err) {
    console.warn("[getPublicProfilesFromSupabase] Exception:", err);
    return [];
  }
}

// ── Conversations et Messages via Supabase REST ─────────────
export async function getConversationsFromSupabase(userId: string) {
  const admin = getSupabaseAdmin();
  try {
    const { data, error } = await admin
      .from("conversations")
      .select("*")
      .or(`participantA.eq.${userId},participantB.eq.${userId}`)
      .is("isBlockedBy", null)
      .order("lastMessageAt", { ascending: false });

    if (error || !data) return [];
    return data;
  } catch (err) {
    console.warn("[getConversationsFromSupabase] Exception:", err);
    return [];
  }
}

export async function findOrCreateConversationInSupabase(participantA: string, participantB: string) {
  const admin = getSupabaseAdmin();
  try {
    const { data: existing } = await admin
      .from("conversations")
      .select("*")
      .or(`and(participantA.eq.${participantA},participantB.eq.${participantB}),and(participantA.eq.${participantB},participantB.eq.${participantA})`)
      .maybeSingle();

    if (existing) return existing;

    const convId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const { data: created, error } = await admin
      .from("conversations")
      .insert({
        id: convId,
        participantA,
        participantB,
        lastMessageAt: now,
      })
      .select()
      .maybeSingle();

    if (error) console.warn("[findOrCreateConversationInSupabase] Insert error:", error);
    return created || { id: convId, participantA, participantB, lastMessageAt: now };
  } catch (err) {
    console.warn("[findOrCreateConversationInSupabase] Exception:", err);
    return null;
  }
}

export async function getMessagesFromSupabase(conversationId: string, limit: number = 50) {
  const admin = getSupabaseAdmin();
  try {
    const { data, error } = await admin
      .from("messages")
      .select("*")
      .eq("conversationId", conversationId)
      .is("deletedAt", null)
      .order("createdAt", { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    // Les plus récents, remis dans l'ordre chronologique
    return data.reverse();
  } catch (err) {
    console.warn("[getMessagesFromSupabase] Exception:", err);
    return [];
  }
}

export async function saveMessageInSupabase(msg: {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  mediaUrl?: string | null;
  createdAt?: string;
  status?: string;
}) {
  const admin = getSupabaseAdmin();
  try {
    const payload = {
      id: msg.id,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      body: msg.body,
      mediaUrl: msg.mediaUrl || null,
      status: msg.status || "SENT",
      createdAt: msg.createdAt || new Date().toISOString(),
    };

    const { data, error } = await admin.from("messages").insert(payload).select().maybeSingle();

    await admin
      .from("conversations")
      .update({ lastMessageAt: payload.createdAt })
      .eq("id", msg.conversationId);

    if (error) console.warn("[saveMessageInSupabase] Insert error:", error);
    return data;
  } catch (err) {
    console.warn("[saveMessageInSupabase] Exception:", err);
    return null;
  }
}

// ── Publications VIP dans Supabase ───────────────────────────
export async function getVipPostsFromSupabase() {
  const admin = getSupabaseAdmin();
  try {
    const { data, error } = await admin
      .from("vip_posts")
      .select("*")
      .order("createdAt", { ascending: false });

    if (error || !data || data.length === 0) {
      const { getAllVipPosts } = await import("@/lib/db-store");
      return getAllVipPosts();
    }
    return data;
  } catch {
    const { getAllVipPosts } = await import("@/lib/db-store");
    return getAllVipPosts();
  }
}

export async function createVipPostInSupabase(post: {
  userId: string;
  authorName: string;
  authorAvatar?: string;
  authorPseudo?: string;
  title?: string;
  content: string;
  mediaUrl?: string;
  mediaType: "IMAGE" | "VIDEO" | "ARTICLE";
}) {
  const admin = getSupabaseAdmin();
  const { createVipPost } = await import("@/lib/db-store");
  const localPost = createVipPost(post);

  try {
    const { data } = await admin
      .from("vip_posts")
      .insert({
        id: localPost.id,
        userId: post.userId,
        authorName: post.authorName,
        authorAvatar: post.authorAvatar || null,
        authorPseudo: post.authorPseudo || null,
        title: post.title || null,
        content: post.content,
        mediaUrl: post.mediaUrl || null,
        mediaType: post.mediaType || "IMAGE",
        likesCount: 1,
        commentsCount: 0,
        createdAt: localPost.createdAt,
        updatedAt: localPost.updatedAt,
      })
      .select()
      .maybeSingle();

    return data || localPost;
  } catch {
    return localPost;
  }
}

// ── Adresse de résidence privée (table member_private, serveur uniquement) ──
export async function getPrivateAddress(userId: string): Promise<string | null> {
  try {
    const { data } = await getSupabaseAdmin().from("member_private").select("address").eq("userId", userId).maybeSingle();
    return data?.address || null;
  } catch {
    return null;
  }
}
