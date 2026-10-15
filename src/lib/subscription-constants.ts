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
