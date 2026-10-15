"use client";
// src/components/ProfileInteractiveCard.tsx
// Interactive Profile Card with direct Click-to-Upload for Avatar and Cover Photo

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, Edit3, Loader2, Check, Sparkles } from "lucide-react";
import { StoredProfile } from "@/lib/db-store";

interface ProfileInteractiveCardProps {
  profile: StoredProfile;
  onProfileUpdated?: (updated: StoredProfile) => void;
}

export default function ProfileInteractiveCard({
  profile: initialProfile,
  onProfileUpdated,
}: ProfileInteractiveCardProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<StoredProfile>(initialProfile);

  useEffect(() => {
    setProfile((prev) => {
      const prevMain = prev.photos?.find((p) => p.isMain)?.url;
      const initialMain = initialProfile.photos?.find((p) => p.isMain)?.url;
      const prevCover = prev.coverUrl;
      const initialCover = initialProfile.coverUrl;
      return {
        ...initialProfile,
        photos: (prevMain && !initialMain) ? prev.photos : (initialProfile.photos?.length ? initialProfile.photos : prev.photos),
        coverUrl: (prevCover && !initialCover) ? prevCover : (initialCover || prevCover),
      };
    });
  }, [initialProfile]);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const mainPhoto = profile.photos?.find((p) => p.isMain) || profile.photos?.[0];
  const initialLetter = (profile.firstName || profile.pseudo || "M").charAt(0).toUpperCase();

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }

  // ── 1. Upload Avatar directement au clic sur le rond ──
  async function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Veuillez choisir une image (JPEG, PNG ou WebP).");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      showToast("Image trop lourde (max 8 Mo).");
      return;
    }

    setUploadingAvatar(true);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await fetch("/api/profiles/me/photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64, isMain: true }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          showToast(data.error || "Erreur lors de l'enregistrement de la photo.");
          setUploadingAvatar(false);
          return;
        }

        const data = await res.json();
        const newPhotoUrl = data.photo?.url || base64;

        // Mise à jour locale immédiate
        const updatedPhotos = [
          { id: data.photo?.id || `p_${Date.now()}`, url: newPhotoUrl, isMain: true },
          ...(profile.photos || []).map((p) => ({ ...p, isMain: false })),
        ];

        const updatedProfile: StoredProfile = {
          ...profile,
          photos: updatedPhotos,
        };

        setProfile(updatedProfile);
        if (onProfileUpdated) onProfileUpdated(updatedProfile);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("mmclub_profile_updated", { detail: updatedProfile }));
        }
        router.refresh();
        showToast("Photo de profil mise à jour avec succès ! ✓");
        setUploadingAvatar(false);
      };
      reader.readAsDataURL(file);
    } catch {
      showToast("Erreur lors de la lecture du fichier.");
      setUploadingAvatar(false);
    } finally {
      e.target.value = "";
    }
  }

  // ── 2. Upload Couverture directement au clic sur le panneau ──
  async function handleCoverSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Veuillez choisir une image (JPEG, PNG ou WebP).");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      showToast("Image trop lourde (max 8 Mo).");
      return;
    }

    setUploadingCover(true);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await fetch("/api/profiles/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ coverUrl: base64 }),
        });

        if (!res.ok) {
          showToast("Erreur lors de la mise à jour de la couverture.");
          setUploadingCover(false);
          return;
        }

        const data = await res.json().catch(() => ({}));
        const cdnCoverUrl = data.profile?.coverUrl || base64;

        const updatedProfile: StoredProfile = {
          ...profile,
          coverUrl: cdnCoverUrl,
        };

        setProfile(updatedProfile);
        if (onProfileUpdated) onProfileUpdated(updatedProfile);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("mmclub_profile_updated", { detail: updatedProfile }));
        }
        router.refresh();
        showToast("Photo de couverture mise à jour ! ✓");
        setUploadingCover(false);
      };
      reader.readAsDataURL(file);
    } catch {
      showToast("Erreur lors de la lecture du fichier.");
      setUploadingCover(false);
    } finally {
      e.target.value = "";
    }
  }

  return (
    <div
      style={{
        overflow: "hidden",
        background: "white",
        borderRadius: "24px",
        boxShadow: "0 4px 20px rgba(11,37,89,0.08)",
        border: "1px solid #E2E8F0",
        position: "relative",
      }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "absolute",
            top: "16px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 30,
            background: "rgba(11, 37, 89, 0.95)",
            color: "white",
            padding: "8px 18px",
            borderRadius: "100px",
            fontSize: "13px",
            fontWeight: 700,
            boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
            whiteSpace: "nowrap",
            backdropFilter: "blur(8px)",
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleAvatarSelect}
        style={{ display: "none" }}
        aria-label="Charger ma photo de profil"
      />
      <input
        ref={coverInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleCoverSelect}
        style={{ display: "none" }}
        aria-label="Charger ma photo de couverture"
      />

      {/* ── 1. Panneau de Couverture Cliquable ── */}
      <div
        onClick={() => coverInputRef.current?.click()}
        title="Cliquez pour changer votre bannière de couverture"
        style={{
          height: "170px",
          background: profile.coverUrl
            ? `url(${profile.coverUrl}) center/cover no-repeat`
            : "linear-gradient(135deg, #0B2559 0%, #163B8A 60%, #1D4ED8 100%)",
          position: "relative",
          cursor: "pointer",
          transition: "opacity 0.2s ease",
        }}
      >
        {/* Overlay hover sombre discret */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.40) 100%)",
          }}
        />

        {/* Bouton Changer Couverture */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            coverInputRef.current?.click();
          }}
          style={{
            position: "absolute",
            top: "14px",
            right: "14px",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "7px 13px",
            borderRadius: "100px",
            background: "rgba(255, 255, 255, 0.90)",
            border: "1px solid rgba(255, 255, 255, 0.5)",
            color: "#0B2559",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 2px 10px rgba(0,0,0,0.18)",
            backdropFilter: "blur(6px)",
            transition: "all 0.18s ease",
          }}
        >
          {uploadingCover ? (
            <>
              <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
              <span>Chargement...</span>
            </>
          ) : (
            <>
              <Camera size={13} />
              <span>Changer la couverture</span>
            </>
          )}
        </button>
      </div>

      {/* ── 2. Corps du Profil ── */}
      <div style={{ padding: "0 20px 24px", marginTop: "-48px", position: "relative" }}>
        {/* Rangée Avatar + Bouton Modifier */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: "16px",
            gap: "12px",
          }}
        >
          {/* Rond de profil cliquable */}
          <div
            onClick={() => avatarInputRef.current?.click()}
            title="Cliquez pour changer votre photo de profil"
            style={{
              width: "96px",
              height: "96px",
              borderRadius: "50%",
              border: "4px solid white",
              boxShadow: "0 4px 16px rgba(11,37,89,0.18)",
              overflow: "hidden",
              position: "relative",
              background: "#0B2559",
              cursor: "pointer",
              flexShrink: 0,
              transition: "transform 0.18s ease, box-shadow 0.18s ease",
            }}
          >
            {uploadingAvatar ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  background: "#0B2559",
                  color: "white",
                  gap: "4px",
                }}
              >
                <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
                <span style={{ fontSize: "10px", fontWeight: 700 }}>Upload...</span>
              </div>
            ) : mainPhoto?.url ? (
              <Image
                src={mainPhoto.url}
                alt={profile.firstName}
                fill
                unoptimized
                style={{ objectFit: "cover" }}
                sizes="96px"
                priority
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  width: "100%",
                  background: "linear-gradient(135deg, #0B2559 0%, #1D4ED8 100%)",
                  color: "white",
                }}
              >
                <span style={{ fontSize: "32px", fontWeight: 800 }}>{initialLetter}</span>
              </div>
            )}

            {/* Badge icône appareil photo en bas à droite du rond */}
            <div
              style={{
                position: "absolute",
                bottom: "2px",
                right: "2px",
                background: "linear-gradient(135deg, #E10600 0%, #B30500 100%)",
                color: "white",
                borderRadius: "50%",
                width: "26px",
                height: "26px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.30)",
                border: "2px solid white",
              }}
            >
              <Camera size={13} />
            </div>
          </div>

          {/* Bouton Modifier mon profil propre sans coupure */}
          <div style={{ flexShrink: 0 }}>
            <Link
              href="/profil/edit"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "9px 18px",
                borderRadius: "12px",
                border: "1.5px solid #0B2559",
                background: "white",
                color: "#0B2559",
                fontWeight: 700,
                fontSize: "13px",
                textDecoration: "none",
                whiteSpace: "nowrap",
                boxShadow: "0 2px 8px rgba(11,37,89,0.06)",
                transition: "all 0.18s ease",
              }}
            >
              <Edit3 size={15} />
              <span>Modifier mon profil</span>
            </Link>
          </div>
        </div>

        {/* ── 3. Typographie & Identité ── */}
        <div>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 800,
              color: "#0B2559",
              margin: "0 0 4px",
              letterSpacing: "-0.3px",
              wordBreak: "break-word",
            }}
          >
            {profile.firstName} {profile.lastName && <span>{profile.lastName}</span>}
          </h1>

          {profile.pseudo && (
            <p
              style={{
                color: "#1D4ED8",
                fontWeight: 700,
                fontSize: "14px",
                margin: "0 0 8px",
                wordBreak: "break-all",
              }}
            >
              @{profile.pseudo}
            </p>
          )}

          <p
            style={{
              color: "#64748B",
              fontSize: "13px",
              margin: "0 0 14px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              flexWrap: "wrap",
              fontWeight: 500,
            }}
          >
            <span>📍 {profile.city || "Lomé"}</span>
            {profile.neighborhood && <span>· {profile.neighborhood}</span>}
            {profile.age && <span>· {profile.age} ans</span>}
          </p>

          {/* Badges de statut */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                background: "#EFF6FF",
                color: "#1D4ED8",
                padding: "4px 10px",
                borderRadius: "100px",
                border: "1px solid #BFDBFE",
              }}
            >
              ✓ Vérifié
            </span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                background: "#ECFDF5",
                color: "#047857",
                padding: "4px 10px",
                borderRadius: "100px",
                border: "1px solid #A7F3D0",
              }}
            >
              18+ Confirmé
            </span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                background: "#FEF2F2",
                color: "#B91C1C",
                padding: "4px 10px",
                borderRadius: "100px",
                border: "1px solid #FECACA",
              }}
            >
              Membre International
            </span>
          </div>

          {/* Badge Plan Actif */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background:
                profile.plan === "VIP"
                  ? "linear-gradient(135deg, #B8860B 0%, #D4A017 100%)"
                  : profile.plan === "COMPLICE"
                  ? "linear-gradient(135deg, #059669 0%, #10B981 100%)"
                  : profile.plan === "ESSENTIAL"
                  ? "linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)"
                  : "#F1F5F9",
              color: profile.plan === "FREE" ? "#334155" : "white",
              border: profile.plan === "FREE" ? "1.5px solid #CBD5E1" : "none",
              padding: "7px 14px",
              borderRadius: "100px",
              fontWeight: 700,
              fontSize: "12px",
              boxShadow: profile.plan !== "FREE" ? "0 4px 12px rgba(0,0,0,0.15)" : "none",
            }}
          >
            <Sparkles size={13} />
            <span>
              {profile.plan === "FREE"
                ? "⚡ Plan Gratuit (Essai 7 jours)"
                : `Plan ${profile.plan} Actif`}
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
