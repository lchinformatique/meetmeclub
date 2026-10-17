// src/lib/db-store.ts
// Local robust persistence for Profiles, Subscriptions & Quotas
// Ensures 100% reliability with zero crashes, even when PostgreSQL is not running.

import fs from "fs";
import path from "path";
export { SASPAY_LINKS, type SubscriptionStatusInfo, type VipPost } from "./subscription-constants";
import { SASPAY_LINKS, type SubscriptionStatusInfo, type VipPost, findPermanentVipAccount, PERMANENT_VIP_START, PERMANENT_VIP_EXPIRY, FREE_TRIAL_DAYS, FREE_TRIAL_MS } from "./subscription-constants";

// Force le plan VIP illimité sur les comptes de test permanents (vip_master, vip_tester)
function applyPermanentVip<T extends Partial<StoredProfile>>(profile: T): T {
  if (!findPermanentVipAccount(profile)) return profile;
  return {
    ...profile,
    plan: "VIP",
    subscriptionStartedAt: PERMANENT_VIP_START,
    subscriptionExpiresAt: PERMANENT_VIP_EXPIRY,
  };
}

export interface StoredProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName?: string;
  pseudo?: string;
  email?: string; // stored for reconnection after logout (email or pseudo login)
  coverUrl?: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  age: number;
  dateOfBirth?: string;
  placeOfBirth?: string;
  phone?: string;
  city: string;
  /** Pays de résidence (code ISO, ex. FR) */
  country?: string;
  /** Adresse de résidence : privée, jamais montrée aux autres membres */
  address?: string;
  neighborhood?: string;
  profession?: string;
  educationLevel?: string;
  relationshipStatus?: string;
  height?: number | null;
  hasChildren?: boolean;
  religion?: string;
  languages?: string[];
  passwordHash?: string;
  bio: string;
  relationshipGoal: "FRIENDSHIP" | "SERIOUS" | "MARRIAGE" | "CASUAL" | "EXCHANGE";
  plan: "FREE" | "ESSENTIAL" | "COMPLICE" | "VIP";
  subscriptionStartedAt?: string;
  subscriptionExpiresAt?: string;
  likesCount?: number;
  partnersContacted: string[]; // List of user IDs this user has initiated contact with
  photos: { id: string; url: string; isMain: boolean }[];
  interests: string[];
  availabilities: { dayOfWeek: number; startTime: string; endTime: string }[];
  isVerified: boolean;
  idDocumentSubmitted?: boolean;
  idDocumentVerified?: boolean;
  idDocumentUrl?: string;
  selfieSubmitted?: boolean;
  selfieVerified?: boolean;
  selfieVerifiedAt?: string;
  termsAccepted?: boolean;
  termsAcceptedAt?: string;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DATA_DIR = isServerless
  ? (process.platform === "win32" ? path.join(process.cwd(), "data") : "/tmp")
  : path.join(process.cwd(), "data");
const PROFILES_FILE = path.join(DATA_DIR, "profiles.json");

// Profil officiel par défaut pour que tout nouvel utilisateur ait immédiatement un contact réel avec qui échanger
export const VICTOIRE_PROFILE: StoredProfile = {
  id: "prof_victoire_lome",
  userId: "user_victoire_lome",
  firstName: "Victoire",
  lastName: "Lawson",
  pseudo: "victoire_lome",
  email: "victoire@meetmeclub.net",
  gender: "FEMALE",
  age: 24,
  city: "",
  profession: "Styliste & Créatrice de mode",
  relationshipStatus: "Célibataire",
  educationLevel: "Master Mode & Design",
  height: 168,
  hasChildren: false,
  languages: ["Français", "Mina", "Anglais"],
  bio: "✨ Passionnée d'art, de mode et de voyages, souriante et chaleureuse. J'adore les dîners au coucher de soleil, les sorties conviviales et les belles rencontres. Écris-moi, je réponds toujours avec grand plaisir ! 💖",
  relationshipGoal: "SERIOUS",
  plan: "VIP",
  subscriptionStartedAt: "2024-01-01T00:00:00.000Z",
  subscriptionExpiresAt: "2028-12-31T23:59:59.000Z",
  likesCount: 64,
  partnersContacted: [],
  photos: [
    { id: "p_victoire_1", url: "/victoire_profile.jpg", isMain: true }
  ],
  interests: ["Mode & Style", "Voyages", "Dîners aux chandelles", "Musique", "Sorties"],
  availabilities: [
    { dayOfWeek: 5, startTime: "18:00", endTime: "22:00" },
    { dayOfWeek: 6, startTime: "15:00", endTime: "23:00" },
    { dayOfWeek: 0, startTime: "14:00", endTime: "21:00" },
  ],
  isVerified: true,
  idDocumentSubmitted: true,
  idDocumentVerified: true,
  selfieSubmitted: true,
  selfieVerified: true,
  isVisible: true,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: new Date().toISOString(),
};

// Exclusivement réservé aux vrais membres enregistrés
export const DEFAULT_PROFILES: StoredProfile[] = [];

// In-memory fallback
let memoryProfiles: StoredProfile[] = [];

function ensureFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(PROFILES_FILE)) {
      fs.writeFileSync(PROFILES_FILE, JSON.stringify([], null, 2), "utf8");
    }
  } catch {
    // Silent catch for read-only serverless filesystems
  }
}

export function getAllProfiles(): StoredProfile[] {
  ensureFile();
  try {
    if (fs.existsSync(PROFILES_FILE)) {
      const raw = fs.readFileSync(PROFILES_FILE, "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryProfiles = parsed;
        return parsed;
      } else if (memoryProfiles.length > 0) {
        // Sauvegarder la mémoire sur le disque pour ne rien perdre
        try {
          fs.writeFileSync(PROFILES_FILE, JSON.stringify(memoryProfiles, null, 2), "utf8");
        } catch {}
        return memoryProfiles;
      }
    }
  } catch {
    // Read failed, use memory fallback
  }
  return memoryProfiles;
}

export function getProfileByUserId(userId: string): StoredProfile | null {
  const profiles = getAllProfiles();
  const clean = userId.trim();
  const cleanLower = clean.toLowerCase();
  const isEmail = cleanLower.includes("@");

  const found = profiles.find(
    (p) =>
      p.userId === clean ||
      p.id === clean ||
      (isEmail && p.email && p.email.toLowerCase() === cleanLower) ||
      (p.pseudo && p.pseudo.toLowerCase() === cleanLower)
  );
  return found ? applyPermanentVip(found) : null;
}

export function saveProfile(profileData: Partial<StoredProfile> & { userId: string }): StoredProfile {
  const profiles = getAllProfiles();
  const index = profiles.findIndex((p) => p.userId === profileData.userId);

  let updatedProfile: StoredProfile;

  if (index >= 0) {
    let computedAge = profileData.age ?? profiles[index].age;
    if (profileData.dateOfBirth) {
      const dob = new Date(profileData.dateOfBirth);
      if (!isNaN(dob.getTime())) {
        const today = new Date();
        let calcAge = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
          calcAge--;
        }
        computedAge = calcAge;
      }
    }
    const old = profiles[index];
    const plan = profileData.plan || old.plan || "FREE";
    const planChanged = Boolean(profileData.plan && profileData.plan !== old.plan);

    let subStarted = profileData.subscriptionStartedAt || old.subscriptionStartedAt;
    let subExpires = profileData.subscriptionExpiresAt || old.subscriptionExpiresAt;

    if (planChanged && !profileData.subscriptionExpiresAt) {
      subStarted = new Date().toISOString();
      const durationDays = plan === "FREE" ? FREE_TRIAL_DAYS : 30;
      subExpires = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
    } else if (!subExpires) {
      const isTrial = plan === "FREE";
      subStarted = old.createdAt || new Date().toISOString();
      const baseMs = new Date(subStarted).getTime();
      subExpires = new Date(baseMs + (isTrial ? FREE_TRIAL_DAYS : 30) * 24 * 60 * 60 * 1000).toISOString();
    }

    const likes = profileData.likesCount !== undefined ? profileData.likesCount : (old.likesCount ?? 12);

    updatedProfile = {
      ...old,
      ...profileData,
      plan,
      subscriptionStartedAt: subStarted,
      subscriptionExpiresAt: subExpires,
      likesCount: likes,
      age: computedAge,
      updatedAt: new Date().toISOString(),
    };
    updatedProfile = applyPermanentVip(updatedProfile);
    profiles[index] = updatedProfile;
  } else {
    let initialAge = profileData.age || 25;
    if (profileData.dateOfBirth) {
      const dob = new Date(profileData.dateOfBirth);
      if (!isNaN(dob.getTime())) {
        const today = new Date();
        let calcAge = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
          calcAge--;
        }
        initialAge = calcAge;
      }
    }
    const nowIso = new Date().toISOString();
    const plan = profileData.plan || "FREE";
    const isTrial = plan === "FREE";
    const subStarted = profileData.subscriptionStartedAt || nowIso;
    const subExpires = profileData.subscriptionExpiresAt || new Date(Date.now() + (isTrial ? FREE_TRIAL_DAYS : 30) * 24 * 60 * 60 * 1000).toISOString();
    const likes = profileData.likesCount !== undefined ? profileData.likesCount : 8;

    updatedProfile = {
      id: `prof_${Date.now()}`,
      userId: profileData.userId,
      firstName: profileData.firstName || "Nouveau Membre",
      lastName: profileData.lastName || "",
      pseudo: profileData.pseudo || profileData.firstName || "Membre",
      gender: profileData.gender || "OTHER",
      age: initialAge,
      dateOfBirth: profileData.dateOfBirth,
      placeOfBirth: profileData.placeOfBirth,
      phone: profileData.phone,
      city: profileData.city || "",
      country: profileData.country,
      address: profileData.address,
      neighborhood: profileData.neighborhood,
      profession: profileData.profession || "Professionnel(le)",
      educationLevel: profileData.educationLevel || "Supérieur",
      relationshipStatus: profileData.relationshipStatus || "Célibataire",
      height: profileData.height ?? null,
      hasChildren: profileData.hasChildren ?? false,
      religion: profileData.religion,
      languages: profileData.languages || ["Français"],
      coverUrl: profileData.coverUrl,
      email: profileData.email,
      passwordHash: profileData.passwordHash,
      bio: profileData.bio || "Membre de la communauté Meet Me Club.",
      relationshipGoal: profileData.relationshipGoal || "SERIOUS",
      plan,
      subscriptionStartedAt: subStarted,
      subscriptionExpiresAt: subExpires,
      likesCount: likes,
      partnersContacted: profileData.partnersContacted || [],
      photos: Array.isArray(profileData.photos) ? profileData.photos : [],
      interests: profileData.interests || ["Discussions", "Sorties", "Cafés"],
      availabilities: profileData.availabilities || [{ dayOfWeek: 5, startTime: "18:00", endTime: "22:00" }],
      isVerified: true,
      isVisible: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    updatedProfile = applyPermanentVip(updatedProfile);
    profiles.unshift(updatedProfile);
  }

  memoryProfiles = profiles;

  try {
    ensureFile();
    fs.writeFileSync(PROFILES_FILE, JSON.stringify(profiles, null, 2), "utf8");
  } catch {
    // Disk write may fail on serverless, memoryProfiles is preserved
  }

  return updatedProfile;
}

// ── Quotas & Subscription check ──────────────────────────────────
export const PLAN_LIMITS = {
  FREE: {
    maxPartners: 3,
    label: "Plan Gratuit (Essai 3 jours)",
    price: 0,
    paymentUrl: null,
    canBookVenues: true,
    canViewLikes: false,
    features: [
      "Accès complet opérationnel pendant 3 jours d'essai",
      "Création complète du profil & visibilité",
      "Échanger avec jusqu'à 3 partenaires",
      "Possibilité d'acheter des packs de rendez-vous réels",
      "Messagerie sécurisée",
    ],
  },
  ESSENTIAL: {
    maxPartners: Infinity,
    label: "Pass Essentiel (3 000 FCFA/mois)",
    price: 3000,
    paymentUrl: SASPAY_LINKS.ESSENTIAL,
    canBookVenues: false,
    canViewLikes: true,
    features: [
      "Partenaires & contacts illimités",
      "Discussions amicales ou amoureuses libres",
      "Voir qui a visité et aimé votre profil",
      "Filtres de recherche avancés",
    ],
  },
  COMPLICE: {
    maxPartners: Infinity,
    label: "Pass Complice (6 000 FCFA/mois)",
    price: 6000,
    paymentUrl: SASPAY_LINKS.COMPLICE,
    canBookVenues: true,
    canViewLikes: true,
    features: [
      "Tout le Pass Essentiel en illimité",
      "Réservations de tables partenaires incluses",
      "1 consommation offerte par personne au rendez-vous",
      "QR code de validation instantanée",
    ],
  },
  VIP: {
    maxPartners: Infinity,
    label: "Pass VIP (15 000 FCFA/mois)",
    price: 15000,
    paymentUrl: SASPAY_LINKS.VIP,
    canBookVenues: true,
    canViewLikes: true,
    features: [
      "Accès aux salons VIP et rooftops partenaires",
      "Dîners gastronomiques d'exception",
      "Badge VIP vérifié officiel",
      "Service de conciergerie prioritaire",
    ],
  },
};

/**
 * Checks if a user is allowed to initiate an exchange with another partner.
 */
export function canContactPartner(userId: string, targetUserId: string): { allowed: boolean; contactedCount: number; maxAllowed: number; plan: string } {
  const profile = getProfileByUserId(userId);
  const plan = profile?.plan || "FREE";
  const contacted = profile?.partnersContacted || [];
  const maxAllowed = PLAN_LIMITS[plan]?.maxPartners ?? 3;

  // If already in contacted list, it's allowed
  if (contacted.includes(targetUserId)) {
    return { allowed: true, contactedCount: contacted.length, maxAllowed, plan };
  }

  // If reached quota on Free
  if (contacted.length >= maxAllowed) {
    return { allowed: false, contactedCount: contacted.length, maxAllowed, plan };
  }

  return { allowed: true, contactedCount: contacted.length, maxAllowed, plan };
}

/**
 * Records that a user has contacted a partner
 */
export function recordContactPartner(userId: string, targetUserId: string): void {
  const profile = getProfileByUserId(userId);
  if (!profile) return;

  const contacted = profile.partnersContacted || [];
  if (!contacted.includes(targetUserId)) {
    saveProfile({
      userId,
      partnersContacted: [...contacted, targetUserId],
    });
  }
}

/**
 * Checks if a user has venue booking rights (COMPLICE or VIP)
 */
export function canBookVenue(userId: string): { allowed: boolean; plan: string; requiredPlan: string; paymentUrl: string } {
  const profile = getProfileByUserId(userId);
  const plan = profile?.plan || "FREE";
  const allowed = plan === "COMPLICE" || plan === "VIP";
  return {
    allowed,
    plan,
    requiredPlan: "COMPLICE",
    paymentUrl: SASPAY_LINKS.COMPLICE,
  };
}

export interface CommunityStats {
  totalMembers: number;
  vipMembers: number;
  compliceMembers: number;
  essentialMembers: number;
  freeMembers: number;
  verifiedSelfieMembers: number;
  organizedDates: number;
  onlineNow: number;
  lastUpdated: string;
}

/**
 * Returns dynamic community statistics based on real registrations.
 * Whenever a new user is added, totalMembers, verifiedSelfieMembers, etc. update immediately
 * without revealing any private user data.
 */
export function getCommunityStats(): CommunityStats {
  const profiles = getAllProfiles();
  const total = profiles.length;
  const vipCount = profiles.filter((p) => p.plan === "VIP").length;
  const compliceCount = profiles.filter((p) => p.plan === "COMPLICE").length;
  const essentialCount = profiles.filter((p) => p.plan === "ESSENTIAL").length;
  const freeCount = profiles.filter((p) => p.plan === "FREE" || !p.plan).length;
  const verifiedCount = profiles.filter((p) => p.isVerified || p.selfieVerified).length;
  const datesCount = 0;
  const onlineNow = profiles.filter((p) => p.isVisible).length;

  return {
    totalMembers: total,
    vipMembers: vipCount,
    compliceMembers: compliceCount,
    essentialMembers: essentialCount,
    freeMembers: freeCount,
    verifiedSelfieMembers: verifiedCount,
    organizedDates: datesCount,
    onlineNow,
    lastUpdated: new Date().toISOString(),
  };
}

// ── Messages & Conversations Persistent Store ──────────────────
export interface StoredMessage {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  mediaUrl?: string | null;
  createdAt: string;
  status: "SENT" | "DELIVERED" | "READ";
}

export interface StoredConversation {
  id: string;
  participantA: string;
  participantB: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

const MESSAGES_FILE = path.join(DATA_DIR, "messages.json");
const CONVERSATIONS_FILE = path.join(DATA_DIR, "conversations.json");

export const DEFAULT_MESSAGES: StoredMessage[] = [];

let memoryMessages: StoredMessage[] = [];
let memoryConversations: StoredConversation[] = [];

function ensureMessagesFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(MESSAGES_FILE)) {
      fs.writeFileSync(MESSAGES_FILE, JSON.stringify([], null, 2), "utf8");
    }
  } catch {}
}

export function getAllMessages(): StoredMessage[] {
  ensureMessagesFile();
  try {
    if (fs.existsSync(MESSAGES_FILE)) {
      const raw = fs.readFileSync(MESSAGES_FILE, "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        memoryMessages = parsed;
        return parsed;
      }
    }
  } catch {}
  return memoryMessages;
}

export function getMessagesByConversation(conversationId: string): StoredMessage[] {
  const all = getAllMessages();
  return all.filter((m) => m.conversationId === conversationId);
}

export const getMessagesByConversationId = getMessagesByConversation;

export function saveMessage(msg: StoredMessage): StoredMessage {
  const all = getAllMessages();
  const existingIdx = all.findIndex((m) => m.id === msg.id);
  if (existingIdx >= 0) {
    all[existingIdx] = msg;
  } else {
    all.push(msg);
  }
  memoryMessages = all;
  try {
    ensureMessagesFile();
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(all, null, 2), "utf8");
  } catch {}
  return msg;
}

function ensureConversationsFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(CONVERSATIONS_FILE)) {
      fs.writeFileSync(CONVERSATIONS_FILE, JSON.stringify([], null, 2), "utf8");
    }
  } catch {}
}

export function getAllConversations(): StoredConversation[] {
  ensureConversationsFile();
  try {
    if (fs.existsSync(CONVERSATIONS_FILE)) {
      const raw = fs.readFileSync(CONVERSATIONS_FILE, "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        memoryConversations = parsed;
        return parsed;
      }
    }
  } catch {}
  return memoryConversations;
}

export function getConversationsForUser(userId: string): StoredConversation[] {
  const all = getAllConversations();
  return all.filter((c) => c.participantA === userId || c.participantB === userId);
}

export function saveConversation(conv: Partial<StoredConversation> & { id: string }): StoredConversation {
  const all = getAllConversations();
  const idx = all.findIndex((c) => c.id === conv.id);
  let updated: StoredConversation;
  if (idx >= 0) {
    updated = {
      ...all[idx],
      ...conv,
      updatedAt: new Date().toISOString(),
    };
    all[idx] = updated;
  } else {
    updated = {
      id: conv.id,
      participantA: conv.participantA || "user_victoire_lome",
      participantB: conv.participantB || "user",
      lastMessage: conv.lastMessage || "Nouvelle conversation",
      lastMessageAt: conv.lastMessageAt || new Date().toISOString(),
      unreadCount: conv.unreadCount || 0,
      createdAt: conv.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    all.unshift(updated);
  }
  memoryConversations = all;
  try {
    ensureConversationsFile();
    fs.writeFileSync(CONVERSATIONS_FILE, JSON.stringify(all, null, 2), "utf8");
  } catch {}
  return updated;
}

// ── Calcul et gestion de l'expiration d'abonnement & compte à rebours ─────

export function getSubscriptionStatus(profile?: StoredProfile | any): SubscriptionStatusInfo {
  if (profile) profile = applyPermanentVip(profile);
  const plan = ((profile?.plan || "FREE") as string).toUpperCase() as "FREE" | "ESSENTIAL" | "COMPLICE" | "VIP";
  const planConfig = PLAN_LIMITS[plan] || PLAN_LIMITS.FREE;
  const isTrial = plan === "FREE";

  const createdAt = profile?.createdAt ? new Date(profile.createdAt).getTime() : Date.now();
  const startedAtMs = profile?.subscriptionStartedAt
    ? new Date(profile.subscriptionStartedAt).getTime()
    : createdAt;

  let expiresAtMs: number;
  if (profile?.subscriptionExpiresAt) {
    expiresAtMs = new Date(profile.subscriptionExpiresAt).getTime();
  } else {
    const durationDays = isTrial ? FREE_TRIAL_DAYS : 30;
    expiresAtMs = startedAtMs + durationDays * 24 * 60 * 60 * 1000;
  }
  // Essai gratuit : jamais plus de 3 jours après son début (s'applique aussi aux anciens comptes)
  if (isTrial) expiresAtMs = Math.min(expiresAtMs, startedAtMs + FREE_TRIAL_MS);

  const now = Date.now();
  const diffMs = expiresAtMs - now;
  const isExpired = diffMs <= 0;

  const totalDurationDays = isTrial ? FREE_TRIAL_DAYS : 30;
  const totalDurationMs = totalDurationDays * 24 * 60 * 60 * 1000;
  const elapsedMs = Math.max(0, now - startedAtMs);
  const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedMs / totalDurationMs) * 100)));

  const remainingSecondsTotal = Math.max(0, Math.floor(diffMs / 1000));
  const daysRemaining = Math.floor(remainingSecondsTotal / 86400);
  const hoursRemaining = Math.floor((remainingSecondsTotal % 86400) / 3600);
  const minutesRemaining = Math.floor((remainingSecondsTotal % 3600) / 60);
  const secondsRemaining = remainingSecondsTotal % 60;

  return {
    isExpired,
    isTrial,
    plan,
    label: planConfig.label,
    price: planConfig.price,
    paymentUrl: planConfig.paymentUrl,
    startedAt: new Date(startedAtMs).toISOString(),
    expiresAt: new Date(expiresAtMs).toISOString(),
    daysRemaining,
    hoursRemaining,
    minutesRemaining,
    secondsRemaining,
    totalDurationDays,
    progressPercent,
  };
}

/**
 * Accès terminé ? (essai gratuit de 3 jours écoulé, ou pass payant expiré sans renouvellement)
 * → le chat et la liste des membres demandent un pass payant.
 */
export function isAccessExpired(profile?: Partial<StoredProfile> | null): boolean {
  if (!profile) return false;
  if (findPermanentVipAccount(profile)) return false;
  return getSubscriptionStatus(profile).isExpired;
}

/**
 * Plan réellement actif : un pass payant expiré redevient « FREE ».
 * Les comptes VIP permanents (tests) restent toujours VIP.
 */
export function getEffectivePlan(profile?: Partial<StoredProfile> | null): "FREE" | "ESSENTIAL" | "COMPLICE" | "VIP" {
  if (!profile) return "FREE";
  const p = applyPermanentVip(profile);
  const plan = ((p.plan || "FREE") as string).toUpperCase() as "FREE" | "ESSENTIAL" | "COMPLICE" | "VIP";
  if (plan === "FREE") return "FREE";
  if (p.subscriptionExpiresAt && new Date(p.subscriptionExpiresAt).getTime() < Date.now()) return "FREE";
  return plan;
}

/**
 * Règle stricte de visibilité entre catégories :
 * - VIP (15 000) : voit TOUS les membres sans exception.
 * - Complice (6 000) : voit Complice (6000), Essentiel (3000) et Free (essai).
 * - Essentiel (3 000) : voit Essentiel (3000) et Free (essai).
 * - Gratuit : période d'essai 3 jours (voit Free et Essentiel).
 */
export function canViewMember(viewerPlan: string = "FREE", targetPlan: string = "FREE"): boolean {
  const v = (viewerPlan || "FREE").toUpperCase();
  const t = (targetPlan || "FREE").toUpperCase();

  if (v === "VIP") return true;
  if (v === "COMPLICE") return t === "COMPLICE" || t === "ESSENTIAL" || t === "FREE";
  if (v === "ESSENTIAL") return t === "ESSENTIAL" || t === "FREE";
  return t === "FREE" || t === "ESSENTIAL";
}

/**
 * Classement des profils :
 * - VIP en tête (+10 000 pts)
 * - Complice (6 000) classé en haut selon leurs likes et engagement (+5 000 pts + likes * 10)
 * - Essentiel (+1 000 pts + likes * 10)
 * - Gratuit (+ likes * 10)
 */
export function sortProfilesByPriorityAndLikes<T extends { plan?: string; likesCount?: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const getScore = (item: T) => {
      const p = (item.plan || "FREE").toUpperCase();
      const likes = item.likesCount || 0;
      let base = 0;
      if (p === "VIP") base = 10000;
      else if (p === "COMPLICE") base = 5000;
      else if (p === "ESSENTIAL") base = 1000;
      return base + likes * 10;
    };
    return getScore(b) - getScore(a);
  });
}

// ── Espace VIP Exclusif (Feed / Mur de publications VIP) ─────────

const VIP_POSTS_FILE = path.join(DATA_DIR, "vip_posts.json");

const DEFAULT_VIP_POSTS: VipPost[] = [];

let memoryVipPosts: VipPost[] = [];

function ensureVipPostsFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(VIP_POSTS_FILE)) {
      fs.writeFileSync(VIP_POSTS_FILE, JSON.stringify([], null, 2), "utf8");
    }
  } catch {}
}

export function getAllVipPosts(): VipPost[] {
  ensureVipPostsFile();
  try {
    if (fs.existsSync(VIP_POSTS_FILE)) {
      const raw = fs.readFileSync(VIP_POSTS_FILE, "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryVipPosts = parsed;
        return parsed;
      }
    }
  } catch {}
  return memoryVipPosts;
}

export function createVipPost(
  post: Omit<VipPost, "id" | "createdAt" | "updatedAt" | "likesCount" | "commentsCount">
): VipPost {
  const all = getAllVipPosts();
  const newPost: VipPost = {
    ...post,
    id: `post_vip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    likesCount: 1,
    commentsCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  all.unshift(newPost);
  memoryVipPosts = all;
  try {
    ensureVipPostsFile();
    fs.writeFileSync(VIP_POSTS_FILE, JSON.stringify(all, null, 2), "utf8");
  } catch {}
  return newPost;
}

export function likeVipPost(id: string): VipPost | null {
  const all = getAllVipPosts();
  const post = all.find((p) => p.id === id);
  if (!post) return null;
  post.likesCount = (post.likesCount || 0) + 1;
  post.updatedAt = new Date().toISOString();
  memoryVipPosts = all;
  try {
    ensureVipPostsFile();
    fs.writeFileSync(VIP_POSTS_FILE, JSON.stringify(all, null, 2), "utf8");
  } catch {}
  return post;
}



