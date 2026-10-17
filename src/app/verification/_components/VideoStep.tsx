"use client";
// VIP : courte vidéo enregistrée EN DIRECT (pas d'import), où le membre dit son prénom et un code
// à 4 chiffres, puis tourne la tête. Contrôlée par l'équipe ; débloque les appels audio et vidéo.

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, RefreshCw, Square, Video } from "lucide-react";
import { card, ErrorText, lead, NAVY, Pending, primaryBtn, Privacy, RED, Rejected, secondaryBtn, Spinner, title, type VerificationData } from "./ui";

const MAX_SECONDS = 10;

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return ["video/webm;codecs=vp8,opus", "video/webm", "video/mp4"].find((t) => MediaRecorder.isTypeSupported(t));
}

export default function VideoStep({ data, onDone, verifiedAlready }: { data: VerificationData; onDone: () => void; verifiedAlready: boolean }) {
  const [phase, setPhase] = useState<"idle" | "preview" | "recording" | "done">("idle");
  const [seconds, setSeconds] = useState(0);
  const [clip, setClip] = useState<Blob | null>(null);
  const [clipUrl, setClipUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const liveRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopAll = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);
  useEffect(() => stopAll, [stopAll]);

  useEffect(() => {
    if ((phase === "preview" || phase === "recording") && liveRef.current && streamRef.current) {
      liveRef.current.srcObject = streamRef.current;
      liveRef.current.play().catch(() => {});
    }
  }, [phase]);

  async function openCamera() {
    setError("");
    setClip(null);
    setClipUrl(null);
    if (!pickMimeType()) {
      setError("Votre navigateur ne permet pas d'enregistrer une vidéo. Utilisez Chrome ou Safari à jour.");
      return;
    }
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } },
        audio: true,
      });
      setPhase("preview");
    } catch {
      setError("Impossible d'ouvrir la caméra et le micro. Autorisez-les pour meetmeclub.net, puis réessayez.");
    }
  }

  function startRecording() {
    const stream = streamRef.current;
    const mimeType = pickMimeType();
    if (!stream || !mimeType) return;
    const chunks: Blob[] = [];
    const rec = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 600_000, audioBitsPerSecond: 64_000 });
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType.split(";")[0] });
      setClip(blob);
      setClipUrl(URL.createObjectURL(blob));
      setPhase("done");
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
    recorderRef.current = rec;
    rec.start(500);
    setSeconds(0);
    setPhase("recording");
    timerRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s + 1 >= MAX_SECONDS) stopRecording();
        return s + 1;
      });
    }, 1000);
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  async function send() {
    if (!clip) return;
    setSending(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("video", clip, clip.type === "video/mp4" ? "video.mp4" : "video.webm");
      const res = await fetch("/api/verifications/video", { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok) return setError(d.error || "Envoi impossible.");
      onDone();
    } catch {
      setError("Connexion perdue. Vérifiez votre internet et réessayez.");
    } finally {
      setSending(false);
    }
  }

  const video = data.video;
  if (video?.status === "PENDING") {
    return (
      <Pending heading="Vidéo en cours de vérification">
        Votre vidéo a bien été reçue. L&apos;équipe Meet Me Club la vérifie : les appels audio et vidéo seront débloqués dès
        la validation.
      </Pending>
    );
  }

  return (
    <div style={card}>
      {video?.status === "REJECTED" && <Rejected note={video.note} />}
      <Video size={44} color={NAVY} style={{ margin: "0 auto 10px" }} />
      <h1 style={title}>Vérification vidéo VIP</h1>
      <p style={lead}>
        {verifiedAlready
          ? "Pour débloquer les appels audio et vidéo, enregistrez une courte vidéo de vous. L'équipe la compare à vos photos."
          : "En tant que membre VIP, vous vous vérifiez par une courte vidéo. L'équipe la compare à vos photos, puis active votre profil et vos appels."}
      </p>

      <div style={{ background: "#EFF6FF", border: `2px dashed ${NAVY}`, borderRadius: 16, padding: "14px 16px", marginBottom: 18, textAlign: "left" }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, color: RED, marginBottom: 6 }}>DANS LA VIDÉO (5 À 10 SECONDES)</div>
        <ol style={{ margin: 0, paddingLeft: 20, color: NAVY, fontSize: 15, lineHeight: 1.7, fontWeight: 600 }}>
          <li>Dites : « Je m&apos;appelle [votre prénom], mon code est <strong style={{ color: RED, letterSpacing: 2 }}>{video?.code}</strong> »</li>
          <li>Tournez lentement la tête à gauche, puis à droite</li>
        </ol>
      </div>

      {(phase === "preview" || phase === "recording") && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ position: "relative", width: "100%", maxWidth: 340, aspectRatio: "3 / 4", margin: "0 auto 14px", borderRadius: 22, overflow: "hidden", background: "#0F172A" }}>
            <video ref={liveRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
            {phase === "recording" && (
              <div style={{ position: "absolute", top: 12, left: 12, background: RED, color: "white", fontWeight: 800, fontSize: 13, padding: "4px 10px", borderRadius: 999 }}>
                ● {seconds}s / {MAX_SECONDS}s
              </div>
            )}
          </div>
          {phase === "preview" ? (
            <button type="button" onClick={startRecording} style={primaryBtn}>
              <Video size={20} /> Démarrer l&apos;enregistrement
            </button>
          ) : (
            <button type="button" onClick={stopRecording} disabled={seconds < 4} style={{ ...primaryBtn, background: NAVY, opacity: seconds < 4 ? 0.6 : 1 }}>
              <Square size={18} /> {seconds < 4 ? "Parlez…" : "Terminer"}
            </button>
          )}
        </div>
      )}

      {phase === "done" && clipUrl && (
        <div style={{ marginBottom: 16 }}>
          <video src={clipUrl} controls playsInline style={{ width: "100%", maxWidth: 340, borderRadius: 22, display: "block", margin: "0 auto 14px", background: "#0F172A" }} />
          <p style={{ fontSize: 13, color: "#475569", margin: "0 0 14px" }}>Vérifiez qu&apos;on vous voit et qu&apos;on vous entend bien dire le code.</p>
          <div style={{ display: "grid", gap: 10 }}>
            <button type="button" onClick={send} disabled={sending} style={{ ...primaryBtn, opacity: sending ? 0.7 : 1 }}>
              {sending ? <Spinner /> : <CheckCircle2 size={20} />} {sending ? "Envoi en cours…" : "Envoyer ma vidéo"}
            </button>
            <button type="button" onClick={openCamera} disabled={sending} style={secondaryBtn}>
              <RefreshCw size={18} /> Recommencer
            </button>
          </div>
        </div>
      )}

      {phase === "idle" && (
        <button type="button" onClick={openCamera} style={primaryBtn}>
          <Video size={20} /> Ouvrir la caméra
        </button>
      )}

      {error && <ErrorText>{error}</ErrorText>}
      <Privacy>Votre vidéo reste privée : seule l&apos;équipe de vérification la voit. Elle n&apos;est jamais montrée aux autres membres.</Privacy>
    </div>
  );
}
