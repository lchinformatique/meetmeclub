"use client";
// src/app/admin/verifications/page.tsx
// Contrôle des vérifications (administrateur uniquement) :
//  · Selfies (essai gratuit)      — selfie en direct + geste demandé, à côté des photos du profil
//  · Pièces (packs 3 000 / 6 000) — pièces que l'IA n'a pas pu approuver seule, avec sa lecture ;
//                                   l'onglet « Validés » montre aussi les approbations automatiques
//  · Vidéos (VIP)                 — vidéo en direct avec le code à prononcer
// Valider = le membre apparaît et peut échanger (vidéo : appels débloqués).

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Bot, Check, ChevronLeft, ShieldCheck, X } from "lucide-react";

type Kind = "selfie" | "document" | "video";
type Tab = "PENDING" | "REJECTED" | "APPROVED";

interface Item {
  userId: string;
  firstName?: string;
  lastName?: string;
  pseudo?: string;
  gender?: string;
  city?: string;
  age?: number | null;
  plan?: string;
  photos: string[];
  submittedAt?: string | null;
  reviewedAt?: string | null;
  note?: string | null;
  // selfie
  gestureText?: string | null;
  selfieUrl?: string | null;
  // pièce
  docType?: string | null;
  reviewedBy?: string | null;
  frontUrl?: string | null;
  backUrl?: string | null;
  aiCheck?: { fullName?: string | null; dateOfBirth?: string | null; expiryDate?: string | null; reasons?: string[] } | null;
  // vidéo
  videoCode?: string | null;
  videoUrl?: string | null;
}

const KINDS: Array<[Kind, string]> = [
  ["selfie", "Selfies"],
  ["document", "Pièces d'identité"],
  ["video", "Vidéos VIP"],
];

const TABS: Array<[Tab, string]> = [
  ["PENDING", "À vérifier"],
  ["REJECTED", "Refusés"],
  ["APPROVED", "Validés"],
];

const REASONS: Record<Kind, string[]> = {
  selfie: [
    "Le selfie ne correspond pas aux photos du profil.",
    "Le geste demandé n'apparaît pas sur le selfie.",
    "Visage flou, trop sombre ou caché.",
    "Photo d'écran ou photo d'une photo : prenez un vrai selfie.",
  ],
  document: [
    "Le nom sur la pièce ne correspond pas à votre profil.",
    "La photo de la pièce ne correspond pas à vos photos de profil.",
    "Pièce illisible : reprenez une photo nette et bien éclairée.",
    "Document non accepté ou expiré : envoyez une pièce officielle valide avec photo.",
  ],
  video: [
    "La personne de la vidéo ne correspond pas aux photos du profil.",
    "Le code demandé n'est pas prononcé ou pas audible.",
    "Visage pas assez visible : refaites la vidéo dans un endroit éclairé.",
  ],
};

function when(iso?: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
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

function Empty({ label }: { label: string }) {
  return <div style={{ ...imgBox, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B", fontSize: 13, cursor: "default" }}>{label}</div>;
}

function AdminVerificationsInner() {
  const params = useSearchParams();
  const initialKind = (params.get("type") as Kind) || "selfie";
  const [kind, setKind] = useState<Kind>(KINDS.some(([k]) => k === initialKind) ? initialKind : "selfie");
  const [tab, setTab] = useState<Tab>("PENDING");
  const [items, setItems] = useState<Item[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [pendingByType, setPendingByType] = useState<Record<string, number>>({});
  const [configured, setConfigured] = useState(true);
  const [docsConfigured, setDocsConfigured] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [zoom, setZoom] = useState<string | null>(null);

  const load = useCallback(async (k: Kind, t: Tab) => {
    setItems(null);
    setError("");
    try {
      const r = await fetch(`/api/verifications/admin?type=${k}&status=${t}`, { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Accès refusé");
      setConfigured(d.configured !== false);
      setDocsConfigured(d.docsConfigured !== false);
      setItems(d.items || []);
      setCounts(d.counts || {});
      setPendingByType(d.pendingByType || {});
    } catch (e: any) {
      setError(e.message);
      setItems([]);
    }
  }, []);

  useEffect(() => {
    load(kind, tab);
  }, [kind, tab, load]);

  async function decide(userId: string, decision: "APPROVE" | "REJECT", note?: string) {
    setBusy(userId);
    try {
      const r = await fetch("/api/verifications/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, type: kind, decision, note }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Erreur");
      setItems((prev) => (prev || []).filter((i) => i.userId !== userId));
      const target = decision === "APPROVE" ? "APPROVED" : "REJECTED";
      setCounts((c) => ({ ...c, [tab]: Math.max(0, (c[tab] || 1) - 1), [target]: (c[target] || 0) + 1 }));
      if (tab === "PENDING") setPendingByType((p) => ({ ...p, [kind]: Math.max(0, (p[kind] || 1) - 1) }));
      setRejecting(null);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusy(null);
    }
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
            <ShieldCheck size={24} /> Vérification des membres
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "#64748B", lineHeight: 1.5 }}>
            Essai gratuit : selfie · Packs 3 000 et 6 000 : pièce d&apos;identité ·
            VIP : vidéo. Un membre n&apos;apparaît qu&apos;une fois vérifié.
          </p>
        </div>

        {!configured && (
          <div style={{ background: "#FEF2F2", color: "#B42318", padding: 14, borderRadius: 14, fontWeight: 700 }}>
            La vérification n&apos;est pas encore activée (migration v4 à exécuter dans Supabase).
          </div>
        )}
        {configured && !docsConfigured && kind !== "selfie" && (
          <div style={{ background: "#FFFBEB", color: "#92400E", padding: 14, borderRadius: 14, fontWeight: 700, lineHeight: 1.5 }}>
            Pièces d&apos;identité et vidéos pas encore activées : exécutez supabase/migration_v5_piece_video.sql dans Supabase.
          </div>
        )}

        <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
          {KINDS.map(([k, label]) => (
            <button key={k} type="button" onClick={() => { setKind(k); setTab("PENDING"); setRejecting(null); }} style={pill(kind === k)}>
              {label}
              {pendingByType[k] ? (
                <span style={{ marginLeft: 6, background: "#E10600", color: "#fff", borderRadius: 999, padding: "1px 7px", fontSize: 12 }}>{pendingByType[k]}</span>
              ) : null}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
          {TABS.map(([t, label]) => (
            <button key={t} type="button" onClick={() => setTab(t)} style={{ ...pill(tab === t), padding: "7px 12px", fontSize: 13, background: tab === t ? "#E10600" : "#fff", color: tab === t ? "#fff" : "#475569" }}>
              {label} {counts[t] ? `(${counts[t]})` : ""}
            </button>
          ))}
        </div>

        {error && <div style={{ background: "#FEF2F2", color: "#B42318", padding: 14, borderRadius: 14, fontWeight: 700 }}>{error}</div>}
        {items === null && <p style={{ color: "#64748B" }}>Chargement…</p>}
        {items?.length === 0 && !error && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, textAlign: "center", color: "#64748B", fontWeight: 600 }}>
            {tab === "PENDING" ? "Rien à vérifier pour le moment. 🎉" : "Aucun membre dans cette liste."}
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
              <span style={{ fontSize: 12, color: "#64748B", textAlign: "right" }}>
                {tab === "PENDING" ? `Envoyé ${when(m.submittedAt)}` : `Décidé ${when(m.reviewedAt)}`}
                {kind === "document" && m.reviewedBy === "AI" && (
                  <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#2563EB", fontWeight: 800, justifyContent: "flex-end" }}>
                    <Bot size={14} /> Validé automatiquement
                  </span>
                )}
              </span>
            </div>

            {kind === "selfie" && m.gestureText && (
              <div style={{ background: "#EFF6FF", borderRadius: 10, padding: "8px 10px", fontSize: 13, color: "#0B2559", marginBottom: 10 }}>
                <strong>Geste demandé :</strong> {m.gestureText}
              </div>
            )}
            {kind === "video" && m.videoCode && (
              <div style={{ background: "#EFF6FF", borderRadius: 10, padding: "8px 10px", fontSize: 13, color: "#0B2559", marginBottom: 10 }}>
                <strong>Code à prononcer :</strong> <span style={{ letterSpacing: 2, fontWeight: 800, color: "#E10600" }}>{m.videoCode}</span> — puis tourner la tête
              </div>
            )}
            {kind === "document" && (
              <div style={{ background: "#EFF6FF", borderRadius: 10, padding: "8px 10px", fontSize: 13, color: "#0B2559", marginBottom: 10, lineHeight: 1.6 }}>
                <div><strong>Pièce :</strong> {m.docType || "—"}</div>
                {m.aiCheck && (
                  <>
                    <div><strong>Lu par l&apos;IA :</strong> {m.aiCheck.fullName || "nom illisible"} · né(e) le {m.aiCheck.dateOfBirth || "?"}{m.aiCheck.expiryDate ? ` · expire le ${m.aiCheck.expiryDate}` : ""}</div>
                    {m.aiCheck.reasons && m.aiCheck.reasons.length > 0 && (
                      <div style={{ color: "#B42318" }}><strong>À vérifier :</strong> {m.aiCheck.reasons.join(" ")}</div>
                    )}
                  </>
                )}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#E10600", marginBottom: 4 }}>
                  {kind === "selfie" ? "SELFIE EN DIRECT" : kind === "video" ? "VIDÉO EN DIRECT" : "PIÈCE (RECTO)"}
                </div>
                {kind === "video" ? (
                  m.videoUrl ? (
                    <video src={m.videoUrl} controls playsInline style={{ ...imgBox, cursor: "default", background: "#0F172A" }} />
                  ) : (
                    <Empty label="Aucune vidéo" />
                  )
                ) : (kind === "selfie" ? m.selfieUrl : m.frontUrl) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={(kind === "selfie" ? m.selfieUrl : m.frontUrl)!}
                    alt=""
                    style={{ ...imgBox, objectFit: kind === "document" ? "contain" : "cover" }}
                    onClick={() => setZoom((kind === "selfie" ? m.selfieUrl : m.frontUrl)!)}
                  />
                ) : (
                  <Empty label="Aucun fichier" />
                )}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#0B2559", marginBottom: 4 }}>PHOTO DE PROFIL</div>
                {m.photos[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.photos[0]} alt="" style={imgBox} onClick={() => setZoom(m.photos[0])} />
                ) : (
                  <Empty label="Aucune photo" />
                )}
              </div>
            </div>

            {(m.photos.length > 1 || m.backUrl) && (
              <div style={{ display: "flex", gap: 6, marginTop: 8, overflowX: "auto" }}>
                {[...(m.backUrl ? [m.backUrl] : []), ...m.photos.slice(1)].map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={url}
                    src={url}
                    alt={m.backUrl && i === 0 ? "Verso" : ""}
                    title={m.backUrl && i === 0 ? "Verso de la pièce" : "Photo du profil"}
                    onClick={() => setZoom(url)}
                    style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 10, cursor: "zoom-in", flexShrink: 0, border: m.backUrl && i === 0 ? "2px solid #E10600" : "none" }}
                  />
                ))}
              </div>
            )}

            {m.note && tab === "REJECTED" && <p style={{ fontSize: 13, color: "#B42318", margin: "10px 0 0" }}>Motif : {m.note}</p>}

            {rejecting === m.userId ? (
              <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>Motif du refus (envoyé au membre) :</div>
                {REASONS[kind].map((r) => (
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
                <button type="button" onClick={() => setRejecting(null)} style={{ padding: 10, borderRadius: 12, border: "none", background: "#F1F5F9", color: "#475569", fontWeight: 700, cursor: "pointer" }}>
                  Annuler
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: tab === "APPROVED" ? "1fr" : "1fr 1fr", gap: 8, marginTop: 12 }}>
                {tab !== "APPROVED" && (
                  <button
                    type="button"
                    disabled={busy === m.userId}
                    onClick={() => decide(m.userId, "APPROVE")}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: 12, borderRadius: 12, border: "none", background: "#12B76A", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", opacity: busy === m.userId ? 0.6 : 1 }}
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
        <div onClick={() => setZoom(null)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.9)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, cursor: "zoom-out" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoom} alt="" style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 16 }} />
        </div>
      )}
    </div>
  );
}

export default function AdminVerifications() {
  return (
    <Suspense fallback={null}>
      <AdminVerificationsInner />
    </Suspense>
  );
}
