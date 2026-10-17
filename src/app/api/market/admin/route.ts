// src/app/api/market/admin/route.ts
// Réservé aux administrateurs.
// GET  ?view=pending|reported|all|removed — annonces à valider, signalées, en ligne, retirées
// POST { id, action: "APPROVE" } — valider une annonce en attente : mise en ligne + message à tous les membres
// POST { id, action: "BROADCAST" } — rediffuser une annonce en ligne à tous les membres
// POST { id, action: "REMOVE" | "RESTORE", reason? } — refuser / retirer / remettre une annonce
// POST { proId, action: "SUSPEND_PRO" | "RESTORE_PRO" } — suspendre / réactiver un Espace Pro

import { NextRequest, NextResponse, after } from "next/server";
import { getSession } from "@/lib/session";
import { isAdminSession } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { isMissingTable } from "@/lib/market";

export const dynamic = "force-dynamic";
// Diffusion d'une annonce à tous les membres (messages + notifications)
export const maxDuration = 120;

async function requireAdmin() {
  const session = await getSession();
  return (await isAdminSession(session)) ? session : null;
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Réservé aux administrateurs" }, { status: 403 });
  const view = new URL(req.url).searchParams.get("view") || "pending";
  const admin = getSupabaseAdmin();

  let q = admin.from("pro_listings").select('*, pro:pro_spaces(id, slug, name, "logoUrl", "isActive", "userId")').limit(100);
  if (view === "pending") q = q.eq("status", "PENDING").order("createdAt", { ascending: true });
  else if (view === "reported") q = q.gt("reportsCount", 0).in("status", ["ACTIVE", "SOLD"]).order("reportsCount", { ascending: false });
  else if (view === "removed") q = q.eq("status", "REMOVED").order("updatedAt", { ascending: false });
  else q = q.in("status", ["ACTIVE", "SOLD"]).order("createdAt", { ascending: false });

  const { data, error } = await q;
  if (error) {
    if (isMissingTable(error)) return NextResponse.json({ ready: false, listings: [] });
    console.error("[GET market/admin]", error);
    return NextResponse.json({ error: "Chargement impossible" }, { status: 500 });
  }

  // Motifs des signalements
  const ids = (data || []).map((l: any) => l.id);
  const reasons: Record<string, string[]> = {};
  if (ids.length) {
    const { data: reps } = await admin.from("pro_reports").select('"listingId", reason').in("listingId", ids);
    (reps || []).forEach((r: any) => (reasons[r.listingId] ||= []).push(r.reason || "—"));
  }

  const { count: reported } = await admin
    .from("pro_listings")
    .select("id", { count: "exact", head: true })
    .gt("reportsCount", 0)
    .in("status", ["ACTIVE", "SOLD"]);

  const { count: pending } = await admin.from("pro_listings").select("id", { count: "exact", head: true }).eq("status", "PENDING");

  return NextResponse.json({ ready: true, listings: (data || []).map((l: any) => ({ ...l, reportReasons: reasons[l.id] || [] })), reported: reported || 0, pending: pending || 0 });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Réservé aux administrateurs" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { id?: string; proId?: string; action?: string; reason?: string };
  const admin = getSupabaseAdmin();
  const now = new Date().toISOString();

  if ((body.action === "SUSPEND_PRO" || body.action === "RESTORE_PRO") && body.proId) {
    const { error } = await admin.from("pro_spaces").update({ isActive: body.action === "RESTORE_PRO", updatedAt: now }).eq("id", body.proId);
    return error ? NextResponse.json({ error: "Échec" }, { status: 500 }) : NextResponse.json({ success: true });
  }

  // Validation (ou rediffusion) : visible de tous + message dans la messagerie de chaque membre
  if ((body.action === "APPROVE" || body.action === "BROADCAST") && body.id) {
    const { data: l } = await admin.from("pro_listings").select("id, status, userId, title").eq("id", body.id).maybeSingle();
    if (!l) return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
    if (body.action === "APPROVE") {
      if (l.status !== "PENDING") return NextResponse.json({ error: "Cette annonce n'est plus en attente." }, { status: 400 });
      const { error } = await admin.from("pro_listings").update({ status: "ACTIVE", updatedAt: now }).eq("id", l.id);
      if (error) return NextResponse.json({ error: "Échec" }, { status: 500 });
      try {
        const { sendPushToUser } = await import("@/lib/push-server");
        await sendPushToUser(l.userId, { title: "✅ Annonce publiée", body: `« ${l.title} » est en ligne dans le Marché.`, url: `/marche/annonce/${l.id}`, tag: "market" });
      } catch {}
    } else if (l.status !== "ACTIVE") {
      return NextResponse.json({ error: "Seule une annonce en ligne peut être diffusée." }, { status: 400 });
    }
    // Envoi à tous les membres après la réponse (peut prendre quelques secondes)
    after(async () => {
      try {
        const { broadcastListing } = await import("@/lib/market-broadcast");
        const { sent } = await broadcastListing(l.id, session.userId);
        console.log(`[market broadcast] ${l.id} → ${sent} membres`);
      } catch (e) {
        console.error("[market broadcast]", e);
      }
    });
    return NextResponse.json({ success: true, broadcasting: true });
  }

  if (!body.id || (body.action !== "REMOVE" && body.action !== "RESTORE")) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  const remove = body.action === "REMOVE";
  const { data: listing, error } = await admin
    .from("pro_listings")
    .update(
      remove
        ? { status: "REMOVED", removedReason: (body.reason || "Annonce non conforme").slice(0, 200), updatedAt: now }
        : { status: "ACTIVE", removedReason: null, reportsCount: 0, updatedAt: now }
    )
    .eq("id", body.id)
    .select("userId, title")
    .maybeSingle();
  if (error || !listing) return NextResponse.json({ error: "Échec" }, { status: 500 });

  if (remove) {
    try {
      const { sendPushToUser } = await import("@/lib/push-server");
      await sendPushToUser(listing.userId, {
        title: "Annonce retirée",
        body: `« ${listing.title} » a été retirée du Marché : ${body.reason || "annonce non conforme"}.`,
        url: "/pro/mon-espace",
        tag: "market",
      });
    } catch {}
  }
  return NextResponse.json({ success: true });
}
