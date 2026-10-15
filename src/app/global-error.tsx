"use client";
// src/app/global-error.tsx
// Root-level global error boundary — replaces Next.js default "This page couldn't load"
// with a branded, professional MeetMe Club recovery page.

import { useEffect } from "react";
import Image from "next/image";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.warn("[MeetMeClub Global Error Boundary]:", error);
  }, [error]);

  return (
    <html lang="fr">
      <head>
        <title>Meet Me Club — Chargement sécurisé</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
        <link rel="icon" href="/logo.png" />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #071530 0%, #0B2559 60%, #163B8A 100%)",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          color: "#0F172A",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            maxWidth: "460px",
            width: "90%",
            background: "white",
            borderRadius: "24px",
            padding: "36px 28px",
            textAlign: "center",
            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.35)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          {/* Logo MeetMe Club */}
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "#F8FAFC",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              padding: "8px",
              boxShadow: "0 4px 16px rgba(11, 37, 89, 0.12)",
              border: "2px solid #E2E8F0",
              overflow: "hidden",
            }}
          >
            <Image
              src="/logo.png"
              alt="Meet Me Club"
              width={56}
              height={56}
              style={{ objectFit: "contain" }}
              priority
            />
          </div>

          <h1
            style={{
              fontSize: "20px",
              fontWeight: 800,
              color: "#0B2559",
              margin: "0 0 8px",
              letterSpacing: "-0.3px",
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
            Votre session et vos échanges sont préservés. Cliquez ci-dessous pour actualiser et continuer votre navigation.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.reload();
                } else {
                  reset();
                }
              }}
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
              <span>Actualiser la page</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.href = "/messages";
                }
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "13px",
                borderRadius: "14px",
                background: "#EFF6FF",
                color: "#1D4ED8",
                fontWeight: 700,
                fontSize: "14px",
                border: "1.5px solid #BFDBFE",
                cursor: "pointer",
              }}
            >
              <span>Accéder à mes Messages 💬</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.href = "/profil";
                }
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "12px",
                borderRadius: "12px",
                background: "#F8FAFC",
                color: "#475569",
                fontWeight: 600,
                fontSize: "13px",
                border: "1px solid #E2E8F0",
                cursor: "pointer",
              }}
            >
              <span>Mon Profil</span>
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
