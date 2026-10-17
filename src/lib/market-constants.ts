// src/lib/market-constants.ts
// Constantes du Marché utilisables partout (navigateur et serveur).

export type ListingKind = "SALE" | "SERVICE";
export type ListingStatus = "ACTIVE" | "SOLD" | "DELETED" | "REMOVED";

/** Catégories du Marché (ordre d'affichage) */
export const CATEGORIES: Record<string, { label: string; icon: string }> = {
  HOTEL: { label: "Hôtels & hébergement", icon: "🏨" },
  RESTAURANT: { label: "Restaurants, bars & maquis", icon: "🍽️" },
  REAL_ESTATE: { label: "Immobilier", icon: "🏠" },
  EVENTS: { label: "Événements, loisirs & clubs", icon: "🎉" },
  FASHION: { label: "Mode & beauté", icon: "👗" },
  ARTISAN: { label: "Artisanat & fabrication", icon: "🛠️" },
  SERVICES: { label: "Services & prestations", icon: "🤝" },
  ELECTRONICS: { label: "Téléphones & électronique", icon: "📱" },
  HOME: { label: "Maison & électroménager", icon: "🛋️" },
  VEHICLES: { label: "Véhicules & motos", icon: "🚗" },
  FOOD: { label: "Alimentation & épicerie", icon: "🛒" },
  HEALTH: { label: "Santé & bien-être", icon: "💆" },
  JOBS: { label: "Emploi & formation", icon: "💼" },
  OTHER: { label: "Autres", icon: "📦" },
};

/** Types d'activité d'un Espace Pro */
export const ACTIVITIES: Record<string, string> = {
  INDIVIDUAL: "Particulier",
  ENTREPRENEUR: "Entrepreneur / commerçant",
  ARTISAN: "Artisan",
  HOTEL: "Hôtel / résidence",
  RESTAURANT: "Restaurant / bar / maquis",
  REAL_ESTATE: "Agence immobilière",
  CLUB: "Club / salle / événementiel",
  SHOP: "Boutique / magasin",
  SERVICES: "Prestataire de services",
  COMPANY: "Entreprise / organisme",
  OTHER: "Autre",
};

export const KIND_LABEL: Record<ListingKind, string> = { SALE: "Vente", SERVICE: "Service / prestation" };

export const REPORT_REASONS = [
  "Arnaque ou demande d'argent suspecte",
  "Contenu interdit ou choquant",
  "Fausse annonce ou mauvaise catégorie",
  "Autre problème",
];

export const COMPLICE_MONTHLY_SALES = 10;
export const MAX_PHOTOS = 4;

export function formatPrice(l: { price: number | null; priceLabel: string | null }) {
  if (l.price !== null && l.price !== undefined && !isNaN(Number(l.price))) {
    return `${Number(l.price).toLocaleString("fr-FR")} FCFA`;
  }
  return l.priceLabel || "Prix sur demande";
}

export function timeAgo(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return `il y a ${Math.max(1, Math.round(s / 60))} min`;
  if (s < 86400) return `il y a ${Math.round(s / 3600)} h`;
  if (s < 86400 * 30) return `il y a ${Math.round(s / 86400)} j`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

