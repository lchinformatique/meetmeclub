// src/lib/session.ts
// Lightweight JWT session management using jose (no next-auth dependency)
// Uses httpOnly cookies for security

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { UserRole, UserStatus } from "@prisma/client";

const SESSION_COOKIE = "mmclub_session";
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

export interface SessionPayload {
  userId: string;
  role: UserRole;
  status: UserStatus;
  phone?: string | null;
  email?: string | null;
  iat?: number;
  exp?: number;
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
  return new SignJWT({ ...payload })
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
  return verifySessionToken(token);
}

// ── Delete cookie (logout) ──────────────────────────────────────

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
