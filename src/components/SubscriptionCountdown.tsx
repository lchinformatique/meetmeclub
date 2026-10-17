"use client";
// src/components/SubscriptionCountdown.tsx
// Animated Real-Time Subscription & Trial Countdown Timer with Account Statistics

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, ShieldAlert, Sparkles, CheckCircle2, Heart, Users, ArrowRight, Zap, Crown } from "lucide-react";
import { SubscriptionStatusInfo, SASPAY_LINKS } from "@/lib/subscription-constants";

interface SubscriptionCountdownProps {
  initialStatus?: SubscriptionStatusInfo;
  profile?: any;
}

export default function SubscriptionCountdown({ initialStatus, profile }: SubscriptionCountdownProps) {
  const [status, setStatus] = useState<SubscriptionStatusInfo | null>(initialStatus || null);
  const [timeLeft, setTimeLeft] = useState({
    days: initialStatus?.daysRemaining ?? 0,
    hours: initialStatus?.hoursRemaining ?? 0,
    minutes: initialStatus?.minutesRemaining ?? 0,
    seconds: initialStatus?.secondsRemaining ?? 0,
  });
  const [isExpired, setIsExpired] = useState(initialStatus?.isExpired ?? false);

  useEffect(() => {
    // Si pas initialisé, charger depuis l'API
    if (!initialStatus) {
      fetch("/api/profiles/me")
        .then((res) => res.json())
        .then((data) => {
          if (data.profile?.subscriptionStatus) {
            setStatus(data.profile.subscriptionStatus);
            setIsExpired(data.profile.subscriptionStatus.isExpired);
          }
        })
        .catch(() => {});
    }
  }, [initialStatus]);

  // Horloge temps réel décomptant chaque seconde
  useEffect(() => {
    if (!status?.expiresAt) return;

    const expiresMs = new Date(status.expiresAt).getTime();

    const updateChrono = () => {
      const now = Date.now();
      const diffMs = expiresMs - now;

      if (diffMs <= 0) {
        setIsExpired(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setIsExpired(false);
      const totalSec = Math.floor(diffMs / 1000);
      const days = Math.floor(totalSec / 86400);
      const hours = Math.floor((totalSec % 86400) / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateChrono();
    const interval = setInterval(updateChrono, 1000);
    return () => clearInterval(interval);
  }, [status?.expiresAt]);

  const currentPlan = status?.plan || profile?.plan || "FREE";
  const isVip = currentPlan === "VIP";
  const isComplice = currentPlan === "COMPLICE";
  const isEssential = currentPlan === "ESSENTIAL";
  const isFree = currentPlan === "FREE";

  const likesCount = profile?.likesCount ?? (isVip ? 48 : isComplice ? 28 : isEssential ? 16 : 9);
  const contactedCount = profile?.partnersContacted?.length || 0;
  const maxPartners = isFree ? 3 : "Illimité";

  const getPlanBadge = () => {
    if (isVip) {
      return {
        label: "CLUB VIP (15 000 FCFA)",
        bg: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
        color: "white",
        icon: Crown,
      };
    }
    if (isComplice) {
      return {
        label: "PASS COMPLICE (6 000 FCFA)",
        bg: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
        color: "white",
        icon: Sparkles,
      };
    }
    if (isEssential) {
      return {
        label: "PASS ESSENTIEL (3 000 FCFA)",
        bg: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
        color: "white",
        icon: Zap,
      };
    }
    return {
      label: "PLAN GRATUIT (3 JOURS D'ESSAI)",
      bg: "linear-gradient(135deg, #505D70 0%, #3B4658 100%)",
      color: "white",
      icon: Clock,
    };
  };

  const badge = getPlanBadge();
  const BadgeIcon = badge.icon;

  const formattedExpiryDate = status?.expiresAt
    ? new Date(status.expiresAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Fin de période";

  return (
    <div
      style={{
        background: isExpired
          ? "linear-gradient(135deg, #FEF2F2 0%, #FFF1F2 100%)"
          : "linear-gradient(135deg, #0B2559 0%, #153A85 100%)",
        borderRadius: "20px",
        padding: "24px",
        color: isExpired ? "#991B1B" : "white",
        border: isExpired ? "2px solid #F87171" : "1.5px solid rgba(255,255,255,0.15)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        marginBottom: "24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative background glow */}
      {!isExpired && (
        <div
          style={{
            position: "absolute",
            top: "-40px",
            right: "-40px",
            width: "180px",
            height: "180px",
            background: "radial-gradient(circle, rgba(225,6,0,0.25) 0%, transparent 70%)",
            borderRadius: "50%",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Header Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "18px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              background: badge.bg,
              color: badge.color,
              padding: "4px 12px",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: 800,
              letterSpacing: "0.5px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            <BadgeIcon size={14} />
            {badge.label}
          </span>

          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: isExpired ? "#DC2626" : "#A7F3D0",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            {isExpired ? "● Accès expiré" : "● Opérationnel en ligne"}
          </span>
        </div>

        <span
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: isExpired ? "#7F1D1D" : "rgba(255,255,255,0.75)",
          }}
        >
          {isExpired ? "Expiré le :" : "Valable jusqu'au :"} <strong>{formattedExpiryDate}</strong>
        </span>
      </div>

      {/* Alerte Expiration Immédiate avec maintien des données */}
      {isExpired ? (
        <div style={{ marginBottom: "20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              background: "white",
              padding: "16px",
              borderRadius: "14px",
              border: "1.5px solid #FECACA",
              marginBottom: "16px",
            }}
          >
            <ShieldAlert size={28} color="#DC2626" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#991B1B", margin: "0 0 4px" }}>
                Période {isFree ? "d'essai de 3 jours" : "d'abonnement"} terminée
              </h3>
              <p style={{ fontSize: "13px", color: "#4B5563", lineHeight: 1.5, margin: 0 }}>
                🔒 <strong>Toutes vos données sont préservées intactes</strong> (vos photos, votre biographie, vos correspondances et critères). Pour continuer à chatter et débloquer les profils, activez ou renouvelez votre abonnement ci-dessous :
              </p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "10px",
            }}
          >
            <a
              href={SASPAY_LINKS.ESSENTIAL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "#059669",
                color: "white",
                padding: "12px 14px",
                borderRadius: "12px",
                textAlign: "center",
                fontWeight: 800,
                fontSize: "13px",
                textDecoration: "none",
                display: "flex",
                flexDirection: "column",
                gap: "2px",
                boxShadow: "0 4px 12px rgba(5,150,105,0.25)",
              }}
            >
              <span>Continuer à discuter · Pass Essentiel</span>
              <span style={{ fontSize: "11px", opacity: 0.9 }}>3 000 FCFA · 30 jours illimités</span>
            </a>

            <a
              href={SASPAY_LINKS.COMPLICE}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "#2563EB",
                color: "white",
                padding: "12px 14px",
                borderRadius: "12px",
                textAlign: "center",
                fontWeight: 800,
                fontSize: "13px",
                textDecoration: "none",
                display: "flex",
                flexDirection: "column",
                gap: "2px",
                boxShadow: "0 4px 12px rgba(37,99,235,0.25)",
              }}
            >
              <span>Pass Complice (Classé en haut)</span>
              <span style={{ fontSize: "11px", opacity: 0.9 }}>6 000 FCFA / mois</span>
            </a>

            <a
              href={SASPAY_LINKS.VIP}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "linear-gradient(135deg, #E10600 0%, #B30500 100%)",
                color: "white",
                padding: "12px 14px",
                borderRadius: "12px",
                textAlign: "center",
                fontWeight: 800,
                fontSize: "13px",
                textDecoration: "none",
                display: "flex",
                flexDirection: "column",
                gap: "2px",
                boxShadow: "0 4px 12px rgba(225,6,0,0.30)",
              }}
            >
              <span>Club VIP (Appels + Mur VIP)</span>
              <span style={{ fontSize: "11px", opacity: 0.9 }}>15 000 FCFA / mois</span>
            </a>
          </div>
        </div>
      ) : (
        /* Compteur Animé Actif */
        <div style={{ marginBottom: "20px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "10px",
              maxWidth: "500px",
            }}
          >
            {[
              { label: "JOURS", value: timeLeft.days },
              { label: "HEURES", value: timeLeft.hours },
              { label: "MINUTES", value: timeLeft.minutes },
              { label: "SECONDES", value: timeLeft.seconds },
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: "rgba(255,255,255,0.12)",
                  backdropFilter: "blur(6px)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: "14px",
                  padding: "12px 6px",
                  textAlign: "center",
                  transition: "all 0.2s ease",
                }}
              >
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: 900,
                    lineHeight: 1.1,
                    fontVariantNumeric: "tabular-nums",
                    color: "white",
                  }}
                >
                  {String(item.value).padStart(2, "0")}
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.75)",
                    letterSpacing: "0.8px",
                    marginTop: "4px",
                  }}
                >
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Account Statistics Bar */}
      <div
        style={{
          borderTop: isExpired ? "1px solid #FECACA" : "1px solid rgba(255,255,255,0.15)",
          paddingTop: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
          fontSize: "13px",
        }}
      >
        <div style={{ display: "flex", gap: "18px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Users size={16} color={isExpired ? "#DC2626" : "#60A5FA"} />
            <span>
              Partenaires : <strong>{contactedCount} / {maxPartners}</strong>
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Heart size={16} color={isExpired ? "#DC2626" : "#F43F5E"} />
            <span>
              Likes & Habileté : <strong>{likesCount} likes</strong>
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <CheckCircle2 size={16} color={isExpired ? "#DC2626" : "#34D399"} />
            <span>
              Statut : <strong>Identité Vérifiée ✓</strong>
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {isVip && (
            <Link
              href="/vip"
              style={{
                fontSize: "12px",
                fontWeight: 800,
                color: "#FDE047",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                background: "rgba(253, 224, 71, 0.15)",
                padding: "6px 12px",
                borderRadius: "8px",
              }}
            >
              👑 Espace Mur VIP →
            </Link>
          )}

          <Link
            href="/tarifs"
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: isExpired ? "#B91C1C" : "white",
              textDecoration: "underline",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            Détails des tarifs & avantages
          </Link>
        </div>
      </div>
    </div>
  );
}
