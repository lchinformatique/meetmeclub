"use client";
// src/app/(auth)/inscription/page.tsx
// Page d'inscription officielle Meet Me Club — Plan Gratuit direct avec profil complet & option Google

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  User,
  Mail,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  Loader2,
  AlertCircle,
  LogIn,
  CheckCircle2,
  ChevronLeft,
  Sparkles,
} from "lucide-react";
import GoogleAuthButton from "@/components/GoogleAuthButton";

export default function InscriptionPage() {
  const router = useRouter();

  // Form states
  const [firstName, setFirstName] = useState("");
  const [gender, setGender] = useState<"FEMALE" | "MALE" | "OTHER">("FEMALE");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusField, setFocusField] = useState("");

  // Password strength
  const pwStrength =
    password.length === 0
      ? 0
      : password.length < 6
      ? 1
      : password.length < 10
      ? 2
      : 3;

  const strengthLabel = ["", "Faible", "Moyen", "Fort"];
  const strengthColor = ["", "#EF4444", "#F59E0B", "#10B981"];

  function isAdultFront(dob: string): boolean {
    if (!dob) return false;
    const eighteenAgo = new Date();
    eighteenAgo.setFullYear(eighteenAgo.getFullYear() - 18);
    return new Date(dob) <= eighteenAgo;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!firstName.trim()) {
      setError("Veuillez renseigner votre prénom ou pseudo.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Veuillez saisir une adresse e-mail valide.");
      return;
    }
    if (!dateOfBirth) {
      setError("Veuillez indiquer votre date de naissance.");
      return;
    }
    if (!isAdultFront(dateOfBirth)) {
      setError("Meet Me Club est réservé exclusivement aux personnes majeures (18 ans et plus).");
      return;
    }
    if (!password || password.length < 6) {
      setError("Votre mot de passe doit comporter au moins 6 caractères.");
      return;
    }
    if (!termsAccepted) {
      setError("Veuillez accepter les Conditions Générales et attester avoir au moins 18 ans.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          pseudo: firstName.trim(),
          gender,
          email: email.trim(),
          dateOfBirth,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue lors de l'inscription.");
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
        padding: "24px 16px",
      }}
    >
      {/* ── Bouton Retour Mobile & Desktop ── */}
      <div style={{ width: "100%", maxWidth: "520px", marginBottom: "14px", display: "flex", justifyContent: "flex-start" }}>
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

      {/* ══════════════════════════════════════
          CARD CONTAINER
      ══════════════════════════════════════ */}
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
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

        <div style={{ padding: "32px 30px" }} className="inscription-inner-pad">
          {/* ── Brand Header ── */}
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                textDecoration: "none",
                marginBottom: "14px",
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
                  Club Privé International · Lomé, Togo
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
              Créer mon compte membre
            </h1>
            <p style={{ fontSize: "14px", color: "#6B7A99", margin: 0, fontWeight: 500 }}>
              Rejoignez la communauté et profitez immédiatement de votre accès gratuit
            </p>

            {/* Badges d'information */}
            <div style={{ marginTop: "12px", display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
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
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "5px 12px",
                  borderRadius: "100px",
                  background: "#F0FDF4",
                  border: "1px solid #A7F3D0",
                  color: "#047857",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                <ShieldCheck size={13} style={{ color: "#059669" }} />
                18 ans et plus
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

          {/* ── FORMULAIRE COMPLET ── */}
          <form onSubmit={handleSubmit} noValidate>
            {/* Row 1: Prénom / Pseudo & Genre */}
            <div
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}
              className="inscription-row"
            >
              {/* Prénom ou Pseudo */}
              <div>
                <label
                  htmlFor="firstName"
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
                  Prénom ou Pseudo
                </label>
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                      color: focusField === "firstName" ? "#0B2559" : "#A0AABF",
                      transition: "color 0.18s ease",
                    }}
                  >
                    <User size={17} />
                  </div>
                  <input
                    id="firstName"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    onFocus={() => setFocusField("firstName")}
                    onBlur={() => setFocusField("")}
                    placeholder="Ex : Koffi ou Afi"
                    autoComplete="given-name"
                    style={{
                      ...fieldBase,
                      ...(focusField === "firstName" ? fieldFocused : {}),
                    }}
                  />
                </div>
              </div>

              {/* Genre */}
              <div>
                <label
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
                  Genre
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
                  {[
                    { val: "FEMALE", label: "Femme" },
                    { val: "MALE", label: "Homme" },
                    { val: "OTHER", label: "Autre" },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setGender(item.val as typeof gender)}
                      style={{
                        padding: "11px 4px",
                        borderRadius: "10px",
                        border: gender === item.val ? "2px solid #0B2559" : "1.5px solid #D8E1EF",
                        background: gender === item.val ? "#0B2559" : "white",
                        color: gender === item.val ? "white" : "#4B5C7A",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.18s ease",
                        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Email */}
            <div style={{ marginBottom: "16px" }}>
              <label
                htmlFor="email"
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
                Adresse e-mail
              </label>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                    color: focusField === "email" ? "#0B2559" : "#A0AABF",
                    transition: "color 0.18s ease",
                  }}
                >
                  <Mail size={17} />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusField("email")}
                  onBlur={() => setFocusField("")}
                  placeholder="votre-email@exemple.com"
                  autoComplete="email"
                  style={{
                    ...fieldBase,
                    ...(focusField === "email" ? fieldFocused : {}),
                  }}
                />
              </div>
            </div>

            {/* Date de naissance */}
            <div style={{ marginBottom: "16px" }}>
              <label
                htmlFor="dateOfBirth"
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
                Date de naissance (18+ ans)
              </label>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                    color: focusField === "dob" ? "#0B2559" : "#A0AABF",
                    transition: "color 0.18s ease",
                  }}
                >
                  <Calendar size={17} />
                </div>
                <input
                  id="dateOfBirth"
                  type="date"
                  required
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  onFocus={() => setFocusField("dob")}
                  onBlur={() => setFocusField("")}
                  max={(() => {
                    const d = new Date();
                    d.setFullYear(d.getFullYear() - 18);
                    return d.toISOString().split("T")[0];
                  })()}
                  style={{
                    ...fieldBase,
                    ...(focusField === "dob" ? fieldFocused : {}),
                    colorScheme: "light",
                  }}
                />
              </div>
              <p style={{ fontSize: "11px", color: "#8B99B5", marginTop: "5px", fontWeight: 500, margin: "5px 0 0" }}>
                Réservé aux 18 ans et plus · Vos données restent strictement confidentielles
              </p>
            </div>

            {/* Mot de passe */}
            <div style={{ marginBottom: "20px" }}>
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
                  placeholder="Choisissez un mot de passe sécurisé"
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
                    justifyContent: "center",
                    padding: "4px",
                    borderRadius: "6px",
                  }}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              {/* Password strength bar */}
              {password.length > 0 && (
                <div style={{ marginTop: "8px" }}>
                  <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        style={{
                          flex: 1,
                          height: "3px",
                          borderRadius: "99px",
                          background: pwStrength >= level ? strengthColor[pwStrength] : "#E8EDF5",
                          transition: "background 0.3s ease",
                        }}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: strengthColor[pwStrength] }}>
                    Mot de passe {strengthLabel[pwStrength]}
                  </span>
                </div>
              )}
            </div>

            {/* Checkbox CGU */}
            <div
              style={{
                background: "#F7F9FD",
                border: "1.5px solid #E8EDF5",
                borderRadius: "12px",
                padding: "14px 16px",
                marginBottom: "20px",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  cursor: "pointer",
                }}
              >
                <div style={{ position: "relative", flexShrink: 0, marginTop: "2px" }}>
                  <input
                    type="checkbox"
                    required
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    style={{
                      width: "18px",
                      height: "18px",
                      cursor: "pointer",
                      accentColor: "#0B2559",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: "13px",
                    color: "#4B5C7A",
                    fontWeight: 500,
                    lineHeight: 1.5,
                  }}
                >
                  J&apos;atteste avoir <strong style={{ color: "#0B2559" }}>au moins 18 ans</strong> et
                  j&apos;accepte les{" "}
                  <Link
                    href="/legal/cgu"
                    style={{ color: "#E10600", fontWeight: 700, textDecoration: "underline" }}
                  >
                    Conditions Générales
                  </Link>{" "}
                  et la{" "}
                  <Link
                    href="/legal/charte"
                    style={{ color: "#E10600", fontWeight: 700, textDecoration: "underline" }}
                  >
                    Charte de Respect
                  </Link>
                  .
                </span>
              </label>
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
              className="submit-btn"
            >
              {loading ? (
                <>
                  <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                  <span>Création de votre accès...</span>
                </>
              ) : (
                <>
                  <span>Créer mon compte (Accès Gratuit)</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* ── Lien Déjà inscrit au-dessus de Google ── */}
          <div
            style={{
              marginTop: "20px",
              padding: "16px 14px",
              background: "#F8FAFC",
              border: "1.5px solid #E2E8F0",
              borderRadius: "16px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "14px", color: "#475569", fontWeight: 600, marginBottom: "8px" }}>
              Vous avez déjà un compte ?
            </div>
            <Link
              href="/connexion"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                width: "100%",
                padding: "12px 18px",
                borderRadius: "12px",
                background: "white",
                border: "1.5px solid #0B2559",
                color: "#0B2559",
                fontWeight: 700,
                fontSize: "14px",
                textDecoration: "none",
                boxShadow: "0 2px 8px rgba(11,37,89,0.06)",
              }}
            >
              <LogIn size={16} />
              <span>Se connecter à mon compte</span>
            </Link>
          </div>

          {/* ── Séparateur Google ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              margin: "22px 0 16px",
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
              Ou rejoindre avec Google
            </span>
            <div style={{ flex: 1, height: "1px", background: "#E8EDF5" }} />
          </div>

          {/* ── Bouton Google OAuth en Bas ── */}
          <div>
            <GoogleAuthButton
              label="Rejoindre avec Google"
              onError={(msg) => setError(msg)}
            />
          </div>
        </div>

        {/* Footer info */}
        <div
          style={{
            background: "#F7F9FD",
            borderTop: "1px solid #EEF2FB",
            padding: "14px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
          className="inscription-footer-pad"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#6B7A99", fontSize: "12px", fontWeight: 600 }}>
            <ShieldCheck size={14} style={{ color: "#059669" }} />
            <span>Accès sécurisé 18+ · Membres du monde entier</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#6B7A99", fontSize: "12px", fontWeight: 600 }}>
            <CheckCircle2 size={14} style={{ color: "#0B2559" }} />
            <span>Données protégées et confidentielles</span>
          </div>
        </div>
      </div>

      {/* Global styles for this page */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #163B8A 0%, #0B2559 100%) !important;
          box-shadow: 0 8px 28px rgba(11,37,89,0.38) !important;
          transform: translateY(-1px);
        }
        .submit-btn:active:not(:disabled) {
          transform: scale(0.98) !important;
        }

        input:focus {
          border-color: #0B2559 !important;
          box-shadow: 0 0 0 3px rgba(11,37,89,0.09) !important;
        }
        input[type="date"]::-webkit-calendar-picker-indicator {
          opacity: 0.5;
          cursor: pointer;
        }

        @media (max-width: 540px) {
          .inscription-inner-pad {
            padding: 24px 18px 20px !important;
          }
          .inscription-footer-pad {
            padding: 12px 16px !important;
          }
          .inscription-row {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
