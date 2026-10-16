"use client";
// Zone de saisie : texte, pièces jointes, appareil photo, position et notes vocales

import { useEffect, useRef, useState } from "react";
import { Camera, Image as ImageIcon, MapPin, Mic, Paperclip, Send, Trash2 } from "lucide-react";
import styles from "../messages.module.css";
import { formatSeconds, readAsDataUrl } from "../_lib/chat-utils";

export default function Composer({
  onSendText,
  onSendFile,
  onSendVoice,
  onOpenLocation,
  onTyping,
  onBlocked,
  blocked,
}: {
  onSendText: (text: string) => void;
  onSendFile: (file: File) => void;
  onSendVoice: (dataUrl: string, seconds: number) => void;
  onOpenLocation: () => void;
  onTyping: () => void;
  onBlocked: () => void;
  blocked: boolean;
}) {
  const [draft, setDraft] = useState("");
  const [attachOpen, setAttachOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelledRef = useRef(false);
  const secondsRef = useRef(0);

  // Hauteur automatique du champ texte
  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  }, [draft]);

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

  const startRecording = async () => {
    if (!guard()) return;
    setMicError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setMicError("L'enregistrement vocal n'est pas disponible sur ce navigateur.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      const mime = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/aac"].find(
        (t) => MediaRecorder.isTypeSupported?.(t)
      );
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 48000 } : undefined);
      chunksRef.current = [];
      cancelledRef.current = false;
      rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      rec.onstop = async () => {
        const secs = secondsRef.current;
        stopStream();
        if (cancelledRef.current || chunksRef.current.length === 0) return;
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || mime || "audio/webm" });
        onSendVoice(await readAsDataUrl(blob), secs);
      };
      recorderRef.current = rec;
      rec.start(250);
      secondsRef.current = 0;
      setSeconds(0);
      setRecording(true);
      timerRef.current = setInterval(() => {
        secondsRef.current += 1;
        setSeconds(secondsRef.current);
        // Limite de 2 minutes par note vocale
        if (secondsRef.current >= 120) finishRecording();
      }, 1000);
    } catch {
      setMicError("Autorisez l'accès au micro pour envoyer une note vocale.");
    }
  };

  const finishRecording = () => {
    setRecording(false);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  };

  const cancelRecording = () => {
    cancelledRef.current = true;
    setRecording(false);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    else stopStream();
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    setAttachOpen(false);
    if (file && guard()) onSendFile(file);
  };

  return (
    <div className={styles.composerWrap}>
      {micError && <div className={styles.composerError}>{micError}</div>}

      {attachOpen && (
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

      {recording ? (
        <div className={styles.composer}>
          <button type="button" className={styles.iconBtn} onClick={cancelRecording} aria-label="Annuler la note vocale">
            <Trash2 size={22} />
          </button>
          <div className={styles.recordingBar}>
            <span className={styles.recDot} />
            <span className={styles.recTime}>{formatSeconds(seconds)}</span>
            <span className={styles.recHint}>Enregistrement…</span>
          </div>
          <button type="button" className={styles.sendBtn} onClick={finishRecording} aria-label="Envoyer la note vocale">
            <Send size={20} />
          </button>
        </div>
      ) : (
        <div className={styles.composer}>
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
            {!draft.trim() && (
              <button type="button" className={styles.iconBtn} onClick={() => cameraRef.current?.click()} aria-label="Prendre une photo">
                <Camera size={21} />
              </button>
            )}
          </div>
          {draft.trim() ? (
            <button type="button" className={styles.sendBtn} onClick={send} aria-label="Envoyer">
              <Send size={20} />
            </button>
          ) : (
            <button type="button" className={styles.sendBtn} onClick={startRecording} aria-label="Enregistrer une note vocale">
              <Mic size={21} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
