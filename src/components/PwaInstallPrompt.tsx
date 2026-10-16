"use client";
// src/components/PwaInstallPrompt.tsx
// Invitation simple à installer l'application (téléphones uniquement).
// - Jamais affichée si l'application est déjà installée ou ouverte depuis l'écran d'accueil
// - Android : vrai bouton « Installer » (invite native du navigateur)
// - iPhone (Safari) : une ligne d'explication « Partager › Sur l'écran d'accueil »
// - Fermée = plus affichée pendant 30 jours ; installée = plus jamais

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Download, Share, X } from "lucide-react";

const DISMISS_KEY = "mmc_pwa_dismissed";
const INSTALLED_KEY = "mmc_pwa_installed";

function isInstalled() {
  try {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      (window.navigator as any).standalone === true ||
      localStorage.getItem(INSTALLED_KEY) === "1"
    );
  } catch {
    return false;
  }
}

export default function PwaInstallPrompt() {
  const pathname = usePathname();
  const [mode, setMode] = useState<"android" | "ios" | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Ouverte depuis l'écran d'accueil : on retient qu'elle est installée
    try {
      if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true) {
        localStorage.setItem(INSTALLED_KEY, "1");
      }
    } catch {}
    if (isInstalled()) return;

    let dismissedRecently = false;
    try {
      const t = Number(localStorage.getItem(DISMISS_KEY) || 0);
      dismissedRecently = Date.now() - t < 30 * 24 * 3600 * 1000;
    } catch {}
    if (dismissedRecently) return;

    const ua = navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua);
    // Safari seulement (les navigateurs intégrés de Facebook/Instagram ne savent pas installer)
    const isIosSafari = isIos && /safari/.test(ua) && !/crios|fxios|fbav|instagram|line/.test(ua);
    const isMobile = isIos || /android/.test(ua);
    if (!isMobile) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setMode("android"), 3000);
    };
    const onInstalled = () => {
      try {
        localStorage.setItem(INSTALLED_KEY, "1");
      } catch {}
      setMode(null);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    const timer = isIosSafari ? setTimeout(() => setMode("ios"), 4000) : undefined;

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const dismiss = () => {
    setMode(null);
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch {}
  };

  const install = async () => {
    if (!deferredPrompt) return dismiss();
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice.catch(() => ({ outcome: "dismissed" }));
    setDeferredPrompt(null);
    if (outcome === "accepted") {
      try {
        localStorage.setItem(INSTALLED_KEY, "1");
      } catch {}
      setMode(null);
    } else {
      dismiss();
    }
  };

  // Pas pendant l'inscription, la connexion ou une conversation
  const hiddenHere =
    pathname?.startsWith("/messages") ||
    pathname?.startsWith("/connexion") ||
    pathname?.startsWith("/inscription") ||
    pathname?.startsWith("/auth") ||
    pathname?.startsWith("/onboarding");

  if (!mode || hiddenHere) return null;

  return (
    <div
      role="dialog"
      aria-label="Installer l'application Meet Me Club"
      style={{
        position: "fixed",
        left: 12,
        right: 12,
        bottom: "calc(74px + env(safe-area-inset-bottom, 0px))",
        maxWidth: 440,
        margin: "0 auto",
        zIndex: 3900,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 12px 12px 14px",
        borderRadius: 18,
        background: "#fff",
        boxShadow: "0 16px 40px rgba(11,37,89,0.22), 0 0 0 1px #E2E8F0",
        animation: "fadeInUp 0.3s ease",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/apple-touch-icon.png"
        alt=""
        width={44}
        height={44}
        style={{ borderRadius: 12, flexShrink: 0, boxShadow: "0 2px 8px rgba(11,37,89,0.15)" }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#0B2559" }}>Installer Meet Me Club</div>
        {mode === "ios" ? (
          <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.4, marginTop: 2 }}>
            Touchez <Share size={13} style={{ verticalAlign: "-2px", color: "#2563EB" }} /> puis{" "}
            <strong>« Sur l&apos;écran d&apos;accueil »</strong>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>Accès direct depuis votre écran d&apos;accueil</div>
        )}
      </div>
      {mode === "android" && (
        <button
          type="button"
          onClick={install}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            height: 40,
            padding: "0 14px",
            border: "none",
            borderRadius: 12,
            background: "linear-gradient(135deg, #E10600 0%, #B30500 100%)",
            color: "#fff",
            fontWeight: 800,
            fontSize: 13,
            flexShrink: 0,
            cursor: "pointer",
          }}
        >
          <Download size={16} /> Installer
        </button>
      )}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Fermer"
        style={{
          width: 32,
          height: 32,
          border: "none",
          borderRadius: "50%",
          background: "#F1F5F9",
          color: "#64748B",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          cursor: "pointer",
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
