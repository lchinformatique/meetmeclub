// src/app/api/pro/listings/[id]/route.ts
// PATCH  { status: "SOLD" | "ACTIVE" } — l'auteur marque son annonce vendue / disponible
// DELETE — l'auteur supprime son annonce (elle compte toujours dans le quota du mois)

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

async function ownListing(id: string, userId: string) {
  const { data } = await getSupabaseAdmin().from("pro_listings").select("id, userId, status").eq("id", id).maybeSingle();
  return data && data.userId === userId && data.status !== "REMOVED" && data.status !== "DELETED" ? data : null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const { id } = await params;
  const current = await ownListing(id, session.userId);
  if (!current) return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
  // Une annonce en attente ne peut être mise en ligne que par l'équipe
  if (current.status !== "ACTIVE" && current.status !== "SOLD") {
    return NextResponse.json({ error: "Annonce en attente de validation par l'équipe." }, { status: 400 });
  }

  const { status } = (await req.json().catch(() => ({}))) as { status?: string };
  if (status !== "SOLD" && status !== "ACTIVE") return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  const { error } = await getSupabaseAdmin().from("pro_listings").update({ status, updatedAt: new Date().toISOString() }).eq("id", id);
  if (error) return NextResponse.json({ error: "Mise à jour impossible" }, { status: 500 });
  return NextResponse.json({ success: true, status });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const { id } = await params;
  if (!(await ownListing(id, session.userId))) return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });

  const { error } = await getSupabaseAdmin().from("pro_listings").update({ status: "DELETED", updatedAt: new Date().toISOString() }).eq("id", id);
  if (error) return NextResponse.json({ error: "Suppression impossible" }, { status: 500 });
  return NextResponse.json({ success: true });
}
