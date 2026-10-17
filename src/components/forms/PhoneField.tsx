"use client";
// Champ téléphone international : drapeau + indicatif du pays, puis le numéro.
// Valeur complète au format « +33 6 12 34 56 78 ».

import { useEffect, useState } from "react";
import { COUNTRIES, countryFromPhone } from "@/lib/countries";
import CountryPicker from "./CountryPicker";

export default function PhoneField({
  value,
  onChange,
  defaultCountry,
  id,
  placeholder = "Numéro de téléphone",
}: {
  value: string;
  onChange: (full: string) => void;
  /** Pays proposé quand le numéro est vide (pays de résidence) */
  defaultCountry?: string | null;
  id?: string;
  placeholder?: string;
}) {
  const parsed = value ? countryFromPhone(value) : null;
  const [iso, setIso] = useState<string>(parsed?.iso || defaultCountry || "FR");
  const dial = COUNTRIES.find((c) => c.iso === iso)?.dial || "";
  const number = parsed ? value.replace(/\s+/g, " ").slice(parsed.dial.length).trim() : value.replace(/^\+\d+\s*/, "");

  // Le pays de résidence change : on l'applique tant qu'aucun numéro n'est saisi
  useEffect(() => {
    if (!value && defaultCountry) setIso(defaultCountry);
  }, [defaultCountry, value]);

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "stretch", minWidth: 0 }}>
      <CountryPicker
        variant="flag"
        value={iso}
        onChange={(c) => {
          setIso(c.iso);
          onChange(number ? `${c.dial} ${number}` : "");
        }}
      />
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          minHeight: 48,
          borderRadius: 12,
          border: "1.5px solid #CBD5E1",
          background: "#fff",
          overflow: "hidden",
        }}
      >
        <span style={{ padding: "0 10px 0 12px", fontSize: 16, fontWeight: 800, color: "#0B2559", background: "#F1F5F9", alignSelf: "stretch", display: "flex", alignItems: "center", borderRight: "1.5px solid #E2E8F0" }}>
          {dial}
        </span>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        size={8}
        autoComplete="tel-national"
        placeholder={placeholder}
        value={number}
        onChange={(e) => {
          const n = e.target.value.replace(/[^\d\s]/g, "");
          onChange(n.trim() ? `${dial} ${n.trim()}` : "");
        }}
        style={{
          flex: 1,
          minWidth: 0,
          padding: "10px 12px",
          border: "none",
          outline: "none",
          fontSize: 16,
          fontWeight: 600,
          color: "#0F172A",
          background: "transparent",
        }}
      />
      </div>
    </div>
  );
}
