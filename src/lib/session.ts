// src/lib/session.ts
// Lightweight JWT session management using jose (no next-auth dependency)
// Uses httpOnly cookies for security

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { UserRole, UserStatus } from "@prisma/client";

const SESSION_COOKIE = "mmclub_session";
const SESSION_TTL_SECONDS = 90 * 24 * 60 * 60; // 90 days persistent session
/** Verrouillage après 30 minutes sans activité réelle du membre */
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

export interface SessionPayload {
  userId: string;
  role: UserRole;
  status: UserStatus;
  phone?: string | null;
  email?: string | null;
  /** Dernière activité réelle (ms) — mise à jour uniquement par /api/auth/activity et la connexion */
  la?: number;
  iat?: number;
  exp?: number;
}

/** Session inactive depuis plus de 30 minutes ? */
export function isIdle(payload: SessionPayload | null) {
  return Boolean(payload?.la && Date.now() - payload.la > IDLE_TIMEOUT_MS);
}

function getSecret(): Uint8Array {
  const secret =
    process.env.NEXTAUTH_SECRET ||
    process.env.JWT_SECRET ||
    "meet-me-club-jwt-secret-key-production-32-chars-minimum";
  return new TextEncoder().encode(secret);
}

// ── Create session token ────────────────────────────────────────

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  const secret = getSecret();
  const { iat: _iat, exp: _exp, ...claims } = payload;
  return new SignJWT({ ...claims, la: payload.la ?? Date.now() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secret);
}

// ── Verify session token ────────────────────────────────────────

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

// ── Set cookie ─────────────────────────────────────────────────

export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await createSessionToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_TTL_SECONDS,
    path: "/",
  });
}

// ── Get current session ─────────────────────────────────────────

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifySessionToken(token);
  // 30 minutes sans activité : la session est verrouillée (reconnexion obligatoire)
  if (isIdle(payload)) return null;
  return payload;
}

// ── Delete cookie (logout) ──────────────────────────────────────

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
