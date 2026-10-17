// src/app/(public)/marche/pro/[slug]/page.tsx
// Vitrine d'un Espace Pro : bannière, logo, présentation, contacts (membres connectés) et annonces.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Globe, MapPin, Phone } from "lucide-react";
import { FacebookIcon, WhatsAppIcon } from "../../_components/BrandIcons";
import { getSession } from "@/lib/session";
import { ACTIVITIES, facebookLink, getProBySlug, listingsOfPro, whatsappLink } from "@/lib/market";
import ListingCard from "../../_components/ListingCard";
import s from "../../marche.module.css";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const pro = await getProBySlug((await params).slug);
  if (!pro || !pro.isActive) return { title: "Vitrine introuvable" };
  return {
    title: `${pro.name} — ${ACTIVITIES[pro.activity] || "Pro"} · Le Marché Meet Me Club`,
    description: (pro.description || `${pro.name}, ${ACTIVITIES[pro.activity] || "professionnel"} ${pro.city ? `à ${pro.city}` : "au Togo"}.`).slice(0, 160),
    openGraph: { images: pro.coverUrl || pro.logoUrl ? [{ url: (pro.coverUrl || pro.logoUrl)! }] : undefined },
  };
}

export default async function VitrinePage({ params }: Props) {
  const { slug } = await params;
  const [pro, session] = await Promise.all([getProBySlug(slug), getSession()]);
  if (!pro || !pro.isActive) notFound();
  const listings = await listingsOfPro(pro.id);
  const loggedIn = Boolean(session?.userId);
  const wa = whatsappLink(pro.whatsapp, `Bonjour ${pro.name}, je vous contacte via Meet Me Club.`);
  const fb = facebookLink(pro.facebook);

  return (
    <div className={s.page}>
      <div className={s.cover} style={pro.coverUrl ? { backgroundImage: `url("${pro.coverUrl}")` } : undefined} />
      <div className={s.container}>
        <div className={s.proHead}>
          {pro.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pro.logoUrl} alt={pro.name} className={s.proLogo} />
          ) : (
            <span className={s.proLogo}>{pro.name.charAt(0).toUpperCase()}</span>
          )}
          <div style={{ paddingBottom: 6, minWidth: 0 }}>
            <h1 className={s.h1} style={{ margin: 0 }}>{pro.name}</h1>
            <div style={{ color: "#475569", fontSize: 14, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 700 }}>{ACTIVITIES[pro.activity] || "Professionnel"}</span>
              {(pro.city || pro.neighborhood) && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <MapPin size={14} /> {[pro.neighborhood, pro.city].filter(Boolean).join(", ")}
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
              <div className={s.contactBtns}>
                {wa && (
                  <a href={wa} target="_blank" rel="noopener noreferrer" className={s.wa}>
                    <WhatsAppIcon size={18} /> WhatsApp
                  </a>
                )}
                {fb && (
                  <a href={fb} target="_blank" rel="noopener noreferrer" className={s.fb}>
                    <FacebookIcon size={18} /> Facebook
                  </a>
                )}
                {pro.phone && (
                  <a href={`tel:${pro.phone.replace(/\s/g, "")}`} className={s.tel}>
                    <Phone size={18} /> {pro.phone}
                  </a>
                )}
                {pro.website && (
                  <a href={pro.website} target="_blank" rel="noopener noreferrer" className={s.btnGhost} style={{ width: "100%" }}>
                    <Globe size={18} /> Site web
                  </a>
                )}
              </div>
            ) : (
              <div className={s.contactBtns}>
                <p style={{ fontSize: 14, color: "#475569", margin: 0 }}>Contacts réservés aux membres du club.</p>
                <Link href={`/inscription?callbackUrl=/marche/pro/${pro.slug}`} className={s.btn} style={{ width: "100%" }}>
                  Rejoindre gratuitement
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className={s.toolbar}>
          <h2 className={s.sectionTitle}>
            Annonces <span style={{ fontWeight: 600, fontSize: 14, color: "#64748B" }}>· {listings.length}</span>
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
