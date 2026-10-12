"use client";
// src/components/CustomerSupportWidget.tsx
// Assistant WhatsApp Officiel Meet Me Club (+228 90 28 35 80)
// Bouton flottant avec icône de chat professionnelle et lien direct de discussion

import { useState } from "react";

const WHATSAPP_PHONE = "22890283580";
const DEFAULT_MESSAGE = "Bonjour Meet Me Club, je souhaite continuer la discussion.";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`;

export default function CustomerSupportWidget() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <aside
      className="customer-support-widget-root"
      style={{
        position: "fixed",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        flexDirection: "row-reverse",
        gap: "12px",
        pointerEvents: "none",
      }}
      aria-label="Assistant WhatsApp Meet Me Club"
    >
      {/* ── Bouton d'action WhatsApp avec icône de Chat ── */}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Rejoindre l'Assistant WhatsApp Meet Me Club au 0022890283580"
        title="Assistant WhatsApp Meet Me Club · 0022890283580"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="whatsapp-chat-btn-pulse"
        style={{
          pointerEvents: "auto",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 8px 24px rgba(37, 211, 102, 0.45)",
          textDecoration: "none",
          position: "relative",
          transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease",
          transform: isHovered ? "scale(1.08)" : "scale(1)",
          flexShrink: 0,
        }}
      >
        {/* Icône de Chat professionnelle (bulle de discussion stylisée avec indicateur) */}
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))" }}
          aria-hidden="true"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          <circle cx="8.5" cy="12" r="1.1" fill="currentColor" />
          <circle cx="12" cy="12" r="1.1" fill="currentColor" />
          <circle cx="15.5" cy="12" r="1.1" fill="currentColor" />
        </svg>

        {/* Indicateur vert En Ligne */}
        <span
          style={{
            position: "absolute",
            top: "2px",
            right: "2px",
            width: "14px",
            height: "14px",
            borderRadius: "50%",
            background: "#10B981",
            border: "2.5px solid white",
            boxShadow: "0 0 6px rgba(16, 185, 129, 0.8)",
          }}
          aria-hidden="true"
        />
      </a>

      {/* ── Badge / Tooltip flottant au survol ou sur grand écran ── */}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          pointerEvents: "auto",
          background: "white",
          borderRadius: "16px",
          padding: "8px 14px",
          boxShadow: "0 8px 24px rgba(7, 21, 48, 0.16)",
          border: "1px solid #E2E8F0",
          textDecoration: "none",
          display: isHovered ? "flex" : "none",
          flexDirection: "column",
          gap: "2px",
          alignItems: "flex-end",
          whiteSpace: "nowrap",
          transition: "opacity 0.2s ease, transform 0.2s ease",
          animation: "fadeIn 0.2s ease-out",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "12px", fontWeight: 800, color: "#0F172A" }}>
            Assistant WhatsApp
          </span>
          <span
            style={{
              display: "inline-block",
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: "#10B981",
            }}
          />
        </div>
        <span style={{ fontSize: "11px", color: "#166534", fontWeight: 700 }}>
          Continuer la discussion · +228 90 28 35 80
        </span>
      </a>
    </aside>
  );
}
