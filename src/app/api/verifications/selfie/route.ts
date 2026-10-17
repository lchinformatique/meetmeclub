// src/app/api/verifications/selfie/route.ts
// GET  /api/verifications/selfie — état de la vérification du membre + geste à reproduire
// POST /api/verifications/selfie — envoi du selfie pris en direct (contrôlé ensuite par l'administrateur)

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { isAdminSession } from "@/lib/admin-auth";
import {
  GESTURES,
  forgetVerificationCache,
  getVerificationState,
  randomGesture,
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
      return NextResponse.json({ configured: true, status: "APPROVED", isAdmin: true });
    }

    const state = await getVerificationState(session.userId);
    if (!state.configured) {
      return NextResponse.json({ configured: false, status: "APPROVED" });
    }

    // Nouveau geste imposé tant que le membre n'a rien envoyé (ou après un refus)
    let gesture = state.gesture;
    if ((state.status === "NONE" || state.status === "REJECTED") && state.profileId && !gesture) {
      gesture = randomGesture();
      await getSupabaseAdmin().from("profiles").update({ verificationGesture: gesture }).eq("id", state.profileId);
    }

    return NextResponse.json({
      configured: true,
      status: state.status,
      gesture,
      gestureText: gesture ? GESTURES[gesture] : null,
      note: state.note,
      submittedAt: state.submittedAt,
      hasProfilePhoto: state.hasProfilePhoto,
      hasProfile: Boolean(state.profileId),
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
    if (state.status === "APPROVED") {
      return NextResponse.json({ error: "Votre profil est déjà vérifié." }, { status: 400 });
    }

    const path = await storeSelfie(session.userId, jpeg);
    const now = new Date().toISOString();
    const { error } = await getSupabaseAdmin()
      .from("profiles")
      .update({
        verificationStatus: "PENDING",
        verificationSelfiePath: path,
        verificationGesture: state.gesture || randomGesture(),
        verificationSubmittedAt: now,
        verificationNote: null,
        updatedAt: now,
      })
      .eq("id", state.profileId);
    if (error) throw error;
    forgetVerificationCache(session.userId);

    // Alerte à l'administrateur (téléphone + e-mail)
    try {
      const { sendAdminAlert, siteUrl } = await import("@/lib/admin-notify");
      const { data: p } = await getSupabaseAdmin()
        .from("profiles")
        .select("firstName, pseudo")
        .eq("id", state.profileId)
        .maybeSingle();
      const who = `${p?.firstName || "Un membre"}${p?.pseudo ? ` (@${p.pseudo})` : ""}`;
      await sendAdminAlert({
        title: "🛡️ Selfie à vérifier",
        body: `${who} attend la validation de son visage.`,
        url: "/admin/verifications",
        tag: "verification",
        emailSubject: `Selfie à vérifier : ${who}`,
        emailHtml: `<p><strong>${who}</strong> a envoyé son selfie de vérification.</p>
          <p>Comparez-le à ses photos de profil, puis validez ou refusez.</p>
          <p><a href="${siteUrl()}/admin/verifications" style="display:inline-block;background:#0B2559;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:bold">Vérifier maintenant</a></p>`,
      });
    } catch (alertErr) {
      console.warn("[selfie alert]", alertErr);
    }

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
