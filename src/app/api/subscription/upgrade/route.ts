// src/app/api/subscription/upgrade/route.ts
// Upgrade user plan (FREE, ESSENTIAL, COMPLICE, VIP)

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { saveProfile, getProfileByUserId, PLAN_LIMITS } from "@/lib/db-store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const { plan } = await req.json();
    if (!["FREE", "ESSENTIAL", "COMPLICE", "VIP"].includes(plan)) {
      return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
    }

    const updated = saveProfile({
      userId: session.userId,
      plan: plan as any,
    });

    // Also persist subscription to Prisma/Supabase if available
    try {
      const { prisma } = await import("@/lib/prisma");
      await prisma.subscription.create({
        data: {
          userId: session.userId,
          plan: plan as any,
          status: "ACTIVE",
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          priceFcfa: PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS]?.price || 0,
          paymentRef: `UPGRADE_${Date.now()}`,
          paymentMethod: "UPGRADE",
        },
      }).catch(() => { });
    } catch (err) {
      console.warn("[POST /api/subscription/upgrade] Prisma sync:", err);
    }

    try {
      // Le plan doit être enregistré dans Supabase, sinon il est perdu au prochain redémarrage
      const { upsertProfileInSupabase } = await import("@/lib/supabase-server");
      await upsertProfileInSupabase(session.userId, {
        email: session.email || undefined,
        plan: updated.plan,
        subscriptionStartedAt: updated.subscriptionStartedAt || null,
        subscriptionExpiresAt: updated.subscriptionExpiresAt || null,
      });
    } catch (err) {
      console.warn("[POST /api/subscription/upgrade] Supabase sync:", err);
    }

    return NextResponse.json({
      success: true,
      profile: updated,
      planInfo: PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS],
    });
  } catch (error) {
    console.error("[POST /api/subscription/upgrade]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
