"use client";
// src/components/realtime/tones.ts
// Sonneries générées en Web Audio (aucun fichier à charger)

let ctx: AudioContext | null = null;
function audioCtx() {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext || (window as any).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

function beep(freq: number, start: number, duration: number, volume = 0.18) {
  const c = audioCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  const t0 = c.currentTime + start;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

/** Les téléphones n'autorisent le son qu'après un premier toucher : on « réveille » l'audio à ce moment */
export function unlockAudioOnFirstTouch() {
  if (typeof window === "undefined") return;
  const unlock = () => {
    const c = audioCtx();
    if (c) {
      const buf = c.createBuffer(1, 1, 22050);
      const src = c.createBufferSource();
      src.buffer = buf;
      src.connect(c.destination);
      src.start(0);
    }
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };
  window.addEventListener("pointerdown", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });
}

/** Petit carillon de nouveau message */
export function playMessageChime() {
  beep(880, 0, 0.18, 0.12);
  beep(1318.5, 0.12, 0.28, 0.1);
}

/** Boucle de sonnerie ; renvoie une fonction d'arrêt */
function loop(pattern: () => void, everyMs: number, vibrate?: number[]) {
  pattern();
  if (vibrate && typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(vibrate);
  const id = setInterval(() => {
    pattern();
    if (vibrate && navigator.vibrate) navigator.vibrate(vibrate);
  }, everyMs);
  return () => {
    clearInterval(id);
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(0);
  };
}

/** Sonnerie d'appel entrant (mélodie + vibration) */
export function startRingtone() {
  return loop(
    () => {
      [659.3, 784, 987.8, 784, 659.3, 784, 987.8, 1174.7].forEach((f, i) => beep(f, i * 0.15, 0.14, 0.16));
    },
    2600,
    [400, 200, 400]
  );
}

/** Tonalité d'attente côté appelant */
export function startRingback() {
  return loop(() => {
    beep(440, 0, 0.9, 0.08);
    beep(480, 0, 0.9, 0.06);
  }, 3000);
}

/** Bip de fin d'appel */
export function playHangupTone() {
  beep(480, 0, 0.18, 0.12);
  beep(380, 0.22, 0.25, 0.12);
}
