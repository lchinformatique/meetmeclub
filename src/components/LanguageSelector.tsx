"use client";
// src/components/LanguageSelector.tsx
// Visual Language Selector with Flags and dynamic auto-translation

import { useState, useEffect } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { LANGUAGES, SupportedLanguage, getLanguage, setLanguage, t } from "@/lib/i18n";

interface LanguageSelectorProps {
  variant?: "dropdown" | "pills" | "compact";
  onSelect?: (lang: SupportedLanguage) => void;
}

export default function LanguageSelector({ variant = "dropdown", onSelect }: LanguageSelectorProps) {
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>("fr");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setCurrentLang(getLanguage());

    const handleLangChange = (e: any) => {
      if (e.detail?.lang) {
        setCurrentLang(e.detail.lang);
      }
    };

    window.addEventListener("mmclub_lang_changed", handleLangChange);
    return () => window.removeEventListener("mmclub_lang_changed", handleLangChange);
  }, []);

  const handleChoose = (code: SupportedLanguage) => {
    setLanguage(code);
    setCurrentLang(code);
    setIsOpen(false);
    if (onSelect) onSelect(code);
  };

  const activeOption = LANGUAGES.find((l) => l.code === currentLang) || LANGUAGES[0];

  // Mode Pills (idéal pour la bannière d'installation ou modal de premier démarrage)
  if (variant === "pills") {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {LANGUAGES.map((l) => {
          const isSelected = l.code === currentLang;
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => handleChoose(l.code)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "100px",
                border: isSelected ? "2px solid #F59E0B" : "1px solid rgba(255, 255, 255, 0.2)",
                background: isSelected ? "rgba(245, 158, 11, 0.22)" : "rgba(255, 255, 255, 0.08)",
                color: "white",
                fontSize: "12px",
                fontWeight: isSelected ? 800 : 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <span>{l.flag}</span>
              <span>{l.nativeName}</span>
              {isSelected && <Check size={12} color="#F59E0B" />}
            </button>
          );
        })}
      </div>
    );
  }

  // Mode Compact (petit badge drapeau)
  if (variant === "compact") {
    return (
      <div style={{ position: "relative" }}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          title={t("chooseLanguage", currentLang)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "5px 8px",
            borderRadius: "8px",
            background: "rgba(11, 37, 89, 0.06)",
            border: "1px solid rgba(11, 37, 89, 0.12)",
            color: "#0B2559",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          <span style={{ fontSize: "14px" }}>{activeOption.flag}</span>
          <span style={{ textTransform: "uppercase" }}>{activeOption.code}</span>
        </button>

        {isOpen && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              right: 0,
              marginTop: "6px",
              background: "white",
              borderRadius: "12px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
              border: "1px solid #E2E8F0",
              zIndex: 100,
              minWidth: "150px",
              overflow: "hidden",
            }}
          >
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => handleChoose(l.code)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  background: l.code === currentLang ? "#EFF6FF" : "transparent",
                  border: "none",
                  borderBottom: "1px solid #F1F5F9",
                  cursor: "pointer",
                  fontSize: "13px",
                  color: "#0F172A",
                  fontWeight: l.code === currentLang ? 700 : 500,
                  textAlign: "left",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>{l.flag}</span>
                  <span>{l.nativeName}</span>
                </span>
                {l.code === currentLang && <Check size={14} color="#2563EB" />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Mode Dropdown classique
  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 12px",
          borderRadius: "100px",
          background: "white",
          border: "1px solid #E2E8F0",
          color: "#0B2559",
          fontSize: "13px",
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
        }}
      >
        <Globe size={14} color="#1D4ED8" />
        <span>{activeOption.flag}</span>
        <span>{activeOption.name}</span>
        <ChevronDown size={13} color="#64748B" />
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: "6px",
            background: "white",
            borderRadius: "14px",
            boxShadow: "0 10px 30px rgba(11,37,89,0.18)",
            border: "1px solid #E2E8F0",
            zIndex: 100,
            minWidth: "170px",
            padding: "4px",
          }}
        >
          {LANGUAGES.map((l) => {
            const isSelected = l.code === currentLang;
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => handleChoose(l.code)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "9px 12px",
                  background: isSelected ? "#EFF6FF" : "transparent",
                  borderRadius: "10px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "13px",
                  color: isSelected ? "#1D4ED8" : "#0F172A",
                  fontWeight: isSelected ? 800 : 500,
                  textAlign: "left",
                  transition: "background 0.15s ease",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "16px" }}>{l.flag}</span>
                  <span>{l.nativeName}</span>
                </span>
                {isSelected && <Check size={14} color="#1D4ED8" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
