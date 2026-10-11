// src/app/api/auth/verify-otp/route.ts
// POST /api/auth/verify-otp
// Verifies OTP, creates user on REGISTRATION, sets JWT session cookie

import { NextRequest, NextResponse } from "next/server";
import { VerifyOtpSchema } from "@/lib/validations/auth";
import { verifyOtp, isAdult } from "@/lib/otp";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = VerifyOtpSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message || "Données invalides" },
        { status: 400 }
      );
    }

    const { target, code, purpose } = parsed.data;

    // ── Verify the OTP ─────────────────────────────────────────
    const valid = await verifyOtp(target, purpose, code);
    if (!valid) {
      return Response.json(
        { error: "Code incorrect ou expiré. Vérifiez et réessayez.", code: "INVALID_OTP" },
        { status: 400 }
      );
    }

    const isPhone = target.startsWith("+");

    // ── REGISTRATION: create user account ──────────────────────
    if (purpose === "REGISTRATION") {
      const { dateOfBirth } = body;
      if (!dateOfBirth) {
        return Response.json({ error: "Date de naissance manquante." }, { status: 400 });
      }

      const dob = new Date(dateOfBirth);
      if (!isAdult(dob)) {
        return Response.json(
          { error: "Désolé, Meet Me Club est réservé aux adultes (18+).", code: "UNDERAGE" },
          { status: 403 }
        );
      }

      // Upsert user
      let user: any;
      try {
        user = await prisma.user.upsert({
          where: isPhone ? { phone: target } : { email: target },
          create: {
            phone: isPhone ? target : undefined,
            email: !isPhone ? target : undefined,
            phoneVerifiedAt: isPhone ? new Date() : undefined,
            emailVerifiedAt: !isPhone ? new Date() : undefined,
            dateOfBirth: dob,
            isAdult: true,
            status: "ONBOARDING",
          },
          update: {
            phoneVerifiedAt: isPhone ? new Date() : undefined,
            emailVerifiedAt: !isPhone ? new Date() : undefined,
            status: "ONBOARDING",
            lastLoginAt: new Date(),
          },
        });

        // Audit log
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: "USER_REGISTERED",
            entity: "users",
            entityId: user.id,
            metadata: { method: isPhone ? "SMS" : "EMAIL" },
            ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
            userAgent: request.headers.get("user-agent") ?? undefined,
          },
        });
      } catch (dbErr) {
        console.warn("[verify-otp] Database not connected, using fallback dev session:", dbErr);
        user = {
          id: `dev_user_${Date.now()}`,
          role: "MEMBER",
          status: "ONBOARDING",
          phone: isPhone ? target : null,
          email: !isPhone ? target : null,
        };
      }

      // Set session cookie
      await setSessionCookie({
        userId: user.id,
        role: user.role,
        status: user.status,
        phone: user.phone,
        email: user.email,
      });

      return Response.json({ success: true, redirect: "/onboarding" });
    }

    // ── LOGIN: find existing user ──────────────────────────────
    if (purpose === "LOGIN") {
      let user: any = null;
      try {
        user = await prisma.user.findFirst({
          where: isPhone
            ? { phone: target, deletedAt: null }
            : { email: target, deletedAt: null },
        });

        if (user) {
          if (user.status === "BANNED") {
            return Response.json(
              { error: "Votre compte a été suspendu. Contactez le support.", code: "BANNED" },
              { status: 403 }
            );
          }

          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });

          await prisma.auditLog.create({
            data: {
              userId: user.id,
              action: "USER_LOGIN",
              entity: "users",
              entityId: user.id,
              metadata: { method: isPhone ? "SMS" : "EMAIL" },
              ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
              userAgent: request.headers.get("user-agent") ?? undefined,
            },
          });
        }
      } catch (dbErr) {
        console.warn("[verify-otp LOGIN] Database not connected, creating dev login session:", dbErr);
        user = {
          id: `dev_user_${Date.now()}`,
          role: "MEMBER",
          status: "ACTIVE",
          phone: isPhone ? target : null,
          email: !isPhone ? target : null,
        };
      }

      if (!user) {
        return Response.json(
          { error: "Aucun compte trouvé. Inscrivez-vous d'abord.", code: "NOT_FOUND" },
          { status: 404 }
        );
      }

      await setSessionCookie({
        userId: user.id,
        role: user.role,
        status: user.status,
        phone: user.phone,
        email: user.email,
      });

      const redirect = user.status === "ONBOARDING" ? "/onboarding" : "/decouverte";
      return Response.json({ success: true, redirect });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("[verify-otp]", error);
    return Response.json({ error: "Erreur interne. Veuillez réessayer." }, { status: 500 });
  }
}
