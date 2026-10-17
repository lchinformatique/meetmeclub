"use client";
// Date de naissance en trois listes (jour, mois, année) : plus simple qu'un calendrier,
// surtout sur téléphone. Valeur au format AAAA-MM-JJ ("" tant que la date est incomplète).

import { useEffect, useState } from "react";

const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

const pad = (n: number) => String(n).padStart(2, "0");

export default function BirthDateField({
  value,
  onChange,
  invalid,
  idPrefix = "dob",
  minAge = 18,
}: {
  value: string;
  onChange: (iso: string) => void;
  invalid?: boolean;
  idPrefix?: string;
  minAge?: number;
}) {
  const [y0, m0, d0] = (value || "").split("-");
  const [day, setDay] = useState(d0 ? String(Number(d0)) : "");
  const [month, setMonth] = useState(m0 ? String(Number(m0)) : "");
  const [year, setYear] = useState(y0 || "");

  // Valeur chargée plus tard (profil existant)
  useEffect(() => {
    if (!value) return;
    const [y, m, d] = value.split("-");
    setYear(y || "");
    setMonth(m ? String(Number(m)) : "");
    setDay(d ? String(Number(d)) : "");
  }, [value]);

  const maxYear = new Date().getFullYear() - minAge;
  const years = Array.from({ length: maxYear - 1930 + 1 }, (_, i) => maxYear - i);
  const daysInMonth = year && month ? new Date(Number(year), Number(month), 0).getDate() : 31;

  function emit(d: string, m: string, y: string) {
    if (d && m && y) {
      const dd = Math.min(Number(d), new Date(Number(y), Number(m), 0).getDate());
      onChange(`${y}-${pad(Number(m))}-${pad(dd)}`);
    } else {
      onChange("");
    }
  }

  const select: React.CSSProperties = {
    width: "100%",
    minWidth: 0,
    minHeight: 48,
    padding: "10px 8px",
    borderRadius: 12,
    border: `1.5px solid ${invalid ? "#DC2626" : "#CBD5E1"}`,
    background: "#fff",
    fontSize: 16,
    fontWeight: 600,
    color: "#0F172A",
    cursor: "pointer",
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "0.8fr 1.4fr 1fr", gap: 8 }}>
      <select
        id={`${idPrefix}-day`}
        aria-label="Jour de naissance"
        value={day}
        onChange={(e) => {
          setDay(e.target.value);
          emit(e.target.value, month, year);
        }}
        style={select}
      >
        <option value="">Jour</option>
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
      <select
        id={`${idPrefix}-month`}
        aria-label="Mois de naissance"
        value={month}
        onChange={(e) => {
          setMonth(e.target.value);
          emit(day, e.target.value, year);
        }}
        style={select}
      >
        <option value="">Mois</option>
        {MONTHS.map((m, i) => (
          <option key={m} value={i + 1}>
            {m}
          </option>
        ))}
      </select>
      <select
        id={`${idPrefix}-year`}
        aria-label="Année de naissance"
        value={year}
        onChange={(e) => {
          setYear(e.target.value);
          emit(day, month, e.target.value);
        }}
        style={select}
      >
        <option value="">Année</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
