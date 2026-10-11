"use client";
// src/app/onboarding/page.tsx
// Multi-step onboarding wizard — 8 steps with auto-save

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const LANGUAGES = [
  { code: "fr", label: "🇫🇷 Français" },
  { code: "ewe", label: "Éwé" },
  { code: "kabiye", label: "Kabiyè" },
  { code: "en", label: "🇬🇧 Anglais" },
  { code: "other", label: "Autre" },
];
const GOALS = [
  { value: "EXCHANGE", label: "🤝 Échanger & Discuter", desc: "Partager des idées, passions et discuter librement" },
  { value: "FRIENDSHIP", label: "💛 Amitié & Sorties", desc: "Rencontres amicales, activités à Lomé" },
  { value: "SERIOUS", label: "❤️ Relation sérieuse", desc: "Relation durable et sincère" },
  { value: "MARRIAGE", label: "💍 Mariage", desc: "Cherche à fonder un foyer" },
  { value: "CASUAL", label: "😊 Sortie simple", desc: "Dîner ou café ponctuel" },
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
  neighborhood: string;
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
  city: "Lomé",
  neighborhood: "",
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
    if (step === 6) await loadInterests();

    // Save to API every 2 steps
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
          city: form.city,
          neighborhood: form.neighborhood || undefined,
          profession: form.profession || undefined,
          educationLevel: form.educationLevel || undefined,
          relationshipStatus: form.relationshipStatus || undefined,
          height: form.height ? parseInt(form.height) : undefined,
          religion: form.religion || undefined,
          hasChildren: form.hasChildren,
          languages: form.languages.length ? form.languages : undefined,
          bio: form.bio || undefined,
          relationshipGoal: form.relationshipGoal || undefined,
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

  // ── Finish onboarding ─────────────────────────────────────────
  async function handleFinish() {
    setLoading(true);
    try {
      await saveProgress();
      if (form.photos.length > 0) await uploadPhotos();
      // Save availabilities
      if (form.availabilities.length > 0) {
        await fetch("/api/profiles/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ availabilities: form.availabilities }),
        });
      }
      router.push("/profil?welcome=1");
    } catch {
      setError("Erreur lors de la sauvegarde. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  // ── Photo selection ───────────────────────────────────────────
  function handlePhotoSelect(files: FileList | null) {
    if (!files) return;
    const newFiles = Array.from(files).slice(0, 8 - form.photos.length);
    const previews = newFiles.map((f) => URL.createObjectURL(f));
    setForm((fd) => ({ ...fd, photos: [...fd.photos, ...newFiles] }));
    setPhotoPreview((p) => [...p, ...previews]);
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
                  <input id="firstName" type="text" className="input" placeholder="Ex: Armand" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} autoFocus />
                </div>
                <div className="input-group">
                  <label htmlFor="lastName" className="input-label" style={{ fontWeight: 700, color: "#0F172A" }}>Nom de famille *</label>
                  <input id="lastName" type="text" className="input" placeholder="Ex: Adzra" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div className="input-group">
                  <label htmlFor="phone" className="input-label" style={{ fontWeight: 700, color: "#0F172A" }}>Téléphone Togo (T-Money/Flooz)</label>
                  <input id="phone" type="tel" className="input" placeholder="+228 90 00 00 00" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                </div>
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
              <h2 style={{ fontSize: "22px", marginBottom: "6px" }}>Où êtes-vous ? 📍</h2>
              <p style={{ color: "var(--color-gray-500)", marginBottom: "24px", fontSize: "15px" }}>Pour trouver des profils proches de vous</p>

              <div className="input-group" style={{ marginBottom: "16px" }}>
                <label htmlFor="city" className="input-label">Ville *</label>
                <select id="city" className="input" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}>
                  <option value="Lomé">Lomé</option>
                  <option value="Kpalimé">Kpalimé</option>
                  <option value="Sokodé">Sokodé</option>
                  <option value="Atakpamé">Atakpamé</option>
                  <option value="Kara">Kara</option>
                </select>
              </div>

              <div className="input-group">
                <label htmlFor="neighborhood" className="input-label">Quartier (optionnel)</label>
                <input id="neighborhood" type="text" className="input" placeholder="Ex: Bè, Tokoin, Adidogomé..." value={form.neighborhood} onChange={(e) => setForm((f) => ({ ...f, neighborhood: e.target.value }))} />
                <p style={{ fontSize: "12px", color: "var(--color-gray-400)" }}>Votre adresse exacte ne sera jamais partagée.</p>
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

          {/* ── STEP 8: Photos & Availabilities ── */}
          {step === 8 && (
            <div>
              <h2 style={{ fontSize: "22px", marginBottom: "6px" }}>Photos & Disponibilités 📸</h2>
              <p style={{ color: "var(--color-gray-500)", marginBottom: "20px", fontSize: "15px" }}>Ajoutez au moins 1 photo et vos créneaux libres</p>

              {/* Photos */}
              <div style={{ marginBottom: "24px" }}>
                <label className="input-label" style={{ display: "block", marginBottom: "12px" }}>Vos photos (max 8)</label>
                {photoPreview.length > 0 && (
                  <div className="photo-grid" style={{ marginBottom: "12px" }}>
                    {photoPreview.map((src, i) => (
                      <div key={i} className="photo-thumb">
                        <Image src={src} alt={`Photo ${i + 1}`} fill style={{ objectFit: "cover" }} />
                        {i === 0 && <span className="photo-thumb-main-badge">Principale</span>}
                        <div className="photo-thumb-actions">
                          <button type="button" onClick={() => removePhoto(i)}
                            style={{ background: "rgba(0,0,0,0.6)", color: "white", border: "none", borderRadius: "50%", width: "24px", height: "24px", cursor: "pointer", fontSize: "12px" }}>
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {form.photos.length < 8 && (
                  <label htmlFor="photo-upload" className="photo-dropzone" style={{ display: "block", cursor: "pointer" }}>
                    <div style={{ fontSize: "32px", marginBottom: "8px" }}>📷</div>
                    <p style={{ fontWeight: 600, color: "var(--color-blue)", marginBottom: "4px" }}>Ajouter des photos</p>
                    <p style={{ fontSize: "13px", color: "var(--color-gray-400)" }}>JPG, PNG, WebP · Max 10 Mo</p>
                    <input id="photo-upload" type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => handlePhotoSelect(e.target.files)} />
                  </label>
                )}
              </div>

              {/* Availabilities */}
              <div>
                <label className="input-label" style={{ display: "block", marginBottom: "12px" }}>Vos disponibilités (jours libres)</label>
                <div className="week-grid">
                  {DAYS.map((d, i) => (
                    <button key={i} type="button"
                      className={`day-btn${form.availabilities.some((a) => a.dayOfWeek === i) ? " active" : ""}`}
                      onClick={() => toggleDay(i)}>
                      <span>{d}</span>
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: "12px", color: "var(--color-gray-400)", marginTop: "8px" }}>
                  Ces créneaux aident votre partenaire à vous proposer un bon moment.
                </p>
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
              style={{ flex: 1 }}
              onClick={goNext}
              disabled={loading}
            >
              {loading ? "" : step === TOTAL_STEPS ? "✨ Terminer mon profil" : "Continuer →"}
            </button>
          </div>

          {step < TOTAL_STEPS && (
            <button type="button" className="btn btn-ghost btn-sm" style={{ width: "100%", marginTop: "8px" }} onClick={goNext}>
              Passer cette étape
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
