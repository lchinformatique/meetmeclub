"use client";
// src/app/rendez-vous/page.tsx
// Mes sorties : invitations envoyées et reçues, dans les hôtels et logements du Marché.
// L'invité(e) accepte ou refuse ; l'équipe Meet Me Club confirme ensuite avec le lieu.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { Calendar, CheckCircle2, Clock, MapPin, Plus, XCircle } from "lucide-react";
import { countryName } from "@/lib/countries";

interface Sortie {
  id: string;
  role: "proposer" | "guest";
  other: { userId: string; firstName: string; pseudo?: string; photo?: string };
  venue: { title?: string; proName?: string; address?: string; city?: string; country?: string; photo?: string | null } | null;
  packName: string;
  price: number | null;
  scheduledAt: string;
  note?: string | null;
  status: "WAITING_GUEST" | "WAITING_TEAM" | "CONFIRMED" | "DECLINED_GUEST" | "DECLINED_TEAM" | "CANCELLED";
  statusLabel: string;
  teamNote?: string | null;
}

const STATUS_STYLE: Record<Sortie["status"], { bg: string; color: string }> = {
  WAITING_GUEST: { bg: "#FEF3C7", color: "#92400E" },
  WAITING_TEAM: { bg: "#DBEAFE", color: "#1E40AF" },
  CONFIRMED: { bg: "#DCFCE7", color: "#166534" },
  DECLINED_GUEST: { bg: "#F1F5F9", color: "#475569" },
  DECLINED_TEAM: { bg: "#FEE2E2", color: "#991B1B" },
  CANCELLED: { bg: "#F1F5F9", color: "#475569" },
};

const ACTIVE = ["WAITING_GUEST", "WAITING_TEAM", "CONFIRMED"];

export default function MesSortiesPage() {
  const [sorties, setSorties] = useState<Sortie[] | null>(null);
  const [tab, setTab] = useState<"active" | "past">("active");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/sorties", { cache: "no-store" });
      if (r.status === 401) {
        window.location.href = "/connexion?callbackUrl=/rendez-vous";
        return;
      }
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Chargement impossible");
      setSorties(d.sorties || []);
    } catch (e: any) {
      setError(e.message);
      setSorties([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function act(id: string, action: "ACCEPT" | "DECLINE" | "CANCEL") {
    if (action === "CANCEL" && !confirm("Annuler cette sortie ?")) return;
    setBusy(id);
    try {
      const r = await fetch(`/api/sorties/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) alert(d.error || "Action impossible");
      await load();
    } finally {
      setBusy(null);
    }
  }

  const now = Date.now();
  const list = (sorties || []).filter((s) =>
    tab === "active" ? ACTIVE.includes(s.status) && new Date(s.scheduledAt).getTime() > now - 6 * 3600 * 1000 : !(ACTIVE.includes(s.status) && new Date(s.scheduledAt).getTime() > now - 6 * 3600 * 1000)
  );
  const toAnswer = (sorties || []).filter((s) => s.role === "guest" && s.status === "WAITING_GUEST").length;

  return (
    <div style={{ minHeight: "100dvh", background: "#F4F6FB" }}>
      <Header />
      <main className="container" style={{ maxWidth: 760, paddingTop: 20, paddingBottom: "calc(110px + env(safe-area-inset-bottom))" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: "clamp(1.4rem, 4vw, 1.9rem)", fontWeight: 800, color: "#0B2559", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <Calendar size={26} /> Mes sorties
            </h1>
            <p style={{ margin: "4px 0 0", color: "#475569", fontSize: 14 }}>
              Invitez un membre dans un hôtel ou un logement du Marché. L&apos;équipe confirme chaque sortie avec le lieu.
            </p>
          </div>
          <Link href="/messages" className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Plus size={18} /> Inviter un membre
          </Link>
        </div>

        {toAnswer > 0 && (
          <div style={{ background: "#FEF3C7", color: "#92400E", borderRadius: 14, padding: "12px 14px", fontWeight: 700, marginBottom: 12 }}>
            📩 {toAnswer} invitation{toAnswer > 1 ? "s" : ""} en attente de votre réponse.
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {([
            ["active", "À venir"],
            ["past", "Historique"],
          ] as const).map(([k, l]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              style={{ padding: "9px 16px", borderRadius: 999, border: "none", fontWeight: 800, fontSize: 14, cursor: "pointer", background: tab === k ? "#0B2559" : "#fff", color: tab === k ? "#fff" : "#0B2559" }}
            >
              {l}
            </button>
          ))}
        </div>

        {error && <div style={{ background: "#FEF2F2", color: "#B42318", padding: 14, borderRadius: 14, fontWeight: 700, marginBottom: 12 }}>{error}</div>}
        {sorties === null && <p style={{ color: "#64748B" }}>Chargement…</p>}

        {sorties !== null && list.length === 0 && (
          <div style={{ background: "#fff", borderRadius: 18, padding: "28px 20px", textAlign: "center", color: "#475569" }}>
            <p style={{ fontSize: 40, margin: 0 }}>🥂</p>
            <p style={{ fontWeight: 700, margin: "8px 0 14px" }}>
              {tab === "active" ? "Aucune sortie prévue pour le moment." : "Aucune sortie passée."}
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/messages" className="btn btn-primary">Inviter un membre</Link>
              <Link href="/marche?categorie=HOTEL" className="btn btn-ghost">Voir les lieux</Link>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gap: 12 }}>
          {list.map((s) => {
            const st = STATUS_STYLE[s.status];
            const when = new Date(s.scheduledAt).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
            const place = [s.venue?.address, s.venue?.city, countryName(s.venue?.country)].filter(Boolean).join(", ");
            return (
              <div key={s.id} style={{ background: "#fff", borderRadius: 18, overflow: "hidden", boxShadow: "0 4px 14px rgba(11,37,89,0.07)" }}>
                <div style={{ display: "flex", gap: 12, padding: 14 }}>
                  <div style={{ width: 84, height: 84, borderRadius: 14, flexShrink: 0, background: s.venue?.photo ? `center/cover url("${s.venue.photo}")` : "#E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>
                    {!s.venue?.photo && "🏨"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "inline-block", fontSize: 12, fontWeight: 800, padding: "3px 10px", borderRadius: 999, background: st.bg, color: st.color }}>
                      {s.statusLabel}
                    </span>
                    <strong style={{ display: "block", fontSize: 16, color: "#0F172A", marginTop: 4 }}>
                      {s.role === "proposer" ? `Avec ${s.other.firstName}` : `Invitation de ${s.other.firstName}`}
                    </strong>
                    <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#334155", fontWeight: 600 }}>
                      <Clock size={14} /> {when}
                    </span>
                    <span style={{ display: "flex", alignItems: "flex-start", gap: 5, fontSize: 13, color: "#64748B", marginTop: 2 }}>
                      <MapPin size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                      <span style={{ minWidth: 0 }}>
                        <strong style={{ color: "#0B2559" }}>{s.venue?.proName}</strong>
                        {s.venue?.title ? ` · ${s.venue.title}` : ""}
                        {place ? <span style={{ display: "block" }}>{place}</span> : null}
                      </span>
                    </span>
                    <span style={{ display: "block", fontSize: 13, color: "#475569", marginTop: 2 }}>
                      Pack {s.packName}
                      {s.price ? ` · ${s.price.toLocaleString("fr-FR")} FCFA` : ""}
                    </span>
                    {s.note && <span style={{ display: "block", fontSize: 13, color: "#475569", fontStyle: "italic", marginTop: 4 }}>« {s.note} »</span>}
                    {s.teamNote && <span style={{ display: "block", fontSize: 13, color: "#1E40AF", marginTop: 4 }}>Équipe Meet Me Club : {s.teamNote}</span>}
                  </div>
                </div>

                {(s.status === "WAITING_GUEST" || s.status === "WAITING_TEAM") && (
                  <div style={{ display: "flex", gap: 8, padding: "0 14px 14px", flexWrap: "wrap" }}>
                    {s.role === "guest" && s.status === "WAITING_GUEST" && (
                      <>
                        <button type="button" disabled={busy === s.id} onClick={() => act(s.id, "ACCEPT")} style={{ flex: 1, minWidth: 120, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: 11, borderRadius: 12, border: "none", background: "#12B76A", color: "#fff", fontWeight: 800, cursor: "pointer" }}>
                          <CheckCircle2 size={18} /> Accepter
                        </button>
                        <button type="button" disabled={busy === s.id} onClick={() => act(s.id, "DECLINE")} style={{ flex: 1, minWidth: 120, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: 11, borderRadius: 12, border: "1.5px solid #FCA5A5", background: "#FEF2F2", color: "#B42318", fontWeight: 800, cursor: "pointer" }}>
                          <XCircle size={18} /> Refuser
                        </button>
                      </>
                    )}
                    {(s.role === "proposer" || s.status === "WAITING_TEAM") && (
                      <button type="button" disabled={busy === s.id} onClick={() => act(s.id, "CANCEL")} style={{ flex: 1, minWidth: 120, padding: 11, borderRadius: 12, border: "1.5px solid #CBD5E1", background: "#fff", color: "#475569", fontWeight: 800, cursor: "pointer" }}>
                        Annuler la sortie
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
