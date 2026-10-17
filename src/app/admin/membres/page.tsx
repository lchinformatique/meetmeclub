"use client";
// src/app/admin/membres/page.tsx
// Vue d'ensemble de tous les membres (administrateur uniquement) : photo, identité, contact,
// plan, statut, jours restants, en ligne — avec recherche, filtres et activation de pass.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronLeft, MessageCircle, Phone, Search } from "lucide-react";
import { useRealtime } from "@/components/realtime/RealtimeProvider";

interface Member {
  userId: string;
  firstName: string;
  lastName?: string;
  pseudo?: string;
  gender?: string;
  age: number | null;
  city?: string;
  neighborhood?: string;
  profession?: string;
  bio?: string;
  email: string | null;
  phone: string | null;
  accountStatus: string;
  role: string;
  plan: "FREE" | "ESSENTIAL" | "COMPLICE" | "VIP";
  expired: boolean;
  expiresAt: string;
  daysLeft: number;
  likesCount: number;
  photos: string[];
  createdAt: string;
}

const PLAN_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  VIP: { label: "VIP", bg: "#FEF3C7", color: "#92400E" },
  COMPLICE: { label: "Complice", bg: "#DBEAFE", color: "#1E40AF" },
  ESSENTIAL: { label: "Essentiel", bg: "#D1FAE5", color: "#065F46" },
  FREE: { label: "Gratuit", bg: "#F1F5F9", color: "#475569" },
};

const FILTERS = [
  ["all", "Tous"],
  ["online", "En ligne"],
  ["new", "Nouveaux"],
  ["VIP", "VIP"],
  ["COMPLICE", "Complice"],
  ["ESSENTIAL", "Essentiel"],
  ["FREE", "Essai gratuit"],
  ["expired", "Expirés"],
] as const;

export default function AdminMembres() {
  const rt = useRealtime();
  const [members, setMembers] = useState<Member[] | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number][0]>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = () =>
    fetch("/api/dashboard", { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || "Accès refusé");
        setMembers(d.members);
      })
      .catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  const list = useMemo(() => {
    if (!members) return [];
    const term = q.trim().toLowerCase();
    const week = 7 * 24 * 3600 * 1000;
    return members
      .filter((m) => {
        if (filter === "online") return rt.isOnline(m.userId);
        if (filter === "new") return Date.now() - new Date(m.createdAt).getTime() < week;
        if (filter === "expired") return m.expired;
        if (filter === "FREE") return m.plan === "FREE" && !m.expired;
        if (filter !== "all") return m.plan === filter;
        return true;
      })
      .filter((m) =>
        !term
          ? true
          : [m.firstName, m.lastName, m.pseudo, m.email, m.phone, m.city, m.profession].some((v) => v?.toLowerCase().includes(term))
      )
      .sort((a, b) => Number(rt.isOnline(b.userId)) - Number(rt.isOnline(a.userId)));
  }, [members, q, filter, rt]);

  async function activate(m: Member, plan: string) {
    const identifier = m.pseudo || m.email;
    if (!identifier) return setNotice("Ce membre n'a ni pseudo ni e-mail.");
    if (!confirm(`Activer le Pass ${PLAN_STYLE[plan].label} (30 jours) pour ${m.firstName} ?`)) return;
    setBusy(m.userId);
    try {
      const res = await fetch("/api/payments/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, plan }),
      });
      const d = await res.json().catch(() => ({}));
      setNotice(res.ok ? `Pass ${PLAN_STYLE[plan].label} activé pour ${m.firstName}.` : d.error || "Échec");
      if (res.ok) load();
    } finally {
      setBusy(null);
    }
  }

  const fmt = (iso: string) => (iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—");

  return (
    <div style={{ minHeight: "100dvh", background: "#F4F6FB", padding: "max(16px, env(safe-area-inset-top)) 12px calc(96px + env(safe-area-inset-bottom))" }}>
      <div style={{ maxWidth: 820, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
        <Link href="/admin" style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#0B2559", fontWeight: 700, textDecoration: "none" }}>
          <ChevronLeft size={20} /> Espace de gestion
        </Link>
        <h1 style={{ margin: 0, fontSize: 22, color: "#0B2559" }}>
          Membres {members ? `(${list.length}${list.length !== members.length ? ` / ${members.length}` : ""})` : ""}
        </h1>

        {error && <div style={{ background: "#FEF2F2", color: "#B42318", padding: 14, borderRadius: 14, fontWeight: 700 }}>{error}</div>}
        {notice && (
          <div onClick={() => setNotice(null)} style={{ background: "#0B2559", color: "#fff", padding: 12, borderRadius: 12, fontWeight: 600 }}>
            {notice}
          </div>
        )}

        <label style={{ display: "flex", alignItems: "center", gap: 8, height: 48, padding: "0 14px", background: "#fff", borderRadius: 14, color: "#64748B" }}>
          <Search size={18} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nom, pseudo, e-mail, téléphone, ville…"
            style={{ flex: 1, border: "none", outline: "none", fontSize: 16, background: "transparent" }}
          />
        </label>

        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {FILTERS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              style={{
                flexShrink: 0,
                height: 36,
                padding: "0 14px",
                borderRadius: 999,
                border: "none",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                background: filter === key ? "#0B2559" : "#fff",
                color: filter === key ? "#fff" : "#334155",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {!members && !error && <div style={{ textAlign: "center", color: "#64748B", padding: 30 }}>Chargement des membres…</div>}

        {list.map((m) => {
          const online = rt.isOnline(m.userId);
          const plan = PLAN_STYLE[m.plan] || PLAN_STYLE.FREE;
          const open = openId === m.userId;
          return (
            <div key={m.userId} style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 14px rgba(11,37,89,0.06)", overflow: "hidden" }}>
              <button
                type="button"
                onClick={() => setOpenId(open ? null : m.userId)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: 12, border: "none", background: "none", textAlign: "left", cursor: "pointer" }}
              >
                <span style={{ position: "relative", flexShrink: 0 }}>
                  {m.photos[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.photos[0]} alt="" width={52} height={52} style={{ borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ width: 52, height: 52, borderRadius: "50%", background: "#0B2559", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20 }}>
                      {(m.firstName || "M").charAt(0).toUpperCase()}
                    </span>
                  )}
                  {online && <span style={{ position: "absolute", right: 0, bottom: 0, width: 14, height: 14, borderRadius: "50%", background: "#12B76A", border: "2.5px solid #fff" }} />}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <strong style={{ fontSize: 15, color: "#0F172A" }}>
                      {m.firstName} {m.lastName || ""}
                    </strong>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 999, background: plan.bg, color: plan.color }}>{plan.label}</span>
                    {m.expired && <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 999, background: "#FEE2E2", color: "#B42318" }}>Expiré</span>}
                  </span>
                  <span style={{ display: "block", fontSize: 12, color: "#64748B", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {m.pseudo ? `@${m.pseudo} · ` : ""}
                    {online ? "🟢 en ligne" : "hors ligne"} · {m.expired ? "accès terminé" : `${m.daysLeft} j restants`}
                  </span>
                </span>
                <ChevronDown size={20} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s", color: "#94A3B8" }} />
              </button>

              {open && (
                <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 10, fontSize: 14, color: "#334155" }}>
                  {m.photos.length > 0 && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                      {m.photos.map((url, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={i} src={url} alt="" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 10 }} />
                      ))}
                    </div>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "6px 16px" }}>
                    <span><b>Téléphone :</b> {m.phone || "—"}</span>
                    <span style={{ wordBreak: "break-all" }}><b>E-mail :</b> {m.email || "—"}</span>
                    <span><b>Âge :</b> {m.age ?? "—"} · <b>Genre :</b> {m.gender === "MALE" ? "Homme" : m.gender === "FEMALE" ? "Femme" : "—"}</span>
                    <span><b>Ville :</b> {m.city || "—"}{m.neighborhood ? `, ${m.neighborhood}` : ""}</span>
                    <span><b>Profession :</b> {m.profession || "—"}</span>
                    <span><b>Inscrit le :</b> {fmt(m.createdAt)}</span>
                    <span><b>Fin de l&apos;accès :</b> {fmt(m.expiresAt)}</span>
                    <span><b>Likes reçus :</b> {m.likesCount} · <b>Compte :</b> {m.accountStatus}</span>
                  </div>
                  {m.bio && <p style={{ margin: 0, padding: 10, background: "#F8FAFC", borderRadius: 10, fontSize: 13 }}>{m.bio}</p>}

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {m.phone && (
                      <a href={`tel:${m.phone.replace(/\s+/g, "")}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 40, padding: "0 14px", borderRadius: 12, background: "#ECFDF5", color: "#067647", fontWeight: 700, textDecoration: "none" }}>
                        <Phone size={16} /> Appeler
                      </a>
                    )}
                    <Link href={`/messages?contact=${encodeURIComponent(m.userId)}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 40, padding: "0 14px", borderRadius: 12, background: "#EEF3FF", color: "#0B2559", fontWeight: 700, textDecoration: "none" }}>
                      <MessageCircle size={16} /> Écrire
                    </Link>
                  </div>

                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", borderTop: "1px solid #E2E8F0", paddingTop: 10 }}>
                    <span style={{ width: "100%", fontSize: 12, fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>Activer un pass (30 jours)</span>
                    {(["ESSENTIAL", "COMPLICE", "VIP"] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        disabled={busy === m.userId}
                        onClick={() => activate(m, p)}
                        style={{ flex: 1, minWidth: 90, height: 40, borderRadius: 12, border: `1.5px solid ${PLAN_STYLE[p].color}`, background: PLAN_STYLE[p].bg, color: PLAN_STYLE[p].color, fontWeight: 800, cursor: "pointer" }}
                      >
                        {PLAN_STYLE[p].label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {members && list.length === 0 && <div style={{ textAlign: "center", color: "#64748B", padding: 30 }}>Aucun membre pour ce filtre.</div>}
      </div>
    </div>
  );
}
