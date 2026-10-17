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
          } else if (exchangedData?.session?.access_token) {
            await syncUserWithBackend(exchangedData.session.access_token);
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

          if (retryError || !retryData?.session?.access_token) {
            throw new Error("Session non établie après authentification Google.");
          }

          await syncUserWithBackend(retryData.session.access_token);
          return;
        }

        await syncUserWithBackend(session.access_token);
      } catch (err: unknown) {
        console.error("[Auth Callback] Erreur:", err);
        const message =
          err instanceof Error ? err.message : "Erreur d'authentification inconnue.";
        setErrorMsg(message);
        setStatus("error");
      }
    }

    async function syncUserWithBackend(accessToken: string) {
      try {
        // Informations saisies sur le formulaire d'inscription (avant le passage par Google)
        let signup: Record<string, string> | null = null;
        try {
          const raw = localStorage.getItem("mmc_pending_signup");
          if (raw) {
            const parsed = JSON.parse(raw);
            // Valable 1 heure
            if (parsed?.savedAt && Date.now() - parsed.savedAt < 3600_000) signup = parsed;
          }
        } catch {}

        // Le serveur vérifie lui-même l'identité Google à partir du jeton
        const res = await fetch("/api/auth/google-callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken, signup }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (data.underage) {
            try {
              localStorage.removeItem("mmc_pending_signup");
            } catch {}
            await supabase.auth.signOut().catch(() => {});
          }
          throw new Error(data.error || `Erreur serveur (${res.status}) lors de la synchronisation du compte.`);
        }

        // Mémoriser l'identifiant sur ce téléphone pour les prochaines connexions
        let afterLogin: string | null = null;
        try {
          localStorage.removeItem("mmc_pending_signup");
          if (data.pseudo) localStorage.setItem("meetmeclub_saved_identifier", data.pseudo);
          if (data.email) localStorage.setItem("meetmeclub_primary_device_email", data.email);
          localStorage.setItem("meetmeclub_last_auth_time", Date.now().toString());
          afterLogin = localStorage.getItem("mmc_after_login");
          localStorage.removeItem("mmc_after_login");
        } catch {}

        // Nouveau membre → compléter son profil ; sinon page demandée ou messagerie
        const targetUrl =
          data.redirect?.startsWith("/profil/edit") || !afterLogin ? data.redirect || "/messages" : afterLogin;
        if (typeof window !== "undefined") {
          window.location.href = targetUrl;
        } else {
          router.replace(targetUrl);
        }
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
            onClick={() => router.replace(errorMsg.includes("18 ans") ? "/" : "/inscription")}
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
            {errorMsg.includes("18 ans") ? "Retour à l'accueil" : "Réessayer"}
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
        <p style={{ fontSize: "13px", color: "#6E7C98", fontWeight: 500 }}>
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
