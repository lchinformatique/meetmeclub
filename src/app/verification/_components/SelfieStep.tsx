"use client";
// Essai gratuit : selfie pris EN DIRECT avec la caméra (aucun import), avec un geste imposé.

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, RefreshCw, ShieldCheck } from "lucide-react";
import { card, ErrorText, lead, NAVY, Pending, primaryBtn, Privacy, RED, Rejected, secondaryBtn, Spinner, title, type VerificationData } from "./ui";

export default function SelfieStep({ data, onDone }: { data: VerificationData; onDone: () => void }) {
  const [cameraOn, setCameraOn] = useState(false);
  const [shot, setShot] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }, []);
  useEffect(() => stopCamera, [stopCamera]);

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
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 960 }, height: { ideal: 960 } },
        audio: false,
      });
      setCameraOn(true);
    } catch {
      setError("Impossible d'ouvrir la caméra. Autorisez l'accès à la caméra pour meetmeclub.net, puis réessayez.");
    }
  }

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const scale = Math.min(1, 720 / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
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
      const d = await res.json();
      if (!res.ok) return setError(d.error || "Envoi impossible.");
      setShot(null);
      onDone();
    } catch {
      setError("Connexion perdue. Vérifiez votre internet et réessayez.");
    } finally {
      setSending(false);
    }
  }

  const selfie = data.selfie;
  if (selfie?.status === "PENDING") {
    return (
      <Pending heading="Vérification en cours">
        Votre selfie a bien été reçu. L&apos;équipe Meet Me Club le compare à vos photos de profil. Vous recevrez une
        notification dès la validation.
      </Pending>
    );
  }

  return (
    <div style={card}>
      {selfie?.status === "REJECTED" && <Rejected note={selfie.note} />}
      <ShieldCheck size={44} color={NAVY} style={{ margin: "0 auto 10px" }} />
      <h1 style={title}>Vérifiez votre visage</h1>
      <p style={lead}>
        Chez Meet Me Club, chaque membre est une vraie personne. Prenez un selfie en direct : l&apos;équipe le compare à vos
        photos, puis active votre profil.
      </p>

      <div style={{ background: "#EFF6FF", border: `2px dashed ${NAVY}`, borderRadius: 16, padding: "14px 16px", marginBottom: 18 }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, color: RED, marginBottom: 4 }}>GESTE DEMANDÉ</div>
        <div style={{ fontSize: 17, fontWeight: 800, color: NAVY, lineHeight: 1.4 }}>{selfie?.gestureText}</div>
      </div>

      {cameraOn && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ position: "relative", width: "100%", maxWidth: 340, aspectRatio: "3 / 4", margin: "0 auto 14px", borderRadius: 22, overflow: "hidden", background: "#0F172A" }}>
            <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
            <div style={{ position: "absolute", inset: "12% 18% 22%", border: "3px solid rgba(255,255,255,0.85)", borderRadius: "50%", pointerEvents: "none" }} />
          </div>
          <button type="button" onClick={capture} style={primaryBtn}>
            <Camera size={20} /> Prendre la photo
          </button>
        </div>
      )}

      {shot && !cameraOn && (
        <div style={{ marginBottom: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shot} alt="Votre selfie" style={{ width: "100%", maxWidth: 340, borderRadius: 22, display: "block", margin: "0 auto 14px", transform: "scaleX(-1)" }} />
          <p style={{ fontSize: 13, color: "#3B4658", margin: "0 0 14px" }}>Votre visage est-il bien visible, avec le geste demandé ?</p>
          <div style={{ display: "grid", gap: 10 }}>
            <button type="button" onClick={send} disabled={sending} style={{ ...primaryBtn, opacity: sending ? 0.7 : 1 }}>
              {sending ? <Spinner /> : <CheckCircle2 size={20} />} {sending ? "Envoi en cours…" : "Envoyer pour vérification"}
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

      {error && <ErrorText>{error}</ErrorText>}
      <Privacy>Votre selfie reste privé : seule l&apos;équipe de vérification le voit. Il n&apos;est jamais montré aux autres membres.</Privacy>
    </div>
  );
}
