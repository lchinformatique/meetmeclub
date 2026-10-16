"use client";
// src/app/(public)/rejoindre/page.tsx
// Portail d'accès sécurisé et d'adhésion au Club Meet Me Club
// Accès bloqué par les identifiants avec attribution automatique du Plan Gratuit dès le premier accès

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import {
  Lock,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  LogIn,
  UserPlus,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Clock,
  Heart,
  MessageCircle,
} from "lucide-react";
import GoogleAuthButton from "@/components/GoogleAuthButton";

export default function RejoindrePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // État de session de l'utilisateur
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Formulaire Connexion
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Formulaire Inscription (Premier accès Plan Gratuit)
  const [regFirstName, setRegFirstName] = useState("");
  const [regIdentifier, setRegIdentifier] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regGender, setRegGender] = useState("OTHER");
  const [regAdultConsent, setRegAdultConsent] = useState(true);

  // Vérifier si l'utilisateur est déjà connecté & lire l'onglet demandé
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") || params.get("action");
      if (tabParam === "register" || tabParam === "inscription") {
        setActiveTab("register");
      }
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.authenticated && data.user) {
            setSessionUser(data.user);
          }
        }
      } catch {
        // non connecté
      } finally {
        if (isMounted) setCheckingSession(false);
      }
    }
    checkAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  // 1. Soumission Connexion (Identification)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!loginIdentifier.trim()) {
      setErrorMsg("Veuillez entrer votre identifiant (e-mail ou pseudo).");
      return;
    }
    if (!loginPassword) {
      setErrorMsg("Veuillez entrer votre mot de passe.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: loginIdentifier.trim(),
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Identifiants incorrects. Veuillez vérifier ou créer votre compte.");
      } else {
        setSuccessMsg("Connexion réussie ! Redirection vers le club...");
        setTimeout(() => {
          router.push(data.redirect || "/decouverte");
          router.refresh();
        }, 600);
      }
    } catch {
      setErrorMsg("Erreur réseau. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Soumission Inscription (Premier Accès & Activation Plan Gratuit)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!regIdentifier.trim()) {
      setErrorMsg("Veuillez entrer votre e-mail ou pseudo pour créer votre compte.");
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setErrorMsg("Le mot de passe doit comporter au moins 6 caractères.");
      return;
    }
    if (!regAdultConsent) {
      setErrorMsg("Vous devez certifier avoir au moins 18 ans pour rejoindre le club.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: regIdentifier.trim(),
          firstName: regFirstName.trim() || regIdentifier.trim().split("@")[0],
          password: regPassword,
          gender: regGender,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Impossible de finaliser l'inscription.");
      } else {
        setSuccessMsg("Bienvenue ! Votre Plan Gratuit (7 jours offerts) est activé. Accès au club en cours...");
        setTimeout(() => {
          router.push("/profil?welcome=1");
          router.refresh();
        }, 900);
      }
    } catch {
      setErrorMsg("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };



  return (
    <div style={{ minHeight: "100dvh", background: "#F8FAFC", display: "flex", flexDirection: "column" }}>
      {/* ── Age Gate Top Banner ────────────────────────────── */}
      <div
        style={{
          background: "var(--color-blue)",
          color: "white",
          textAlign: "center",
          padding: "8px 16px",
          fontSize: "13px",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
        <span>Plateforme réservée aux adultes de 18 ans et plus — Accès strictement réservé aux personnes majeures</span>
      </div>

      <Header />

      <main style={{ flex: 1, padding: "32px 16px 64px" }}>
        <div style={{ maxWidth: "560px", margin: "0 auto", width: "100%" }}>
          {/* Header de la page */}
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 16px",
                borderRadius: "9999px",
                background: "rgba(11, 37, 89, 0.08)",
                border: "1.5px solid rgba(11, 37, 89, 0.15)",
                color: "#0B2559",
                fontSize: "13px",
                fontWeight: 700,
                marginBottom: "14px",
              }}
            >
              <Lock size={15} className="text-red-600" />
              <span>Espace Privé Membres · Lomé, Togo</span>
            </div>

            <h1
              style={{
                fontSize: "clamp(1.8rem, 5vw, 2.5rem)",
                fontWeight: 800,
                color: "#0B2559",
                marginBottom: "10px",
                lineHeight: 1.2,
              }}
            >
              Rejoindre <span style={{ color: "#E10600" }}>Meet Me Club</span>
            </h1>

            <p style={{ fontSize: "14px", color: "#64748B", lineHeight: 1.6, maxWidth: "460px", margin: "0 auto" }}>
              L&apos;accès à la communauté et aux réservations de rendez-vous est réservé aux membres identifiés.
            </p>
          </div>

          {/* Si l'utilisateur est DÉJÀ CONNECTÉ */}
          {!checkingSession && sessionUser ? (
            <div
              style={{
                background: "white",
                borderRadius: "24px",
                padding: "32px 24px",
                boxShadow: "0 10px 30px rgba(11, 37, 89, 0.08)",
                border: "1.5px solid #E2E8F0",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background: "rgba(16, 185, 129, 0.12)",
                  color: "#059669",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 18px",
                }}
              >
                <CheckCircle2 size={36} />
              </div>

              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0B2559", marginBottom: "8px" }}>
                Vous êtes déjà connecté(e) !
              </h2>
              <p style={{ fontSize: "14px", color: "#64748B", marginBottom: "24px" }}>
                Ravi de vous revoir, <strong>{sessionUser.firstName || "Membre"}</strong>. Votre espace et vos avantages membres sont prêts.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <Link
                  href="/decouverte"
                  className="btn btn-primary btn-lg"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  Explorer les profils à Lomé →
                </Link>
                <Link
                  href="/profil"
                  className="btn btn-outline-blue"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  Accéder à mon Profil & Paramètres
                </Link>
              </div>
            </div>
          ) : (
            /* Carte de Verrouillage & Identification */
            <div
              style={{
                background: "white",
                borderRadius: "24px",
                padding: "28px 24px",
                boxShadow: "0 12px 36px rgba(11, 37, 89, 0.09)",
                border: "1.5px solid #E2E8F0",
              }}
            >
              {/* Bannière Premier Accès = Plan Gratuit Offert */}
              <div
                style={{
                  background: "linear-gradient(135deg, #0B2559 0%, #153B8A 100%)",
                  borderRadius: "16px",
                  padding: "16px",
                  color: "white",
                  marginBottom: "24px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  boxShadow: "0 6px 18px rgba(11, 37, 89, 0.2)",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: "2px",
                  }}
                >
                  <Sparkles size={18} className="text-amber-300" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: "#FFD700", marginBottom: "2px" }}>
                    🎁 Premier accès au site : Plan Gratuit activé !
                  </div>
                  <p style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.9)", lineHeight: 1.5, margin: 0 }}>
                    Chaque nouveau membre bénéficie automatiquement de <strong>7 jours d&apos;essai gratuit</strong> avec 3 contacts offerts pour échanger librement et découvrir nos rendez-vous partenaires.
                  </p>
                </div>
              </div>

              {/* Onglets : S'identifier ou Premier Accès */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                  background: "#F1F5F9",
                  padding: "6px",
                  borderRadius: "14px",
                  marginBottom: "24px",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("login");
                    setErrorMsg("");
                  }}
                  style={{
                    padding: "11px 16px",
                    borderRadius: "10px",
                    border: "none",
                    fontWeight: 700,
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    background: activeTab === "login" ? "white" : "transparent",
                    color: activeTab === "login" ? "#0B2559" : "#64748B",
                    boxShadow: activeTab === "login" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                  }}
                >
                  <LogIn size={16} />
                  <span>S&apos;identifier</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("register");
                    setErrorMsg("");
                  }}
                  style={{
                    padding: "11px 16px",
                    borderRadius: "10px",
                    border: "none",
                    fontWeight: 700,
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    background: activeTab === "register" ? "white" : "transparent",
                    color: activeTab === "register" ? "#E10600" : "#64748B",
                    boxShadow: activeTab === "register" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                  }}
                >
                  <UserPlus size={16} />
                  <span>Nouveau membre</span>
                </button>
              </div>

              {/* Messages d'erreur ou succès */}
              {errorMsg && (
                <div
                  style={{
                    background: "#FEF2F2",
                    border: "1.5px solid #FECACA",
                    color: "#DC2626",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    fontSize: "13px",
                    fontWeight: 500,
                    marginBottom: "18px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <AlertCircle size={17} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div
                  style={{
                    background: "#ECFDF5",
                    border: "1.5px solid #A7F3D0",
                    color: "#059669",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    fontSize: "13px",
                    fontWeight: 600,
                    marginBottom: "18px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <CheckCircle2 size={17} className="shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Bouton Connexion Google (Rapide & Direct) */}
              <div style={{ marginBottom: "20px" }}>
                <GoogleAuthButton
                  label="Continuer avec Google (1 clic)"
                  onError={(msg) => setErrorMsg(msg)}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  margin: "18px 0",
                  color: "#94A3B8",
                  fontSize: "12px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                <div style={{ flex: 1, height: "1px", background: "#E2E8F0" }} />
                <span>OU AVEC VOS IDENTIFIANTS</span>
                <div style={{ flex: 1, height: "1px", background: "#E2E8F0" }} />
              </div>

              {/* ONGLET 1 : S'identifier */}
              {activeTab === "login" && (
                <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                      Identifiant (E-mail ou Pseudo)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: essikofi@gmail.com ou essikofi"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: "12px",
                        border: "1.5px solid #CBD5E1",
                        fontSize: "15px",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <label style={{ fontSize: "13px", fontWeight: 700, color: "#334155" }}>Mot de passe</label>
                      <Link href="/contact" style={{ fontSize: "12px", color: "#E10600", textDecoration: "none", fontWeight: 600 }}>
                        Besoin d&apos;aide ?
                      </Link>
                    </div>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Votre mot de passe"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "12px 42px 12px 14px",
                          borderRadius: "12px",
                          border: "1.5px solid #CBD5E1",
                          fontSize: "15px",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        style={{
                          position: "absolute",
                          right: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#94A3B8",
                        }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                    style={{
                      width: "100%",
                      padding: "14px 20px",
                      borderRadius: "12px",
                      fontSize: "15px",
                      fontWeight: 700,
                      justifyContent: "center",
                      marginTop: "6px",
                    }}
                  >
                    {loading ? "Vérification..." : "S'identifier et accéder au Club →"}
                  </button>

                  {/* Séparateur Google */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "14px 0 10px" }}>
                    <div style={{ flex: 1, height: "1px", background: "#E2E8F0" }} />
                    <span style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 600 }}>OU</span>
                    <div style={{ flex: 1, height: "1px", background: "#E2E8F0" }} />
                  </div>

                  {/* Google Login */}
                  <GoogleAuthButton
                    label="Continuer avec Google"
                    onError={(msg) => setErrorMsg(msg)}
                  />
                </form>
              )}

              {/* ONGLET 2 : Nouveau Membre (Premier Accès) */}
              {activeTab === "register" && (
                <form onSubmit={handleRegisterSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                      Prénom ou Pseudo public
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Essi ou Kofi"
                      value={regFirstName}
                      onChange={(e) => setRegFirstName(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: "12px",
                        border: "1.5px solid #CBD5E1",
                        fontSize: "15px",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                      Adresse E-mail ou Pseudo de connexion *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: essi.kofi@gmail.com"
                      value={regIdentifier}
                      onChange={(e) => setRegIdentifier(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: "12px",
                        border: "1.5px solid #CBD5E1",
                        fontSize: "15px",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                      Mot de passe (min. 6 caractères) *
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Créer un mot de passe sécurisé"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "12px 42px 12px 14px",
                          borderRadius: "12px",
                          border: "1.5px solid #CBD5E1",
                          fontSize: "15px",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        style={{
                          position: "absolute",
                          right: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#94A3B8",
                        }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                      Je suis
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <button
                        type="button"
                        onClick={() => setRegGender("FEMALE")}
                        style={{
                          padding: "10px",
                          borderRadius: "10px",
                          border: regGender === "FEMALE" ? "2px solid #E10600" : "1.5px solid #CBD5E1",
                          background: regGender === "FEMALE" ? "#FFF5F5" : "white",
                          color: regGender === "FEMALE" ? "#E10600" : "#334155",
                          fontWeight: 700,
                          fontSize: "13px",
                          cursor: "pointer",
                        }}
                      >
                        👩 Une Femme
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegGender("MALE")}
                        style={{
                          padding: "10px",
                          borderRadius: "10px",
                          border: regGender === "MALE" ? "2px solid #0B2559" : "1.5px solid #CBD5E1",
                          background: regGender === "MALE" ? "#EEF2FB" : "white",
                          color: regGender === "MALE" ? "#0B2559" : "#334155",
                          fontWeight: 700,
                          fontSize: "13px",
                          cursor: "pointer",
                        }}
                      >
                        👨 Un Homme
                      </button>
                    </div>
                  </div>

                  <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer", marginTop: "4px" }}>
                    <input
                      type="checkbox"
                      checked={regAdultConsent}
                      onChange={(e) => setRegAdultConsent(e.target.checked)}
                      style={{ marginTop: "3px", width: "16px", height: "16px", accentColor: "#E10600" }}
                    />
                    <span style={{ fontSize: "12px", color: "#475569", lineHeight: 1.4 }}>
                      Je certifie être majeur(e) (18 ans ou plus) et j&apos;accepte les conditions de discrétion et respect du club. 🔞
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                    style={{
                      width: "100%",
                      padding: "14px 20px",
                      borderRadius: "12px",
                      fontSize: "15px",
                      fontWeight: 700,
                      justifyContent: "center",
                      marginTop: "4px",
                    }}
                  >
                    {loading ? "Création en cours..." : "Créer mon compte & Activer le Plan Gratuit →"}
                  </button>

                  {/* Séparateur Google */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "14px 0 10px" }}>
                    <div style={{ flex: 1, height: "1px", background: "#E2E8F0" }} />
                    <span style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 600 }}>OU</span>
                    <div style={{ flex: 1, height: "1px", background: "#E2E8F0" }} />
                  </div>

                  {/* Google Register */}
                  <GoogleAuthButton
                    label="Créer mon compte avec Google"
                    onError={(msg) => setErrorMsg(msg)}
                  />
                </form>
              )}
            </div>
          )}

          {/* ── Présentation des 4 Plans d'Adhésion du Club ── */}
          <div style={{ marginTop: "48px", textAlign: "center" }}>
            <div style={{ marginBottom: "20px" }}>
              <span style={{ fontSize: "12px", fontWeight: 800, color: "#E10600", textTransform: "uppercase", letterSpacing: "1px" }}>
                Formules d&apos;adhésion au Club
              </span>
              <h3 style={{ fontSize: "clamp(1.4rem, 4vw, 1.9rem)", fontWeight: 800, color: "#0B2559", marginTop: "6px" }}>
                Les 4 Plans disponibles sur Meet Me Club
              </h3>
              <p style={{ fontSize: "13px", color: "#64748B", maxWidth: "480px", margin: "8px auto 0" }}>
                Chaque nouvel inscrit commence automatiquement avec le <strong>Plan Gratuit</strong>, puis peut évoluer librement vers un pass illimité avec paiement sécurisé.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", textAlign: "left" }}>
              {[
                {
                  id: "FREE",
                  name: "Plan Gratuit",
                  badge: "🎁 Inclus à l'inscription",
                  badgeBg: "rgba(16, 185, 129, 0.12)",
                  badgeColor: "#059669",
                  price: "0",
                  period: "Essai 7 jours offert",
                  desc: "Votre premier accès au club avec toutes les fonctionnalités essentielles pour tester.",
                  features: [
                    "7 jours d'essai sans engagement",
                    "Échanger avec jusqu'à 3 partenaires",
                    "Messages écrits, photos & vocaux",
                    "Visibilité dans l'espace Découverte",
                    "Réservation de rendez-vous disponible",
                  ],
                  highlight: false,
                  borderColor: "#CBD5E1",
                  actionLabel: "Inclus à l'inscription ✓",
                  actionHref: "#",
                  isFree: true,
                },
                {
                  id: "ESSENTIAL",
                  name: "Pass Essentiel",
                  badge: "⭐ Populaire · Échange Libre",
                  badgeBg: "rgba(11, 37, 89, 0.1)",
                  badgeColor: "#0B2559",
                  price: "3 000",
                  period: "FCFA / mois",
                  desc: "Discussions sans compter, liberté totale de discussion et amitié sans limite.",
                  features: [
                    "Tous les avantages du Plan Gratuit",
                    "Partenaires & discussions 100% ILLIMITÉS",
                    "Messages, photos et vocaux illimités",
                    "Voir qui a visité et liké votre profil",
                    "Badge officiel membre certifié",
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
                  desc: "Échanges illimités + tables réservées et consommations offertes en lieux partenaires.",
                  features: [
                    "Tout le Pass Essentiel en illimité",
                    "Réservations de tables prioritaires",
                    "1 consommation offerte / pers. au RDV",
                    "QR code de validation au comptoir",
                    "Rappels automatiques SMS / WhatsApp",
                  ],
                  highlight: false,
                  borderColor: "#CBD5E1",
                  actionLabel: "Choisir ce plan (6 000 F)",
                  actionHref: "https://link.saspay.me/xiigac37eyq",
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
                  desc: "Salons privés, appels vidéo en direct, dîners gastronomiques et conciergerie dédiée.",
                  features: [
                    "Tout le Pass Complice en illimité",
                    "Appels vidéo en direct débloqués (VIP)",
                    "Salons VIP et rooftops réservés",
                    "Dîner gastronomique complet mensuel",
                    "Conciergerie privée Meet Me Club 24/7",
                  ],
                  highlight: false,
                  borderColor: "#D97706",
                  actionLabel: "Choisir ce plan (15 000 F)",
                  actionHref: "https://link.saspay.me/ksev91xlvik",
                  isFree: false,
                },
              ].map((plan) => (
                <div
                  key={plan.id}
                  style={{
                    background: "white",
                    borderRadius: "18px",
                    padding: "20px 18px",
                    border: plan.highlight ? "2px solid #0B2559" : `1.5px solid ${plan.borderColor}`,
                    boxShadow: plan.highlight ? "0 10px 28px rgba(11, 37, 89, 0.12)" : "0 4px 14px rgba(0,0,0,0.04)",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                  }}
                >
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
                      marginBottom: "10px",
                    }}
                  >
                    {plan.badge}
                  </div>

                  <div style={{ fontSize: "18px", fontWeight: 800, color: "#0B2559" }}>{plan.name}</div>

                  <div style={{ fontSize: "24px", fontWeight: 800, color: "#E10600", margin: "6px 0 2px" }}>
                    {plan.price} <span style={{ fontSize: "13px", fontWeight: 700, color: "#64748B" }}>{plan.id === "FREE" ? "FCFA" : "FCFA / mois"}</span>
                  </div>

                  <div style={{ fontSize: "11px", color: "#64748B", marginBottom: "12px", fontStyle: "italic" }}>
                    {plan.period}
                  </div>

                  <p style={{ fontSize: "12px", color: "#475569", lineHeight: 1.45, marginBottom: "14px", minHeight: "34px" }}>
                    {plan.desc}
                  </p>

                  <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "8px", flex: 1, marginBottom: "16px" }}>
                    {plan.features.map((f, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "7px", fontSize: "12px", color: "#334155" }}>
                        <span style={{ color: "#10B981", fontWeight: 800 }}>✓</span>
                        <span style={{ lineHeight: 1.35 }}>{f}</span>
                      </div>
                    ))}
                  </div>

                  {/* Bouton disponibilité paiement */}
                  {plan.isFree ? (
                    <button
                      type="button"
                      onClick={() => {
                        window.scrollTo({ top: 0, behavior: "smooth" });
                        setActiveTab("register");
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        background: "#EEF2FB",
                        color: "#0B2559",
                        fontWeight: 700,
                        fontSize: "12px",
                        border: "1px solid #CBD5E1",
                        cursor: "pointer",
                      }}
                    >
                      <CheckCircle2 size={15} style={{ color: "#059669" }} />
                      <span>{plan.actionLabel}</span>
                    </button>
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
                        padding: "11px 14px",
                        borderRadius: "10px",
                        background: plan.highlight
                          ? "linear-gradient(135deg, #E10600 0%, #B30500 100%)"
                          : "linear-gradient(135deg, #0B2559 0%, #163B8A 100%)",
                        color: "white",
                        fontWeight: 700,
                        fontSize: "12px",
                        textDecoration: "none",
                        boxShadow: plan.highlight ? "0 4px 12px rgba(225,6,0,0.25)" : "0 4px 12px rgba(11,37,89,0.15)",
                        boxSizing: "border-box",
                      }}
                    >
                      <span>💳 {plan.actionLabel}</span>
                    </a>
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginTop: "24px", fontSize: "12px", color: "#64748B", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
              <span>🔒 Paiement sécurisé par Saspay</span>
              <span>•</span>
              <span>📱 T-Money, Moov Money, Mixx by yas</span>
              <span>•</span>
              <span>💳 Carte Bancaire</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
