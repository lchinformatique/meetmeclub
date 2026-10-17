// src/app/(public)/marche/annonce/[id]/page.tsx
// Fiche d'une annonce : photos, prix, description, vitrine du pro et contacts
// (WhatsApp, Facebook, téléphone réservés aux membres connectés).

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MapPin, Phone, Globe } from "lucide-react";
import { FacebookIcon, WhatsAppIcon } from "../../_components/BrandIcons";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { ACTIVITIES, CATEGORIES, KIND_LABEL, facebookLink, formatPrice, getListing, timeAgo, whatsappLink } from "@/lib/market";
import ReportButton from "../../_components/ReportButton";
import CategoryIcon from "../../_components/CategoryIcon";
import { countryName } from "@/lib/countries";
import Gallery from "./Gallery";
import s from "../../marche.module.css";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

async function load(id: string) {
  const listing = await getListing(id);
  if (!listing || !listing.proFull || !["ACTIVE", "SOLD"].includes(listing.status) || !listing.proFull.isActive) return null;
  return listing;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const listing = await load((await params).id);
  if (!listing) return { title: "Annonce introuvable" };
  const description = `${formatPrice(listing)} · ${[listing.city, countryName(listing.country)].filter(Boolean).join(", ")} — ${(listing.description || "").slice(0, 140)}`;
  return {
    title: `${listing.title} — Le Marché Meet Me Club`,
    description,
    openGraph: {
      title: listing.title,
      description,
      images: listing.photos?.[0] ? [{ url: listing.photos[0] }] : undefined,
    },
  };
}

export default async function AnnoncePage({ params }: Props) {
  const { id } = await params;
  const [listing, session] = await Promise.all([load(id), getSession()]);
  if (!listing) notFound();
  const pro = listing.proFull!;

  // Compteur de vues (hors auteur)
  if (session?.userId !== listing.userId) {
    getSupabaseAdmin().from("pro_listings").update({ views: (listing.views || 0) + 1 }).eq("id", id).then(() => {}, () => {});
  }

  const loggedIn = Boolean(session?.userId);
  const message = `Bonjour ${pro.name}, je vous contacte via Meet Me Club au sujet de votre annonce « ${listing.title} ».`;
  const wa = whatsappLink(pro.whatsapp, message);
  const fb = facebookLink(pro.facebook);
  const cat = CATEGORIES[listing.category];

  return (
    <div className={s.page}>
      <div className={s.container}>
        <div style={{ paddingTop: 14, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", fontSize: 14 }}>
          <Link href="/marche" style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#0B2559", fontWeight: 700, textDecoration: "none" }}>
            <ChevronLeft size={18} /> Le Marché
          </Link>
          {cat && (
            <>
              <span style={{ color: "#94A3B8" }}>/</span>
              <Link href={`/marche?categorie=${listing.category}`} style={{ color: "#0B2559", fontWeight: 600, textDecoration: "none" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><CategoryIcon category={listing.category} size={15} boxed={false} /> {cat.label}</span>
              </Link>
            </>
          )}
        </div>

        <div className={s.detail}>
          <div className={s.panel}>
            <Gallery photos={listing.photos || []} title={listing.title} icon={cat?.icon || "📦"} />
            <div style={{ marginTop: 14 }}>
              <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 800, color: "#fff", background: listing.kind === "SERVICE" ? "#059669" : "#0B2559" }}>
                {KIND_LABEL[listing.kind]}
              </span>
              {listing.status === "SOLD" && (
                <span style={{ marginLeft: 8, display: "inline-block", padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 800, color: "#fff", background: "#64748B" }}>
                  Vendu
                </span>
              )}
              <h1 className={s.h1}>{listing.title}</h1>
              <div className={s.price} style={{ fontSize: 22 }}>{formatPrice(listing)}</div>
              <p style={{ display: "flex", alignItems: "center", gap: 6, color: "#64748B", fontSize: 14, margin: "8px 0 14px" }}>
                <MapPin size={15} /> {[listing.city, countryName(listing.country || pro.country)].filter(Boolean).join(", ") || "Lieu non précisé"} · publiée {timeAgo(listing.createdAt)} · {listing.views || 0} vue{(listing.views || 0) > 1 ? "s" : ""}
              </p>
              <p className={s.desc}>{listing.description}</p>
            </div>
          </div>

          <aside style={{ display: "grid", gap: 16 }}>
            <div className={s.panel}>
              <Link href={`/marche/pro/${pro.slug}`} className={s.proCard}>
                {pro.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pro.logoUrl} alt={pro.name} className={s.logo} />
                ) : (
                  <span className={s.logo}>{pro.name.charAt(0).toUpperCase()}</span>
                )}
                <span>
                  <strong style={{ display: "block", fontSize: 16 }}>{pro.name}</strong>
                  <span style={{ fontSize: 13, color: "#64748B" }}>
                    {ACTIVITIES[pro.activity] || "Professionnel"}
                    {pro.city ? ` · ${pro.city}` : ""}
                  </span>
                  <span style={{ display: "block", fontSize: 13, color: "#E10600", fontWeight: 700 }}>Voir la vitrine →</span>
                </span>
              </Link>

              {loggedIn ? (
                <div className={s.contactBtns}>
                  {wa && (
                    <a href={wa} target="_blank" rel="noopener noreferrer" className={s.wa}>
                      <WhatsAppIcon size={18} /> Contacter sur WhatsApp
                    </a>
                  )}
                  {fb && (
                    <a href={fb} target="_blank" rel="noopener noreferrer" className={s.fb}>
                      <FacebookIcon size={18} /> Voir la page Facebook
                    </a>
                  )}
                  {pro.phone && (
                    <a href={`tel:${pro.phone.replace(/\s/g, "")}`} className={s.tel}>
                      <Phone size={18} /> Appeler {pro.phone}
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
                  <p style={{ fontSize: 14, color: "#475569", margin: 0 }}>
                    Les contacts WhatsApp, Facebook et téléphone sont réservés aux membres du club.
                  </p>
                  <Link href={`/inscription?callbackUrl=/marche/annonce/${listing.id}`} className={s.btn} style={{ width: "100%" }}>
                    Rejoindre gratuitement pour contacter
                  </Link>
                  <Link href={`/connexion?callbackUrl=/marche/annonce/${listing.id}`} className={s.btnGhost} style={{ width: "100%" }}>
                    J&apos;ai déjà un compte
                  </Link>
                </div>
              )}
            </div>

            <div className={s.panel} style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
              <strong style={{ color: "#0F172A" }}>🛡️ Conseils de sécurité</strong>
              <br />
              Ne payez jamais d&apos;avance un vendeur que vous ne connaissez pas. Rencontrez-vous dans un lieu public et vérifiez
              l&apos;article avant de payer.
              <ReportButton listingId={listing.id} loggedIn={loggedIn} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
