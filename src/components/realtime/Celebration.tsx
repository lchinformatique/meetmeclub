"use client";
// src/components/realtime/Celebration.tsx
// Animation de bienvenue plein écran quand un pass est activé (confettis, couronne, avantages).

import { useEffect, useMemo } from "react";
import { Crown, Sparkles, Zap, Check } from "lucide-react";

const PLANS: Record<string, { name: string; color: string; icon: typeof Crown; perks: string[] }> = {
  ESSENTIAL: {
    name: "Pass Essentiel",
    color: "#059669",
    icon: Zap,
    perks: ["Discussions illimitées avec tous les membres", "Voir qui a aimé votre profil", "Badge membre certifié"],
  },
  COMPLICE: {
    name: "Pass Complice",
    color: "#2563EB",
    icon: Sparkles,
    perks: ["Tout le Pass Essentiel", "Profil mis en avant en haut des listes", "Réservations de tables & consommation offerte"],
  },
  VIP: {
    name: "Pass VIP",
    color: "#D97706",
    icon: Crown,
    perks: ["Appels audio & vidéo en direct", "Accès à tous les membres et au Mur VIP", "Profil classé en tête · conciergerie"],
  },
};

function fanfare() {
  try {
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "triangle";
      o.frequency.value = f;
      const t = ctx.currentTime + i * 0.13;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (i === 3 ? 0.7 : 0.25));
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.8);
    });
  } catch {}
}

export default function Celebration({ plan, onClose }: { plan: string; onClose: () => void }) {
  const info = PLANS[plan] || PLANS.ESSENTIAL;
  const Icon = info.icon;
  const confetti = useMemo(
    () =>
      Array.from({ length: 70 }).map((_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 1.2,
        duration: 2.4 + Math.random() * 1.8,
        size: 6 + Math.random() * 8,
        color: ["#E10600", "#0B2559", "#F59E0B", "#10B981", "#3B82F6", "#ffffff"][i % 6],
        rotate: Math.random() * 360,
      })),
    []
  );

  useEffect(() => {
    fanfare();
    navigator.vibrate?.([80, 60, 80, 60, 200]);
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${info.name} activé`}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 7000,
        background: "radial-gradient(120% 90% at 50% 0%, #163B8A 0%, #0B2559 50%, #050F26 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes mmc-confetti { 0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; } 100% { transform: translateY(110vh) rotate(720deg); opacity: 0.9; } }
        @keyframes mmc-pop { 0% { transform: scale(0.6); opacity: 0; } 60% { transform: scale(1.06); opacity: 1; } 100% { transform: scale(1); } }
        @keyframes mmc-glow { 0%,100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.35); } 50% { box-shadow: 0 0 0 18px rgba(255,255,255,0); } }
      `}</style>

      {confetti.map((c, i) => (
        <span
          key={i}
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: `${c.left}%`,
            width: c.size,
            height: c.size * 0.45,
            background: c.color,
            borderRadius: 2,
            transform: `rotate(${c.rotate}deg)`,
            animation: `mmc-confetti ${c.duration}s ${c.delay}s ease-in infinite`,
          }}
        />
      ))}

      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 400,
          background: "#fff",
          borderRadius: 28,
          padding: "30px 22px 22px",
          textAlign: "center",
          boxShadow: "0 30px 80px rgba(0,0,0,0.4)",
          animation: "mmc-pop 0.55s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div
          style={{
            width: 86,
            height: 86,
            margin: "-72px auto 14px",
            borderRadius: "50%",
            background: info.color,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "5px solid #fff",
            animation: "mmc-glow 1.6s ease-in-out infinite",
          }}
        >
          <Icon size={40} />
        </div>
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1, color: info.color, textTransform: "uppercase" }}>
          Paiement confirmé
        </div>
        <h2 style={{ margin: "6px 0 4px", fontSize: 24, color: "#0B2559" }}>Félicitations ! 🎉</h2>
        <p style={{ margin: "0 0 16px", fontSize: 15, color: "#3B4658", lineHeight: 1.5 }}>
          Votre <strong style={{ color: info.color }}>{info.name}</strong> est activé. Bienvenue dans votre nouveau niveau du club !
        </p>
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", textAlign: "left", display: "flex", flexDirection: "column", gap: 8 }}>
          {info.perks.map((p) => (
            <li key={p} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#0F172A" }}>
              <span style={{ width: 22, height: 22, borderRadius: "50%", background: `${info.color}1A`, color: info.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Check size={14} />
              </span>
              {p}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onClose}
          style={{
            width: "100%",
            height: 52,
            border: "none",
            borderRadius: 14,
            background: "linear-gradient(135deg, #E10600 0%, #B30500 100%)",
            color: "#fff",
            fontWeight: 800,
            fontSize: 16,
            cursor: "pointer",
            boxShadow: "0 10px 24px rgba(225,6,0,0.35)",
          }}
        >
          Découvrir mes avantages
        </button>
      </div>
    </div>
  );
}
