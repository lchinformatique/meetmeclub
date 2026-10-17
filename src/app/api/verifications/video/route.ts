// src/app/api/verifications/video/route.ts
// POST /api/verifications/video — vidéo de vérification des membres VIP (enregistrée en direct,
// le membre y dit son prénom et le code à 4 chiffres affiché). Contrôlée par l'équipe ;
// une fois validée, elle débloque les appels audio et vidéo.

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getMemberPlan } from "@/lib/member-plan";
import { VIDEO_BUCKET, forgetVerificationCache, getVerificationState, randomVideoCode, storePrivateFile } from "@/lib/verification";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    if ((await getMemberPlan(session)) !== "VIP") {
      return NextResponse.json({ error: "La vérification vidéo est réservée aux membres VIP." }, { status: 403 });
    }

    const file = (await req.formData()).get("video");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Vidéo manquante : enregistrez-la avec la caméra." }, { status: 400 });
    }
    const contentType = file.type.startsWith("video/mp4") ? "video/mp4" : file.type.startsWith("video/webm") ? "video/webm" : null;
    const body = Buffer.from(await file.arrayBuffer());
    if (!contentType || body.length < 30 * 1024 || body.length > 4 * 1024 * 1024) {
      return NextResponse.json({ error: "Vidéo illisible ou trop longue : enregistrez 5 à 10 secondes." }, { status: 400 });
    }

    const state = await getVerificationState(session.userId);
    if (!state.configured || !state.docsConfigured) {
      return NextResponse.json({ error: "La vérification vidéo n'est pas encore activée." }, { status: 503 });
    }
    if (!state.profileId) {
      return NextResponse.json({ error: "Complétez d'abord votre profil.", redirect: "/profil/edit" }, { status: 400 });
    }
    if (!state.hasProfilePhoto) {
      return NextResponse.json(
        { error: "Ajoutez d'abord une photo de profil : elle sera comparée à votre vidéo.", redirect: "/profil/photos" },
        { status: 400 }
      );
    }
    if (state.video.status === "APPROVED") {
      return NextResponse.json({ error: "Votre vidéo est déjà validée." }, { status: 400 });
    }

    const path = await storePrivateFile(VIDEO_BUCKET, session.userId, body, contentType, "video");
    const now = new Date().toISOString();
    const { error } = await getSupabaseAdmin()
      .from("profiles")
      .update({
        videoStatus: "PENDING",
        videoPath: path,
        videoCode: state.video.code || randomVideoCode(),
        videoSubmittedAt: now,
        videoNote: null,
        updatedAt: now,
      })
      .eq("id", state.profileId);
    if (error) throw error;
    forgetVerificationCache(session.userId);

    const { alertVerificationToReview } = await import("@/lib/admin-notify");
    await alertVerificationToReview(state.profileId, "video").catch((e: unknown) => console.warn("[video alert]", e));

    return NextResponse.json({
      success: true,
      status: "PENDING",
      message: "Vidéo reçue ! L'équipe Meet Me Club la vérifie. Les appels seront débloqués dès la validation.",
    });
  } catch (error) {
    console.error("[POST /api/verifications/video]", error);
    return NextResponse.json({ error: "Erreur lors de l'envoi de la vidéo. Réessayez." }, { status: 500 });
  }
}
