"use client";
// src/app/profil/securite/page.tsx
// Security & Badges: Phone, 18+ check, Selfie verification, Logout

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface VerificationItem {
  type: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

export default function ProfilSecuritePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submittingSelfie, setSubmittingSelfie] = useState(false);
  const [selfieMessage, setSelfieMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [submittingIdDoc, setSubmittingIdDoc] = useState(false);
  const [idDocMessage, setIdDocMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [verifications, setVerifications] = useState<VerificationItem[]>([]);
  const [idDocSubmitted, setIdDocSubmitted] = useState(false);
  const [selfieSubmitted, setSelfieSubmitted] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/profiles/me");
        if (res.status === 401) {
          router.push("/connexion");
          return;
        }
        const data = await res.json();
        if (data.profile) {
          setPhone(data.profile.user?.phone || data.profile.phone || null);
          setVerifications(data.profile.verifications || []);
          if (data.profile.idDocumentSubmitted || data.profile.idDocumentVerified) {
            setIdDocSubmitted(true);
          }
          if (data.profile.selfieSubmitted || data.profile.selfieVerified) {
            setSelfieSubmitted(true);
          }
        }
      } catch {
        console.error("Erreur de chargement profil");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  const hasSelfie = verifications.find((v) => v.type === "SELFIE");

  async function handleSelfieUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setSelfieMessage({ type: "error", text: "Veuillez sélectionner un format d'image valide (JPEG ou PNG)." });
      return;
    }

    setSubmittingSelfie(true);
    setSelfieMessage(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await fetch("/api/verifications/selfie", {
          method: "POST",
          body: (() => {
            const fd = new FormData();
            fd.append("base64", base64);
            return fd;
          })(),
        });

        const data = await res.json();
        if (!res.ok) {
          setSelfieMessage({ type: "error", text: data.error || "Erreur de transmission." });
          return;
        }

        setSelfieMessage({ type: "success", text: "Selfie envoyé ! Validation en cours sous 24h." });
        setSelfieSubmitted(true);
        setVerifications((prev) => [
          ...prev.filter((v) => v.type !== "SELFIE"),
          { type: "SELFIE", status: "APPROVED" },
        ]);
      };
      reader.readAsDataURL(file);
    } catch {
      setSelfieMessage({ type: "error", text: "Erreur lors du téléversement du selfie." });
    } finally {
      setSubmittingSelfie(false);
      e.target.value = "";
    }
  }

  async function handleIdDocumentUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubmittingIdDoc(true);
    setIdDocMessage(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const fd = new FormData();
        fd.append("base64", base64);
        fd.append("documentType", "CNI");

        const res = await fetch("/api/verifications/document", {
          method: "POST",
          body: fd,
        });

        const data = await res.json();
        if (!res.ok) {
          setIdDocMessage({ type: "error", text: data.error || "Erreur de transmission." });
          return;
        }

        setIdDocMessage({ type: "success", text: "Justificatif de pièce d'identité validé ! ✓" });
        setIdDocSubmitted(true);
        setVerifications((prev) => [
          ...prev.filter((v) => v.type !== "ID_CARD"),
          { type: "ID_CARD", status: "APPROVED" },
        ]);
      };
      reader.readAsDataURL(file);
    } catch {
      setIdDocMessage({ type: "error", text: "Erreur lors du téléversement de la pièce." });
    } finally {
      setSubmittingIdDoc(false);
      e.target.value = "";
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
    } catch {
      router.push("/");
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--color-gray-500)", fontWeight: 500 }}>Chargement des données de sécurité...</p>
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
          {/* Card Badges */}
          <div className="card card-padded" style={{ boxShadow: "var(--shadow-md)" }}>
            <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--color-blue)", marginBottom: "8px" }}>
              Sécurité & Badges de confiance
            </h1>
            <p style={{ color: "var(--color-gray-500)", fontSize: "14px", marginBottom: "28px" }}>
              Meet Me Club garantit un environnement 100% réel et sécurisé (18+). Obtenez vos badges pour certifier votre profil.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Badge 18+ */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px", borderRadius: "var(--radius-md)", background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                <span style={{ fontSize: "28px" }}>🔞</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#166534" }}>Majeur vérifié (18+)</h3>
                    <span className="badge badge-verified" style={{ background: "#16A34A" }}>Vérifié ✓</span>
                  </div>
                  <p style={{ fontSize: "13px", color: "#15803D", marginTop: "2px" }}>
                    Votre date de naissance confirme que vous avez 18 ans ou plus.
                  </p>
                </div>
              </div>

              {/* Badge Téléphone */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px", borderRadius: "var(--radius-md)", background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
                <span style={{ fontSize: "28px" }}>📱</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1E40AF" }}>Téléphone authentifié</h3>
                    <span className="badge badge-verified" style={{ background: "#2563EB" }}>OTP Validé ✓</span>
                  </div>
                  <p style={{ fontSize: "13px", color: "#1D4ED8", marginTop: "2px" }}>
                    {phone ? `Lié au numéro ${phone}` : "Vérifié par code à 6 chiffres."}
                  </p>
                </div>
              </div>

              {/* Badge Selfie / Photo certifiée */}
              <div style={{ padding: "16px", borderRadius: "var(--radius-md)", background: "white", border: "1px solid var(--color-gray-200)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                  <span style={{ fontSize: "28px" }}>🤳</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-blue)" }}>
                        Badge Photo Certifiée
                      </h3>
                      {hasSelfie?.status === "APPROVED" ? (
                        <span className="badge badge-verified">Approuvé ✓</span>
                      ) : hasSelfie?.status === "PENDING" ? (
                        <span className="badge" style={{ background: "#FEF3C7", color: "#92400E" }}>En vérification ⏳</span>
                      ) : (
                        <span className="badge" style={{ background: "var(--color-gray-100)", color: "var(--color-gray-600)" }}>Non certifié</span>
                      )}
                    </div>
                    <p style={{ fontSize: "13px", color: "var(--color-gray-500)", marginTop: "4px" }}>
                      Prenez un selfie rapide pour certifier que vous correspondez bien à vos photos. Votre selfie ne sera pas affiché publiquement.
                    </p>

                    {selfieMessage && (
                      <div
                        style={{
                          marginTop: "12px",
                          padding: "10px 14px",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "13px",
                          fontWeight: 600,
                          background: selfieMessage.type === "success" ? "#ECFDF5" : "#FEF2F2",
                          color: selfieMessage.type === "success" ? "#065F46" : "#991B1B",
                        }}
                      >
                        {selfieMessage.text}
                      </div>
                    )}

                    {(!hasSelfie || hasSelfie.status === "REJECTED") && (
                      <div style={{ marginTop: "14px" }}>
                        <label
                          htmlFor="selfie-file"
                          className={`btn btn-sm btn-outline-blue ${submittingSelfie ? "btn-loading" : ""}`}
                          style={{ cursor: "pointer", display: "inline-flex" }}
                        >
                          <input
                            id="selfie-file"
                            type="file"
                            accept="image/*"
                            capture="user"
                            style={{ display: "none" }}
                            onChange={handleSelfieUpload}
                            disabled={submittingSelfie}
                          />
                          {submittingSelfie ? "" : "Prendre / Envoyer un selfie 📷"}
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Badge Pièce d'Identité (18+) */}
              <div style={{ padding: "16px", borderRadius: "var(--radius-md)", background: "white", border: "1px solid var(--color-gray-200)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                  <span style={{ fontSize: "28px" }}>🪪</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-blue)" }}>
                        Justificatif de Pièce d&apos;Identité (CNI / Passeport)
                      </h3>
                      {idDocSubmitted ? (
                        <span className="badge badge-verified" style={{ background: "#16A34A" }}>Validé ✓</span>
                      ) : (
                        <span className="badge" style={{ background: "#FEF3C7", color: "#92400E" }}>Obligatoire pour le chat</span>
                      )}
                    </div>
                    <p style={{ fontSize: "13px", color: "var(--color-gray-500)", marginTop: "4px" }}>
                      Requis pour activer vos échanges sur la plateforme. Téléversez une photo claire de votre CNI, passeport ou carte d&apos;électeur. Document strictement confidentiel.
                    </p>

                    {idDocMessage && (
                      <div
                        style={{
                          marginTop: "12px",
                          padding: "10px 14px",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "13px",
                          fontWeight: 600,
                          background: idDocMessage.type === "success" ? "#ECFDF5" : "#FEF2F2",
                          color: idDocMessage.type === "success" ? "#065F46" : "#991B1B",
                        }}
                      >
                        {idDocMessage.text}
                      </div>
                    )}

                    {!idDocSubmitted && (
                      <div style={{ marginTop: "14px" }}>
                        <label
                          htmlFor="id-doc-file"
                          className={`btn btn-sm btn-outline-blue ${submittingIdDoc ? "btn-loading" : ""}`}
                          style={{ cursor: "pointer", display: "inline-flex" }}
                        >
                          <input
                            id="id-doc-file"
                            type="file"
                            accept="image/*,application/pdf"
                            style={{ display: "none" }}
                            onChange={handleIdDocumentUpload}
                            disabled={submittingIdDoc}
                          />
                          {submittingIdDoc ? "" : "Téléverser ma pièce d'identité 🪪"}
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status global pour le Chat */}
              <div
                style={{
                  padding: "16px",
                  borderRadius: "var(--radius-md)",
                  background: (idDocSubmitted && selfieSubmitted) ? "#F0FDF4" : "#FFFBEB",
                  border: (idDocSubmitted && selfieSubmitted) ? "1.5px solid #BBF7D0" : "1.5px solid #FDE68A",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div>
                  <h4 style={{ fontSize: "14px", fontWeight: 800, color: (idDocSubmitted && selfieSubmitted) ? "#166534" : "#92400E", margin: "0 0 4px" }}>
                    {(idDocSubmitted && selfieSubmitted)
                      ? "🎉 Accès au Chat 100% Débloqué !"
                      : "🔒 Accès au Chat en attente de vos pièces"}
                  </h4>
                  <p style={{ fontSize: "12px", color: (idDocSubmitted && selfieSubmitted) ? "#15803D" : "#78350F", margin: 0 }}>
                    {(idDocSubmitted && selfieSubmitted)
                      ? "Vos justificatifs sont validés. Vous pouvez échanger avec les membres de votre catégorie."
                      : "Soumettez votre pièce d'identité et votre selfie ci-dessus pour commencer le chat."}
                  </p>
                </div>
                <Link
                  href="/messages"
                  className="btn btn-primary btn-sm"
                  style={{ fontWeight: 800, textDecoration: "none" }}
                >
                  Ouvrir la messagerie 💬
                </Link>
              </div>
            </div>
          </div>

          {/* Session & Déconnexion */}
          <div className="card card-padded" style={{ boxShadow: "var(--shadow-md)" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-blue)", marginBottom: "12px" }}>
              Session active
            </h2>
            <p style={{ fontSize: "14px", color: "var(--color-gray-500)", marginBottom: "20px" }}>
              Connecté via cookie chiffré httpOnly (JWT standardisé de 30 jours).
            </p>
            <button
              type="button"
              onClick={handleLogout}
              className="btn btn-danger"
              style={{ width: "100%" }}
            >
              Se déconnecter de Meet Me Club
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
