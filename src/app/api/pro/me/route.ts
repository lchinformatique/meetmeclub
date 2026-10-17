// src/app/api/pro/me/route.ts
// GET — mon Espace Pro, mes annonces et mon quota du mois
// PUT — créer / modifier mon Espace Pro (nom de marque, logo, bannière, activité, contacts)

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getMemberPlan } from "@/lib/member-plan";
import { isMemberVerified, NOT_VERIFIED_ERROR } from "@/lib/verification";
import { COUNTRIES } from "@/lib/countries";
import {
  ACTIVITIES,
  CATEGORIES,
  canPublish,
  getProByUser,
  listingsOfPro,
  salesLimit,
  salesThisMonth,
  slugify,
  storeMarketImage,
} from "@/lib/market";

export const dynamic = "force-dynamic";

const NOT_READY = { error: "Le Marché n'est pas encore activé sur le site.", code: "MARKET_NOT_READY" };

export async function GET() {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  try {
    const [plan, verified] = await Promise.all([getMemberPlan(session), isMemberVerified(session.userId)]);
    const pro = await getProByUser(session.userId);
    const [listings, sales] = await Promise.all([
      pro ? listingsOfPro(pro.id, true) : Promise.resolve([]),
      salesThisMonth(session.userId),
    ]);
    return NextResponse.json({
      plan,
      verified,
      canPublish: canPublish(plan),
      quota: { salesThisMonth: sales, salesLimit: salesLimit(plan) },
      pro,
      listings,
      activities: ACTIVITIES,
      categories: CATEGORIES,
    });
  } catch (err: any) {
    if (err?.code === "MARKET_NOT_READY") return NextResponse.json(NOT_READY, { status: 503 });
    console.error("[GET /api/pro/me]", err);
    return NextResponse.json({ error: "Chargement impossible" }, { status: 500 });
  }
}

const clean = (v: unknown, max: number) => {
  const s = typeof v === "string" ? v.trim().slice(0, max) : "";
  return s || null;
};

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!(await isMemberVerified(session.userId))) return NextResponse.json(NOT_VERIFIED_ERROR, { status: 403 });

  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const name = clean(body.name, 60);
    if (!name || name.length < 2) return NextResponse.json({ error: "Indiquez le nom de votre marque ou activité." }, { status: 400 });
    const activity = typeof body.activity === "string" && ACTIVITIES[body.activity] ? body.activity : "OTHER";
    // Téléphone : obligatoire mais PRIVÉ (vu uniquement par l'équipe). Les membres échangent
    // exclusivement par la messagerie de Meet Me Club : aucun WhatsApp / Facebook / site affiché.
    const phone = clean(body.phone, 25);
    if (!phone || phone.replace(/\D/g, "").length < 8) {
      return NextResponse.json({ error: "Indiquez le numéro de téléphone de votre activité (visible uniquement par l'équipe)." }, { status: 400 });
    }
    const country = typeof body.country === "string" && COUNTRIES.some((c) => c.iso === body.country) ? body.country : null;
    const city = clean(body.city, 60);
    const address = clean(body.address, 160);
    if (!country || !city || !address || address.length < 5) {
      return NextResponse.json({ error: "Indiquez le pays, la ville et l'adresse de votre activité." }, { status: 400 });
    }

    const existing = await getProByUser(session.userId);
    const now = new Date().toISOString();
    const update: Record<string, unknown> = {
      name,
      activity,
      description: clean(body.description, 1500),
      city,
      country,
      address,
      whatsapp: null,
      facebook: null,
      phone,
      website: null,
      updatedAt: now,
    };
    // Images envoyées en JPEG (data URL) ; null = supprimer
    for (const key of ["logoUrl", "coverUrl"] as const) {
      const v = body[key];
      if (typeof v === "string" && v.startsWith("data:image/")) {
        update[key] = await storeMarketImage(session.userId, v, key === "logoUrl" ? "logo" : "banniere");
      } else if (v === null) {
        update[key] = null;
      }
    }

    const admin = getSupabaseAdmin();
    const result = existing
      ? await admin.from("pro_spaces").update(update).eq("id", existing.id).select().maybeSingle()
      : await admin
          .from("pro_spaces")
          .insert({ id: `pro_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, userId: session.userId, slug: slugify(name), createdAt: now, ...update })
          .select()
          .maybeSingle();
    if (result.error) throw result.error;

    return NextResponse.json({ success: true, pro: result.data });
  } catch (err: any) {
    if (err?.code === "MARKET_NOT_READY") return NextResponse.json(NOT_READY, { status: 503 });
    if (err?.status === 400) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error("[PUT /api/pro/me]", err);
    return NextResponse.json({ error: "Enregistrement impossible. Réessayez." }, { status: 500 });
  }
}
