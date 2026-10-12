"use client";
// src/components/SecurityProtectionProvider.tsx
// Anti-download, Anti-screenshot & Content Privacy Protection Provider

import { useEffect, useState } from "react";

export default function SecurityProtectionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [warning, setWarning] = useState<string | null>(null);
  const [screenShieldActive, setScreenShieldActive] = useState(false);

  useEffect(() => {
    // 1. Intercept and block right click context menu on images and profile containers
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "IMG" ||
        target.closest(".photo-thumb") ||
        target.closest(".profile-card") ||
        target.closest(".profile-photo") ||
        target.closest(".secure-shield") ||
        target.getAttribute("role") === "img"
      ) {
        e.preventDefault();
        showNotice("🔒 Protection Meet Me Club : Téléchargement et enregistrement d'images interdits.");
      }
    };

    // 2. Intercept and block image dragging
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "IMG") {
        e.preventDefault();
      }
    };

    // 3. Intercept screenshot and save keys
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen key
      if (e.key === "PrintScreen") {
        // Obscure screen immediately
        setScreenShieldActive(true);
        try {
          if (navigator.clipboard) {
            navigator.clipboard.writeText("Meet Me Club — Capture interdite.");
          }
        } catch {
          // ignore
        }
        showNotice("🔒 Capture d'écran désactivée pour la confidentialité des membres.");
        setTimeout(() => setScreenShieldActive(false), 900);
      }

      // Ctrl+S or Cmd+S (Save webpage)
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        showNotice("🔒 Enregistrement de page désactivé par sécurité.");
      }

      // Ctrl+P or Cmd+P (Print webpage)
      if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        showNotice("🔒 Impression de profil désactivée par mesure de discrétion.");
      }

      // F12 or Ctrl+Shift+I (DevTools inspector)
      if (
        e.key === "F12" ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "C" || e.key === "c")) ||
        ((e.ctrlKey || e.metaKey) && (e.key === "u" || e.key === "U"))
      ) {
        // Softly prevent source viewing of sensitive profile images
        if (e.target && (e.target as HTMLElement).tagName === "IMG") {
          e.preventDefault();
        }
      }
      // Windows + Shift + S or Mac Cmd + Shift + 4 / 3 (Snipping tool / Screenshot)
      if (
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        (e.key === "s" || e.key === "S" || e.key === "3" || e.key === "4")
      ) {
        setScreenShieldActive(true);
        showNotice("🔒 Capture d'écran désactivée pour protéger l'image des membres.");
        setTimeout(() => setScreenShieldActive(false), 900);
      }
    };

    // 4. Intercept window blur during potential snipping tool activation
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        setScreenShieldActive(true);
        setTimeout(() => setScreenShieldActive(false), 800);
      }
    };

    // 5. Intercept clipboard copy on protected elements
    const handleCopy = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target?.tagName === "IMG" ||
        target?.closest?.(".profile-card") ||
        target?.closest?.(".protected-content") ||
        target?.closest?.(".profile-photo")
      ) {
        e.preventDefault();
        showNotice("🔒 Copie d'informations ou de photos désactivée par mesure de discrétion.");
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    document.addEventListener("copy", handleCopy);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("copy", handleCopy);
    };
  }, []);

  const showNotice = (msg: string) => {
    setWarning(msg);
    setTimeout(() => {
      setWarning(null);
    }, 3500);
  };

  return (
    <>
      {children}

      {/* Screen Shield when Screenshot key is hit */}
      {screenShieldActive && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#071530",
            zIndex: 999999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            color: "white",
            textAlign: "center",
            padding: "20px",
          }}
        >
          <div style={{ fontSize: "60px", marginBottom: "16px" }}>🔒</div>
          <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "8px" }}>
            Protection Anti-Capture Meet Me Club
          </h2>
          <p style={{ fontSize: "15px", color: "#94A3B8", maxWidth: "460px" }}>
            Les images et profils des membres sont protégés par la politique de stricte confidentialité du club.
          </p>
        </div>
      )}

      {/* Floating security notice toast */}
      {warning && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(15, 23, 42, 0.95)",
            color: "white",
            padding: "12px 22px",
            borderRadius: "9999px",
            fontSize: "13px",
            fontWeight: 700,
            zIndex: 99999,
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            animation: "fadeInUp 0.2s ease-out",
            backdropFilter: "blur(8px)",
          }}
        >
          <span>🛡️</span>
          <span>{warning}</span>
        </div>
      )}
    </>
  );
}
