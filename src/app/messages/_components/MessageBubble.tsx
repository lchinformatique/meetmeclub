"use client";
// Bulle de message : texte, photo, vidéo, note vocale, position, journal d'appel

import { useEffect, useRef, useState } from "react";
import { Check, CheckCheck, Clock, MapPin, Pause, Phone, PhoneMissed, Play, Video, AlertCircle } from "lucide-react";
import styles from "../messages.module.css";
import { formatBubbleTime, formatSeconds, type ChatMessage } from "../_lib/chat-utils";

function Ticks({ status, partnerOnline }: { status: ChatMessage["status"]; partnerOnline: boolean }) {
  if (status === "PENDING") return <Clock size={13} className={styles.tickPending} />;
  if (status === "FAILED") return <AlertCircle size={14} className={styles.tickFailed} />;
  if (status === "READ") return <CheckCheck size={15} className={styles.tickRead} />;
  if (status === "DELIVERED" || partnerOnline) return <CheckCheck size={15} className={styles.tickSent} />;
  return <Check size={15} className={styles.tickSent} />;
}

function VoiceNote({ url, mine }: { url?: string; mine: boolean }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!url) return;
    const a = new Audio(url);
    a.preload = "metadata";
    audioRef.current = a;
    const onMeta = () => {
      if (isFinite(a.duration)) setDuration(a.duration);
    };
    const onTime = () => a.duration && setProgress(a.currentTime / a.duration);
    const onEnd = () => {
      setPlaying(false);
      setProgress(0);
    };
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnd);
    return () => {
      a.pause();
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("ended", onEnd);
    };
  }, [url]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
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
      <span className={styles.voiceTime}>{formatSeconds(playing ? progress * duration : duration)}</span>
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
            <img src={msg.imageUrl} alt="Photo partagée" className={styles.bubbleImage} loading="lazy" />
          </button>
        )}
        {msg.videoUrl && <video src={msg.videoUrl} controls playsInline className={styles.bubbleImage} />}
        {(msg.audioUrl || msg.body.startsWith("🎙️")) && <VoiceNote url={msg.audioUrl} mine={mine} />}
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
