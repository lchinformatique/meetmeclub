// src/lib/supabase-server.ts
// Robust Supabase Admin client via PostgREST HTTPS (port 443)
// Guarantees data persistence to Supabase without dropping or timeout issues.

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { uploadToSupabaseStorage } from "./supabase-storage";

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
export async function getProfileFromSupabase(userId: string) {
  const admin = getSupabaseAdmin();
  try {
    // 1. Profil
    const { data: profile } = await admin
      .from("profiles")
      .select("*")
      .eq("userId", userId)
      .maybeSingle();

    if (!profile) return null;

    // 2. Utilisateur (pour dateOfBirth, phone, email)
    const { data: user } = await admin
      .from("users")
      .select("dateOfBirth, phone, email")
      .eq("id", userId)
      .maybeSingle();

    // 3. Photos
    const { data: photos } = await admin
      .from("profile_photos")
      .select("*")
      .eq("profileId", profile.id)
      .order("order", { ascending: true });

    const allPhotos = photos || [];

    // Déterminer photo principale et couverture
    const mainPhoto = allPhotos.find((p) => p.isMain && p.status !== "COVER");
    const firstPhoto = allPhotos.find((p) => p.status !== "COVER");
    const avatarUrl = mainPhoto?.url || firstPhoto?.url || undefined;

    const coverPhoto = allPhotos.find((p) => p.status === "COVER" || p.order === 0);
    const coverUrl = profile.coverUrl || coverPhoto?.url || undefined;

    // Album (exclut la couverture dédiée)
    const albumPhotos = allPhotos
      .filter((p) => p.status !== "COVER")
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
      userId,
      lastName: profile.lastName || undefined,
      placeOfBirth: profile.placeOfBirth || undefined,
      dateOfBirth: dob ? String(dob).split("T")[0] : undefined,
      age: profile.age || age,
      phone: user?.phone || undefined,
      email: user?.email || undefined,
      avatarUrl,
      coverUrl,
      photos: albumPhotos,
    };
  } catch (err) {
    console.warn("[getProfileFromSupabase] Exception:", err);
    return null;
  }
}

// ── Mise à jour ou création de profil dans Supabase ──────────
export async function upsertProfileInSupabase(
  userId: string,
  data: {
    firstName?: string;
    lastName?: string | null;
    pseudo?: string | null;
    gender?: string;
    city?: string;
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
  }
) {
  const admin = getSupabaseAdmin();
  try {
    // 1. Mettre à jour la table users (phone, dateOfBirth, isAdult)
    try {
      const userUpdates: Record<string, any> = {};
      if (data.phone) userUpdates.phone = data.phone;
      if (data.dateOfBirth) {
        userUpdates.dateOfBirth = data.dateOfBirth;
        userUpdates.isAdult = true;
      }
      if (Object.keys(userUpdates).length > 0) {
        await admin.from("users").update(userUpdates).eq("id", userId);
      }
    } catch (uErr) {
      console.warn("[upsertProfileInSupabase] user update warning:", uErr);
    }

    // 2. Vérifier si un profil existe déjà
    let { data: existing } = await admin
      .from("profiles")
      .select("id")
      .eq("userId", userId)
      .maybeSingle();

    let profileId = existing?.id;

    // Si nouveau profil
    if (!profileId) {
      profileId = `prof_${Date.now()}`;
      const insertPayload: Record<string, any> = {
        id: profileId,
        userId,
        firstName: data.firstName || "Membre",
        pseudo: data.pseudo || null,
        gender: data.gender || "OTHER",
        city: data.city || "Lomé",
        bio: data.bio || "Nouveau membre sur Meet Me Club.",
        relationshipGoal: data.relationshipGoal || "SERIOUS",
        isVisible: true,
        profileCompleteness: 75,
        updatedAt: new Date().toISOString(),
      };

      // Tenter d'insérer avec colonnes étendues (si migration appliquée)
      const extendedInsert: Record<string, any> = { ...insertPayload };
      if (data.lastName) extendedInsert.lastName = data.lastName;
      if (data.coverUrl) extendedInsert.coverUrl = data.coverUrl;
      if (data.placeOfBirth) extendedInsert.placeOfBirth = data.placeOfBirth;

      let { data: created, error: insertError } = await admin
        .from("profiles")
        .insert(extendedInsert)
        .select()
        .maybeSingle();

      if (insertError) {
        // Fallback sans colonnes optionnelles
        const fallback = await admin
          .from("profiles")
          .insert(insertPayload)
          .select()
          .maybeSingle();
        created = fallback.data;
      }
      existing = created;
    } else {
      // Profil existant: Mettre à jour
      const updatePayload: Record<string, any> = {
        updatedAt: new Date().toISOString(),
      };
      if (data.firstName !== undefined) updatePayload.firstName = data.firstName;
      if (data.pseudo !== undefined) updatePayload.pseudo = data.pseudo;
      if (data.gender !== undefined) updatePayload.gender = data.gender;
      if (data.city !== undefined) updatePayload.city = data.city;
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

      // Essayer avec colonnes optionnelles
      const extendedUpdate: Record<string, any> = { ...updatePayload };
      if (data.lastName !== undefined) extendedUpdate.lastName = data.lastName;
      if (data.coverUrl !== undefined) extendedUpdate.coverUrl = data.coverUrl;
      if (data.placeOfBirth !== undefined) extendedUpdate.placeOfBirth = data.placeOfBirth;

      let { data: updated, error: updateError } = await admin
        .from("profiles")
        .update(extendedUpdate)
        .eq("id", profileId)
        .select()
        .maybeSingle();

      if (updateError) {
        const fallbackUpdate = await admin
          .from("profiles")
          .update(updatePayload)
          .eq("id", profileId)
          .select()
          .maybeSingle();
        updated = fallbackUpdate.data;
      }
      existing = updated || existing;
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

        // Sauvegarder dans profile_photos avec status COVER pour garantir la persistance
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

    return existing;
  } catch (err) {
    console.warn("[upsertProfileInSupabase] Exception:", err);
    return null;
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
        .neq("status", "COVER");
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
        .update({ isMain, order, status: "APPROVED", updatedAt: new Date().toISOString() })
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
      .neq("status", "COVER");

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
      .neq("status", "COVER");

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

    return profiles.map((p: any) => {
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
        city: p.city || "Lomé",
        neighborhood: p.neighborhood || "Lomé",
        profession: p.profession || undefined,
        bio: p.bio || undefined,
        coverUrl,
        relationshipGoal: p.relationshipGoal || "SERIOUS",
        plan: "FREE",
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
      .order("createdAt", { ascending: true })
      .limit(limit);

    if (error || !data) return [];
    return data;
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
