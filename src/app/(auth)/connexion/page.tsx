"use client";
// src/app/(auth)/connexion/page.tsx
// Connexion simple et directe par E-mail & Mot de passe + Bouton Démo 1-clic — Responsive mobile & tablettes

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ConnexionForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/decouverte";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Connexion Démo instantanée
  async function handleDemoLogin() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/demo", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        router.push(callbackUrl || "/decouverte");
      } else {
        setError(data.error || "Erreur de connexion démo.");
      }
    } catch {
      setError("Erreur réseau. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  }

  // Connexion classique par E-mail
  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !email.includes("@")) {
      setError("Veuillez saisir une adresse e-mail valide.");
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
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Identifiants incorrects.");
        return;
      }

      router.push(data.redirect || callbackUrl);
    } catch {
      setError("Erreur réseau. Vérifiez votre connexion et réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[440px] mx-auto">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <Link href="/" className="inline-block transition-transform hover:scale-105">
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            <span className="text-[#E10600]">Meet</span>
            <span className="text-white">Me</span>
            <span className="text-[#FF2A25]">Club</span>
          </span>
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold mt-3 text-white tracking-tight">
          Bon retour parmi nous
        </h1>
        <p className="text-sm text-gray-300 mt-1">
          Connectez-vous à votre espace membre
        </p>
      </div>

      {/* Card Connexion */}
      <div className="bg-[#0e2a63]/70 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl">
        {/* Accès Démo 1-Clic Recommandé */}
        <div className="mb-6 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-red-500/10 to-blue-500/15 border border-amber-500/30">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <span>⚡</span> Test instantané
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 font-semibold">
              Sans mot de passe
            </span>
          </div>
          <p className="text-xs text-gray-300 mb-3">
            Accédez directement à l&apos;application en 1 clic pour explorer les membres et tester les fonctionnalités.
          </p>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs sm:text-sm shadow-md transition transform active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
          >
            <span>🚀 Connexion Démo Instantanée (1-clic)</span>
          </button>
        </div>

        {/* Séparateur */}
        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-white/15 w-full"></div>
          <span className="bg-[#0b2454] px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider absolute">
            Ou avec vos identifiants
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-sm flex items-start gap-2.5">
            <span className="text-base flex-shrink-0">⚠️</span>
            <p className="leading-snug">{error}</p>
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-200 uppercase tracking-wider mb-1.5">
              Adresse E-mail
            </label>
            <input
              type="email"
              required
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre-email@gmail.com"
              autoComplete="email"
              className="w-full px-4 py-3 sm:py-3.5 rounded-xl bg-white/10 border border-white/15 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E10600] focus:border-transparent text-sm sm:text-base transition"
            />
          </div>

          {/* Mot de passe */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-200 uppercase tracking-wider">
                Mot de passe
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
                autoComplete="current-password"
                className="w-full px-4 py-3 sm:py-3.5 pr-11 rounded-xl bg-white/10 border border-white/15 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E10600] focus:border-transparent text-sm sm:text-base transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white p-1 text-sm cursor-pointer"
                aria-label="Afficher ou masquer le mot de passe"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Bouton Connexion */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 sm:py-4 px-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#E10600] to-[#B30500] hover:from-[#FF2A25] hover:to-[#E10600] text-white font-bold text-sm sm:text-base shadow-lg shadow-red-600/30 hover:shadow-red-600/50 transition-all duration-200 transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <>
                <span className="animate-spin text-lg">⏳</span>
                <span>Connexion en cours...</span>
              </>
            ) : (
              <>
                <span>Se connecter</span>
                <span>➔</span>
              </>
            )}
          </button>
        </form>

        {/* Lien Inscription */}
        <div className="mt-5 pt-4 border-t border-white/10 text-center">
          <p className="text-xs sm:text-sm text-gray-300">
            Pas encore de compte ?{" "}
            <Link
              href="/inscription"
              className="font-bold text-red-400 hover:text-red-300 underline transition"
            >
              Créer un compte gratuitement
            </Link>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-6 text-xs text-gray-400 space-y-1">
        <p>🔒 Connexion chiffrée SSL • Meet Me Club Togo</p>
      </div>
    </div>
  );
}

export default function ConnexionPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col justify-center items-center px-4 py-8 sm:px-6 lg:px-8 bg-gradient-to-b from-[#071530] via-[#0B2559] to-[#071530] text-white">
      <Suspense fallback={<div className="text-center text-white p-8">Chargement de la page...</div>}>
        <ConnexionForm />
      </Suspense>
    </div>
  );
}
