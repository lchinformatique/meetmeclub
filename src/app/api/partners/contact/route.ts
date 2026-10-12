// src/app/api/partners/contact/route.ts
// Check and record partner contact to enforce subscription limits (3 partners max for FREE plan)

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { canContactPartner, recordContactPartner, getProfileByUserId, PLAN_LIMITS } from "@/lib/db-store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const { targetUserId } = await req.json();
    if (!targetUserId) {
      return NextResponse.json({ error: "targetUserId requis" }, { status: 400 });
    }

    const profile = getProfileByUserId(session.userId);
    const isIdVerified = Boolean(profile?.idDocumentSubmitted || profile?.idDocumentVerified);
    const isSelfieVerified = Boolean(profile?.selfieSubmitted || profile?.selfieVerified);

    if (!isIdVerified || !isSelfieVerified) {
      return NextResponse.json(
        {
          allowed: false,
          needsVerification: true,
          error: "Vérification d'identité requise",
          message:
            "Par mesure de sécurité et de protection d'image, vous devez obligatoirement soumettre votre pièce d'identité et un selfie de contrôle facial avant de pouvoir entrer en contact avec un partenaire.",
          redirectUrl: "/profil/securite",
        },
        { status: 403 }
      );
    }

    const check = canContactPartner(session.userId, targetUserId);

    if (!check.allowed) {
      return NextResponse.json(
        {
          allowed: false,
          error: "Limite du Plan Gratuit atteinte",
          message:
            "Votre Plan Gratuit vous permet d'échanger avec un maximum de 3 partenaires. Passez au Pass Essentiel (3 000 FCFA/mois via T-Money ou Flooz) pour discuter sans aucune limite !",
          contactedCount: check.contactedCount,
          maxAllowed: check.maxAllowed,
          plan: check.plan,
          saspayUrl: "https://link.saspay.me/dtpycov9i-k",
          paymentLinks: {
            ESSENTIAL: "https://link.saspay.me/dtpycov9i-k",
            COMPLICE: "https://link.saspay.me/xiigac37eyq",
            VIP: "https://link.saspay.me/ksev91xlvik",
          },
        },
        { status: 403 }
      );
    }

    // Record the contact
    recordContactPartner(session.userId, targetUserId);
    const updatedProfile = getProfileByUserId(session.userId);
    const planInfo = PLAN_LIMITS[updatedProfile?.plan || "FREE"] || PLAN_LIMITS.FREE;

    return NextResponse.json({
      allowed: true,
      contactedCount: updatedProfile?.partnersContacted?.length || 1,
      maxAllowed: planInfo.maxPartners,
      remaining: Math.max(0, (planInfo.maxPartners || 3) - (updatedProfile?.partnersContacted?.length || 1)),
      plan: updatedProfile?.plan || "FREE",
    });
  } catch (error) {
    console.error("[POST /api/partners/contact]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
