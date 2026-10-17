"use client";
// src/app/profil/securite/page.tsx
// Sécurité, Vérification d'Identité (Toutes pièces d'identité + Contrôle Facial Selfie),
// Choix de la Présence (Mode Discret / Visible) et Déconnexion

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import PasswordCard from "@/components/PasswordCard";
import {
  ShieldCheck,
  CheckCircle2,
  Camera,
  FileText,
  Eye,
  EyeOff,
  LogOut,
  AlertTriangle,
  Loader2,
  ChevronLeft,
} from "lucide-react";

interface VerificationItem {
  type: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

const DOCUMENT_TYPES = [
  { value: "CNI", label: "Carte Nationale d'Identité (CNI)" },
  { value: "PASSPORT", label: "Passeport International" },
  { value: "PERMIS", label: "Permis de Conduire" },
  { value: "ELECTEUR", label: "Carte d'Électeur" },
  { value: "SEJOUR", label: "Carte de Séjour / Consulaire" },
  { value: "AUTRE", label: "Autre justificatif officiel avec photo" },
];

export default function ProfilSecuritePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedDocType, setSelectedDocType] = useState("CNI");

  // Upload states
  const [submittingSelfie, setSubmittingSelfie] = useState(false);
  const [selfieMessage, setSelfieMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [submittingIdDoc, setSubmittingIdDoc] = useState(false);
  const [idDocMessage, setIdDocMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // User profile data
  const [phone, setPhone] = useState<string | null>(null);
  const [verifications, setVerifications] = useState<VerificationItem[]>([]);
  const [idDocSubmitted, setIdDocSubmitted] = useState(false);
  const [selfieSubmitted, setSelfieSubmitted] = useState(false);

  // Presence / Visibility state
  const [isVisible, setIsVisible] = useState(true);
  const [savingPresence, setSavingPresence] = useState(false);
  const [presenceMsg, setPresenceMsg] = useState<string | null>(null);

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
          setIsVisible(data.profile.isVisible ?? true);

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

  async function handleTogglePresence(newVal: boolean) {
    setIsVisible(newVal);
    setSavingPresence(true);
    setPresenceMsg(null);

    try {
      const res = await fetch("/api/profiles/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisible: newVal }),
      });

      if (res.ok) {
        setPresenceMsg(
          newVal
            ? "Visibilité activée : vous apparaissez dans la liste Découverte."
            : "Mode discret activé : votre présence est masquée aux autres membres."
        );
        setTimeout(() => setPresenceMsg(null), 4000);
      }
    } catch {
      setPresenceMsg("Erreur lors de la mise à jour de la présence.");
    } finally {
      setSavingPresence(false);
    }
  }

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

        setSelfieMessage({
          type: "success",
          text: "Contrôle facial réussi ! Selfie validé avec succès ✓",
        });
        setSelfieSubmitted(true);
        setVerifications((prev) => [
          ...prev.filter((v) => v.type !== "SELFIE"),
          { type: "SELFIE", status: "APPROVED" },
        ]);
      };
      reader.readAsDataURL(file);
    } catch {
      setSelfieMessage({ type: "error", text: "Erreur lors de la capture du selfie." });
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
        fd.append("documentType", selectedDocType);

        const res = await fetch("/api/verifications/document", {
          method: "POST",
          body: fd,
        });

        const data = await res.json();
        if (!res.ok) {
          setIdDocMessage({ type: "error", text: data.error || "Erreur de transmission." });
          return;
        }

        setIdDocMessage({
          type: "success",
          text: `Justificatif (${selectedDocType}) enregistré et validé ! ✓`,
        });
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
      const res = await fetch("/api/auth/logout", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      const target = data?.redirect || "/connexion";
      router.push(target);
      router.refresh();
    } catch {
      // En cas d'erreur réseau, on force la redirection quand même
      router.push("/connexion");
      router.refresh();
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--color-gray-500)", fontWeight: 500 }}>Chargement des données de sécurité...</p>
      </div>
    );
  }

  const isFullyVerified = idDocSubmitted && selfieSubmitted;

  return (
    <div style={{ minHeight: "100dvh", background: "#F8FAFC" }}>
      {/* ── Header ── */}
      <header
        style={{
          background: "white",
          borderBottom: "1px solid #E2E8F0",
          position: "sticky",
          top: 0,
          zIndex: 40,
          height: "64px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link
            href="/profil"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              textDecoration: "none",
              color: "#0B2559",
              fontWeight: 700,
              fontSize: "14px",
            }}
          >
            <ChevronLeft size={18} />
            <span>Retour au profil</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 14px",
              borderRadius: "10px",
              border: "1.5px solid #FCA5A5",
              background: "#FEF2F2",
              color: "#DC2626",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            <LogOut size={14} />
            <span>Déconnexion</span>
          </button>
        </div>
      </header>

      <main className="container" style={{ maxWidth: "720px", paddingBlock: "36px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

          {/* ── Mot de passe (connexion avec pseudo, en plus de Google) ── */}
          <PasswordCard />

          {/* ── Status Banner Chat ── */}
          <div
            style={{
              padding: "20px 24px",
              borderRadius: "16px",
              background: isFullyVerified
                ? "linear-gradient(135deg, #10B981 0%, #059669 100%)"
                : "linear-gradient(135deg, #0B2559 0%, #163B8A 100%)",
              color: "white",
              boxShadow: "0 6px 20px rgba(11,37,89,0.12)",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {isFullyVerified ? <CheckCircle2 size={26} color="white" /> : <ShieldCheck size={26} color="#FDE047" />}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 4px" }}>
                  {isFullyVerified
                    ? "Identité Validée · Accès au Chat Actif"
                    : "Sécurité & Contrôle d'Identité Obligatoire"}
                </h2>
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.9)", margin: 0, lineHeight: 1.5 }}>
                  {isFullyVerified
                    ? "Votre pièce d'identité et votre selfie facial ont été validés avec succès. Vous pouvez contacter les partenaires et échanger sans restriction."
                    : "Avant de pouvoir entrer en contact avec un partenaire, vous devez obligatoirement soumettre votre pièce d'identité et un selfie de contrôle facial."}
                </p>
              </div>
            </div>
          </div>

          {/* ── Section 1 : Pièce d'identité (CNI / Passeport / etc.) ── */}
          <div className="card card-padded" style={{ background: "white", borderRadius: "16px", border: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "16px" }}>
              <span style={{ fontSize: "32px" }}>🪪</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0B2559", margin: 0 }}>
                    1. Justificatif de Pièce d&apos;Identité
                  </h3>
                  {idDocSubmitted ? (
                    <span style={{ background: "#DCFCE7", color: "#166534", fontSize: "12px", fontWeight: 800, padding: "3px 10px", borderRadius: "100px" }}>
                      Validé ✓
                    </span>
                  ) : (
                    <span style={{ background: "#FEF3C7", color: "#92400E", fontSize: "12px", fontWeight: 800, padding: "3px 10px", borderRadius: "100px" }}>
                      Requis pour le chat
                    </span>
                  )}
                </div>
                <p style={{ fontSize: "13px", color: "#64748B", margin: "6px 0 0", lineHeight: 1.5 }}>
                  Toute pièce officielle prouvant l&apos;identité de la personne est acceptée. Document strictement confidentiel, non public, utilisé uniquement pour la certification 18+.
                </p>
              </div>
            </div>

            {/* Sélecteur de type de pièce */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px", textTransform: "uppercase" }}>
                Type de document d&apos;identité
              </label>
              <select
                value={selectedDocType}
                onChange={(e) => setSelectedDocType(e.target.value)}
                disabled={idDocSubmitted}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1.5px solid #CBD5E1",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#0F172A",
                  background: "white",
                  outline: "none",
                }}
              >
                {DOCUMENT_TYPES.map((dt) => (
                  <option key={dt.value} value={dt.value}>
                    {dt.label}
                  </option>
                ))}
              </select>
            </div>

            {idDocMessage && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "16px",
                  background: idDocMessage.type === "success" ? "#ECFDF5" : "#FEF2F2",
                  color: idDocMessage.type === "success" ? "#065F46" : "#991B1B",
                }}
              >
                {idDocMessage.text}
              </div>
            )}

            {!idDocSubmitted ? (
              <label
                className="btn btn-outline-blue"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: submittingIdDoc ? "not-allowed" : "pointer",
                  fontWeight: 700,
                  fontSize: "14px",
                }}
              >
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  style={{ display: "none" }}
                  onChange={handleIdDocumentUpload}
                  disabled={submittingIdDoc}
                />
                {submittingIdDoc ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    <span>Envoi en cours...</span>
                  </>
                ) : (
                  <>
                    <FileText size={16} />
                    <span>Prendre en photo / Téléverser ma pièce d&apos;identité</span>
                  </>
                )}
              </label>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#16A34A", fontSize: "14px", fontWeight: 700 }}>
                <CheckCircle2 size={18} />
                <span>Pièce d&apos;identité enregistrée et vérifiée avec succès.</span>
              </div>
            )}
          </div>

          {/* ── Section 2 : Contrôle Facial par Selfie ── */}
          <div className="card card-padded" style={{ background: "white", borderRadius: "16px", border: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "16px" }}>
              <span style={{ fontSize: "32px" }}>🤳</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0B2559", margin: 0 }}>
                    2. Contrôle Facial par Selfie (Caméra en direct)
                  </h3>
                  {selfieSubmitted ? (
                    <span style={{ background: "#DCFCE7", color: "#166534", fontSize: "12px", fontWeight: 800, padding: "3px 10px", borderRadius: "100px" }}>
                      Validé ✓
                    </span>
                  ) : (
                    <span style={{ background: "#FEF3C7", color: "#92400E", fontSize: "12px", fontWeight: 800, padding: "3px 10px", borderRadius: "100px" }}>
                      Requis pour le chat
                    </span>
                  )}
                </div>
                <p style={{ fontSize: "13px", color: "#64748B", margin: "6px 0 0", lineHeight: 1.5 }}>
                  Prenez un selfie montrant clairement votre visage pour confirmer que vous êtes bien la personne correspondant à la pièce d&apos;identité. Le selfie de contrôle facial reste privé.
                </p>
              </div>
            </div>

            {/* Guide visuel de cadrage */}
            <div
              style={{
                background: "#F1F5F9",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  border: "2px dashed #0B2559",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  flexShrink: 0,
                  background: "white",
                }}
              >
                👤
              </div>
              <div>
                <strong style={{ fontSize: "13px", color: "#0F172A", display: "block" }}>
                  Instructions de contrôle facial
                </strong>
                <span style={{ fontSize: "12px", color: "#64748B" }}>
                  Regardez l&apos;objectif de face, sans lunettes de soleil ni chapeau, avec un bon éclairage.
                </span>
              </div>
            </div>

            {selfieMessage && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "16px",
                  background: selfieMessage.type === "success" ? "#ECFDF5" : "#FEF2F2",
                  color: selfieMessage.type === "success" ? "#065F46" : "#991B1B",
                }}
              >
                {selfieMessage.text}
              </div>
            )}

            {!selfieSubmitted ? (
              <label
                className="btn btn-primary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: submittingSelfie ? "not-allowed" : "pointer",
                  fontWeight: 800,
                  fontSize: "14px",
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  style={{ display: "none" }}
                  onChange={handleSelfieUpload}
                  disabled={submittingSelfie}
                />
                {submittingSelfie ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    <span>Contrôle facial en cours...</span>
                  </>
                ) : (
                  <>
                    <Camera size={16} />
                    <span>Ouvrir l&apos;appareil photo & Faire mon contrôle facial 🤳</span>
                  </>
                )}
              </label>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#16A34A", fontSize: "14px", fontWeight: 700 }}>
                <CheckCircle2 size={18} />
                <span>Contrôle facial confirmé et validé.</span>
              </div>
            )}
          </div>

          {/* ── Section 3 : Choix de Présence dans le Club (Mode Discret / Visible) ── */}
          <div className="card card-padded" style={{ background: "white", borderRadius: "16px", border: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "16px" }}>
              <span style={{ fontSize: "32px" }}>👁️</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0B2559", margin: 0 }}>
                    3. Choix de ma Présence dans le Club
                  </h3>
                  <span
                    style={{
                      background: isVisible ? "#DCFCE7" : "#F1F5F9",
                      color: isVisible ? "#166534" : "#475569",
                      fontSize: "12px",
                      fontWeight: 800,
                      padding: "4px 12px",
                      borderRadius: "100px",
                    }}
                  >
                    {isVisible ? "Profil Visible aux membres" : "Mode Discret (Masqué)"}
                  </span>
                </div>
                <p style={{ fontSize: "13px", color: "#64748B", margin: "6px 0 0", lineHeight: 1.5 }}>
                  Vous contrôlez entièrement votre présence. Vous pouvez choisir d&apos;apparaître dans la liste Découverte ou passer en mode discret à tout moment.
                </p>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px",
                background: "#F8FAFC",
                borderRadius: "12px",
                border: "1px solid #E2E8F0",
              }}
            >
              <div>
                <strong style={{ fontSize: "14px", color: "#0F172A", display: "block" }}>
                  {isVisible ? "Actif : Visibilité activée" : "Discret : Présence masquée"}
                </strong>
                <span style={{ fontSize: "12px", color: "#64748B" }}>
                  {isVisible
                    ? "Les partenaires compatibles à Lomé peuvent découvrir votre profil."
                    : "Votre profil est masqué de la recherche. Seuls vos contacts actuels peuvent vous écrire."}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleTogglePresence(!isVisible)}
                disabled={savingPresence}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "9px 16px",
                  borderRadius: "10px",
                  border: isVisible ? "1.5px solid #CBD5E1" : "1.5px solid #2563EB",
                  background: isVisible ? "white" : "#EFF6FF",
                  color: isVisible ? "#334155" : "#1D4ED8",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                {isVisible ? <EyeOff size={15} /> : <Eye size={15} />}
                <span>{isVisible ? "Passer en mode discret" : "Rendre visible"}</span>
              </button>
            </div>

            {presenceMsg && (
              <p style={{ fontSize: "13px", color: "#2563EB", fontWeight: 600, margin: "12px 0 0" }}>
                {presenceMsg}
              </p>
            )}
          </div>

          {/* ── Section 4 : Déconnexion Rapide & Sécurisée ── */}
          <div className="card card-padded" style={{ background: "white", borderRadius: "16px", border: "1.5px solid #FECACA" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "14px" }}>
              <span style={{ fontSize: "28px" }}>🚪</span>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#DC2626", margin: "0 0 4px" }}>
                  Déconnexion de mon compte
                </h3>
                <p style={{ fontSize: "13px", color: "#64748B", margin: 0, lineHeight: 1.5 }}>
                  Mettez fin à votre session active sur cet appareil en toute sécurité. Vous pourrez vous reconnecter à tout moment avec votre pseudo ou e-mail.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              style={{
                width: "100%",
                padding: "14px 20px",
                borderRadius: "12px",
                border: "none",
                background: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)",
                color: "white",
                fontWeight: 800,
                fontSize: "15px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: "0 4px 14px rgba(220,38,38,0.25)",
              }}
            >
              <LogOut size={18} />
              <span>Se déconnecter de Meet Me Club</span>
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
