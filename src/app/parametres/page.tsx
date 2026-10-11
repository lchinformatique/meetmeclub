"use client";
// src/app/parametres/page.tsx
// Privacy & Account settings

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function ParametresPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [photoPrivacy, setPhotoPrivacy] = useState<"ALL" | "VERIFIED" | "MATCHES">("ALL");
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/profiles/me");
        if (res.status === 401) {
          router.push("/connexion");
          return;
        }
        const data = await res.json();
        if (data.profile) {
          setIsVisible(data.profile.isVisible ?? true);
          setPhotoPrivacy(data.profile.photoPrivacy || "ALL");
        }
      } catch {
        console.error("Erreur de chargement des paramètres");
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [router]);

  async function handleSavePrivacy(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/profiles/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisible, photoPrivacy }),
      });
      if (!res.ok) {
        setFeedback("Erreur lors de la mise à jour des paramètres.");
        return;
      }
      setFeedback("Paramètres mis à jour avec succès ! ✓");
    } catch {
      setFeedback("Erreur réseau.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    const confirmation = prompt(
      "ATTENTION : Cette action est irréversible. Pour confirmer la suppression de votre compte Meet Me Club, tapez SUPPRIMER :"
    );
    if (confirmation !== "SUPPRIMER") {
      alert("Suppression annulée.");
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch("/api/users/me", { method: "DELETE" });
      if (res.ok) {
        alert("Votre compte a été supprimé.");
        router.push("/");
      } else {
        alert("Erreur lors de la suppression.");
      }
    } catch {
      alert("Erreur réseau lors de la suppression.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--color-gray-500)", fontWeight: 500 }}>Chargement des paramètres...</p>
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

      <main className="container" style={{ maxWidth: "680px", paddingBlock: "40px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div className="card card-padded" style={{ boxShadow: "var(--shadow-md)" }}>
            <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--color-blue)", marginBottom: "8px" }}>
              Paramètres & Confidentialité
            </h1>
            <p style={{ color: "var(--color-gray-500)", fontSize: "14px", marginBottom: "28px" }}>
              Gérez votre visibilité et vos préférences d'affichage sur Meet Me Club.
            </p>

            {feedback && (
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: "var(--radius-md)",
                  background: "#ECFDF5",
                  color: "#065F46",
                  border: "1px solid #A7F3D0",
                  fontSize: "14px",
                  fontWeight: 600,
                  marginBottom: "20px",
                }}
              >
                {feedback}
              </div>
            )}

            <form onSubmit={handleSavePrivacy} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Visibilité dans Découverte */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "var(--color-gray-50)", borderRadius: "var(--radius-md)" }}>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-gray-900)" }}>
                    Profil visible dans la découverte
                  </h3>
                  <p style={{ fontSize: "13px", color: "var(--color-gray-500)", marginTop: "2px" }}>
                    Si désactivé, vous restez invisible pour les nouveaux membres.
                  </p>
                </div>
                <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={(e) => setIsVisible(e.target.checked)}
                    style={{ width: "24px", height: "24px", accentColor: "var(--color-red)", cursor: "pointer" }}
                  />
                </label>
              </div>

              {/* Confidentialité des photos */}
              <div className="input-group">
                <label className="input-label" htmlFor="photoPrivacy">
                  Qui peut voir vos photos ?
                </label>
                <select
                  id="photoPrivacy"
                  className="input"
                  value={photoPrivacy}
                  onChange={(e) => setPhotoPrivacy(e.target.value as "ALL" | "VERIFIED" | "MATCHES")}
                >
                  <option value="ALL">Tous les membres vérifiés (recommandé)</option>
                  <option value="VERIFIED">Uniquement les profils avec badge certifié</option>
                  <option value="MATCHES">Uniquement les membres après acceptation de rendez-vous</option>
                </select>
              </div>

              <button
                type="submit"
                className={`btn btn-primary ${saving ? "btn-loading" : ""}`}
                disabled={saving}
              >
                {saving ? "" : "Enregistrer les préférences ✓"}
              </button>
            </form>
          </div>

          {/* RGPD Zone Danger */}
          <div className="card card-padded" style={{ boxShadow: "var(--shadow-md)", border: "1px solid #FEE2E2" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-red)", marginBottom: "8px" }}>
              Zone de danger (RGPD)
            </h2>
            <p style={{ fontSize: "14px", color: "var(--color-gray-600)", marginBottom: "20px" }}>
              Conformément à la protection des données personnelles, vous pouvez demander la suppression complète de votre profil et de vos photos.
            </p>
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="btn btn-danger"
              style={{ width: "100%" }}
            >
              {deleting ? "Suppression en cours..." : "Supprimer définitivement mon compte"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
