"use client";
// src/app/error.tsx
// Global Error Boundary — prevents "This page couldn't load" and auto-recovers seamlessly

import { useEffect } from "react";
import Link from "next/link";
import { MessageSquare, RefreshCw, Home, User } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.warn("[App Error Boundary caught]:", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "linear-gradient(135deg, #0B2559 0%, #163B8A 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "480px",
          width: "100%",
          background: "white",
          borderRadius: "24px",
          padding: "36px 28px",
          textAlign: "center",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.25)",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "#EEF2FB",
            color: "#0B2559",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            fontSize: "28px",
          }}
        >
          ✨
        </div>

        <h1
          style={{
            fontSize: "22px",
            fontWeight: 800,
            color: "#0B2559",
            margin: "0 0 8px",
          }}
        >
          Meet Me Club Lomé
        </h1>

        <p
          style={{
            fontSize: "14px",
            color: "#64748B",
            lineHeight: 1.6,
            margin: "0 0 24px",
          }}
        >
          Votre session est active. Nous actualisons la page pour afficher vos messages et votre espace membre en direct.
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
              padding: "14px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #0B2559 0%, #163B8A 100%)",
              color: "white",
              fontWeight: 700,
              fontSize: "14px",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(11, 37, 89, 0.25)",
            }}
          >
            <RefreshCw size={16} />
            <span>Actualiser immédiatement</span>
          </button>

          <Link
            href="/messages"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "13px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #E10600 0%, #B30500 100%)",
              color: "white",
              fontWeight: 700,
              fontSize: "14px",
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(225, 6, 0, 0.25)",
            }}
          >
            <MessageSquare size={16} />
            <span>Accéder à mes Messages 💬</span>
          </Link>

          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
            <Link
              href="/profil"
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "11px",
                borderRadius: "12px",
                background: "#F1F5F9",
                color: "#0F172A",
                fontWeight: 600,
                fontSize: "13px",
                textDecoration: "none",
              }}
            >
              <User size={15} />
              <span>Mon Profil</span>
            </Link>

            <Link
              href="/"
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "11px",
                borderRadius: "12px",
                background: "#F1F5F9",
                color: "#0F172A",
                fontWeight: 600,
                fontSize: "13px",
                textDecoration: "none",
              }}
            >
              <Home size={15} />
              <span>Accueil</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
