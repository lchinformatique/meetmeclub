"use client";
// src/app/(auth)/connexion/page.tsx
// Connexion membre par E-mail & Mot de passe — Design luxe épuré, centré, sans test toy banners

import { useState, Suspense } from "react";
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
} from "lucide-react";

function ConnexionForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/decouverte";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        setError(data.error || "Identifiants incorrects. Veuillez vérifier votre e-mail et mot de passe.");
        return;
      }

      router.push(data.redirect || callbackUrl);
      router.refresh();
    } catch {
      setError("Erreur réseau. Vérifiez votre connexion et réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[460px] mx-auto">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 transition-transform hover:scale-105 mb-2"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 bg-white flex items-center justify-center p-0.5 shadow-md">
            <Image
              src="/logo.png"
              alt="Meet Me Club"
              width={36}
              height={36}
              className="object-contain"
              priority
            />
          </div>
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            <span className="text-[#E10600]">Meet</span>
            <span className="text-white">Me</span>
            <span className="text-[#FF2A25]">Club</span>
          </span>
        </Link>

        <div className="flex justify-center mt-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-200 text-xs font-medium">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Espace Membre Certifié</span>
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold mt-3 text-white tracking-tight">
          Bon retour parmi nous
        </h1>
        <p className="text-sm text-slate-300 mt-1">
          Connectez-vous pour retrouver vos rencontres et messages
        </p>
      </div>

      {/* Card Connexion */}
      <div className="bg-[#0e2a63]/85 backdrop-blur-xl border border-white/15 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl">
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-sm flex items-start gap-2.5">
            <AlertCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />
            <p className="leading-snug font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
              Adresse E-mail
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail size={18} />
              </div>
              <input
                type="email"
                required
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre-email@exemple.com"
                autoComplete="email"
                className="w-full pl-11 pr-4 py-3 sm:py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E10600] focus:border-transparent text-sm sm:text-base font-medium transition"
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                Mot de passe
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
                autoComplete="current-password"
                className="w-full pl-11 pr-11 py-3 sm:py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E10600] focus:border-transparent text-sm sm:text-base font-medium transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-white p-1.5 transition cursor-pointer"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
                <Loader2 size={18} className="animate-spin" />
                <span>Connexion en cours...</span>
              </>
            ) : (
              <>
                <span>Se connecter</span>
                <LogIn size={18} />
              </>
            )}
          </button>
        </form>

        {/* Lien Inscription */}
        <div className="mt-6 pt-5 border-t border-white/10 text-center">
          <p className="text-xs sm:text-sm text-slate-300 flex items-center justify-center gap-1.5">
            <span>Pas encore membre ?</span>
            <Link
              href="/inscription"
              className="font-bold text-red-400 hover:text-red-300 underline transition inline-flex items-center gap-1"
            >
              <UserPlus size={14} />
              <span>Créer un compte</span>
            </Link>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-6 text-xs text-slate-400 space-y-1">
        <p className="flex items-center justify-center gap-1.5">
          <ShieldCheck size={13} className="text-emerald-400" />
          <span>Connexion sécurisée et confidentielle • Meet Me Club Togo</span>
        </p>
        <p>© 2026 Meet Me Club — Tous droits réservés</p>
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
