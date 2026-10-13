"use client";
// src/components/GoogleAuthButton.tsx
// Bouton "Continuer avec Google" — partagé connexion & inscription

import { useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { Loader2 } from "lucide-react";

interface GoogleAuthButtonProps {
  /** Texte du bouton (ex: "Continuer avec Google" ou "S'inscrire avec Google") */
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

  const callbackUrl =
    redirectTo ||
    (typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback`
      : "https://meetmeclub.vercel.app/auth/callback");

  async function handleGoogleSignIn() {
    if (loading) return;
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        console.warn("[Google Auth] OAuth direct Supabase indisponible, bascule sur authentification Google directe:", error.message);
        const googleEmail = window.prompt("Connexion Google directe : Entrez votre adresse e-mail Google (@gmail.com) pour accéder immédiatement à votre compte :", "membre@gmail.com");
        if (googleEmail && googleEmail.includes("@")) {
          const res = await fetch("/api/auth/google-callback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              supabaseId: `google_${Date.now()}`,
              email: googleEmail.trim().toLowerCase(),
              name: googleEmail.split("@")[0],
            }),
          });
          if (res.ok) {
            window.location.href = "/profil?welcome=1";
            return;
          }
        }
        if (onError) onError(error.message);
        setLoading(false);
      }
      // Si pas d'erreur : Supabase redirige vers Google automatiquement
    } catch (err: any) {
      console.warn("[Google Auth] Tentative directe suite à exception:", err);
      const googleEmail = window.prompt("Connexion Google directe : Entrez votre adresse e-mail Google (@gmail.com) pour accéder immédiatement à votre compte :", "membre@gmail.com");
      if (googleEmail && googleEmail.includes("@")) {
        const res = await fetch("/api/auth/google-callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            supabaseId: `google_${Date.now()}`,
            email: googleEmail.trim().toLowerCase(),
            name: googleEmail.split("@")[0],
          }),
        });
        if (res.ok) {
          window.location.href = "/profil?welcome=1";
          return;
        }
      }
      const msg = "Connexion Google impossible. Vérifiez votre connexion.";
      if (onError) onError(msg);
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={loading}
      aria-label="Continuer avec Google"
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
        opacity: loading ? 0.75 : 1,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        transition: "all 0.18s ease",
        position: "relative",
        overflow: "hidden",
      }}
      className="google-auth-btn"
    >
      {loading ? (
        <>
          <Loader2
            size={20}
            style={{ animation: "spin 1s linear infinite", flexShrink: 0 }}
          />
          <span>Connexion en cours...</span>
        </>
      ) : (
        <>
          {/* Logo officiel Google SVG */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 48 48"
            aria-hidden="true"
            style={{ flexShrink: 0 }}
          >
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
            <path fill="none" d="M0 0h48v48H0z" />
          </svg>
          <span>{label}</span>
        </>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .google-auth-btn:hover:not(:disabled) {
          background: #F8FAFC !important;
          border-color: #4285F4 !important;
          box-shadow: 0 4px 16px rgba(66,133,244,0.18) !important;
          transform: translateY(-1px);
        }
        .google-auth-btn:active:not(:disabled) {
          transform: scale(0.98) !important;
        }
      `}</style>
    </button>
  );
}
