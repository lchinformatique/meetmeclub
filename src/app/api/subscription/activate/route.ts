// src/app/api/subscription/activate/route.ts
// Activate subscription after Saspay payment via T-Money, Moov, or Carte Bancaire
// Persists to both local store and Prisma/Supabase

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { saveProfile, getProfileByUserId, PLAN_LIMITS, SASPAY_LINKS } from "@/lib/db-store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const { plan, phone, transactionRef } = await req.json();

    if (!["ESSENTIAL", "COMPLICE", "VIP"].includes(plan)) {
      return NextResponse.json({ error: "Plan payant invalide" }, { status: 400 });
    }

    if (!session?.userId) {
      return NextResponse.json(
        { error: "Connectez-vous à votre compte pour activer votre pass.", needLogin: true },
        { status: 401 }
      );
    }
    const userId = session.userId;
    const existing = getProfileByUserId(userId);

    // 1. Save to local store
    const updated = saveProfile({
      userId,
      phone: phone || existing?.phone,
      plan: plan as any,
    });

    // 1.b Le plan doit être enregistré dans Supabase, sinon il est perdu au prochain redémarrage
    if (session?.userId) {
      try {
        const { upsertProfileInSupabase } = await import("@/lib/supabase-server");
        await upsertProfileInSupabase(userId, {
          email: session.email || undefined,
          plan: updated.plan,
          subscriptionStartedAt: updated.subscriptionStartedAt || null,
          subscriptionExpiresAt: updated.subscriptionExpiresAt || null,
        });
      } catch (supaErr) {
        console.warn("[activate] Supabase plan sync:", supaErr);
      }
    }

    // 2. Persist subscription to Prisma/Supabase
    try {
      const { prisma } = await import("@/lib/prisma");

      // Create subscription record
      await prisma.subscription.create({
        data: {
          userId,
          plan: plan as any,
          status: "ACTIVE",
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
          priceFcfa: PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS].price,
          paymentRef: transactionRef || `ACT_${Date.now()}`,
          paymentMethod: phone?.includes("@") ? "CARD" : "MOBILE_MONEY",
          paymentPhone: phone || null,
        },
      }).catch((e: any) => {
        // Subscription model might not exist yet in DB schema
        console.warn("[activate] Subscription table write skipped:", e.message);
      });

      // Also update the profile audit log
      await prisma.auditLog.create({
        data: {
          userId,
          action: "SUBSCRIPTION_ACTIVATED",
          entity: "subscriptions",
          entityId: plan,
          metadata: { plan, phone, transactionRef } as any,
        },
      }).catch(() => {});
    } catch (dbErr) {
      console.warn("[POST /api/subscription/activate] Prisma sync:", dbErr);
    }

    return NextResponse.json({
      success: true,
      message: `Votre ${PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS].label} est désormais actif !`,
      plan: updated.plan,
      profile: updated,
    });
  } catch (error) {
    console.error("[POST /api/subscription/activate]", error);
    return NextResponse.json({ error: "Erreur lors de l'activation" }, { status: 500 });
  }
}
