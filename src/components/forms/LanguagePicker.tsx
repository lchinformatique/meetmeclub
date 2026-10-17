"use client";
// Langues parlées : toutes les langues proposées sous forme de pastilles à toucher
// (une touche = ajoutée, une seconde = retirée), avec recherche.

import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { Flag } from "./CountryPicker";

/** code : enregistré sur le profil · iso : pays du drapeau affiché */
export const LANGUAGES: Array<{ code: string; label: string; iso: string }> = [
  { code: "fr", label: "Français", iso: "FR" },
  { code: "en", label: "Anglais", iso: "GB" },
  { code: "es", label: "Espagnol", iso: "ES" },
  { code: "pt", label: "Portugais", iso: "PT" },
  { code: "de", label: "Allemand", iso: "DE" },
  { code: "it", label: "Italien", iso: "IT" },
  { code: "nl", label: "Néerlandais", iso: "NL" },
  { code: "ar", label: "Arabe", iso: "SA" },
  { code: "zh", label: "Chinois (mandarin)", iso: "CN" },
  { code: "ja", label: "Japonais", iso: "JP" },
  { code: "ko", label: "Coréen", iso: "KR" },
  { code: "hi", label: "Hindi", iso: "IN" },
  { code: "ru", label: "Russe", iso: "RU" },
  { code: "tr", label: "Turc", iso: "TR" },
  { code: "pl", label: "Polonais", iso: "PL" },
  { code: "ro", label: "Roumain", iso: "RO" },
  { code: "el", label: "Grec", iso: "GR" },
  { code: "sw", label: "Swahili", iso: "KE" },
  { code: "ee", label: "Éwé / Mina", iso: "TG" },
  { code: "kab", label: "Kabiyè", iso: "TG" },
  { code: "fon", label: "Fon", iso: "BJ" },
  { code: "yo", label: "Yoruba", iso: "NG" },
  { code: "ha", label: "Haoussa", iso: "NG" },
  { code: "ig", label: "Igbo", iso: "NG" },
  { code: "tw", label: "Twi (akan)", iso: "GH" },
  { code: "wo", label: "Wolof", iso: "SN" },
  { code: "bm", label: "Bambara", iso: "ML" },
  { code: "ff", label: "Peul (fulfulde)", iso: "SN" },
  { code: "ln", label: "Lingala", iso: "CD" },
  { code: "am", label: "Amharique", iso: "ET" },
  { code: "zu", label: "Zoulou", iso: "ZA" },
  { code: "ber", label: "Berbère (tamazight)", iso: "MA" },
  { code: "ht", label: "Créole haïtien", iso: "HT" },
];

const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function LanguagePicker({ value, onChange }: { value: string[]; onChange: (codes: string[]) => void }) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const n = normalize(q.trim());
    return n ? LANGUAGES.filter((l) => normalize(l.label).includes(n)) : LANGUAGES;
  }, [q]);

  const toggle = (code: string) => onChange(value.includes(code) ? value.filter((c) => c !== code) : [...value, code]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1.5px solid #CBD5E1", borderRadius: 12, padding: "0 12px", minHeight: 44, background: "#fff", marginBottom: 10 }}>
        <Search size={16} color="#64748B" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher une langue"
          aria-label="Rechercher une langue"
          style={{ flex: 1, minWidth: 0, border: "none", outline: "none", fontSize: 15, background: "transparent" }}
        />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, maxHeight: 220, overflowY: "auto", padding: 2 }}>
        {list.map((l) => {
          const on = value.includes(l.code);
          return (
            <button
              key={l.code}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(l.code)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "7px 12px",
                borderRadius: 999,
                border: `1.5px solid ${on ? "#2563EB" : "#E2E8F0"}`,
                background: on ? "#EFF6FF" : "#fff",
                color: on ? "#1E40AF" : "#334155",
                fontSize: 14,
                fontWeight: on ? 800 : 600,
                cursor: "pointer",
              }}
            >
              <Flag iso={l.iso} size={18} />
              {l.label}
              {on && <Check size={14} />}
            </button>
          );
        })}
      </div>
      <p style={{ margin: "8px 0 0", fontSize: 12, color: "#64748B" }}>
        {value.length ? `${value.length} langue${value.length > 1 ? "s" : ""} choisie${value.length > 1 ? "s" : ""}` : "Touchez les langues que vous parlez."}
      </p>
    </div>
  );
}
