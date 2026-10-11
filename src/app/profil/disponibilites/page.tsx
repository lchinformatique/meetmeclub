"use client";
// src/app/profil/disponibilites/page.tsx
// Manage weekly availabilities for dates

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface AvailabilityItem {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

const DAYS = [
  { id: 1, label: "Lundi" },
  { id: 2, label: "Mardi" },
  { id: 3, label: "Mercredi" },
  { id: 4, label: "Jeudi" },
  { id: 5, label: "Vendredi" },
  { id: 6, label: "Samedi" },
  { id: 0, label: "Dimanche" },
];

export default function ProfilDisponibilitesPage() {
  const router = useRouter();
  const [availabilities, setAvailabilities] = useState<AvailabilityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/profiles/me/availabilities");
        if (res.status === 401) {
          router.push("/connexion");
          return;
        }
        const data = await res.json();
        if (data.availabilities) {
          setAvailabilities(data.availabilities);
        }
      } catch {
        setMessage({ type: "error", text: "Impossible de charger les disponibilités." });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  function toggleDay(day: number) {
    setAvailabilities((prev) => {
      const exists = prev.some((a) => a.dayOfWeek === day);
      if (exists) {
        return prev.filter((a) => a.dayOfWeek !== day);
      } else {
        return [...prev, { dayOfWeek: day, startTime: "14:00", endTime: "20:00" }].sort(
          (a, b) => a.dayOfWeek - b.dayOfWeek
        );
      }
    });
  }

  function updateTime(day: number, field: "startTime" | "endTime", value: string) {
    setAvailabilities((prev) =>
      prev.map((a) => (a.dayOfWeek === day ? { ...a, [field]: value } : a))
    );
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/profiles/me/availabilities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availabilities }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Erreur de sauvegarde." });
        return;
      }
      setMessage({ type: "success", text: "Disponibilités enregistrées avec succès !" });
      setTimeout(() => {
        router.push("/profil");
      }, 1000);
    } catch {
      setMessage({ type: "error", text: "Erreur réseau." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--color-gray-500)", fontWeight: 500 }}>Chargement de vos créneaux...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: "var(--color-gray-50)" }}>
      {/* Header */}
      <header style={{ background: "white", borderBottom: "1px solid var(--color-gray-200)", position: "sticky", top: 0, zIndex: 40, height: "var(--header-height)", display: "flex", alignItems: "center" }}>
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/profil" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "var(--color-blue)", fontWeight: 600 }}>
            <span>←</span> Retour au profil
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                overflow: "hidden",
                border: "2px solid rgba(11, 46, 107, 0.12)",
                background: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 6px rgba(0, 0, 0, 0.06)",
                flexShrink: 0,
              }}
            >
              <Image src="/logo.png" alt="Meet Me Club" width={36} height={36} style={{ objectFit: "cover" }} />
            </div>
            <span style={{ fontWeight: 800, fontSize: "16px", color: "var(--color-blue)" }}>
              meet <span style={{ color: "var(--color-red)" }}>me</span> club
            </span>
          </div>
        </div>
      </header>

      <main className="container" style={{ maxWidth: "680px", paddingBlock: "40px" }}>
        <div className="card card-padded" style={{ boxShadow: "var(--shadow-md)" }}>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--color-blue)", marginBottom: "8px" }}>
            Mes créneaux de disponibilité
          </h1>
          <p style={{ color: "var(--color-gray-500)", fontSize: "14px", marginBottom: "28px" }}>
            Sélectionnez les jours et les plages horaires où vous êtes libre pour fixer un rendez-vous dans nos lieux partenaires.
          </p>

          {message && (
            <div
              style={{
                padding: "14px 16px",
                borderRadius: "var(--radius-md)",
                marginBottom: "24px",
                fontSize: "14px",
                fontWeight: 600,
                background: message.type === "success" ? "#ECFDF5" : "#FEF2F2",
                color: message.type === "success" ? "#065F46" : "#991B1B",
                border: `1px solid ${message.type === "success" ? "#A7F3D0" : "#FECACA"}`,
              }}
            >
              {message.text}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "32px" }}>
            {DAYS.map((d) => {
              const activeSlot = availabilities.find((a) => a.dayOfWeek === d.id);
              const isActive = Boolean(activeSlot);

              return (
                <div
                  key={d.id}
                  style={{
                    padding: "16px",
                    borderRadius: "var(--radius-md)",
                    background: isActive ? "#F0F4FF" : "white",
                    border: `2px solid ${isActive ? "var(--color-blue)" : "var(--color-gray-200)"}`,
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    transition: "all var(--transition-fast)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <input
                        type="checkbox"
                        id={`day-${d.id}`}
                        checked={isActive}
                        onChange={() => toggleDay(d.id)}
                        style={{ width: "20px", height: "20px", cursor: "pointer", accentColor: "var(--color-blue)" }}
                      />
                      <label htmlFor={`day-${d.id}`} style={{ fontWeight: 700, fontSize: "16px", color: isActive ? "var(--color-blue)" : "var(--color-gray-700)", cursor: "pointer" }}>
                        {d.label}
                      </label>
                    </div>
                    <span style={{ fontSize: "13px", color: isActive ? "var(--color-blue)" : "var(--color-gray-400)", fontWeight: 600 }}>
                      {isActive ? "Disponible" : "Non disponible"}
                    </span>
                  </div>

                  {isActive && activeSlot && (
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingTop: "8px", borderTop: "1px dashed rgba(11, 46, 107, 0.2)" }}>
                      <span style={{ fontSize: "13px", color: "var(--color-gray-600)", fontWeight: 500 }}>De</span>
                      <input
                        type="time"
                        value={activeSlot.startTime}
                        onChange={(e) => updateTime(d.id, "startTime", e.target.value)}
                        className="input"
                        style={{ width: "130px", padding: "8px 12px", fontSize: "14px" }}
                      />
                      <span style={{ fontSize: "13px", color: "var(--color-gray-600)", fontWeight: 500 }}>à</span>
                      <input
                        type="time"
                        value={activeSlot.endTime}
                        onChange={(e) => updateTime(d.id, "endTime", e.target.value)}
                        className="input"
                        style={{ width: "130px", padding: "8px 12px", fontSize: "14px" }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="button"
              onClick={handleSave}
              className={`btn btn-primary ${saving ? "btn-loading" : ""}`}
              disabled={saving}
              style={{ flex: 1 }}
            >
              {saving ? "" : "Enregistrer mes disponibilités ✓"}
            </button>
            <Link href="/profil" className="btn btn-outline-blue">
              Annuler
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
