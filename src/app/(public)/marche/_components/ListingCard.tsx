// Carte d'une annonce dans les listes du Marché

import Link from "next/link";
import { CATEGORIES, formatPrice, timeAgo } from "@/lib/market-constants";
import type { Listing } from "@/lib/market";
import s from "../marche.module.css";

export default function ListingCard({ listing, showPro = true }: { listing: Listing; showPro?: boolean }) {
  const photo = listing.photos?.[0];
  return (
    <Link href={`/marche/annonce/${listing.id}`} className={s.card}>
      <div className={s.cardImg}>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={listing.title} loading="lazy" />
        ) : (
          <div className={s.cardNoImg}>{CATEGORIES[listing.category]?.icon || "📦"}</div>
        )}
        <span className={listing.kind === "SERVICE" ? s.badgeService : s.badge}>{listing.kind === "SERVICE" ? "Service" : "Vente"}</span>
        {listing.status === "SOLD" && <span className={s.badgeSold}>VENDU</span>}
      </div>
      <div className={s.cardBody}>
        <span className={s.price}>{formatPrice(listing)}</span>
        <span className={s.cardTitle}>{listing.title}</span>
        <span className={s.meta}>
          {[showPro && listing.pro?.name, listing.city, timeAgo(listing.createdAt)].filter(Boolean).join(" · ")}
        </span>
      </div>
    </Link>
  );
}
