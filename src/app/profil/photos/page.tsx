"use client";
// src/app/profil/photos/page.tsx
// Manage member photos: upload, set main, delete

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { compressImage } from "@/app/messages/_lib/chat-utils";

interface Photo {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  isMain: boolean;
  order: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

// 4 photos : même limite que l'édition du profil et que l'affichage sur les fiches membres
const MAX_PHOTOS = 4;

export default function ProfilPhotosPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadPhotos();
  }, []);

  async function loadPhotos() {
    try {
      const res = await fetch("/api/profiles/me/photos");
      if (res.status === 401) {
        router.push("/connexion");
        return;
      }
      const data = await res.json();
      if (data.photos) {
        setPhotos(data.photos);
      }
    } catch {
      setError("Impossible de charger les photos.");
    } finally {
      setLoading(false);
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (photos.length >= MAX_PHOTOS) {
      setError(`Vous avez atteint la limite de ${MAX_PHOTOS} photos.`);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Format invalide. Choisissez une photo JPEG, PNG ou WebP.");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError("L'image est trop lourde (max 20 Mo).");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      // Compression dans le téléphone : rapide sur mobile et sous la limite d'envoi du serveur
      const base64 = await compressImage(file, 1280, 0.82);
      const res = await fetch("/api/profiles/me/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64, isMain: photos.length === 0 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Erreur lors de l'envoi.");
        return;
      }
      setSuccess("Photo ajoutée avec succès !");
      loadPhotos();
    } catch {
      setError("Erreur lors de la lecture du fichier.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function setAsMain(id: string) {
    setActionId(id);
    setError("");
    try {
      const res = await fetch(`/api/profiles/me/photos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isMain: true }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erreur lors du changement de photo principale.");
        return;
      }
      setSuccess("Photo principale définie ✓");
      loadPhotos();
    } catch {
      setError("Erreur réseau.");
    } finally {
      setActionId(null);
    }
  }

  async function deletePhoto(id: string) {
    if (!confirm("Voulez-vous vraiment supprimer cette photo ?")) return;
    setActionId(id);
    setError("");
    try {
      const res = await fetch(`/api/profiles/me/photos/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erreur de suppression.");
        return;
      }
      setSuccess("Photo supprimée ✓");
      loadPhotos();
    } catch {
      setError("Erreur réseau.");
    } finally {
      setActionId(null);
    }
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

      <main className="container" style={{ maxWidth: "800px", paddingBlock: "40px" }}>
        <div className="card card-padded" style={{ boxShadow: "var(--shadow-md)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "10px", marginBottom: "8px" }}>
            <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--color-blue)" }}>
              Mes Photos ({photos.length}/{MAX_PHOTOS})
            </h1>
            <span style={{ fontSize: "13px", color: "var(--color-gray-500)", fontWeight: 500 }}>
              Minimum 1 photo pour être visible
            </span>
          </div>
          <p style={{ color: "var(--color-gray-500)", fontSize: "14px", marginBottom: "24px" }}>
            Des photos nettes, récentes et sans filtres excessifs garantissent un taux de réponse 5 fois supérieur.
          </p>

          {error && (
            <div style={{ padding: "12px 16px", background: "#FEF2F2", color: "#991B1B", border: "1px solid #FECACA", borderRadius: "var(--radius-md)", fontSize: "14px", marginBottom: "20px", fontWeight: 500 }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ padding: "12px 16px", background: "#ECFDF5", color: "#065F46", border: "1px solid #A7F3D0", borderRadius: "var(--radius-md)", fontSize: "14px", marginBottom: "20px", fontWeight: 500 }}>
              {success}
            </div>
          )}

          {/* Upload trigger */}
          {photos.length < MAX_PHOTOS && (
            <div style={{ marginBottom: "28px" }}>
              <label
                htmlFor="photo-upload-input"
                className="photo-dropzone"
                style={{
                  display: "block",
                  cursor: uploading ? "wait" : "pointer",
                  opacity: uploading ? 0.7 : 1,
                  background: "white",
                }}
              >
                <input
                  id="photo-upload-input"
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleFileSelect}
                  disabled={uploading}
                />
                <div style={{ fontSize: "36px", marginBottom: "8px" }}>📷</div>
                <p style={{ fontWeight: 700, color: "var(--color-blue)", fontSize: "16px", marginBottom: "4px" }}>
                  {uploading ? "Envoi et optimisation en cours..." : "Cliquez pour ajouter une photo"}
                </p>
                <p style={{ fontSize: "13px", color: "var(--color-gray-400)" }}>
                  Formats acceptés : JPG, PNG, WEBP (Max 8 Mo)
                </p>
              </label>
            </div>
          )}

          {/* Photos grid */}
          {loading ? (
            <p style={{ textAlign: "center", color: "var(--color-gray-400)", paddingBlock: "30px" }}>Chargement de vos photos...</p>
          ) : photos.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", background: "var(--color-gray-50)", borderRadius: "var(--radius-lg)" }}>
              <p style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-blue)", marginBottom: "6px" }}>
                Aucune photo ajoutée pour le moment
              </p>
              <p style={{ fontSize: "14px", color: "var(--color-gray-500)" }}>
                Ajoutez votre photo principale pour que les autres membres puissent vous découvrir.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "16px",
              }}
            >
              {photos.map((photo, i) => (
                <div
                  key={photo.id}
                  style={{
                    position: "relative",
                    borderRadius: "var(--radius-lg)",
                    overflow: "hidden",
                    border: photo.isMain ? "3px solid var(--color-red)" : "1px solid var(--color-gray-200)",
                    background: "var(--color-gray-100)",
                    aspectRatio: "3/4",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <Image
                    src={photo.thumbnailUrl || photo.url}
                    alt={`Photo ${i + 1}`}
                    fill
                    style={{ objectFit: "cover" }}
                    sizes="220px"
                  />

                  {/* Badges */}
                  <div style={{ position: "absolute", top: "8px", left: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
                    {photo.isMain && (
                      <span className="badge badge-verified" style={{ background: "var(--color-red)", color: "white", fontSize: "11px", fontWeight: 700 }}>
                        ★ Principale
                      </span>
                    )}
                    {photo.status === "PENDING" && (
                      <span className="badge" style={{ background: "rgba(0,0,0,0.6)", color: "white", fontSize: "11px" }}>
                        ⏳ En modération
                      </span>
                    )}
                  </div>

                  {/* Hover Actions Bar */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      insetInline: 0,
                      padding: "8px",
                      background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    {!photo.isMain && (
                      <button
                        type="button"
                        onClick={() => setAsMain(photo.id)}
                        disabled={actionId === photo.id}
                        className="btn btn-sm btn-ghost"
                        style={{ color: "white", fontSize: "12px", padding: "4px 8px" }}
                        title="Définir comme photo principale"
                      >
                        {actionId === photo.id ? "..." : "Définir principale"}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => deletePhoto(photo.id)}
                      disabled={actionId === photo.id}
                      className="btn btn-sm"
                      style={{
                        background: "rgba(225, 6, 0, 0.8)",
                        color: "white",
                        fontSize: "12px",
                        padding: "4px 8px",
                        borderRadius: "var(--radius-sm)",
                        marginLeft: "auto",
                      }}
                      title="Supprimer la photo"
                    >
                      {actionId === photo.id ? "..." : "🗑️"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: "32px", display: "flex", justifyContent: "flex-end" }}>
            <Link href="/profil" className="btn btn-primary">
              Terminé ✓
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
