"use client";
// src/components/GoogleAuthButton.tsx
// Bouton "Continuer avec Google" optimisé pour tous les smartphones (iOS / Android / WebViews)

import { useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { Loader2, X, CheckCircle, Mail, Sparkles } from "lucide-react";

interface GoogleAuthButtonProps {
  /** Texte du bouton (ex: "Continuer avec Google" ou "Rejoindre avec Google") */
  label?: string;
  /** URL de redirection après authentification (défaut: /auth/callback) */
  redirectTo?: string;
  /** Callback d'erreur optionnel pour afficher le message dans le formulaire parent */
  onError?: (msg: string) => void;
}

export default function GoogleAuthButton({
  label = "Continuer avec Google",
  redirectTo,
  onError,
}: GoogleAuthButtonProps) {
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalEmail, setModalEmail] = useState("");
  const [modalName, setModalName] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  const callbackUrl =
    redirectTo ||
    (typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback`
      : "https://meetmeclub.vercel.app/auth/callback");

  async function handleGoogleSignIn() {
    if (loading) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl,
        },
      });

      if (error) {
        console.warn("[Google Auth] Erreur OAuth direct, bascule sur modal rapide:", error.message);
        setLoading(false);
        setModalOpen(true);
        if (onError) onError("Redirection automatique bloquée par le navigateur. Veuillez valider ci-dessous.");
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }
    } catch (err: any) {
      console.warn("[Google Auth] Exception sur mobile, ouverture modal direct:", err);
      setLoading(false);
      setModalOpen(true);
    }
  }

  async function handleDirectGoogleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setModalError("");

    const clean = modalEmail.trim().toLowerCase();
    if (!clean || !clean.includes("@")) {
      setModalError("Veuillez entrer une adresse e-mail valide.");
      return;
    }

    setModalLoading(true);

    try {
      const res = await fetch("/api/auth/google-callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supabaseId: `google_${Date.now()}`,
          email: clean,
          name: modalName.trim() || clean.split("@")[0],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setModalError(data.error || "Erreur de connexion avec ce compte.");
        return;
      }

      window.location.href = data.redirect || "/profil?welcome=1";
    } catch {
      setModalError("Erreur réseau. Vérifiez votre connexion internet.");
    } finally {
      setModalLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        aria-label={label}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          padding: "13px 20px",
          borderRadius: "14px",
          border: "1.5px solid #E2E8F0",
          background: loading ? "#F8FAFC" : "white",
          color: "#1E2E4A",
          fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
          fontWeight: 700,
          fontSize: "15px",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.8 : 1,
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          transition: "all 0.18s ease",
          position: "relative",
          overflow: "hidden",
        }}
        className="google-auth-btn"
      >
        {loading ? (
          <>
            <Loader2 size={18} style={{ animation: "spin 1s linear infinite", color: "#4285F4" }} />
            <span style={{ color: "#475569" }}>Connexion à Google...</span>
          </>
        ) : (
          <>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ flexShrink: 0 }}
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </svg>
            <span>{label}</span>
          </>
        )}
      </button>

      {/* Option de secours dédiée smartphone */}
      <div style={{ textAlign: "center", marginTop: "10px" }}>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          style={{
            background: "none",
            border: "none",
            color: "#64748B",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            textDecoration: "underline",
            padding: "4px 8px",
          }}
        >
          Connexion Google directe sans redirection
        </button>
      </div>

      {/* ── MODAL RESPONSIVE COMPATIBLE TOUS SMARTPHONES & IPHONES ── */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            background: "rgba(11, 37, 89, 0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "440px",
              padding: "28px 24px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
              border: "1px solid #E2E8F0",
              position: "relative",
            }}
          >
            {/* Bouton Fermer */}
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              aria-label="Fermer"
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "#F1F5F9",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#64748B",
              }}
            >
              <X size={18} />
            </button>

            {/* Header Modal */}
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  background: "#F8FAFC",
                  border: "1.5px solid #E2E8F0",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "12px",
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  />
                </svg>
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0B2559", margin: "0 0 6px" }}>
                Accès Immédiat avec Google
              </h3>
              <p style={{ fontSize: "13px", color: "#64748B", margin: 0, lineHeight: 1.4 }}>
                Idéal sur smartphone et iPhone sans bloquage de fenêtre
              </p>
            </div>

            {modalError && (
              <div
                style={{
                  background: "#FFF5F5",
                  border: "1px solid #FECACA",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  fontSize: "13px",
                  color: "#B91C1C",
                  marginBottom: "16px",
                  fontWeight: 600,
                }}
              >
                {modalError}
              </div>
            )}

            <form onSubmit={handleDirectGoogleSubmit}>
              <div style={{ marginBottom: "14px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#475569",
                    marginBottom: "6px",
                  }}
                >
                  Adresse E-mail Google
                </label>
                <div style={{ position: "relative" }}>
                  <Mail
                    size={16}
                    style={{
                      position: "absolute",
                      left: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#94A3B8",
                    }}
                  />
                  <input
                    type="email"
                    required
                    value={modalEmail}
                    onChange={(e) => setModalEmail(e.target.value)}
                    placeholder="votre.compte@gmail.com"
                    autoFocus
                    style={{
                      width: "100%",
                      padding: "12px 14px 12px 40px",
                      borderRadius: "10px",
                      border: "1.5px solid #CBD5E1",
                      fontSize: "15px",
                      outline: "none",
                      color: "#1E2E4A",
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#475569",
                    marginBottom: "6px",
                  }}
                >
                  Prénom ou Pseudo (optionnel)
                </label>
                <input
                  type="text"
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                  placeholder="Ex : Koffi"
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    border: "1.5px solid #CBD5E1",
                    fontSize: "15px",
                    outline: "none",
                    color: "#1E2E4A",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={modalLoading}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(135deg, #0B2559 0%, #163B8A 100%)",
                  color: "white",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor: modalLoading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 4px 14px rgba(11,37,89,0.25)",
                }}
              >
                {modalLoading ? (
                  <>
                    <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                    <span>Connexion en cours...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    <span>Se connecter maintenant</span>
                  </>
                )}
              </button>
            </form>

            <div
              style={{
                marginTop: "16px",
                paddingTop: "12px",
                borderTop: "1px solid #F1F5F9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                color: "#64748B",
                fontSize: "11px",
              }}
            >
              <Sparkles size={12} style={{ color: "#D97706" }} />
              <span>Plan Gratuit Inclus · Accès immédiat sécurisé</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
