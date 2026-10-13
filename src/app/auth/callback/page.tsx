"use client";
// src/app/auth/callback/page.tsx
// Page de callback OAuth — reçoit le code Google, échange via Supabase,
// puis synchronise avec notre système (Prisma) et redirige l'utilisateur

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { supabase } from "@/lib/supabase-client";
import Image from "next/image";

function AuthCallbackHandler() {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function handleCallback() {
      // Vérifier les erreurs transmises par Supabase / Google
      const errorParam = params.get("error");
      const errorDescription = params.get("error_description");

      if (errorParam) {
        const msg =
          errorDescription ||
          "Connexion avec Google annulée ou refusée. Veuillez réessayer.";
        setErrorMsg(msg);
        setStatus("error");
        return;
      }

      try {
        const code = params.get("code");

        // 1. Si un code PKCE est présent dans l'URL, l'échanger contre une session
        if (code) {
          const { data: exchangedData, error: exchangedError } =
            await supabase.auth.exchangeCodeForSession(code);

          if (exchangedError) {
            console.error("[Auth Callback] Erreur exchangeCodeForSession:", exchangedError.message);
          } else if (exchangedData?.session?.user) {
            await syncUserWithBackend(exchangedData.session.user);
            return;
          }
        }

        // 2. Vérifier si la session existe déjà (ex: flux implicite avec hash URL ou déjà stockée)
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        const session = sessionData?.session;

        if (!session?.user) {
          // Attendre un court délai au cas où Supabase traite le hash/code en arrière-plan
          await new Promise((r) => setTimeout(r, 1200));
          const { data: retryData, error: retryError } =
            await supabase.auth.getSession();

          if (retryError || !retryData?.session?.user) {
            throw new Error("Session non établie après authentification Google.");
          }

          await syncUserWithBackend(retryData.session.user);
          return;
        }

        await syncUserWithBackend(session.user);
      } catch (err: unknown) {
        console.error("[Auth Callback] Erreur:", err);
        const message =
          err instanceof Error ? err.message : "Erreur d'authentification inconnue.";
        setErrorMsg(message);
        setStatus("error");
      }
    }

    async function syncUserWithBackend(user: {
      id: string;
      email?: string | null;
      user_metadata?: Record<string, unknown>;
    }) {
      try {
        // Synchroniser avec notre base Prisma via API
        const res = await fetch("/api/auth/google-callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            supabaseId: user.id,
            email: user.email,
            name:
              (user.user_metadata?.full_name as string) ||
              (user.user_metadata?.name as string) ||
              "",
            avatarUrl:
              (user.user_metadata?.avatar_url as string) ||
              (user.user_metadata?.picture as string) ||
              null,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            data.error || `Erreur serveur (${res.status}) lors de la synchronisation du compte.`
          );
        }

        const data = await res.json();
        // Redirection selon le statut du compte
        router.replace(data.redirect || "/decouverte");
      } catch (err: unknown) {
        console.error("[Sync Backend] Erreur:", err);
        const message =
          err instanceof Error ? err.message : "Erreur synchronisation compte.";
        setErrorMsg(message);
        setStatus("error");
      }
    }

    handleCallback();
  }, [params, router]);

  if (status === "error") {
    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 16px",
          background: "linear-gradient(160deg, #F5F7FF 0%, #EEF4FF 40%, #F9F3FF 100%)",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: "24px",
            padding: "40px 32px",
            maxWidth: "420px",
            width: "100%",
            textAlign: "center",
            boxShadow: "0 20px 60px rgba(11,37,89,0.12)",
            border: "1px solid #E8EDF5",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
          <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#0B2559", marginBottom: "12px" }}>
            Connexion impossible
          </h1>
          <p style={{ fontSize: "14px", color: "#6B7A99", lineHeight: 1.6, marginBottom: "24px" }}>
            {errorMsg}
          </p>
          <button
            onClick={() => router.replace("/connexion")}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "12px",
              border: "none",
              background: "linear-gradient(135deg, #0B2559, #163B8A)",
              color: "white",
              fontWeight: 700,
              fontSize: "15px",
              cursor: "pointer",
            }}
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
        background: "linear-gradient(160deg, #F5F7FF 0%, #EEF4FF 40%, #F9F3FF 100%)",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "24px",
          padding: "48px 32px",
          maxWidth: "380px",
          width: "100%",
          textAlign: "center",
          boxShadow: "0 20px 60px rgba(11,37,89,0.12)",
          border: "1px solid #E8EDF5",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            border: "2px solid rgba(11,37,89,0.10)",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            padding: "6px",
            background: "white",
            boxShadow: "0 4px 16px rgba(11,37,89,0.12)",
          }}
        >
          <Image
            src="/logo.png"
            alt="Meet Me Club"
            width={52}
            height={52}
            style={{ objectFit: "contain" }}
            priority
          />
        </div>

        {/* Spinner animé */}
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            border: "3px solid #EEF2FB",
            borderTopColor: "#0B2559",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 20px",
          }}
        />

        <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0B2559", marginBottom: "8px" }}>
          Connexion en cours...
        </h2>
        <p style={{ fontSize: "13px", color: "#8B99B5", fontWeight: 500 }}>
          Vérification de votre compte Google. Veuillez patienter.
        </p>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100dvh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(160deg, #F5F7FF 0%, #EEF4FF 40%, #F9F3FF 100%)",
          }}
        >
          <div style={{ color: "#0B2559", fontWeight: 700, fontSize: "16px" }}>
            Chargement...
          </div>
        </div>
      }
    >
      <AuthCallbackHandler />
    </Suspense>
  );
}
