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
    badge: "Pour démarrer",
    price: "0",
    period: "gratuit à vie",
    subtitle: "Rejoignez le club et faites vos premiers pas",
    description: "Permet de créer votre profil officiel, d'être visible et d'échanger avec vos 3 premiers partenaires.",
    features: [
      { text: "Création et enregistrement complet du profil", ok: true },
      { text: "Visibilité officielle dans l'espace Découverte", ok: true },
      { text: "Échanger & discuter avec jusqu'à 3 partenaires", ok: true, highlight: true },
      { text: "Messagerie privée sécurisée", ok: true },
      { text: "Discussions illimitées avec plus de 3 personnes", ok: false },
      { text: "Voir qui a visité ou aimé votre profil", ok: false },
      { text: "Réservations de tables et boissons partenaires", ok: false },
    ],
    buttonText: "Commencer gratuitement",
    buttonHref: "/inscription",
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
      { text: "Pas d'obligation de rendez-vous : échange libre", ok: true },
      { text: "Voir qui a visité et qui a liké votre profil", ok: true },
      { text: "Filtres avancés par quartier de Lomé & intérêts", ok: true },
      { text: "Badge membre vérifié", ok: true },
      { text: "Réservation de tables et boissons partenaires", ok: false },
    ],
    buttonText: "Choisir le Pass Essentiel",
    buttonHref: "/inscription?plan=ESSENTIAL",
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
      { text: "Réservations de tables en lieux partenaires sécurisés", ok: true, highlight: true },
      { text: "1 consommation offerte par personne au rendez-vous", ok: true },
      { text: "QR code de validation instantanée au comptoir", ok: true },
      { text: "Rappels automatiques 24h et 2h avant la sortie", ok: true },
      { text: "Assurance sécurité & médiation du club", ok: true },
      { text: "Accès salons VIP et dîners gastronomiques", ok: false },
    ],
    buttonText: "Choisir le Pass Complice",
    buttonHref: "/inscription?plan=COMPLICE",
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
    description: "Salons privés, dîners gastronomiques complets et accompagnement conciergerie personnalisé pour des rencontres d'exception.",
    features: [
      { text: "Tout le Pass Complice en illimité", ok: true },
      { text: "Salons VIP et rooftops partenaires réservés", ok: true },
      { text: "Dîner gastronomique complet offert par mois", ok: true, highlight: true },
      { text: "Badge officiel VIP Or sur votre profil", ok: true },
      { text: "Visibilité prioritaire en haut de la Découverte", ok: true },
      { text: "Conciergerie privée Meet Me Club dédiée", ok: true },
      { text: "Accès événements & soirées privées du club", ok: true },
    ],
    buttonText: "Devenir Membre VIP",
    buttonHref: "/inscription?plan=VIP",
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

      {/* Main Pricing Cards Grid */}
      <section style={{ maxWidth: "1280px", margin: "-50px auto 60px", paddingInline: "20px", position: "relative", zIndex: 10 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px",
            alignItems: "stretch",
          }}
        >
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              style={{
                background: "white",
                borderRadius: "20px",
                border: plan.highlight ? "3px solid #0B2E6B" : `1px solid ${plan.borderColor}`,
                padding: "32px 26px",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                boxShadow: plan.highlight
                  ? "0 20px 40px -10px rgba(11, 46, 107, 0.25)"
                  : "0 4px 15px rgba(0, 0, 0, 0.05)",
                transform: plan.highlight ? "scale(1.02)" : "none",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
            >
              {/* Badge */}
              <div style={{ marginBottom: "14px" }}>
                <span
                  style={{
                    display: "inline-block",
                    background: plan.highlight ? "rgba(11, 46, 107, 0.08)" : "#F1F5F9",
                    color: plan.badgeColor,
                    fontSize: "12px",
                    fontWeight: 700,
                    padding: "4px 12px",
                    borderRadius: "9999px",
                  }}
                >
                  {plan.badge}
                </span>
              </div>

              {/* Title & Subtitle */}
              <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#0F172A", marginBottom: "6px" }}>
                {plan.name}
              </h2>
              <p style={{ fontSize: "14px", color: "#475569", marginBottom: "20px", minHeight: "42px", lineHeight: 1.4 }}>
                {plan.description}
              </p>

              {/* Price */}
              <div style={{ marginBottom: "24px", paddingBottom: "20px", borderBottom: "1px solid #E2E8F0" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                  <span style={{ fontSize: "36px", fontWeight: 900, color: plan.highlight ? "#0B2E6B" : "#0F172A" }}>
                    {plan.price}
                  </span>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#64748B" }}>
                    {plan.period}
                  </span>
                </div>
              </div>

              {/* Features List */}
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px 0", flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
                {plan.features.map((feat, idx) => (
                  <li
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      fontSize: "14px",
                      lineHeight: 1.4,
                      color: feat.ok ? (feat.highlight ? "#0F172A" : "#334155") : "#94A3B8",
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

              {/* Call to action */}
              <Link
                href={plan.buttonHref}
                className={`btn ${plan.btnClass}`}
                style={{
                  width: "100%",
                  justifyContent: "center",
                  padding: "14px",
                  fontSize: "15px",
                  fontWeight: 700,
                  borderRadius: "12px",
                  textDecoration: "none",
                }}
              >
                {plan.buttonText}
              </Link>
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
              Règle du Plan Gratuit :
            </h4>
            <p style={{ fontSize: "14px", color: "#475569", lineHeight: 1.6, marginBottom: "14px" }}>
              Tout nouvel utilisateur peut enregistrer son profil complet, être visible de tous les membres et choisir
              jusqu'à <strong style={{ color: "#0F172A" }}>3 partenaires</strong> pour débuter des discussions.
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
        <div className="container" style={{ maxWidth: "700px" }}>
          <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#0F172A", marginBottom: "10px" }}>
            Paiement mobile sécurisé au Togo 🇹🇬
          </h3>
          <p style={{ color: "#64748B", fontSize: "15px", marginBottom: "24px" }}>
            Activez votre formule en quelques secondes avec vos moyens de paiement habituels.
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "24px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "12px 20px",
                borderRadius: "12px",
                border: "1px solid #E2E8F0",
                background: "#F8FAFC",
                fontWeight: 700,
                color: "#0F172A",
                fontSize: "14px",
              }}
            >
              <span style={{ fontSize: "20px" }}>📲</span> T-Money (Togocom)
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "12px 20px",
                borderRadius: "12px",
                border: "1px solid #E2E8F0",
                background: "#F8FAFC",
                fontWeight: 700,
                color: "#0F172A",
                fontSize: "14px",
              }}
            >
              <span style={{ fontSize: "20px" }}>📲</span> Flooz (Moov Africa)
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "12px 20px",
                borderRadius: "12px",
                border: "1px solid #E2E8F0",
                background: "#F8FAFC",
                fontWeight: 700,
                color: "#0F172A",
                fontSize: "14px",
              }}
            >
              <span style={{ fontSize: "20px" }}>💳</span> Carte Bancaire (Visa / Mastercard)
            </div>
          </div>

          <p style={{ marginTop: "24px", fontSize: "13px", color: "#64748B" }}>
            Transactions sécurisées et chiffrées. Annulation de l'abonnement à tout moment en 1 clic dans votre profil.
          </p>
        </div>
      </section>
    </div>
  );
}
