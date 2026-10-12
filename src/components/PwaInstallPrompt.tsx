"use client";
// src/components/PwaInstallPrompt.tsx
// Guide d'installation de l'application Meet Me Club sur écran d'accueil (iOS iPhone & Android)

import { useState, useEffect } from "react";
import Image from "next/image";

export default function PwaInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // 1. Ne rien afficher si l'utilisateur est déjà en mode PWA standalone (déjà installé)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) return;

    // 2. Vérifier si l'utilisateur a fermé la bannière récemment (stocké 7 jours)
    const dismissedTime = localStorage.getItem("mmc_pwa_dismissed");
    if (dismissedTime && Date.now() - parseInt(dismissedTime, 10) < 7 * 24 * 60 * 60 * 1000) {
      return;
    }

    // 3. Détection iOS / iPhone / iPad
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // 4. Écouteur pour Android / Chrome
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Sur iOS, afficher la bannière après un court délai pour laisser l'utilisateur explorer
    if (isIosDevice) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("mmc_pwa_dismissed", Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
        left: "14px",
        right: "14px",
        maxWidth: "460px",
        margin: "0 auto",
        background: "rgba(11, 37, 89, 0.98)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        color: "white",
        borderRadius: "20px",
        padding: "16px 18px",
        boxShadow: "0 14px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.15)",
        zIndex: 9998,
        animation: "fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
        {/* Icône officielle de l'application Meet Me Club */}
        <div
          style={{
            width: "50px",
            height: "50px",
            borderRadius: "14px",
            overflow: "hidden",
            background: "white",
            padding: "3px",
            flexShrink: 0,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
            border: "2px solid #E10600",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Image
            src="/apple-touch-icon.png"
            alt="Icône Meet Me Club"
            width={44}
            height={44}
            style={{ objectFit: "contain", borderRadius: "10px" }}
          />
        </div>

        {/* Contenu et instructions */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
            <h4 style={{ fontSize: "15px", fontWeight: 800, color: "white", margin: 0 }}>
              Installer l&apos;application
            </h4>
            <button
              onClick={handleDismiss}
              aria-label="Fermer"
              style={{
                background: "rgba(255, 255, 255, 0.15)",
                border: "none",
                color: "white",
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                padding: 0,
              }}
            >
              ✕
            </button>
          </div>

          <p style={{ fontSize: "12.5px", color: "rgba(255, 255, 255, 0.85)", margin: "0 0 12px 0", lineHeight: 1.4 }}>
            Ajoutez <strong>Meet Me Club</strong> sur votre écran d&apos;accueil pour y accéder en 1 clic comme une vraie application.
          </p>

          {isIos ? (
            /* Instructions pas-à-pas pour iPhone / Safari */
            <div
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                borderRadius: "12px",
                padding: "10px 12px",
                fontSize: "11.5px",
                lineHeight: 1.5,
                border: "1px solid rgba(255, 255, 255, 0.12)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <span>1. Appuyez sur</span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(255, 255, 255, 0.2)",
                    borderRadius: "6px",
                    padding: "2px 6px",
                    fontWeight: 700,
                  }}
                >
                  Partager
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: "4px" }}>
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                </span>
                <span>en bas de Safari</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span>2. Puis sélectionnez</span>
                <strong style={{ color: "#F59E0B" }}>« Sur l&apos;écran d&apos;accueil » ➕</strong>
              </div>
            </div>
          ) : (
            /* Bouton direct pour Android / Chrome */
            <button
              onClick={handleInstallClick}
              style={{
                background: "linear-gradient(135deg, #E10600 0%, #B30500 100%)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(225, 6, 0, 0.35)",
              }}
            >
              Ajouter à l&apos;écran d&apos;accueil
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
