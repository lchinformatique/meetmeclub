"use client";
// src/app/rendez-vous/page.tsx
// Rendez-vous dashboard — list of upcoming & past appointments

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Status = "PENDING" | "ACCEPTED" | "COMPLETED" | "CANCELLED";

interface Rdv {
  id: string;
  withFirstName: string;
  withPhoto: string;
  pack: string;
  packColor: string;
  partnerName: string;
  partnerAddress: string;
  scheduledAt: string;
  status: Status;
  priceFcfa: number;
  note?: string;
  qrCode?: string;
}

const DEMO_RDV: Rdv[] = [
  {
    id: "rdv-1",
    withFirstName: "Afi",
    withPhoto:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
    pack: "Dîner",
    packColor: "var(--color-red)",
    partnerName: "Coco Beach Lomé",
    partnerAddress: "Boulevard du Mono, Bè-Plage, Lomé",
    scheduledAt: "2026-10-15T19:30:00Z",
    status: "ACCEPTED",
    priceFcfa: 12000,
    qrCode: "QR-MMC-20261015-AFI",
  },
  {
    id: "rdv-2",
    withFirstName: "Akua",
    withPhoto:
      "https://images.unsplash.com/photo-1546961342-ea5f60b193b5?auto=format&fit=crop&w=120&q=80",
    pack: "Complice",
    packColor: "var(--color-blue)",
    partnerName: "Byblos Lomé",
    partnerAddress: "Rue de la Victoire, Tokoin, Lomé",
    scheduledAt: "2026-10-18T20:00:00Z",
    status: "PENDING",
    priceFcfa: 5000,
    note: "J'espère que tu aimeras l'endroit, il est très cosy !",
  },
  {
    id: "rdv-3",
    withFirstName: "Esi",
    withPhoto:
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=120&q=80",
    pack: "Découverte",
    packColor: "var(--color-gray-500)",
    partnerName: "Café de la Paix",
    partnerAddress: "Avenue 24 Janvier, Lomé",
    scheduledAt: "2026-10-08T17:00:00Z",
    status: "COMPLETED",
    priceFcfa: 2000,
  },
];

const STATUS_CONFIG: Record<
  Status,
  { label: string; color: string; bg: string; icon: string }
> = {
  PENDING: {
    label: "En attente",
    color: "#D97706",
    bg: "rgba(217,119,6,0.10)",
    icon: "⏳",
  },
  ACCEPTED: {
    label: "Confirmé",
    color: "var(--color-success)",
    bg: "rgba(16,185,129,0.10)",
    icon: "✅",
  },
  COMPLETED: {
    label: "Terminé",
    color: "var(--color-gray-500)",
    bg: "rgba(107,114,128,0.10)",
    icon: "⭐",
  },
  CANCELLED: {
    label: "Annulé",
    color: "var(--color-error)",
    bg: "rgba(239,68,68,0.10)",
    icon: "✕",
  },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RendezVousPage() {
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");
  const [expandedId, setExpandedId] = useState<string | null>("rdv-1");

  const filtered = DEMO_RDV.filter((r) => {
    if (filter === "upcoming")
      return r.status === "PENDING" || r.status === "ACCEPTED";
    if (filter === "past")
      return r.status === "COMPLETED" || r.status === "CANCELLED";
    return true;
  });

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
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
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
                width={40}
                height={40}
                style={{ objectFit: "cover" }}
                priority
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
              <span style={{ fontWeight: 800, fontSize: "17px", color: "var(--color-blue)" }}>
                meet <span style={{ color: "var(--color-red)" }}>me</span> club
              </span>
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: 700,
                  color: "var(--color-gray-400)",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                }}
              >
                Rendez-vous
              </span>
            </div>
          </Link>
          <nav style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <Link href="/decouverte" className="btn btn-ghost btn-sm">
              🔍 Découvrir
            </Link>
            <Link href="/messages" className="btn btn-ghost btn-sm">
              💬 Messages
            </Link>
            <Link href="/profil" className="btn btn-outline-blue btn-sm">
              Mon profil
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Content ────────────────────────────────────── */}
      <div
        className="container"
        style={{ paddingTop: "32px", paddingBottom: "48px", maxWidth: "820px" }}
      >
        {/* Page heading */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "28px",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <h1 style={{ fontSize: "26px", fontWeight: 800, color: "var(--color-blue)" }}>
              Mes rendez-vous
            </h1>
            <p style={{ color: "var(--color-gray-500)", fontSize: "15px", marginTop: "4px" }}>
              Gérez vos rencontres planifiées
            </p>
          </div>
          <Link
            href="/rendez-vous/nouveau"
            className="btn btn-primary"
            style={{ gap: "8px" }}
          >
            ＋ Proposer un rendez-vous
          </Link>
        </div>

        {/* Stats bar */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "12px",
            marginBottom: "28px",
          }}
        >
          {[
            { label: "À venir", value: 2, color: "var(--color-blue)", icon: "📅" },
            { label: "Réalisés", value: 1, color: "var(--color-success)", icon: "✅" },
            { label: "En attente", value: 1, color: "#D97706", icon: "⏳" },
          ].map((s) => (
            <div
              key={s.label}
              className="card"
              style={{ padding: "16px 20px", textAlign: "center" }}
            >
              <div style={{ fontSize: "24px", marginBottom: "4px" }}>{s.icon}</div>
              <div
                style={{ fontSize: "28px", fontWeight: 800, color: s.color }}
              >
                {s.value}
              </div>
              <div style={{ fontSize: "13px", color: "var(--color-gray-500)" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div
          style={{
            display: "flex",
            background: "var(--color-gray-100)",
            borderRadius: "var(--radius-full)",
            padding: "4px",
            marginBottom: "20px",
            width: "fit-content",
          }}
        >
          {(
            [
              { key: "all", label: "Tous" },
              { key: "upcoming", label: "À venir" },
              { key: "past", label: "Passés" },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              style={{
                padding: "8px 20px",
                borderRadius: "var(--radius-full)",
                border: "none",
                fontWeight: 600,
                fontSize: "14px",
                cursor: "pointer",
                transition: "all var(--transition-fast)",
                background: filter === t.key ? "white" : "transparent",
                color:
                  filter === t.key ? "var(--color-blue)" : "var(--color-gray-500)",
                boxShadow: filter === t.key ? "var(--shadow-sm)" : "none",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* RDV Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filtered.length === 0 && (
            <div
              className="card card-padded"
              style={{ textAlign: "center", color: "var(--color-gray-400)" }}
            >
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>📅</div>
              <p style={{ fontSize: "16px", fontWeight: 600 }}>
                Aucun rendez-vous dans cette catégorie
              </p>
              <Link
                href="/decouverte"
                className="btn btn-primary"
                style={{ marginTop: "16px", display: "inline-flex" }}
              >
                Découvrir des profils →
              </Link>
            </div>
          )}

          {filtered.map((rdv) => {
            const sc = STATUS_CONFIG[rdv.status];
            const isExpanded = expandedId === rdv.id;

            return (
              <div
                key={rdv.id}
                className="card"
                style={{
                  overflow: "hidden",
                  border:
                    rdv.status === "ACCEPTED"
                      ? "2px solid rgba(16,185,129,0.30)"
                      : "1px solid var(--color-gray-200)",
                }}
              >
                {/* Card header — always visible */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : rdv.id)}
                  style={{
                    width: "100%",
                    padding: "18px 24px",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    border: "none",
                    background: "white",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  {/* Profile photo */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={rdv.withPhoto}
                    alt={rdv.withFirstName}
                    style={{
                      width: "54px",
                      height: "54px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "2px solid var(--color-gray-200)",
                      flexShrink: 0,
                    }}
                  />

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        marginBottom: "4px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: "16px",
                          color: "var(--color-blue)",
                        }}
                      >
                        Rendez-vous avec {rdv.withFirstName}
                      </span>
                      {/* Status badge */}
                      <span
                        style={{
                          background: sc.bg,
                          color: sc.color,
                          fontSize: "12px",
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: "var(--radius-full)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        {sc.icon} {sc.label}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "16px",
                        fontSize: "13px",
                        color: "var(--color-gray-500)",
                        flexWrap: "wrap",
                      }}
                    >
                      <span>📅 {formatDate(rdv.scheduledAt)}</span>
                      <span>🕐 {formatTime(rdv.scheduledAt)}</span>
                      <span
                        style={{
                          color: rdv.packColor,
                          fontWeight: 600,
                        }}
                      >
                        Pack {rdv.pack}
                      </span>
                    </div>
                  </div>

                  {/* Chevron */}
                  <span
                    style={{
                      fontSize: "18px",
                      color: "var(--color-gray-400)",
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform var(--transition-fast)",
                      flexShrink: 0,
                    }}
                  >
                    ▾
                  </span>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div
                    style={{
                      borderTop: "1px solid var(--color-gray-100)",
                      padding: "20px 24px",
                      background: "var(--color-gray-50)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                    }}
                  >
                    {/* Venue */}
                    <div
                      style={{
                        background: "white",
                        borderRadius: "var(--radius-md)",
                        padding: "16px",
                        border: "1px solid var(--color-gray-200)",
                        display: "flex",
                        gap: "14px",
                        alignItems: "flex-start",
                      }}
                    >
                      <span style={{ fontSize: "28px" }}>📍</span>
                      <div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: "15px",
                            color: "var(--color-blue)",
                            marginBottom: "2px",
                          }}
                        >
                          {rdv.partnerName}
                        </div>
                        <div
                          style={{
                            fontSize: "13px",
                            color: "var(--color-gray-500)",
                          }}
                        >
                          {rdv.partnerAddress}
                        </div>
                      </div>
                    </div>

                    {/* Pack & Price */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          background: "white",
                          borderRadius: "var(--radius-md)",
                          padding: "14px 16px",
                          border: "1px solid var(--color-gray-200)",
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--color-gray-400)",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            marginBottom: "6px",
                          }}
                        >
                          Pack choisi
                        </div>
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: "18px",
                            color: rdv.packColor,
                          }}
                        >
                          {rdv.pack}
                        </div>
                      </div>
                      <div
                        style={{
                          background: "white",
                          borderRadius: "var(--radius-md)",
                          padding: "14px 16px",
                          border: "1px solid var(--color-gray-200)",
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--color-gray-400)",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            marginBottom: "6px",
                          }}
                        >
                          Montant
                        </div>
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: "18px",
                            color: "var(--color-blue)",
                          }}
                        >
                          {rdv.priceFcfa.toLocaleString("fr-FR")} FCFA
                        </div>
                      </div>
                    </div>

                    {/* Note */}
                    {rdv.note && (
                      <div
                        style={{
                          background: "rgba(11,46,107,0.04)",
                          borderRadius: "var(--radius-md)",
                          padding: "14px 16px",
                          border: "1px solid rgba(11,46,107,0.10)",
                          fontSize: "14px",
                          color: "var(--color-gray-600)",
                          fontStyle: "italic",
                        }}
                      >
                        💬 &laquo;{rdv.note}&raquo;
                      </div>
                    )}

                    {/* QR Code (if accepted) */}
                    {rdv.qrCode && rdv.status === "ACCEPTED" && (
                      <div
                        style={{
                          background: "white",
                          borderRadius: "var(--radius-md)",
                          padding: "20px",
                          border: "2px dashed rgba(16,185,129,0.4)",
                          textAlign: "center",
                        }}
                      >
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-gray-600)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          🎟️ Votre code d&apos;accès
                        </div>
                        {/* QR code placeholder */}
                        <div
                          style={{
                            width: "120px",
                            height: "120px",
                            margin: "0 auto 12px",
                            background: "linear-gradient(135deg, var(--color-blue) 0%, var(--color-blue-dark) 100%)",
                            borderRadius: "var(--radius-md)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                          }}
                        >
                          <span style={{ fontSize: "40px" }}>📱</span>
                        </div>
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: "14px",
                            color: "var(--color-blue)",
                            letterSpacing: "2px",
                          }}
                        >
                          {rdv.qrCode}
                        </div>
                        <p
                          style={{
                            fontSize: "12px",
                            color: "var(--color-gray-400)",
                            marginTop: "8px",
                          }}
                        >
                          Présentez ce code à l&apos;entrée du restaurant
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      {rdv.status === "PENDING" && (
                        <>
                          <button className="btn btn-primary" style={{ flex: 1 }}>
                            ✅ Confirmer
                          </button>
                          <button
                            className="btn btn-ghost"
                            style={{
                              flex: 1,
                              color: "var(--color-error)",
                              borderColor: "var(--color-error)",
                            }}
                          >
                            ✕ Refuser
                          </button>
                        </>
                      )}
                      {rdv.status === "ACCEPTED" && (
                        <>
                          <Link
                            href={`/messages?conv=${rdv.withFirstName.toLowerCase()}`}
                            className="btn btn-outline-blue"
                            style={{ flex: 1, justifyContent: "center" }}
                          >
                            💬 Envoyer un message
                          </Link>
                          <button
                            className="btn btn-ghost"
                            style={{
                              flex: 1,
                              color: "var(--color-error)",
                            }}
                          >
                            Annuler
                          </button>
                        </>
                      )}
                      {rdv.status === "COMPLETED" && (
                        <button className="btn btn-outline-blue" style={{ flex: 1 }}>
                          ⭐ Laisser un avis
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty state CTA */}
        {DEMO_RDV.length === 0 && (
          <div className="card card-padded" style={{ textAlign: "center", marginTop: "40px" }}>
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>💕</div>
            <h2 style={{ fontSize: "22px", marginBottom: "8px", color: "var(--color-blue)" }}>
              Aucun rendez-vous pour l&apos;instant
            </h2>
            <p
              style={{
                color: "var(--color-gray-500)",
                marginBottom: "24px",
                lineHeight: 1.6,
              }}
            >
              Découvrez des profils et proposez votre premier rendez-vous !
            </p>
            <Link href="/decouverte" className="btn btn-primary btn-lg">
              Découvrir des profils →
            </Link>
          </div>
        )}
      </div>

      {/* Footer brand signature */}
      <footer
        style={{
          marginTop: "60px",
          padding: "36px 16px 28px",
          textAlign: "center",
          borderTop: "1px solid var(--color-gray-200)",
          background: "white",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            overflow: "hidden",
            border: "2px solid var(--color-red)",
            background: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 10px rgba(225, 6, 0, 0.15)",
            padding: "3px",
          }}
        >
          <Image src="/logo.png" alt="Meet Me Club" width={38} height={38} style={{ objectFit: "contain" }} />
        </div>
        <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--color-blue)" }}>
          meet <span style={{ color: "var(--color-red)" }}>me</span> club · Lomé, Togo
        </div>
        <p style={{ fontSize: "12px", color: "var(--color-gray-500)", margin: 0 }}>
          « Plus qu&apos;une rencontre, un rendez-vous ! » · 🔞 Réservé aux 18 ans et plus
        </p>
      </footer>
    </div>
  );
}
