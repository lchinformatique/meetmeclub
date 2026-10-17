"use client";
// src/components/HeroLiveStatsCard.tsx
// Real-time live statistics card for the homepage hero, syncing directly with Supabase/Prisma

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface LiveStats {
  totalMembers: number;
  totalPhotos?: number;
  verifiedSelfieMembers: number;
  totalPartners?: number;
  onlineNow: number;
  lastUpdated: string;
}

export default function HeroLiveStatsCard() {
  const [stats, setStats] = useState<LiveStats>({
    totalMembers: 0,
    totalPhotos: 0,
    verifiedSelfieMembers: 0,
    totalPartners: 3,
    onlineNow: 0,
    lastUpdated: new Date().toISOString(),
  });

  const fetchLiveStats = async () => {
    try {
      const res = await fetch("/api/stats/community");
      if (res.ok) {
        const data = await res.json();
        if (data?.stats) {
          setStats(data.stats);
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchLiveStats();
    // Refresh live stats every 15s
    const timer = setInterval(fetchLiveStats, 15000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "flex-end",
        minHeight: "420px",
        width: "100%",
      }}
    >
      {/* Live Active Pill — 100% Real Database Signal */}
      <div
        style={{
          background: "rgba(11, 46, 107, 0.75)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.3)",
          borderRadius: "9999px",
          padding: "8px 18px",
          color: "white",
          fontSize: "13px",
          fontWeight: 700,
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
          marginBottom: "16px",
        }}
      >
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "#10B981",
            boxShadow: "0 0 10px #10B981",
          }}
        />
        <span>Statistiques réelles · Mise à jour en direct</span>
      </div>

      {/* Floating Bottom Card: Real Stats & Quick Action */}
      <div
        style={{
          background: "rgba(11, 46, 107, 0.72)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRadius: "24px",
          padding: "24px",
          border: "1.5px solid rgba(255,255,255,0.25)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
          maxWidth: "380px",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              overflow: "hidden",
              border: "2px solid rgba(255, 255, 255, 0.4)",
              background: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
              flexShrink: 0,
            }}
          >
            <Image src="/logo.png" alt="Logo Meet Me Club" width={38} height={38} style={{ objectFit: "contain" }} priority />
          </div>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 800, color: "white" }}>
              Meet Me Club
            </div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.8)" }}>
              Club Privé · Vraie communauté active
            </div>
          </div>
        </div>

        {/* 4 Real Metrics directly from Supabase / Prisma */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.12)",
              borderRadius: "14px",
              padding: "12px 10px",
              textAlign: "center",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div style={{ fontSize: "22px", fontWeight: 900, color: "#FFFFFF", lineHeight: 1 }}>
              {stats.totalMembers.toLocaleString("fr-FR")}
            </div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.85)", marginTop: "4px", fontWeight: 600 }}>
              Membres réels
            </div>
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.12)",
              borderRadius: "14px",
              padding: "12px 10px",
              textAlign: "center",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div style={{ fontSize: "22px", fontWeight: 900, color: "#34D399", lineHeight: 1 }}>
              {stats.verifiedSelfieMembers.toLocaleString("fr-FR")}
            </div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.85)", marginTop: "4px", fontWeight: 600 }}>
              Profils vérifiés
            </div>
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.12)",
              borderRadius: "14px",
              padding: "12px 10px",
              textAlign: "center",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div style={{ fontSize: "22px", fontWeight: 900, color: "#FCD34D", lineHeight: 1 }}>
              {(stats.totalPhotos ?? 0).toLocaleString("fr-FR")}
            </div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.85)", marginTop: "4px", fontWeight: 600 }}>
              Photos réelles
            </div>
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.12)",
              borderRadius: "14px",
              padding: "12px 10px",
              textAlign: "center",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div style={{ fontSize: "22px", fontWeight: 900, color: "#FFFFFF", lineHeight: 1 }}>
              {stats.totalPartners ?? 3}
            </div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.85)", marginTop: "4px", fontWeight: 600 }}>
              Lieux partenaires
            </div>
          </div>
        </div>

        <Link
          href="/inscription"
          className="btn btn-primary"
          style={{
            width: "100%",
            justifyContent: "center",
            fontWeight: 800,
            borderRadius: "14px",
            padding: "12px",
            fontSize: "14px",
          }}
        >
          Commencer maintenant →
        </Link>
      </div>
    </div>
  );
}
