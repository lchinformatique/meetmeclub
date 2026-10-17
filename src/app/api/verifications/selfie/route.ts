// src/app/api/verifications/selfie/route.ts
// GET  /api/verifications/selfie — état complet de la vérification du membre (formule, selfie, pièce, vidéo)
// POST /api/verifications/selfie — envoi du selfie pris en direct (contrôlé ensuite par l'équipe)

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { isAdminSession } from "@/lib/admin-auth";
import { getMemberPlan } from "@/lib/member-plan";
import {
  DOCUMENT_TYPES,
  GESTURES,
  forgetVerificationCache,
  getVerificationState,
  isStateVerified,
  randomGesture,
  randomVideoCode,
  storeSelfie,
} from "@/lib/verification";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    if (await isAdminSession(session)) {
      return NextResponse.json({ configured: true, verified: true, callsAllowed: true, status: "APPROVED", isAdmin: true, plan: "VIP" });
    }

    const [state, plan] = await Promise.all([getVerificationState(session.userId), getMemberPlan(session)]);
    if (!state.configured) {
      return NextResponse.json({ configured: false, verified: true, callsAllowed: true, status: "APPROVED", plan });
    }

    const admin = getSupabaseAdmin();
    // Geste imposé (selfie) et code à prononcer (vidéo VIP), tirés au hasard une seule fois par essai
    let gesture = state.selfie.gesture;
    if (state.profileId && !gesture && (state.selfie.status === "NONE" || state.selfie.status === "REJECTED")) {
      gesture = randomGesture();
      await admin.from("profiles").update({ verificationGesture: gesture }).eq("id", state.profileId);
    }
    let videoCode = state.video.code;
    if (state.profileId && state.docsConfigured && plan === "VIP" && !videoCode && state.video.status !== "APPROVED") {
      videoCode = randomVideoCode();
      await admin.from("profiles").update({ videoCode }).eq("id", state.profileId);
    }

    const verified = isStateVerified(state);
    return NextResponse.json({
      configured: true,
      docsConfigured: state.docsConfigured,
      plan,
      verified,
      callsAllowed: !state.docsConfigured || state.video.status === "APPROVED",
      // Compatibilité : « status » = vérifié ou non
      status: verified ? "APPROVED" : state.selfie.status,
      hasProfile: Boolean(state.profileId),
      hasProfilePhoto: state.hasProfilePhoto,
      selfie: { ...state.selfie, gestureText: gesture ? GESTURES[gesture] : null },
      document: { ...state.document, typeLabel: state.document.type ? DOCUMENT_TYPES[state.document.type] : null },
      video: { ...state.video, code: videoCode },
      documentTypes: DOCUMENT_TYPES,
    });
  } catch (error) {
    console.error("[GET /api/verifications/selfie]", error);
    return NextResponse.json({ error: "Impossible de charger votre vérification." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const { image } = (await req.json()) as { image?: string };
    const match = typeof image === "string" ? image.match(/^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/) : null;
    if (!match) {
      return NextResponse.json({ error: "Selfie manquant : prenez la photo avec la caméra." }, { status: 400 });
    }
    const jpeg = Buffer.from(match[1], "base64");
    if (jpeg.length < 15 * 1024 || jpeg.length > 4 * 1024 * 1024) {
      return NextResponse.json({ error: "Selfie illisible : reprenez la photo dans un endroit bien éclairé." }, { status: 400 });
    }

    const state = await getVerificationState(session.userId);
    if (!state.configured) {
      return NextResponse.json({ error: "La vérification n'est pas encore activée sur le site." }, { status: 503 });
    }
    if (!state.profileId) {
      return NextResponse.json({ error: "Complétez d'abord votre profil.", redirect: "/profil/edit" }, { status: 400 });
    }
    if (!state.hasProfilePhoto) {
      return NextResponse.json(
        { error: "Ajoutez d'abord au moins une photo de profil : elle sera comparée à votre selfie.", redirect: "/profil/photos" },
        { status: 400 }
      );
    }
    if (state.selfie.status === "APPROVED") {
      return NextResponse.json({ error: "Votre selfie est déjà validé." }, { status: 400 });
    }

    const path = await storeSelfie(session.userId, jpeg);
    const now = new Date().toISOString();
    const { error } = await getSupabaseAdmin()
      .from("profiles")
      .update({
        verificationStatus: "PENDING",
        verificationSelfiePath: path,
        verificationGesture: state.selfie.gesture || randomGesture(),
        verificationSubmittedAt: now,
        verificationNote: null,
        updatedAt: now,
      })
      .eq("id", state.profileId);
    if (error) throw error;
    forgetVerificationCache(session.userId);

    const { alertVerificationToReview } = await import("@/lib/admin-notify");
    await alertVerificationToReview(state.profileId, "selfie").catch((e: unknown) => console.warn("[selfie alert]", e));

    return NextResponse.json({
      success: true,
      status: "PENDING",
      message: "Selfie reçu ! L'équipe Meet Me Club le compare à vos photos. Vous serez prévenu(e) dès la validation.",
    });
  } catch (error) {
    console.error("[POST /api/verifications/selfie]", error);
    return NextResponse.json({ error: "Erreur lors de l'envoi du selfie. Réessayez." }, { status: 500 });
  }
}
