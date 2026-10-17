// src/app/api/sorties/admin/route.ts
// Réservé aux administrateurs.
// GET  ?view=todo|all — sorties à confirmer avec le lieu (contacts du lieu inclus pour négocier)
// POST { id, action: "CONFIRM" | "DECLINE", note? } — valider ou refuser après accord avec le lieu

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { isAdminSession } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { PACKS, STATUS_LABEL, isMissingTable, memberCards, notifyMember, type DateStatus } from "@/lib/sorties";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getSession();
  return (await isAdminSession(session)) ? session : null;
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Réservé aux administrateurs" }, { status: 403 });
  const view = new URL(req.url).searchParams.get("view") || "todo";
  const admin = getSupabaseAdmin();

  let q = admin.from("date_requests").select("*").order("scheduledAt", { ascending: true }).limit(100);
  q = view === "todo" ? q.eq("status", "WAITING_TEAM") : q.neq("status", "WAITING_TEAM");
  const { data, error } = await q;
  if (error) {
    if (isMissingTable(error)) return NextResponse.json({ ready: false, sorties: [], todo: 0 });
    console.error("[GET sorties/admin]", error);
    return NextResponse.json({ error: "Chargement impossible" }, { status: 500 });
  }

  const cards = await memberCards((data || []).flatMap((d: any) => [d.proposerId, d.receiverId]));
  const proIds = Array.from(new Set((data || []).map((d: any) => d.proId).filter(Boolean)));
  const pros: Record<string, any> = {};
  if (proIds.length) {
    const { data: ps } = await admin.from("pro_spaces").select("id, slug, name, whatsapp, phone, facebook, address, city, country").in("id", proIds);
    (ps || []).forEach((p: any) => (pros[p.id] = p));
  }
  const { count: todo } = await admin.from("date_requests").select("id", { count: "exact", head: true }).eq("status", "WAITING_TEAM");

  return NextResponse.json({
    ready: true,
    todo: todo || 0,
    sorties: (data || []).map((d: any) => ({
      id: d.id,
      proposer: { userId: d.proposerId, ...(cards[d.proposerId] || { firstName: "Membre" }) },
      guest: { userId: d.receiverId, ...(cards[d.receiverId] || { firstName: "Membre" }) },
      venue: d.venueSnapshot,
      pro: d.proId ? pros[d.proId] || null : null,
      listingId: d.listingId,
      pack: PACKS[d.pack]?.name || d.pack,
      price: PACKS[d.pack]?.price || null,
      scheduledAt: d.scheduledAt,
      note: d.note,
      status: d.status,
      statusLabel: STATUS_LABEL[d.status as DateStatus] || d.status,
      teamNote: d.teamNote,
      createdAt: d.createdAt,
    })),
  });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Réservé aux administrateurs" }, { status: 403 });
  const { id, action, note } = (await req.json().catch(() => ({}))) as { id?: string; action?: string; note?: string };
  if (!id || (action !== "CONFIRM" && action !== "DECLINE")) return NextResponse.json({ error: "Requête invalide" }, { status: 400 });

  const admin = getSupabaseAdmin();
  const { data: d } = await admin.from("date_requests").select("*").eq("id", id).maybeSingle();
  if (!d || d.status !== "WAITING_TEAM") return NextResponse.json({ error: "Cette sortie n'est plus en attente." }, { status: 400 });

  const status = action === "CONFIRM" ? "CONFIRMED" : "DECLINED_TEAM";
  const teamNote = (note || "").toString().trim().slice(0, 400) || null;
  const { error } = await admin.from("date_requests").update({ status, teamNote, updatedAt: new Date().toISOString() }).eq("id", id);
  if (error) return NextResponse.json({ error: "Enregistrement impossible" }, { status: 500 });

  const place = d.venueSnapshot?.proName || "le lieu";
  const when = new Date(d.scheduledAt).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
  const [title, body] =
    status === "CONFIRMED"
      ? ["🎉 Sortie confirmée !", `Rendez-vous ${when} à ${place}.${teamNote ? ` ${teamNote}` : ""}`]
      : ["Sortie non confirmée", `${place} n'est pas disponible pour cette sortie.${teamNote ? ` ${teamNote}` : " Proposez un autre lieu ou une autre date."}`];
  await Promise.all([notifyMember(d.proposerId, title, body), notifyMember(d.receiverId, title, body)]);

  return NextResponse.json({ success: true, status });
}
