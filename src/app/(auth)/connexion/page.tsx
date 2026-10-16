"use client";
// src/app/(auth)/connexion/page.tsx
// Login page — matches inscription white card design for brand consistency

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  Loader2,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ChevronLeft,
} from "lucide-react";
import GoogleAuthButton from "@/components/GoogleAuthButton";

function ConnexionForm() {
  const router = useRouter();
  const params = useSearchParams();
  // Page de retour demandée (uniquement une page du site, jamais un lien externe)
  const requestedUrl = params.get("callbackUrl");
  const hasCallback = Boolean(requestedUrl && requestedUrl.startsWith("/") && !requestedUrl.startsWith("//"));
  const callbackUrl = hasCallback ? (requestedUrl as string) : "/messages";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusField, setFocusField] = useState("");
  const [deviceLockedEmail, setDeviceLockedEmail] = useState<string | null>(null);

  // Vérifier si une session est déjà active pour rediriger automatiquement sans mot de passe
  useEffect(() => {
    async function checkExistingSession() {
      try {
        const lastAuth = typeof window !== "undefined" ? localStorage.getItem("meetmeclub_last_auth_time") : null;
        const now = Date.now();
        // Si moins de 20 minutes d'inactivité ou session active, reconnecter immédiatement
        const res = await fetch("/api/profiles/me");
        if (res.ok) {
          if (lastAuth && now - parseInt(lastAuth, 10) < 20 * 60 * 1000) {
            if (typeof window !== "undefined") {
              localStorage.setItem("meetmeclub_last_auth_time", now.toString());
            }
            router.replace(callbackUrl);
            return;
          } else {
            // Plus de 20 minutes d'inactivité : rafraîchir l'horodatage ou demander mot de passe
            router.replace(callbackUrl);
            return;
          }
        }
      } catch {}
    }
    checkExistingSession();
  }, [callbackUrl, router]);

  // Pré-remplir l'identifiant et verrouiller sur le compte principal de cet appareil
  useEffect(() => {
    if (typeof window !== "undefined") {
      const locked =
        localStorage.getItem("meetmeclub_primary_device_email") ||
        localStorage.getItem("meetmeclub_saved_identifier");
      if (locked) {
        setDeviceLockedEmail(locked);
        if (!email) {
          setEmail(locked);
        }
      }
    }
  }, [email]);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const cleanInput = email.trim();
    if (!cleanInput) {
      setError("Veuillez saisir votre adresse e-mail ou votre pseudo.");
      return;
    }
    if (!password) {
      setError("Veuillez entrer votre mot de passe.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: cleanInput, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Identifiants incorrects. Vérifiez votre e-mail ou pseudo et votre mot de passe.");
        return;
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("meetmeclub_saved_identifier", cleanInput);
        localStorage.setItem("meetmeclub_primary_device_email", cleanInput);
        localStorage.setItem("meetmeclub_last_auth_time", Date.now().toString());

        // Demander au navigateur / Compte Google d'enregistrer le mot de passe
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

      const target = hasCallback ? callbackUrl : data.redirect || callbackUrl;
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
  };

  return (
    <div style={{ width: "100%", maxWidth: "460px" }}>
      {/* ── Bouton Retour Mobile & Desktop ── */}
      <div style={{ marginBottom: "14px", display: "flex", justifyContent: "flex-start" }}>
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
          CARD
      ══════════════════════════════════════ */}
      <div
        style={{
          background: "white",
          borderRadius: "24px",
          boxShadow: "0 4px 6px rgba(11,37,89,0.04), 0 20px 60px rgba(11,37,89,0.10)",
          border: "1px solid #E8EDF5",
          overflow: "hidden",
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            height: "4px",
            background: "linear-gradient(90deg, #0B2559 0%, #E10600 50%, #0B2559 100%)",
          }}
        />

        <div style={{ padding: "36px 36px 32px" }} className="connexion-inner-pad">
          {/* Brand */}
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
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
                <span style={{ fontWeight: 800, fontSize: "20px", color: "#0B2559", letterSpacing: "-0.3px" }}>
                  meet <span style={{ color: "#E10600" }}>me</span> club
                </span>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "#8B99B5", letterSpacing: "0.9px", textTransform: "uppercase" }}>
                  Club Privé International · Sorties Togo
                </span>
              </div>
            </Link>

            <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0B2559", margin: "0 0 6px", letterSpacing: "-0.4px" }}>
              Connexion à votre compte
            </h1>
            <p style={{ fontSize: "14px", color: "#6B7A99", margin: 0, fontWeight: 500 }}>
              Accédez directement à votre profil et à vos conversations
            </p>

            <div style={{ marginTop: "12px", display: "flex", justifyContent: "center" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "5px 12px",
                  borderRadius: "100px",
                  background: "#EFF6FF",
                  border: "1px solid #BFDBFE",
                  color: "#1D4ED8",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                <ShieldCheck size={13} style={{ color: "#2563EB" }} />
                Espace Membre International Sécurisé
              </span>
            </div>
          </div>

          {/* Error */}
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
              <p style={{ fontSize: "13px", color: "#B91C1C", fontWeight: 600, margin: 0, lineHeight: 1.5 }}>
                {error}
              </p>
            </div>
          )}

          {/* Form Direct en Haut */}
          <form onSubmit={handleEmailLogin} noValidate method="POST" action="/api/auth/login" name="loginForm">
            {/* Email ou Pseudo */}
            <div style={{ marginBottom: "16px" }}>
              <label
                htmlFor="email"
                style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#4B5C7A", marginBottom: "6px", letterSpacing: "0.4px", textTransform: "uppercase" }}
              >
                Adresse e-mail ou Pseudo
              </label>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)",
                    pointerEvents: "none", color: focusField === "email" ? "#0B2559" : "#A0AABF",
                    transition: "color 0.18s ease",
                  }}
                >
                  <Mail size={17} />
                </div>
                <input
                  id="email"
                  name="username"
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusField("email")}
                  onBlur={() => setFocusField("")}
                  placeholder="votre-email@exemple.com ou votre_pseudo"
                  autoComplete="username"
                  style={{
                    ...fieldBase,
                    ...(focusField === "email" ? { borderColor: "#0B2559", boxShadow: "0 0 0 3px rgba(11,37,89,0.09)" } : {}),
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: "24px" }}>
              <label
                htmlFor="password"
                style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#4B5C7A", marginBottom: "6px", letterSpacing: "0.4px", textTransform: "uppercase" }}
              >
                Mot de passe
              </label>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)",
                    pointerEvents: "none", color: focusField === "pwd" ? "#0B2559" : "#A0AABF",
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
                  placeholder="Votre mot de passe"
                  autoComplete="current-password"
                  style={{
                    ...fieldBase,
                    paddingRight: "48px",
                    ...(focusField === "pwd" ? { borderColor: "#0B2559", boxShadow: "0 0 0 3px rgba(11,37,89,0.09)" } : {}),
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Masquer" : "Afficher"}
                  style={{
                    position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: "#A0AABF",
                    display: "flex", alignItems: "center", padding: "4px", borderRadius: "6px",
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
              className="connexion-submit-btn"
            >
              {loading ? (
                <>
                  <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <>
                  <span>Se connecter</span>
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
                color: "#8B99B5",
                whiteSpace: "nowrap",
                letterSpacing: "0.3px",
              }}
            >
              Ou continuer avec Google
            </span>
            <div style={{ flex: 1, height: "1px", background: "#E8EDF5" }} />
          </div>

          {/* ── Bouton Google OAuth Direct ── */}
          <div>
            <GoogleAuthButton
              label="Continuer avec Google"
              onError={(msg) => setError(msg)}
              onBeforeStart={() => {
                try {
                  if (hasCallback) localStorage.setItem("mmc_after_login", callbackUrl);
                  else localStorage.removeItem("mmc_after_login");
                } catch {}
                return true;
              }}
            />
          </div>

          {/* ── Lien Créer un Compte Simple et Élégant ── */}
          <div style={{ marginTop: "22px", textAlign: "center" }}>
            <span style={{ fontSize: "14px", color: "#64748B", fontWeight: 500 }}>
              Pas encore de compte ?{" "}
            </span>
            <Link
              href="/inscription"
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#E10600",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span>Créer un compte gratuit</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Card bottom bar */}
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
          className="connexion-footer-pad"
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "#8B99B5", fontWeight: 600 }}>
            <CheckCircle2 size={12} style={{ color: "#059669" }} />
            Connexion sécurisée et chiffrée
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "#8B99B5", fontWeight: 600 }}>
            <LogIn size={12} style={{ color: "#0B2559" }} />
            Meet Me Club · Lomé
          </span>
        </div>
      </div>

      <p style={{ marginTop: "20px", fontSize: "12px", color: "#A0AABF", textAlign: "center", fontWeight: 500 }}>
        © 2026 Meet Me Club — Tous droits réservés
      </p>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .connexion-submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #163B8A 0%, #0B2559 100%) !important;
          box-shadow: 0 8px 28px rgba(11,37,89,0.38) !important;
          transform: translateY(-1px);
        }
        .connexion-submit-btn:active:not(:disabled) {
          transform: scale(0.98) !important;
        }
        input:focus {
          border-color: #0B2559 !important;
          box-shadow: 0 0 0 3px rgba(11,37,89,0.09) !important;
        }
        @media (max-width: 480px) {
          .connexion-inner-pad { padding: 24px 20px 22px !important; }
          .connexion-footer-pad { padding: 12px 20px !important; }
        }
      `}</style>
    </div>
  );
}

export default function ConnexionPage() {
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
      <Suspense fallback={<div style={{ color: "#0B2559", padding: "40px", fontWeight: 600 }}>Chargement...</div>}>
        <ConnexionForm />
      </Suspense>
    </div>
  );
}
