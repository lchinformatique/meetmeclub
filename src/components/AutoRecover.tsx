"use client";
// src/components/AutoRecover.tsx
// Récupération automatique et invisible après une erreur d'affichage
// (cas typique : application ouverte depuis une notification avec une ancienne version en mémoire).
// 1re erreur → rechargement complet ; erreur juste après → nouvel essai ; sinon → page sûre.

import { useEffect } from "react";

const KEY = "mmc_recover_attempts";

export default function AutoRecover({
  error,
  reset,
  fallback = "/profil",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  fallback?: string;
}) {
  useEffect(() => {
    console.warn("[AutoRecover]", error);
    let attempts: number[] = [];
    try {
      attempts = JSON.parse(sessionStorage.getItem(KEY) || "[]").filter((t: number) => Date.now() - t < 20_000);
    } catch {}
    attempts.push(Date.now());
    try {
      sessionStorage.setItem(KEY, JSON.stringify(attempts));
    } catch {}

    if (attempts.length === 1) {
      window.location.reload();
    } else if (attempts.length === 2) {
      reset();
    } else {
      const target = window.location.pathname === fallback ? "/" : fallback;
      try {
        sessionStorage.removeItem(KEY);
      } catch {}
      window.location.replace(target);
    }
  }, [error, reset, fallback]);

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
        background: "linear-gradient(135deg, #071530 0%, #0B2559 60%, #163B8A 100%)",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-icon.png"
        alt="Meet Me Club"
        width={84}
        height={84}
        style={{ borderRadius: "50%", background: "#fff", padding: 8, boxShadow: "0 12px 40px rgba(0,0,0,0.3)" }}
      />
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          border: "3px solid rgba(255,255,255,0.25)",
          borderTopColor: "#fff",
          animation: "mmc-spin 0.8s linear infinite",
        }}
      />
      <style>{`@keyframes mmc-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
