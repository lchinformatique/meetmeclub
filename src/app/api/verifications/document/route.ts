// src/app/api/verifications/document/route.ts
// POST /api/verifications/document — pièce d'identité (packs Essentiel 3 000, Complice 6 000 et VIP)
// FormData : docType, front (photo du recto, JPEG), back (verso, facultatif)
// Pré-contrôle par IA : approuvée automatiquement si tout concorde, sinon envoyée à l'équipe.

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getMemberPlan } from "@/lib/member-plan";
import { checkIdentityDocument } from "@/lib/id-check";
import {
  DOCUMENT_BUCKET,
  DOCUMENT_TYPES,
  forgetVerificationCache,
  getVerificationState,
  storePrivateFile,
} from "@/lib/verification";

export const dynamic = "force-dynamic";
// Lecture de la pièce par l'IA : quelques secondes à une minute
export const maxDuration = 120;

async function readJpeg(value: FormDataEntryValue | null): Promise<Buffer | null> {
  if (!value || typeof value === "string") return null;
  if (value.type !== "image/jpeg") return null;
  const buf = Buffer.from(await value.arrayBuffer());
  return buf.length >= 20 * 1024 && buf.length <= 4 * 1024 * 1024 ? buf : null;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const plan = await getMemberPlan(session);
    if (plan === "FREE") {
      return NextResponse.json(
        { error: "La vérification par pièce d'identité est réservée aux packs Essentiel, Complice et VIP. En essai gratuit, faites la vérification par selfie." },
        { status: 403 }
      );
    }

    const form = await req.formData();
    const docType = String(form.get("docType") || "");
    if (!DOCUMENT_TYPES[docType]) {
      return NextResponse.json({ error: "Choisissez le type de pièce d'identité." }, { status: 400 });
    }
    const front = await readJpeg(form.get("front"));
    const back = await readJpeg(form.get("back"));
    if (!front) {
      return NextResponse.json({ error: "Photo du recto manquante ou illisible : reprenez la photo de votre pièce." }, { status: 400 });
    }

    const state = await getVerificationState(session.userId);
    if (!state.configured || !state.docsConfigured) {
      return NextResponse.json({ error: "La vérification par pièce d'identité n'est pas encore activée." }, { status: 503 });
    }
    if (!state.profileId) {
      return NextResponse.json({ error: "Complétez d'abord votre profil.", redirect: "/profil/edit" }, { status: 400 });
    }
    if (state.document.status === "APPROVED") {
      return NextResponse.json({ error: "Votre pièce d'identité est déjà validée." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from("profiles").select("firstName, lastName").eq("id", state.profileId).maybeSingle();

    const [frontPath, backPath] = await Promise.all([
      storePrivateFile(DOCUMENT_BUCKET, session.userId, front, "image/jpeg", "recto"),
      back ? storePrivateFile(DOCUMENT_BUCKET, session.userId, back, "image/jpeg", "verso") : Promise.resolve(null),
    ]);

    const check = await checkIdentityDocument({
      front,
      back,
      declaredType: docType,
      profile: { firstName: profile?.firstName, lastName: profile?.lastName },
    });

    const now = new Date().toISOString();
    const { error } = await admin
      .from("profiles")
      .update({
        idDocStatus: check.approved ? "APPROVED" : "PENDING",
        idDocType: docType,
        idDocFrontPath: frontPath,
        idDocBackPath: backPath,
        idDocSubmittedAt: now,
        idDocReviewedAt: check.approved ? now : null,
        idDocReviewedBy: check.approved ? "AI" : null,
        idDocNote: check.approved ? null : check.reasons.join(" "),
        idDocCheck: check.reading ? { ...check.reading, reasons: check.reasons } : { reasons: check.reasons },
        updatedAt: now,
      })
      .eq("id", state.profileId);
    if (error) throw error;
    forgetVerificationCache(session.userId);

    if (!check.approved) {
      const { alertVerificationToReview } = await import("@/lib/admin-notify");
      await alertVerificationToReview(state.profileId, "document", check.reasons.join(" ")).catch((e: unknown) =>
        console.warn("[document alert]", e)
      );
    }

    return NextResponse.json({
      success: true,
      status: check.approved ? "APPROVED" : "PENDING",
      message: check.approved
        ? "Pièce d'identité validée ! Votre profil est vérifié : vous pouvez échanger avec les membres."
        : "Pièce reçue. Elle doit être vérifiée par l'équipe Meet Me Club : vous serez prévenu(e) dès la validation.",
    });
  } catch (error) {
    console.error("[POST /api/verifications/document]", error);
    return NextResponse.json({ error: "Erreur lors de l'envoi de votre pièce d'identité. Réessayez." }, { status: 500 });
  }
}
