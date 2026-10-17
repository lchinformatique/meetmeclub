"use client";
// src/app/pro/mon-espace/page.tsx
// Mon Espace Pro : ma marque (logo, bannière, contacts), mon quota du mois,
// la publication d'annonces (packs Complice et VIP) et la gestion de mes annonces.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Crown, ExternalLink, Eye, Loader2, ShieldCheck, Store } from "lucide-react";
import { formatPrice, timeAgo } from "@/lib/market-constants";
import BrandForm from "./_components/BrandForm";
import ListingForm from "./_components/ListingForm";
import { NAVY, panel, primaryBtn, RED, type MyListing, type ProSpace } from "./_components/shared";

interface Data {
  plan: "FREE" | "ESSENTIAL" | "COMPLICE" | "VIP";
  verified: boolean;
  canPublish: boolean;
  quota: { salesThisMonth: number; salesLimit: number | null };
  pro: ProSpace | null;
  listings: MyListing[];
  activities: Record<string, string>;
  categories: Record<string, { label: string; icon: string }>;
}

const STATUS: Record<MyListing["status"], { label: string; bg: string; color: string }> = {
  ACTIVE: { label: "En ligne", bg: "#DCFCE7", color: "#166534" },
  SOLD: { label: "Vendu", bg: "#E2E8F0", color: "#334155" },
  REMOVED: { label: "Retirée par l'équipe", bg: "#FEE2E2", color: "#991B1B" },
  DELETED: { label: "Supprimée", bg: "#F1F5F9", color: "#64748B" },
};

export default function MonEspacePro() {
  const router = useRouter();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"annonces" | "publier" | "marque">("annonces");

  const load = useCallback(async () => {
    const res = await fetch("/api/pro/me", { cache: "no-store" });
    if (res.status === 401) return router.replace("/connexion?callbackUrl=/pro/mon-espace");
    const d = await res.json();
    if (!res.ok) return setError(d.error || "Chargement impossible.");
    setData(d);
    if (!d.pro) setTab("marque");
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(id: string, method: "PATCH" | "DELETE", status?: string) {
    if (method === "DELETE" && !confirm("Supprimer cette annonce ? Elle restera comptée dans votre quota du mois.")) return;
    await fetch(`/api/pro/listings/${id}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: status ? JSON.stringify({ status }) : undefined,
    });
    load();
  }

  const salesLeft = data?.quota.salesLimit === null || data?.quota.salesLimit === undefined ? null : Math.max(0, data.quota.salesLimit - data.quota.salesThisMonth);

  function content() {
    if (!data) {
      return (
        <div style={{ ...panel, textAlign: "center" }}>
          {error ? <p style={{ color: "#B91C1C", fontWeight: 600 }}>{error}</p> : <Loader2 size={30} color={NAVY} style={{ animation: "spin 1s linear infinite" }} />}
        </div>
      );
    }

    if (!data.verified) {
      return (
        <div style={{ ...panel, textAlign: "center" }}>
          <ShieldCheck size={46} color={NAVY} style={{ margin: "0 auto 10px" }} />
          <h1 style={{ fontSize: 21, color: NAVY, margin: "0 0 6px" }}>Vérifiez d&apos;abord votre profil</h1>
          <p style={{ color: "#475569", lineHeight: 1.6, margin: "0 0 16px" }}>
            Pour protéger les membres contre les arnaques, seuls les comptes vérifiés peuvent créer un Espace Pro et publier.
          </p>
          <Link href="/verification" style={primaryBtn}>
            Faire ma vérification
          </Link>
        </div>
      );
    }

    return (
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 14 }}>
        {/* Formule et quota */}
        <div style={{ ...panel, background: data.canPublish ? "linear-gradient(135deg,#0B2559,#163B8A)" : "#FFFBEB", color: data.canPublish ? "#fff" : "#92400E" }}>
          {data.canPublish ? (
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <Crown size={26} color="#FDE047" />
              <div style={{ flex: 1 }}>
                <strong style={{ display: "block" }}>{data.plan === "VIP" ? "Pass VIP · annonces illimitées" : "Pack Complice"}</strong>
                <span style={{ fontSize: 13, opacity: 0.9 }}>
                  {data.quota.salesLimit === null
                    ? "Ventes et services sans limite."
                    : `Ventes ce mois : ${data.quota.salesThisMonth}/${data.quota.salesLimit} · Services illimités`}
                </span>
              </div>
            </div>
          ) : (
            <div>
              <strong style={{ display: "block", marginBottom: 4 }}>Votre vitrine est prête, publiez vos annonces avec le pack Complice</strong>
              <span style={{ fontSize: 13, lineHeight: 1.5, display: "block", marginBottom: 10 }}>
                Pack Complice (6 000 FCFA) : 10 annonces de vente par mois et services illimités. Pass VIP : tout illimité.
              </span>
              <Link href="/tarifs" style={{ ...primaryBtn, width: "auto", padding: "10px 16px", fontSize: 14 }}>
                Voir les formules
              </Link>
            </div>
          )}
        </div>

        {data.pro && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {([
              ["annonces", `Mes annonces (${data.listings.length})`],
              ["publier", "+ Publier"],
              ["marque", "Ma marque"],
            ] as const).map(([k, l]) => (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                style={{ padding: "9px 14px", borderRadius: 999, border: "none", fontWeight: 800, fontSize: 14, cursor: "pointer", background: tab === k ? (k === "publier" ? RED : NAVY) : "#fff", color: tab === k ? "#fff" : NAVY }}
              >
                {l}
              </button>
            ))}
            <Link href={`/marche/pro/${data.pro.slug}`} style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: 14, color: NAVY, textDecoration: "none" }}>
              <ExternalLink size={16} /> Ma vitrine
            </Link>
          </div>
        )}

        {data.pro && !data.pro.isActive && (
          <div style={{ ...panel, background: "#FEF2F2", color: "#991B1B", fontWeight: 700 }}>
            Votre Espace Pro est suspendu par l&apos;équipe : vos annonces ne sont plus visibles. Contactez le support.
          </div>
        )}

        {tab === "marque" && (
          <div style={panel}>
            <h2 style={{ fontSize: 18, color: NAVY, margin: "0 0 12px" }}>{data.pro ? "Ma marque" : "Créer mon Espace Pro"}</h2>
            <BrandForm
              pro={data.pro}
              activities={data.activities}
              onSaved={(pro) => {
                setData((d) => (d ? { ...d, pro } : d));
                setTab(data.canPublish ? "publier" : "annonces");
              }}
            />
          </div>
        )}

        {tab === "publier" && data.pro && (
          <div style={panel}>
            <h2 style={{ fontSize: 18, color: NAVY, margin: "0 0 12px" }}>Nouvelle annonce</h2>
            {data.canPublish ? (
              <ListingForm
                pro={data.pro}
                categories={data.categories}
                salesLeft={salesLeft}
                onPublished={() => {
                  load();
                  setTab("annonces");
                }}
              />
            ) : (
              <p style={{ color: "#475569", margin: 0 }}>La publication est réservée aux packs Complice et VIP.</p>
            )}
          </div>
        )}

        {tab === "annonces" && data.pro && (
          <div style={{ display: "grid", gap: 10 }}>
            {data.listings.length === 0 && (
              <div style={{ ...panel, textAlign: "center", color: "#475569" }}>
                <Store size={34} color={NAVY} style={{ margin: "0 auto 8px" }} />
                Aucune annonce pour le moment.
                {data.canPublish && (
                  <button type="button" onClick={() => setTab("publier")} style={{ ...primaryBtn, marginTop: 12 }}>
                    Publier ma première annonce
                  </button>
                )}
              </div>
            )}
            {data.listings.map((l) => (
              <div key={l.id} style={{ ...panel, padding: 12, display: "flex", gap: 12 }}>
                <div style={{ width: 76, height: 76, borderRadius: 12, flexShrink: 0, background: l.photos[0] ? `center/cover url("${l.photos[0]}")` : "#E2E8F0" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 999, background: STATUS[l.status].bg, color: STATUS[l.status].color }}>{STATUS[l.status].label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B" }}>{l.kind === "SALE" ? "Vente" : "Service"}</span>
                  </div>
                  <strong style={{ display: "block", fontSize: 15, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.title}</strong>
                  <span style={{ fontSize: 13, color: RED, fontWeight: 800 }}>{formatPrice(l)}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#64748B" }}>
                    <Eye size={13} /> {l.views} · {timeAgo(l.createdAt)}
                  </span>
                  {l.status === "REMOVED" && l.removedReason && <span style={{ display: "block", fontSize: 12, color: "#991B1B" }}>Motif : {l.removedReason}</span>}
                  {(l.status === "ACTIVE" || l.status === "SOLD") && (
                    <div style={{ display: "flex", gap: 12, marginTop: 6, flexWrap: "wrap", fontSize: 13, fontWeight: 700 }}>
                      <Link href={`/marche/annonce/${l.id}`} style={{ color: NAVY }}>Voir</Link>
                      {l.kind === "SALE" && (
                        <button type="button" onClick={() => act(l.id, "PATCH", l.status === "SOLD" ? "ACTIVE" : "SOLD")} style={{ background: "none", border: "none", padding: 0, color: NAVY, fontWeight: 700, cursor: "pointer" }}>
                          {l.status === "SOLD" ? "Remettre en vente" : "Marquer vendu"}
                        </button>
                      )}
                      <button type="button" onClick={() => act(l.id, "DELETE")} style={{ background: "none", border: "none", padding: 0, color: "#B42318", fontWeight: 700, cursor: "pointer" }}>
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#F4F6FB", paddingBottom: "calc(96px + env(safe-area-inset-bottom))" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <header style={{ background: "white", borderBottom: "1px solid #E2E8F0", height: 64, display: "flex", alignItems: "center", position: "sticky", top: 0, zIndex: 40 }}>
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/marche" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none", color: NAVY, fontWeight: 700, fontSize: 14 }}>
            <ChevronLeft size={18} />
            <span>Le Marché</span>
          </Link>
          <span style={{ fontWeight: 800, color: NAVY, fontSize: 15 }}>Mon Espace Pro</span>
        </div>
      </header>
      <main className="container" style={{ maxWidth: 640, paddingBlock: 20 }}>
        {content()}
      </main>
    </div>
  );
}
