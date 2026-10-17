// src/app/api/verifications/admin/route.ts
// Réservé aux administrateurs.
// GET  ?status=PENDING|APPROVED|REJECTED — selfies à contrôler, avec les photos du profil pour comparer
// POST { userId, decision: "APPROVE" | "REJECT", note? } — valider ou refuser un membre

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { isAdminSession } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import {
  GESTURES,
  forgetVerificationCache,
  isMissingColumn,
  randomGesture,
  signedSelfieUrl,
} from "@/lib/verification";

export const dynamic = "force-dynamic";

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

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Réservé aux administrateurs" }, { status: 403 });

  const params = new URL(req.url).searchParams;
  const status = params.get("status") || "PENDING";
  const admin = getSupabaseAdmin();

  // Tableau de bord : seulement le nombre de selfies en attente
  if (params.get("countOnly")) {
    const { count, error } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("verificationStatus", "PENDING");
    return NextResponse.json({ configured: !(error && isMissingColumn(error)), pending: count || 0 });
  }

  const { data, error } = await admin
    .from("profiles")
    .select("*, profile_photos(*)")
    .eq("verificationStatus", status)
    .order("verificationSubmittedAt", { ascending: status !== "PENDING" ? false : true })
    .limit(60);

  if (error) {
    if (isMissingColumn(error)) return NextResponse.json({ configured: false, items: [], counts: {} });
    console.error("[GET verifications/admin]", error);
    return NextResponse.json({ error: "Chargement impossible" }, { status: 500 });
  }

  const items = await Promise.all(
    (data || []).map(async (p: any) => {
      const photos = (Array.isArray(p.profile_photos) ? p.profile_photos : [])
        .filter((ph: any) => ph.status !== "COVER")
        .sort((a: any, b: any) => Number(b.isMain) - Number(a.isMain) || (a.order || 0) - (b.order || 0))
        .map((ph: any) => ph.url);
      return {
        userId: p.userId,
        firstName: p.firstName,
        lastName: p.lastName,
        pseudo: p.pseudo,
        gender: p.gender,
        city: p.city,
        age: p.age || ageFrom(p.dateOfBirth),
        gesture: p.verificationGesture,
        gestureText: p.verificationGesture ? GESTURES[p.verificationGesture] || p.verificationGesture : null,
        selfieUrl: await signedSelfieUrl(p.verificationSelfiePath),
        photos,
        submittedAt: p.verificationSubmittedAt,
        reviewedAt: p.verificationReviewedAt,
        note: p.verificationNote,
      };
    })
  );

  // Compteurs pour les onglets
  const counts: Record<string, number> = {};
  await Promise.all(
    ["PENDING", "APPROVED", "REJECTED", "NONE"].map(async (s) => {
      const { count } = await admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("verificationStatus", s);
      counts[s] = count || 0;
    })
  );

  return NextResponse.json({ configured: true, items, counts });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Réservé aux administrateurs" }, { status: 403 });

  const { userId, decision, note } = (await req.json().catch(() => ({}))) as {
    userId?: string;
    decision?: "APPROVE" | "REJECT";
    note?: string;
  };
  if (!userId || (decision !== "APPROVE" && decision !== "REJECT")) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const approved = decision === "APPROVE";
  const reason = (note || "").toString().trim().slice(0, 300);
  const now = new Date().toISOString();
  const admin = getSupabaseAdmin();

  const { data: current } = await admin
    .from("profiles")
    .select('id, "verificationGesture"')
    .eq("userId", userId)
    .maybeSingle();
  if (!current) return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });

  const { error } = await admin
    .from("profiles")
    .update({
      verificationStatus: approved ? "APPROVED" : "REJECTED",
      verificationReviewedAt: now,
      verificationNote: approved ? null : reason || "Le selfie ne correspond pas aux photos du profil.",
      // Après un refus, un nouveau geste est imposé pour le prochain essai
      verificationGesture: approved ? current.verificationGesture : randomGesture(current.verificationGesture),
      updatedAt: now,
    })
    .eq("id", current.id);
  if (error) {
    console.error("[POST verifications/admin]", error);
    return NextResponse.json({ error: "Enregistrement impossible" }, { status: 500 });
  }
  forgetVerificationCache(userId);

  // Prévenir le membre (notification téléphone + mise à jour en direct)
  try {
    const { sendPushToUser } = await import("@/lib/push-server");
    const { broadcastToUser } = await import("@/lib/realtime-server");
    await Promise.allSettled([
      sendPushToUser(userId, {
        title: approved ? "✅ Profil vérifié !" : "Selfie à reprendre",
        body: approved
          ? "Votre visage a été vérifié. Bienvenue dans le club : vous pouvez maintenant échanger avec les membres."
          : reason || "Votre selfie n'a pas pu être validé. Reprenez-le en suivant le geste demandé.",
        url: approved ? "/decouverte" : "/verification",
        tag: "verification",
      }),
      broadcastToUser(userId, "verification", { status: approved ? "APPROVED" : "REJECTED" }),
    ]);
  } catch (notifyErr) {
    console.warn("[verification notify]", notifyErr);
  }

  return NextResponse.json({ success: true, status: approved ? "APPROVED" : "REJECTED" });
}
