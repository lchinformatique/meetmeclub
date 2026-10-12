"use client";
// src/app/(auth)/inscription/page.tsx
// Page d'inscription simplifiée & rapide — Plan Gratuit direct avec Pseudo ou Email + Mot de passe

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
} from "lucide-react";
import GoogleAuthButton from "@/components/GoogleAuthButton";

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
        padding: "32px 16px",
      }}
    >
      {/* ── Bouton Retour ── */}
      <div style={{ width: "100%", maxWidth: "460px", marginBottom: "14px", display: "flex", justifyContent: "flex-start" }}>
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

      {/* ── CARD CONTAINER ── */}
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          background: "white",
          borderRadius: "24px",
          boxShadow: "0 4px 6px rgba(11,37,89,0.04), 0 20px 60px rgba(11,37,89,0.10)",
          border: "1px solid #E8EDF5",
          overflow: "hidden",
        }}
      >
        {/* Accent Bar */}
        <div
          style={{
            height: "4px",
            background: "linear-gradient(90deg, #0B2559 0%, #E10600 50%, #0B2559 100%)",
          }}
        />

        <div style={{ padding: "36px 36px 32px" }}>
          {/* ── Brand Header ── */}
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                textDecoration: "none",
                marginBottom: "16px",
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
                  Lomé · Togo
                </span>
              </div>
            </Link>

            <h1
              style={{
                fontSize: "22px",
                fontWeight: 800,
                color: "#0B2559",
                margin: "0 0 6px",
                letterSpacing: "-0.4px",
              }}
            >
              Rejoindre Meet Me Club
            </h1>
            <p style={{ fontSize: "14px", color: "#6B7A99", margin: 0, fontWeight: 500 }}>
              Accès immédiat et gratuit à votre profil membre
            </p>

            {/* Badge Plan Gratuit */}
            <div style={{ marginTop: "12px", display: "flex", justifyContent: "center" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "5px 12px",
                  borderRadius: "100px",
                  background: "#FEF3C7",
                  border: "1px solid #FDE68A",
                  color: "#92400E",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                <Sparkles size={13} style={{ color: "#D97706" }} />
                Plan Gratuit Inclus (3 partenaires de chat)
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

          {/* ── Bouton Google OAuth ── */}
          <div style={{ marginBottom: "20px" }}>
            <GoogleAuthButton
              label="Rejoindre avec Google"
              onError={(msg) => setError(msg)}
            />
          </div>

          {/* ── Séparateur ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "20px",
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
              Ou créer avec Pseudo / E-mail
            </span>
            <div style={{ flex: 1, height: "1px", background: "#E8EDF5" }} />
          </div>

          {/* ── FORM ── */}
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
                Pseudo ou Adresse e-mail
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
                  placeholder="Ex : Koffi_Lome ou email@exemple.com"
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
                Mot de passe (min. 6 caractères)
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
                  placeholder="Entrez votre mot de passe"
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

            {/* Submit */}
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
                  <span>Création de votre accès...</span>
                </>
              ) : (
                <>
                  <span>Accéder à mon Profil (Plan Gratuit)</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Déjà inscrit */}
          <div style={{ marginTop: "22px", paddingTop: "18px", borderTop: "1px solid #EEF2FB", textAlign: "center" }}>
            <p
              style={{
                fontSize: "14px",
                color: "#6B7A99",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                flexWrap: "wrap",
                margin: 0,
              }}
            >
              <span>Vous avez déjà un compte ?</span>
              <Link
                href="/connexion"
                style={{
                  fontWeight: 700,
                  color: "#0B2559",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  borderBottom: "1.5px solid rgba(11,37,89,0.25)",
                  paddingBottom: "1px",
                }}
              >
                <LogIn size={14} />
                Se connecter
              </Link>
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div
          style={{
            background: "#F7F9FD",
            borderTop: "1px solid #EEF2FB",
            padding: "14px 36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "18px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#6B7A99", fontSize: "12px", fontWeight: 600 }}>
            <ShieldCheck size={14} style={{ color: "#059669" }} />
            <span>Accès sécurisé 18+ Lomé</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#6B7A99", fontSize: "12px", fontWeight: 600 }}>
            <Sparkles size={14} style={{ color: "#D97706" }} />
            <span>Essai gratuit inclus</span>
          </div>
        </div>
      </div>
    </div>
  );
}
