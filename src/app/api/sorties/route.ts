// src/app/api/sorties/route.ts
// GET  — mes sorties (proposées et reçues) ; ?venues=1&city=&country= — lieux disponibles
// POST { receiverId, listingId, pack, scheduledAt, note? } — inviter un membre dans un lieu du Marché

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { isMemberVerified, NOT_VERIFIED_ERROR } from "@/lib/verification";
import { PACKS, STATUS_LABEL, VENUE_CATEGORIES, isMissingTable, listVenues, memberCards, notifyMember, type DateStatus } from "@/lib/sorties";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const params = new URL(req.url).searchParams;

  try {
    if (params.get("venues")) {
      return NextResponse.json({ venues: await listVenues({ city: params.get("city") || undefined, country: params.get("country") || undefined }) });
    }

    const { data, error } = await getSupabaseAdmin()
      .from("date_requests")
      .select("*")
      .or(`proposerId.eq.${session.userId},receiverId.eq.${session.userId}`)
      .order("scheduledAt", { ascending: false })
      .limit(100);
    if (error) {
      if (isMissingTable(error)) return NextResponse.json({ sorties: [], ready: false });
      throw error;
    }
    const cards = await memberCards((data || []).flatMap((d: any) => [d.proposerId, d.receiverId]));
    const sorties = (data || []).map((d: any) => {
      const mine = d.proposerId === session.userId;
      const other = cards[mine ? d.receiverId : d.proposerId] || { firstName: "Membre" };
      return {
        id: d.id,
        role: mine ? "proposer" : "guest",
        other: { userId: mine ? d.receiverId : d.proposerId, ...other },
        venue: d.venueSnapshot,
        pack: d.pack,
        packName: PACKS[d.pack]?.name || d.pack,
        price: PACKS[d.pack]?.price || null,
        scheduledAt: d.scheduledAt,
        note: d.note,
        status: d.status,
        statusLabel: STATUS_LABEL[d.status as DateStatus] || d.status,
        teamNote: d.teamNote,
      };
    });
    return NextResponse.json({ sorties, ready: true });
  } catch (err) {
    console.error("[GET /api/sorties]", err);
    return NextResponse.json({ error: "Chargement impossible" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!(await isMemberVerified(session.userId))) return NextResponse.json(NOT_VERIFIED_ERROR, { status: 403 });

  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const receiverId = typeof body.receiverId === "string" ? body.receiverId : "";
    const listingId = typeof body.listingId === "string" ? body.listingId : "";
    const pack = typeof body.pack === "string" && PACKS[body.pack] ? body.pack : "";
    const scheduled = new Date(String(body.scheduledAt || ""));
    const note = typeof body.note === "string" ? body.note.trim().slice(0, 500) : "";

    if (!receiverId || receiverId === session.userId || !/^[A-Za-z0-9_-]{1,80}$/.test(receiverId)) {
      return NextResponse.json({ error: "Choisissez la personne à inviter." }, { status: 400 });
    }
    if (!listingId) return NextResponse.json({ error: "Choisissez un lieu." }, { status: 400 });
    if (!pack) return NextResponse.json({ error: "Choisissez un pack." }, { status: 400 });
    if (isNaN(scheduled.getTime()) || scheduled.getTime() < Date.now() + 24 * 3600 * 1000) {
      return NextResponse.json({ error: "La sortie doit être prévue au moins 24 h à l'avance (le temps de confirmer le lieu)." }, { status: 400 });
    }
    if (!(await isMemberVerified(receiverId))) {
      return NextResponse.json({ error: "Cette personne n'a pas encore de profil vérifié." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const { data: listing } = await admin
      .from("pro_listings")
      .select('id, title, category, photos, city, country, status, pro:pro_spaces!inner(id, name, address, city, country, "isActive")')
      .eq("id", listingId)
      .maybeSingle();
    const pro: any = (listing as any)?.pro;
    if (!listing || listing.status !== "ACTIVE" || !VENUE_CATEGORIES.includes(listing.category) || !pro?.isActive) {
      return NextResponse.json({ error: "Ce lieu n'est plus disponible." }, { status: 400 });
    }

    // Pas deux demandes en cours avec la même personne
    const { count } = await admin
      .from("date_requests")
      .select("id", { count: "exact", head: true })
      .in("status", ["WAITING_GUEST", "WAITING_TEAM"])
      .or(`and(proposerId.eq.${session.userId},receiverId.eq.${receiverId}),and(proposerId.eq.${receiverId},receiverId.eq.${session.userId})`);
    if ((count || 0) > 0) {
      return NextResponse.json({ error: "Une invitation est déjà en cours avec cette personne." }, { status: 409 });
    }

    const now = new Date().toISOString();
    const id = `sortie_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const { error } = await admin.from("date_requests").insert({
      id,
      proposerId: session.userId,
      receiverId,
      listingId,
      proId: pro.id,
      venueSnapshot: {
        title: listing.title,
        proName: pro.name,
        address: pro.address,
        city: listing.city || pro.city,
        country: listing.country || pro.country,
        photo: (listing.photos as string[] | null)?.[0] || null,
      },
      pack,
      scheduledAt: scheduled.toISOString(),
      note: note || null,
      status: "WAITING_GUEST",
      createdAt: now,
      updatedAt: now,
    });
    if (error) {
      if (isMissingTable(error)) return NextResponse.json({ error: "Les sorties ne sont pas encore activées." }, { status: 503 });
      throw error;
    }

    const cards = await memberCards([session.userId]);
    await notifyMember(receiverId, "📅 Invitation à une sortie", `${cards[session.userId]?.firstName || "Un membre"} vous invite à ${pro.name}. Répondez dans Mes sorties.`);

    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error("[POST /api/sorties]", err);
    return NextResponse.json({ error: "Envoi impossible. Réessayez." }, { status: 500 });
  }
}
