"use client";
// src/app/admin/verifications/page.tsx
// Contrôle des selfies (administrateur uniquement) : le selfie pris en direct est affiché à côté
// des photos du profil et du geste demandé. Valider = le membre apparaît et peut échanger.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, ChevronLeft, ShieldCheck, X } from "lucide-react";

type Tab = "PENDING" | "REJECTED" | "APPROVED";

interface Item {
  userId: string;
  firstName?: string;
  lastName?: string;
  pseudo?: string;
  gender?: string;
  city?: string;
  age?: number | null;
  gestureText?: string | null;
  selfieUrl?: string | null;
  photos: string[];
  submittedAt?: string | null;
  reviewedAt?: string | null;
  note?: string | null;
}

const TABS: Array<[Tab, string]> = [
  ["PENDING", "À vérifier"],
  ["REJECTED", "Refusés"],
  ["APPROVED", "Validés"],
];

const REASONS = [
  "Le selfie ne correspond pas aux photos du profil.",
  "Le geste demandé n'apparaît pas sur le selfie.",
  "Visage flou, trop sombre ou caché.",
  "Photo d'écran ou photo d'une photo : prenez un vrai selfie.",
];

function when(iso?: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function AdminVerifications() {
  const [tab, setTab] = useState<Tab>("PENDING");
  const [items, setItems] = useState<Item[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [configured, setConfigured] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [zoom, setZoom] = useState<string | null>(null);

  const load = useCallback(async (t: Tab) => {
    setItems(null);
    setError("");
    try {
      const r = await fetch(`/api/verifications/admin?status=${t}`, { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Accès refusé");
      setConfigured(d.configured !== false);
      setItems(d.items || []);
      setCounts(d.counts || {});
    } catch (e: any) {
      setError(e.message);
      setItems([]);
    }
  }, []);

  useEffect(() => {
    load(tab);
  }, [tab, load]);

  async function decide(userId: string, decision: "APPROVE" | "REJECT", note?: string) {
    setBusy(userId);
    try {
      const r = await fetch("/api/verifications/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, decision, note }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Erreur");
      setItems((prev) => (prev || []).filter((i) => i.userId !== userId));
      setCounts((c) => ({
        ...c,
        [tab]: Math.max(0, (c[tab] || 1) - 1),
        [decision === "APPROVE" ? "APPROVED" : "REJECTED"]: (c[decision === "APPROVE" ? "APPROVED" : "REJECTED"] || 0) + 1,
      }));
      setRejecting(null);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusy(null);
    }
  }

  const imgBox: React.CSSProperties = {
    width: "100%",
    aspectRatio: "3 / 4",
    objectFit: "cover",
    borderRadius: 14,
    background: "#E2E8F0",
    cursor: "zoom-in",
    display: "block",
  };

  return (
    <div style={{ minHeight: "100dvh", background: "#F4F6FB", padding: "max(16px, env(safe-area-inset-top)) 14px calc(96px + env(safe-area-inset-bottom))" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
        <Link href="/admin" style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#0B2559", fontWeight: 700, textDecoration: "none" }}>
          <ChevronLeft size={20} /> Espace de gestion
        </Link>

        <div>
          <h1 style={{ margin: 0, fontSize: 24, color: "#0B2559", display: "flex", alignItems: "center", gap: 8 }}>
            <ShieldCheck size={24} /> Vérification des visages
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "#64748B", lineHeight: 1.5 }}>
            Comparez le selfie pris en direct aux photos du profil et vérifiez le geste demandé. Un membre n&apos;apparaît
            et ne peut échanger qu&apos;après votre validation.
          </p>
        </div>

        {!configured && (
          <div style={{ background: "#FEF2F2", color: "#B42318", padding: 14, borderRadius: 14, fontWeight: 700, lineHeight: 1.5 }}>
            La vérification n&apos;est pas encore activée : exécutez le fichier supabase/migration_v4_verification.sql dans
            Supabase (SQL Editor). En attendant, tous les membres restent visibles.
          </div>
        )}

        <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
          {TABS.map(([t, label]) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              style={{
                padding: "9px 14px",
                borderRadius: 999,
                border: "none",
                fontWeight: 800,
                fontSize: 14,
                cursor: "pointer",
                whiteSpace: "nowrap",
                background: tab === t ? "#0B2559" : "#fff",
                color: tab === t ? "#fff" : "#0B2559",
              }}
            >
              {label} {counts[t] ? `(${counts[t]})` : ""}
            </button>
          ))}
        </div>
        {counts.NONE ? (
          <p style={{ margin: 0, fontSize: 13, color: "#64748B" }}>
            {counts.NONE} membre(s) n&apos;ont pas encore envoyé leur selfie (invisibles tant qu&apos;ils ne l&apos;ont pas fait).
          </p>
        ) : null}

        {error && <div style={{ background: "#FEF2F2", color: "#B42318", padding: 14, borderRadius: 14, fontWeight: 700 }}>{error}</div>}
        {items === null && <p style={{ color: "#64748B" }}>Chargement…</p>}
        {items?.length === 0 && !error && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, textAlign: "center", color: "#64748B", fontWeight: 600 }}>
            {tab === "PENDING" ? "Aucun selfie en attente. 🎉" : "Aucun membre dans cette liste."}
          </div>
        )}

        {items?.map((m) => (
          <div key={m.userId} style={{ background: "#fff", borderRadius: 18, padding: 14, boxShadow: "0 4px 14px rgba(11,37,89,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
              <div>
                <strong style={{ fontSize: 17, color: "#0F172A" }}>
                  {m.firstName} {m.lastName || ""}
                </strong>
                <div style={{ fontSize: 13, color: "#64748B" }}>
                  {[m.pseudo && `@${m.pseudo}`, m.age && `${m.age} ans`, m.gender === "FEMALE" ? "Femme" : m.gender === "MALE" ? "Homme" : null, m.city]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              </div>
              <span style={{ fontSize: 12, color: "#64748B" }}>
                {tab === "PENDING" ? `Envoyé ${when(m.submittedAt)}` : `Décidé ${when(m.reviewedAt)}`}
              </span>
            </div>

            {m.gestureText && (
              <div style={{ background: "#EFF6FF", borderRadius: 10, padding: "8px 10px", fontSize: 13, color: "#0B2559", marginBottom: 10 }}>
                <strong>Geste demandé :</strong> {m.gestureText}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#E10600", marginBottom: 4 }}>SELFIE EN DIRECT</div>
                {m.selfieUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.selfieUrl} alt="Selfie" style={imgBox} onClick={() => setZoom(m.selfieUrl!)} />
                ) : (
                  <div style={{ ...imgBox, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B", fontSize: 13 }}>
                    Aucun selfie
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#0B2559", marginBottom: 4 }}>PHOTO DE PROFIL</div>
                {m.photos[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.photos[0]} alt="Photo de profil" style={imgBox} onClick={() => setZoom(m.photos[0])} />
                ) : (
                  <div style={{ ...imgBox, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B", fontSize: 13 }}>
                    Aucune photo
                  </div>
                )}
              </div>
            </div>

            {m.photos.length > 1 && (
              <div style={{ display: "flex", gap: 6, marginTop: 8, overflowX: "auto" }}>
                {m.photos.slice(1).map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={url}
                    src={url}
                    alt=""
                    onClick={() => setZoom(url)}
                    style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 10, cursor: "zoom-in", flexShrink: 0 }}
                  />
                ))}
              </div>
            )}

            {m.note && tab === "REJECTED" && (
              <p style={{ fontSize: 13, color: "#B42318", margin: "10px 0 0" }}>Motif : {m.note}</p>
            )}

            {rejecting === m.userId ? (
              <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>Motif du refus (envoyé au membre) :</div>
                {REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    disabled={busy === m.userId}
                    onClick={() => decide(m.userId, "REJECT", r)}
                    style={{ textAlign: "left", padding: "10px 12px", borderRadius: 12, border: "1.5px solid #FECACA", background: "#FEF2F2", color: "#991B1B", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
                  >
                    {r}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setRejecting(null)}
                  style={{ padding: 10, borderRadius: 12, border: "none", background: "#F1F5F9", color: "#475569", fontWeight: 700, cursor: "pointer" }}
                >
                  Annuler
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: tab === "APPROVED" ? "1fr" : "1fr 1fr", gap: 8, marginTop: 12 }}>
                {tab !== "APPROVED" && (
                  <button
                    type="button"
                    disabled={busy === m.userId || !m.selfieUrl}
                    onClick={() => decide(m.userId, "APPROVE")}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: 12, borderRadius: 12, border: "none", background: "#12B76A", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", opacity: busy === m.userId || !m.selfieUrl ? 0.6 : 1 }}
                  >
                    <Check size={18} /> Valider
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy === m.userId}
                  onClick={() => setRejecting(m.userId)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: 12, borderRadius: 12, border: "1.5px solid #FCA5A5", background: "#FEF2F2", color: "#B42318", fontWeight: 800, fontSize: 15, cursor: "pointer" }}
                >
                  <X size={18} /> {tab === "APPROVED" ? "Retirer la validation" : "Refuser"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {zoom && (
        <div
          onClick={() => setZoom(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.9)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, cursor: "zoom-out" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoom} alt="" style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 16 }} />
        </div>
      )}
    </div>
  );
}
