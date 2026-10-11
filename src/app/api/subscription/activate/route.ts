// src/app/api/subscription/activate/route.ts
// Activate subscription after Saspay payment via T-Money or Flooz

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

    const userId = session?.userId || "demo_user_lome";
    const existing = getProfileByUserId(userId);

    const updated = saveProfile({
      userId,
      phone: phone || existing?.phone,
      plan: plan as any,
    });

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
