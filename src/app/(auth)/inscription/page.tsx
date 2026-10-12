"use client";
// src/app/(auth)/inscription/page.tsx
// Inscription directe par e-mail — Design luxe épuré, centré, sans emoji jouet, optimisé iPhone, iPad & PC

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
} from "lucide-react";

export default function InscriptionPage() {
  const router = useRouter();

  // Form states
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [gender, setGender] = useState<"FEMALE" | "MALE" | "OTHER">("FEMALE");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Calcul 18+ client
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
      setError("Meet Me Club est strictement réservé aux personnes âgées de 18 ans et plus.");
      return;
    }
    if (!password || password.length < 6) {
      setError("Votre mot de passe doit comporter au moins 6 caractères.");
      return;
    }
    if (!termsAccepted) {
      setError("Veuillez cocher la case attestant votre majorité et acceptant les CGU.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          firstName: firstName.trim(),
          gender,
          dateOfBirth,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue lors de l'inscription.");
        return;
      }

      // Redirection directe vers la suite
      router.push(data.redirect || "/onboarding");
      router.refresh();
    } catch {
      setError("Erreur réseau. Vérifiez votre connexion internet et réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center items-center px-4 py-8 sm:px-6 lg:px-8 bg-gradient-to-b from-[#071530] via-[#0B2559] to-[#071530] text-white">
      {/* Container Responsive Centré (Téléphone, iPhone, iPad, Tablette, PC) */}
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
              <span>Plateforme réservée aux adultes (+18 ans)</span>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold mt-3 text-white tracking-tight">
            Créer votre compte
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Rejoignez le club de rencontres de Lomé en quelques instants
          </p>
        </div>

        {/* Card Formulaire Ultra-Structurée */}
        <div className="bg-[#0e2a63]/85 backdrop-blur-xl border border-white/15 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-sm flex items-start gap-2.5">
              <AlertCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />
              <p className="leading-snug font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Prénom / Pseudo */}
            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                Prénom ou Pseudo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ex : Koffi ou Ama"
                  autoComplete="name"
                  className="w-full pl-11 pr-4 py-3 sm:py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E10600] focus:border-transparent text-sm sm:text-base font-medium transition"
                />
              </div>
            </div>

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

            {/* Genre */}
            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                Genre
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { val: "FEMALE", label: "Femme" },
                  { val: "MALE", label: "Homme" },
                  { val: "OTHER", label: "Autre" },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setGender(item.val as any)}
                    className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold border transition text-center cursor-pointer ${
                      gender === item.val
                        ? "bg-[#E10600] border-[#FF2A25] text-white shadow-md shadow-red-600/30"
                        : "bg-white/5 border-white/15 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date de naissance (18+) */}
            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                Date de naissance (+18 ans)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Calendar size={18} />
                </div>
                <input
                  type="date"
                  required
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 sm:py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E10600] focus:border-transparent text-sm sm:text-base font-medium transition"
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Votre date atteste de votre majorité et reste strictement confidentielle.
              </span>
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Au moins 6 caractères"
                  autoComplete="new-password"
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

            {/* Case à cocher conditions 18+ */}
            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-200 select-none">
                <input
                  type="checkbox"
                  required
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/10 text-[#E10600] focus:ring-[#E10600] cursor-pointer"
                />
                <span className="leading-snug">
                  J&apos;atteste avoir <strong>au moins 18 ans</strong> et j&apos;accepte les{" "}
                  <Link href="/legal/cgu" className="text-red-400 underline hover:text-red-300">
                    Conditions Générales
                  </Link>{" "}
                  et la{" "}
                  <Link href="/legal/charte" className="text-red-400 underline hover:text-red-300">
                    Charte de Respect
                  </Link>
                  .
                </span>
              </label>
            </div>

            {/* Bouton de validation tactile plein écran sur mobile */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 sm:py-4 px-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#E10600] to-[#B30500] hover:from-[#FF2A25] hover:to-[#E10600] text-white font-bold text-sm sm:text-base shadow-lg shadow-red-600/30 hover:shadow-red-600/50 transition-all duration-200 transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Création de votre compte...</span>
                </>
              ) : (
                <>
                  <span>Créer mon compte</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Lien Connexion */}
          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            <p className="text-xs sm:text-sm text-slate-300 flex items-center justify-center gap-1.5">
              <span>Vous avez déjà un compte ?</span>
              <Link
                href="/connexion"
                className="font-bold text-red-400 hover:text-red-300 underline transition inline-flex items-center gap-1"
              >
                <LogIn size={14} />
                <span>Se connecter</span>
              </Link>
            </p>
          </div>
        </div>

        {/* Pied de page informatif et rassurant */}
        <div className="text-center mt-6 text-xs text-slate-400 space-y-1">
          <p className="flex items-center justify-center gap-1.5">
            <Lock size={12} className="text-emerald-400" />
            <span>Plateforme sécurisée et chiffrée • Lomé, Togo</span>
          </p>
          <p>© 2026 Meet Me Club — Rencontres réelles et sécurisées</p>
        </div>
      </div>
    </div>
  );
}
