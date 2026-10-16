"use client";
// Bulle de message : texte, photo, vidéo, note vocale, position, journal d'appel

import { useEffect, useRef, useState } from "react";
import { Check, CheckCheck, Clock, MapPin, Pause, Phone, PhoneMissed, Play, Video, AlertCircle } from "lucide-react";
import styles from "../messages.module.css";
import { formatBubbleTime, formatSeconds, type ChatMessage } from "../_lib/chat-utils";
import { Watermark } from "./Modals";

function Ticks({ status, partnerOnline }: { status: ChatMessage["status"]; partnerOnline: boolean }) {
  if (status === "PENDING") return <Clock size={13} className={styles.tickPending} />;
  if (status === "FAILED") return <AlertCircle size={14} className={styles.tickFailed} />;
  if (status === "READ") return <CheckCheck size={15} className={styles.tickRead} />;
  if (status === "DELIVERED" || partnerOnline) return <CheckCheck size={15} className={styles.tickSent} />;
  return <Check size={15} className={styles.tickSent} />;
}

// Une seule note vocale lue à la fois, comme WhatsApp
let currentVoice: HTMLAudioElement | null = null;

function VoiceNote({ url, mine, body }: { url?: string; mine: boolean; body: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(false);
  // Durée connue dès l'affichage (« 🎙️ Note vocale (0:12) ») : aucun décodage nécessaire
  const announced = (() => {
    const m = body.match(/\((\d+):(\d{2})\)/);
    return m ? Number(m[1]) * 60 + Number(m[2]) : 0;
  })();
  const [duration, setDuration] = useState(announced);

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      audioRef.current?.pause();
    },
    []
  );

  // Progression fluide (60 images/s) pendant la lecture
  const tick = () => {
    const a = audioRef.current;
    if (!a) return;
    const d = isFinite(a.duration) && a.duration > 0 ? a.duration : duration || 1;
    setProgress(Math.min(1, a.currentTime / d));
    if (!a.paused) rafRef.current = requestAnimationFrame(tick);
  };

  const toggle = () => {
    if (!url) return;
    // Lecteur créé au premier appui seulement : la conversation reste fluide même avec beaucoup de notes
    let a = audioRef.current;
    if (!a) {
      a = new Audio(url);
      a.preload = "auto";
      a.addEventListener("loadedmetadata", () => {
        if (isFinite(a!.duration) && a!.duration > 0) setDuration(a!.duration);
      });
      a.addEventListener("ended", () => {
        setPlaying(false);
        setProgress(0);
      });
      a.addEventListener("pause", () => setPlaying(false));
      a.addEventListener("error", () => {
        setError(true);
        setPlaying(false);
      });
      audioRef.current = a;
    }
    if (playing) {
      a.pause();
      return;
    }
    if (currentVoice && currentVoice !== a) currentVoice.pause();
    currentVoice = a;
    a.play()
      .then(() => {
        setPlaying(true);
        rafRef.current = requestAnimationFrame(tick);
      })
      .catch(() => setPlaying(false));
  };

  const bars = [6, 12, 18, 10, 22, 14, 8, 16, 20, 12, 6, 14, 18, 10, 16, 8, 12, 20, 14, 8, 10, 16];

  return (
    <div className={`${styles.voice} ${mine ? styles.voiceMine : ""}`}>
      <button type="button" className={styles.voiceBtn} onClick={toggle} disabled={!url} aria-label={playing ? "Pause" : "Écouter"}>
        {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
      </button>
      <div className={styles.voiceWave} aria-hidden>
        {bars.map((h, i) => (
          <span key={i} style={{ height: h, opacity: i / bars.length <= progress ? 1 : 0.4 }} />
        ))}
      </div>
      <span className={styles.voiceTime}>
        {error ? "Lecture impossible" : formatSeconds(playing ? progress * duration : duration)}
      </span>
    </div>
  );
}

export default function MessageBubble({
  msg,
  mine,
  partnerOnline,
  onOpenImage,
  onRetry,
}: {
  msg: ChatMessage;
  mine: boolean;
  partnerOnline: boolean;
  onOpenImage: (url: string) => void;
  onRetry?: () => void;
}) {
  const time = formatBubbleTime(msg.createdAt);

  if (msg.callLog) {
    const Icon = msg.callLog.missed ? PhoneMissed : msg.callLog.kind === "video" ? Video : Phone;
    return (
      <div className={`${styles.row} ${mine ? styles.rowMine : ""}`}>
        <div className={`${styles.callLog} ${msg.callLog.missed ? styles.callLogMissed : ""}`}>
          <span className={styles.callLogIcon}>
            <Icon size={16} />
          </span>
          <span>
            <strong>{msg.callLog.label.split("·")[0].trim()}</strong>
            <small>
              {msg.callLog.label.includes("·") ? msg.callLog.label.split("·")[1].trim() + " · " : ""}
              {time}
            </small>
          </span>
        </div>
      </div>
    );
  }

  const isOnlyMedia = Boolean(msg.imageUrl || msg.videoUrl) && /^(📷|🎥)/.test(msg.body);
  const showText = !msg.audioUrl && !msg.body.startsWith("🎙️") && !msg.location && !isOnlyMedia;

  return (
    <div className={`${styles.row} ${mine ? styles.rowMine : ""}`}>
      <div className={`${styles.bubble} ${mine ? styles.bubbleMine : styles.bubbleTheirs} ${msg.imageUrl || msg.videoUrl ? styles.bubbleMedia : ""}`}>
        {msg.imageUrl && (
          <button type="button" className={styles.bubbleImageBtn} onClick={() => onOpenImage(msg.imageUrl!)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={msg.imageUrl} alt="Photo partagée" className={styles.bubbleImage} loading="lazy" draggable={false} />
            {!mine && <Watermark />}
          </button>
        )}
        {msg.videoUrl && <video src={msg.videoUrl} controls playsInline className={styles.bubbleImage} />}
        {(msg.audioUrl || msg.body.startsWith("🎙️")) && <VoiceNote url={msg.audioUrl} mine={mine} body={msg.body} />}
        {msg.location && (
          <a href={msg.location.mapsUrl} target="_blank" rel="noopener noreferrer" className={styles.locationCard}>
            <span className={styles.locationMap}>
              <MapPin size={26} />
            </span>
            <span className={styles.locationText}>
              <strong>Position partagée</strong>
              <span>{msg.location.label}</span>
              <em>Ouvrir dans Google Maps</em>
            </span>
          </a>
        )}
        {showText && <span className={styles.bubbleText}>{msg.body}</span>}
        <span className={styles.meta}>
          {time}
          {mine && <Ticks status={msg.status} partnerOnline={partnerOnline} />}
        </span>
        {msg.status === "FAILED" && onRetry && (
          <button type="button" className={styles.retryBtn} onClick={onRetry}>
            Échec de l&apos;envoi · Réessayer
          </button>
        )}
      </div>
    </div>
  );
}
