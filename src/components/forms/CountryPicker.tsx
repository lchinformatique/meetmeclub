"use client";
// Sélecteur de pays : vrai drapeau (image, lisible sur Windows, Mac, Android et iPhone),
// nom du pays et recherche. Variante « dial » pour le téléphone : drapeau + indicatif.

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { COUNTRIES, type Country } from "@/lib/countries";

export function Flag({ iso, size = 22 }: { iso: string; size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/${iso.toLowerCase()}.svg`}
      alt=""
      width={size}
      height={Math.round(size * 0.75)}
      loading="lazy"
      style={{ width: size, height: Math.round(size * 0.75), objectFit: "cover", borderRadius: 3, boxShadow: "0 0 0 1px rgba(15,23,42,0.12)", flexShrink: 0 }}
    />
  );
}

const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function CountryPicker({
  value,
  onChange,
  variant = "name",
  placeholder = "Choisir un pays",
  id,
}: {
  value: string | null | undefined;
  onChange: (country: Country) => void;
  /** name : drapeau + nom · dial : drapeau + indicatif · flag : drapeau seul (champ téléphone) */
  variant?: "name" | "dial" | "flag";
  placeholder?: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const boxRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const selected = COUNTRIES.find((c) => c.iso === value) || null;

  const list = useMemo(() => {
    const n = normalize(q.trim());
    if (!n) return COUNTRIES;
    return COUNTRIES.filter((c) => normalize(c.name).includes(n) || c.dial.includes(n.replace(/^\+?/, "+")) || c.iso.toLowerCase() === n);
  }, [q]);

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    const close = (e: MouseEvent | TouchEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div ref={boxRef} style={{ position: "relative", width: variant === "name" ? "100%" : "auto", flexShrink: 0 }}>
      <button
        id={id}
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setQ("");
        }}
        aria-haspopup="listbox"
        aria-label={variant === "flag" ? `Pays : ${selected?.name || "choisir"}` : undefined}
        aria-expanded={open}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          minHeight: 48,
          padding: "10px 12px",
          borderRadius: 12,
          border: "1.5px solid #CBD5E1",
          background: "#fff",
          color: "#0F172A",
          fontSize: 15,
          fontWeight: 600,
          cursor: "pointer",
          textAlign: "left",
          whiteSpace: "nowrap",
        }}
      >
        {selected ? <Flag iso={selected.iso} /> : null}
        {variant !== "flag" && (
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", color: selected ? "#0F172A" : "#94A3B8" }}>
            {selected ? (variant === "dial" ? selected.dial : selected.name) : variant === "dial" ? "+" : placeholder}
          </span>
        )}
        {variant === "flag" && !selected && <span style={{ color: "#94A3B8" }}>Pays</span>}
        <ChevronDown size={16} color="#64748B" />
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            zIndex: 60,
            top: "calc(100% + 6px)",
            left: 0,
            width: "min(320px, calc(100vw - 32px))",
            background: "#fff",
            borderRadius: 14,
            boxShadow: "0 18px 40px rgba(15,23,42,0.22)",
            border: "1px solid #E2E8F0",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderBottom: "1px solid #E2E8F0" }}>
            <Search size={16} color="#64748B" />
            <input
              ref={searchRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un pays ou un indicatif"
              style={{ flex: 1, border: "none", outline: "none", fontSize: 16, minWidth: 0, background: "transparent" }}
            />
          </div>
          <div style={{ maxHeight: 280, overflowY: "auto", overscrollBehavior: "contain" }}>
            {list.length === 0 && <div style={{ padding: 14, fontSize: 14, color: "#64748B" }}>Aucun pays trouvé</div>}
            {list.map((c) => (
              <button
                key={c.iso}
                type="button"
                role="option"
                aria-selected={c.iso === value}
                onClick={() => {
                  onChange(c);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "10px 12px",
                  border: "none",
                  background: c.iso === value ? "#EFF6FF" : "#fff",
                  cursor: "pointer",
                  fontSize: 15,
                  color: "#0F172A",
                  textAlign: "left",
                }}
              >
                <Flag iso={c.iso} />
                <span style={{ flex: 1 }}>{c.name}</span>
                <span style={{ color: "#64748B", fontSize: 13 }}>{c.dial}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
