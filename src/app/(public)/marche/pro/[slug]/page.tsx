// src/app/(public)/marche/pro/[slug]/page.tsx
// Vitrine d'un Espace Pro : bannière, logo, présentation, contacts (membres connectés) et annonces.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MapPin, MessageCircle } from "lucide-react";
import { getSession } from "@/lib/session";
import { ACTIVITIES, getProBySlug, listingsOfPro } from "@/lib/market";
import ListingCard from "../../_components/ListingCard";
import ProContacts from "../../_components/ProContacts";
import { countryName } from "@/lib/countries";
import s from "../../marche.module.css";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const pro = await getProBySlug((await params).slug);
  if (!pro || !pro.isActive) return { title: "Vitrine introuvable" };
  return {
    title: `${pro.name} — ${ACTIVITIES[pro.activity] || "Pro"} · Le Marché Meet Me Club`,
    description: (pro.description || `${pro.name}, ${ACTIVITIES[pro.activity] || "professionnel"} ${pro.city ? `à ${pro.city}` : ""}${pro.country ? ` (${countryName(pro.country)})` : ""}.`).slice(0, 160),
    openGraph: { images: pro.coverUrl || pro.logoUrl ? [{ url: (pro.coverUrl || pro.logoUrl)! }] : undefined },
  };
}

export default async function VitrinePage({ params }: Props) {
  const { slug } = await params;
  const [pro, session] = await Promise.all([getProBySlug(slug), getSession()]);
  if (!pro || !pro.isActive) notFound();
  const listings = await listingsOfPro(pro.id);
  const loggedIn = Boolean(session?.userId);
  const chatHref = `/messages?contact=${encodeURIComponent(pro.userId)}&message=${encodeURIComponent(`Bonjour ${pro.name}, je vous contacte depuis votre vitrine.`)}`;
  const isMine = session?.userId === pro.userId;

  return (
    <div className={s.page}>
      <div className={s.cover} style={pro.coverUrl ? { backgroundImage: `url("${pro.coverUrl}")` } : undefined}>
        <div className={s.coverShade} />
      </div>
      <div className={s.container}>
        <div className={s.proHead}>
          {pro.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pro.logoUrl} alt={pro.name} className={s.proLogo} />
          ) : (
            <span className={s.proLogo}>{pro.name.charAt(0).toUpperCase()}</span>
          )}
          <div className={s.proName}>
            <h1 className={s.h1} style={{ margin: 0 }}>{pro.name}</h1>
            <div style={{ color: "var(--ink-soft)", fontSize: 14, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
              <span className={s.tag} style={pro.activity === "INDIVIDUAL" ? { background: "var(--ok-soft)", color: "var(--ok)" } : { background: "var(--brand-soft)", color: "var(--brand)" }}>
                {pro.activity === "INDIVIDUAL" ? "Particulier" : "Pro"} · {ACTIVITIES[pro.activity] || "Professionnel"}
              </span>
              {(pro.city || pro.country) && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <MapPin size={14} /> {[pro.address, pro.city, countryName(pro.country)].filter(Boolean).join(", ")}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className={s.detail}>
          <div className={s.panel}>
            <h2 style={{ margin: "0 0 8px", fontSize: 17, color: "#0B2559" }}>Présentation</h2>
            <p className={s.desc}>{pro.description || "Ce membre n'a pas encore ajouté de présentation."}</p>
          </div>
          <div className={s.panel}>
            <h2 style={{ margin: "0 0 4px", fontSize: 17, color: "#0B2559" }}>Contacter {pro.name}</h2>
            {loggedIn ? (
              <ProContacts pro={pro} chatHref={chatHref} isMine={isMine} subject={"ses services"} />
            ) : (
              <div className={s.contactBtns}>
                <p style={{ fontSize: 14, color: "#3B4658", margin: 0 }}>Rejoignez le club pour écrire à ce membre : tous les échanges se font sur la messagerie privée.</p>
                <Link href={`/inscription?callbackUrl=/marche/pro/${pro.slug}`} className={s.btn} style={{ width: "100%" }}>
                  Rejoindre gratuitement
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className={s.toolbar}>
          <h2 className={s.sectionTitle}>
            Annonces <span style={{ fontWeight: 600, fontSize: 14, color: "#505D70" }}>· {listings.length}</span>
          </h2>
          <Link href="/marche" className={s.chip}>
            <ChevronLeft size={14} /> Tout le Marché
          </Link>
        </div>
        {listings.length === 0 ? (
          <div className={s.empty}>Aucune annonce publiée pour le moment.</div>
        ) : (
          <div className={s.grid}>
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} showPro={false} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
