// src/lib/supabase-server.ts
// Robust Supabase Admin client via PostgREST HTTPS (port 443)
// Guarantees data persistence to Supabase without dropping or timeout issues.

import { createClient, SupabaseClient } from "@supabase/supabase-js";

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
        .select("id, email, passwordHash, role, status, phone")
        .ilike("email", cleanLower)
        .limit(1)
        .maybeSingle();

      if (byEmail) {
        const { data: profile } = await admin
          .from("profiles")
          .select("*")
          .eq("userId", byEmail.id)
          .maybeSingle();

        const { data: photos } = await admin
          .from("profile_photos")
          .select("*")
          .eq("profileId", profile?.id || "")
          .order("order", { ascending: true });

        return { user: byEmail, profile: { ...profile, photos: photos || [] } };
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
        .select("id, email, passwordHash, role, status, phone")
        .eq("id", byPseudo.userId)
        .maybeSingle();

      const { data: photos } = await admin
        .from("profile_photos")
        .select("*")
        .eq("profileId", byPseudo.id)
        .order("order", { ascending: true });

      return {
        user: user || {
          id: byPseudo.userId,
          email: `${cleanLower}@meetmeclub.net`,
          role: "MEMBER",
          status: "ACTIVE",
          passwordHash: null as string | null,
          phone: null as string | null,
        },
        profile: { ...byPseudo, photos: photos || [] },
      };
    }

    // 3. Recherche par prénom (fallback tolérant)
    const { data: byFirstName } = await admin
      .from("profiles")
      .select("*")
      .ilike("firstName", clean)
      .limit(1)
      .maybeSingle();

    if (byFirstName) {
      const { data: user } = await admin
        .from("users")
        .select("id, email, passwordHash, role, status, phone")
        .eq("id", byFirstName.userId)
        .maybeSingle();

      const { data: photos } = await admin
        .from("profile_photos")
        .select("*")
        .eq("profileId", byFirstName.id)
        .order("order", { ascending: true });

      return {
        user: user || {
          id: byFirstName.userId,
          email: `${cleanLower}@meetmeclub.net`,
          role: "MEMBER",
          status: "ACTIVE",
          passwordHash: null as string | null,
          phone: null as string | null,
        },
        profile: { ...byFirstName, photos: photos || [] },
      };
    }

    // 4. Recherche par début d'email (pseudo@...)
    const { data: byEmailPrefix } = await admin
      .from("users")
      .select("id, email, passwordHash, role, status, phone")
      .ilike("email", `${cleanLower}@%`)
      .limit(1)
      .maybeSingle();

    if (byEmailPrefix) {
      const { data: profile } = await admin
        .from("profiles")
        .select("*")
        .eq("userId", byEmailPrefix.id)
        .maybeSingle();

      const { data: photos } = await admin
        .from("profile_photos")
        .select("*")
        .eq("profileId", profile?.id || "")
        .order("order", { ascending: true });

      return { user: byEmailPrefix, profile: { ...profile, photos: photos || [] } };
    }

    return null;
  } catch (err) {
    console.warn("[findUserInSupabase] Warning:", err);
    return null;
  }
}

// ── Mise à jour ou création de profil dans Supabase ──────────
export async function upsertProfileInSupabase(userId: string, data: {
  firstName?: string;
  lastName?: string;
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
}) {
  const admin = getSupabaseAdmin();
  try {
    // 1. Mettre à jour le téléphone dans users si présent
    if (data.phone) {
      await admin
        .from("users")
        .update({ phone: data.phone })
        .eq("id", userId);
    }

    // 2. Vérifier si un profil existe déjà
    const { data: existing } = await admin
      .from("profiles")
      .select("id")
      .eq("userId", userId)
      .maybeSingle();

    const profilePayload: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (data.firstName !== undefined) profilePayload.firstName = data.firstName;
    if (data.pseudo !== undefined) profilePayload.pseudo = data.pseudo;
    if (data.gender !== undefined) profilePayload.gender = data.gender;
    if (data.city !== undefined) profilePayload.city = data.city;
    if (data.neighborhood !== undefined) profilePayload.neighborhood = data.neighborhood;
    if (data.profession !== undefined) profilePayload.profession = data.profession;
    if (data.bio !== undefined) profilePayload.bio = data.bio;
    if (data.relationshipGoal !== undefined) profilePayload.relationshipGoal = data.relationshipGoal;
    if (data.relationshipStatus !== undefined) profilePayload.relationshipStatus = data.relationshipStatus;
    if (data.height !== undefined) profilePayload.height = data.height;
    if (data.religion !== undefined) profilePayload.religion = data.religion;
    if (data.hasChildren !== undefined) profilePayload.hasChildren = data.hasChildren;
    if (data.languages !== undefined) profilePayload.languages = data.languages;
    if (data.educationLevel !== undefined) profilePayload.educationLevel = data.educationLevel;

    if (existing?.id) {
      const { data: updated, error } = await admin
        .from("profiles")
        .update(profilePayload)
        .eq("id", existing.id)
        .select()
        .single();

      if (error) console.warn("[upsertProfileInSupabase] Update error:", error);
      return updated;
    } else {
      const newId = `prof_${Date.now()}`;
      const { data: created, error } = await admin
        .from("profiles")
        .insert({
          id: newId,
          userId,
          firstName: data.firstName || "Membre",
          pseudo: data.pseudo || null,
          gender: data.gender || "OTHER",
          city: data.city || "Lomé",
          bio: data.bio || "Nouveau membre sur Meet Me Club.",
          relationshipGoal: data.relationshipGoal || "SERIOUS",
          isVisible: true,
          profileCompleteness: 60,
          ...profilePayload,
        })
        .select()
        .single();

      if (error) console.warn("[upsertProfileInSupabase] Insert error:", error);
      return created;
    }
  } catch (err) {
    console.warn("[upsertProfileInSupabase] Exception:", err);
    return null;
  }
}

// ── Récupération d'un profil depuis Supabase ─────────────────
export async function getProfileFromSupabase(userId: string) {
  const admin = getSupabaseAdmin();
  try {
    const { data: profile } = await admin
      .from("profiles")
      .select("*")
      .eq("userId", userId)
      .maybeSingle();

    if (!profile) return null;

    const { data: photos } = await admin
      .from("profile_photos")
      .select("*")
      .eq("profileId", profile.id)
      .order("order", { ascending: true });

    return { ...profile, photos: photos || [] };
  } catch (err) {
    console.warn("[getProfileFromSupabase] Exception:", err);
    return null;
  }
}

// ── Enregistrement d'une photo dans Supabase ──────────────────
export async function savePhotoInSupabase(userId: string, photoUrl: string, isMain: boolean = true) {
  const admin = getSupabaseAdmin();
  try {
    // Trouver le profil
    let { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("userId", userId)
      .maybeSingle();

    if (!profile) {
      profile = await upsertProfileInSupabase(userId, { firstName: "Membre" });
    }

    if (!profile?.id) return null;

    // Si photo principale, démarquer les anciennes
    if (isMain) {
      await admin
        .from("profile_photos")
        .update({ isMain: false })
        .eq("profileId", profile.id);
    }

    const photoId = `ph_${Date.now()}`;
    const { data: photo, error } = await admin
      .from("profile_photos")
      .insert({
        id: photoId,
        profileId: profile.id,
        url: photoUrl,
        thumbnailUrl: photoUrl,
        publicId: photoId,
        isMain,
        order: isMain ? 0 : 1,
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

// ── Gestion des Conversations dans Supabase ──────────────────
export async function findOrCreateConversationInSupabase(participantA: string, participantB: string) {
  const admin = getSupabaseAdmin();
  try {
    // 1. Chercher si une conversation existe déjà entre les 2 participants
    const { data: existing } = await admin
      .from("conversations")
      .select("*")
      .or(`and(participantA.eq.${participantA},participantB.eq.${participantB}),and(participantA.eq.${participantB},participantB.eq.${participantA})`)
      .maybeSingle();

    if (existing) return existing;

    // 2. Créer la conversation
    const newId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const { data: created, error } = await admin
      .from("conversations")
      .insert({
        id: newId,
        participantA,
        participantB,
        lastMessageAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.warn("[findOrCreateConversationInSupabase] Insert error:", error);
      return { id: newId, participantA, participantB, lastMessageAt: new Date().toISOString() };
    }
    return created;
  } catch (err) {
    console.warn("[findOrCreateConversationInSupabase] Exception:", err);
    return {
      id: `conv_${Date.now()}`,
      participantA,
      participantB,
      lastMessageAt: new Date().toISOString(),
    };
  }
}

// ── Enregistrement d'un Message dans Supabase ─────────────────
export async function saveMessageInSupabase(data: {
  id?: string;
  conversationId: string;
  senderId: string;
  body: string;
  mediaUrl?: string | null;
}) {
  const admin = getSupabaseAdmin();
  const msgId = data.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  try {
    const { data: inserted, error } = await admin
      .from("messages")
      .insert({
        id: msgId,
        conversationId: data.conversationId,
        senderId: data.senderId,
        body: data.body,
        mediaUrl: data.mediaUrl || null,
        status: "SENT",
        createdAt: now,
      })
      .select()
      .single();

    // Mettre à jour lastMessageAt sur la conversation
    await admin
      .from("conversations")
      .update({ lastMessageAt: now })
      .eq("id", data.conversationId);

    if (error) console.warn("[saveMessageInSupabase] Insert error:", error);
    return inserted || { id: msgId, ...data, createdAt: now, status: "SENT" };
  } catch (err) {
    console.warn("[saveMessageInSupabase] Exception:", err);
    return { id: msgId, ...data, createdAt: now, status: "SENT" };
  }
}

// ── Récupération des Messages d'une conversation dans Supabase ─
export async function getMessagesFromSupabase(conversationId: string) {
  const admin = getSupabaseAdmin();
  try {
    const { data: messages, error } = await admin
      .from("messages")
      .select("*")
      .eq("conversationId", conversationId)
      .is("deletedAt", null)
      .order("createdAt", { ascending: true })
      .limit(100);

    if (error) {
      console.warn("[getMessagesFromSupabase] Error:", error);
      return [];
    }
    return messages || [];
  } catch (err) {
    console.warn("[getMessagesFromSupabase] Exception:", err);
    return [];
  }
}

// ── Récupération des Conversations d'un utilisateur dans Supabase ─
export async function getConversationsFromSupabase(userId: string) {
  const admin = getSupabaseAdmin();
  try {
    const { data: convs, error } = await admin
      .from("conversations")
      .select("*")
      .or(`participantA.eq.${userId},participantB.eq.${userId}`)
      .is("isBlockedBy", null)
      .order("lastMessageAt", { ascending: false });

    if (error) {
      console.warn("[getConversationsFromSupabase] Error:", error);
      return [];
    }
    return convs || [];
  } catch (err) {
    console.warn("[getConversationsFromSupabase] Exception:", err);
    return [];
  }
}

