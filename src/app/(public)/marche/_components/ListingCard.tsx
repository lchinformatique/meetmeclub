// Carte d'une annonce dans les listes du Marché.
// Annonce d'un professionnel : liseré bleu + pastille « Pro » ; d'un particulier : liseré vert.

import Link from "next/link";
import { BadgeCheck, User } from "lucide-react";
import { formatPrice, timeAgo } from "@/lib/market-constants";
import type { Listing } from "@/lib/market";
import { countryName } from "@/lib/countries";
import CategoryIcon from "./CategoryIcon";
import s from "../marche.module.css";

export default function ListingCard({ listing, showPro = true }: { listing: Listing; showPro?: boolean }) {
  const photo = listing.photos?.[0];
  const individual = listing.pro?.activity === "INDIVIDUAL";
  const place = [listing.city, countryName(listing.country || listing.pro?.country)].filter(Boolean).join(", ");
  return (
    <Link href={`/marche/annonce/${listing.id}`} className={individual ? s.cardIndividual : s.cardPro}>
      <div className={s.cardImg}>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={listing.title} loading="lazy" />
        ) : (
          <div className={s.cardNoImg}>
            <CategoryIcon category={listing.category} size={30} />
          </div>
        )}
        <span className={listing.kind === "SERVICE" ? s.badgeService : s.badge}>{listing.kind === "SERVICE" ? "Service" : "Vente"}</span>
        {listing.status === "SOLD" && <span className={s.badgeSold}>VENDU</span>}
      </div>
      <div className={s.cardBody}>
        <span className={s.price}>{formatPrice(listing)}</span>
        <span className={s.cardTitle}>{listing.title}</span>
        {showPro && listing.pro?.name && (
          <span className={individual ? s.sellerIndividual : s.sellerPro}>
            {individual ? <User size={12} /> : <BadgeCheck size={12} />}
            {individual ? "Particulier" : "Pro"} · {listing.pro.name}
          </span>
        )}
        <span className={s.meta}>{[place, timeAgo(listing.createdAt)].filter(Boolean).join(" · ")}</span>
      </div>
    </Link>
  );
}
