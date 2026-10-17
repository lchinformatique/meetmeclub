// Accueil : les dernières annonces du Marché, visibles de tous, avec les catégories.

import Link from "next/link";
import { CATEGORIES, searchListings } from "@/lib/market";
import ListingCard from "@/app/(public)/marche/_components/ListingCard";
import CategoryIcon from "@/app/(public)/marche/_components/CategoryIcon";
import s from "@/app/(public)/marche/marche.module.css";

const HOME_CATEGORIES = ["HOTEL", "RESTAURANT", "REAL_ESTATE", "EVENTS", "FASHION", "SERVICES", "ARTISAN", "ELECTRONICS"];

export default async function HomeMarketSection() {
  let listings: Awaited<ReturnType<typeof searchListings>>["listings"] = [];
  try {
    listings = (await searchListings({ page: 1 })).listings.slice(0, 8);
  } catch {}

  return (
    <section className={s.scope} style={{ padding: "48px 0" }}>
      <div className={s.container}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: "clamp(1.5rem, 3.5vw, 2rem)", fontWeight: 800, color: "var(--ink)", margin: 0 }}>Le Marché Meet Me Club</h2>
            <p style={{ margin: "4px 0 0", color: "var(--ink-soft)", fontSize: 15 }}>
              Hôtels, logements, restaurants, artisans, services… Les annonces des membres et des professionnels.
            </p>
          </div>
          <Link href="/marche" className={s.btnNavy}>
            Voir tout le Marché →
          </Link>
        </div>

        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6, marginBottom: 16, scrollbarWidth: "none" }}>
          {HOME_CATEGORIES.map((k) => (
            <Link key={k} href={`/marche?categorie=${k}`} className={s.chip} style={{ whiteSpace: "nowrap", flexShrink: 0 }}>
              <CategoryIcon category={k} size={15} boxed={false} /> {CATEGORIES[k].label}
            </Link>
          ))}
        </div>

        {listings.length > 0 ? (
          <div className={s.grid}>
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        ) : (
          <div className={s.empty}>
            <p style={{ fontWeight: 700, margin: "0 0 10px" }}>Les premières annonces arrivent : présentez votre activité dès maintenant !</p>
            <Link href="/pro/mon-espace" className={s.btn}>
              Créer mon Espace Pro
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
