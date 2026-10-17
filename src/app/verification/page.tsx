"use client";
// src/app/verification/page.tsx
// Vérification faciale obligatoire : selfie pris EN DIRECT avec la caméra (aucun import de fichier),
// avec un geste imposé au hasard. L'équipe compare ensuite le selfie aux photos du profil.

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, CheckCircle2, ChevronLeft, Clock, ImagePlus, Loader2, RefreshCw, ShieldCheck, XCircle } from "lucide-react";

type Status = "NONE" | "PENDING" | "APPROVED" | "REJECTED";

interface State {
  configured: boolean;
  status: Status;
  gestureText?: string | null;
  note?: string | null;
  hasProfilePhoto?: boolean;
  hasProfile?: boolean;
  isAdmin?: boolean;
}

const NAVY = "#0B2559";
const RED = "#E10600";

export default function VerificationPage() {
  const router = useRouter();
  const [state, setState] = useState<State | null>(null);
  const [error, setError] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const [shot, setShot] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/verifications/selfie", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/connexion?callbackUrl=/verification");
      return;
    }
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Chargement impossible.");
      return;
    }
    setState(data);
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  // Pendant la vérification, on regarde régulièrement si l'équipe a répondu
  useEffect(() => {
    if (state?.status !== "PENDING") return;
    const t = setInterval(load, 20_000);
    return () => clearInterval(t);
  }, [state?.status, load]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  // Branche le flux de la caméra une fois l'élément vidéo affiché
  useEffect(() => {
    if (cameraOn && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraOn]);

  async function startCamera() {
    setError("");
    setShot(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 960 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOn(true);
    } catch {
      setError(
        "Impossible d'ouvrir la caméra. Autorisez l'accès à la caméra pour meetmeclub.net (icône à gauche de l'adresse du site), puis réessayez."
      );
    }
  }

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const max = 720;
    const scale = Math.min(1, max / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setShot(canvas.toDataURL("image/jpeg", 0.85));
    stopCamera();
  }

  async function send() {
    if (!shot) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/verifications/selfie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: shot }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Envoi impossible.");
        if (data.redirect) setTimeout(() => router.push(data.redirect), 1800);
        return;
      }
      setShot(null);
      await load();
    } catch {
      setError("Connexion perdue. Vérifiez votre internet et réessayez.");
    } finally {
      setSending(false);
    }
  }

  const card: React.CSSProperties = {
    background: "white",
    borderRadius: 24,
    border: "1px solid #E2E8F0",
    boxShadow: "0 10px 30px rgba(11,37,89,0.08)",
    padding: "28px 22px",
    textAlign: "center",
  };
  const primaryBtn: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    padding: "15px 20px",
    borderRadius: 14,
    border: "none",
    background: RED,
    color: "white",
    fontWeight: 800,
    fontSize: 16,
    cursor: "pointer",
    textDecoration: "none",
  };
  const secondaryBtn: React.CSSProperties = {
    ...primaryBtn,
    background: "white",
    color: NAVY,
    border: `2px solid ${NAVY}`,
  };

  function body() {
    if (!state) {
      return (
        <div style={card}>
          {error ? (
            <p style={{ color: "#B91C1C", fontWeight: 600 }}>{error}</p>
          ) : (
            <Loader2 size={32} color={NAVY} style={{ animation: "spin 1s linear infinite" }} />
          )}
        </div>
      );
    }

    if (state.status === "APPROVED") {
      return (
        <div style={card}>
          <CheckCircle2 size={56} color="#16A34A" style={{ margin: "0 auto 12px" }} />
          <h1 style={{ fontSize: 24, fontWeight: 800, color: NAVY, margin: "0 0 8px" }}>Profil vérifié</h1>
          <p style={{ color: "#475569", lineHeight: 1.6, margin: "0 0 22px" }}>
            {state.isAdmin
              ? "Compte administrateur : aucune vérification n'est nécessaire."
              : "Votre visage a été vérifié par l'équipe Meet Me Club. Vous pouvez échanger avec tous les membres."}
          </p>
          <Link href="/decouverte" style={primaryBtn}>
            Découvrir les membres
          </Link>
        </div>
      );
    }

    if (state.status === "PENDING") {
      return (
        <div style={card}>
          <Clock size={56} color="#D97706" style={{ margin: "0 auto 12px" }} />
          <h1 style={{ fontSize: 24, fontWeight: 800, color: NAVY, margin: "0 0 8px" }}>Vérification en cours</h1>
          <p style={{ color: "#475569", lineHeight: 1.6, margin: "0 0 18px" }}>
            Votre selfie a bien été reçu. L&apos;équipe Meet Me Club le compare à vos photos de profil. Vous recevrez une
            notification dès que votre profil sera validé.
          </p>
          <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 20px" }}>
            En attendant, vous pouvez compléter votre profil et ajouter d&apos;autres photos.
          </p>
          <div style={{ display: "grid", gap: 10 }}>
            <Link href="/profil/edit" style={secondaryBtn}>
              Compléter mon profil
            </Link>
          </div>
        </div>
      );
    }

    // NONE ou REJECTED
    if (!state.hasProfile || !state.hasProfilePhoto) {
      return (
        <div style={card}>
          <ImagePlus size={52} color={NAVY} style={{ margin: "0 auto 12px" }} />
          <h1 style={{ fontSize: 22, fontWeight: 800, color: NAVY, margin: "0 0 8px" }}>Ajoutez d&apos;abord une photo</h1>
          <p style={{ color: "#475569", lineHeight: 1.6, margin: "0 0 22px" }}>
            Votre selfie de contrôle sera comparé à votre photo de profil. Ajoutez une photo nette où l&apos;on voit bien
            votre visage, puis revenez ici.
          </p>
          <Link href={state.hasProfile ? "/profil/photos" : "/profil/edit"} style={primaryBtn}>
            {state.hasProfile ? "Ajouter ma photo de profil" : "Compléter mon profil"}
          </Link>
        </div>
      );
    }

    return (
      <div style={card}>
        {state.status === "REJECTED" && (
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              textAlign: "left",
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              borderRadius: 14,
              padding: "12px 14px",
              marginBottom: 18,
              color: "#991B1B",
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            <XCircle size={20} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              <strong>Selfie non validé.</strong> {state.note || "Reprenez votre selfie en suivant le geste demandé."}
            </span>
          </div>
        )}

        <ShieldCheck size={44} color={NAVY} style={{ margin: "0 auto 10px" }} />
        <h1 style={{ fontSize: 22, fontWeight: 800, color: NAVY, margin: "0 0 6px" }}>Vérifiez votre visage</h1>
        <p style={{ color: "#475569", fontSize: 14, lineHeight: 1.6, margin: "0 0 16px" }}>
          Chez Meet Me Club, chaque membre est une vraie personne. Prenez un selfie en direct : l&apos;équipe le compare
          à vos photos, puis active votre profil.
        </p>

        <div
          style={{
            background: "#EFF6FF",
            border: `2px dashed ${NAVY}`,
            borderRadius: 16,
            padding: "14px 16px",
            marginBottom: 18,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, color: RED, marginBottom: 4 }}>GESTE DEMANDÉ</div>
          <div style={{ fontSize: 17, fontWeight: 800, color: NAVY, lineHeight: 1.4 }}>{state.gestureText}</div>
        </div>

        {cameraOn && (
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                position: "relative",
                width: "100%",
                maxWidth: 340,
                aspectRatio: "3 / 4",
                margin: "0 auto 14px",
                borderRadius: 22,
                overflow: "hidden",
                background: "#0F172A",
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: "12% 18% 22%",
                  border: "3px solid rgba(255,255,255,0.85)",
                  borderRadius: "50%",
                  pointerEvents: "none",
                }}
              />
            </div>
            <button type="button" onClick={capture} style={primaryBtn}>
              <Camera size={20} /> Prendre la photo
            </button>
          </div>
        )}

        {shot && !cameraOn && (
          <div style={{ marginBottom: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={shot}
              alt="Votre selfie"
              style={{
                width: "100%",
                maxWidth: 340,
                borderRadius: 22,
                display: "block",
                margin: "0 auto 14px",
                transform: "scaleX(-1)",
              }}
            />
            <p style={{ fontSize: 13, color: "#475569", margin: "0 0 14px" }}>
              Votre visage est-il bien visible, avec le geste demandé ?
            </p>
            <div style={{ display: "grid", gap: 10 }}>
              <button type="button" onClick={send} disabled={sending} style={{ ...primaryBtn, opacity: sending ? 0.7 : 1 }}>
                {sending ? <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle2 size={20} />}
                {sending ? "Envoi en cours…" : "Envoyer pour vérification"}
              </button>
              <button type="button" onClick={startCamera} disabled={sending} style={secondaryBtn}>
                <RefreshCw size={18} /> Reprendre la photo
              </button>
            </div>
          </div>
        )}

        {!cameraOn && !shot && (
          <>
            <ul style={{ textAlign: "left", color: "#334155", fontSize: 14, lineHeight: 1.7, margin: "0 0 18px", paddingLeft: 20 }}>
              <li>Placez-vous dans un endroit bien éclairé</li>
              <li>Visage de face, sans lunettes de soleil ni masque</li>
              <li>Faites le geste demandé ci-dessus</li>
            </ul>
            <button type="button" onClick={startCamera} style={primaryBtn}>
              <Camera size={20} /> Ouvrir la caméra
            </button>
          </>
        )}

        {error && <p style={{ color: "#B91C1C", fontWeight: 600, fontSize: 14, marginTop: 14 }}>{error}</p>}

        <p style={{ fontSize: 12, color: "#64748B", lineHeight: 1.5, marginTop: 18, marginBottom: 0 }}>
          🔒 Votre selfie reste privé : seule l&apos;équipe de vérification le voit. Il n&apos;est jamais affiché sur votre
          profil ni montré aux autres membres.
        </p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#F8FAFC" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <header
        style={{
          background: "white",
          borderBottom: "1px solid #E2E8F0",
          height: 64,
          display: "flex",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link
            href="/profil"
            style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none", color: NAVY, fontWeight: 700, fontSize: 14 }}
          >
            <ChevronLeft size={18} />
            <span>Mon profil</span>
          </Link>
          <span style={{ fontWeight: 800, color: NAVY, fontSize: 15 }}>Vérification</span>
        </div>
      </header>
      <main className="container" style={{ maxWidth: 480, paddingBlock: 28 }}>
        {body()}
      </main>
    </div>
  );
}
