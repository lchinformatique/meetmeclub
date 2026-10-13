"use client";
// src/app/(auth)/inscription/page.tsx
// Page d'inscription officielle Meet Me Club
// 1ère position : Formulaire de création de compte & Google Auth
// En suite : Proposition des 4 Plans de paiement d'adhésion (Gratuit, Essentiel, Complice, VIP) avec disponibilité de paiement

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  Loader2,
  AlertCircle,
  LogIn,
  ChevronLeft,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import GoogleAuthButton from "@/components/GoogleAuthButton";

const MEMBERSHIP_PLANS = [
  {
    id: "FREE",
    name: "Plan Gratuit",
    badge: "🎁 Inclus à l'inscription",
    badgeBg: "rgba(16, 185, 129, 0.12)",
    badgeColor: "#059669",
    price: "0",
    period: "Essai 7 jours offert",
    desc: "Votre premier accès direct au club avec les fonctionnalités essentielles incluses.",
    features: [
      "7 jours d'essai sans engagement",
      "Échanger avec jusqu'à 3 partenaires",
      "Messages écrits, photos & vocaux",
      "Profil visible sur le réseau Lomé",
      "Réservation de rendez-vous disponible",
    ],
    highlight: false,
    borderColor: "#CBD5E1",
    actionLabel: "Inclus à la création ✓",
    actionHref: "#register-form",
    isFree: true,
  },
  {
    id: "ESSENTIAL",
    name: "Pass Essentiel",
    badge: "⭐ Le Plus Choisi",
    badgeBg: "rgba(11, 37, 89, 0.1)",
    badgeColor: "#0B2559",
    price: "3 000",
    period: "FCFA / mois",
    desc: "Discussions illimitées sans restriction, liberté totale de contact et d'amitié.",
    features: [
      "Tous les avantages du Plan Gratuit",
      "Partenaires & discussions 100% ILLIMITÉS",
      "Messages, photos et vocaux en continu",
      "Voir qui a liké et visité votre profil",
      "Badge officiel membre certifié ✓",
    ],
    highlight: true,
    borderColor: "var(--color-blue)",
    actionLabel: "Choisir ce plan (3 000 F)",
    actionHref: "https://link.saspay.me/dtpycov9i-k",
    isFree: false,
  },
  {
    id: "COMPLICE",
    name: "Pass Complice",
    badge: "🥂 Sorties & Boissons",
    badgeBg: "rgba(5, 150, 105, 0.12)",
    badgeColor: "#059669",
    price: "6 000",
    period: "FCFA / mois",
    desc: "Échanges illimités avec avantages sorties, tables réservées et consommations offertes.",
    features: [
      "Tout le Pass Essentiel en illimité",
      "Réservations de tables prioritaires",
      "1 consommation offerte / pers. au RDV",
      "Validation rapide par QR code",
      "Rappels automatiques de rendez-vous",
    ],
    highlight: false,
    borderColor: "#CBD5E1",
    actionLabel: "Choisir ce plan (6 000 F)",
    actionHref: "https://link.saspay.me/dtpycov9i-k",
    isFree: false,
  },
  {
    id: "VIP",
    name: "Pass VIP Club",
    badge: "👑 Prestige & Visio Live",
    badgeBg: "rgba(217, 119, 6, 0.15)",
    badgeColor: "#B45309",
    price: "15 000",
    period: "FCFA / mois",
    desc: "Prestige maximal, appels vidéo live débloqués, salons privés et conciergerie dédiée.",
    features: [
      "Tout le Pass Complice en illimité",
      "Appels vidéo live directs réservés VIP",
      "Accès aux salons privés & rooftops",
      "Dîner gastronomique mensuel inclus",
      "Conciergerie privée 24/7 à Lomé",
    ],
    highlight: false,
    borderColor: "#D97706",
    actionLabel: "Choisir ce plan (15 000 F)",
    actionHref: "https://link.saspay.me/dtpycov9i-k",
    isFree: false,
  },
];

export default function InscriptionPage() {
  const router = useRouter();

  // Form states
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusField, setFocusField] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const cleanInput = identifier.trim();
    if (!cleanInput) {
      setError("Veuillez renseigner votre pseudo ou votre adresse e-mail.");
      return;
    }

    if (!password || password.length < 6) {
      setError("Votre mot de passe doit comporter au moins 6 caractères.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login: cleanInput,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue lors de l'accès. Veuillez réessayer.");
        return;
      }

      router.push(data.redirect || "/profil?welcome=1");
      router.refresh();
    } catch {
      setError("Erreur réseau. Vérifiez votre connexion et réessayez.");
    } finally {
      setLoading(false);
    }
  }

  const fieldBase: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px 12px 44px",
    borderRadius: "12px",
    border: "1.5px solid #D8E1EF",
    background: "white",
    fontSize: "15px",
    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
    fontWeight: 500,
    color: "#1E2E4A",
    outline: "none",
    transition: "border-color 0.18s ease, box-shadow 0.18s ease",
    WebkitAppearance: "none",
    appearance: "none",
    boxSizing: "border-box",
  };

  const fieldFocused: React.CSSProperties = {
    borderColor: "#0B2559",
    boxShadow: "0 0 0 3px rgba(11,37,89,0.09)",
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "linear-gradient(160deg, #F5F7FF 0%, #EEF4FF 40%, #F9F3FF 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px 64px",
      }}
    >
      {/* ── Bouton Retour ── */}
      <div style={{ width: "100%", maxWidth: "860px", marginBottom: "14px", display: "flex", justifyContent: "flex-start" }}>
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined" && window.history.length > 1) {
              router.back();
            } else {
              router.push("/");
            }
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 14px",
            borderRadius: "12px",
            background: "white",
            border: "1.5px solid #D8E1EF",
            color: "#0B2559",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(11,37,89,0.06)",
            transition: "all 0.18s ease",
          }}
          aria-label="Retour à la page précédente"
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
          <span>Retour</span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════
          1ÈRE POSITION : CRÉATION DE COMPTE & AUTHENTIFICATION GOOGLE
      ══════════════════════════════════════════════════════════ */}
      <div
        id="register-form"
        style={{
          width: "100%",
          maxWidth: "560px",
          background: "white",
          borderRadius: "24px",
          boxShadow: "0 4px 6px rgba(11,37,89,0.04), 0 20px 60px rgba(11,37,89,0.10)",
          border: "1px solid #E8EDF5",
          overflow: "hidden",
          marginBottom: "44px",
        }}
      >
        {/* Accent Bar */}
        <div
          style={{
            height: "4px",
            background: "linear-gradient(90deg, #0B2559 0%, #E10600 50%, #0B2559 100%)",
          }}
        />

        <div style={{ padding: "32px 26px" }}>
          {/* ── Brand Header ── */}
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                textDecoration: "none",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  border: "2px solid rgba(11,37,89,0.10)",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4px",
                  background: "white",
                  boxShadow: "0 2px 12px rgba(11,37,89,0.12)",
                }}
              >
                <Image
                  src="/logo.png"
                  alt="Meet Me Club"
                  width={40}
                  height={40}
                  style={{ objectFit: "contain" }}
                  priority
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2, textAlign: "left" }}>
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: "20px",
                    color: "#0B2559",
                    letterSpacing: "-0.3px",
                  }}
                >
                  meet <span style={{ color: "#E10600" }}>me</span> club
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "#8B99B5",
                    letterSpacing: "0.9px",
                    textTransform: "uppercase",
                  }}
                >
                  Club Privé International · Sorties Togo
                </span>
              </div>
            </Link>

            <h1
              style={{
                fontSize: "24px",
                fontWeight: 800,
                color: "#0B2559",
                margin: "0 0 6px",
                letterSpacing: "-0.4px",
              }}
            >
              Créer mon compte Meet Me Club
            </h1>
            <p style={{ fontSize: "14px", color: "#475569", margin: "0 auto 14px", maxWidth: "440px", lineHeight: 1.5 }}>
              Rejoignez le club privé de rencontres & sorties réelles à Lomé. Votre premier accès inclut le <strong>Plan Gratuit (7 jours offerts)</strong> pour tester la messagerie.
            </p>

            {/* Badge Plan Gratuit */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  borderRadius: "100px",
                  background: "#FEF3C7",
                  border: "1px solid #FDE68A",
                  color: "#92400E",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                <Sparkles size={14} style={{ color: "#D97706" }} />
                Plan Gratuit activé automatiquement à l&apos;inscription
              </span>
            </div>
          </div>

          {/* ── Error Banner ── */}
          {error && (
            <div
              role="alert"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                padding: "12px 14px",
                borderRadius: "12px",
                background: "#FFF5F5",
                border: "1.5px solid #FECACA",
                marginBottom: "20px",
              }}
            >
              <AlertCircle size={18} style={{ color: "#E10600", flexShrink: 0, marginTop: "1px" }} />
              <p
                style={{
                  fontSize: "13px",
                  color: "#B91C1C",
                  fontWeight: 600,
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {error}
              </p>
            </div>
          )}

          {/* ── FORMULAIRE DE CRÉATION DE COMPTE (1ÈRE POSITION) ── */}
          <form onSubmit={handleSubmit} noValidate>
            {/* Pseudo ou Email */}
            <div style={{ marginBottom: "16px" }}>
              <label
                htmlFor="identifier"
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#4B5C7A",
                  marginBottom: "6px",
                  letterSpacing: "0.4px",
                  textTransform: "uppercase",
                }}
              >
                Pseudo ou Adresse e-mail *
              </label>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                    color: focusField === "identifier" ? "#0B2559" : "#A0AABF",
                    transition: "color 0.18s ease",
                  }}
                >
                  <User size={17} />
                </div>
                <input
                  id="identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  onFocus={() => setFocusField("identifier")}
                  onBlur={() => setFocusField("")}
                  placeholder="Ex : Koffi_Pro ou email@exemple.com"
                  autoComplete="username"
                  style={{
                    ...fieldBase,
                    ...(focusField === "identifier" ? fieldFocused : {}),
                  }}
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div style={{ marginBottom: "22px" }}>
              <label
                htmlFor="password"
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#4B5C7A",
                  marginBottom: "6px",
                  letterSpacing: "0.4px",
                  textTransform: "uppercase",
                }}
              >
                Mot de passe (min. 6 caractères) *
              </label>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                    color: focusField === "pwd" ? "#0B2559" : "#A0AABF",
                    transition: "color 0.18s ease",
                  }}
                >
                  <Lock size={17} />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusField("pwd")}
                  onBlur={() => setFocusField("")}
                  placeholder="Entrez votre mot de passe sécurisé"
                  autoComplete="new-password"
                  style={{
                    ...fieldBase,
                    paddingRight: "48px",
                    ...(focusField === "pwd" ? fieldFocused : {}),
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#A0AABF",
                    display: "flex",
                    alignItems: "center",
                    padding: "4px",
                    borderRadius: "6px",
                  }}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Bouton Création de Compte */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "15px 24px",
                borderRadius: "14px",
                border: "none",
                background: loading
                  ? "#9BA8BF"
                  : "linear-gradient(135deg, #0B2559 0%, #163B8A 100%)",
                color: "white",
                fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                fontWeight: 700,
                fontSize: "15px",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                boxShadow: loading ? "none" : "0 6px 20px rgba(11,37,89,0.30)",
                transition: "all 0.22s ease",
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                  <span>Création de votre compte...</span>
                </>
              ) : (
                <>
                  <span>Créer mon compte (Accès Plan Gratuit)</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* ── Séparateur Google ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              margin: "20px 0 16px",
            }}
          >
            <div style={{ flex: 1, height: "1px", background: "#E8EDF5" }} />
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#A0AABF",
                whiteSpace: "nowrap",
                letterSpacing: "0.3px",
              }}
            >
              Ou créer avec Google
            </span>
            <div style={{ flex: 1, height: "1px", background: "#E8EDF5" }} />
          </div>

          {/* ── Bouton Google OAuth ── */}
          <div>
            <GoogleAuthButton
              label="Créer mon compte avec Google"
              onError={(msg) => setError(msg)}
            />
          </div>

          {/* ── Lien Déjà inscrit ── */}
          <div
            style={{
              marginTop: "20px",
              padding: "14px",
              background: "#F8FAFC",
              border: "1.5px solid #E2E8F0",
              borderRadius: "14px",
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: "13px", color: "#475569", fontWeight: 600, marginRight: "8px" }}>
              Vous avez déjà un compte ?
            </span>
            <Link
              href="/connexion"
              style={{
                color: "#0B2559",
                fontWeight: 800,
                fontSize: "13px",
                textDecoration: "underline",
              }}
            >
              Se connecter
            </Link>
          </div>
        </div>

        {/* Footer info card */}
        <div
          style={{
            background: "#F7F9FD",
            borderTop: "1px solid #EEF2FB",
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "18px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#6B7A99", fontSize: "12px", fontWeight: 600 }}>
            <ShieldCheck size={14} style={{ color: "#059669" }} />
            <span>Accès sécurisé réservé aux membres 18+</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#6B7A99", fontSize: "12px", fontWeight: 600 }}>
            <Sparkles size={14} style={{ color: "#D97706" }} />
            <span>Plan Gratuit inclus</span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          EN SUITE (2ÈME POSITION) : PROPOSITION DES 4 PLANS DE PAIEMENT DU SITE
          AVEC LEUR DISPONIBILITÉ DE PAYER
      ══════════════════════════════════════════════════════════ */}
      <section style={{ width: "100%", maxWidth: "980px", textAlign: "center" }}>
        <div style={{ marginBottom: "26px" }}>
          <span style={{ fontSize: "12px", fontWeight: 800, color: "#E10600", textTransform: "uppercase", letterSpacing: "1px" }}>
            Adhésion & Formules du Club
          </span>
          <h2 style={{ fontSize: "clamp(1.5rem, 4.5vw, 2.1rem)", fontWeight: 800, color: "#0B2559", marginTop: "6px", marginBottom: "8px" }}>
            Les 4 Plans de Paiement disponibles sur Meet Me Club
          </h2>
          <p style={{ fontSize: "14px", color: "#64748B", maxWidth: "620px", margin: "0 auto", lineHeight: 1.6 }}>
            Démarrez librement avec le Plan Gratuit inclus à l&apos;inscription, ou souscrivez immédiatement à un pass illimité avec disponibilité de paiement sécurisé (Saspay, Carte, T-Money, Moov Money).
          </p>
        </div>

        {/* Grille des 4 Plans de Paiement */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "18px", textAlign: "left" }}>
          {MEMBERSHIP_PLANS.map((plan) => (
            <div
              key={plan.id}
              style={{
                background: "white",
                borderRadius: "20px",
                padding: "24px 20px",
                border: plan.highlight ? "2px solid #0B2559" : `1.5px solid ${plan.borderColor}`,
                boxShadow: plan.highlight ? "0 12px 32px rgba(11, 37, 89, 0.14)" : "0 4px 16px rgba(0,0,0,0.05)",
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
            >
              {/* Badge du Plan */}
              <div
                style={{
                  display: "inline-block",
                  alignSelf: "flex-start",
                  background: plan.badgeBg,
                  color: plan.badgeColor,
                  fontSize: "11px",
                  fontWeight: 800,
                  padding: "4px 10px",
                  borderRadius: "9999px",
                  marginBottom: "12px",
                }}
              >
                {plan.badge}
              </div>

              <div style={{ fontSize: "19px", fontWeight: 800, color: "#0B2559" }}>{plan.name}</div>

              <div style={{ fontSize: "26px", fontWeight: 800, color: "#E10600", margin: "8px 0 2px" }}>
                {plan.price}{" "}
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#64748B" }}>
                  {plan.id === "FREE" ? "FCFA" : "FCFA / mois"}
                </span>
              </div>

              <div style={{ fontSize: "12px", color: "#64748B", marginBottom: "14px", fontStyle: "italic" }}>
                {plan.period}
              </div>

              <p style={{ fontSize: "13px", color: "#475569", lineHeight: 1.45, marginBottom: "16px", minHeight: "38px" }}>
                {plan.desc}
              </p>

              {/* Liste des fonctionnalités incluses */}
              <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: "14px", display: "flex", flexDirection: "column", gap: "8px", flex: 1, marginBottom: "20px" }}>
                {plan.features.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "7px", fontSize: "12px", color: "#334155" }}>
                    <span style={{ color: "#10B981", fontWeight: 800 }}>✓</span>
                    <span style={{ lineHeight: 1.35 }}>{f}</span>
                  </div>
                ))}
              </div>

              {/* Bouton de disponibilité de paiement / souscription */}
              {plan.isFree ? (
                <a
                  href="#register-form"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: "12px",
                    background: "#EEF2FB",
                    color: "#0B2559",
                    fontWeight: 700,
                    fontSize: "13px",
                    textDecoration: "none",
                    border: "1.5px solid #CBD5E1",
                    boxSizing: "border-box",
                  }}
                >
                  <CheckCircle2 size={16} style={{ color: "#059669" }} />
                  <span>{plan.actionLabel}</span>
                </a>
              ) : (
                <a
                  href={plan.actionHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    background: plan.highlight
                      ? "linear-gradient(135deg, #E10600 0%, #B30500 100%)"
                      : "linear-gradient(135deg, #0B2559 0%, #163B8A 100%)",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "13px",
                    textDecoration: "none",
                    boxShadow: plan.highlight ? "0 4px 14px rgba(225,6,0,0.3)" : "0 4px 14px rgba(11,37,89,0.2)",
                    boxSizing: "border-box",
                  }}
                >
                  <span>💳 {plan.actionLabel}</span>
                </a>
              )}
            </div>
          ))}
        </div>

        {/* Moyens de paiement acceptés */}
        <div style={{ marginTop: "24px", fontSize: "12px", color: "#64748B", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
          <span>🔒 Paiement sécurisé par Saspay</span>
          <span>•</span>
          <span>📱 T-Money & Moov Money acceptés</span>
          <span>•</span>
          <span>💳 Cartes Bancaires (Visa / Mastercard)</span>
        </div>
      </section>
    </div>
  );
}
