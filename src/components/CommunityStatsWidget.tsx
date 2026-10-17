"use client";
// src/components/CommunityStatsWidget.tsx
// Real-time Community Statistics Widget — Shows live data from Supabase

import { useState, useEffect } from "react";
import Link from "next/link";
import { MessageCircle, Store } from "lucide-react";

/** Boutons d'action du panneau : discuter sur la plateforme et visiter le Marché */
function StatsActions({ online }: { online: number }) {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    flex: "1 1 220px",
    padding: "11px 16px",
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 800,
    textDecoration: "none",
    minHeight: 44,
  };
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", width: "100%", marginTop: 4 }}>
      <Link href="/messages?tab=online" style={{ ...base, background: "#2F4A8A", color: "#fff" }}>
        <MessageCircle size={18} />
        {online > 0 ? `Discuter avec les ${online} membre${online > 1 ? "s" : ""} en ligne` : "Discuter avec les membres"}
      </Link>
      <Link href="/marche" style={{ ...base, background: "#EEF2FB", color: "#2F4A8A", border: "1.5px solid #C9D3EA" }}>
        <Store size={18} />
        Visitez le Marché Meet Me Club
      </Link>
    </div>
  );
}

interface StatsData {
  totalMembers: number;
  totalProfiles?: number;
  totalPhotos?: number;
  totalVerifications?: number;
  totalPartners?: number;
  maleMembers?: number;
  femaleMembers?: number;
  vipMembers?: number;
  compliceMembers?: number;
  essentialMembers?: number;
  freeMembers?: number;
  verifiedSelfieMembers: number;
  organizedDates: number;
  onlineNow: number;
  lastUpdated: string;
}

interface CommunityStatsWidgetProps {
  compact?: boolean;
}

export default function CommunityStatsWidget({ compact = false }: CommunityStatsWidgetProps) {
  const [stats, setStats] = useState<StatsData>({
    totalMembers: 0,
    totalProfiles: 0,
    totalPhotos: 0,
    totalVerifications: 0,
    totalPartners: 3,
    maleMembers: 0,
    femaleMembers: 0,
    verifiedSelfieMembers: 0,
    organizedDates: 0,
    onlineNow: 0,
    lastUpdated: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats/community");
      if (res.ok) {
        const data = await res.json();
        if (data?.stats) {
          setStats(data.stats);
          setLoading(false);
        }
      }
    } catch {
      // Keep previous stats
    }
  };

  useEffect(() => {
    fetchStats();
    // Auto-update every 15 seconds so new registrations reflect live
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, []);

  if (compact) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(226, 232, 240, 0.9)",
          borderRadius: "16px",
          padding: "10px 16px",
          boxShadow: "0 6px 20px rgba(0, 0, 0, 0.05)",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "16px" }}>👥</span>
          <span style={{ fontSize: "13px", color: "#505D70", fontWeight: 600 }}>Membres :</span>
          <strong style={{ fontSize: "14px", color: "#0B2E6B", fontWeight: 800 }}>
            {stats.totalMembers.toLocaleString("fr-FR")}
          </strong>
          {(stats.maleMembers != null && stats.femaleMembers != null) && (
            <span style={{ fontSize: "11px", color: "#78859A", fontWeight: 600 }}>
              (♂ {stats.maleMembers} · ♀ {stats.femaleMembers})
            </span>
          )}
        </div>
        <div style={{ width: "1px", height: "18px", background: "#E2E8F0" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "16px" }}>🤳</span>
          <span style={{ fontSize: "13px", color: "#505D70", fontWeight: 600 }}>Vérifiés :</span>
          <strong style={{ fontSize: "14px", color: "#059669", fontWeight: 800 }}>
            {stats.verifiedSelfieMembers.toLocaleString("fr-FR")}
          </strong>
        </div>
        <div style={{ width: "1px", height: "18px", background: "#E2E8F0" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "16px" }}>📸</span>
          <span style={{ fontSize: "13px", color: "#505D70", fontWeight: 600 }}>Photos :</span>
          <strong style={{ fontSize: "14px", color: "#7C3AED", fontWeight: 800 }}>
            {(stats.totalPhotos ?? 0).toLocaleString("fr-FR")}
          </strong>
        </div>
        <div style={{ width: "1px", height: "18px", background: "#E2E8F0" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "16px" }}>🌴</span>
          <span style={{ fontSize: "13px", color: "#505D70", fontWeight: 600 }}>Lieux Partenaires :</span>
          <strong style={{ fontSize: "14px", color: "#B45309", fontWeight: 800 }}>
            {stats.totalPartners ?? 3}
          </strong>
        </div>
        <div style={{ width: "1px", height: "18px", background: "#E2E8F0" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#10B981",
              boxShadow: "0 0 6px #10B981",
            }}
          />
          <span style={{ fontSize: "12px", color: "#10B981", fontWeight: 700 }}>
            {stats.onlineNow} en ligne
          </span>
        </div>
        <StatsActions online={stats.onlineNow} />
      </div>
    );
  }

  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.96)",
        backdropFilter: "blur(14px)",
        borderRadius: "22px",
        padding: "20px 24px",
        border: "1.5px solid rgba(255, 255, 255, 0.8)",
        boxShadow: "0 12px 35px rgba(7, 21, 48, 0.12)",
        maxWidth: "960px",
        margin: "0 auto",
      }}
    >
      {/* Top Banner Row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
          borderBottom: "1px solid #F1F5F9",
          paddingBottom: "12px",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              display: "inline-block",
              width: "9px",
              height: "9px",
              borderRadius: "50%",
              background: "#10B981",
              boxShadow: "0 0 8px #10B981",
            }}
          />
          <span style={{ fontSize: "13px", fontWeight: 800, color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Statistiques Communauté · En direct
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", color: "#505D70", fontWeight: 600 }}>
            🟢 {stats.onlineNow} membres connectés
          </span>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              background: "#EFF6FF",
              color: "#1D4ED8",
              padding: "3px 8px",
              borderRadius: "9999px",
            }}
          >
            Actualisation auto
          </span>
        </div>
      </div>

      {/* 4 Metrics Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "14px",
        }}
      >
        {/* Metric 1: Total Membres */}
        <div
          style={{
            background: "#F8FAFC",
            borderRadius: "16px",
            padding: "14px 16px",
            border: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "rgba(11, 46, 107, 0.1)",
              color: "#0B2E6B",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              flexShrink: 0,
            }}
          >
            👥
          </div>
          <div>
            <div style={{ fontSize: "22px", fontWeight: 900, color: "#0B2E6B", lineHeight: 1 }}>
              {stats.totalMembers.toLocaleString("fr-FR")}
            </div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#505D70", marginTop: "3px" }}>
              Membres Inscrits {stats.maleMembers != null && stats.femaleMembers != null ? `(♂ ${stats.maleMembers} · ♀ ${stats.femaleMembers})` : ""}
            </div>
          </div>
        </div>

        {/* Metric 2: Profils avec Photos */}
        <div
          style={{
            background: "#F5F3FF",
            borderRadius: "16px",
            padding: "14px 16px",
            border: "1px solid #DDD6FE",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "rgba(124, 58, 237, 0.12)",
              color: "#7C3AED",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              flexShrink: 0,
            }}
          >
            📸
          </div>
          <div>
            <div style={{ fontSize: "22px", fontWeight: 900, color: "#7C3AED", lineHeight: 1 }}>
              {(stats.totalPhotos ?? 0).toLocaleString("fr-FR")}
            </div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#6D28D9", marginTop: "3px" }}>
              Photos de Profil
            </div>
          </div>
        </div>

        {/* Metric 3: Profils vérifiés selfie */}
        <div
          style={{
            background: "#F0FDF4",
            borderRadius: "16px",
            padding: "14px 16px",
            border: "1px solid #BBF7D0",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "rgba(5, 150, 105, 0.12)",
              color: "#059669",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              flexShrink: 0,
            }}
          >
            🤳
          </div>
          <div>
            <div style={{ fontSize: "22px", fontWeight: 900, color: "#059669", lineHeight: 1 }}>
              {stats.verifiedSelfieMembers.toLocaleString("fr-FR")}
            </div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#166534", marginTop: "3px" }}>
              Identités Vérifiées
            </div>
          </div>
        </div>

        {/* Metric 4: Rendez-vous organisés */}
        <div
          style={{
            background: "#FEF2F2",
            borderRadius: "16px",
            padding: "14px 16px",
            border: "1px solid #FECACA",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "rgba(225, 6, 0, 0.1)",
              color: "#E10600",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              flexShrink: 0,
            }}
          >
            🍷
          </div>
          <div>
            <div style={{ fontSize: "22px", fontWeight: 900, color: "#E10600", lineHeight: 1 }}>
              {stats.organizedDates.toLocaleString("fr-FR")}
            </div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#991B1B", marginTop: "3px" }}>
              Rencontres Réelles
            </div>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        <StatsActions online={stats.onlineNow} />
      </div>
    </div>
  );
}
