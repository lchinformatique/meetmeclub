"use client";
// src/app/(auth)/inscription/page.tsx
// Inscription Meet Me Club :
// 1. Prénom, nom, pseudo, date de naissance (18 ans minimum) + acceptation des conditions
// 2. Validation avec son vrai compte Google (Gmail + mot de passe Google)
// 3. Accès direct à son profil pour compléter sa bio et ses photos
// (Option sans Google : e-mail + mot de passe)

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, CalendarDays, CheckCircle2, ChevronLeft, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck, Sparkles, User, AtSign } from "lucide-react";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import styles from "./inscription.module.css";
import BirthDateField from "@/components/forms/BirthDateField";

function ageFrom(value: string): number | null {
  if (!value) return null;
  const dob = new Date(value);
  if (isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

const PSEUDO_RE = /^[a-zA-Z0-9_.-]{3,24}$/;

export default function InscriptionPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [showFields, setShowFields] = useState(false);

  // Option sans Google
  const [withoutGoogle, setWithoutGoogle] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Restaurer un formulaire commencé (retour depuis Google)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("mmc_pending_signup");
      if (!raw) return;
      const d = JSON.parse(raw);
      setFirstName(d.firstName || "");
      setLastName(d.lastName || "");
      setPseudo(d.pseudo || "");
      setDateOfBirth(d.dateOfBirth || "");
    } catch {}
  }, []);

  const age = ageFrom(dateOfBirth);
  const maxDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().split("T")[0];
  }, []);

  const problems = {
    firstName: firstName.trim().length < 2 ? "Indiquez votre prénom." : "",
    lastName: lastName.trim().length < 2 ? "Indiquez votre nom." : "",
    pseudo: !PSEUDO_RE.test(pseudo.trim()) ? "3 à 24 caractères : lettres, chiffres, _ . -" : "",
    dateOfBirth: !dateOfBirth ? "Indiquez votre date de naissance." : age !== null && age < 18 ? "Réservé aux 18 ans et plus." : "",
    accepted: !accepted ? "Vous devez certifier avoir 18 ans et accepter les conditions." : "",
  };
  const isValid = Object.values(problems).every((p) => !p);

  const validate = () => {
    setShowFields(true);
    if (age !== null && age < 18) {
      setError("Désolé, Meet Me Club est réservé exclusivement aux personnes de 18 ans et plus. 🔞");
      return false;
    }
    if (!isValid) {
      setError("Complétez les champs indiqués en rouge pour continuer.");
      return false;
    }
    setError("");
    return true;
  };

  const savePending = () => {
    try {
      localStorage.setItem(
        "mmc_pending_signup",
        JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          pseudo: pseudo.trim(),
          dateOfBirth,
          acceptedTerms: true,
          savedAt: Date.now(),
        })
      );
      localStorage.removeItem("mmc_after_login");
    } catch {}
  };

  async function registerWithEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Adresse e-mail invalide.");
    if (password.length < 6) return setError("Le mot de passe doit comporter au moins 6 caractères.");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          pseudo: pseudo.trim(),
          dateOfBirth,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setError(data.error || "Inscription impossible. Réessayez.");

      try {
        localStorage.removeItem("mmc_pending_signup");
        localStorage.setItem("meetmeclub_saved_identifier", data.pseudo || pseudo.trim());
        localStorage.setItem("meetmeclub_primary_device_email", email.trim().toLowerCase());
        localStorage.setItem("meetmeclub_last_auth_time", Date.now().toString());
        const PC = (window as any).PasswordCredential;
        if (PC && navigator.credentials?.store) {
          await navigator.credentials.store(new PC({ id: pseudo.trim(), password, name: `${firstName} ${lastName}` })).catch(() => {});
        }
      } catch {}
      window.location.href = data.redirect || "/profil/edit?welcome=1";
    } catch {
      setError("Erreur réseau. Vérifiez votre connexion et réessayez.");
    } finally {
      setLoading(false);
    }
  }

  const fieldError = (key: keyof typeof problems) => (showFields && problems[key] ? problems[key] : "");

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
          aria-label="Retour"
        >
          <ChevronLeft size={20} /> Retour
        </button>
        <Link href="/connexion" className={styles.topLink}>
          Se connecter
        </Link>
      </div>

      <main className={styles.card}>
        <div className={styles.accent} />
        <div className={styles.body}>
          <div className={styles.brand}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-icon.png" alt="Meet Me Club" />
            <div>
              <h1>Créer mon compte</h1>
              <p>Rencontres et sorties réelles · réservé aux 18 ans et plus</p>
            </div>
          </div>

          <ol className={styles.steps}>
            <li className={styles.stepActive}>1. Vos informations</li>
            <li>2. Validation Google</li>
            <li>3. Votre profil</li>
          </ol>

          {error && (
            <div className={styles.error} role="alert">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <form onSubmit={registerWithEmail} noValidate>
            <div className={styles.row}>
              <label className={styles.field}>
                <span>Prénom *</span>
                <div className={`${styles.inputWrap} ${fieldError("firstName") ? styles.invalid : ""}`}>
                  <User size={17} />
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" placeholder="Ex : Ama" />
                </div>
                {fieldError("firstName") && <small>{fieldError("firstName")}</small>}
              </label>
              <label className={styles.field}>
                <span>Nom *</span>
                <div className={`${styles.inputWrap} ${fieldError("lastName") ? styles.invalid : ""}`}>
                  <User size={17} />
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" placeholder="Ex : Mensah" />
                </div>
                {fieldError("lastName") && <small>{fieldError("lastName")}</small>}
              </label>
            </div>

            <label className={styles.field}>
              <span>Pseudo (votre identifiant de connexion) *</span>
              <div className={`${styles.inputWrap} ${fieldError("pseudo") ? styles.invalid : ""}`}>
                <AtSign size={17} />
                <input
                  value={pseudo}
                  onChange={(e) => setPseudo(e.target.value.replace(/\s+/g, "_"))}
                  autoComplete="username"
                  autoCapitalize="none"
                  placeholder="Ex : ama_lome"
                />
              </div>
              {fieldError("pseudo") ? <small>{fieldError("pseudo")}</small> : <em>Il sera mémorisé sur ce téléphone pour vos prochaines connexions.</em>}
            </label>

            <label className={styles.field}>
              <span>Date de naissance *</span>
              <BirthDateField idPrefix="inscription-dob" value={dateOfBirth} invalid={Boolean(fieldError("dateOfBirth") || (age !== null && age < 18))} onChange={setDateOfBirth} />
              {age !== null && age >= 18 && (
                <em className={styles.ok}>
                  <CheckCircle2 size={14} /> {age} ans — accès autorisé
                </em>
              )}
              {age !== null && age < 18 && <small>Vous avez {age} ans : l&apos;inscription est réservée aux 18 ans et plus.</small>}
              {age === null && fieldError("dateOfBirth") && <small>{fieldError("dateOfBirth")}</small>}
            </label>

            <label className={`${styles.check} ${fieldError("accepted") ? styles.checkInvalid : ""}`}>
              <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
              <span>
                Je certifie avoir <strong>18 ans ou plus</strong> et j&apos;accepte les{" "}
                <Link href="/legal/cgu" target="_blank">conditions d&apos;utilisation</Link> et la{" "}
                <Link href="/legal/charte" target="_blank">charte du club</Link>.
              </span>
            </label>

            {!withoutGoogle && (
              <div className={styles.googleBlock}>
                <GoogleAuthButton
                  label="Valider avec mon compte Google"
                  onError={setError}
                  onBeforeStart={() => {
                    if (!validate()) return false;
                    savePending();
                    return true;
                  }}
                />
                <p className={styles.googleHint}>
                  <ShieldCheck size={14} /> Choisissez votre vrai compte Gmail : votre identité est confirmée par Google.
                </p>
                <button type="button" className={styles.linkBtn} onClick={() => setWithoutGoogle(true)}>
                  Je n&apos;ai pas de compte Google
                </button>
              </div>
            )}

            {withoutGoogle && (
              <div className={styles.emailBlock}>
                <label className={styles.field}>
                  <span>Adresse e-mail *</span>
                  <div className={styles.inputWrap}>
                    <Mail size={17} />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" placeholder="vous@exemple.com" />
                  </div>
                </label>
                <label className={styles.field}>
                  <span>Mot de passe (6 caractères min.) *</span>
                  <div className={styles.inputWrap}>
                    <Lock size={17} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      placeholder="Votre mot de passe"
                    />
                    <button type="button" className={styles.eye} onClick={() => setShowPassword((v) => !v)} aria-label="Afficher le mot de passe">
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </label>
                <button type="submit" className={styles.submit} disabled={loading}>
                  {loading ? <Loader2 size={18} className={styles.spin} /> : null}
                  {loading ? "Création de votre compte…" : "Créer mon compte"}
                  {!loading && <ArrowRight size={18} />}
                </button>
                <button type="button" className={styles.linkBtn} onClick={() => setWithoutGoogle(false)}>
                  Utiliser plutôt mon compte Google
                </button>
              </div>
            )}
          </form>

          <div className={styles.already}>
            Déjà membre ? <Link href="/connexion">Se connecter</Link>
          </div>
        </div>

        <div className={styles.footer}>
          <span>
            <ShieldCheck size={14} /> Réservé aux 18 ans et plus
          </span>
          <span>
            <Sparkles size={14} /> Plan Gratuit 3 jours inclus
          </span>
        </div>
      </main>

      <p className={styles.plans}>
        Envie de plus ? <Link href="/tarifs">Découvrez les pass Essentiel, Complice et VIP</Link>
      </p>
    </div>
  );
}
