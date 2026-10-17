"use client";
// Zone de saisie : texte, pièces jointes, appareil photo, position et notes vocales.
// Note vocale façon WhatsApp : maintenir le micro pour parler, relâcher pour envoyer,
// glisser à gauche pour annuler, glisser vers le haut pour verrouiller (mains libres).

import { useEffect, useRef, useState } from "react";
import { Camera, ChevronLeft, ChevronUp, Image as ImageIcon, Lock, MapPin, Mic, Paperclip, Send, Trash2 } from "lucide-react";
import styles from "../messages.module.css";
import { formatSeconds, readAsDataUrl } from "../_lib/chat-utils";

const CANCEL_DISTANCE = 90; // px vers la gauche
const LOCK_DISTANCE = 70; // px vers le haut
const MIN_SECONDS = 1;

export default function Composer({
  onSendText,
  onSendFile,
  onSendVoice,
  onOpenLocation,
  onTyping,
  onBlocked,
  blocked,
  initialDraft,
}: {
  onSendText: (text: string) => void;
  onSendFile: (file: File) => void;
  onSendVoice: (dataUrl: string, seconds: number) => void;
  onOpenLocation: () => void;
  onTyping: () => void;
  onBlocked: () => void;
  blocked: boolean;
  /** Message prérempli (ex. « au sujet de votre annonce… » depuis le Marché) */
  initialDraft?: string;
}) {
  const [draft, setDraft] = useState(initialDraft || "");
  const [attachOpen, setAttachOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [locked, setLocked] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelledRef = useRef(false);
  const secondsRef = useRef(0);
  const holdingRef = useRef(false);
  const lockedRef = useRef(false);
  const startPoint = useRef<{ x: number; y: number } | null>(null);

  // Hauteur automatique du champ texte
  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  }, [draft]);

  useEffect(() => {
    if (!hint) return;
    const id = setTimeout(() => setHint(null), 3500);
    return () => clearTimeout(id);
  }, [hint]);

  const stopStream = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  // Libère le micro si on quitte la conversation pendant un enregistrement
  useEffect(() => () => stopStream(), []);

  const guard = () => {
    if (blocked) {
      onBlocked();
      return false;
    }
    return true;
  };

  const send = () => {
    const text = draft.trim();
    if (!text || !guard()) return;
    onSendText(text);
    setDraft("");
    textRef.current?.focus();
  };

  const resetRecordingUi = () => {
    setRecording(false);
    setLocked(false);
    lockedRef.current = false;
    setDragX(0);
  };

  const startRecording = async () => {
    if (!guard()) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setHint("L'enregistrement vocal n'est pas disponible sur ce navigateur.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
      });
      // Doigt déjà relevé pendant la demande d'autorisation : on n'enregistre pas
      if (!holdingRef.current && !lockedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        setHint("Maintenez le micro appuyé pour enregistrer, relâchez pour envoyer.");
        return;
      }
      streamRef.current = stream;
      // MP4/AAC d'abord : lisible sur iPhone ET Android
      const mime = ["audio/mp4", "audio/aac", "audio/webm;codecs=opus", "audio/webm"].find((t) =>
        MediaRecorder.isTypeSupported?.(t)
      );
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 64000 } : undefined);
      chunksRef.current = [];
      cancelledRef.current = false;
      rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      rec.onstop = async () => {
        const secs = secondsRef.current;
        stopStream();
        if (cancelledRef.current || chunksRef.current.length === 0) return;
        if (secs < MIN_SECONDS) {
          setHint("Note trop courte : maintenez le micro pendant que vous parlez.");
          return;
        }
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || mime || "audio/webm" });
        onSendVoice(await readAsDataUrl(blob), secs);
      };
      recorderRef.current = rec;
      rec.start(200);
      secondsRef.current = 0;
      setSeconds(0);
      setRecording(true);
      navigator.vibrate?.(30);
      timerRef.current = setInterval(() => {
        secondsRef.current += 1;
        setSeconds(secondsRef.current);
        if (secondsRef.current >= 120) finishRecording(); // 2 minutes maximum
      }, 1000);
    } catch {
      holdingRef.current = false;
      setHint("Autorisez l'accès au micro pour envoyer une note vocale.");
    }
  };

  const finishRecording = () => {
    holdingRef.current = false;
    resetRecordingUi();
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    else stopStream();
  };

  const cancelRecording = () => {
    cancelledRef.current = true;
    holdingRef.current = false;
    resetRecordingUi();
    navigator.vibrate?.([20, 40, 20]);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    else stopStream();
  };

  // ── Gestes sur le micro ─────────────────────────────────────
  const onMicDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (lockedRef.current) return;
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    holdingRef.current = true;
    startPoint.current = { x: e.clientX, y: e.clientY };
    startRecording();
  };

  const onMicMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!holdingRef.current || !startPoint.current || lockedRef.current) return;
    const dx = e.clientX - startPoint.current.x;
    const dy = e.clientY - startPoint.current.y;
    setDragX(Math.min(0, dx));
    if (dx < -CANCEL_DISTANCE) cancelRecording();
    else if (dy < -LOCK_DISTANCE && recording) {
      lockedRef.current = true;
      holdingRef.current = false;
      setLocked(true);
      setDragX(0);
      navigator.vibrate?.(20);
    }
  };

  const onMicUp = () => {
    if (lockedRef.current) return; // verrouillé : on continue à enregistrer
    if (!holdingRef.current) return;
    holdingRef.current = false;
    if (recorderRef.current?.state === "recording") finishRecording();
    // sinon : l'autorisation micro est encore en cours, startRecording annulera
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    setAttachOpen(false);
    if (file && guard()) onSendFile(file);
  };

  const showMic = !draft.trim();

  return (
    <div className={styles.composerWrap}>
      {hint && <div className={styles.composerError}>{hint}</div>}

      {attachOpen && !recording && (
        <div className={styles.attachMenu}>
          <button type="button" onClick={() => galleryRef.current?.click()}>
            <span className={styles.attachIcon} style={{ background: "#7C3AED" }}>
              <ImageIcon size={20} />
            </span>
            Galerie
          </button>
          <button type="button" onClick={() => cameraRef.current?.click()}>
            <span className={styles.attachIcon} style={{ background: "#E10600" }}>
              <Camera size={20} />
            </span>
            Appareil photo
          </button>
          <button
            type="button"
            onClick={() => {
              setAttachOpen(false);
              if (guard()) onOpenLocation();
            }}
          >
            <span className={styles.attachIcon} style={{ background: "#0B2559" }}>
              <MapPin size={20} />
            </span>
            Position
          </button>
        </div>
      )}

      <input ref={galleryRef} type="file" accept="image/*,video/*" hidden onChange={onFile} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={onFile} />

      {/* Verrou affiché au-dessus du micro pendant l'appui */}
      {recording && !locked && (
        <div className={styles.lockHint} aria-hidden>
          <Lock size={16} />
          <ChevronUp size={16} />
        </div>
      )}

      <div className={styles.composer}>
        {recording ? (
          <div className={styles.recordingBar}>
            {locked ? (
              <button type="button" className={styles.iconBtn} onClick={cancelRecording} aria-label="Supprimer la note vocale">
                <Trash2 size={21} />
              </button>
            ) : null}
            <span className={styles.recDot} />
            <span className={styles.recTime}>{formatSeconds(seconds)}</span>
            {locked ? (
              <span className={styles.recHint}>Enregistrement…</span>
            ) : (
              <span className={styles.recSlide} style={{ transform: `translateX(${dragX}px)`, opacity: 1 + dragX / CANCEL_DISTANCE }}>
                <ChevronLeft size={16} /> Glisser pour annuler
              </span>
            )}
          </div>
        ) : (
          <div className={styles.inputPill}>
            <button
              type="button"
              className={`${styles.iconBtn} ${attachOpen ? styles.iconBtnActive : ""}`}
              onClick={() => setAttachOpen((v) => !v)}
              aria-label="Joindre un fichier"
            >
              <Paperclip size={21} />
            </button>
            <textarea
              ref={textRef}
              rows={1}
              value={draft}
              placeholder="Écrire un message"
              className={styles.textInput}
              onChange={(e) => {
                setDraft(e.target.value);
                if (e.target.value) onTyping();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && window.matchMedia("(pointer: fine)").matches) {
                  e.preventDefault();
                  send();
                }
              }}
              onFocus={() => setAttachOpen(false)}
            />
            {showMic && (
              <button type="button" className={styles.iconBtn} onClick={() => cameraRef.current?.click()} aria-label="Prendre une photo">
                <Camera size={21} />
              </button>
            )}
          </div>
        )}

        {locked ? (
          <button type="button" className={styles.sendBtn} onClick={finishRecording} aria-label="Envoyer la note vocale">
            <Send size={20} />
          </button>
        ) : showMic ? (
          <button
            type="button"
            className={`${styles.sendBtn} ${recording ? styles.micActive : ""}`}
            onPointerDown={onMicDown}
            onPointerMove={onMicMove}
            onPointerUp={onMicUp}
            onPointerCancel={onMicUp}
            onContextMenu={(e) => e.preventDefault()}
            aria-label="Maintenir pour enregistrer une note vocale"
            style={{ touchAction: "none" }}
          >
            <Mic size={recording ? 26 : 21} />
          </button>
        ) : (
          <button type="button" className={styles.sendBtn} onClick={send} aria-label="Envoyer">
            <Send size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
