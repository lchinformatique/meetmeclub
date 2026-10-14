// src/lib/otp.ts
// OTP generation, hashing, and sending via SMS (CinetPay) or email (Resend)

import crypto from "crypto";
import { storeOtp, getOtp, deleteOtp, rateLimitIncr, otpRateLimitKey } from "./redis";

const OTP_LENGTH = 6;
const OTP_TTL_SECONDS = 5 * 60; // 5 minutes
const MAX_REQUESTS_PER_HOUR = 3;
const RATE_LIMIT_TTL = 60 * 60; // 1 hour

// ── Generate ────────────────────────────────────────────────────

/** Generate a random N-digit OTP code */
export function generateOtp(length = OTP_LENGTH): string {
  const max = Math.pow(10, length);
  const min = Math.pow(10, length - 1);
  return (Math.floor(Math.random() * (max - min)) + min).toString();
}

/** Hash OTP for storage (SHA-256) */
export function hashOtp(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

// ── Rate limiting ───────────────────────────────────────────────

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

export async function checkOtpRateLimit(target: string): Promise<RateLimitResult> {
  const key = otpRateLimitKey(target);
  const count = await rateLimitIncr(key, RATE_LIMIT_TTL);
  if (count > MAX_REQUESTS_PER_HOUR) {
    return { allowed: false, retryAfterSeconds: RATE_LIMIT_TTL };
  }
  return { allowed: true };
}

// ── Store & verify ──────────────────────────────────────────────

export async function storeAndHashOtp(
  target: string,
  purpose: string,
  code: string
) {
  const hash = hashOtp(code);
  await storeOtp(target, purpose, hash, OTP_TTL_SECONDS);
  return hash;
}

export async function verifyOtp(
  target: string,
  purpose: string,
  code: string
): Promise<boolean> {
  const stored = await getOtp(target, purpose);
  if (!stored) return false;
  const hash = hashOtp(code);
  const valid = crypto.timingSafeEqual(
    Buffer.from(hash, "hex"),
    Buffer.from(stored, "hex")
  );
  if (valid) {
    await deleteOtp(target, purpose);
  }
  return valid;
}

// ── SMS sending (CinetPay) ──────────────────────────────────────

export async function sendSmsOtp(phone: string, code: string): Promise<void> {
  const apiKey = process.env.CINETPAY_API_KEY;
  const siteId = process.env.CINETPAY_SITE_ID;
  const senderId = process.env.CINETPAY_SENDER_ID || "MeetMeClub";

  if (!apiKey || !siteId) {
    // Dev mode: just log the OTP
    console.log(`[DEV] OTP for ${phone}: ${code}`);
    return;
  }

  const message = `Votre code Meet Me Club : ${code}. Valable 5 minutes. Ne le partagez jamais.`;

  const response = await fetch("https://api-checkout.cinetpay.com/v2/sms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apikey: apiKey,
      site_id: siteId,
      to: [phone],
      message,
      sender: senderId,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`CinetPay SMS error: ${err}`);
  }
}

// ── Email sending (Resend) ──────────────────────────────────────

export async function sendEmailOtp(email: string, code: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "noreply@meetmeclub.net";

  if (!apiKey) {
    console.log(`[DEV] OTP for ${email}: ${code}`);
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);

  await resend.emails.send({
    from,
    to: email,
    subject: `${code} – Votre code Meet Me Club`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:480px;margin:auto;padding:32px;background:#fff;border-radius:16px;">
        <img src="https://www.meetmeclub.net/logo.png" alt="Meet Me Club" style="height:60px;margin-bottom:24px;" />
        <h2 style="color:#0B2E6B;margin:0 0 8px;">Votre code de vérification</h2>
        <p style="color:#444;margin-bottom:24px;">Entrez ce code dans l'application Meet Me Club. Il est valable <strong>5 minutes</strong>.</p>
        <div style="font-size:40px;font-weight:bold;letter-spacing:16px;color:#E10600;text-align:center;padding:24px;background:#FFF5F5;border-radius:12px;">
          ${code}
        </div>
        <p style="color:#888;font-size:13px;margin-top:24px;">Si vous n'avez pas demandé ce code, ignorez cet e-mail. Ne partagez jamais ce code.</p>
      </div>
    `,
  });
}

// ── Age verification ────────────────────────────────────────────

/**
 * Returns true if the given date of birth is at least 18 years ago.
 */
export function isAdult(dateOfBirth: Date): boolean {
  const today = new Date();
  const eighteenYearsAgo = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate()
  );
  return dateOfBirth <= eighteenYearsAgo;
}
