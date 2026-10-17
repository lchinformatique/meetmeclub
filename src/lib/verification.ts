// src/lib/verification.ts
// Vérification obligatoire des membres, selon leur formule :
//  · Essai gratuit       → selfie pris EN DIRECT avec un geste imposé, contrôlé par l'équipe
//  · Packs 3 000 / 6 000 → pièce d'identité, pré-contrôlée par IA (approuvée automatiquement
//                          si tout concorde, sinon contrôlée par l'équipe)
//  · VIP                 → vidéo en direct contrôlée par l'équipe (débloque les appels)
// Un membre est « vérifié » (visible, peut écrire, liker, réserver) dès qu'UNE de ces
// vérifications est approuvée. Les appels VIP demandent en plus la vidéo approuvée.

import { getSupabaseAdmin } from "./supabase-server";
import { getAdminUserIds } from "./admin-auth";
import { VICTOIRE_USER_ID } from "./victoire-bot";
// Statuts des photos d'album (la colonne n'accepte pas « COVER » : un filtre neq("COVER") échouait toujours)
const GALLERY_STATUSES = ["PENDING", "APPROVED", "REJECTED"];

export type VerificationStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED";
export type VerificationKind = "selfie" | "document" | "video";

export const SELFIE_BUCKET = "verification-selfies";
export const DOCUMENT_BUCKET = "verification-documents";
export const VIDEO_BUCKET = "verification-videos";

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

/** Pièces acceptées (toute pièce officielle avec photo) */
export const DOCUMENT_TYPES: Record<string, string> = {
  CNI: "Carte nationale d'identité",
  PASSPORT: "Passeport",
  DRIVING_LICENSE: "Permis de conduire",
  VOTER_CARD: "Carte d'électeur",
  STUDENT_CARD: "Carte d'étudiant",
  CONSULAR_CARD: "Carte consulaire",
  RESIDENCE_PERMIT: "Titre / carte de séjour",
  PROFESSIONAL_CARD: "Carte professionnelle",
  OTHER: "Autre pièce officielle avec photo",
};

export function randomGesture(exclude?: string | null): string {
  const keys = Object.keys(GESTURES).filter((k) => k !== exclude);
  return keys[Math.floor(Math.random() * keys.length)];
}

/** Code à 4 chiffres à prononcer dans la vidéo (preuve qu'elle est enregistrée en direct) */
export function randomVideoCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export interface VerificationState {
  /** false tant que la migration v4 n'a pas été exécutée */
  configured: boolean;
  /** false tant que la migration v5 (pièce + vidéo) n'a pas été exécutée */
  docsConfigured: boolean;
  profileId: string | null;
  hasProfilePhoto: boolean;
  selfie: { status: VerificationStatus; gesture: string | null; note: string | null; submittedAt: string | null };
  document: { status: VerificationStatus; type: string | null; note: string | null; reviewedBy: string | null };
  video: { status: VerificationStatus; code: string | null; note: string | null };
}

/** Colonne absente (migration non exécutée) */
export function isMissingColumn(error: any): boolean {
  if (!error) return false;
  const msg = `${error.code || ""} ${error.message || ""}`;
  return error.code === "42703" || error.code === "PGRST204" || /column/i.test(msg);
}

const asStatus = (s: unknown): VerificationStatus =>
  s === "PENDING" || s === "APPROVED" || s === "REJECTED" ? s : "NONE";

export async function getVerificationState(userId: string): Promise<VerificationState> {
  const admin = getSupabaseAdmin();
  const state: VerificationState = {
    configured: true,
    docsConfigured: true,
    profileId: null,
    hasProfilePhoto: false,
    selfie: { status: "NONE", gesture: null, note: null, submittedAt: null },
    document: { status: "NONE", type: null, note: null, reviewedBy: null },
    video: { status: "NONE", code: null, note: null },
  };

  const { data, error } = await admin
    .from("profiles")
    .select('id, "verificationStatus", "verificationGesture", "verificationNote", "verificationSubmittedAt"')
    .eq("userId", userId)
    .maybeSingle();
  if (error) {
    if (isMissingColumn(error)) return { ...state, configured: false, docsConfigured: false };
    throw error;
  }
  if (!data) return state;

  state.profileId = data.id;
  state.selfie = {
    status: asStatus(data.verificationStatus),
    gesture: data.verificationGesture || null,
    note: data.verificationNote || null,
    submittedAt: data.verificationSubmittedAt || null,
  };

  const [{ data: docs, error: docsError }, { count }] = await Promise.all([
    admin
      .from("profiles")
      .select('"idDocStatus", "idDocType", "idDocNote", "idDocReviewedBy", "videoStatus", "videoCode", "videoNote"')
      .eq("id", data.id)
      .maybeSingle(),
    admin.from("profile_photos").select("id", { count: "exact", head: true }).eq("profileId", data.id).in("status", GALLERY_STATUSES),
  ]);
  state.hasProfilePhoto = (count || 0) > 0;

  if (docsError) {
    if (isMissingColumn(docsError)) state.docsConfigured = false;
    else throw docsError;
  } else if (docs) {
    state.document = {
      status: asStatus(docs.idDocStatus),
      type: docs.idDocType || null,
      note: docs.idDocNote || null,
      reviewedBy: docs.idDocReviewedBy || null,
    };
    state.video = { status: asStatus(docs.videoStatus), code: docs.videoCode || null, note: docs.videoNote || null };
  }
  return state;
}

/** Au moins une vérification approuvée */
export function isStateVerified(s: VerificationState): boolean {
  return !s.configured || s.selfie.status === "APPROVED" || s.document.status === "APPROVED" || s.video.status === "APPROVED";
}

// ── Contrôle d'accès (appelé par les routes d'échanges) ────────────────
const cache = new Map<string, { verified: boolean; video: boolean; at: number }>();

async function access(userId: string): Promise<{ verified: boolean; video: boolean }> {
  if (userId === VICTOIRE_USER_ID) return { verified: true, video: false };
  const hit = cache.get(userId);
  if (hit && Date.now() - hit.at < 30_000) return hit;

  let value = { verified: false, video: false };
  try {
    if ((await getAdminUserIds()).includes(userId)) {
      value = { verified: true, video: true };
    } else {
      const s = await getVerificationState(userId);
      value = {
        verified: isStateVerified(s),
        // Migration v5 pas encore exécutée : les appels ne sont pas encore soumis à la vidéo
        video: !s.configured || !s.docsConfigured || s.video.status === "APPROVED",
      };
    }
  } catch (err) {
    console.warn("[verification access]", err);
  }
  cache.set(userId, { ...value, at: Date.now() });
  return value;
}

/** Membre autorisé à échanger (visible, messages, likes, rendez-vous) */
export async function isMemberVerified(userId: string): Promise<boolean> {
  return (await access(userId)).verified;
}

/** Membre autorisé à passer des appels (vidéo de vérification VIP approuvée) */
export async function isVideoVerified(userId: string): Promise<boolean> {
  return (await access(userId)).video;
}

export function forgetVerificationCache(userId: string) {
  cache.delete(userId);
}

/** Réponse standard renvoyée par l'API quand un membre non vérifié tente d'échanger */
export const NOT_VERIFIED_ERROR = {
  error:
    "Vérification de votre profil requise : faites votre vérification. Vous pourrez échanger dès qu'elle sera validée.",
  code: "VERIFICATION_REQUIRED",
  redirect: "/verification",
};

export const VIDEO_REQUIRED_ERROR = {
  error: "Appels réservés aux membres VIP dont la vidéo de vérification a été validée.",
  code: "VIDEO_VERIFICATION_REQUIRED",
  redirect: "/verification",
};

/**
 * Identifiants des membres vérifiés (affichables dans la découverte).
 * null = migration v4 pas encore exécutée (pas de filtrage possible).
 */
export async function getApprovedUserIds(): Promise<Set<string> | null> {
  const admin = getSupabaseAdmin();
  let { data, error } = await admin
    .from("profiles")
    .select("userId")
    .or("verificationStatus.eq.APPROVED,idDocStatus.eq.APPROVED,videoStatus.eq.APPROVED");
  if (error && isMissingColumn(error)) {
    // Migration v5 absente : seul le selfie compte
    ({ data, error } = await admin.from("profiles").select("userId").eq("verificationStatus", "APPROVED"));
    if (error && isMissingColumn(error)) return null;
  }
  if (error) {
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

// ── Stockage privé (selfies, pièces, vidéos) ───────────────────────────
const BUCKETS: Record<string, { mime: string[]; size: number }> = {
  [SELFIE_BUCKET]: { mime: ["image/jpeg"], size: 5 * 1024 * 1024 },
  [DOCUMENT_BUCKET]: { mime: ["image/jpeg"], size: 5 * 1024 * 1024 },
  [VIDEO_BUCKET]: { mime: ["video/webm", "video/mp4"], size: 10 * 1024 * 1024 },
};
const readyBuckets = new Set<string>();

async function ensureBucket(bucket: string) {
  if (readyBuckets.has(bucket)) return;
  const admin = getSupabaseAdmin();
  const { data } = await admin.storage.getBucket(bucket);
  if (!data) {
    const { error } = await admin.storage.createBucket(bucket, {
      public: false,
      fileSizeLimit: BUCKETS[bucket].size,
      allowedMimeTypes: BUCKETS[bucket].mime,
    });
    if (error && !/already exists/i.test(error.message)) throw error;
  }
  readyBuckets.add(bucket);
}

export async function storePrivateFile(bucket: string, userId: string, body: Buffer, contentType: string, name: string) {
  await ensureBucket(bucket);
  const safeId = userId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const ext = contentType === "video/mp4" ? "mp4" : contentType === "video/webm" ? "webm" : "jpg";
  const path = `${safeId}/${Date.now()}_${name}.${ext}`;
  const { error } = await getSupabaseAdmin().storage.from(bucket).upload(path, body, { contentType, upsert: false });
  if (error) throw error;
  return path;
}

export async function storeSelfie(userId: string, jpeg: Buffer): Promise<string> {
  return storePrivateFile(SELFIE_BUCKET, userId, jpeg, "image/jpeg", "selfie");
}

/** Lien temporaire (1 h) pour que l'administrateur voie un fichier privé */
export async function signedUrl(bucket: string, path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  const { data } = await getSupabaseAdmin().storage.from(bucket).createSignedUrl(path, 3600);
  return data?.signedUrl || null;
}

export async function signedSelfieUrl(path: string | null | undefined): Promise<string | null> {
  return signedUrl(SELFIE_BUCKET, path);
}
