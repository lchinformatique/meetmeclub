// src/lib/market.ts
// Marché Meet Me Club : Espaces Pro (marque, contacts) et annonces classées par catégorie.
// Règles : tout membre vérifié crée son Espace Pro ; les packs Complice (6 000) et VIP publient.
// Complice : 10 annonces « Vente » par mois, services illimités. VIP : illimité.
// Publication immédiate ; les membres signalent, l'administrateur retire.

import { getSupabaseAdmin } from "./supabase-server";
import type { MemberPlan } from "./member-plan";
import { queryTerms, scoreListing } from "./market-search";

export * from "./market-constants";
import { CATEGORIES, COMPLICE_MONTHLY_SALES } from "./market-constants";
import type { ListingKind, ListingStatus } from "./market-constants";

export interface ProSpace {
  id: string;
  userId: string;
  slug: string;
  name: string;
  activity: string;
  logoUrl: string | null;
  coverUrl: string | null;
  description: string | null;
  city: string | null;
  country: string | null;
  address: string | null;
  neighborhood?: string | null;
  whatsapp: string | null;
  facebook: string | null;
  phone: string | null;
  website: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Listing {
  id: string;
  proId: string;
  userId: string;
  title: string;
  category: string;
  kind: ListingKind;
  price: number | null;
  priceLabel: string | null;
  description: string | null;
  city: string | null;
  country: string | null;
  neighborhood?: string | null;
  photos: string[];
  status: ListingStatus;
  views: number;
  reportsCount: number;
  removedReason: string | null;
  createdAt: string;
  pro?: Pick<ProSpace, "id" | "slug" | "name" | "logoUrl" | "activity" | "city" | "country"> | null;
}

/** Contacts d'un pro : réservés aux membres connectés */
export type PublicPro = Omit<ProSpace, "whatsapp" | "facebook" | "phone" | "website">;

export function stripContacts(p: ProSpace): PublicPro {
  const { whatsapp: _w, facebook: _f, phone: _p, website: _s, ...rest } = p;
  return rest;
}

/** Tables absentes (migration v6 non exécutée) */
export function isMissingTable(error: any): boolean {
  return Boolean(error) && (error.code === "42P01" || error.code === "PGRST205" || /relation|table/i.test(error.message || ""));
}

export function canPublish(plan: MemberPlan) {
  return plan === "COMPLICE" || plan === "VIP";
}

/** Annonces « Vente » créées depuis le 1er du mois (les annonces supprimées comptent aussi) */
export async function salesThisMonth(userId: string): Promise<number> {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const { count } = await getSupabaseAdmin()
    .from("pro_listings")
    .select("id", { count: "exact", head: true })
    .eq("userId", userId)
    .eq("kind", "SALE")
    .gte("createdAt", start.toISOString());
  return count || 0;
}

export function salesLimit(plan: MemberPlan): number | null {
  if (plan === "VIP") return null;
  if (plan === "COMPLICE") return COMPLICE_MONTHLY_SALES;
  return 0;
}

export function slugify(name: string) {
  const base = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${base || "pro"}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Lien WhatsApp avec message prérempli (numéro au format international, ex. 22890123456) */
export function whatsappLink(raw: string | null | undefined, message: string) {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function facebookLink(raw: string | null | undefined) {
  if (!raw) return null;
  const v = raw.trim();
  if (/^https?:\/\//i.test(v)) return /facebook\.com|fb\.com|fb\.me/i.test(v) ? v : null;
  return `https://www.facebook.com/${v.replace(/^@/, "").replace(/^(www\.)?facebook\.com\//i, "")}`;
}

const LISTING_WITH_PRO = '*, pro:pro_spaces!inner(id, slug, name, "logoUrl", activity, city, country, "isActive")';

export interface MarketQuery {
  category?: string;
  city?: string;
  country?: string;
  kind?: string;
  q?: string;
  page?: number;
}

export const PAGE_SIZE = 24;

/** Annonces visibles du Marché (filtres + pagination) */
export async function searchListings(query: MarketQuery) {
  let req = getSupabaseAdmin()
    .from("pro_listings")
    .select(LISTING_WITH_PRO, { count: "exact" })
    .in("status", ["ACTIVE", "SOLD"])
    .eq("pro.isActive", true)
    .order("createdAt", { ascending: false });

  if (query.category && CATEGORIES[query.category]) req = req.eq("category", query.category);
  if (query.kind === "SALE" || query.kind === "SERVICE") req = req.eq("kind", query.kind);
  if (query.city) req = req.ilike("city", `%${query.city.replace(/[%_,()]/g, "")}%`);
  if (query.country && /^[A-Z]{2}$/.test(query.country)) req = req.eq("country", query.country);
  const page = Math.max(1, query.page || 1);
  const terms = query.q ? queryTerms(query.q) : [];

  // Recherche par mots : les annonces filtrées sont classées par pertinence (accents, pluriels, synonymes)
  if (terms.length) {
    const { data, error } = await req.limit(1000);
    if (error) {
      if (isMissingTable(error)) return { listings: [] as Listing[], total: 0, ready: false };
      throw error;
    }
    const ranked = ((data || []) as Listing[])
      .map((l) => ({ l, s: scoreListing(l as any, terms) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s || b.l.createdAt.localeCompare(a.l.createdAt))
      .map((x) => x.l);
    return { listings: ranked.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), total: ranked.length, ready: true };
  }

  req = req.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const { data, count, error } = await req;
  if (error) {
    if (isMissingTable(error)) return { listings: [] as Listing[], total: 0, ready: false };
    throw error;
  }
  return { listings: (data || []) as Listing[], total: count || 0, ready: true };
}

/** Nombre d'annonces visibles par catégorie */
export async function categoryCounts(): Promise<Record<string, number>> {
  const { data, error } = await getSupabaseAdmin()
    .from("pro_listings")
    .select("category, pro:pro_spaces!inner(\"isActive\")")
    .eq("status", "ACTIVE")
    .eq("pro.isActive", true)
    .limit(5000);
  if (error) return {};
  const counts: Record<string, number> = {};
  (data || []).forEach((r: any) => (counts[r.category] = (counts[r.category] || 0) + 1));
  return counts;
}

export async function getListing(id: string): Promise<(Listing & { proFull: ProSpace | null }) | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from("pro_listings").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  const { data: pro } = await admin.from("pro_spaces").select("*").eq("id", data.proId).maybeSingle();
  return { ...(data as Listing), proFull: (pro as ProSpace) || null };
}

export async function getProBySlug(slug: string): Promise<ProSpace | null> {
  const { data } = await getSupabaseAdmin().from("pro_spaces").select("*").eq("slug", slug).maybeSingle();
  return (data as ProSpace) || null;
}

export async function getProByUser(userId: string): Promise<ProSpace | null> {
  const { data, error } = await getSupabaseAdmin().from("pro_spaces").select("*").eq("userId", userId).maybeSingle();
  if (error && isMissingTable(error)) throw Object.assign(new Error("MARKET_NOT_READY"), { code: "MARKET_NOT_READY" });
  return (data as ProSpace) || null;
}

export async function listingsOfPro(proId: string, includeAll = false): Promise<Listing[]> {
  let req = getSupabaseAdmin().from("pro_listings").select("*").eq("proId", proId).order("createdAt", { ascending: false }).limit(200);
  req = includeAll ? req.neq("status", "DELETED") : req.in("status", ["ACTIVE", "SOLD"]);
  const { data } = await req;
  return (data || []) as Listing[];
}

/** Date de la dernière annonce publiée (pastille « nouveau » du Marché) */
export async function latestListingAt(): Promise<string | null> {
  return (await latestListing())?.at || null;
}

/** Dernière annonce mise en ligne (validation = mise à jour la plus récente) : fenêtre « Nouvelle annonce » */
export async function latestListing(): Promise<{ id: string; title: string; photo: string | null; price: string; at: string } | null> {
  const { data } = await getSupabaseAdmin()
    .from("pro_listings")
    .select('id, title, photos, price, "priceLabel", "updatedAt"')
    .eq("status", "ACTIVE")
    .order("updatedAt", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return { id: data.id, title: data.title, photo: (data.photos as string[] | null)?.[0] || null, price: formatPriceShort(data), at: data.updatedAt };
}

function formatPriceShort(l: { price: number | null; priceLabel: string | null }) {
  return l.price !== null && l.price !== undefined ? `${Number(l.price).toLocaleString("fr-FR")} FCFA` : l.priceLabel || "Prix sur demande";
}

/** Enregistre une image (data URL JPEG) dans l'espace public des médias */
export async function storeMarketImage(userId: string, dataUrl: string, name: string): Promise<string> {
  const match = dataUrl.match(/^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw Object.assign(new Error("Image invalide"), { status: 400 });
  const buf = Buffer.from(match[1], "base64");
  if (buf.length > 3 * 1024 * 1024) throw Object.assign(new Error("Image trop lourde"), { status: 400 });
  const { uploadToSupabaseStorage } = await import("./supabase-storage");
  const res = await uploadToSupabaseStorage(userId, "gallery", buf, "image/jpeg", `marche_${name}`);
  return res.url;
}
