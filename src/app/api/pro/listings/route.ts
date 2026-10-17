// src/app/api/pro/listings/route.ts
// POST — publier une annonce dans le Marché
// { title, category, kind: "SALE" | "SERVICE", price?, priceLabel?, description, city?, neighborhood?, photos: dataURL[] }
// Packs Complice (10 ventes par mois, services illimités) et VIP (illimité). Publication immédiate.

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getMemberPlan } from "@/lib/member-plan";
import { isMemberVerified, NOT_VERIFIED_ERROR } from "@/lib/verification";
import { CATEGORIES, MAX_PHOTOS, canPublish, getProByUser, salesLimit, salesThisMonth, storeMarketImage } from "@/lib/market";

export const dynamic = "force-dynamic";

const clean = (v: unknown, max: number) => {
  const s = typeof v === "string" ? v.trim().slice(0, max) : "";
  return s || null;
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!(await isMemberVerified(session.userId))) return NextResponse.json(NOT_VERIFIED_ERROR, { status: 403 });

  try {
    const plan = await getMemberPlan(session);
    if (!canPublish(plan)) {
      return NextResponse.json(
        { error: "La publication d'annonces est réservée aux packs Complice (6 000 FCFA) et VIP.", code: "PLAN_REQUIRED", redirect: "/tarifs" },
        { status: 403 }
      );
    }
    const pro = await getProByUser(session.userId);
    if (!pro) return NextResponse.json({ error: "Créez d'abord votre Espace Pro." }, { status: 400 });
    if (!pro.isActive) return NextResponse.json({ error: "Votre Espace Pro est suspendu. Contactez le support." }, { status: 403 });

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const title = clean(body.title, 90);
    const description = clean(body.description, 3000);
    const category = typeof body.category === "string" && CATEGORIES[body.category] ? body.category : null;
    const kind = body.kind === "SERVICE" ? "SERVICE" : "SALE";
    if (!title || title.length < 4) return NextResponse.json({ error: "Donnez un titre à votre annonce (4 caractères minimum)." }, { status: 400 });
    if (!category) return NextResponse.json({ error: "Choisissez une catégorie." }, { status: 400 });
    if (!description || description.length < 15) return NextResponse.json({ error: "Décrivez votre annonce (15 caractères minimum)." }, { status: 400 });

    const priceNum = body.price === "" || body.price === null || body.price === undefined ? null : Number(body.price);
    if (priceNum !== null && (!isFinite(priceNum) || priceNum < 0 || priceNum > 10_000_000_000)) {
      return NextResponse.json({ error: "Prix invalide." }, { status: 400 });
    }

    const photos = Array.isArray(body.photos) ? body.photos.filter((p): p is string => typeof p === "string").slice(0, MAX_PHOTOS) : [];
    if (kind === "SALE" && photos.length === 0) {
      return NextResponse.json({ error: "Ajoutez au moins une photo de ce que vous vendez." }, { status: 400 });
    }

    // Quota mensuel des ventes (pack Complice)
    const limit = salesLimit(plan);
    if (kind === "SALE" && limit !== null && (await salesThisMonth(session.userId)) >= limit) {
      return NextResponse.json(
        {
          error: `Vous avez atteint vos ${limit} annonces de vente ce mois-ci. Les annonces de services restent illimitées ; passez VIP pour vendre sans limite.`,
          code: "QUOTA_REACHED",
        },
        { status: 403 }
      );
    }

    const id = `ann_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const photoUrls = await Promise.all(photos.map((p, i) => storeMarketImage(session.userId, p, `${id}_${i + 1}`)));
    const now = new Date().toISOString();
    const { data, error } = await getSupabaseAdmin()
      .from("pro_listings")
      .insert({
        id,
        proId: pro.id,
        userId: session.userId,
        title,
        category,
        kind,
        price: priceNum,
        priceLabel: priceNum === null ? clean(body.priceLabel, 40) || (kind === "SERVICE" ? "Sur devis" : "Prix sur demande") : null,
        description,
        city: clean(body.city, 60) || pro.city,
        country: pro.country,
        photos: photoUrls,
        // Visible seulement après validation par l'équipe (Admin > Marché > À valider)
        status: "PENDING",
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .maybeSingle();
    if (error) throw error;

    try {
      const { sendAdminAlert, siteUrl } = await import("@/lib/admin-notify");
      await sendAdminAlert({
        title: "📢 Annonce à valider",
        body: `« ${title} » (${pro.name}) attend votre validation avant d'apparaître dans le Marché.`,
        url: "/admin/marche",
        tag: "market-review",
        emailSubject: `Annonce à valider : ${title}`,
        emailHtml: `<p><strong>${pro.name}</strong> a publié l'annonce <strong>${title}</strong>.</p><p>Elle sera visible dans le Marché et diffusée à tous les membres après votre validation.</p>
          <p><a href="${siteUrl()}/admin/marche" style="display:inline-block;background:#0B2559;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:bold">Vérifier l'annonce</a></p>`,
      });
    } catch (e) {
      console.warn("[listing alert]", e);
    }

    return NextResponse.json({ success: true, listing: data, pending: true });
  } catch (err: any) {
    if (err?.code === "MARKET_NOT_READY") return NextResponse.json({ error: "Le Marché n'est pas encore activé." }, { status: 503 });
    if (err?.status === 400) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error("[POST /api/pro/listings]", err);
    return NextResponse.json({ error: "Publication impossible. Réessayez." }, { status: 500 });
  }
}
