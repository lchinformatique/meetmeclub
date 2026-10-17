// src/components/UnifiedPricingCards.tsx
// Unified, stylish pricing presentation across all pages.
// Especially makes the VIP Club card distinct, prestigious and golden with official club emblem.

import Link from "next/link";
import Image from "next/image";
import { Check, Crown, Phone, Video, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { SASPAY_LINKS } from "@/lib/subscription-constants";

export interface UnifiedPricingProps {
  currentPlan?: string;
  onSelectPlan?: (planId: string) => void;
  showTitle?: boolean;
}

export const UNIFIED_PLANS = [
  {
    id: "FREE",
    name: "Plan Gratuit",
    badge: "Essai 3 jours",
    badgeBg: "#F1F5F9",
    badgeColor: "#475569",
    price: "0",
    period: "FCFA · 3 jours",
    subtitle: "Découvrez le club et complétez votre profil",
    description: "Accès opérationnel de 3 jours. Vos photos, critères et bio sont préservés à 100% même après expiration.",
    isVip: false,
    isPopular: false,
    features: [
      { text: "Accès complet pendant 3 jours d'essai", ok: true, highlight: true },
      { text: "Profil, bio & jusqu'à 8 photos sauvegardées", ok: true },
      { text: "Messages écrits, photos & notes vocales", ok: true },
      { text: "Données 100% conservées à l'expiration", ok: true, highlight: true },
      { text: "Classement prioritaire par likes", ok: false },
      { text: "Appels audio & vidéo WhatsApp", ok: false },
    ],
    buttonText: "Commencer l'essai 7j",
    buttonHref: "/inscription",
    isExternal: false,
    borderColor: "#E2E8F0",
    bg: "#FFFFFF",
    textColor: "#0F172A",
    btnStyle: {
      background: "#F1F5F9",
      color: "#0B2559",
      border: "1.5px solid #CBD5E1",
    },
  },
  {
    id: "ESSENTIAL",
    name: "Pass Essentiel",
    badge: "Amitié & Échanges",
    badgeBg: "rgba(11, 46, 107, 0.08)",
    badgeColor: "#0B2559",
    price: "3 000",
    period: "FCFA / mois",
    subtitle: "Échanges libres & discussions actives",
    description: "Discutez sans limite avec les membres de votre catégorie : texte, notes vocales et photos sécurisées pendant 1 mois.",
    isVip: false,
    isPopular: false,
    features: [
      { text: "Abonnement actif 30 jours (1 mois)", ok: true, highlight: true },
      { text: "Visibilité & discussion avec membres 3 000 & Essai", ok: true },
      { text: "Messages écrits illimités", ok: true },
      { text: "Notes vocales audio claires et nettes", ok: true },
      { text: "Partage de photos et albums dans le chat", ok: true },
      { text: "Appels audio & vidéo WhatsApp", ok: false },
    ],
    buttonText: "Activer le Pass · 3 000 F",
    buttonHref: SASPAY_LINKS.ESSENTIAL,
    isExternal: true,
    borderColor: "#0B2559",
    bg: "#FFFFFF",
    textColor: "#0F172A",
    btnStyle: {
      background: "#0B2559",
      color: "#FFFFFF",
      border: "none",
      boxShadow: "0 4px 14px rgba(11, 37, 89, 0.25)",
    },
  },
  {
    id: "COMPLICE",
    name: "Pass Complice",
    badge: "⚡ Profil Classé en Haut",
    badgeBg: "rgba(5, 150, 105, 0.12)",
    badgeColor: "#059669",
    price: "6 000",
    period: "FCFA / mois",
    subtitle: "Visibilité renforcée & sorties réelles",
    description: "Votre profil est mis en avant en haut des suggestions selon vos likes et votre habileté, avec tables réservées.",
    isVip: false,
    isPopular: true,
    features: [
      { text: "Abonnement actif 30 jours (1 mois)", ok: true, highlight: true },
      { text: "Profil boosté & classé en haut selon likes & habileté", ok: true, highlight: true },
      { text: "Accès aux membres 6 000, 3 000 et Essai", ok: true },
      { text: "Messages, photos et notes vocales illimités", ok: true },
      { text: "Tables réservées en lieux partenaires", ok: true },
      { text: "Appels audio & vidéo WhatsApp", ok: false },
    ],
    buttonText: "Activer le Pass · 6 000 F",
    buttonHref: SASPAY_LINKS.COMPLICE,
    isExternal: true,
    borderColor: "#059669",
    bg: "#FFFFFF",
    textColor: "#0F172A",
    btnStyle: {
      background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
      color: "#FFFFFF",
      border: "none",
      boxShadow: "0 4px 14px rgba(5, 150, 105, 0.3)",
    },
  },
  {
    id: "VIP",
    name: "Club VIP Prestige",
    badge: "👑 EXPÉRIENCE ULTIME & PRESTIGE",
    badgeBg: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
    badgeColor: "#78350F",
    price: "15 000",
    period: "FCFA / mois",
    subtitle: "Appels WhatsApp, Mur Exclusif & Accès Total",
    description: "L'expérience la plus prestigieuse : appels audio/vidéo WhatsApp, mur exclusif pour publier photos/vidéos et accès à 100% des membres.",
    isVip: true,
    isPopular: false,
    features: [
      { text: "Appels Audio et Vidéo WhatsApp en direct", ok: true, highlight: true, vipSpecial: true },
      { text: "Mur VIP exclusif : publiez articles, photos & vidéos", ok: true, highlight: true, vipSpecial: true },
      { text: "Accès total à 100% de tous les membres inscrits", ok: true, highlight: true, vipSpecial: true },
      { text: "Profil positionné en priorité absolue au sommet", ok: true, highlight: true },
      { text: "Badge officiel VIP Or sur votre profil & chat", ok: true, highlight: true },
      { text: "Conciergerie privée et dîner complet mensuel", ok: true },
    ],
    buttonText: "Devenir Membre VIP 👑",
    buttonHref: SASPAY_LINKS.VIP,
    isExternal: true,
    borderColor: "#F59E0B",
    bg: "linear-gradient(155deg, #071530 0%, #0B2559 50%, #020817 100%)",
    textColor: "#FFFFFF",
    btnStyle: {
      background: "linear-gradient(135deg, #F59E0B 0%, #D97706 50%, #B45309 100%)",
      color: "#FFFFFF",
      border: "1px solid #FDE68A",
      boxShadow: "0 6px 20px rgba(217, 119, 6, 0.45)",
    },
  },
];

export default function UnifiedPricingCards({ currentPlan, showTitle = false }: UnifiedPricingProps) {
  return (
    <div style={{ width: "100%", maxWidth: "1340px", margin: "0 auto" }}>
      {showTitle && (
        <div style={{ textAlign: "center", marginBottom: "36px", paddingInline: "16px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(11, 46, 107, 0.08)",
              padding: "6px 16px",
              borderRadius: "9999px",
              marginBottom: "12px",
            }}
          >
            <Sparkles size={16} color="#0B2559" />
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#0B2559", letterSpacing: "0.5px" }}>
              NOS PLANS D&apos;ACCÈS OFFICIELS
            </span>
          </div>
          <h2
            style={{
              fontSize: "clamp(1.75rem, 5vw, 2.6rem)",
              fontWeight: 800,
              color: "#0B2559",
              lineHeight: 1.2,
              marginBottom: "10px",
            }}
          >
            Choisissez la formule qui vous correspond
          </h2>
          <p
            style={{
              fontSize: "clamp(14px, 3vw, 17px)",
              color: "#64748B",
              maxWidth: "640px",
              margin: "0 auto",
              lineHeight: 1.5,
            }}
          >
            Commencez gratuitement pendant 3 jours, puis profitez de nos formules mensuelles pour débloquer toutes les fonctionnalités.
          </p>
        </div>
      )}

      {/* Grid container with 4 cards */}
      <div className="unified-pricing-grid">
        {UNIFIED_PLANS.map((plan) => {
          const isVip = plan.isVip;
          const isCurrent = currentPlan && currentPlan.toUpperCase() === plan.id;

          return (
            <div
              key={plan.id}
              className={`unified-plan-card ${isVip ? "unified-plan-vip" : ""} ${plan.isPopular ? "unified-plan-popular" : ""}`}
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                borderRadius: "24px",
                padding: isVip ? "32px 24px" : "28px 22px",
                background: plan.bg,
                color: plan.textColor,
                border: isVip ? "2.5px solid #F59E0B" : `1.5px solid ${plan.borderColor}`,
                boxShadow: isVip
                  ? "0 18px 45px rgba(245, 158, 11, 0.28), 0 4px 16px rgba(11, 37, 89, 0.3)"
                  : plan.isPopular
                  ? "0 14px 34px rgba(5, 150, 105, 0.18)"
                  : "0 6px 20px rgba(0, 0, 0, 0.05)",
                transition: "transform 0.22s ease, box-shadow 0.22s ease",
              }}
            >
              {/* VIP Crown Floating Seal or Popular Badge */}
              {isVip && (
                <div
                  style={{
                    position: "absolute",
                    top: "-16px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                    color: "white",
                    padding: "6px 18px",
                    borderRadius: "9999px",
                    fontSize: "12px",
                    fontWeight: 900,
                    letterSpacing: "0.8px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 4px 14px rgba(217, 119, 6, 0.5)",
                    whiteSpace: "nowrap",
                    zIndex: 2,
                  }}
                >
                  <Crown size={15} />
                  <span>PRESTIGE VIP CLUB</span>
                </div>
              )}

              {/* Top Row: Badge + Logo */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "14px",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                <span
                  style={{
                    background: plan.badgeBg,
                    color: plan.badgeColor,
                    fontSize: "12px",
                    fontWeight: 800,
                    padding: "5px 12px",
                    borderRadius: "9999px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    border: isVip ? "1px solid rgba(245, 158, 11, 0.4)" : "none",
                  }}
                >
                  {plan.badge}
                </span>

                {isVip && (
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: "2px solid #F59E0B",
                      background: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                      flexShrink: 0,
                    }}
                  >
                    <Image src="/logo.png" alt="Emblème Meet Me Club" width={32} height={32} style={{ objectFit: "contain" }} />
                  </div>
                )}
              </div>

              {/* Title */}
              <h3
                style={{
                  fontSize: isVip ? "24px" : "21px",
                  fontWeight: 900,
                  color: isVip ? "#FDE68A" : "#0F172A",
                  marginBottom: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {plan.name}
              </h3>

              {/* Description */}
              <p
                style={{
                  fontSize: "13px",
                  color: isVip ? "#CBD5E1" : "#475569",
                  lineHeight: 1.5,
                  minHeight: "40px",
                  marginBottom: "16px",
                }}
              >
                {plan.description}
              </p>

              {/* Price Row */}
              <div
                style={{
                  paddingBottom: "16px",
                  marginBottom: "20px",
                  borderBottom: isVip ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid #E2E8F0",
                  display: "flex",
                  alignItems: "baseline",
                  gap: "6px",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontSize: "36px",
                    fontWeight: 900,
                    lineHeight: 1,
                    color: isVip ? "#FFFFFF" : plan.isPopular ? "#059669" : "#0B2559",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {plan.price}
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: isVip ? "#FDE68A" : "#64748B",
                  }}
                >
                  {plan.period}
                </span>
              </div>

              {/* Features List */}
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "0 0 24px 0",
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: "11px",
                }}
              >
                {plan.features.map((feat, idx) => (
                  <li
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      fontSize: "13px",
                      lineHeight: 1.45,
                      color: feat.ok
                        ? isVip
                          ? "#FFFFFF"
                          : feat.highlight
                          ? "#0F172A"
                          : "#334155"
                        : isVip
                        ? "rgba(255,255,255,0.4)"
                        : "#94A3B8",
                      fontWeight: feat.highlight ? 700 : 500,
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        flexShrink: 0,
                        marginTop: "1px",
                        background: feat.ok
                          ? isVip
                            ? "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"
                            : feat.highlight
                            ? "#059669"
                            : "#0B2559"
                          : isVip
                          ? "rgba(255,255,255,0.1)"
                          : "#E2E8F0",
                        color: feat.ok ? "white" : "#94A3B8",
                        fontSize: "11px",
                        fontWeight: 900,
                      }}
                    >
                      {feat.ok ? "✓" : "×"}
                    </span>
                    <span>{feat.text}</span>
                  </li>
                ))}
              </ul>

              {/* Action Button */}
              {plan.isExternal ? (
                <a
                  href={plan.buttonHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "14px 20px",
                    borderRadius: "14px",
                    fontWeight: 800,
                    fontSize: "14px",
                    textDecoration: "none",
                    textAlign: "center",
                    transition: "all 0.18s ease",
                    ...plan.btnStyle,
                  }}
                >
                  {isVip && <Crown size={16} />}
                  <span>{isCurrent ? "✓ Formule Actuelle" : plan.buttonText}</span>
                </a>
              ) : (
                <Link
                  href={plan.buttonHref}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "14px 20px",
                    borderRadius: "14px",
                    fontWeight: 800,
                    fontSize: "14px",
                    textDecoration: "none",
                    textAlign: "center",
                    transition: "all 0.18s ease",
                    ...plan.btnStyle,
                  }}
                >
                  <span>{isCurrent ? "✓ Formule Actuelle" : plan.buttonText}</span>
                </Link>
              )}

              {/* Payment Method Badges */}
              {plan.id === "FREE" ? (
                <div
                  style={{
                    marginTop: "12px",
                    textAlign: "center",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#64748B",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <span style={{ display: "inline-block", width: "7px", height: "7px", borderRadius: "50%", background: "#10B981" }} />
                  <span>100% Gratuit · Sans carte ni engagement</span>
                </div>
              ) : (
                <div
                  style={{
                    marginTop: "14px",
                    paddingTop: "12px",
                    borderTop: isVip ? "1px solid rgba(245, 158, 11, 0.25)" : "1px solid #E2E8F0",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 800,
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                      color: isVip ? "#FDE68A" : "#64748B",
                    }}
                  >
                    Paiements acceptés :
                  </span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexWrap: "wrap",
                      gap: "6px",
                    }}
                  >
                    {/* Mixx by Yas */}
                    <div
                      title="Mixx by Yas (T-Money)"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        background: "#FFFFFF",
                        border: "1px solid #CBD5E1",
                        borderRadius: "6px",
                        padding: "2px 6px",
                        height: "22px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/mixx-by-yas.jpg"
                        alt="Mixx by Yas"
                        style={{ height: "14px", width: "auto", objectFit: "contain", borderRadius: "2px" }}
                      />
                    </div>

                    {/* Moov Money */}
                    <div
                      title="Moov Money (Flooz)"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        background: "#FFFFFF",
                        border: "1px solid #CBD5E1",
                        borderRadius: "6px",
                        padding: "2px 6px",
                        height: "22px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/moov-money.png"
                        alt="Moov Money"
                        style={{ height: "14px", width: "auto", objectFit: "contain", borderRadius: "2px" }}
                      />
                    </div>

                    {/* Crypto USDT / BTC */}
                    <div
                      title="Crypto USDT / BTC"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "3px",
                        background: isVip ? "rgba(245, 158, 11, 0.2)" : "#FEF3C7",
                        border: isVip ? "1px solid #F59E0B" : "1px solid #FDE68A",
                        color: isVip ? "#FDE68A" : "#92400E",
                        borderRadius: "6px",
                        padding: "2px 6px",
                        height: "22px",
                        fontSize: "10px",
                        fontWeight: 800,
                      }}
                    >
                      <span style={{ fontSize: "11px" }}>₿</span>
                      <span>USDT/Crypto</span>
                    </div>

                    {/* Carte */}
                    <div
                      title="Carte Bancaire Visa / Mastercard"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "3px",
                        background: isVip ? "rgba(255, 255, 255, 0.15)" : "#F1F5F9",
                        border: isVip ? "1px solid rgba(255, 255, 255, 0.3)" : "1px solid #CBD5E1",
                        color: isVip ? "#FFFFFF" : "#334155",
                        borderRadius: "6px",
                        padding: "2px 6px",
                        height: "22px",
                        fontSize: "10px",
                        fontWeight: 700,
                      }}
                    >
                      <span>💳 Carte</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        .unified-pricing-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          align-items: stretch;
        }

        @media (max-width: 1100px) {
          .unified-pricing-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 18px;
          }
        }

        @media (max-width: 640px) {
          .unified-pricing-grid {
            grid-template-columns: 1fr;
            gap: 22px;
          }
        }

        .unified-plan-card:hover {
          transform: translateY(-4px);
        }

        .unified-plan-vip {
          position: relative;
        }
      `}</style>
    </div>
  );
}
