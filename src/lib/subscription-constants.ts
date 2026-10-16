// src/lib/subscription-constants.ts
// Client-safe constants and types for Subscriptions, SasPay links and VIP Posts.
// Does NOT import 'fs' or 'path', safe for browser and client components.

export const SASPAY_LINKS = {
  ESSENTIAL: "https://link.saspay.me/dtpycov9i-k", // 3 000 FCFA
  COMPLICE: "https://link.saspay.me/xiigac37eyq",  // 6 000 FCFA
  VIP: "https://link.saspay.me/ksev91xlvik",       // 15 000 FCFA
} as const;

export interface SubscriptionStatusInfo {
  isExpired: boolean;
  isTrial: boolean;
  plan: "FREE" | "ESSENTIAL" | "COMPLICE" | "VIP";
  label: string;
  price: number;
  paymentUrl: string | null;
  startedAt: string;
  expiresAt: string;
  daysRemaining: number;
  hoursRemaining: number;
  minutesRemaining: number;
  secondsRemaining: number;
  totalDurationDays: number;
  progressPercent: number;
}

export interface VipPost {
  id: string;
  userId: string;
  authorName: string;
  authorAvatar?: string;
  authorPseudo?: string;
  title?: string;
  content: string;
  mediaUrl?: string;
  mediaType: "IMAGE" | "VIDEO" | "ARTICLE";
  likesCount: number;
  commentsCount?: number;
  createdAt: string;
  updatedAt: string;
}

// ── Comptes VIP permanents (tests internes) ───────────────────────────────
// Ces comptes ont TOUJOURS le plan VIP, sans limite de durée, quel que soit
// l'état du store local ou de Supabase.
export const PERMANENT_VIP_ACCOUNTS = [
  { userId: "user_vip_master", email: "vip@meetmeclub.net", pseudo: "vip_master", firstName: "VIP", lastName: "Master", gender: "OTHER" as const, role: "ADMIN" },
  { userId: "user_vip_tester", email: "tester@meetmeclub.net", pseudo: "vip_tester", firstName: "Sophie", lastName: "Tester", gender: "FEMALE" as const, role: "MEMBER" },
];
export const PERMANENT_VIP_START = "2024-01-01T00:00:00.000Z";
export const PERMANENT_VIP_EXPIRY = "2099-12-31T23:59:59.000Z";

export function findPermanentVipAccount(ids: { userId?: string | null; email?: string | null; pseudo?: string | null }) {
  const email = ids.email?.toLowerCase().trim();
  const pseudo = ids.pseudo?.toLowerCase().replace(/^@/, "").trim();
  return (
    PERMANENT_VIP_ACCOUNTS.find(
      (a) =>
        (ids.userId && a.userId === ids.userId) ||
        (email && a.email === email) ||
        (pseudo && a.pseudo === pseudo)
    ) || null
  );
}
