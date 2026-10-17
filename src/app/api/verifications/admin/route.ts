// src/app/api/verifications/admin/route.ts
// Réservé aux administrateurs.
// GET  ?type=selfie|document|video&status=PENDING|APPROVED|REJECTED — vérifications à contrôler,
//      avec les photos du profil pour comparer (et la lecture de l'IA pour les pièces)
// GET  ?countOnly=1 — nombre total de vérifications en attente (tableau de bord)
// POST { userId, type, decision: "APPROVE" | "REJECT", note? } — valider ou refuser

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { isAdminSession } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import {
  DOCUMENT_BUCKET,
  DOCUMENT_TYPES,
  GESTURES,
  SELFIE_BUCKET,
  VIDEO_BUCKET,
  forgetVerificationCache,
  isMissingColumn,
  randomGesture,
  randomVideoCode,
  signedUrl,
  type VerificationKind,
} from "@/lib/verification";

export const dynamic = "force-dynamic";

/** Colonnes de chaque type de vérification */
const COLS: Record<VerificationKind, { status: string; submitted: string; reviewed: string; note: string }> = {
  selfie: { status: "verificationStatus", submitted: "verificationSubmittedAt", reviewed: "verificationReviewedAt", note: "verificationNote" },
  document: { status: "idDocStatus", submitted: "idDocSubmittedAt", reviewed: "idDocReviewedAt", note: "idDocNote" },
  video: { status: "videoStatus", submitted: "videoSubmittedAt", reviewed: "videoReviewedAt", note: "videoNote" },
};

const asKind = (v: unknown): VerificationKind => (v === "document" || v === "video" ? v : "selfie");

function ageFrom(dob?: string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  return now.getFullYear() - d.getFullYear() - (now < new Date(now.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0);
}

async function requireAdmin() {
  const session = await getSession();
  return (await isAdminSession(session)) ? session : null;
}

async function countPending(kind: VerificationKind): Promise<number | null> {
  const { count, error } = await getSupabaseAdmin()
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq(COLS[kind].status, "PENDING");
  return error ? null : count || 0;
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Réservé aux administrateurs" }, { status: 403 });

  const params = new URL(req.url).searchParams;
  const kind = asKind(params.get("type"));
  const status = params.get("status") || "PENDING";
  const admin = getSupabaseAdmin();

  const [selfie, document, video] = await Promise.all([countPending("selfie"), countPending("document"), countPending("video")]);
  const pendingByType = { selfie: selfie ?? 0, document: document ?? 0, video: video ?? 0 };

  if (params.get("countOnly")) {
    return NextResponse.json({ configured: selfie !== null, pending: pendingByType.selfie + pendingByType.document + pendingByType.video, pendingByType });
  }

  const col = COLS[kind];
  const { data, error } = await admin
    .from("profiles")
    .select("*, profile_photos(*)")
    .eq(col.status, status)
    .order(col.submitted, { ascending: status === "PENDING" })
    .limit(60);

  if (error) {
    if (isMissingColumn(error)) {
      return NextResponse.json({ configured: selfie !== null, docsConfigured: false, items: [], counts: {}, pendingByType });
    }
    console.error("[GET verifications/admin]", error);
    return NextResponse.json({ error: "Chargement impossible" }, { status: 500 });
  }

  const items = await Promise.all(
    (data || []).map(async (p: any) => {
      const photos = (Array.isArray(p.profile_photos) ? p.profile_photos : [])
        .filter((ph: any) => ph.status !== "COVER")
        .sort((a: any, b: any) => Number(b.isMain) - Number(a.isMain) || (a.order || 0) - (b.order || 0))
        .map((ph: any) => ph.url);
      const base = {
        userId: p.userId,
        firstName: p.firstName,
        lastName: p.lastName,
        pseudo: p.pseudo,
        gender: p.gender,
        city: p.city,
        age: p.age || ageFrom(p.dateOfBirth),
        plan: p.plan,
        photos,
        submittedAt: p[col.submitted],
        reviewedAt: p[col.reviewed],
        note: p[col.note],
      };
      if (kind === "document") {
        const [frontUrl, backUrl] = await Promise.all([
          signedUrl(DOCUMENT_BUCKET, p.idDocFrontPath),
          signedUrl(DOCUMENT_BUCKET, p.idDocBackPath),
        ]);
        return {
          ...base,
          docType: p.idDocType ? DOCUMENT_TYPES[p.idDocType] || p.idDocType : null,
          reviewedBy: p.idDocReviewedBy,
          aiCheck: p.idDocCheck || null,
          frontUrl,
          backUrl,
        };
      }
      if (kind === "video") {
        return { ...base, videoCode: p.videoCode, videoUrl: await signedUrl(VIDEO_BUCKET, p.videoPath) };
      }
      return {
        ...base,
        gestureText: p.verificationGesture ? GESTURES[p.verificationGesture] || p.verificationGesture : null,
        selfieUrl: await signedUrl(SELFIE_BUCKET, p.verificationSelfiePath),
      };
    })
  );

  // Compteurs pour les onglets de statut
  const counts: Record<string, number> = {};
  await Promise.all(
    ["PENDING", "APPROVED", "REJECTED", "NONE"].map(async (s) => {
      const { count } = await admin.from("profiles").select("id", { count: "exact", head: true }).eq(col.status, s);
      counts[s] = count || 0;
    })
  );

  return NextResponse.json({ configured: true, docsConfigured: document !== null, items, counts, pendingByType });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Réservé aux administrateurs" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as { userId?: string; type?: string; decision?: string; note?: string };
  const kind = asKind(body.type);
  if (!body.userId || (body.decision !== "APPROVE" && body.decision !== "REJECT")) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const approved = body.decision === "APPROVE";
  const reason = (body.note || "").toString().trim().slice(0, 300);
  const now = new Date().toISOString();
  const admin = getSupabaseAdmin();

  const { data: current } = await admin.from("profiles").select("id").eq("userId", body.userId).maybeSingle();
  if (!current) return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });

  const col = COLS[kind];
  const update: Record<string, unknown> = {
    [col.status]: approved ? "APPROVED" : "REJECTED",
    [col.reviewed]: now,
    [col.note]: approved ? null : reason || "La vérification n'a pas pu être validée.",
    updatedAt: now,
  };
  // Après un refus, nouveau geste / nouveau code pour le prochain essai
  if (!approved && kind === "selfie") update.verificationGesture = randomGesture();
  if (!approved && kind === "video") update.videoCode = randomVideoCode();
  if (kind === "document") update.idDocReviewedBy = "ADMIN";

  const { error } = await admin.from("profiles").update(update).eq("id", current.id);
  if (error) {
    console.error("[POST verifications/admin]", error);
    return NextResponse.json({ error: "Enregistrement impossible" }, { status: 500 });
  }
  forgetVerificationCache(body.userId);

  // Prévenir le membre (notification téléphone + mise à jour en direct)
  const label = { selfie: "Votre selfie", document: "Votre pièce d'identité", video: "Votre vidéo VIP" }[kind];
  try {
    const { sendPushToUser } = await import("@/lib/push-server");
    const { broadcastToUser } = await import("@/lib/realtime-server");
    await Promise.allSettled([
      sendPushToUser(body.userId, {
        title: approved ? "✅ Vérification validée !" : "Vérification à reprendre",
        body: approved
          ? kind === "video"
            ? "Votre vidéo a été validée : les appels audio et vidéo sont débloqués."
            : `${label} a été validé(e). Bienvenue dans le club : vous pouvez échanger avec les membres.`
          : `${label} n'a pas pu être validé(e). ${reason}`.trim(),
        url: approved ? "/decouverte" : "/verification",
        tag: "verification",
      }),
      broadcastToUser(body.userId, "verification", { type: kind, status: approved ? "APPROVED" : "REJECTED" }),
    ]);
  } catch (notifyErr) {
    console.warn("[verification notify]", notifyErr);
  }

  return NextResponse.json({ success: true, status: approved ? "APPROVED" : "REJECTED" });
}
