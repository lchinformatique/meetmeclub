// src/app/(public)/marche/page.tsx
// Le Marché Meet Me Club : annonces des pros et particuliers, classées par catégorie.
// Visible de tous (même sans compte) ; les contacts WhatsApp / Facebook sont réservés aux membres.

import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { getSession } from "@/lib/session";
import { CATEGORIES, PAGE_SIZE, categoryCounts, searchListings } from "@/lib/market";
import ListingCard from "./_components/ListingCard";
import MarketSeen from "./_components/MarketSeen";
import s from "./marche.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Le Marché — annonces, services et bonnes adresses à Lomé",
  description:
    "Hôtels, restaurants, immobilier, artisans, mode, services… Les annonces des membres et des professionnels du Meet Me Club, classées par catégorie.",
};

type Search = { q?: string; categorie?: string; ville?: string; type?: string; page?: string };

function hrefWith(current: Search, change: Partial<Search>) {
  const merged: Record<string, string | undefined> = { ...current, ...change };
  if (!("page" in change)) delete merged.page;
  const qs = new URLSearchParams(Object.entries(merged).filter((e): e is [string, string] => Boolean(e[1]))).toString();
  return `/marche${qs ? `?${qs}` : ""}`;
}

export default async function MarchePage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const [session, result, counts] = await Promise.all([
    getSession(),
    searchListings({ q: sp.q, category: sp.categorie, city: sp.ville, kind: sp.type, page }),
    categoryCounts(),
  ]);
  const active = sp.categorie && CATEGORIES[sp.categorie] ? sp.categorie : undefined;
  const pages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
  const filtered = Boolean(sp.q || active || sp.ville || sp.type);

  return (
    <div className={s.page}>
      <MarketSeen />
      <section className={s.hero}>
        <div className={s.heroInner}>
          <h1 className={s.heroTitle}>Le Marché Meet Me Club</h1>
          <p className={s.heroSub}>
            Hôtels, restaurants, immobilier, artisans, mode, services… Trouvez les bonnes adresses et les offres de nos membres.
          </p>
          <form className={s.search} action="/marche" method="get">
            <input className={s.input} name="q" defaultValue={sp.q} placeholder="Que recherchez-vous ?" aria-label="Recherche" />
            <select className={s.input} name="categorie" defaultValue={active || ""} aria-label="Catégorie">
              <option value="">Toutes les catégories</option>
              {Object.entries(CATEGORIES).map(([k, c]) => (
                <option key={k} value={k}>
                  {c.icon} {c.label}
                </option>
              ))}
            </select>
            <input className={s.input} name="ville" defaultValue={sp.ville} placeholder="Ville (ex. Lomé)" aria-label="Ville" />
            <button className={s.btn} type="submit">
              <Search size={18} /> Rechercher
            </button>
          </form>
          <div className={s.publishBar}>
            <span className={s.publishHint}>Vous êtes un pro, un artisan ou un particulier ? Présentez votre activité.</span>
            <Link href={session ? "/pro/mon-espace" : "/inscription"} className={s.btn}>
              <Plus size={18} /> {session ? "Mon Espace Pro · Publier" : "Créer mon Espace Pro"}
            </Link>
          </div>
        </div>
      </section>

      <div className={s.container}>
        <nav className={s.cats} aria-label="Catégories">
          {Object.entries(CATEGORIES).map(([k, c]) => (
            <Link key={k} href={hrefWith(sp, { categorie: active === k ? undefined : k })} className={`${s.cat} ${active === k ? s.catActive : ""}`}>
              <span className={s.catIcon}>{c.icon}</span>
              <span className={s.catLabel}>{c.label}</span>
              <span className={s.catCount}>{counts[k] ? `${counts[k]} annonce${counts[k] > 1 ? "s" : ""}` : "—"}</span>
            </Link>
          ))}
        </nav>

        <div className={s.toolbar}>
          <h2 className={s.sectionTitle}>
            {active ? `${CATEGORIES[active].icon} ${CATEGORIES[active].label}` : filtered ? "Résultats" : "Dernières annonces"}
            <span style={{ fontWeight: 600, fontSize: 14, color: "#64748B" }}> · {result.total}</span>
          </h2>
          <Link href={hrefWith(sp, { type: undefined })} className={!sp.type ? s.chipActive : s.chip}>Tout</Link>
          <Link href={hrefWith(sp, { type: "SALE" })} className={sp.type === "SALE" ? s.chipActive : s.chip}>Ventes</Link>
          <Link href={hrefWith(sp, { type: "SERVICE" })} className={sp.type === "SERVICE" ? s.chipActive : s.chip}>Services</Link>
          {filtered && (
            <Link href="/marche" className={s.chip}>
              ✕ Effacer les filtres
            </Link>
          )}
        </div>

        {!result.ready ? (
          <div className={s.empty}>Le Marché ouvre très bientôt. Revenez dans quelques instants !</div>
        ) : result.listings.length === 0 ? (
          <div className={s.empty}>
            <p style={{ fontSize: 40, margin: 0 }}>🔎</p>
            <p style={{ fontWeight: 700, margin: "8px 0" }}>Aucune annonce pour le moment{filtered ? " avec ces filtres" : ""}.</p>
            <Link href={session ? "/pro/mon-espace" : "/inscription"} className={s.btn}>
              Publier la première annonce
            </Link>
          </div>
        ) : (
          <div className={s.grid}>
            {result.listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}

        {pages > 1 && (
          <div className={s.pager}>
            {page > 1 && (
              <Link href={hrefWith(sp, { page: String(page - 1) })} className={s.btnGhost}>
                ← Précédent
              </Link>
            )}
            <span style={{ alignSelf: "center", fontWeight: 700, color: "#475569" }}>
              Page {page} / {pages}
            </span>
            {page < pages && (
              <Link href={hrefWith(sp, { page: String(page + 1) })} className={s.btnGhost}>
                Suivant →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
