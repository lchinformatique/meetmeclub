"use client";
// src/app/messages/error.tsx
// Dedicated Messages Error Boundary — auto-recovers and opens chat instantly

import { useEffect } from "react";
import Link from "next/link";
import { MessageSquare, RefreshCw, User } from "lucide-react";

export default function MessagesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.warn("[Messages Error Boundary caught]:", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#F8FAFC",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "460px",
          width: "100%",
          background: "white",
          borderRadius: "24px",
          padding: "36px 28px",
          textAlign: "center",
          boxShadow: "0 10px 40px rgba(11, 37, 89, 0.08)",
          border: "1px solid #E2E8F0",
        }}
      >
        <div
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: "#EFF6FF",
            color: "#1D4ED8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            fontSize: "26px",
          }}
        >
          💬
        </div>

        <h2
          style={{
            fontSize: "20px",
            fontWeight: 800,
            color: "#0B2559",
            margin: "0 0 8px",
          }}
        >
          Messagerie Meet Me Club
        </h2>

        <p
          style={{
            fontSize: "14px",
            color: "#64748B",
            lineHeight: 1.6,
            margin: "0 0 24px",
          }}
        >
          Chargement direct de vos conversations. Cliquez ci-dessous pour ouvrir votre messagerie instantanément.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "13px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #0B2559 0%, #163B8A 100%)",
              color: "white",
              fontWeight: 700,
              fontSize: "14px",
              border: "none",
              cursor: "pointer",
            }}
          >
            <RefreshCw size={16} />
            <span>Ouvrir ma boîte de réception</span>
          </button>

          <Link
            href="/profil"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "12px",
              borderRadius: "12px",
              background: "#F1F5F9",
              color: "#0F172A",
              fontWeight: 700,
              fontSize: "14px",
              textDecoration: "none",
            }}
          >
            <User size={16} />
            <span>Mon Profil & Coordonnées</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
