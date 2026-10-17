"use client";
// src/app/onboarding/page.tsx
// Multi-step onboarding wizard — 8 steps with consent & strict image validation, then live selfie on /verification

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import CountryPicker from "@/components/forms/CountryPicker";
import PhoneField from "@/components/forms/PhoneField";
import Image from "next/image";

const DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const LANGUAGES = [
  { code: "fr", label: "Français" },
  { code: "ewe", label: "Éwé" },
  { code: "kabiye", label: "Kabiyè" },
  { code: "en", label: "Anglais" },
  { code: "other", label: "Autre" },
];
const GOALS = [
  { value: "EXCHANGE", label: "Échanger & Discuter", desc: "Partager des idées, passions et discuter librement" },
  { value: "FRIENDSHIP", label: "Amitié & Sorties", desc: "Rencontres amicales, activités et sorties" },
  { value: "SERIOUS", label: "Relation sérieuse", desc: "Relation durable et sincère" },
  { value: "MARRIAGE", label: "Mariage", desc: "Cherche à fonder un foyer" },
  { value: "CASUAL", label: "Sortie simple", desc: "Dîner ou café ponctuel" },
];
const EDUCATION = [
  { value: "PRIMARY", label: "Primaire" },
  { value: "SECONDARY", label: "Secondaire (Lycée)" },
  { value: "VOCATIONAL", label: "Formation professionnelle" },
  { value: "BACHELOR", label: "Licence" },
  { value: "MASTER", label: "Master" },
  { value: "PHD", label: "Doctorat" },
];

const TOTAL_STEPS = 8;

type FormData = {
  firstName: string;
  lastName: string;
  pseudo: string;
  gender: string;
  age: string;
  phone: string;
  city: string;
  country: string;
  address: string;
  profession: string;
  educationLevel: string;
  relationshipStatus: string;
  height: string;
  religion: string;
  hasChildren: boolean | null;
  languages: string[];
  interestIds: string[];
  relationshipGoal: string;
  bio: string;
  availabilities: Array<{ dayOfWeek: number; startTime: string; endTime: string }>;
  photos: File[];
};

const INITIAL: FormData = {
  firstName: "",
  lastName: "",
  pseudo: "",
  gender: "",
  age: "25",
  phone: "",
  city: "",
  country: "",
  address: "",
  profession: "",
  educationLevel: "",
  relationshipStatus: "",
  height: "",
  religion: "",
  hasChildren: null,
  languages: ["fr"],
  interestIds: [],
  relationshipGoal: "EXCHANGE",
  bio: "",
  availabilities: [],
  photos: [],
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [interests, setInterests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string[]>([]);
  const [interestsLoaded, setInterestsLoaded] = useState(false);

  // ── Consentement et Conditions d'Utilisation ───────────────────
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [dataAccuracyAccepted, setDataAccuracyAccepted] = useState(false);
  const [confidentialityAccepted, setConfidentialityAccepted] = useState(false);

  // ── Load interests when step 6 is reached ────────────────────
  const loadInterests = useCallback(async () => {
    if (interestsLoaded) return;
    const res = await fetch("/api/interests");
    const data = await res.json();
    setInterests(data.interests || []);
    setInterestsLoaded(true);
  }, [interestsLoaded]);

  // ── Navigation ────────────────────────────────────────────────
  async function goNext() {
    setError("");

    // Validation stricte par étape
    if (step === 1) {
      if (!form.firstName.trim()) { setError("Veuillez renseigner votre prénom."); return; }
      if (!form.lastName.trim()) { setError("Veuillez renseigner votre nom de famille."); return; }
      if (!form.age || parseInt(form.age) < 18) { setError("Vous devez avoir au moins 18 ans pour vous inscrire. 🔞"); return; }
      if (!form.gender) { setError("Veuillez sélectionner votre genre (Femme ou Homme)."); return; }
    }
    if (step === 2) {
      if (!form.country) { setError("Choisissez votre pays de résidence."); return; }
      if (!form.city.trim()) { setError("Indiquez votre ville de résidence."); return; }
      if (form.address.trim().length < 5) { setError("Indiquez votre adresse de résidence (elle reste privée)."); return; }
    }
    if (step === 7) {
      if (!form.relationshipGoal) { setError("Veuillez sélectionner ce que vous recherchez."); return; }
    }
    if (step === 6) await loadInterests();

    // Auto-save every 2 steps
    if (step % 2 === 0 || step === TOTAL_STEPS) {
      await saveProgress();
    }
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
    else await handleFinish();
  }

  function goBack() {
    setError("");
    if (step > 1) setStep((s) => s - 1);
  }

  // ── Save progress ─────────────────────────────────────────────
  async function saveProgress() {
    try {
      await fetch("/api/profiles/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName || undefined,
          lastName: form.lastName || undefined,
          pseudo: form.pseudo || undefined,
          gender: form.gender || undefined,
          age: form.age ? parseInt(form.age) : undefined,
          phone: form.phone || undefined,
          city: form.city.trim(),
          country: form.country || undefined,
          address: form.address.trim() || undefined,
          profession: form.profession || undefined,
          educationLevel: form.educationLevel || undefined,
          relationshipStatus: form.relationshipStatus || undefined,
          height: form.height ? parseInt(form.height) : undefined,
          religion: form.religion || undefined,
          hasChildren: form.hasChildren,
          languages: form.languages.length ? form.languages : undefined,
          bio: form.bio || undefined,
          relationshipGoal: form.relationshipGoal || undefined,
          interests: form.interestIds,
        }),
      });
    } catch (e) {
      console.warn("Auto-save failed:", e);
    }
  }

  // ── Upload photos ─────────────────────────────────────────────
  async function uploadPhotos() {
    for (const file of form.photos) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        await fetch("/api/profiles/me/photos", { method: "POST", body: fd });
      } catch (e) {
        console.warn("Photo upload failed:", e);
      }
    }
  }

  // ── Finish onboarding with full mandatory checks ───────────────
  async function handleFinish() {
    setError("");

    // 1. Contrôle exhaustif des champs requis
    if (!form.firstName.trim() || !form.lastName.trim() || !form.gender || !form.city) {
      setError("Informations incomplètes : Tous les champs personnels obligatoires doivent être renseignés.");
      return;
    }

    // 2. Contrôle de la photo principale
    if (form.photos.length === 0) {
      setError("Photo obligatoire : Veuillez ajouter au moins 1 photo de profil au format JPEG ou PNG (taille max 5 Mo).");
      return;
    }

    // 4. Contrôle des consentements obligatoires
    if (!termsAccepted || !dataAccuracyAccepted || !confidentialityAccepted) {
      setError("Consentement requis : Vous devez cocher les 3 cases pour accepter les conditions d'utilisation et valider l'exactitude de vos informations.");
      return;
    }

    setLoading(true);
    try {
      await saveProgress();
      if (form.photos.length > 0) await uploadPhotos();

      // Enregistrer les consentements (la vérification du visage se fait ensuite sur /verification)
      await fetch("/api/profiles/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          termsAccepted: true,
          termsAcceptedAt: new Date().toISOString(),
          availabilities: form.availabilities,
        }),
      });

      // Étape suivante obligatoire : selfie en direct contrôlé par l'équipe
      router.push("/verification");
    } catch {
      setError("Erreur lors de la validation. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  // ── Photo selection with STRICT JPEG/PNG and size checks ───────
  function handlePhotoSelect(files: FileList | null) {
    if (!files) return;
    setError("");
    const newFiles: File[] = [];
    const previews: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Exigence stricte JPEG ou PNG
      if (file.type !== "image/jpeg" && file.type !== "image/png") {
        setError(`Format non accepté pour "${file.name}". Seuls les formats JPEG (.jpg, .jpeg) et PNG (.png) sont autorisés.`);
        return;
      }

      // Taille exigée : max 5 Mo
      if (file.size > 5 * 1024 * 1024) {
        setError(`Taille excessive pour "${file.name}" : Le fichier dépasse la limite requise de 5 Mo.`);
        return;
      }

      // Taille minimale requise : 10 Ko (évite fichiers vides ou corrompus)
      if (file.size < 10 * 1024) {
        setError(`Le fichier "${file.name}" est trop petit ou non conforme (minimum 10 Ko).`);
        return;
      }

      newFiles.push(file);
      previews.push(URL.createObjectURL(file));
    }

    const availableSlots = 8 - form.photos.length;
    if (availableSlots <= 0) {
      setError("Vous avez atteint la limite maximale de 8 photos.");
      return;
    }

    setForm((fd) => ({ ...fd, photos: [...fd.photos, ...newFiles.slice(0, availableSlots)] }));
    setPhotoPreview((p) => [...p, ...previews.slice(0, availableSlots)]);
  }

  function removePhoto(i: number) {
    setForm((fd) => ({ ...fd, photos: fd.photos.filter((_, idx) => idx !== i) }));
    setPhotoPreview((p) => p.filter((_, idx) => idx !== i));
  }

  // ── Toggle availability day ───────────────────────────────────
  function toggleDay(day: number) {
    const existing = form.availabilities.find((a) => a.dayOfWeek === day);
    if (existing) {
      setForm((f) => ({ ...f, availabilities: f.availabilities.filter((a) => a.dayOfWeek !== day) }));
    } else {
      setForm((f) => ({ ...f, availabilities: [...f.availabilities, { dayOfWeek: day, startTime: "09:00", endTime: "21:00" }] }));
    }
  }

  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--gradient-warm)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ background: "white", boxShadow: "var(--shadow-sm)", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={() => {
              if (step > 1) {
                setStep((s) => s - 1);
              } else if (typeof window !== "undefined" && window.history.length > 1) {
                router.back();
              } else {
                router.push("/");
              }
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "6px 11px",
              borderRadius: "10px",
              background: "#F1F5F9",
              border: "1.5px solid #CBD5E1",
              color: "#0B2559",
              fontWeight: 700,
              fontSize: "12px",
              cursor: "pointer",
              flexShrink: 0,
            }}
            aria-label="Retour"
          >
            ← Retour
          </button>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              overflow: "hidden",
              border: "2px solid rgba(11, 46, 107, 0.12)",
              background: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.06)",
              flexShrink: 0,
            }}
          >
            <Image src="/logo.png" alt="Meet Me Club" width={36} height={36} style={{ objectFit: "cover" }} />
          </div>
          <span style={{ fontWeight: 800, fontSize: "16px", color: "var(--color-blue)" }}>Création du profil</span>
        </div>
        <span style={{ fontSize: "13px", color: "var(--color-gray-500)", fontWeight: 600 }}>
          Étape {step}/{TOTAL_STEPS}
        </span>
      </header>

      {/* Progress bar */}
      <div className="progress-bar" style={{ borderRadius: 0, height: "4px" }}>
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Main content */}
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
        <div className="card animate-fade-in" style={{ width: "100%", maxWidth: "480px", padding: "32px 28px" }}>

          {/* Step indicators */}
          <div className="step-indicator" style={{ marginBottom: "32px" }}>
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
              <>
                <div key={s} className={`step-dot ${s < step ? "done" : s === step ? "active" : "pending"}`}>
                  {s < step ? "✓" : s}
                </div>
                {s < TOTAL_STEPS && <div className={`step-line ${s < step ? "done" : ""}`} />}
              </>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div role="alert" style={{ background: "#FEF2F2", borderRadius: "var(--radius-md)", padding: "12px 16px", color: "#991B1B", fontSize: "14px", marginBottom: "20px" }}>
              ⚠️ {error}
            </div>
          )}

          {/* ── STEP 1: Full Name & Identity ── */}
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#0F172A", marginBottom: "6px" }}>Présentez-vous 👋</h2>
              <p style={{ color: "#475569", marginBottom: "24px", fontSize: "15px" }}>Renseignez vos informations pour enregistrer votre profil dans le club</p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div className="input-group">
                  <label htmlFor="firstName" className="input-label" style={{ fontWeight: 700, color: "#0F172A" }}>Prénom *</label>
                  <input id="firstName" type="text" className="input" placeholder="Ex: Koffi" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} autoFocus />
                </div>
                <div className="input-group">
                  <label htmlFor="lastName" className="input-label" style={{ fontWeight: 700, color: "#0F172A" }}>Nom de famille *</label>
                  <input id="lastName" type="text" className="input" placeholder="Ex: Mensah" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} />
                </div>
              </div>

              <div className="input-group" style={{ marginBottom: "12px" }}>
                <label htmlFor="phone" className="input-label" style={{ fontWeight: 700, color: "#0F172A" }}>Téléphone</label>
                <PhoneField id="phone" value={form.phone} defaultCountry={form.country || null} onChange={(phone) => setForm((f) => ({ ...f, phone }))} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: "12px", marginBottom: "16px" }}>
                <div className="input-group">
                  <label htmlFor="age" className="input-label" style={{ fontWeight: 700, color: "#0F172A" }}>Âge *</label>
                  <input id="age" type="number" min={18} max={99} className="input" placeholder="25" value={form.age} onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))} />
                </div>
              </div>

              <div className="input-group" style={{ marginBottom: "20px" }}>
                <label htmlFor="pseudo" className="input-label" style={{ fontWeight: 700, color: "#0F172A" }}>Pseudo visible (optionnel)</label>
                <input id="pseudo" type="text" className="input" placeholder="@votre_pseudo" value={form.pseudo} onChange={(e) => setForm((f) => ({ ...f, pseudo: e.target.value }))} />
              </div>

              <div style={{ marginBottom: "8px" }}>
                <label className="input-label" style={{ marginBottom: "12px", display: "block", fontWeight: 700, color: "#0F172A" }}>Je suis *</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  {[{ value: "FEMALE", label: "👩 Femme" }, { value: "MALE", label: "👨 Homme" }].map((g) => (
                    <button key={g.value} type="button"
                      onClick={() => setForm((f) => ({ ...f, gender: g.value }))}
                      style={{ padding: "18px 16px", borderRadius: "var(--radius-lg)", border: `2px solid ${form.gender === g.value ? "#E10600" : "#CBD5E1"}`, background: form.gender === g.value ? "rgba(225,6,0,0.06)" : "white", fontWeight: 700, fontSize: "17px", cursor: "pointer", transition: "all var(--transition-fast)", color: form.gender === g.value ? "#E10600" : "#1E293B" }}>
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Location ── */}
          {step === 2 && (
            <div>
              <h2 style={{ fontSize: "22px", marginBottom: "6px" }}>Où résidez-vous ? 📍</h2>
              <p style={{ color: "var(--color-gray-500)", marginBottom: "24px", fontSize: "15px" }}>Pour la sécurité du club et pour trouver des profils proches de vous</p>

              <div className="input-group" style={{ marginBottom: "16px" }}>
                <label htmlFor="country" className="input-label">Pays de résidence *</label>
                <CountryPicker id="country" value={form.country} onChange={(c) => setForm((f) => ({ ...f, country: c.iso }))} />
              </div>

              <div className="input-group" style={{ marginBottom: "16px" }}>
                <label htmlFor="city" className="input-label">Ville *</label>
                <input id="city" type="text" className="input" placeholder="Votre ville" autoComplete="address-level2" maxLength={60} value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
              </div>

              <div className="input-group">
                <label htmlFor="address" className="input-label">Adresse de résidence *</label>
                <input id="address" type="text" className="input" placeholder="N°, rue, code postal" autoComplete="street-address" maxLength={160} value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
                <p style={{ fontSize: "12px", color: "var(--color-gray-400)" }}>🔒 Votre adresse reste privée : seuls votre pays et votre ville sont visibles des autres membres.</p>
              </div>
            </div>
          )}

          {/* ── STEP 3: Professional ── */}
          {step === 3 && (
            <div>
              <h2 style={{ fontSize: "22px", marginBottom: "6px" }}>Votre vie professionnelle 💼</h2>
              <p style={{ color: "var(--color-gray-500)", marginBottom: "24px", fontSize: "15px" }}>Tout est optionnel</p>

              <div className="input-group" style={{ marginBottom: "16px" }}>
                <label htmlFor="profession" className="input-label">Profession</label>
                <input id="profession" type="text" className="input" placeholder="Ex: Ingénieur, Enseignant, Entrepreneur..." value={form.profession} onChange={(e) => setForm((f) => ({ ...f, profession: e.target.value }))} />
              </div>

              <div className="input-group" style={{ marginBottom: "16px" }}>
                <label htmlFor="education" className="input-label">Niveau d'études</label>
                <select id="education" className="input" value={form.educationLevel} onChange={(e) => setForm((f) => ({ ...f, educationLevel: e.target.value }))}>
                  <option value="">Sélectionner...</option>
                  {EDUCATION.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
              </div>

              <div className="input-group">
                <label htmlFor="status" className="input-label">Situation</label>
                <select id="status" className="input" value={form.relationshipStatus} onChange={(e) => setForm((f) => ({ ...f, relationshipStatus: e.target.value }))}>
                  <option value="">Sélectionner...</option>
                  <option value="SINGLE">Célibataire</option>
                  <option value="DIVORCED">Divorcé(e)</option>
                  <option value="WIDOWED">Veuf / Veuve</option>
                  <option value="SEPARATED">Séparé(e)</option>
                </select>
              </div>
            </div>
          )}

          {/* ── STEP 4: Physical ── */}
          {step === 4 && (
            <div>
              <h2 style={{ fontSize: "22px", marginBottom: "6px" }}>Un peu plus sur vous 🌟</h2>
              <p style={{ color: "var(--color-gray-500)", marginBottom: "24px", fontSize: "15px" }}>Tout est optionnel</p>

              <div className="input-group" style={{ marginBottom: "16px" }}>
                <label htmlFor="height" className="input-label">Taille (cm)</label>
                <input id="height" type="number" inputMode="numeric" className="input" placeholder="Ex: 170" min={100} max={250} value={form.height} onChange={(e) => setForm((f) => ({ ...f, height: e.target.value }))} />
              </div>

              <div className="input-group" style={{ marginBottom: "16px" }}>
                <label htmlFor="religion" className="input-label">Religion</label>
                <select id="religion" className="input" value={form.religion} onChange={(e) => setForm((f) => ({ ...f, religion: e.target.value }))}>
                  <option value="">Préfère ne pas préciser</option>
                  <option value="christianisme">Christianisme</option>
                  <option value="islam">Islam</option>
                  <option value="vodoun">Vodoun / Religion traditionnelle</option>
                  <option value="atheisme">Athéisme</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              <div>
                <label className="input-label" style={{ marginBottom: "12px", display: "block" }}>Avez-vous des enfants ?</label>
                <div style={{ display: "flex", gap: "12px" }}>
                  {[{ v: false, l: "Non" }, { v: true, l: "Oui" }].map(({ v, l }) => (
                    <button key={l} type="button"
                      onClick={() => setForm((f) => ({ ...f, hasChildren: v }))}
                      style={{ flex: 1, padding: "14px", borderRadius: "var(--radius-md)", border: `2px solid ${form.hasChildren === v ? "var(--color-blue)" : "var(--color-gray-200)"}`, background: form.hasChildren === v ? "rgba(11,46,107,0.06)" : "white", fontWeight: 600, cursor: "pointer", color: form.hasChildren === v ? "var(--color-blue)" : "var(--color-gray-600)" }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 5: Languages ── */}
          {step === 5 && (
            <div>
              <h2 style={{ fontSize: "22px", marginBottom: "6px" }}>Langues parlées 🗣️</h2>
              <p style={{ color: "var(--color-gray-500)", marginBottom: "24px", fontSize: "15px" }}>Sélectionnez toutes les langues que vous parlez</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {LANGUAGES.map((l) => (
                  <button key={l.code} type="button"
                    className={`interest-chip${form.languages.includes(l.code) ? " selected" : ""}`}
                    onClick={() => setForm((f) => ({
                      ...f,
                      languages: f.languages.includes(l.code) ? f.languages.filter((x) => x !== l.code) : [...f.languages, l.code]
                    }))}>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 6: Interests ── */}
          {step === 6 && (
            <div>
              <h2 style={{ fontSize: "22px", marginBottom: "6px" }}>Centres d'intérêt 🎯</h2>
              <p style={{ color: "var(--color-gray-500)", marginBottom: "24px", fontSize: "15px" }}>Choisissez au moins 3 (max 15)</p>
              {interests.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--color-gray-400)" }}>Chargement...</div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", maxHeight: "300px", overflowY: "auto" }}>
                  {interests.map((i: any) => (
                    <button key={i.id} type="button"
                      className={`interest-chip${form.interestIds.includes(i.id) ? " selected" : ""}`}
                      disabled={!form.interestIds.includes(i.id) && form.interestIds.length >= 15}
                      onClick={() => setForm((f) => ({
                        ...f,
                        interestIds: f.interestIds.includes(i.id) ? f.interestIds.filter((x) => x !== i.id) : [...f.interestIds, i.id]
                      }))}>
                      {i.icon} {i.name}
                    </button>
                  ))}
                </div>
              )}
              <p style={{ marginTop: "12px", fontSize: "13px", color: "var(--color-gray-400)" }}>
                {form.interestIds.length}/15 sélectionnés
              </p>
            </div>
          )}

          {/* ── STEP 7: Goals & Bio ── */}
          {step === 7 && (
            <div>
              <h2 style={{ fontSize: "22px", marginBottom: "6px" }}>Ce que vous recherchez 🔍</h2>
              <p style={{ color: "var(--color-gray-500)", marginBottom: "20px", fontSize: "15px" }}>Soyez honnête pour trouver le bon match</p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "24px" }}>
                {GOALS.map((g) => (
                  <button key={g.value} type="button"
                    onClick={() => setForm((f) => ({ ...f, relationshipGoal: g.value }))}
                    style={{ padding: "16px 12px", borderRadius: "var(--radius-lg)", border: `2px solid ${form.relationshipGoal === g.value ? "var(--color-red)" : "var(--color-gray-200)"}`, background: form.relationshipGoal === g.value ? "rgba(225,6,0,0.06)" : "white", cursor: "pointer", textAlign: "left", transition: "all var(--transition-fast)" }}>
                    <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "4px", color: form.relationshipGoal === g.value ? "var(--color-red)" : "var(--color-gray-800)" }}>{g.label}</div>
                    <div style={{ fontSize: "12px", color: "var(--color-gray-500)" }}>{g.desc}</div>
                  </button>
                ))}
              </div>

              <div className="input-group">
                <label htmlFor="bio" className="input-label">Votre description (optionnel)</label>
                <textarea id="bio" className="input" rows={4} placeholder="Parlez de vous, de vos passions, de ce que vous aimez faire..." value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} maxLength={500} style={{ resize: "vertical" }} />
                <p style={{ fontSize: "12px", color: "var(--color-gray-400)", textAlign: "right" }}>{form.bio.length}/500</p>
              </div>
            </div>
          )}

          {/* ── STEP 8: Photos, Selfie Vérification & Consentement ── */}
          {step === 8 && (
            <div>
              <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#0B2E6B", marginBottom: "6px" }}>
                Photos, Sécurité &amp; Validation 📸
              </h2>
              <p style={{ color: "var(--color-gray-500)", marginBottom: "22px", fontSize: "14px", lineHeight: 1.5 }}>
                Pour certifier chaque profil et préserver la sécurité de la communauté, vos photos et la confirmation de votre identité par selfie sont exigées.
              </p>

              {/* 1. Vos Photos de Profil */}
              <div style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <label className="input-label" style={{ fontWeight: 700, color: "#0F172A", margin: 0 }}>
                    1. Photos de profil (JPG/PNG · Max 5 Mo) *
                  </label>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: form.photos.length > 0 ? "#059669" : "#E10600" }}>
                    {form.photos.length > 0 ? "✓ Au moins 1 photo ajoutée" : "⚠️ Au moins 1 photo requise"}
                  </span>
                </div>

                {photoPreview.length > 0 && (
                  <div className="photo-grid" style={{ marginBottom: "12px" }}>
                    {photoPreview.map((src, i) => (
                      <div key={i} className="photo-thumb" style={{ position: "relative" }}>
                        <Image src={src} alt={`Photo ${i + 1}`} fill style={{ objectFit: "cover" }} />
                        {i === 0 && <span className="photo-thumb-main-badge">Principale</span>}
                        <div className="photo-thumb-actions">
                          <button
                            type="button"
                            onClick={() => removePhoto(i)}
                            title="Supprimer cette photo"
                            style={{ background: "rgba(0,0,0,0.65)", color: "white", border: "none", borderRadius: "50%", width: "24px", height: "24px", cursor: "pointer", fontSize: "12px" }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {form.photos.length < 8 && (
                  <label
                    htmlFor="photo-upload"
                    className="photo-dropzone"
                    style={{
                      display: "block",
                      cursor: "pointer",
                      border: "2px dashed #CBD5E1",
                      borderRadius: "16px",
                      padding: "20px 16px",
                      textAlign: "center",
                      background: "#F8FAFC",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{ fontSize: "30px", marginBottom: "6px" }}>📷</div>
                    <p style={{ fontWeight: 700, color: "var(--color-blue)", marginBottom: "4px", fontSize: "14px" }}>
                      Ajouter une photo de profil
                    </p>
                    <p style={{ fontSize: "12px", color: "var(--color-gray-500)", margin: 0 }}>
                      Formats acceptés : <strong>JPEG (.jpg, .jpeg)</strong> et <strong>PNG (.png)</strong> · Max 5 Mo
                    </p>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/jpeg,image/png"
                      multiple
                      style={{ display: "none" }}
                      onChange={(e) => handlePhotoSelect(e.target.files)}
                    />
                  </label>
                )}
              </div>

              {/* 2. Vérification du visage (étape suivante, page /verification) */}
              <div
                style={{
                  background: "#F0FDF4",
                  border: "1.5px solid #BBF7D0",
                  borderRadius: "18px",
                  padding: "18px 16px",
                  marginBottom: "24px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  <label style={{ fontSize: "14px", fontWeight: 800, color: "#166534" }}>
                    2. Vérification de votre visage (étape suivante)
                  </label>
                </div>
                <p style={{ fontSize: "12px", color: "#374151", lineHeight: 1.5, margin: 0 }}>
                  Pour bannir les faux profils, vous prendrez ensuite un selfie en direct avec la caméra, en faisant un geste
                  demandé. L&apos;équipe Meet Me Club le compare à vos photos avant d&apos;activer votre profil. Ce selfie reste
                  privé et n&apos;est jamais montré aux autres membres.
                </p>
              </div>


              {/* 3. Vos Disponibilités */}
              <div style={{ marginBottom: "24px" }}>
                <label className="input-label" style={{ display: "block", marginBottom: "8px", fontWeight: 700, color: "#0F172A" }}>
                  3. Vos disponibilités (jours libres)
                </label>
                <div className="week-grid">
                  {DAYS.map((d, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`day-btn${form.availabilities.some((a) => a.dayOfWeek === i) ? " active" : ""}`}
                      onClick={() => toggleDay(i)}
                    >
                      <span>{d}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Consentement légal obligatoire & acceptation des conditions */}
              <div
                style={{
                  background: "#F8FAFC",
                  border: "1.5px solid #E2E8F0",
                  borderRadius: "18px",
                  padding: "18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                <div style={{ fontSize: "13px", fontWeight: 800, color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  📜 Consentement obligatoire &amp; Déclaration sur l&apos;honneur :
                </div>

                {/* Case 1 : CGU */}
                <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13px", color: "#334155", cursor: "pointer", lineHeight: 1.4 }}>
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    style={{ width: "18px", height: "18px", marginTop: "2px", accentColor: "#0B2E6B", cursor: "pointer" }}
                  />
                  <span>
                    J&apos;ai lu et j&apos;accepte expressément les <strong>Conditions Générales d&apos;Utilisation</strong> et la Charte de Sécurité de Meet Me Club. *
                  </span>
                </label>

                {/* Case 2 : Exactitude des données */}
                <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13px", color: "#334155", cursor: "pointer", lineHeight: 1.4 }}>
                  <input
                    type="checkbox"
                    checked={dataAccuracyAccepted}
                    onChange={(e) => setDataAccuracyAccepted(e.target.checked)}
                    style={{ width: "18px", height: "18px", marginTop: "2px", accentColor: "#0B2E6B", cursor: "pointer" }}
                  />
                  <span>
                    Je certifie sur l&apos;honneur l&apos;<strong>exactitude de toutes les informations et photos fournies</strong> pour mon profil (aucun faux compte). *
                  </span>
                </label>

                {/* Case 3 : Confidentialité et discrétion */}
                <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13px", color: "#334155", cursor: "pointer", lineHeight: 1.4 }}>
                  <input
                    type="checkbox"
                    checked={confidentialityAccepted}
                    onChange={(e) => setConfidentialityAccepted(e.target.checked)}
                    style={{ width: "18px", height: "18px", marginTop: "2px", accentColor: "#0B2E6B", cursor: "pointer" }}
                  />
                  <span>
                    Je m&apos;engage au <strong>respect absolu de la vie privée des membres</strong> et j&apos;accepte le traitement sécurisé et confidentiel de mes données. *
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div style={{ display: "flex", gap: "12px", marginTop: "32px" }}>
            {step > 1 && (
              <button type="button" className="btn btn-outline-blue" onClick={goBack} style={{ flex: "0 0 auto" }}>
                ← Retour
              </button>
            )}
            <button
              type="button"
              id={`btn-step-${step}`}
              className={`btn btn-primary${loading ? " btn-loading" : ""}`}
              style={{ flex: 1, height: "50px", fontSize: "15px", fontWeight: 800 }}
              onClick={goNext}
              disabled={loading}
            >
              {loading ? "" : step === TOTAL_STEPS ? "✨ Valider mon Inscription & Rejoindre le Club" : "Continuer →"}
            </button>
          </div>

          {/* Étape facultative uniquement pour les étapes optionnelles 3, 4, 5 */}
          {[3, 4, 5].includes(step) && (
            <button type="button" className="btn btn-ghost btn-sm" style={{ width: "100%", marginTop: "8px" }} onClick={goNext}>
              Passer cette étape
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
