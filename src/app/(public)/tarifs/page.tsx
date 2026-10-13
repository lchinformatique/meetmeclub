// src/app/(public)/tarifs/page.tsx
// Redesigned Tarifs & Abonnements — Clear contrast, fair limits & friendly connections

import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tarifs & Abonnements | Meet Me Club Togo",
  description: "Plan Gratuit (3 partenaires) ou Pass Essentiel illimité pour discuter, échanger et faire des rencontres authentiques à Lomé.",
};

const PLANS = [
  {
    id: "FREE",
    name: "Plan Gratuit",
    badge: "Essai 7 jours",
    price: "0",
    period: "valable 7 jours",
    subtitle: "Rejoignez le club et faites vos premiers pas",
    description: "Profil complet, visibilité officielle et 3 partenaires pendant 7 jours d'essai. Achat de packs de rencontre autorisé.",
    features: [
      { text: "Accès opérationnel complet pendant 7 jours", ok: true, highlight: true },
      { text: "Création et enregistrement complet du profil", ok: true },
      { text: "Visibilité officielle dans l'espace Découverte", ok: true },
      { text: "Échanger avec jusqu'à 3 partenaires", ok: true },
      { text: "Messages écrits, photos & vocaux inclus", ok: true },
      { text: "Achat de packs rendez-vous réels autorisé", ok: true, highlight: true },
      { text: "Appels vidéo en direct", ok: false },
    ],
    buttonText: "Essai gratuit 7 jours",
    buttonHref: "/inscription",
    paymentUrl: null,
    highlight: false,
    borderColor: "#E2E8F0",
    badgeColor: "#475569",
    btnClass: "btn-outline-blue",
  },
  {
    id: "ESSENTIAL",
    name: "Pass Essentiel",
    badge: "Populaire · Amitié & Échange",
    price: "3 000",
    period: "FCFA / mois",
    subtitle: "Liberté totale de discussion & d'amitié",
    description: "Discutez sans compter, échangez des passions ou créez des amitiés solides sans aucune contrainte de rendez-vous obligatoire.",
    features: [
      { text: "Tous les avantages du Plan Gratuit", ok: true },
      { text: "Partenaires & discussions 100% ILLIMITÉS", ok: true, highlight: true },
      { text: "Messages, photos et notes vocales illimités", ok: true },
      { text: "Pas d'obligation de rendez-vous : échange libre", ok: true },
      { text: "Voir qui a visité et qui a liké votre profil", ok: true },
      { text: "Badge membre vérifié", ok: true },
      { text: "Appels vidéo en direct", ok: false },
    ],
    buttonText: "Activer le Pass · 3 000 F",
    buttonHref: "https://link.saspay.me/dtpycov9i-k",
    paymentUrl: "https://link.saspay.me/dtpycov9i-k",
    highlight: true,
    borderColor: "var(--color-blue)",
    badgeColor: "var(--color-blue)",
    btnClass: "btn-primary",
  },
  {
    id: "COMPLICE",
    name: "Pass Complice",
    badge: "Sorties & Rendez-vous",
    price: "6 000",
    period: "FCFA / mois",
    subtitle: "Pour passer du virtuel au réel en toute sécurité",
    description: "Échanges illimités + tables réservées et consommations offertes dans nos cafés et restaurants partenaires à Lomé.",
    features: [
      { text: "Tout le Pass Essentiel en illimité", ok: true },
      { text: "Messages, photos et notes vocales illimités", ok: true },
      { text: "Réservations de tables en lieux partenaires sécurisés", ok: true, highlight: true },
      { text: "1 consommation offerte par personne au rendez-vous", ok: true },
      { text: "QR code de validation instantanée au comptoir", ok: true },
      { text: "Rappels automatiques 24h et 2h avant la sortie", ok: true },
      { text: "Appels vidéo en direct", ok: false },
    ],
    buttonText: "Activer le Pass · 6 000 F",
    buttonHref: "https://link.saspay.me/xiigac37eyq",
    paymentUrl: "https://link.saspay.me/xiigac37eyq",
    highlight: false,
    borderColor: "#CBD5E1",
    badgeColor: "#059669",
    btnClass: "btn-outline-blue",
  },
  {
    id: "VIP",
    name: "Pass VIP Club",
    badge: "Prestige & Exclusivité",
    price: "15 000",
    period: "FCFA / mois",
    subtitle: "L'expérience la plus prestigieuse de Lomé",
    description: "Salons privés, appels vidéo en direct, dîners gastronomiques complets et conciergerie privée pour des rencontres d'exception à Lomé.",
    features: [
      { text: "Tout le Pass Complice en illimité", ok: true },
      { text: "Appels vidéo en direct débloqués (Exclusif VIP)", ok: true, highlight: true },
      { text: "Salons VIP et rooftops partenaires réservés", ok: true },
      { text: "Dîner gastronomique complet offert par mois", ok: true, highlight: true },
      { text: "Badge officiel VIP Or sur votre profil", ok: true },
      { text: "Visibilité prioritaire en haut de la Découverte", ok: true },
      { text: "Conciergerie privée Meet Me Club dédiée", ok: true },
    ],
    buttonText: "Devenir Membre VIP · 15 000 F",
    buttonHref: "https://link.saspay.me/ksev91xlvik",
    paymentUrl: "https://link.saspay.me/ksev91xlvik",
    highlight: false,
    borderColor: "#E2E8F0",
    badgeColor: "#B45309",
    btnClass: "btn-outline-blue",
  },
];

export default function TarifsPage() {
  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      {/* Hero Header */}
      <section
        style={{
          background: "linear-gradient(135deg, #0B2E6B 0%, #061838 100%)",
          padding: "70px 20px 90px",
          textAlign: "center",
          position: "relative",
          color: "white",
        }}
      >
        <div className="container" style={{ maxWidth: "800px" }}>
          {/* Official Emblem Logo Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              background: "rgba(255, 255, 255, 0.12)",
              backdropFilter: "blur(10px)",
              padding: "6px 16px 6px 6px",
              borderRadius: "9999px",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                overflow: "hidden",
                border: "2px solid #E10600",
                background: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Image src="/logo.png" alt="Logo Meet Me Club" width={32} height={32} style={{ objectFit: "contain" }} priority />
            </div>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "white", letterSpacing: "0.5px" }}>
              MEET <span style={{ color: "#E10600" }}>ME</span> CLUB · FORMULES & ABONNEMENTS
            </span>
          </div>

          <h1
            style={{
              color: "white",
              fontSize: "clamp(2.1rem, 5vw, 3.2rem)",
              fontWeight: 800,
              lineHeight: 1.15,
              marginBottom: "18px",
            }}
          >
            Des formules adaptées à vos envies
          </h1>
          <p
            style={{
              color: "#E2E8F0",
              fontSize: "clamp(16px, 2.5vw, 19px)",
              lineHeight: 1.6,
              maxWidth: "680px",
              margin: "0 auto",
            }}
          >
            Discutez, faites-vous des amis ou organisez des rencontres réelles à Lomé.
            Commencez gratuitement avec <strong style={{ color: "white" }}>3 partenaires</strong>, puis passez à l'illimité quand vous le souhaitez.
          </p>
        </div>
      </section>

      {/* Main Pricing Cards Grid — 4 Columns perfectly aligned */}
      <section style={{ maxWidth: "1340px", margin: "-50px auto 60px", paddingInline: "20px", position: "relative", zIndex: 10 }}>
        <div className="pricing-grid-container">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className="pricing-card"
              style={{
                border: plan.highlight ? "2.5px solid #0B2559" : `1px solid ${plan.borderColor}`,
                boxShadow: plan.highlight
                  ? "0 14px 36px -4px rgba(11, 46, 107, 0.22)"
                  : "0 4px 16px rgba(0, 0, 0, 0.04)",
                padding: "28px 22px",
              }}
            >
              {/* Badge Row (Flexible) */}
              <div style={{ minHeight: "30px", display: "flex", alignItems: "center", marginBottom: "12px", flexWrap: "wrap" }}>
                <span
                  style={{
                    display: "inline-block",
                    background: plan.highlight ? "rgba(11, 46, 107, 0.08)" : "#F1F5F9",
                    color: plan.badgeColor,
                    fontSize: "12px",
                    fontWeight: 700,
                    padding: "4px 12px",
                    borderRadius: "9999px",
                    maxWidth: "100%",
                    wordBreak: "break-word",
                  }}
                >
                  {plan.badge}
                </span>
              </div>

              {/* Title (Flexible) */}
              <div style={{ minHeight: "32px", display: "flex", alignItems: "center", marginBottom: "6px" }}>
                <h2 style={{ fontSize: "21px", fontWeight: 800, color: "#0F172A", margin: 0, wordBreak: "break-word" }}>
                  {plan.name}
                </h2>
              </div>

              {/* Description (minHeight to avoid text overflow/hiding) */}
              <div style={{ minHeight: "56px", display: "flex", alignItems: "flex-start", marginBottom: "16px" }}>
                <p style={{ fontSize: "13px", color: "#475569", margin: 0, lineHeight: 1.5, wordBreak: "break-word" }}>
                  {plan.description}
                </p>
              </div>

              {/* Price (Flexible & Aligned Separator) */}
              <div style={{ minHeight: "56px", marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: "6px" }}>
                <span style={{ fontSize: "34px", fontWeight: 900, color: plan.highlight ? "#0B2559" : "#0F172A", lineHeight: 1 }}>
                  {plan.price}
                </span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#64748B" }}>
                  {plan.period}
                </span>
              </div>

              {/* Features List (Equalized 7 features, flex: 1) */}
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px 0", flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
                {plan.features.map((feat, idx) => (
                  <li
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      fontSize: "13px",
                      lineHeight: 1.4,
                      color: feat.ok ? (feat.highlight ? "#0F172A" : "#334155") : "#94A3B8",
                      fontWeight: feat.highlight ? 700 : 500,
                      minHeight: "36px",
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
                        background: feat.ok ? (feat.highlight ? "#E10600" : "#059669") : "#F1F5F9",
                        color: feat.ok ? "white" : "#94A3B8",
                        fontSize: "11px",
                        fontWeight: 800,
                      }}
                    >
                      {feat.ok ? "✓" : "✕"}
                    </span>
                    <span>{feat.text}</span>
                  </li>
                ))}
              </ul>

              {/* Call to action & Payment Info (Pinned to bottom) */}
              {plan.paymentUrl ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", marginTop: "auto", gap: "10px" }}>
                  {/* CTA Button — clean centered text, no emoji clutter */}
                  <a
                    href={plan.paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`btn btn-pay-effect ${
                      plan.id === "ESSENTIAL"
                        ? "btn-pay-popular"
                        : plan.id === "COMPLICE"
                        ? "btn-pay-complice"
                        : "btn-pay-vip"
                    }`}
                    style={{
                      width: "100%",
                      minHeight: "48px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "8px 10px",
                      fontSize: "13px",
                      fontWeight: 800,
                      borderRadius: "12px",
                      textDecoration: "none",
                      letterSpacing: "0.2px",
                      textAlign: "center",
                    }}
                  >
                    {plan.buttonText}
                  </a>

                  {/* Minimal payment method line — tiny icons, no repetition */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    width: "100%",
                    padding: "7px 12px",
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "9999px",
                    boxSizing: "border-box",
                  }}>
                    <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 600, whiteSpace: "nowrap" }}>Paiement via</span>
                    <Image
                      src="/mixx-by-yas.jpg"
                      alt="Mixx by yas"
                      width={24}
                      height={16}
                      style={{ objectFit: "contain", borderRadius: "3px", flexShrink: 0 }}
                    />
                    <span style={{ fontSize: "10px", color: "#94A3B8" }}>·</span>
                    <Image
                      src="/moov-money.png"
                      alt="Moov Money"
                      width={16}
                      height={16}
                      style={{ objectFit: "contain", borderRadius: "3px", flexShrink: 0 }}
                    />
                    <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 600, whiteSpace: "nowrap" }}>Mixx &amp; Moov</span>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", marginTop: "auto", gap: "10px" }}>
                  <Link
                    href={plan.buttonHref}
                    className="btn btn-outline-blue btn-pay-effect"
                    style={{
                      width: "100%",
                      minHeight: "48px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "8px 10px",
                      fontSize: "13px",
                      fontWeight: 700,
                      borderRadius: "12px",
                      textDecoration: "none",
                      textAlign: "center",
                    }}
                  >
                    {plan.buttonText}
                  </Link>

                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    width: "100%",
                    padding: "7px 12px",
                    background: "#F8FAFC",
                    border: "1px dashed #CBD5E1",
                    borderRadius: "9999px",
                    boxSizing: "border-box",
                  }}>
                    <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 600 }}>⭐ Gratuit 7 jours · Sans engagement</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Explanatory Banner: Not just mandatory dates! */}
      <section style={{ maxWidth: "1000px", margin: "0 auto 60px", paddingInline: "20px" }}>
        <div
          style={{
            background: "white",
            borderRadius: "20px",
            padding: "36px 32px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 4px 15px rgba(0, 0, 0, 0.03)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "28px",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-block",
                padding: "4px 12px",
                borderRadius: "9999px",
                background: "#FEF2F2",
                color: "#E10600",
                fontSize: "12px",
                fontWeight: 700,
                marginBottom: "12px",
              }}
            >
              🤝 Liberté & Respect
            </div>
            <h3 style={{ fontSize: "22px", fontWeight: 800, color: "#0F172A", marginBottom: "12px" }}>
              Pas d'obligation de rendez-vous immédiat
            </h3>
            <p style={{ color: "#334155", fontSize: "15px", lineHeight: 1.6 }}>
              Sur Meet Me Club, chacun va à son rythme. Vous pouvez simplement rester amis,
              échanger sur vos centres d'intérêt, discuter au quotidien ou choisir d'organiser
              une rencontre physique quand vous vous sentirez en confiance.
            </p>
          </div>

          <div
            style={{
              background: "#F8FAFC",
              borderRadius: "16px",
              padding: "24px",
              border: "1px solid #E2E8F0",
            }}
          >
            <h4 style={{ fontSize: "16px", fontWeight: 700, color: "#0F172A", marginBottom: "12px" }}>
              Règle du Plan Gratuit (7 jours) :
            </h4>
            <p style={{ fontSize: "14px", color: "#475569", lineHeight: 1.6, marginBottom: "14px" }}>
              Tout nouvel utilisateur bénéficie de <strong>7 jours d&apos;accès opérationnel gratuit</strong> pour créer son profil complet, être visible de tous les membres et échanger avec
              jusqu&apos;à <strong style={{ color: "#0F172A" }}>3 partenaires</strong>. L&apos;achat de packs de rendez-vous réels est également accessible dès cette période d&apos;essai.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#0B2E6B", fontWeight: 700, fontSize: "14px" }}>
              <span>🚀 Besoin de plus ?</span>
              <Link href="/inscription?plan=ESSENTIAL" style={{ color: "#E10600", textDecoration: "underline" }}>
                Passez au Pass Essentiel à 3 000 FCFA
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Payment Methods */}
      <section style={{ background: "white", padding: "50px 20px", borderTop: "1px solid #E2E8F0", textAlign: "center" }}>
        <div className="container" style={{ maxWidth: "880px" }}>
          <h3 style={{ fontSize: "22px", fontWeight: 800, color: "#0F172A", marginBottom: "10px" }}>
            Paiements sécurisés : Mobile Money & Carte Bancaire 💳 🌍
          </h3>
          <p style={{ color: "#64748B", fontSize: "15px", marginBottom: "28px" }}>
            Réglez instantanément par Mobile Money (T-Money, Moov) ou par Carte Bancaire internationale (Visa, Mastercard) depuis n&apos;importe quel pays.
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "20px",
              flexWrap: "wrap",
              marginBottom: "24px",
            }}
          >
            {/* Mixx by yas Card */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "16px 22px",
                borderRadius: "18px",
                border: "2px solid #002D72",
                background: "white",
                boxShadow: "0 6px 20px rgba(0, 45, 114, 0.12)",
                textAlign: "left",
                minWidth: "200px",
              }}
            >
              <div
                style={{
                  width: "58px",
                  height: "38px",
                  borderRadius: "10px",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#002D72",
                  flexShrink: 0,
                  padding: "2px",
                }}
              >
                <Image src="/mixx-by-yas.jpg" alt="Mixx by yas" width={54} height={34} style={{ objectFit: "contain" }} />
              </div>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#002D72" }}>Mixx by yas</div>
                <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>T-Money · Togocom</div>
              </div>
            </div>

            {/* Moov Money Card */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "16px 22px",
                borderRadius: "18px",
                border: "2px solid #E85E12",
                background: "white",
                boxShadow: "0 6px 20px rgba(232, 94, 18, 0.12)",
                textAlign: "left",
                minWidth: "200px",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "10px",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "white",
                  flexShrink: 0,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}
              >
                <Image src="/moov-money.png" alt="Moov Money" width={44} height={44} style={{ objectFit: "contain" }} />
              </div>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#E85E12" }}>Moov Money</div>
                <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>Flooz · Moov Africa</div>
              </div>
            </div>

            {/* Carte Bancaire (CB) Card */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "16px 22px",
                borderRadius: "18px",
                border: "2px solid #0B2559",
                background: "white",
                boxShadow: "0 6px 20px rgba(11, 37, 89, 0.12)",
                textAlign: "left",
                minWidth: "220px",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#EEF2FB",
                  flexShrink: 0,
                  fontSize: "24px",
                  border: "1px solid #CBD5E1",
                }}
              >
                💳
              </div>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#0B2559" }}>Carte Bancaire</div>
                <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>Visa · Mastercard · CB</div>
              </div>
            </div>
          </div>

          {/* International note banner */}
          <div
            style={{
              margin: "0 auto 28px",
              padding: "16px 22px",
              background: "#F0FDF4",
              border: "1.5px solid #86EFAC",
              borderRadius: "18px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              textAlign: "left",
              maxWidth: "780px",
            }}
          >
            <span style={{ fontSize: "28px", flexShrink: 0 }}>🌍</span>
            <div style={{ fontSize: "13px", color: "#166534", lineHeight: 1.5 }}>
              <strong>Adhésion ouverte au monde entier :</strong> Les membres de tous pays peuvent s&apos;inscrire, payer par <strong>Carte Bancaire (CB)</strong> ou <strong>Mobile Money</strong> pour échanger et chatter sans limite. Les rendez-vous physiques et sorties réelles se tiennent quant à eux sur place dans nos établissements partenaires au Togo.
            </div>
          </div>

          <div style={{ display: "inline-flex", alignItems: "center", flexWrap: "wrap", gap: "12px", background: "#F1F5F9", padding: "14px 24px", borderRadius: "16px", border: "1px solid #E2E8F0", justifyContent: "center" }}>
            <span style={{ fontSize: "14px", color: "#334155" }}>
              Vous avez déjà effectué votre paiement ?
            </span>
            <Link
              href="/paiement/activation"
              className="btn btn-primary btn-sm btn-pay-effect"
              style={{ fontWeight: 800, padding: "8px 18px", borderRadius: "10px" }}
            >
              ⚡ Activer mon compte ici
            </Link>
          </div>

          <p style={{ marginTop: "24px", fontSize: "13px", color: "#64748B" }}>
            Transactions sécurisées et chiffrées. Annulation de l'abonnement à tout moment en 1 clic dans votre profil.
          </p>
        </div>
      </section>
    </div>
  );
}
