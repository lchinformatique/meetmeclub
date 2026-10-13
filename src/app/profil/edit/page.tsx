"use client";
// src/app/profil/edit/page.tsx
// Edit profile information

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface ProfileData {
  firstName: string;
  lastName: string;
  pseudo: string;
  phone: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  city: string;
  neighborhood: string;
  profession: string;
  relationshipStatus: string;
  hasChildren: boolean | null;
  religion: string;
  height: number | null;
  languages: string[];
  bio: string;
  relationshipGoal: "FRIENDSHIP" | "SERIOUS" | "MARRIAGE" | "CASUAL" | "EXCHANGE";
}

const CITIES = [
  "Lomé",
  "Kpalimé",
  "Sokodé",
  "Kara",
  "Atakpamé",
  "Dapaong",
  "Tsévié",
  "Aného",
];

const NEIGHBORHOODS_LOME = [
  "Bè",
  "Nyékonakpoè",
  "Tokoin",
  "Agoè-Nyivé",
  "Hedzranawoé",
  "Baguida",
  "Adidogomé",
  "Déckon",
  "Hédzranawoé",
  "Amoutivé",
  "Avépozo",
  "Cacavéli",
  "Kégué",
  "Autre",
];

const LANGUAGES_LIST = [
  { code: "fr", label: "Français" },
  { code: "ewe", label: "Éwé" },
  { code: "kabyè", label: "Kabyè" },
  { code: "en", label: "Anglais" },
  { code: "mina", label: "Mina" },
];

export default function ProfilEditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [form, setForm] = useState<ProfileData>({
    firstName: "",
    lastName: "",
    pseudo: "",
    phone: "",
    gender: "OTHER",
    city: "Lomé",
    neighborhood: "",
    profession: "",
    relationshipStatus: "Célibataire",
    hasChildren: false,
    religion: "",
    height: null,
    languages: ["fr", "ewe"],
    bio: "",
    relationshipGoal: "SERIOUS",
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/profiles/me");
        if (res.status === 401) {
          router.push("/connexion");
          return;
        }
        const data = await res.json();
        if (data.profile) {
          setForm({
            firstName: data.profile.firstName || "",
            lastName: data.profile.lastName || "",
            pseudo: data.profile.pseudo || "",
            phone: data.profile.phone || "",
            gender: data.profile.gender || "OTHER",
            city: data.profile.city || "Lomé",
            neighborhood: data.profile.neighborhood || "",
            profession: data.profile.profession || "",
            relationshipStatus: data.profile.relationshipStatus || "Célibataire",
            hasChildren: data.profile.hasChildren ?? false,
            religion: data.profile.religion || "",
            height: data.profile.height || null,
            languages: data.profile.languages || ["fr"],
            bio: data.profile.bio || "",
            relationshipGoal: data.profile.relationshipGoal || "SERIOUS",
          });
        }
      } catch (err) {
        console.error("Erreur de chargement:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/profiles/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          height: form.height ? Number(form.height) : null,
          pseudo: form.pseudo.trim() ? form.pseudo.trim() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Erreur de mise à jour." });
        return;
      }

      setMessage({ type: "success", text: "Profil mis à jour avec succès !" });
      setTimeout(() => {
        router.push("/profil");
      }, 1200);
    } catch {
      setMessage({ type: "error", text: "Erreur réseau. Veuillez réessayer." });
    } finally {
      setSaving(false);
    }
  }

  function toggleLanguage(code: string) {
    setForm((prev) => {
      const has = prev.languages.includes(code);
      return {
        ...prev,
        languages: has ? prev.languages.filter((l) => l !== code) : [...prev.languages, code],
      };
    });
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--color-gray-500)", fontWeight: 500 }}>Chargement de vos informations...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: "var(--color-gray-50)" }}>
      {/* Header */}
      <header style={{ background: "white", borderBottom: "1px solid var(--color-gray-200)", position: "sticky", top: 0, zIndex: 40, height: "var(--header-height)", display: "flex", alignItems: "center" }}>
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/profil" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "var(--color-blue)", fontWeight: 600 }}>
            <span>←</span> Retour au profil
          </Link>
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
            <span style={{ fontWeight: 800, fontSize: "16px", color: "var(--color-blue)" }}>
              meet <span style={{ color: "var(--color-red)" }}>me</span> club
            </span>
          </div>
        </div>
      </header>

      <main className="container" style={{ maxWidth: "720px", paddingBlock: "40px" }}>
        <div className="card card-padded" style={{ boxShadow: "var(--shadow-md)" }}>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--color-blue)", marginBottom: "8px" }}>
            Modifier mon profil
          </h1>
          <p style={{ color: "var(--color-gray-500)", fontSize: "14px", marginBottom: "28px" }}>
            Gardez votre profil à jour pour augmenter vos chances d'obtenir des rendez-vous compatibles.
          </p>

          {message && (
            <div
              style={{
                padding: "14px 16px",
                borderRadius: "var(--radius-md)",
                marginBottom: "24px",
                fontSize: "14px",
                fontWeight: 600,
                background: message.type === "success" ? "#ECFDF5" : "#FEF2F2",
                color: message.type === "success" ? "#065F46" : "#991B1B",
                border: `1px solid ${message.type === "success" ? "#A7F3D0" : "#FECACA"}`,
              }}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Nom & Prénom */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="input-group">
                <label className="input-label" htmlFor="firstName" style={{ color: "#0F172A", fontWeight: 700 }}>Prénom *</label>
                <input
                  id="firstName"
                  className="input"
                  type="text"
                  required
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  style={{ color: "#0F172A", fontWeight: 600 }}
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="lastName" style={{ color: "#0F172A", fontWeight: 700 }}>Nom de famille</label>
                <input
                  id="lastName"
                  className="input"
                  type="text"
                  placeholder="Ex: Mensah"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  style={{ color: "#0F172A", fontWeight: 600 }}
                />
              </div>
            </div>

            {/* Pseudo & Téléphone */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="input-group">
                <label className="input-label" htmlFor="pseudo" style={{ color: "#0F172A", fontWeight: 700 }}>Pseudo public</label>
                <input
                  id="pseudo"
                  className="input"
                  type="text"
                  placeholder="Ex: Kodjo_228"
                  value={form.pseudo}
                  onChange={(e) => setForm({ ...form, pseudo: e.target.value })}
                  style={{ color: "#0F172A", fontWeight: 600 }}
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="phone" style={{ color: "#0F172A", fontWeight: 700 }}>Numéro de téléphone</label>
                <input
                  id="phone"
                  className="input"
                  type="tel"
                  placeholder="+228 90 XX XX XX"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  style={{ color: "#0F172A", fontWeight: 600 }}
                />
              </div>
            </div>

            {/* Genre & Objectif */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="input-group">
                <label className="input-label" htmlFor="gender">Genre</label>
                <select
                  id="gender"
                  className="input"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value as ProfileData["gender"] })}
                >
                  <option value="MALE">Homme</option>
                  <option value="FEMALE">Femme</option>
                  <option value="OTHER">Autre</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="relationshipGoal">Objectif relationnel</label>
                <select
                  id="relationshipGoal"
                  className="input"
                  value={form.relationshipGoal}
                  onChange={(e) => setForm({ ...form, relationshipGoal: e.target.value as ProfileData["relationshipGoal"] })}
                >
                  <option value="SERIOUS">❤️ Relation sérieuse</option>
                  <option value="MARRIAGE">💍 Mariage & Foyer</option>
                  <option value="FRIENDSHIP">💛 Amitié & Découverte</option>
                  <option value="EXCHANGE">🤝 Échanger, Discuter & Partager</option>
                  <option value="CASUAL">🎉 Sorties & Loisirs</option>
                </select>
              </div>
            </div>

            {/* Ville & Quartier */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="input-group">
                <label className="input-label" htmlFor="city">Ville</label>
                <select
                  id="city"
                  className="input"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="neighborhood">Quartier (Lomé)</label>
                <input
                  id="neighborhood"
                  className="input"
                  list="neighborhoods-list"
                  placeholder="Ex: Agoè, Bè, Tokoin..."
                  value={form.neighborhood}
                  onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                />
                <datalist id="neighborhoods-list">
                  {NEIGHBORHOODS_LOME.map((n) => (
                    <option key={n} value={n} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Profession & Situation */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="input-group">
                <label className="input-label" htmlFor="profession">Profession</label>
                <input
                  id="profession"
                  className="input"
                  type="text"
                  placeholder="Ex: Architecte, Commerçant..."
                  value={form.profession}
                  onChange={(e) => setForm({ ...form, profession: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="relationshipStatus">Situation</label>
                <select
                  id="relationshipStatus"
                  className="input"
                  value={form.relationshipStatus}
                  onChange={(e) => setForm({ ...form, relationshipStatus: e.target.value })}
                >
                  <option value="Célibataire">Célibataire</option>
                  <option value="Divorcé(e)">Divorcé(e)</option>
                  <option value="Veuf/Veuve">Veuf/Veuve</option>
                  <option value="Séparé(e)">Séparé(e)</option>
                </select>
              </div>
            </div>

            {/* Taille, Enfants, Religion */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
              <div className="input-group">
                <label className="input-label" htmlFor="height">Taille (cm)</label>
                <input
                  id="height"
                  className="input"
                  type="number"
                  min="120"
                  max="230"
                  placeholder="Ex: 175"
                  value={form.height || ""}
                  onChange={(e) => setForm({ ...form, height: e.target.value ? parseInt(e.target.value) : null })}
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="hasChildren">Avez-vous des enfants ?</label>
                <select
                  id="hasChildren"
                  className="input"
                  value={form.hasChildren === true ? "yes" : form.hasChildren === false ? "no" : ""}
                  onChange={(e) => setForm({ ...form, hasChildren: e.target.value === "yes" ? true : e.target.value === "no" ? false : null })}
                >
                  <option value="no">Non</option>
                  <option value="yes">Oui</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="religion">Religion (optionnel)</label>
                <input
                  id="religion"
                  className="input"
                  type="text"
                  placeholder="Ex: Chrétien, Musulman..."
                  value={form.religion}
                  onChange={(e) => setForm({ ...form, religion: e.target.value })}
                />
              </div>
            </div>

            {/* Langues */}
            <div className="input-group">
              <label className="input-label">Langues parlées</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "6px" }}>
                {LANGUAGES_LIST.map((lang) => {
                  const selected = form.languages.includes(lang.code);
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => toggleLanguage(lang.code)}
                      className={`btn btn-sm ${selected ? "btn-primary" : "btn-outline-blue"}`}
                      style={{ borderRadius: "var(--radius-full)" }}
                    >
                      {lang.label} {selected ? "✓" : "+"}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bio */}
            <div className="input-group">
              <label className="input-label" htmlFor="bio">
                Description libre (Bio)
                <span style={{ fontSize: "12px", color: "var(--color-gray-400)", marginLeft: "8px" }}>
                  {form.bio.length}/500 caractères
                </span>
              </label>
              <textarea
                id="bio"
                className="input"
                rows={4}
                maxLength={500}
                placeholder="Parlez de votre personnalité, vos passions, vos valeurs, et ce que vous appréciez lors d'un premier rendez-vous..."
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                style={{ resize: "vertical", minHeight: "100px" }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
              <button
                type="submit"
                className={`btn btn-primary ${saving ? "btn-loading" : ""}`}
                disabled={saving}
                style={{ flex: 1 }}
              >
                {saving ? "" : "Enregistrer les modifications ✓"}
              </button>
              <Link href="/profil" className="btn btn-outline-blue" style={{ flex: "0 0 auto" }}>
                Annuler
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
