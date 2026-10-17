"use client";
// src/app/admin/sorties/page.tsx
// Sorties à confirmer (administrateur) : les deux membres ont accepté ; l'administrateur contacte
// le lieu (WhatsApp / téléphone), négocie, puis confirme ou refuse. Les membres sont prévenus.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarCheck, Check, ChevronLeft, MessageCircle, Phone, X } from "lucide-react";
import { countryName } from "@/lib/countries";

interface AdminSortie {
  id: string;
  proposer: { userId: string; firstName: string; pseudo?: string; photo?: string };
  guest: { userId: string; firstName: string; pseudo?: string; photo?: string };
  venue: { title?: string; proName?: string; address?: string; city?: string; country?: string; photo?: string | null } | null;
  pro: { slug: string; name: string; whatsapp?: string; phone?: string; facebook?: string; address?: string; city?: string; country?: string } | null;
  listingId: string | null;
  pack: string;
  price: number | null;
  scheduledAt: string;
  note?: string | null;
  status: string;
  statusLabel: string;
  teamNote?: string | null;
}

function waLink(num?: string, text?: string) {
  if (!num) return null;
  const digits = num.replace(/\D/g, "").replace(/^00/, "");
  return digits.length >= 8 ? `https://wa.me/${digits}?text=${encodeURIComponent(text || "")}` : null;
}

export default function AdminSorties() {
  const [view, setView] = useState<"todo" | "all">("todo");
  const [items, setItems] = useState<AdminSortie[] | null>(null);
  const [todo, setTodo] = useState(0);
  const [ready, setReady] = useState(true);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async (v: "todo" | "all") => {
    setItems(null);
    setError("");
    try {
      const r = await fetch(`/api/sorties/admin?view=${v}`, { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Accès refusé");
      setReady(d.ready !== false);
      setItems(d.sorties || []);
      setTodo(d.todo || 0);
    } catch (e: any) {
      setError(e.message);
      setItems([]);
    }
  }, []);

  useEffect(() => {
    load(view);
  }, [view, load]);

  async function decide(id: string, action: "CONFIRM" | "DECLINE") {
    setBusy(id);
    try {
      const r = await fetch("/api/sorties/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, note: notes[id] || "" }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) alert(d.error || "Action impossible");
      load(view);
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
            <CalendarCheck size={24} /> Sorties à confirmer
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "#64748B", lineHeight: 1.5 }}>
            Les deux membres ont accepté. Contactez le lieu, négociez la disponibilité et les conditions, puis confirmez :
            les membres sont prévenus automatiquement.
          </p>
        </div>

        {!ready && (
          <div style={{ background: "#FFFBEB", color: "#92400E", padding: 14, borderRadius: 14, fontWeight: 700 }}>
            Les sorties ne sont pas encore activées (migration v7 à exécuter dans Supabase).
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={() => setView("todo")} style={pill(view === "todo")}>
            À confirmer {todo ? <span style={{ marginLeft: 4, background: "#E10600", color: "#fff", borderRadius: 999, padding: "1px 7px", fontSize: 12 }}>{todo}</span> : null}
          </button>
          <button type="button" onClick={() => setView("all")} style={pill(view === "all")}>Toutes les autres</button>
        </div>

        {error && <div style={{ background: "#FEF2F2", color: "#B42318", padding: 14, borderRadius: 14, fontWeight: 700 }}>{error}</div>}
        {items === null && <p style={{ color: "#64748B" }}>Chargement…</p>}
        {items?.length === 0 && !error && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, textAlign: "center", color: "#64748B", fontWeight: 600 }}>
            {view === "todo" ? "Aucune sortie à confirmer. 🎉" : "Aucune sortie."}
          </div>
        )}

        {items?.map((s) => {
          const when = new Date(s.scheduledAt).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
          const msg = `Bonjour ${s.pro?.name || ""}, ici l'équipe Meet Me Club. Nous souhaitons réserver pour 2 personnes le ${when} (pack ${s.pack}) suite à votre annonce « ${s.venue?.title || ""} ». Est-ce disponible ?`;
          const wa = waLink(s.pro?.whatsapp, msg);
          return (
            <div key={s.id} style={{ background: "#fff", borderRadius: 18, padding: 14, boxShadow: "0 4px 14px rgba(11,37,89,0.06)", display: "grid", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                <strong style={{ fontSize: 16, color: "#0F172A" }}>
                  {s.proposer.firstName} {s.proposer.pseudo ? `(@${s.proposer.pseudo})` : ""} & {s.guest.firstName} {s.guest.pseudo ? `(@${s.guest.pseudo})` : ""}
                </strong>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#1E40AF", background: "#DBEAFE", padding: "3px 10px", borderRadius: 999 }}>{s.statusLabel}</span>
              </div>
              <div style={{ fontSize: 14, color: "#334155", lineHeight: 1.6 }}>
                <div>📅 <strong>{when}</strong></div>
                <div>
                  📍 <strong>{s.venue?.proName}</strong> — {s.venue?.title}
                  <br />
                  <span style={{ color: "#64748B" }}>{[s.pro?.address || s.venue?.address, s.venue?.city, countryName(s.venue?.country)].filter(Boolean).join(", ")}</span>
                </div>
                <div>🎟️ Pack {s.pack}{s.price ? ` · ${s.price.toLocaleString("fr-FR")} FCFA` : ""}</div>
                {s.note && <div style={{ fontStyle: "italic", color: "#475569" }}>Message : « {s.note} »</div>}
                {s.teamNote && <div style={{ color: "#1E40AF" }}>Note envoyée : {s.teamNote}</div>}
              </div>

              {s.pro && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {wa && (
                    <a href={wa} target="_blank" rel="noopener noreferrer" style={{ flex: 1, minWidth: 140, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: 10, borderRadius: 10, background: "#25D366", color: "#fff", fontWeight: 800, textDecoration: "none" }}>
                      <MessageCircle size={16} /> WhatsApp du lieu
                    </a>
                  )}
                  {s.pro.phone && (
                    <a href={`tel:${s.pro.phone.replace(/\s/g, "")}`} style={{ flex: 1, minWidth: 140, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: 10, borderRadius: 10, background: "#0B2559", color: "#fff", fontWeight: 800, textDecoration: "none" }}>
                      <Phone size={16} /> {s.pro.phone}
                    </a>
                  )}
                  <Link href={`/marche/pro/${s.pro.slug}`} style={{ flex: 1, minWidth: 140, textAlign: "center", padding: 10, borderRadius: 10, border: "1.5px solid #CBD5E1", color: "#0B2559", fontWeight: 800, textDecoration: "none" }}>
                    Vitrine du lieu
                  </Link>
                </div>
              )}

              {s.status === "WAITING_TEAM" && (
                <>
                  <textarea
                    value={notes[s.id] || ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [s.id]: e.target.value }))}
                    maxLength={400}
                    placeholder="Message aux deux membres (facultatif) : table réservée au nom de…, code d'accès, autre date proposée…"
                    style={{ width: "100%", minHeight: 70, padding: 10, borderRadius: 12, border: "1.5px solid #CBD5E1", fontSize: 14, resize: "vertical", boxSizing: "border-box" }}
                  />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <button type="button" disabled={busy === s.id} onClick={() => decide(s.id, "CONFIRM")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: 12, borderRadius: 12, border: "none", background: "#12B76A", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
                      <Check size={18} /> Confirmer
                    </button>
                    <button type="button" disabled={busy === s.id} onClick={() => decide(s.id, "DECLINE")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: 12, borderRadius: 12, border: "1.5px solid #FCA5A5", background: "#FEF2F2", color: "#B42318", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
                      <X size={18} /> Lieu indisponible
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
