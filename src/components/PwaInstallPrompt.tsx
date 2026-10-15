"use client";
// src/components/PwaInstallPrompt.tsx
// International Multilingual PWA Installation & Language Setup (iOS Safari & Android & Desktop)

import { useState, useEffect } from "react";
import Image from "next/image";
import { Globe, Sparkles } from "lucide-react";
import LanguageSelector from "./LanguageSelector";
import { SupportedLanguage, getLanguage, setLanguage, t, LANGUAGES } from "@/lib/i18n";

export default function PwaInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>("fr");

  useEffect(() => {
    setCurrentLang(getLanguage());

    const handleLangChange = (e: any) => {
      if (e.detail?.lang) {
        setCurrentLang(e.detail.lang);
      }
    };
    window.addEventListener("mmclub_lang_changed", handleLangChange);

    // 1. Détection mode PWA standalone (déjà installé)
    const isStandalone =
      typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true);

    // 2. Vérifier si l'utilisateur a fermé la bannière récemment (stocké 7 jours)
    const dismissedTime = localStorage.getItem("mmc_pwa_dismissed");
    const isDismissed =
      dismissedTime && Date.now() - parseInt(dismissedTime, 10) < 7 * 24 * 60 * 60 * 1000;

    // Si déjà installé et dismissed, ne pas afficher
    if (isStandalone && isDismissed) {
      return () => window.removeEventListener("mmclub_lang_changed", handleLangChange);
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

    // Afficher sur iOS ou premier démarrage après 1.2s
    const timer = setTimeout(() => {
      if (!isDismissed) {
        setShowPrompt(true);
      }
    }, 1200);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("mmclub_lang_changed", handleLangChange);
      clearTimeout(timer);
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
        bottom: "calc(76px + env(safe-area-inset-bottom, 0px))",
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 24px)",
        maxWidth: "460px",
        background: "#FFFFFF",
        color: "#0B2559",
        borderRadius: "22px",
        padding: "16px 18px",
        boxShadow: "0 20px 50px rgba(11, 37, 89, 0.22), 0 0 0 1.5px #E2E8F0",
        zIndex: 9998,
        animation: "fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* ── 1. Sélecteur de Langue International Direct ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
          paddingBottom: "10px",
          borderBottom: "1px solid #E2E8F0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Globe size={16} color="#E10600" />
          <span style={{ fontSize: "12px", fontWeight: 800, color: "#0B2559", letterSpacing: "0.3px" }}>
            {t("chooseLanguage", currentLang)}
          </span>
        </div>
        <button
          onClick={handleDismiss}
          aria-label={t("close", currentLang)}
          style={{
            background: "#F1F5F9",
            border: "1px solid #CBD5E1",
            color: "#475569",
            width: "26px",
            height: "26px",
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: 800,
            padding: 0,
          }}
        >
          ✕
        </button>
      </div>

      {/* Boutons de langues avec drapeaux sur fond blanc */}
      <div style={{ marginBottom: "14px" }}>
        <LanguageSelector variant="pills" theme="light" />
      </div>

      {/* ── 2. Instructions d'installation ── */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
        {/* Logo App */}
        <div
          style={{
            width: "50px",
            height: "50px",
            borderRadius: "14px",
            overflow: "hidden",
            background: "#FFFFFF",
            padding: "2px",
            flexShrink: 0,
            boxShadow: "0 4px 12px rgba(11, 37, 89, 0.12)",
            border: "2px solid #E10600",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Image
            src="/apple-touch-icon.png"
            alt="Meet Me Club"
            width={44}
            height={44}
            style={{ objectFit: "contain", borderRadius: "10px" }}
          />
        </div>

        {/* Textes & CTA */}
        <div style={{ flex: 1 }}>
          <h4 style={{ fontSize: "15px", fontWeight: 800, color: "#0B2559", margin: "0 0 3px 0" }}>
            {t("installApp", currentLang)}
          </h4>

          <p
            style={{
              fontSize: "12px",
              color: "#475569",
              margin: "0 0 10px 0",
              lineHeight: 1.4,
            }}
          >
            {t("installDesc", currentLang)}
          </p>

          {isIos ? (
            /* Guide pas-à-pas iOS Safari */
            <div
              style={{
                background: "#F8FAFC",
                borderRadius: "12px",
                padding: "8px 12px",
                fontSize: "11.5px",
                lineHeight: 1.5,
                border: "1px solid #E2E8F0",
                color: "#334155",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                <span>{t("iosStep1", currentLang)}</span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "#EEF2FF",
                    border: "1px solid #C7D2FE",
                    color: "#4338CA",
                    borderRadius: "6px",
                    padding: "2px 6px",
                    fontWeight: 700,
                  }}
                >
                  {t("iosShare", currentLang)}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                </span>
                <span>{t("iosInSafari", currentLang)}</span>
              </div>
              <div>
                <span>{t("iosStep2", currentLang)} </span>
                <strong style={{ color: "#E10600" }}>{t("iosAddToHome", currentLang)}</strong>
              </div>
            </div>
          ) : (
            /* Bouton Android / Chrome */
            <button
              onClick={handleInstallClick}
              style={{
                background: "linear-gradient(135deg, #E10600 0%, #B30500 100%)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                padding: "9px 18px",
                fontSize: "13px",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(225, 6, 0, 0.32)",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Sparkles size={14} />
              <span>{t("installButton", currentLang)}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
