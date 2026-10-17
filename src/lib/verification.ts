// src/lib/verification.ts
// Vérification faciale obligatoire des membres : selfie pris EN DIRECT avec un geste imposé
// au hasard, stocké dans un espace privé, puis contrôlé à la main par l'administrateur
// (comparaison avec les photos du profil). Tant qu'un membre n'est pas APPROVED, il n'apparaît
// pas dans la découverte et ne peut ni écrire, ni appeler, ni liker, ni réserver.

import { getSupabaseAdmin } from "./supabase-server";
import { getAdminUserIds } from "./admin-auth";
import { VICTOIRE_USER_ID } from "./victoire-bot";

export type VerificationStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED";

export const SELFIE_BUCKET = "verification-selfies";

/** Gestes demandés au hasard : impossibles à reproduire avec une photo trouvée sur Internet */
export const GESTURES: Record<string, string> = {
  V_SIGN: "Faites le signe V avec deux doigts à côté de votre visage",
  THUMB_UP: "Levez le pouce à côté de votre visage",
  OPEN_HAND: "Montrez votre main ouverte à côté de votre visage",
  THREE_FINGERS: "Montrez trois doigts à côté de votre visage",
  HAND_ON_HEAD: "Posez une main sur le haut de votre tête",
  TOUCH_EAR: "Touchez votre oreille avec un doigt",
  HAND_ON_CHIN: "Posez votre main sous votre menton",
  OK_SIGN: "Faites le signe OK avec la main à côté de votre visage",
};

export function randomGesture(exclude?: string | null): string {
  const keys = Object.keys(GESTURES).filter((k) => k !== exclude);
  return keys[Math.floor(Math.random() * keys.length)];
}

export interface VerificationState {
  /** false tant que la migration SQL v4 n'a pas été exécutée dans Supabase */
  configured: boolean;
  status: VerificationStatus;
  gesture: string | null;
  note: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  hasProfilePhoto: boolean;
  profileId: string | null;
}

const COLUMNS =
  'id, "verificationStatus", "verificationGesture", "verificationNote", "verificationSubmittedAt", "verificationReviewedAt"';

/** Colonne absente (migration non exécutée) */
export function isMissingColumn(error: any): boolean {
  if (!error) return false;
  const msg = `${error.code || ""} ${error.message || ""}`;
  return error.code === "42703" || error.code === "PGRST204" || /column|verificationStatus/i.test(msg);
}

export async function getVerificationState(userId: string): Promise<VerificationState> {
  const admin = getSupabaseAdmin();
  const base: VerificationState = {
    configured: true,
    status: "NONE",
    gesture: null,
    note: null,
    submittedAt: null,
    reviewedAt: null,
    hasProfilePhoto: false,
    profileId: null,
  };

  const { data, error } = await admin.from("profiles").select(COLUMNS).eq("userId", userId).maybeSingle();
  if (error) {
    if (isMissingColumn(error)) return { ...base, configured: false };
    throw error;
  }
  if (!data) return base;

  const { count } = await admin
    .from("profile_photos")
    .select("id", { count: "exact", head: true })
    .eq("profileId", data.id)
    .neq("status", "COVER");

  return {
    ...base,
    profileId: data.id,
    status: (data.verificationStatus as VerificationStatus) || "NONE",
    gesture: data.verificationGesture || null,
    note: data.verificationNote || null,
    submittedAt: data.verificationSubmittedAt || null,
    reviewedAt: data.verificationReviewedAt || null,
    hasProfilePhoto: (count || 0) > 0,
  };
}

// ── Contrôle d'accès (appelé par les routes d'échanges) ────────────────
const verifiedCache = new Map<string, { value: boolean; at: number }>();

/** Membre autorisé à échanger : validé par l'administrateur, ou administrateur lui-même */
export async function isMemberVerified(userId: string): Promise<boolean> {
  if (userId === VICTOIRE_USER_ID) return true;
  const cached = verifiedCache.get(userId);
  if (cached && Date.now() - cached.at < 30_000) return cached.value;

  let value = false;
  try {
    const adminIds = await getAdminUserIds();
    if (adminIds.includes(userId)) {
      value = true;
    } else {
      const state = await getVerificationState(userId);
      // Migration pas encore exécutée : on ne bloque pas tout le site
      value = !state.configured || state.status === "APPROVED";
    }
  } catch (err) {
    console.warn("[isMemberVerified]", err);
    value = false;
  }
  verifiedCache.set(userId, { value, at: Date.now() });
  return value;
}

export function forgetVerificationCache(userId: string) {
  verifiedCache.delete(userId);
}

/** Réponse standard renvoyée par l'API quand un membre non vérifié tente d'échanger */
export const NOT_VERIFIED_ERROR = {
  error:
    "Vérification de votre visage requise : prenez votre selfie de contrôle. Vous pourrez échanger dès que l'équipe Meet Me Club l'aura validé.",
  code: "VERIFICATION_REQUIRED",
  redirect: "/verification",
};

/**
 * Identifiants des membres validés (affichables dans la découverte).
 * null = migration pas encore exécutée (pas de filtrage possible).
 */
export async function getApprovedUserIds(): Promise<Set<string> | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from("profiles").select("userId").eq("verificationStatus", "APPROVED");
  if (error) {
    if (isMissingColumn(error)) return null;
    console.warn("[getApprovedUserIds]", error);
    return new Set([VICTOIRE_USER_ID]);
  }
  const ids = new Set<string>((data || []).map((p: any) => p.userId));
  ids.add(VICTOIRE_USER_ID);
  try {
    (await getAdminUserIds()).forEach((id) => ids.add(id));
  } catch {}
  return ids;
}

// ── Stockage privé des selfies ─────────────────────────────────────────
let bucketReady = false;

async function ensureSelfieBucket() {
  if (bucketReady) return;
  const admin = getSupabaseAdmin();
  const { data } = await admin.storage.getBucket(SELFIE_BUCKET);
  if (!data) {
    const { error } = await admin.storage.createBucket(SELFIE_BUCKET, {
      public: false,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: ["image/jpeg"],
    });
    if (error && !/already exists/i.test(error.message)) throw error;
  }
  bucketReady = true;
}

export async function storeSelfie(userId: string, jpeg: Buffer): Promise<string> {
  await ensureSelfieBucket();
  const admin = getSupabaseAdmin();
  const safeId = userId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const path = `${safeId}/${Date.now()}.jpg`;
  const { error } = await admin.storage.from(SELFIE_BUCKET).upload(path, jpeg, {
    contentType: "image/jpeg",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

/** Lien temporaire (1 h) pour que l'administrateur voie le selfie */
export async function signedSelfieUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  const { data } = await getSupabaseAdmin().storage.from(SELFIE_BUCKET).createSignedUrl(path, 3600);
  return data?.signedUrl || null;
}
