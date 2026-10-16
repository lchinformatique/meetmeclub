"use client";
// src/app/profil/edit/page.tsx
// Complete Profile Editing with Supabase sync, 18+ validation, 8-photo album, wide phone input, and compact language selector

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Camera,
  Loader2,
  Star,
  Trash2,
  Plus,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  X,
  UploadCloud,
} from "lucide-react";

interface ProfilePhoto {
  id: string;
  url: string;
  isMain: boolean;
}

interface ProfileData {
  firstName: string;
  lastName: string;
  pseudo: string;
  dateOfBirth: string;
  placeOfBirth: string;
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

const AVAILABLE_LANGUAGES = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "Anglais", flag: "🇬🇧" },
  { code: "es", label: "Espagnol", flag: "🇪🇸" },
  { code: "de", label: "Allemand", flag: "🇩🇪" },
  { code: "it", label: "Italien", flag: "🇮🇹" },
  { code: "pt", label: "Portugais", flag: "🇵🇹" },
  { code: "zh", label: "Chinois (Mandarin)", flag: "🇨🇳" },
  { code: "ar", label: "Arabe", flag: "🇦🇪" },
  { code: "ru", label: "Russe", flag: "🇷🇺" },
  { code: "ee", label: "Mina / Éwé", flag: "🇹🇬" },
  { code: "kab", label: "Kabyè", flag: "🇹🇬" },
  { code: "yo", label: "Yoruba", flag: "🇳🇬" },
  { code: "ha", label: "Haoussa", flag: "🇳🇬" },
];

// Date limite stricte : 18 ans révolus aujourd'hui
const MAX_ALLOWED_DOB = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().split("T")[0];
})();

function calculateAge(dobString: string): number | null {
  if (!dobString) return null;
  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export default function ProfilEditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [coverUrl, setCoverUrl] = useState<string>("");
  const [photos, setPhotos] = useState<ProfilePhoto[]>([]);
  const [uploadingCover, setUploadingCover] = useState(false);

  const [selectedCountryCode, setSelectedCountryCode] = useState("+228");
  const [rawPhone, setRawPhone] = useState("");

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const photoAlbumInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ProfileData>({
    firstName: "",
    lastName: "",
    pseudo: "",
    dateOfBirth: "",
    placeOfBirth: "",
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

          // Initialisation Date de Naissance
          let dobValue = "";
          if (data.profile.dateOfBirth) {
            dobValue = String(data.profile.dateOfBirth).split("T")[0];
          }

          setForm({
            firstName: data.profile.firstName || "",
            lastName: data.profile.lastName || "",
            pseudo: data.profile.pseudo || "",
            dateOfBirth: dobValue,
            placeOfBirth: data.profile.placeOfBirth || "",
            phone: currentPhone,
            gender: data.profile.gender || "OTHER",
            city: data.profile.city || "Lomé",
            neighborhood: data.profile.neighborhood || "",
            profession: data.profile.profession || "",
            relationshipStatus: data.profile.relationshipStatus || "Célibataire",
            hasChildren: data.profile.hasChildren ?? false,
            religion: data.profile.religion || "",
            height: data.profile.height || null,
            languages: Array.isArray(data.profile.languages) ? data.profile.languages : ["fr", "en"],
            bio: data.profile.bio || "",
            relationshipGoal: data.profile.relationshipGoal || "SERIOUS",
          });

          // Photos
          if (Array.isArray(data.profile.photos) && data.profile.photos.length > 0) {
            setPhotos(data.profile.photos);
            const mainPic = data.profile.photos.find((p: any) => p.isMain)?.url || data.profile.photos[0]?.url;
            if (mainPic) setAvatarUrl(mainPic);
          } else if (data.profile.avatarUrl) {
            setAvatarUrl(data.profile.avatarUrl);
            setPhotos([{ id: "p_init", url: data.profile.avatarUrl, isMain: true }]);
          }

          if (data.profile.coverUrl) setCoverUrl(data.profile.coverUrl);
        }
      } catch (err) {
        console.error("Erreur de chargement profil:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [router]);

  // Upload Banniere de couverture
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
          const data = await res.json().catch(() => ({}));
          if (data.profile?.coverUrl) {
            setCoverUrl(data.profile.coverUrl);
          }
          setMessage({ type: "success", text: "Photo de couverture enregistrée avec succès !" });
        }
        setUploadingCover(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadingCover(false);
    }
  }

  // Upload photo de profil directe (Slot principal)
  async function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setAvatarUrl(base64);
        setPhotos((prev) => {
          const updated = [
            { id: `photo_${Date.now()}`, url: base64, isMain: true },
            ...prev.map((p) => ({ ...p, isMain: false })),
          ].slice(0, 8);
          return updated;
        });
        setMessage({ type: "success", text: "Photo de profil sélectionnée. N'oubliez pas d'enregistrer !" });
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.warn("Avatar select error:", err);
    }
  }

  // Upload dans l'album (jusqu'a 8 photos)
  async function handleAlbumPhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (photos.length >= 8) {
      setMessage({ type: "error", text: "Vous avez atteint la limite de 8 photos." });
      return;
    }
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setPhotos((prev) => {
          const isFirst = prev.length === 0;
          const next = [...prev, { id: `photo_${Date.now()}`, url: base64, isMain: isFirst }];
          if (isFirst) setAvatarUrl(base64);
          return next;
        });
        setMessage({ type: "success", text: "Photo ajoutée à l'album (" + (photos.length + 1) + "/8)." });
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.warn("Album upload error:", err);
    }
  }

  // Definir une photo de l'album comme photo principale
  function handleSetMainPhoto(index: number) {
    setPhotos((prev) => {
      const updated = prev.map((p, idx) => ({
        ...p,
        isMain: idx === index,
      }));
      setAvatarUrl(updated[index].url);
      return updated;
    });
    setMessage({ type: "success", text: "Photo définie comme principale !" });
  }

  // Supprimer une photo de l'album
  function handleDeletePhoto(index: number) {
    setPhotos((prev) => {
      const target = prev[index];
      const filtered = prev.filter((_, idx) => idx !== index);
      if (target.isMain && filtered.length > 0) {
        filtered[0].isMain = true;
        setAvatarUrl(filtered[0].url);
      } else if (filtered.length === 0) {
        setAvatarUrl("");
      }
      return filtered;
    });
  }

  // Langues : Ajout par menu deroulant compact
  function handleAddLanguage(code: string) {
    if (!code) return;
    if (!form.languages.includes(code)) {
      setForm((prev) => ({
        ...prev,
        languages: [...prev.languages, code],
      }));
    }
  }

  // Langues : Suppression badge
  function handleRemoveLanguage(code: string) {
    setForm((prev) => ({
      ...prev,
      languages: prev.languages.filter((l) => l !== code),
    }));
  }

  // Age calcule en temps reel
  const computedAge = calculateAge(form.dateOfBirth);
  const isUnderage = computedAge !== null && computedAge < 18;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    // Verification obligatoire 18+
    if (!form.dateOfBirth) {
      setMessage({ type: "error", text: "La date de naissance est obligatoire pour certifier votre majorité (18+ ans)." });
      return;
    }
    if (isUnderage) {
      setMessage({
        type: "error",
        text: `Vous avez indiqué ${computedAge} ans. L'accès à Meet Me Club est strictement réservé aux personnes majeures (18 ans et plus).`,
      });
      return;
    }
    if (!form.placeOfBirth.trim()) {
      setMessage({ type: "error", text: "Le lieu de naissance est obligatoire." });
      return;
    }

    setSaving(true);
    try {
      const finalPhone = rawPhone.trim() ? `${selectedCountryCode} ${rawPhone.trim()}` : "";
      const res = await fetch("/api/profiles/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          pseudo: form.pseudo.trim() ? form.pseudo.trim() : null,
          dateOfBirth: form.dateOfBirth,
          placeOfBirth: form.placeOfBirth.trim(),
          phone: finalPhone,
          gender: form.gender,
          city: form.city,
          neighborhood: form.neighborhood.trim(),
          profession: form.profession.trim(),
          relationshipStatus: form.relationshipStatus,
          hasChildren: form.hasChildren,
          religion: form.religion.trim(),
          height: form.height ? Number(form.height) : null,
          languages: form.languages,
          bio: form.bio.trim(),
          relationshipGoal: form.relationshipGoal,
          avatarUrl: avatarUrl || undefined,
          coverUrl: coverUrl || undefined,
          photos: photos.slice(0, 8),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Erreur de mise à jour du profil." });
        return;
      }

      if (data.profile) {
        if (data.profile.coverUrl) setCoverUrl(data.profile.coverUrl);
        if (Array.isArray(data.profile.photos)) setPhotos(data.profile.photos);
        const mainPic = data.profile.photos?.find((p: any) => p.isMain)?.url;
        if (mainPic) setAvatarUrl(mainPic);
      }

      setMessage({ type: "success", text: "Votre profil a été mis à jour avec succès !" });
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("mmclub_profile_updated", {
            detail: {
              ...form,
              age: computedAge,
              avatarUrl: data.profile?.avatarUrl || avatarUrl,
              coverUrl: data.profile?.coverUrl || coverUrl,
              photos: data.profile?.photos || photos,
            },
          })
        );
      }

      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.location.href = "/profil";
        } else {
          router.push("/profil");
        }
      }, 500);
    } catch {
      setMessage({ type: "error", text: "Erreur de connexion. Veuillez réessayer." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFC" }}>
        <div style={{ textAlign: "center" }}>
          <Loader2 size={36} color="#0B2559" style={{ animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
          <p style={{ color: "#64748B", fontWeight: 600 }}>Chargement de vos informations...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#F1F5F9" }}>
      {/* Inputs caches pour uploads */}
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
      <input
        ref={photoAlbumInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleAlbumPhotoSelect}
      />

      {/* Header Sticky avec support Safe Area iPhone Notch & Dynamic Island */}
      <header
        style={{
          background: "white",
          borderBottom: "1px solid #E2E8F0",
          position: "sticky",
          top: 0,
          zIndex: 40,
          paddingTop: "max(env(safe-area-inset-top, 0px), 0px)",
          minHeight: "calc(64px + max(env(safe-area-inset-top, 0px), 0px))",
          display: "flex",
          alignItems: "center",
          boxShadow: "0 2px 8px rgba(11,37,89,0.06)",
        }}
      >
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", paddingInline: "16px" }}>
          <Link
            href="/profil"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              textDecoration: "none",
              color: "#0B2559",
              fontWeight: 800,
              fontSize: "14px",
              background: "#F1F5F9",
              border: "1.5px solid #CBD5E1",
              padding: "8px 14px",
              borderRadius: "12px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
              transition: "all 0.18s ease",
            }}
          >
            <span style={{ fontSize: "16px", fontWeight: 900 }}>←</span>
            <span>Retour au profil</span>
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
            <span style={{ fontWeight: 800, fontSize: "16px", color: "#0B2559" }}>
              meet <span style={{ color: "#E11D48" }}>me</span> club
            </span>
          </div>
        </div>
      </header>

      <main className="container" style={{ maxWidth: "780px", paddingBlock: "32px" }}>
        <div
          style={{
            background: "white",
            borderRadius: "20px",
            padding: "28px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
            border: "1px solid #E2E8F0",
          }}
        >
          {/* Titre & Sous-titre */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
            <div>
              <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0B2559", margin: "0 0 6px" }}>
                Modifier mon profil
              </h1>
              <p style={{ color: "#64748B", fontSize: "14px", margin: 0 }}>
                Vos informations personnelles, photos d'album et coordonnées vérifiées.
              </p>
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#EFF6FF",
                border: "1px solid #BFDBFE",
                padding: "6px 12px",
                borderRadius: "100px",
                color: "#1E40AF",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              <ShieldCheck size={14} /> Profil vérifié & synchronisé
            </div>
          </div>

          {/* Banniere d'alerte / feedback */}
          {message && (
            <div
              style={{
                padding: "14px 16px",
                borderRadius: "12px",
                marginBottom: "24px",
                fontSize: "14px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: message.type === "success" ? "#ECFDF5" : "#FEF2F2",
                color: message.type === "success" ? "#065F46" : "#991B1B",
                border: `1px solid ${message.type === "success" ? "#A7F3D0" : "#FECACA"}`,
              }}
            >
              {message.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{message.text}</span>
            </div>
          )}

          {/* Section 1 : Banniere de Couverture & Avatar */}
          <div style={{ marginBottom: "32px" }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#0B2559", marginBottom: "8px", display: "flex", justifyContent: "space-between" }}>
              <span>Photo de couverture & Avatar</span>
              <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 500 }}>Visible par tous les membres</span>
            </div>

            {/* Rectangle de Couverture */}
            <div
              onClick={() => coverInputRef.current?.click()}
              style={{
                height: "160px",
                borderRadius: "16px",
                background: coverUrl
                  ? `url(${coverUrl}) center/cover no-repeat`
                  : "linear-gradient(135deg, #0B2559 0%, #163B8A 60%, #1D4ED8 100%)",
                position: "relative",
                cursor: "pointer",
                overflow: "hidden",
                border: "2px solid #CBD5E1",
                boxShadow: "inset 0 0 20px rgba(0,0,0,0.15)",
              }}
              title="Cliquez pour changer votre bannière de couverture"
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
                  background: "rgba(255,255,255,0.95)",
                  color: "#0B2559",
                  border: "none",
                  borderRadius: "100px",
                  padding: "7px 14px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
              >
                {uploadingCover ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Camera size={14} />}
                <span>{uploadingCover ? "Chargement..." : "Changer la couverture"}</span>
              </button>
            </div>

            {/* Avatar Superposé */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "-44px", paddingInline: "16px" }}>
              <div
                onClick={() => avatarInputRef.current?.click()}
                style={{
                  width: "88px",
                  height: "88px",
                  borderRadius: "50%",
                  border: "4px solid white",
                  background: "#EEF2FB",
                  overflow: "hidden",
                  position: "relative",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
                title="Cliquez pour changer votre photo de profil"
              >
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="Photo de profil" width={88} height={88} unoptimized style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                ) : (
                  <span style={{ fontSize: "30px", fontWeight: 800, color: "#0B2559" }}>
                    {(form.firstName || form.pseudo || "M").charAt(0).toUpperCase()}
                  </span>
                )}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0,0,0,0.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    opacity: 0.85,
                  }}
                >
                  <Camera size={22} />
                </div>
              </div>
              <div style={{ marginTop: "36px" }}>
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
                  Modifier ma photo principale
                </button>
                <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>
                  PNG, JPG ou WebP (optimisé pour mobile & desktop)
                </div>
              </div>
            </div>
          </div>

          {/* Section 2 : Album Photos (Jusqu'à 8 photos) */}
          <div
            style={{
              marginBottom: "32px",
              padding: "20px",
              background: "#F8FAFC",
              borderRadius: "16px",
              border: "1.5px solid #E2E8F0",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <div>
                <span style={{ fontSize: "15px", fontWeight: 800, color: "#0B2559" }}>
                  Album Photos de profil ({photos.length}/8)
                </span>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748B" }}>
                  Ajoutez jusqu'à 8 photos visibles par vos contacts lors des discussions.
                </p>
              </div>
              {photos.length < 8 && (
                <button
                  type="button"
                  onClick={() => photoAlbumInputRef.current?.click()}
                  style={{
                    background: "#0B2559",
                    color: "white",
                    border: "none",
                    borderRadius: "100px",
                    padding: "6px 14px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Plus size={14} /> Ajouter une photo
                </button>
              )}
            </div>

            {/* Grille de 8 slots */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(135px, 1fr))",
                gap: "12px",
              }}
            >
              {[0, 1, 2, 3, 4, 5, 6, 7].map((slotIdx) => {
                const photo = photos[slotIdx];
                if (photo) {
                  return (
                    <div
                      key={photo.id || slotIdx}
                      style={{
                        position: "relative",
                        aspectRatio: "1/1",
                        borderRadius: "12px",
                        overflow: "hidden",
                        border: photo.isMain ? "3px solid #2563EB" : "1.5px solid #CBD5E1",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                        background: "#E2E8F0",
                      }}
                    >
                      <img
                        src={photo.url}
                        alt={`Photo ${slotIdx + 1}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      {/* Badge principale */}
                      {photo.isMain && (
                        <div
                          style={{
                            position: "absolute",
                            top: "6px",
                            left: "6px",
                            background: "#2563EB",
                            color: "white",
                            padding: "3px 8px",
                            borderRadius: "100px",
                            fontSize: "10px",
                            fontWeight: 800,
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                          }}
                        >
                          <Star size={10} fill="white" /> Profil
                        </div>
                      )}
                      {/* Actions */}
                      <div
                        style={{
                          position: "absolute",
                          bottom: "6px",
                          left: "6px",
                          right: "6px",
                          display: "flex",
                          gap: "4px",
                          justifyContent: "space-between",
                        }}
                      >
                        {!photo.isMain && (
                          <button
                            type="button"
                            onClick={() => handleSetMainPhoto(slotIdx)}
                            title="Définir comme photo de profil principale"
                            style={{
                              background: "rgba(255,255,255,0.95)",
                              color: "#0B2559",
                              border: "none",
                              borderRadius: "6px",
                              padding: "4px 8px",
                              fontSize: "10px",
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "3px",
                            }}
                          >
                            <Star size={11} /> Principale
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeletePhoto(slotIdx)}
                          title="Supprimer cette photo"
                          style={{
                            background: "rgba(239, 68, 68, 0.95)",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            padding: "4px 8px",
                            cursor: "pointer",
                            marginLeft: "auto",
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                }

                // Slot vide
                return (
                  <div
                    key={`empty_${slotIdx}`}
                    onClick={() => photoAlbumInputRef.current?.click()}
                    style={{
                      aspectRatio: "1/1",
                      borderRadius: "12px",
                      border: "2px dashed #CBD5E1",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      background: "white",
                      color: "#64748B",
                      gap: "4px",
                      transition: "all 0.2s ease",
                    }}
                    title="Cliquez pour ajouter une photo dans ce slot"
                  >
                    <UploadCloud size={20} color="#94A3B8" />
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748B" }}>
                      Slot {slotIdx + 1}/8
                    </span>
                    <span style={{ fontSize: "10px", color: "#94A3B8" }}>+ Ajouter</span>
                  </div>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
            {/* Section 3 : Identité & Nom / Prénom / Pseudo */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="input-group">
                <label className="input-label" htmlFor="firstName" style={{ color: "#0F172A", fontWeight: 700 }}>
                  Prénom <span style={{ color: "#E11D48" }}>*</span>
                </label>
                <input
                  id="firstName"
                  className="input"
                  type="text"
                  required
                  placeholder="Ex: Jean, Sarah..."
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  style={{ color: "#0F172A", fontWeight: 600 }}
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="lastName" style={{ color: "#0F172A", fontWeight: 700 }}>
                  Nom de famille <span style={{ color: "#E11D48" }}>*</span>
                </label>
                <input
                  id="lastName"
                  className="input"
                  type="text"
                  required
                  placeholder="Ex: Mensah, Lawson..."
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  style={{ color: "#0F172A", fontWeight: 600 }}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="pseudo" style={{ color: "#0F172A", fontWeight: 700 }}>
                Pseudo public (affiché lors des discussions)
              </label>
              <input
                id="pseudo"
                className="input"
                type="text"
                placeholder="Ex: Kodjo_228, vic_lome..."
                value={form.pseudo}
                onChange={(e) => setForm({ ...form, pseudo: e.target.value })}
                style={{ color: "#0F172A", fontWeight: 600 }}
              />
            </div>

            {/* Section 4 : Date & Lieu de Naissance (18+ ans OBLIGATOIRE) */}
            <div
              style={{
                padding: "18px",
                background: isUnderage ? "#FEF2F2" : "#F0FDF4",
                borderRadius: "14px",
                border: isUnderage ? "1.5px solid #FCA5A5" : "1.5px solid #BBF7D0",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                <span style={{ fontSize: "14px", fontWeight: 800, color: "#0F172A" }}>
                  Date & Lieu de Naissance <span style={{ color: "#E11D48" }}>* Obligatoire (18+ ans)</span>
                </span>
                {computedAge !== null && (
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: "100px",
                      fontSize: "12px",
                      fontWeight: 800,
                      background: isUnderage ? "#DC2626" : "#16A34A",
                      color: "white",
                    }}
                  >
                    {isUnderage ? `⛔ ${computedAge} ans — Mineur Refusé` : `🎂 ${computedAge} ans — Majeur Certifié ✓`}
                  </span>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label htmlFor="dateOfBirth" style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                    Date de naissance *
                  </label>
                  <input
                    id="dateOfBirth"
                    type="date"
                    required
                    max={MAX_ALLOWED_DOB}
                    value={form.dateOfBirth}
                    onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: isUnderage ? "2px solid #EF4444" : "1.5px solid #CBD5E1",
                      background: "white",
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#0F172A",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="placeOfBirth" style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                    Lieu de naissance *
                  </label>
                  <input
                    id="placeOfBirth"
                    type="text"
                    required
                    placeholder="Ex: Lomé, Togo / Cotonou / Paris..."
                    value={form.placeOfBirth}
                    onChange={(e) => setForm({ ...form, placeOfBirth: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: "1.5px solid #CBD5E1",
                      background: "white",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#0F172A",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              {isUnderage && (
                <div style={{ marginTop: "10px", fontSize: "12px", fontWeight: 700, color: "#DC2626", display: "flex", alignItems: "center", gap: "6px" }}>
                  <AlertCircle size={15} />
                  Vous devez avoir au moins 18 ans révolus pour enregistrer votre profil.
                </div>
              )}
            </div>

            {/* Section 5 : Cadre du Numéro de Téléphone (Grand, Visible & Ajusté) */}
            <div
              style={{
                padding: "18px",
                background: "white",
                borderRadius: "14px",
                border: "2px solid #CBD5E1",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              <label
                htmlFor="phone-input-field"
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 800,
                  color: "#0B2559",
                  marginBottom: "8px",
                }}
              >
                Numéro de téléphone WhatsApp / Appel
              </label>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "#F8FAFC",
                  border: "2px solid #0B2559",
                  borderRadius: "12px",
                  overflow: "hidden",
                }}
              >
                {/* Select Pays */}
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
                    minWidth: "160px",
                    padding: "12px 14px",
                    background: "#EEF2F6",
                    border: "none",
                    borderRight: "2px solid #CBD5E1",
                    fontSize: "14px",
                    fontWeight: 800,
                    color: "#0B2559",
                    outline: "none",
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

                {/* Champ texte numéro : très lisible, grand, gras */}
                <input
                  id="phone-input-field"
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
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    border: "none",
                    background: "white",
                    fontSize: "16px",
                    fontWeight: 800,
                    letterSpacing: "0.5px",
                    color: "#0F172A",
                    outline: "none",
                  }}
                />
              </div>
              <p style={{ margin: "6px 0 0", fontSize: "11px", color: "#64748B" }}>
                💡 Les chiffres saisis sont parfaitement visibles et conservés pour vos échanges avec les membres.
              </p>
            </div>

            {/* Genre & Objectif */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="input-group">
                <label className="input-label" htmlFor="gender" style={{ color: "#0F172A", fontWeight: 700 }}>
                  Genre
                </label>
                <select
                  id="gender"
                  className="input"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value as ProfileData["gender"] })}
                  style={{ fontWeight: 600 }}
                >
                  <option value="MALE">Homme</option>
                  <option value="FEMALE">Femme</option>
                  <option value="OTHER">Autre</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="relationshipGoal" style={{ color: "#0F172A", fontWeight: 700 }}>
                  Objectif relationnel
                </label>
                <select
                  id="relationshipGoal"
                  className="input"
                  value={form.relationshipGoal}
                  onChange={(e) =>
                    setForm({ ...form, relationshipGoal: e.target.value as ProfileData["relationshipGoal"] })
                  }
                  style={{ fontWeight: 600 }}
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
                <label className="input-label" htmlFor="city" style={{ color: "#0F172A", fontWeight: 700 }}>
                  Ville de résidence
                </label>
                <select
                  id="city"
                  className="input"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  style={{ fontWeight: 600 }}
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="neighborhood" style={{ color: "#0F172A", fontWeight: 700 }}>
                  Quartier
                </label>
                <input
                  id="neighborhood"
                  className="input"
                  list="neighborhoods-list"
                  placeholder="Ex: Agoè, Bè, Tokoin..."
                  value={form.neighborhood}
                  onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                  style={{ fontWeight: 600 }}
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
                <label className="input-label" htmlFor="profession" style={{ color: "#0F172A", fontWeight: 700 }}>
                  Profession
                </label>
                <input
                  id="profession"
                  className="input"
                  type="text"
                  placeholder="Ex: Architecte, Commerçant(e)..."
                  value={form.profession}
                  onChange={(e) => setForm({ ...form, profession: e.target.value })}
                  style={{ fontWeight: 600 }}
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="relationshipStatus" style={{ color: "#0F172A", fontWeight: 700 }}>
                  Situation
                </label>
                <select
                  id="relationshipStatus"
                  className="input"
                  value={form.relationshipStatus}
                  onChange={(e) => setForm({ ...form, relationshipStatus: e.target.value })}
                  style={{ fontWeight: 600 }}
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
                <label className="input-label" htmlFor="height" style={{ color: "#0F172A", fontWeight: 700 }}>
                  Taille (cm)
                </label>
                <input
                  id="height"
                  className="input"
                  type="number"
                  min="120"
                  max="230"
                  placeholder="Ex: 175"
                  value={form.height || ""}
                  onChange={(e) => setForm({ ...form, height: e.target.value ? parseInt(e.target.value) : null })}
                  style={{ fontWeight: 600 }}
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="hasChildren" style={{ color: "#0F172A", fontWeight: 700 }}>
                  Enfants ?
                </label>
                <select
                  id="hasChildren"
                  className="input"
                  value={form.hasChildren === true ? "yes" : form.hasChildren === false ? "no" : ""}
                  onChange={(e) =>
                    setForm({ ...form, hasChildren: e.target.value === "yes" ? true : e.target.value === "no" ? false : null })
                  }
                  style={{ fontWeight: 600 }}
                >
                  <option value="no">Non</option>
                  <option value="yes">Oui</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="religion" style={{ color: "#0F172A", fontWeight: 700 }}>
                  Religion (optionnel)
                </label>
                <input
                  id="religion"
                  className="input"
                  type="text"
                  placeholder="Ex: Chrétien, Musulman..."
                  value={form.religion}
                  onChange={(e) => setForm({ ...form, religion: e.target.value })}
                  style={{ fontWeight: 600 }}
                />
              </div>
            </div>

            {/* Section 6 : Langues parlées (Menu déroulant compact + badges sleek) */}
            <div className="input-group">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <label className="input-label" htmlFor="lang-dropdown" style={{ color: "#0F172A", fontWeight: 700, margin: 0 }}>
                  Langues parlées
                </label>
                <span style={{ fontSize: "11px", color: "#64748B" }}>
                  Sélectionnez dans la liste déroulante
                </span>
              </div>

              {/* Menu déroulant compact */}
              <select
                id="lang-dropdown"
                className="input"
                defaultValue=""
                onChange={(e) => {
                  handleAddLanguage(e.target.value);
                  e.target.value = "";
                }}
                style={{
                  maxWidth: "320px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#0B2559",
                  background: "white",
                  marginBottom: "10px",
                }}
              >
                <option value="" disabled>
                  + Ajouter une langue à votre profil...
                </option>
                {AVAILABLE_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} disabled={form.languages.includes(lang.code)}>
                    {lang.flag} {lang.label} {form.languages.includes(lang.code) ? "(Déjà ajoutée)" : ""}
                  </option>
                ))}
              </select>

              {/* Badges sleek compacts des langues sélectionnées */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {form.languages.map((code) => {
                  const item = AVAILABLE_LANGUAGES.find((l) => l.code === code) || {
                    code,
                    label: code,
                    flag: "🌐",
                  };
                  return (
                    <span
                      key={code}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "5px 12px",
                        borderRadius: "100px",
                        background: "#EFF6FF",
                        border: "1px solid #BFDBFE",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#1E40AF",
                      }}
                    >
                      <span>
                        {item.flag} {item.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveLanguage(code)}
                        title="Retirer cette langue"
                        style={{
                          background: "none",
                          border: "none",
                          color: "#64748B",
                          cursor: "pointer",
                          padding: 0,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <X size={13} />
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Section 7 : Bio / Description */}
            <div className="input-group">
              <label className="input-label" htmlFor="bio" style={{ color: "#0F172A", fontWeight: 700 }}>
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
                placeholder="Parlez de votre personnalité, vos passions, vos valeurs, et ce que vous appréciez lors d'une première rencontre..."
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                style={{ resize: "vertical", minHeight: "100px", fontWeight: 500 }}
              />
            </div>

            {/* Actions Soumission */}
            <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
              <button
                type="submit"
                className={`btn btn-primary ${saving ? "btn-loading" : ""}`}
                disabled={saving || isUnderage}
                style={{
                  flex: 1,
                  padding: "14px",
                  fontSize: "15px",
                  fontWeight: 800,
                  background: isUnderage ? "#94A3B8" : "var(--color-blue)",
                  cursor: isUnderage ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Enregistrement en cours..." : "Enregistrer les modifications ✓"}
              </button>
              <Link href="/profil" className="btn btn-outline-blue" style={{ flex: "0 0 auto", padding: "14px 20px" }}>
                Annuler
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
