"use client";
// src/app/admin/page.tsx
// Tableau de bord de l'administrateur : chiffres clés et accès aux outils de gestion.

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Crown, Megaphone, UserPlus, Users, Wallet, Clock, Sparkles, Zap, CircleOff, ShieldCheck } from "lucide-react";
import { useRealtime } from "@/components/realtime/RealtimeProvider";

interface Stats {
  total: number;
  newToday: number;
  newThisWeek: number;
  vip: number;
  complice: number;
  essential: number;
  freeActive: number;
  expired: number;
  pendingPayments: number;
}

export default function AdminHome() {
  const rt = useRealtime();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [selfiesPending, setSelfiesPending] = useState(0);

  // Chiffres seuls (requête légère) — chargés une fois à l'ouverture
  useEffect(() => {
    fetch("/api/dashboard?stats=1", { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || "Accès refusé");
        setStats(d.stats);
      })
      .catch((e) => setError(e.message));
    fetch("/api/verifications/admin?countOnly=1", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setSelfiesPending(d.pending || 0))
      .catch(() => {});
  }, []);

  const onlineCount = Object.keys(rt.online).length;
  const pending = Math.max(rt.adminPending, stats?.pendingPayments ?? 0);

  const tile = (bg: string): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "18px 16px",
    borderRadius: 18,
    background: bg,
    color: "#fff",
    textDecoration: "none",
    boxShadow: "0 10px 26px rgba(11,37,89,0.18)",
  });

  const stat = (label: string, value: number | string, Icon: typeof Users, color: string) => (
    <div style={{ background: "#fff", borderRadius: 16, padding: 14, display: "flex", flexDirection: "column", gap: 6, boxShadow: "0 4px 14px rgba(11,37,89,0.06)" }}>
      <span style={{ width: 32, height: 32, borderRadius: 10, background: `${color}1A`, color, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={17} />
      </span>
      <strong style={{ fontSize: 24, color: "#0F172A" }}>{value}</strong>
      <span style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>{label}</span>
    </div>
  );

  return (
    <div style={{ minHeight: "100dvh", background: "#F4F6FB", padding: "max(16px, env(safe-area-inset-top)) 14px calc(96px + env(safe-area-inset-bottom))" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <Link href="/profil" style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#0B2559", fontWeight: 700, textDecoration: "none" }}>
          <ChevronLeft size={20} /> Retour
        </Link>

        <div>
          <h1 style={{ margin: 0, fontSize: 24, color: "#0B2559" }}>Espace de gestion</h1>
          <p style={{ margin: "2px 0 0", fontSize: 14, color: "#64748B" }}>Visible uniquement par vous · Meet Me Club</p>
        </div>

        {error && <div style={{ background: "#FEF2F2", color: "#B42318", padding: 14, borderRadius: 14, fontWeight: 700 }}>{error}</div>}

        <Link href="/admin/paiements" style={tile(pending > 0 ? "linear-gradient(135deg,#E10600,#B30500)" : "linear-gradient(135deg,#0B2559,#163B8A)")}>
          <Wallet size={28} />
          <span style={{ flex: 1 }}>
            <strong style={{ display: "block", fontSize: 17 }}>{pending > 0 ? `${pending} paiement(s) à valider` : "Paiements"}</strong>
            <span style={{ fontSize: 13, opacity: 0.9 }}>Tentatives SasPay, validation et activation des pass</span>
          </span>
          <ChevronRight size={22} />
        </Link>

        <Link href="/admin/verifications" style={tile(selfiesPending > 0 ? "linear-gradient(135deg,#E10600,#B30500)" : "linear-gradient(135deg,#0B2559,#163B8A)")}>
          <ShieldCheck size={28} />
          <span style={{ flex: 1 }}>
            <strong style={{ display: "block", fontSize: 17 }}>{selfiesPending > 0 ? `${selfiesPending} selfie(s) à vérifier` : "Vérification des visages"}</strong>
            <span style={{ fontSize: 13, opacity: 0.9 }}>Selfies en direct comparés aux photos de profil</span>
          </span>
          <ChevronRight size={22} />
        </Link>

        <Link href="/admin/membres" style={tile("linear-gradient(135deg,#0B2559,#163B8A)")}>
          <Users size={28} />
          <span style={{ flex: 1 }}>
            <strong style={{ display: "block", fontSize: 17 }}>Membres {stats ? `(${stats.total})` : ""}</strong>
            <span style={{ fontSize: 13, opacity: 0.9 }}>Noms, photos, numéros, plans, statuts et jours restants</span>
          </span>
          <ChevronRight size={22} />
        </Link>

        <Link href="/admin/annonce" style={tile("linear-gradient(135deg,#334155,#0F172A)")}>
          <Megaphone size={28} />
          <span style={{ flex: 1 }}>
            <strong style={{ display: "block", fontSize: 17 }}>Annonce à tous les membres</strong>
            <span style={{ fontSize: 13, opacity: 0.9 }}>Notification sur leur téléphone</span>
          </span>
          <ChevronRight size={22} />
        </Link>

        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
            {stat("En ligne maintenant", onlineCount, Users, "#12B76A")}
            {stat("Nouveaux aujourd'hui", stats.newToday, UserPlus, "#E10600")}
            {stat("Nouveaux (7 jours)", stats.newThisWeek, UserPlus, "#F59E0B")}
            {stat("Pass VIP", stats.vip, Crown, "#D97706")}
            {stat("Pass Complice", stats.complice, Sparkles, "#2563EB")}
            {stat("Pass Essentiel", stats.essential, Zap, "#059669")}
            {stat("Essai gratuit en cours", stats.freeActive, Clock, "#64748B")}
            {stat("Accès expiré", stats.expired, CircleOff, "#B42318")}
          </div>
        )}
      </div>
    </div>
  );
}
