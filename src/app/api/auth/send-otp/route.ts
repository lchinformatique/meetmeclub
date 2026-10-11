// src/app/api/auth/send-otp/route.ts
// POST /api/auth/send-otp — Send OTP via SMS or email

import { NextRequest } from "next/server";
import { SendOtpSchema } from "@/lib/validations/auth";
import {
  generateOtp,
  storeAndHashOtp,
  checkOtpRateLimit,
  sendSmsOtp,
  sendEmailOtp,
  isAdult,
} from "@/lib/otp";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = SendOtpSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0]?.message || "Données invalides" }, { status: 400 });
    }

    const { target, type, purpose, dateOfBirth } = parsed.data;

    // ── 18+ check on REGISTRATION ──────────────────────────────
    if (purpose === "REGISTRATION") {
      if (!dateOfBirth) {
        return Response.json({ error: "Date de naissance requise pour l'inscription." }, { status: 400 });
      }
      if (!isAdult(new Date(dateOfBirth))) {
        return Response.json(
          { error: "Désolé, Meet Me Club est réservé aux personnes de 18 ans et plus.", code: "UNDERAGE" },
          { status: 403 }
        );
      }
    }

    // ── Rate limiting ──────────────────────────────────────────
    const rateLimit = await checkOtpRateLimit(target);
    if (!rateLimit.allowed) {
      return Response.json(
        { error: `Trop de tentatives. Réessayez dans ${Math.ceil(rateLimit.retryAfterSeconds / 60)} minute(s).`, code: "RATE_LIMIT" },
        { status: 429 }
      );
    }

    // ── Check for existing user on REGISTRATION ────────────────
    if (purpose === "REGISTRATION") {
      const isPhone = target.startsWith("+");
      try {
        const existing = await prisma.user.findFirst({
          where: isPhone ? { phone: target } : { email: target },
        });
        if (existing && existing.status !== "PENDING_VERIFICATION") {
          return Response.json(
            { error: "Ce numéro/email est déjà utilisé. Connectez-vous ou réinitialisez votre accès.", code: "ALREADY_EXISTS" },
            { status: 409 }
          );
        }
      } catch (dbErr) {
        console.warn("[send-otp] Database check skipped (DB not reachable):", dbErr);
      }
    }

    // ── Generate and send OTP ──────────────────────────────────
    const code = generateOtp();
    await storeAndHashOtp(target, purpose, code);

    const isPhone = target.startsWith("+");
    if (isPhone) {
      await sendSmsOtp(target, code);
    } else {
      await sendEmailOtp(target, code);
    }

    return Response.json({
      success: true,
      message: `Code envoyé par ${isPhone ? "SMS" : "email"}. Valable 5 minutes.`,
      ...(process.env.NODE_ENV === "development" && { devCode: code }),
    });
  } catch (error) {
    console.error("[send-otp] Error:", error);
    return Response.json({ error: "Erreur interne. Veuillez réessayer." }, { status: 500 });
  }
}
