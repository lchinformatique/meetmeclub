"use client";
// src/app/rendez-vous/nouveau/page.tsx
// Multi-step booking flow: Choose partner → Choose pack → Date/time → Note → Confirm

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

// ── Fake partners data ─────────────────────────────────────────
const PARTNERS = [
  {
    id: "p1",
    name: "Coco Beach Lomé",
    neighborhood: "Bè-Plage",
    address: "Boulevard du Mono, Bè-Plage",
    rating: 4.8,
    reviewCount: 124,
    coverUrl:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=600&q=80",
    ambiance: "Vue mer, terrasse romantique, musique douce",
    acceptedPacks: ["DECOUVERTE", "COMPLICE", "DINER", "VIP_PREMIUM"],
  },
  {
    id: "p2",
    name: "Byblos Lomé",
    neighborhood: "Tokoin",
    address: "Rue de la Victoire, Tokoin",
    rating: 4.6,
    reviewCount: 87,
    coverUrl:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80",
    ambiance: "Lounge cosy, lumières tamisées, cocktails signature",
    acceptedPacks: ["COMPLICE", "DINER", "VIP_PREMIUM"],
  },
  {
    id: "p3",
    name: "Café de la Paix",
    neighborhood: "Centre-ville",
    address: "Avenue 24 Janvier, Lomé",
    rating: 4.4,
    reviewCount: 56,
    coverUrl:
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80",
    ambiance: "Café colonial chic, terrasse ombragée",
    acceptedPacks: ["DECOUVERTE", "COMPLICE"],
  },
];

const PACKS = [
  {
    id: "DECOUVERTE",
    name: "Découverte",
    price: 2000,
    icon: "☕",
    color: "var(--color-gray-500)",
    description: "Rencontre simple en lieu public",
    features: ["Lieu public", "Chat inclus", "Rappels automatiques"],
  },
  {
    id: "COMPLICE",
    name: "Complice",
    price: 5000,
    icon: "🍷",
    color: "var(--color-blue)",
    description: "Table réservée + 1 boisson par personne",
    features: ["Table réservée", "1 boisson incluse", "Chat dédié", "Rappels"],
  },
  {
    id: "DINER",
    name: "Dîner",
    price: 12000,
    icon: "🍽️",
    color: "var(--color-red)",
    description: "Menu complet dans un lieu partenaire",
    features: ["Table réservée", "Menu entrée/plat/boisson", "Ambiance soignée"],
    popular: true,
  },
  {
    id: "VIP_PREMIUM",
    name: "VIP Premium",
    price: 30000,
    icon: "👑",
    color: "#B8860B",
    description: "Espace privatif, menu complet, accueil dédié",
    features: [
      "Espace privatif",
      "Menu complet",
      "Boissons au choix",
      "Accueil dédié",
    ],
  },
];

type Step = 1 | 2 | 3 | 4;

function NouveauRdvInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const withUserId = searchParams.get("avec");

  const [step, setStep] = useState<Step>(1);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>("");
  const [selectedPackId, setSelectedPackId] = useState<string>("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("19:30");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [userPlan, setUserPlan] = useState<string>("FREE");
  const [lockedModal, setLockedModal] = useState<{ open: boolean; packName?: string; price?: string; link?: string; desc?: string } | null>(null);

  useEffect(() => {
    fetch("/api/profiles/me")
      .then((r) => r.json())
      .then((data) => {
        if (data?.profile?.plan) setUserPlan(data.profile.plan);
      })
      .catch(() => {});
  }, []);

  function handleSelectPack(pk: (typeof PACKS)[0]) {
    if (pk.id === "VIP_PREMIUM" && userPlan !== "VIP") {
      setLockedModal({
        open: true,
        packName: "Pack VIP Premium",
        price: "15 000 FCFA / mois",
        link: "https://link.saspay.me/ksev91xlvik",
        desc: "L'accès aux salons privés et prestations de conciergerie VIP nécessite le Pass VIP Club.",
      });
      return;
    }
    if ((pk.id === "COMPLICE" || pk.id === "DINER") && (userPlan === "FREE" || userPlan === "ESSENTIAL")) {
      setLockedModal({
        open: true,
        packName: pk.name,
        price: "6 000 FCFA / mois",
        link: "https://link.saspay.me/xiigac37eyq",
        desc: "Les réservations de tables avec consommations offertes nécessitent le Pass Complice ou supérieur.",
      });
      return;
    }
    setSelectedPackId(pk.id);
  }

  const selectedPartner = PARTNERS.find((p) => p.id === selectedPartnerId);
  const selectedPack = PACKS.find((p) => p.id === selectedPackId);

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  async function handleSubmit() {
    setLoading(true);
    // Simulate API call — replace with real fetch to /api/appointments
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setSubmitted(true);
  }

  const STEP_LABELS = ["Lieu", "Pack", "Date & heure", "Confirmation"];

  if (submitted) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--color-gray-50)",
          padding: "24px",
        }}
      >
        <div
          className="card card-padded animate-fade-in"
          style={{ maxWidth: "480px", textAlign: "center" }}
        >
          <div style={{ fontSize: "72px", marginBottom: "16px" }}>🎉</div>
          <h2
            style={{
              fontSize: "26px",
              fontWeight: 800,
              color: "var(--color-blue)",
              marginBottom: "12px",
            }}
          >
            Demande envoyée !
          </h2>
          <p style={{ color: "var(--color-gray-500)", lineHeight: 1.7, marginBottom: "8px" }}>
            Votre proposition de rendez-vous a été transmise. Vous serez
            notifié dès que l&apos;autre personne accepte.
          </p>
          {selectedPartner && selectedPack && (
            <div
              style={{
                background: "var(--color-gray-50)",
                borderRadius: "var(--radius-md)",
                padding: "16px",
                margin: "20px 0",
                border: "1px solid var(--color-gray-200)",
                fontSize: "14px",
                color: "var(--color-gray-600)",
                textAlign: "left",
              }}
            >
              <div style={{ marginBottom: "6px" }}>
                📍 <strong>{selectedPartner.name}</strong>
              </div>
              <div style={{ marginBottom: "6px" }}>
                🍽️ Pack{" "}
                <strong style={{ color: selectedPack.color }}>
                  {selectedPack.name}
                </strong>{" "}
                — {selectedPack.price.toLocaleString("fr-FR")} FCFA
              </div>
              <div>
                📅{" "}
                <strong>
                  {date
                    ? new Date(date).toLocaleDateString("fr-FR", {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                      })
                    : ""}{" "}
                  à {time}
                </strong>
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <Link href="/rendez-vous" className="btn btn-primary">
              Voir mes rendez-vous
            </Link>
            <Link href="/messages" className="btn btn-ghost">
              Messages
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--color-gray-50)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Header ─────────────────────────────────────── */}
      <header
        style={{
          background: "white",
          boxShadow: "var(--shadow-sm)",
          position: "sticky",
          top: 0,
          zIndex: 50,
          height: "var(--header-height)",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            href="/rendez-vous"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              textDecoration: "none",
              color: "var(--color-blue)",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            ← Retour
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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
              }}
            >
              <Image
                src="/logo.png"
                alt="Meet Me Club"
                width={36}
                height={36}
                style={{ objectFit: "cover" }}
                priority
              />
            </div>
            <span style={{ fontWeight: 800, fontSize: "16px", color: "var(--color-blue)" }}>
              Nouveau rendez-vous
            </span>
          </div>
          <div style={{ width: "60px" }} />
        </div>
      </header>

      <div
        className="container"
        style={{ maxWidth: "680px", paddingTop: "32px", paddingBottom: "48px" }}
      >
        {/* Step indicator */}
        <div style={{ marginBottom: "32px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            {STEP_LABELS.map((label, i) => {
              const n = (i + 1) as Step;
              const done = n < step;
              const active = n === step;
              return (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: done
                        ? "var(--color-success)"
                        : active
                        ? "var(--color-red)"
                        : "var(--color-gray-200)",
                      color: done || active ? "white" : "var(--color-gray-400)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "13px",
                      transition: "all var(--transition-base)",
                    }}
                  >
                    {done ? "✓" : n}
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: active ? 700 : 500,
                      color: active
                        ? "var(--color-red)"
                        : done
                        ? "var(--color-success)"
                        : "var(--color-gray-400)",
                      textAlign: "center",
                    }}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Progress bar */}
          <div
            style={{
              height: "4px",
              background: "var(--color-gray-200)",
              borderRadius: "var(--radius-full)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${((step - 1) / 3) * 100}%`,
                background: "var(--gradient-red)",
                borderRadius: "var(--radius-full)",
                transition: "width var(--transition-slow)",
              }}
            />
          </div>
        </div>

        {/* ── Step 1: Choose partner ─────────────────── */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h2
              style={{
                fontSize: "22px",
                fontWeight: 800,
                color: "var(--color-blue)",
                marginBottom: "8px",
              }}
            >
              📍 Choisissez un lieu
            </h2>
            <p
              style={{
                color: "var(--color-gray-500)",
                marginBottom: "20px",
                fontSize: "15px",
              }}
            >
              Tous nos partenaires sont vérifiés et sélectionnés pour vous
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {PARTNERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPartnerId(p.id)}
                  style={{
                    width: "100%",
                    background: "white",
                    border:
                      selectedPartnerId === p.id
                        ? "2px solid var(--color-red)"
                        : "1px solid var(--color-gray-200)",
                    borderRadius: "var(--radius-lg)",
                    overflow: "hidden",
                    cursor: "pointer",
                    textAlign: "left",
                    boxShadow:
                      selectedPartnerId === p.id
                        ? "0 0 0 4px rgba(225,6,0,0.08)"
                        : "var(--shadow-sm)",
                    transition: "all var(--transition-fast)",
                  }}
                >
                  <div style={{ position: "relative", height: "140px" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.coverUrl}
                      alt={p.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(180deg, transparent 40%, rgba(7,30,70,0.8) 100%)",
                      }}
                    />
                    {selectedPartnerId === p.id && (
                      <div
                        style={{
                          position: "absolute",
                          top: "12px",
                          right: "12px",
                          background: "var(--color-red)",
                          color: "white",
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: "14px",
                        }}
                      >
                        ✓
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "14px 16px" }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "16px",
                        color: "var(--color-blue)",
                        marginBottom: "2px",
                      }}
                    >
                      {p.name}
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "var(--color-gray-500)",
                        marginBottom: "6px",
                      }}
                    >
                      📍 {p.neighborhood} — {p.address}
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "var(--color-gray-600)",
                        fontStyle: "italic",
                      }}
                    >
                      ✨ {p.ambiance}
                    </div>
                    <div
                      style={{
                        marginTop: "8px",
                        fontSize: "13px",
                        color: "#F59E0B",
                        fontWeight: 600,
                      }}
                    >
                      ★ {p.rating} ({p.reviewCount} avis)
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div style={{ marginTop: "24px" }}>
              <button
                onClick={() => setStep(2)}
                disabled={!selectedPartnerId}
                className="btn btn-primary btn-lg"
                style={{ width: "100%" }}
              >
                Choisir ce lieu →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Choose pack ───────────────────── */}
        {step === 2 && (
          <div className="animate-fade-in">
            <h2
              style={{
                fontSize: "22px",
                fontWeight: 800,
                color: "var(--color-blue)",
                marginBottom: "8px",
              }}
            >
              🎁 Choisissez votre pack
            </h2>
            {selectedPartner && (
              <p
                style={{
                  color: "var(--color-gray-500)",
                  marginBottom: "20px",
                  fontSize: "15px",
                }}
              >
                Disponible chez <strong>{selectedPartner.name}</strong>
              </p>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {PACKS.filter(
                (pk) =>
                  !selectedPartner ||
                  selectedPartner.acceptedPacks.includes(pk.id)
              ).map((pk) => {
                const isCompliceRequired = (pk.id === "COMPLICE" || pk.id === "DINER") && (userPlan === "FREE" || userPlan === "ESSENTIAL");
                const isVipRequired = pk.id === "VIP_PREMIUM" && userPlan !== "VIP";
                const isLocked = isCompliceRequired || isVipRequired;

                return (
                  <button
                    key={pk.id}
                    onClick={() => handleSelectPack(pk)}
                    style={{
                      width: "100%",
                      background: "white",
                      border:
                        selectedPackId === pk.id
                          ? `2px solid ${pk.color}`
                          : "1px solid var(--color-gray-200)",
                      borderRadius: "var(--radius-lg)",
                      padding: "18px 20px",
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      boxShadow:
                        selectedPackId === pk.id ? "var(--shadow-md)" : "var(--shadow-sm)",
                      transition: "all var(--transition-fast)",
                      position: "relative",
                    }}
                  >
                  {pk.popular && (
                    <span
                      style={{
                        position: "absolute",
                        top: "-10px",
                        right: "14px",
                        background: "var(--gradient-red)",
                        color: "white",
                        fontSize: "10px",
                        fontWeight: 700,
                        padding: "2px 10px",
                        borderRadius: "var(--radius-full)",
                      }}
                    >
                      ⭐ Populaire
                    </span>
                  )}
                  <div
                    style={{
                      width: "52px",
                      height: "52px",
                      borderRadius: "var(--radius-md)",
                      background: `${pk.color}15`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "24px",
                      flexShrink: 0,
                      border: `1.5px solid ${pk.color}30`,
                    }}
                  >
                    {pk.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "4px",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: "16px",
                          color: pk.color,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        {pk.name}
                        {isLocked && (
                          <span style={{ fontSize: "11px", fontWeight: 700, background: "#FEF2F2", color: "#B91C1C", border: "1px solid #FECACA", padding: "1px 6px", borderRadius: "6px" }}>
                            🔒 Abonnement Requis
                          </span>
                        )}
                      </span>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: "18px",
                          color: "var(--color-blue)",
                        }}
                      >
                        {pk.price.toLocaleString("fr-FR")}{" "}
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 400,
                            color: "var(--color-gray-400)",
                          }}
                        >
                          FCFA
                        </span>
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "var(--color-gray-500)",
                        marginBottom: "8px",
                      }}
                    >
                      {pk.description}
                    </div>
                    <div
                      style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}
                    >
                      {pk.features.map((f) => (
                        <span
                          key={f}
                          style={{
                            fontSize: "11px",
                            background: "var(--color-gray-100)",
                            color: "var(--color-gray-600)",
                            padding: "2px 8px",
                            borderRadius: "var(--radius-full)",
                            fontWeight: 500,
                          }}
                        >
                          ✓ {f}
                        </span>
                      ))}
                    </div>
                  </div>
                  {selectedPackId === pk.id && (
                    <div
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        background: pk.color,
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "13px",
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      ✓
                    </div>
                  )}
                  </button>
                );
              })}
            </div>

            <div
              style={{ marginTop: "24px", display: "flex", gap: "10px" }}
            >
              <button
                onClick={() => setStep(1)}
                className="btn btn-ghost"
                style={{ flex: 1 }}
              >
                ← Retour
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!selectedPackId}
                className="btn btn-primary"
                style={{ flex: 2 }}
              >
                Choisir ce pack →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Date & time ───────────────────── */}
        {step === 3 && (
          <div className="animate-fade-in">
            <h2
              style={{
                fontSize: "22px",
                fontWeight: 800,
                color: "var(--color-blue)",
                marginBottom: "8px",
              }}
            >
              📅 Choisissez la date et l&apos;heure
            </h2>
            <p
              style={{
                color: "var(--color-gray-500)",
                marginBottom: "28px",
                fontSize: "15px",
              }}
            >
              La date doit être au moins demain. L&apos;autre personne peut
              contre-proposer.
            </p>

            <div className="card card-padded">
              <div className="input-group" style={{ marginBottom: "20px" }}>
                <label htmlFor="rdv-date" className="input-label">
                  Date du rendez-vous
                </label>
                <input
                  id="rdv-date"
                  type="date"
                  className="input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={minDateStr}
                  required
                />
              </div>

              <div className="input-group" style={{ marginBottom: "20px" }}>
                <label htmlFor="rdv-time" className="input-label">
                  Heure souhaitée
                </label>
                <select
                  id="rdv-time"
                  className="input"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                >
                  {[
                    "12:00",
                    "12:30",
                    "13:00",
                    "13:30",
                    "17:00",
                    "17:30",
                    "18:00",
                    "18:30",
                    "19:00",
                    "19:30",
                    "20:00",
                    "20:30",
                    "21:00",
                  ].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label htmlFor="rdv-note" className="input-label">
                  Message personnel{" "}
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 400,
                      color: "var(--color-gray-400)",
                    }}
                  >
                    (optionnel)
                  </span>
                </label>
                <textarea
                  id="rdv-note"
                  className="input"
                  rows={3}
                  placeholder="Un petit mot pour préparer le rendez-vous…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={280}
                  style={{ resize: "vertical" }}
                />
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--color-gray-400)",
                    textAlign: "right",
                  }}
                >
                  {note.length}/280
                </p>
              </div>
            </div>

            <div style={{ marginTop: "24px", display: "flex", gap: "10px" }}>
              <button
                onClick={() => setStep(2)}
                className="btn btn-ghost"
                style={{ flex: 1 }}
              >
                ← Retour
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!date}
                className="btn btn-primary"
                style={{ flex: 2 }}
              >
                Continuer →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Confirm ───────────────────────── */}
        {step === 4 && selectedPartner && selectedPack && (
          <div className="animate-fade-in">
            <h2
              style={{
                fontSize: "22px",
                fontWeight: 800,
                color: "var(--color-blue)",
                marginBottom: "8px",
              }}
            >
              ✨ Confirmez votre rendez-vous
            </h2>
            <p
              style={{
                color: "var(--color-gray-500)",
                marginBottom: "24px",
                fontSize: "15px",
              }}
            >
              Vérifiez les détails avant d&apos;envoyer la proposition
            </p>

            <div className="card" style={{ overflow: "hidden", marginBottom: "20px" }}>
              {/* Cover */}
              <div style={{ position: "relative", height: "160px" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedPartner.coverUrl}
                  alt={selectedPartner.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(180deg, transparent 30%, rgba(7,30,70,0.85) 100%)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: "14px",
                    left: "20px",
                    color: "white",
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: "18px" }}>
                    {selectedPartner.name}
                  </div>
                  <div style={{ fontSize: "13px", opacity: 0.85 }}>
                    📍 {selectedPartner.address}
                  </div>
                </div>
              </div>

              {/* Summary rows */}
              <div style={{ padding: "20px" }}>
                {[
                  {
                    icon: "🎁",
                    label: "Pack",
                    value: (
                      <span style={{ color: selectedPack.color, fontWeight: 700 }}>
                        {selectedPack.icon} {selectedPack.name}
                      </span>
                    ),
                  },
                  {
                    icon: "💰",
                    label: "Montant",
                    value: (
                      <span style={{ fontWeight: 700, color: "var(--color-blue)" }}>
                        {selectedPack.price.toLocaleString("fr-FR")} FCFA
                      </span>
                    ),
                  },
                  {
                    icon: "📅",
                    label: "Date",
                    value: date
                      ? new Date(date).toLocaleDateString("fr-FR", {
                          weekday: "long",
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })
                      : "—",
                  },
                  { icon: "🕐", label: "Heure", value: time },
                ].map((row) => (
                  <div
                    key={row.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 0",
                      borderBottom: "1px solid var(--color-gray-100)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        color: "var(--color-gray-500)",
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                      }}
                    >
                      {row.icon} {row.label}
                    </span>
                    <span
                      style={{ fontSize: "14px", color: "var(--color-gray-800)" }}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}

                {note && (
                  <div
                    style={{
                      marginTop: "12px",
                      padding: "12px 14px",
                      background: "var(--color-gray-50)",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--color-gray-200)",
                      fontSize: "13px",
                      color: "var(--color-gray-600)",
                      fontStyle: "italic",
                    }}
                  >
                    💬 &laquo;{note}&raquo;
                  </div>
                )}
              </div>
            </div>

            {/* Payment note */}
            <div
              style={{
                background: "rgba(11,46,107,0.04)",
                borderRadius: "var(--radius-md)",
                padding: "14px 16px",
                border: "1px solid rgba(11,46,107,0.10)",
                fontSize: "13px",
                color: "var(--color-gray-600)",
                lineHeight: 1.6,
                marginBottom: "20px",
              }}
            >
              🔒{" "}
              <strong>Paiement sécurisé après acceptation.</strong> Le montant
              sera débité via T-Money ou Flooz uniquement lorsque les deux
              parties auront confirmé.
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setStep(3)}
                className="btn btn-ghost"
                style={{ flex: 1 }}
              >
                ← Modifier
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`btn btn-primary${loading ? " btn-loading" : ""}`}
                style={{ flex: 2 }}
                id="btn-confirm-rdv"
              >
                {loading ? "" : "✅ Envoyer la proposition"}
              </button>
            </div>
          </div>
        )}

        {/* Plan Lock Modal with Saspay button */}
        {lockedModal?.open && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(11, 37, 89, 0.75)",
              backdropFilter: "blur(6px)",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
            }}
            onClick={() => setLockedModal(null)}
          >
            <div
              style={{
                background: "white",
                borderRadius: "24px",
                padding: "36px 28px",
                maxWidth: "460px",
                width: "100%",
                textAlign: "center",
                boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ fontSize: "56px", marginBottom: "12px" }}>🔒👑</div>
              <h3 style={{ fontSize: "22px", fontWeight: 800, color: "#0B2559", marginBottom: "8px" }}>
                Abonnement Requis pour ce Pack
              </h3>
              <p style={{ fontSize: "14px", color: "#475569", lineHeight: 1.6, marginBottom: "20px" }}>
                {lockedModal.desc}
              </p>

              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "14px", padding: "16px", marginBottom: "20px", textAlign: "left" }}>
                <div style={{ fontSize: "12px", color: "#64748B", textTransform: "uppercase", fontWeight: 800 }}>Pack sélectionné :</div>
                <div style={{ fontSize: "17px", fontWeight: 800, color: "#0F172A", marginTop: "2px" }}>{lockedModal.packName}</div>
                <div style={{ fontSize: "14px", color: "#E10600", fontWeight: 700, marginTop: "4px" }}>Prix formule : {lockedModal.price}</div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <a
                  href={lockedModal.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    padding: "14px",
                    borderRadius: "12px",
                    fontWeight: 800,
                    fontSize: "15px",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "#E10600",
                    borderColor: "#E10600",
                  }}
                >
                  <span>💳 Payer via T-Money / Flooz (Saspay)</span>
                </a>
                <div style={{ fontSize: "12px", color: "#64748B" }}>
                  Paiement sécurisé et instantané au Togo
                </div>

                <Link
                  href="/tarifs"
                  className="btn btn-outline-blue"
                  style={{ width: "100%", justifyContent: "center", padding: "10px", borderRadius: "12px", fontWeight: 700 }}
                >
                  Voir toutes les formules & tarifs
                </Link>

                <button
                  type="button"
                  onClick={() => setLockedModal(null)}
                  className="btn btn-ghost"
                  style={{ width: "100%", justifyContent: "center", color: "#64748B" }}
                >
                  Choisir le pack Découverte (Simple lieu public)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NouveauRdvPage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", textAlign: "center" }}>Chargement…</div>}>
      <NouveauRdvInner />
    </Suspense>
  );
}
