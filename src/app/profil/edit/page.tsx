"use client";
// src/app/profil/edit/page.tsx
// Edit profile information

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Camera, Loader2, Sparkles } from "lucide-react";

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

const COUNTRY_CODES = [
  { code: "+228", country: "Togo", flag: "🇹🇬" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+229", country: "Bénin", flag: "🇧🇯" },
  { code: "+225", country: "Côte d'Ivoire", flag: "🇨🇮" },
  { code: "+233", country: "Ghana", flag: "🇬🇭" },
  { code: "+221", country: "Sénégal", flag: "🇸🇳" },
  { code: "+226", country: "Burkina Faso", flag: "🇧🇫" },
  { code: "+234", country: "Nigeria", flag: "🇳🇬" },
  { code: "+237", country: "Cameroun", flag: "🇨🇲" },
  { code: "+241", country: "Gabon", flag: "🇬🇦" },
  { code: "+242", country: "Congo", flag: "🇨🇬" },
  { code: "+243", country: "RDC", flag: "🇨🇩" },
  { code: "+223", country: "Mali", flag: "🇲🇱" },
  { code: "+224", country: "Guinée", flag: "🇬🇳" },
  { code: "+227", country: "Niger", flag: "🇳🇪" },
  { code: "+32", country: "Belgique", flag: "🇧🇪" },
  { code: "+41", country: "Suisse", flag: "🇨🇭" },
  { code: "+1", country: "Canada / USA", flag: "🇨🇦" },
  { code: "+49", country: "Allemagne", flag: "🇩🇪" },
  { code: "+44", country: "Royaume-Uni", flag: "🇬🇧" },
  { code: "+34", country: "Espagne", flag: "🇪🇸" },
  { code: "+39", country: "Italie", flag: "🇮🇹" },
  { code: "+351", country: "Portugal", flag: "🇵🇹" },
  { code: "+212", country: "Maroc", flag: "🇲🇦" },
  { code: "+216", country: "Tunisie", flag: "🇹🇳" },
  { code: "+971", country: "Émirats Arabes Unis", flag: "🇦🇪" },
  { code: "+86", country: "Chine", flag: "🇨🇳" },
];

const LANGUAGES_LIST = [
  { code: "fr", label: "🇫🇷 Français" },
  { code: "en", label: "🇬🇧 Anglais" },
  { code: "es", label: "🇪🇸 Espagnol" },
  { code: "de", label: "🇩🇪 Allemand" },
  { code: "it", label: "🇮🇹 Italien" },
  { code: "pt", label: "🇵🇹 Portugais" },
  { code: "zh", label: "🇨🇳 Chinois" },
  { code: "ar", label: "🇦🇪 Arabe" },
];

export default function ProfilEditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [coverUrl, setCoverUrl] = useState<string>("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const [selectedCountryCode, setSelectedCountryCode] = useState("+228");
  const [rawPhone, setRawPhone] = useState("");

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

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
    languages: ["fr", "en"],
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
          const currentPhone = data.profile.phone || "";
          const matchedCountry = COUNTRY_CODES.find((c) => currentPhone.startsWith(c.code));
          if (matchedCountry) {
            setSelectedCountryCode(matchedCountry.code);
            setRawPhone(currentPhone.substring(matchedCountry.code.length).trim());
          } else {
            setRawPhone(currentPhone);
          }

          setForm({
            firstName: data.profile.firstName || "",
            lastName: data.profile.lastName || "",
            pseudo: data.profile.pseudo || "",
            phone: currentPhone,
            gender: data.profile.gender || "OTHER",
            city: data.profile.city || "Lomé",
            neighborhood: data.profile.neighborhood || "",
            profession: data.profile.profession || "",
            relationshipStatus: data.profile.relationshipStatus || "Célibataire",
            hasChildren: data.profile.hasChildren ?? false,
            religion: data.profile.religion || "",
            height: data.profile.height || null,
            languages: data.profile.languages || ["fr", "en"],
            bio: data.profile.bio || "",
            relationshipGoal: data.profile.relationshipGoal || "SERIOUS",
          });
          const mainPic = data.profile.photos?.find((p: any) => p.isMain)?.url || data.profile.photos?.[0]?.url;
          if (mainPic) setAvatarUrl(mainPic);
          if (data.profile.coverUrl) setCoverUrl(data.profile.coverUrl);
        }
      } catch (err) {
        console.error("Erreur de chargement:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [router]);

  // Upload photo de profil
  async function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        setAvatarUrl(base64);
        const res = await fetch("/api/profiles/me/photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64, isMain: true }),
        });
        if (res.ok) {
          setMessage({ type: "success", text: "Photo de profil mise à jour avec succès !" });
        }
        setUploadingAvatar(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadingAvatar(false);
    }
  }

  // Upload bannière de couverture
  async function handleCoverSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        setCoverUrl(base64);
        const res = await fetch("/api/profiles/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ coverUrl: base64 }),
        });
        if (res.ok) {
          setMessage({ type: "success", text: "Photo de couverture mise à jour !" });
        }
        setUploadingCover(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadingCover(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const finalPhone = rawPhone.trim() ? `${selectedCountryCode} ${rawPhone.trim()}` : "";
      const res = await fetch("/api/profiles/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          phone: finalPhone,
          avatarUrl: avatarUrl || undefined,
          coverUrl: coverUrl || undefined,
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
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("mmclub_profile_updated", { detail: { ...form, avatarUrl, coverUrl } }));
      }
      router.refresh();
      setTimeout(() => {
        router.push("/profil");
        router.refresh();
      }, 700);
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

          {/* ── Photo de couverture & Photo de profil ── */}
          <div style={{ marginBottom: "28px" }}>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleCoverSelect}
            />
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleAvatarSelect}
            />

            {/* Bannière de couverture */}
            <div
              onClick={() => coverInputRef.current?.click()}
              style={{
                height: "150px",
                borderRadius: "16px",
                background: coverUrl
                  ? `url(${coverUrl}) center/cover no-repeat`
                  : "linear-gradient(135deg, #0B2559 0%, #163B8A 60%, #1D4ED8 100%)",
                position: "relative",
                cursor: "pointer",
                overflow: "hidden",
                border: "1px solid #CBD5E1",
              }}
              title="Cliquez pour changer la photo de couverture"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  coverInputRef.current?.click();
                }}
                style={{
                  position: "absolute",
                  top: "12px",
                  right: "12px",
                  background: "rgba(255,255,255,0.92)",
                  color: "#0B2559",
                  border: "none",
                  borderRadius: "100px",
                  padding: "6px 14px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
              >
                {uploadingCover ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Camera size={13} />}
                <span>{uploadingCover ? "Chargement..." : "Changer couverture"}</span>
              </button>
            </div>

            {/* Photo de profil (Avatar en superposition) */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "-40px", paddingInline: "16px" }}>
              <div
                onClick={() => avatarInputRef.current?.click()}
                style={{
                  width: "84px",
                  height: "84px",
                  borderRadius: "50%",
                  border: "4px solid white",
                  background: "#EEF2FB",
                  overflow: "hidden",
                  position: "relative",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
                title="Cliquez pour changer votre photo de profil"
              >
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="Photo de profil" width={84} height={84} unoptimized style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                ) : (
                  <span style={{ fontSize: "28px", fontWeight: 800, color: "#0B2559" }}>
                    {(form.firstName || form.pseudo || "M").charAt(0).toUpperCase()}
                  </span>
                )}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0,0,0,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    opacity: uploadingAvatar ? 1 : 0.8,
                  }}
                >
                  {uploadingAvatar ? <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} /> : <Camera size={20} />}
                </div>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#2563EB",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                    textDecoration: "underline",
                    padding: 0,
                  }}
                >
                  Changer ma photo de profil
                </button>
                <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>
                  JPEG, PNG ou WebP (max 8 Mo)
                </div>
              </div>
            </div>
          </div>

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
                <label className="input-label" htmlFor="phone" style={{ color: "#0F172A", fontWeight: 700 }}>
                  Numéro de téléphone
                </label>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <select
                    value={selectedCountryCode}
                    onChange={(e) => {
                      const code = e.target.value;
                      setSelectedCountryCode(code);
                      setForm((prev) => ({
                        ...prev,
                        phone: rawPhone.trim() ? `${code} ${rawPhone.trim()}` : "",
                      }));
                    }}
                    style={{
                      width: "145px",
                      borderRadius: "10px",
                      border: "1.5px solid #CBD5E1",
                      padding: "10px 8px",
                      background: "white",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#0B2559",
                      outline: "none",
                      flexShrink: 0,
                      cursor: "pointer",
                    }}
                    title="Choisir votre pays"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={`${c.country}-${c.code}`} value={c.code}>
                        {c.flag} {c.code} ({c.country})
                      </option>
                    ))}
                  </select>
                  <input
                    id="phone"
                    className="input"
                    type="tel"
                    placeholder="90 XX XX XX"
                    value={rawPhone}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRawPhone(val);
                      setForm((prev) => ({
                        ...prev,
                        phone: val.trim() ? `${selectedCountryCode} ${val.trim()}` : "",
                      }));
                    }}
                    style={{ color: "#0F172A", fontWeight: 600, flex: 1 }}
                  />
                </div>
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
