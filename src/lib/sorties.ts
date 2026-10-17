// src/lib/sorties.ts
// Sorties : un membre invite un autre membre dans un lieu du Marché (hôtel, logement).
// Circuit : WAITING_GUEST (l'invité répond) → WAITING_TEAM (l'équipe négocie avec le lieu)
//           → CONFIRMED / DECLINED_TEAM. L'invité peut refuser (DECLINED_GUEST),
//           chacun peut annuler avant confirmation (CANCELLED).

import { getSupabaseAdmin } from "./supabase-server";

/** Catégories du Marché proposées comme lieux de sortie */
export const VENUE_CATEGORIES = ["HOTEL", "REAL_ESTATE"];

export const PACKS: Record<string, { name: string; price: number }> = {
  DECOUVERTE: { name: "Découverte", price: 2000 },
  COMPLICE: { name: "Complice", price: 5000 },
  DINER: { name: "Dîner", price: 12000 },
  VIP_PREMIUM: { name: "VIP Premium", price: 30000 },
};

export type DateStatus = "WAITING_GUEST" | "WAITING_TEAM" | "CONFIRMED" | "DECLINED_GUEST" | "DECLINED_TEAM" | "CANCELLED";

export const STATUS_LABEL: Record<DateStatus, string> = {
  WAITING_GUEST: "En attente de la réponse de l'invité(e)",
  WAITING_TEAM: "Accepté · l'équipe confirme le lieu",
  CONFIRMED: "Confirmé",
  DECLINED_GUEST: "Refusé par l'invité(e)",
  DECLINED_TEAM: "Lieu non disponible",
  CANCELLED: "Annulé",
};

export interface Venue {
  listingId: string;
  proId: string;
  title: string;
  proName: string;
  category: string;
  photo: string | null;
  city: string | null;
  country: string | null;
  address: string | null;
  priceLabel: string;
}

export function isMissingTable(error: any): boolean {
  return Boolean(error) && (error.code === "42P01" || error.code === "PGRST205" || /relation|table|column/i.test(error.message || ""));
}

/** Lieux disponibles (annonces actives d'hôtels et de logements, Espaces Pro actifs) */
export async function listVenues(filter: { city?: string; country?: string }): Promise<Venue[]> {
  let q = getSupabaseAdmin()
    .from("pro_listings")
    .select('id, title, category, photos, city, country, price, "priceLabel", pro:pro_spaces!inner(id, name, address, city, country, "coverUrl", "isActive")')
    .in("category", VENUE_CATEGORIES)
    .eq("status", "ACTIVE")
    .eq("pro.isActive", true)
    .order("createdAt", { ascending: false })
    .limit(60);
  if (filter.city) q = q.ilike("city", `%${filter.city.replace(/[%_,()]/g, "")}%`);
  if (filter.country && /^[A-Z]{2}$/.test(filter.country)) q = q.eq("country", filter.country);
  const { data, error } = await q;
  if (error) {
    if (isMissingTable(error)) return [];
    throw error;
  }
  return (data || []).map((l: any) => ({
    listingId: l.id,
    proId: l.pro.id,
    title: l.title,
    proName: l.pro.name,
    category: l.category,
    photo: l.photos?.[0] || l.pro.coverUrl || null,
    city: l.city || l.pro.city,
    country: l.country || l.pro.country,
    address: l.pro.address,
    priceLabel: l.price !== null && l.price !== undefined ? `${Number(l.price).toLocaleString("fr-FR")} FCFA` : l.priceLabel || "Prix sur demande",
  }));
}

/** Prénom et photo d'un membre (pour les listes) */
export async function memberCards(userIds: string[]) {
  const ids = Array.from(new Set(userIds.filter(Boolean)));
  const cards: Record<string, { firstName: string; pseudo?: string; photo?: string }> = {};
  if (!ids.length) return cards;
  const { data } = await getSupabaseAdmin()
    .from("profiles")
    .select("userId, firstName, pseudo, profile_photos(url, isMain, status)")
    .in("userId", ids);
  for (const p of data || []) {
    const photos = (p as any).profile_photos || [];
    const main = photos.find((ph: any) => ph.isMain && ph.status !== "COVER") || photos.find((ph: any) => ph.status !== "COVER");
    cards[(p as any).userId] = { firstName: (p as any).firstName, pseudo: (p as any).pseudo, photo: main?.url };
  }
  return cards;
}

export async function notifyMember(userId: string, title: string, body: string) {
  try {
    const { sendPushToUser } = await import("./push-server");
    await sendPushToUser(userId, { title, body, url: "/rendez-vous", tag: "sortie" });
  } catch {}
}
