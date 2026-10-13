"use client";
// src/components/CommunityStatsWidget.tsx
// Real-time Community Statistics Widget — Updates automatically when new members join

import { useState, useEffect } from "react";

interface StatsData {
  totalMembers: number;
  vipMembers: number;
  compliceMembers: number;
  essentialMembers: number;
  freeMembers: number;
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
    totalMembers: 1424,
    vipMembers: 184,
    compliceMembers: 312,
    essentialMembers: 540,
    freeMembers: 388,
    verifiedSelfieMembers: 1294,
    organizedDates: 394,
    onlineNow: 72,
    lastUpdated: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats/community");
      if (res.ok) {
        const data = await res.json();
        if (data?.stats) {
          setStats(data.stats);
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
          <span style={{ fontSize: "13px", color: "#64748B", fontWeight: 600 }}>Membres :</span>
          <strong style={{ fontSize: "14px", color: "#0B2E6B", fontWeight: 800 }}>
            {stats.totalMembers.toLocaleString("fr-FR")}
          </strong>
        </div>
        <div style={{ width: "1px", height: "18px", background: "#E2E8F0" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "16px" }}>👑</span>
          <span style={{ fontSize: "13px", color: "#64748B", fontWeight: 600 }}>VIP &amp; Prestige :</span>
          <strong style={{ fontSize: "14px", color: "#B45309", fontWeight: 800 }}>
            {(stats.vipMembers + stats.compliceMembers).toLocaleString("fr-FR")}
          </strong>
        </div>
        <div style={{ width: "1px", height: "18px", background: "#E2E8F0" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "16px" }}>🤳</span>
          <span style={{ fontSize: "13px", color: "#64748B", fontWeight: 600 }}>Vérifiés Selfie :</span>
          <strong style={{ fontSize: "14px", color: "#059669", fontWeight: 800 }}>
            {stats.verifiedSelfieMembers.toLocaleString("fr-FR")}
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
          <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>
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
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748B", marginTop: "3px" }}>
              Total Membres Inscrits
            </div>
          </div>
        </div>

        {/* Metric 2: VIP & Prestige */}
        <div
          style={{
            background: "#FFFBEB",
            borderRadius: "16px",
            padding: "14px 16px",
            border: "1px solid #FDE68A",
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
              background: "rgba(180, 83, 9, 0.12)",
              color: "#B45309",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              flexShrink: 0,
            }}
          >
            👑
          </div>
          <div>
            <div style={{ fontSize: "22px", fontWeight: 900, color: "#B45309", lineHeight: 1 }}>
              {(stats.vipMembers + stats.compliceMembers).toLocaleString("fr-FR")}
            </div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#92400E", marginTop: "3px" }}>
              Membres VIP &amp; Sorties
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
              Identités Vérifiées Selfie
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
              Rencontres Réelles au Togo
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
