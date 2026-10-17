"use client";
// src/app/admin/marche/page.tsx
// Modération du Marché (administrateur) : annonces signalées en premier, retrait / remise en ligne,
// suspension d'un Espace Pro.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Flag, Store } from "lucide-react";
import { CATEGORIES, formatPrice, timeAgo } from "@/lib/market-constants";

type View = "reported" | "all" | "removed";

interface AdminListing {
  id: string;
  title: string;
  category: string;
  kind: "SALE" | "SERVICE";
  price: number | null;
  priceLabel: string | null;
  photos: string[];
  status: string;
  reportsCount: number;
  removedReason: string | null;
  createdAt: string;
  reportReasons: string[];
  pro: { id: string; slug: string; name: string; isActive: boolean } | null;
}

const REMOVE_REASONS = ["Arnaque ou annonce frauduleuse", "Contenu interdit", "Annonce trompeuse", "Doublon / spam"];

export default function AdminMarche() {
  const [view, setView] = useState<View>("reported");
  const [items, setItems] = useState<AdminListing[] | null>(null);
  const [reported, setReported] = useState(0);
  const [ready, setReady] = useState(true);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);

  const load = useCallback(async (v: View) => {
    setItems(null);
    setError("");
    try {
      const r = await fetch(`/api/market/admin?view=${v}`, { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Accès refusé");
      setReady(d.ready !== false);
      setItems(d.listings || []);
      setReported(d.reported || 0);
    } catch (e: any) {
      setError(e.message);
      setItems([]);
    }
  }, []);

  useEffect(() => {
    load(view);
  }, [view, load]);

  async function post(body: Record<string, string>) {
    const r = await fetch("/api/market/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) alert("Action impossible");
    setRemoving(null);
    load(view);
  }

  const pill = (active: boolean): React.CSSProperties => ({
    padding: "9px 14px",
    borderRadius: 999,
    border: "none",
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
    whiteSpace: "nowrap",
    background: active ? "#0B2559" : "#fff",
    color: active ? "#fff" : "#0B2559",
  });

  return (
    <div style={{ minHeight: "100dvh", background: "#F4F6FB", padding: "max(16px, env(safe-area-inset-top)) 14px calc(96px + env(safe-area-inset-bottom))" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
        <Link href="/admin" style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#0B2559", fontWeight: 700, textDecoration: "none" }}>
          <ChevronLeft size={20} /> Espace de gestion
        </Link>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, color: "#0B2559", display: "flex", alignItems: "center", gap: 8 }}>
            <Store size={24} /> Modération du Marché
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "#505D70" }}>
            Les annonces sont publiées tout de suite. Retirez celles qui sont signalées ou non conformes.{" "}
            <Link href="/marche" style={{ color: "#E10600", fontWeight: 700 }}>Voir le Marché</Link>
          </p>
        </div>

        {!ready && (
          <div style={{ background: "#FFFBEB", color: "#92400E", padding: 14, borderRadius: 14, fontWeight: 700 }}>
            Le Marché n&apos;est pas encore activé (migration v6 à exécuter dans Supabase).
          </div>
        )}

        <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
          <button type="button" onClick={() => setView("reported")} style={pill(view === "reported")}>
            Signalées {reported ? <span style={{ marginLeft: 4, background: "#E10600", color: "#fff", borderRadius: 999, padding: "1px 7px", fontSize: 12 }}>{reported}</span> : null}
          </button>
          <button type="button" onClick={() => setView("all")} style={pill(view === "all")}>Toutes en ligne</button>
          <button type="button" onClick={() => setView("removed")} style={pill(view === "removed")}>Retirées</button>
        </div>

        {error && <div style={{ background: "#FEF2F2", color: "#B42318", padding: 14, borderRadius: 14, fontWeight: 700 }}>{error}</div>}
        {items === null && <p style={{ color: "#505D70" }}>Chargement…</p>}
        {items?.length === 0 && !error && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, textAlign: "center", color: "#505D70", fontWeight: 600 }}>
            {view === "reported" ? "Aucune annonce signalée. 🎉" : "Aucune annonce."}
          </div>
        )}

        {items?.map((l) => (
          <div key={l.id} style={{ background: "#fff", borderRadius: 18, padding: 12, boxShadow: "0 4px 14px rgba(11,37,89,0.06)" }}>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ width: 84, height: 84, borderRadius: 12, flexShrink: 0, background: l.photos?.[0] ? `center/cover url("${l.photos[0]}")` : "#E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>
                {!l.photos?.[0] && (CATEGORIES[l.category]?.icon || "📦")}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link href={`/marche/annonce/${l.id}`} style={{ fontWeight: 800, color: "#0F172A", textDecoration: "none", display: "block" }}>{l.title}</Link>
                <span style={{ fontSize: 13, color: "#E10600", fontWeight: 800 }}>{formatPrice(l)}</span>
                <span style={{ display: "block", fontSize: 12, color: "#505D70" }}>
                  {l.pro ? (
                    <Link href={`/marche/pro/${l.pro.slug}`} style={{ color: "#0B2559", fontWeight: 700 }}>{l.pro.name}</Link>
                  ) : "—"}
                  {" · "}{CATEGORIES[l.category]?.label} · {timeAgo(l.createdAt)}
                  {l.pro && !l.pro.isActive ? " · Espace suspendu" : ""}
                </span>
                {l.reportsCount > 0 && (
                  <span style={{ display: "flex", gap: 4, alignItems: "flex-start", fontSize: 12, color: "#B42318", marginTop: 4 }}>
                    <Flag size={13} style={{ marginTop: 2, flexShrink: 0 }} /> {l.reportsCount} signalement(s) : {Array.from(new Set(l.reportReasons)).join(" · ")}
                  </span>
                )}
                {l.status === "REMOVED" && <span style={{ display: "block", fontSize: 12, color: "#991B1B" }}>Retirée : {l.removedReason}</span>}
              </div>
            </div>

            {removing === l.id ? (
              <div style={{ display: "grid", gap: 6, marginTop: 10 }}>
                {REMOVE_REASONS.map((r) => (
                  <button key={r} type="button" onClick={() => post({ id: l.id, action: "REMOVE", reason: r })} style={{ textAlign: "left", padding: "9px 12px", borderRadius: 10, border: "1.5px solid #FECACA", background: "#FEF2F2", color: "#991B1B", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                    {r}
                  </button>
                ))}
                <button type="button" onClick={() => setRemoving(null)} style={{ padding: 9, borderRadius: 10, border: "none", background: "#F1F5F9", color: "#3B4658", fontWeight: 700, cursor: "pointer" }}>Annuler</button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                {l.status === "REMOVED" ? (
                  <button type="button" onClick={() => post({ id: l.id, action: "RESTORE" })} style={{ flex: 1, padding: 10, borderRadius: 10, border: "none", background: "#12B76A", color: "#fff", fontWeight: 800, cursor: "pointer" }}>Remettre en ligne</button>
                ) : (
                  <>
                    <button type="button" onClick={() => setRemoving(l.id)} style={{ flex: 1, padding: 10, borderRadius: 10, border: "1.5px solid #FCA5A5", background: "#FEF2F2", color: "#B42318", fontWeight: 800, cursor: "pointer" }}>Retirer</button>
                    {l.reportsCount > 0 && (
                      <button type="button" onClick={() => post({ id: l.id, action: "RESTORE" })} style={{ flex: 1, padding: 10, borderRadius: 10, border: "none", background: "#F1F5F9", color: "#0B2559", fontWeight: 800, cursor: "pointer" }}>Ignorer les signalements</button>
                    )}
                  </>
                )}
                {l.pro && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(l.pro!.isActive ? `Suspendre l'Espace Pro « ${l.pro!.name} » ? Toutes ses annonces seront masquées.` : `Réactiver « ${l.pro!.name} » ?`)) {
                        post({ proId: l.pro!.id, action: l.pro!.isActive ? "SUSPEND_PRO" : "RESTORE_PRO" });
                      }
                    }}
                    style={{ flex: 1, padding: 10, borderRadius: 10, border: "none", background: l.pro.isActive ? "#0F172A" : "#12B76A", color: "#fff", fontWeight: 800, cursor: "pointer" }}
                  >
                    {l.pro.isActive ? "Suspendre ce pro" : "Réactiver ce pro"}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
