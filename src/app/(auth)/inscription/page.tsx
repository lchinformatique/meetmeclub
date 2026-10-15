"use client";
// src/app/(auth)/inscription/page.tsx
// Page d'inscription officielle Meet Me Club
// 1ère position : Formulaire de création de compte & Google Auth
// En suite : Proposition des 4 Plans de paiement d'adhésion (Gratuit, Essentiel, Complice, VIP) avec disponibilité de paiement

import { useState, useEffect } from "react";
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
  const [deviceLockedEmail, setDeviceLockedEmail] = useState<string | null>(null);

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusField, setFocusField] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const locked =
        localStorage.getItem("meetmeclub_primary_device_email") ||
        localStorage.getItem("meetmeclub_saved_identifier");
      if (locked) {
        setDeviceLockedEmail(locked);
        if (!identifier) {
          setIdentifier(locked);
        }
      }
    }
  }, [identifier]);

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

      if (typeof window !== "undefined") {
        localStorage.setItem("meetmeclub_saved_identifier", cleanInput);
        localStorage.setItem("meetmeclub_primary_device_email", cleanInput);
        localStorage.setItem("meetmeclub_last_auth_time", Date.now().toString());

        // Demander à Google Password Manager / Trousseau d'enregistrer le mot de passe
        if ((window as any).PasswordCredential && navigator.credentials?.store) {
          try {
            const cred = new (window as any).PasswordCredential({
              id: cleanInput,
              password,
              name: cleanInput,
            });
            await navigator.credentials.store(cred);
          } catch {}
        }
      }

      const target = data.redirect || "/profil?welcome=1";
      if (typeof window !== "undefined") {
        window.location.href = target;
      } else {
        router.push(target);
      }
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
          <form onSubmit={handleSubmit} noValidate method="POST" action="/api/auth/register" name="registerForm">
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
                  name="username"
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
                  name="password"
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

      {/* ── Formules d'accès & Abonnements (Design épuré et compact) ── */}
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          marginTop: "20px",
          textAlign: "center",
          padding: "16px 20px",
          background: "white",
          borderRadius: "18px",
          border: "1px solid #E2E8F0",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
        }}
      >
        <p style={{ fontSize: "13px", color: "#64748B", margin: "0 0 10px", lineHeight: 1.5 }}>
          Accès immédiat avec le <strong>Plan Gratuit 7 jours</strong> inclus. Vous pouvez également consulter toutes nos formules d&apos;adhésion (Pass Essentiel, Complice et Club VIP Prestige).
        </p>
        <Link
          href="/tarifs"
          style={{
            fontSize: "13px",
            fontWeight: 800,
            color: "#0B2559",
            textDecoration: "underline",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <span>Consulter nos plans d&apos;accès officiels</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}
