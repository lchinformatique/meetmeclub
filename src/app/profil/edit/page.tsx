"use client";
// src/app/profil/edit/page.tsx
// Complete Profile Editing with Supabase sync, 18+ validation, 8-photo album, wide phone input, and compact language selector

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { compressImage } from "@/app/messages/_lib/chat-utils";
import CountryPicker from "@/components/forms/CountryPicker";
import PhoneField from "@/components/forms/PhoneField";
import BirthDateField from "@/components/forms/BirthDateField";
import LanguagePicker from "@/components/forms/LanguagePicker";
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
  /** Pays de résidence (code ISO) */
  country: string;
  /** Adresse de résidence : obligatoire, privée (jamais montrée aux autres membres) */
  address: string;
  profession: string;
  relationshipStatus: string;
  hasChildren: boolean | null;
  religion: string;
  height: number | null;
  languages: string[];
  bio: string;
  relationshipGoal: "FRIENDSHIP" | "SERIOUS" | "MARRIAGE" | "CASUAL" | "EXCHANGE";
}

// Tous les pays du monde (indicatif + drapeau) : voir src/lib/countries.ts

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
    city: "",
    country: "",
    address: "",
    profession: "",
    relationshipStatus: "Célibataire",
    hasChildren: false,
    religion: "",
    height: null,
    languages: ["fr", "en"],
    bio: "",
    relationshipGoal: "SERIOUS",
  });

  // Arrivée juste après l'inscription (?welcome=1)
  const [isWelcome, setIsWelcome] = useState(false);
  useEffect(() => {
    setIsWelcome(new URLSearchParams(window.location.search).get("welcome") === "1");
  }, []);

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

          // Initialisation Date de Naissance
          let dobValue = "";
          if (data.profile.dateOfBirth) {
            dobValue = String(data.profile.dateOfBirth).split("T")[0];
          }

          let cleanFirst = data.profile.firstName || "";
          let cleanPseudo = data.profile.pseudo || "";
          if (cleanFirst.startsWith("google_")) cleanFirst = "Nouveau Membre";
          if (cleanPseudo.startsWith("google_")) cleanPseudo = "membre";

          setForm({
            firstName: cleanFirst,
            lastName: data.profile.lastName || "",
            pseudo: cleanPseudo,
            dateOfBirth: dobValue,
            // Lieu de naissance : jamais prérempli (anciennes valeurs par défaut ignorées)
            placeOfBirth: ["Lomé", "Lome"].includes(data.profile.placeOfBirth) ? "" : data.profile.placeOfBirth || "",
            phone: currentPhone,
            gender: data.profile.gender || "OTHER",
            // Valeurs par défaut posées automatiquement autrefois → champ vide à remplir soi-même
            city: data.profile.city || "",
            country: data.profile.country || "",
            address: data.profile.address || "",
            profession: ["Professionnel(le)", "Membre actif", "Membre"].includes(data.profile.profession) ? "" : data.profile.profession || "",
            relationshipStatus: data.profile.relationshipStatus || "Célibataire",
            hasChildren: data.profile.hasChildren ?? false,
            religion: data.profile.religion || "",
            height: data.profile.height || null,
            languages: Array.isArray(data.profile.languages) ? data.profile.languages : ["fr", "en"],
            bio: data.profile.bio || "",
            relationshipGoal: data.profile.relationshipGoal || "SERIOUS",
          });

          // Photos (filtrer les initiales SVG DiceBear pour ne garder que les vraies photos)
          const realPhotos = (Array.isArray(data.profile.photos) ? data.profile.photos : [])
            .filter((p: any) => p.url && !p.url.includes("dicebear.com/7.x/initials"));

          if (realPhotos.length > 0) {
            setPhotos(realPhotos);
            const mainPic = realPhotos.find((p: any) => p.isMain)?.url || realPhotos[0]?.url;
            if (mainPic) setAvatarUrl(mainPic);
          } else if (data.profile.avatarUrl && !data.profile.avatarUrl.includes("dicebear.com/7.x/initials")) {
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
      // Compression avant envoi : une photo de téléphone brute dépasse la limite d'envoi du serveur
      const base64 = await compressImage(file, 1600, 0.8);
      setCoverUrl(base64);
      const res = await fetch("/api/profiles/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverUrl: base64 }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.profile?.coverUrl) setCoverUrl(data.profile.coverUrl);
        setMessage({ type: "success", text: "Photo de couverture enregistrée avec succès !" });
      } else {
        setMessage({ type: "error", text: "La photo de couverture n'a pas pu être enregistrée. Réessayez." });
      }
    } catch {
      setMessage({ type: "error", text: "La photo de couverture n'a pas pu être enregistrée. Réessayez." });
    } finally {
      setUploadingCover(false);
      e.target.value = "";
    }
  }

  // Upload photo de profil directe (Slot principal)
  async function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await compressImage(file, 1280, 0.82);
      setAvatarUrl(base64);
      setPhotos((prev) =>
        [
          { id: `photo_${Date.now()}`, url: base64, isMain: true },
          ...prev.map((p) => ({ ...p, isMain: false })),
        ].slice(0, 4)
      );
      setMessage({ type: "success", text: "Photo de profil sélectionnée. N'oubliez pas d'enregistrer !" });
    } catch (err) {
      console.warn("Avatar select error:", err);
    } finally {
      e.target.value = "";
    }
  }

  // Upload dans l'album (jusqu'a 4 photos dans la bio)
  async function handleAlbumPhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (photos.length >= 4) {
      setMessage({ type: "error", text: "Vous avez atteint la limite de 4 photos dans votre bio." });
      return;
    }
    try {
      const base64 = await compressImage(file, 1280, 0.82);
      const isFirst = photos.length === 0;
      if (isFirst) setAvatarUrl(base64);
      setPhotos((prev) => [...prev, { id: `photo_${Date.now()}`, url: base64, isMain: prev.length === 0 }].slice(0, 4));
      setMessage({ type: "success", text: "Photo ajoutée à la bio (" + Math.min(photos.length + 1, 4) + "/4). N'oubliez pas d'enregistrer !" });
    } catch (err) {
      console.warn("Album upload error:", err);
    } finally {
      e.target.value = "";
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

    // Transparence et sécurité : pays, ville et adresse de résidence obligatoires
    if (!form.country || !form.city.trim() || form.address.trim().length < 5) {
      setMessage({ type: "error", text: "Indiquez votre pays, votre ville et votre adresse de résidence (obligatoires, l'adresse reste privée)." });
      return;
    }

    setSaving(true);
    try {
      const finalPhone = form.phone.trim();
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
          city: form.city.trim(),
          country: form.country,
          address: form.address.trim(),
          profession: form.profession.trim(),
          relationshipStatus: form.relationshipStatus,
          hasChildren: form.hasChildren,
          religion: form.religion.trim(),
          height: form.height ? Number(form.height) : null,
          languages: form.languages,
          bio: form.bio.trim(),
          relationshipGoal: form.relationshipGoal,
          // La photo principale fait partie de l'album : inutile de l'envoyer deux fois
          avatarUrl: photos.length === 0 ? avatarUrl || undefined : undefined,
          // La couverture est enregistrée dès sa sélection ; on ne renvoie que son adresse
          coverUrl: coverUrl && !coverUrl.startsWith("data:") ? coverUrl : undefined,
          photos: photos.slice(0, 4),
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

      setMessage({ type: "success", text: "Profil enregistré ✓ Retour à votre profil…" });
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

      // Nouveau membre : profil complété → directement vers les membres en ligne pour discuter
      const nextPage = isWelcome ? "/messages?tab=online&welcome=1" : "/profil";
      setTimeout(() => {
        window.location.href = nextPage;
      }, 1400);
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
        {isWelcome && (
          <div
            style={{
              marginBottom: "18px",
              padding: "16px 18px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #0B2559 0%, #163B8A 100%)",
              color: "white",
              boxShadow: "0 10px 30px rgba(11,37,89,0.25)",
            }}
          >
            <div style={{ fontWeight: 800, fontSize: "17px", marginBottom: "4px" }}>
              Bienvenue {form.firstName || ""} ! 🎉 Votre compte est créé.
            </div>
            <div style={{ fontSize: "14px", lineHeight: 1.5, color: "rgba(255,255,255,0.88)" }}>
              Dernière étape : ajoutez votre photo, votre bio et vos informations, puis touchez « Enregistrer ». Vous
              verrez ensuite les membres en ligne pour commencer à discuter.
            </div>
          </div>
        )}
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
              <div style={{ marginTop: "56px", minWidth: 0 }}>
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

          {/* Section 2 : Album Photos de Bio (Jusqu'à 4 photos) */}
          <div
            style={{
              marginBottom: "32px",
              padding: "20px",
              background: "#F8FAFC",
              borderRadius: "16px",
              border: "1.5px solid #E2E8F0",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <span style={{ fontSize: "15px", fontWeight: 800, color: "#0B2559" }}>
                  Photos de profil & Bio ({photos.length}/4)
                </span>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748B" }}>
                  Ajoutez jusqu'à 4 photos pour enrichir votre bio et votre fiche membre.
                </p>
              </div>
              {photos.length < 4 && (
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

            {/* Grille de 4 slots */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: "12px",
              }}
            >
              {[0, 1, 2, 3].map((slotIdx) => {
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
                      border: "2px dashed #9FB1DC",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      background: "#F6F8FC",
                      color: "#64748B",
                      gap: "4px",
                      transition: "all 0.2s ease",
                    }}
                    title="Cliquez pour ajouter une photo dans ce slot"
                  >
                    <UploadCloud size={24} color="#2F4A8A" />
                    <span style={{ fontSize: "13px", fontWeight: 800, color: "#2F4A8A" }}>
                      Photo {slotIdx + 1}
                    </span>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>+ Ajouter une photo</span>
                  </div>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
            {/* Section 3 : Identité & Nom / Prénom / Pseudo */}
            <div className="edit-grid-2">
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

              <div className="edit-grid-2">
                <div>
                  <label htmlFor="dateOfBirth" className="edit-label">
                    Date de naissance *
                  </label>
                  <BirthDateField idPrefix="dateOfBirth" value={form.dateOfBirth} invalid={isUnderage} onChange={(dateOfBirth) => setForm((f) => ({ ...f, dateOfBirth }))} />
                </div>

                <div>
                  <label htmlFor="placeOfBirth" className="edit-label">
                    Lieu de naissance *
                  </label>
                  <input
                    id="placeOfBirth"
                    type="text"
                    required
                    autoComplete="off"
                    placeholder="Ville et pays de naissance"
                    value={form.placeOfBirth}
                    onChange={(e) => setForm({ ...form, placeOfBirth: e.target.value })}
                    className="edit-field"
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
                Numéro de téléphone
              </label>

              <PhoneField id="phone-input-field" value={form.phone} defaultCountry={form.country || null} onChange={(phone) => setForm((prev) => ({ ...prev, phone }))} />
              <p style={{ margin: "8px 0 0", fontSize: "12px", color: "#64748B" }}>
                Utilisez le numéro mobile money avec lequel vous payez : vos pass s&apos;activeront automatiquement.
              </p>
            </div>

            {/* Genre & Objectif */}
            <div className="edit-grid-2">
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

            {/* Pays, ville et adresse de résidence (obligatoires) */}
            <div className="input-group">
              <label className="input-label" htmlFor="country" style={{ color: "#0F172A", fontWeight: 700 }}>
                Pays de résidence *
              </label>
              <CountryPicker id="country" value={form.country} onChange={(c) => setForm((prev) => ({ ...prev, country: c.iso }))} />
            </div>
            <div className="edit-grid-2">
              <div className="input-group">
                <label className="input-label" htmlFor="city" style={{ color: "#0F172A", fontWeight: 700 }}>
                  Ville de résidence *
                </label>
                <input
                  id="city"
                  className="input"
                  type="text"
                  autoComplete="address-level2"
                  placeholder="Votre ville"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  maxLength={60}
                  style={{ fontWeight: 600 }}
                />
              </div>
              <div className="input-group">
                <label className="input-label" htmlFor="address" style={{ color: "#0F172A", fontWeight: 700 }}>
                  Adresse de résidence *
                </label>
                <input
                  id="address"
                  className="input"
                  type="text"
                  autoComplete="street-address"
                  placeholder="N°, rue, code postal"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  maxLength={160}
                  style={{ fontWeight: 600 }}
                />
              </div>
            </div>
            <p style={{ margin: "-6px 0 0", fontSize: "12px", color: "#64748B", lineHeight: 1.5 }}>
              🔒 Votre adresse est demandée pour la transparence et la sécurité du club. Elle reste privée : seuls votre pays et
              votre ville sont visibles des autres membres.
            </p>

            {/* Profession & Situation */}
            <div className="edit-grid-2">
              <div className="input-group">
                <label className="input-label" htmlFor="profession" style={{ color: "#0F172A", fontWeight: 700 }}>
                  Profession
                </label>
                <input
                  id="profession"
                  className="input"
                  type="text"
                  placeholder="Votre profession"
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

            {/* Section 6 : Langues parlées (pastilles à toucher) */}
            <div className="input-group">
              <label className="input-label" style={{ color: "#0F172A", fontWeight: 700 }}>
                Langues parlées
              </label>
              <LanguagePicker value={form.languages} onChange={(languages) => setForm((f) => ({ ...f, languages }))} />
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

            {/* Actions : Annuler / Enregistrer — alignés et de même hauteur */}
            <div className="edit-actions">
              <Link href="/profil" className="edit-btn edit-btn-cancel">
                Annuler
              </Link>
              <button type="submit" className="edit-btn edit-btn-save" disabled={saving || isUnderage}>
                {saving ? (
                  <>
                    <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Enregistrement…
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} /> Enregistrer les modifications
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Confirmation bien visible, puis retour automatique sur le profil */}
      {message && (
        <div className={`edit-toast ${message.type === "success" ? "edit-toast-ok" : "edit-toast-err"}`} role="status">
          {message.type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span>{message.text}</span>
        </div>
      )}

      <style>{`
        .edit-grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
        .edit-label { display: block; font-size: 12px; font-weight: 800; color: #334155; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.3px; }
        .edit-field { width: 100%; height: 50px; padding: 0 14px; border-radius: 12px; border: 1.5px solid #CBD5E1; background: #fff; font-size: 16px; font-weight: 600; color: #0F172A; outline: none; box-sizing: border-box; -webkit-appearance: none; appearance: none; }
        .edit-field:focus { border-color: #0B2559; box-shadow: 0 0 0 3px rgba(11,37,89,0.1); }
        .edit-field-error { border: 2px solid #EF4444; }
        select.edit-field { background-image: linear-gradient(45deg, transparent 50%, #64748B 50%), linear-gradient(135deg, #64748B 50%, transparent 50%); background-position: calc(100% - 20px) 22px, calc(100% - 15px) 22px; background-size: 5px 5px; background-repeat: no-repeat; padding-right: 36px; }
        .edit-phone { display: flex; align-items: stretch; height: 54px; border: 2px solid #0B2559; border-radius: 14px; overflow: hidden; background: #fff; }
        .edit-phone:focus-within { box-shadow: 0 0 0 3px rgba(11,37,89,0.12); }
        .edit-phone-dial { display: flex; align-items: center; gap: 6px; padding: 0 14px; background: #EEF2F6; border-right: 1.5px solid #CBD5E1; font-weight: 800; font-size: 16px; color: #0B2559; white-space: nowrap; flex-shrink: 0; }
        .edit-phone input { flex: 1; min-width: 0; border: none; outline: none; padding: 0 14px; font-size: 18px; font-weight: 700; letter-spacing: 0.5px; color: #0F172A; background: #fff; }
        .edit-actions { display: flex; gap: 12px; margin-top: 16px; padding-top: 16px; border-top: 1px solid #E2E8F0; }
        .edit-btn { height: 52px; border-radius: 14px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-size: 15px; font-weight: 800; text-decoration: none; cursor: pointer; box-sizing: border-box; }
        .edit-btn-cancel { flex: 0 0 34%; border: 1.5px solid #CBD5E1; background: #fff; color: #0B2559; }
        .edit-btn-save { flex: 1; border: none; background: linear-gradient(135deg, #0B2559 0%, #163B8A 100%); color: #fff; box-shadow: 0 8px 20px rgba(11,37,89,0.28); }
        .edit-btn-save:disabled { background: #94A3B8; box-shadow: none; cursor: not-allowed; }
        .edit-toast { position: fixed; left: 50%; bottom: calc(24px + env(safe-area-inset-bottom)); transform: translateX(-50%); z-index: 5000; display: flex; align-items: center; gap: 10px; max-width: min(92vw, 440px); padding: 14px 18px; border-radius: 16px; font-size: 15px; font-weight: 700; box-shadow: 0 16px 40px rgba(7,21,48,0.3); }
        .edit-toast-ok { background: #067647; color: #fff; }
        .edit-toast-err { background: #B42318; color: #fff; }
        @media (max-width: 480px) {
          .edit-actions { position: sticky; bottom: 0; background: #fff; margin-inline: -4px; padding: 12px 4px calc(12px + env(safe-area-inset-bottom)); z-index: 5; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
