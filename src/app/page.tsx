// src/app/page.tsx
// Public homepage — hero, pillars, how it works, packs preview

import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import Header from "@/components/Header";
import CommunityStatsWidget from "@/components/CommunityStatsWidget";
import {
  ShieldCheck,
  CheckCircle2,
  Heart,
  MessageSquare,
  Users,
  UserCheck,
  Search,
  Calendar,
  Sparkles,
  MapPin,
  Mail,
  Headphones,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Meet Me Club — Votre histoire commence ici",
  description:
    "Plus qu'une rencontre, un rendez-vous ! Le Club Privé de Rencontres International — Chats ouverts au monde entier et rendez-vous réels au Togo.",
};

// ── How it works steps ──────────────────────────────────────────
const STEPS = [
  {
    number: "01",
    Icon: UserCheck,
    title: "Créez votre profil",
    description:
      "Inscrivez-vous en quelques minutes, ajoutez vos photos et décrivez ce que vous recherchez.",
    color: "var(--color-red)",
  },
  {
    number: "02",
    Icon: Search,
    title: "Découvrez des profils",
    description:
      "Parcourez des profils vérifiés et discutez librement avant de décider.",
    color: "var(--color-blue)",
  },
  {
    number: "03",
    Icon: Calendar,
    title: "Proposez un rendez-vous",
    description:
      "Choisissez le lieu, la date et le pack. L'autre personne accepte ou contre-propose.",
    color: "var(--color-red)",
  },
  {
    number: "04",
    Icon: Sparkles,
    title: "Vivez le moment",
    description:
      "Retrouvez-vous dans un cadre soigné, avec table réservée et repas commandés à l'avance.",
    color: "var(--color-blue)",
  },
];

// ── Packs ─────────────────────────────────────────────────────
const PACKS = [
  {
    name: "Découverte",
    price: "2 000",
    description: "Rencontre simple en lieu public",
    features: ["Lieu public", "Chat inclus", "Rappels automatiques"],
    color: "var(--color-gray-500)",
    popular: false,
  },
  {
    name: "Complice",
    price: "5 000",
    description: "Table réservée + 1 boisson par personne",
    features: ["Table réservée", "1 boisson incluse", "Chat dédié", "Rappels"],
    color: "var(--color-blue)",
    popular: false,
  },
  {
    name: "Dîner",
    price: "12 000",
    description: "Menu complet dans un lieu partenaire",
    features: [
      "Table réservée",
      "Menu entrée/plat/boisson",
      "Ambiance soignée",
      "Rappels",
    ],
    color: "var(--color-red)",
    popular: true,
  },
  {
    name: "VIP Premium",
    price: "30 000",
    description: "Espace privatif, menu complet, accueil dédié",
    features: [
      "Espace privatif",
      "Menu complet",
      "Boissons au choix",
      "Accueil dédié",
      "Options décoration",
    ],
    color: "#B8860B",
    popular: false,
  },
];

// ── Testimonials ───────────────────────────────────────────────
const TESTIMONIALS = [
  {
    name: "Amivi K.",
    age: 26,
    city: "Lomé",
    text: "J'ai rencontré quelqu'un de formidable. Le fait que tout soit organisé à l'avance m'a rassurée. Le restaurant était parfait !",
    avatar: "👩🏾",
  },
  {
    name: "Kofi A.",
    age: 31,
    city: "Lomé",
    text: "Enfin une application qui pense à tout ! J'ai réservé le dîner directement depuis l'appli. Elle a adoré la surprise.",
    avatar: "👨🏿",
  },
  {
    name: "Essi M.",
    age: 24,
    city: "Lomé",
    text: "Le QR code à l'arrivée, les rappels automatiques… Meet Me Club c'est vraiment du sérieux. Je recommande à 100%.",
    avatar: "👩🏾",
  },
];

// ── FAQ ────────────────────────────────────────────────────────
const FAQ = [
  {
    q: "Qui peut utiliser Meet Me Club ?",
    a: "Meet Me Club est exclusivement réservé aux adultes de 18 ans et plus. Votre âge est vérifié à l'inscription.",
  },
  {
    q: "Comment fonctionne le paiement ?",
    a: "Vous payez via T-Money ou Flooz directement dans l'application. L'argent est sécurisé jusqu'à la confirmation du rendez-vous.",
  },
  {
    q: "Est-ce que mon numéro de téléphone est partagé ?",
    a: "Non, jamais. Votre téléphone n'est pas visible sur votre profil. Toute communication passe par notre chat sécurisé.",
  },
  {
    q: "Puis-je annuler un rendez-vous ?",
    a: "Oui. Si vous annulez plus de 24h avant, vous êtes remboursé intégralement. Les conditions varient selon le délai et le pack.",
  },
  {
    q: "Comment les lieux partenaires sont-ils sélectionnés ?",
    a: "Chaque partenaire est vérifié par notre équipe : documents légaux, visite des lieux, et contrôle de la qualité d'accueil.",
  },
];

export default function HomePage() {
  return (
    <main>
      {/* ── Age Gate Banner ───────────────────────────────────── */}
      <div
        style={{
          background: "var(--color-blue)",
          color: "white",
          textAlign: "center",
          padding: "8px 16px",
          fontSize: "13px",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
        <span>Plateforme réservée aux adultes de 18 ans et plus — Accès strictement réservé aux personnes majeures</span>
      </div>

      {/* ── Header ───────────────────────────────────────────── */}
      <Header />

      {/* ── Hero Section ──────────────────────────────────────── */}
      <section
        style={{
          position: "relative",
          minHeight: "calc(100vh - var(--header-height) - 36px)",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          paddingBlock: "80px 120px",
        }}
      >
        {/* Background Image: Couple meetmeclub with Scrim & Vignette */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <Image
            src="/hero-bg.jpg"
            alt="Meet Me Club — Plus qu'une rencontre, un rendez-vous !"
            fill
            priority
            quality={100}
            style={{
              objectFit: "cover",
              objectPosition: "center right",
            }}
          />
          {/* Dual-layer intelligent scrim */}
          <div className="hero-scrim" />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 10% 20%, rgba(225, 6, 0, 0.28) 0%, transparent 45%), linear-gradient(180deg, rgba(7, 30, 70, 0.45) 0%, transparent 25%, transparent 70%, rgba(7, 30, 70, 0.9) 100%)",
            }}
          />
        </div>

        <div className="container" style={{ position: "relative", zIndex: 1, width: "100%" }}>
          <div className="hero-grid">
            {/* Left Column: All Core Information, CTAs & Value Props */}
            <div className="animate-fade-in" style={{ maxWidth: "620px" }}>
              {/* Brand Signature Label / Étiquette */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  background: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(12px)",
                  padding: "6px 16px 6px 6px",
                  borderRadius: "var(--radius-full)",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)",
                  marginBottom: "20px",
                  border: "1.5px solid rgba(255, 255, 255, 0.8)",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: "2px solid var(--color-red)",
                    background: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: "0 2px 8px rgba(225, 6, 0, 0.2)",
                  }}
                >
                  <Image
                    src="/logo.png"
                    alt="Logo Meet Me Club"
                    width={36}
                    height={36}
                    style={{ objectFit: "cover" }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 800,
                      color: "var(--color-blue)",
                      letterSpacing: "0.5px",
                    }}
                  >
                    MEET <span style={{ color: "var(--color-red)" }}>ME</span> CLUB
                  </span>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "var(--color-gray-500)",
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                    }}
                  >
                    Club Privé International · Sorties Togo
                  </span>
                </div>
                <span
                  style={{
                    marginLeft: "6px",
                    fontSize: "10px",
                    fontWeight: 700,
                    background: "var(--color-red)",
                    color: "white",
                    padding: "3px 8px",
                    borderRadius: "var(--radius-full)",
                    letterSpacing: "0.5px",
                  }}
                >
                  18+
                </span>
              </div>

              {/* Pillars */}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginBottom: "24px",
                  flexWrap: "wrap",
                }}
              >
                {[
                  { icon: "❤️", label: "Rencontrez" },
                  { icon: "💬", label: "Échangez" },
                  { icon: "👥", label: "Partagez" },
                ].map((p) => (
                  <span key={p.label} className="hero-pillar-chip">
                    {p.icon} {p.label}
                  </span>
                ))}
              </div>

              <h1
                style={{
                  fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
                  fontWeight: 800,
                  color: "white",
                  lineHeight: 1.1,
                  marginBottom: "16px",
                  textShadow: "0 2px 16px rgba(0,0,0,0.45)",
                }}
              >
                Plus qu'une rencontre,{" "}
                <span
                  className="font-script"
                  style={{
                    color: "#FFD700",
                    fontSize: "1.1em",
                    display: "block",
                    textShadow: "0 2px 14px rgba(0,0,0,0.5)",
                  }}
                >
                  un rendez-vous !
                </span>
              </h1>

              <p
                style={{
                  fontSize: "clamp(1.05rem, 2vw, 1.25rem)",
                  color: "rgba(255,255,255,0.92)",
                  marginBottom: "14px",
                  fontWeight: 400,
                  lineHeight: 1.6,
                  textShadow: "0 1px 8px rgba(0,0,0,0.4)",
                }}
              >
                Rejoignez des célibataires authentiques du monde entier. Échangez et chattez librement, et vivez vos vraies rencontres dans nos cadres partenaires exclusifs au Togo.
              </p>

              <p
                className="font-script"
                style={{
                  fontSize: "clamp(1.4rem, 2.5vw, 1.9rem)",
                  color: "rgba(255,255,255,0.9)",
                  marginBottom: "36px",
                  textShadow: "0 2px 10px rgba(0,0,0,0.4)",
                }}
              >
                Votre histoire commence ici ❤️
              </p>

              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
                <Link
                  href="/inscription"
                  className="btn btn-lg"
                  style={{
                    background: "var(--color-red)",
                    color: "white",
                    fontWeight: 700,
                    boxShadow: "0 8px 30px rgba(225, 6, 0, 0.45)",
                    border: "2px solid rgba(255,255,255,0.2)",
                  }}
                >
                  ❤️ Rejoindre gratuitement
                </Link>
                <Link
                  href="/tarifs"
                  className="btn btn-lg"
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    borderColor: "rgba(255,255,255,0.4)",
                    color: "white",
                    fontWeight: 600,
                  }}
                >
                  Voir les packs
                </Link>
              </div>

              <div
                style={{
                  marginTop: "24px",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "16px",
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.9)",
                  fontWeight: 600,
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span>Gratuit</span>
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span>Profils vérifiés</span>
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <MapPin size={16} className="text-red-400" />
                  <span>Sorties au Togo</span>
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <ShieldCheck size={16} className="text-amber-400" />
                  <span>Membres majeurs (+18)</span>
                </span>
              </div>
            </div>

            {/* Right Column: Floating Live Trust Card (Positioned to highlight the couple) */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "flex-end",
                minHeight: "420px",
              }}
            >
              {/* Floating Live Badge Top Right */}
              <div
                style={{
                  background: "rgba(11, 46, 107, 0.70)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  borderRadius: "var(--radius-full)",
                  padding: "8px 18px",
                  color: "white",
                  fontSize: "13px",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#10B981",
                    boxShadow: "0 0 10px #10B981",
                  }}
                />
                <span>Membres en ligne à Lomé</span>
              </div>

              {/* Floating Bottom Card: Real Stats & Quick Action */}
              <div
                style={{
                  background: "rgba(11, 46, 107, 0.65)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  borderRadius: "var(--radius-2xl)",
                  padding: "24px",
                  border: "1px solid rgba(255,255,255,0.25)",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
                  maxWidth: "380px",
                  width: "100%",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: "2px solid rgba(255, 255, 255, 0.4)",
                      background: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                      flexShrink: 0,
                    }}
                  >
                    <Image src="/logo.png" alt="Logo" width={38} height={38} style={{ objectFit: "cover" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: "white" }}>
                      Meet Me Club Lomé
                    </div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.75)" }}>
                      Plateforme n°1 de rendez-vous
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                    marginBottom: "18px",
                  }}
                >
                  {[
                    { value: "500+", label: "Membres actifs" },
                    { value: "50+", label: "Lieux partenaires" },
                    { value: "200+", label: "Rendez-vous réussis" },
                    { value: "4.8★", label: "Note moyenne" },
                  ].map((s) => (
                    <div
                      key={s.label}
                      style={{
                        background: "rgba(255,255,255,0.12)",
                        borderRadius: "var(--radius-md)",
                        padding: "12px 10px",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "20px",
                          fontWeight: 800,
                          color: "white",
                        }}
                      >
                        {s.value}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "rgba(255,255,255,0.8)",
                          marginTop: "2px",
                        }}
                      >
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>

                <Link
                  href="/inscription"
                  className="btn btn-primary"
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    fontWeight: 700,
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  Commencer maintenant →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Wave bottom */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "80px",
            background: "var(--color-gray-50)",
            clipPath: "ellipse(55% 100% at 50% 100%)",
            zIndex: 1,
          }}
        />
      </section>

      {/* ── Espace Statistiques Dynamiques en Direct (Membres, Inscriptions, VIP) ── */}
      <section style={{ maxWidth: "1060px", margin: "-45px auto 32px", paddingInline: "20px", position: "relative", zIndex: 10 }}>
        <CommunityStatsWidget />
      </section>

      {/* ── Three Pillars ─────────────────────────────────────── */}
      <section className="section" style={{ background: "var(--color-gray-50)", paddingTop: "40px" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <h2 style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)", marginBottom: "12px" }}>
              La rencontre réinventée
            </h2>
            <p style={{ fontSize: "18px", color: "var(--color-gray-500)", maxWidth: "480px", margin: "0 auto" }}>
              Meet Me Club, c'est bien plus qu'une appli de rencontres
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "24px" }}>
            {[
              {
                Icon: Heart,
                title: "Rencontrez",
                description: "Des profils vérifiés, filtrés par ville, centres d'intérêt et disponibilités. Trouvez votre match avec sérieux.",
                gradient: "var(--gradient-red)",
              },
              {
                Icon: MessageSquare,
                title: "Échangez",
                description: "Discutez librement avant de décider. Notre chat sécurisé protège votre vie privée à chaque étape.",
                gradient: "var(--gradient-blue)",
              },
              {
                Icon: Users,
                title: "Partagez",
                description: "Partagez un vrai moment dans un lieu choisi, avec table réservée et commande faite à l'avance.",
                gradient: "var(--gradient-red)",
              },
            ].map((p) => {
              const IconComp = p.Icon;
              return (
                <div
                  key={p.title}
                  className="card card-hover"
                  style={{
                    padding: "32px 24px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      width: "72px",
                      height: "72px",
                      borderRadius: "var(--radius-full)",
                      background: p.gradient,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      margin: "0 auto 20px",
                      boxShadow: "var(--shadow-red)",
                    }}
                  >
                    <IconComp size={32} strokeWidth={2.2} />
                  </div>
                  <h3 style={{ fontSize: "22px", marginBottom: "12px" }}>{p.title}</h3>
                  <p style={{ color: "var(--color-gray-500)", lineHeight: 1.6 }}>{p.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it Works ──────────────────────────────────────── */}
      <section
        className="section"
        style={{ background: "var(--color-white)", position: "relative" }}
      >
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <h2 style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)", marginBottom: "12px" }}>
              Comment ça marche ?
            </h2>
            <p style={{ fontSize: "18px", color: "var(--color-gray-500)" }}>
              En 4 étapes simples, de l'inscription au rendez-vous
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "32px" }}>
            {STEPS.map((step, i) => {
              const StepIcon = step.Icon;
              return (
                <div key={i} style={{ textAlign: "center" }}>
                  <div
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "var(--radius-full)",
                      background: step.color === "var(--color-red)" ? "var(--gradient-red)" : "var(--gradient-blue)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 20px",
                      color: "white",
                      boxShadow: step.color === "var(--color-red)" ? "var(--shadow-red)" : "var(--shadow-blue)",
                      position: "relative",
                    }}
                  >
                    <span style={{ position: "absolute", top: "-8px", right: "-8px", background: "white", color: step.color, width: "28px", height: "28px", borderRadius: "var(--radius-full)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 800, boxShadow: "var(--shadow-sm)" }}>{step.number}</span>
                    <StepIcon size={32} strokeWidth={2} />
                  </div>
                  <h3 style={{ fontSize: "18px", marginBottom: "10px" }}>{step.title}</h3>
                  <p style={{ color: "var(--color-gray-500)", fontSize: "15px", lineHeight: 1.6 }}>
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: "center", marginTop: "48px" }}>
            <Link href="/inscription" className="btn btn-primary btn-lg">
              Commencer maintenant →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Packs ─────────────────────────────────────────────── */}
      <section
        className="section"
        style={{
          background: "var(--gradient-blue)",
          position: "relative",
          paddingTop: "clamp(90px, 12vw, 120px)",
          paddingBottom: "80px",
        }}
      >
        <div
          aria-hidden
          className="packs-wave-divider"
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0,
            height: "45px",
            background: "white",
            clipPath: "ellipse(55% 100% at 50% 0%)",
            pointerEvents: "none",
          }}
        />
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div
            className="packs-header-center"
            style={{
              textAlign: "center",
              marginBottom: "48px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              maxWidth: "760px",
              marginInline: "auto",
              paddingInline: "12px",
              position: "relative",
              zIndex: 2,
            }}
          >
            <h2
              style={{
                fontSize: "clamp(1.65rem, 5vw, 2.5rem)",
                fontWeight: 800,
                color: "#FFFFFF",
                marginBottom: "12px",
                textAlign: "center",
                width: "100%",
                lineHeight: 1.25,
                textShadow: "0 2px 10px rgba(0, 0, 0, 0.35)",
              }}
            >
              Choisissez votre pack
            </h2>
            <p
              style={{
                fontSize: "clamp(15px, 3.8vw, 18px)",
                color: "rgba(255,255,255,0.9)",
                textAlign: "center",
                width: "100%",
                maxWidth: "600px",
                marginInline: "auto",
                lineHeight: 1.5,
                textShadow: "0 1px 6px rgba(0, 0, 0, 0.25)",
              }}
            >
              De la rencontre simple au dîner privatif — en FCFA
            </p>
          </div>

          <div className="home-packs-grid">
            {PACKS.map((pack) => (
              <div
                key={pack.name}
                style={{
                  background: pack.popular ? "white" : "rgba(255,255,255,0.08)",
                  border: pack.popular ? `3px solid var(--color-red)` : "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "var(--radius-xl)",
                  padding: "26px 18px",
                  position: "relative",
                  backdropFilter: pack.popular ? "none" : "blur(8px)",
                  transition: "transform var(--transition-base)",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  {pack.popular && (
                    <div
                      style={{
                        position: "absolute",
                        top: "-14px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "var(--gradient-red)",
                        color: "white",
                        padding: "4px 16px",
                        borderRadius: "var(--radius-full)",
                        fontSize: "12px",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                      }}
                    >
                      ⭐ Le plus populaire
                    </div>
                  )}
                  <div
                    style={{
                      width: "48px",
                      height: "6px",
                      background: pack.color,
                      borderRadius: "var(--radius-full)",
                      marginBottom: "16px",
                    }}
                  />
                  <h3
                    style={{
                      fontSize: "19px",
                      fontWeight: 800,
                      color: pack.popular ? "var(--color-blue)" : "white",
                      marginBottom: "6px",
                    }}
                  >
                    {pack.name}
                  </h3>
                  <p
                    style={{
                      fontSize: "13px",
                      color: pack.popular ? "var(--color-gray-500)" : "rgba(255,255,255,0.7)",
                      marginBottom: "18px",
                      minHeight: "36px",
                      lineHeight: 1.4,
                    }}
                  >
                    {pack.description}
                  </p>
                  <div
                    style={{
                      fontSize: "26px",
                      fontWeight: 800,
                      color: pack.popular ? pack.color : "white",
                      marginBottom: "18px",
                    }}
                  >
                    {pack.price}{" "}
                    <span style={{ fontSize: "13px", fontWeight: 400, opacity: 0.75 }}>
                      FCFA
                    </span>
                  </div>
                  <ul style={{ listStyle: "none", marginBottom: "22px", padding: 0 }}>
                    {pack.features.map((f) => (
                      <li
                        key={f}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "13px",
                          color: pack.popular ? "var(--color-gray-600)" : "rgba(255,255,255,0.85)",
                          marginBottom: "8px",
                          lineHeight: 1.3,
                        }}
                      >
                        <span style={{ color: pack.popular ? "var(--color-red)" : "#FFD700", fontWeight: "bold" }}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href="/inscription"
                  className={`btn ${pack.popular ? "btn-primary" : "btn-outline-red"}`}
                  style={{
                    width: "100%",
                    marginTop: "auto",
                    ...(pack.popular ? {} : { borderColor: "rgba(255,255,255,0.4)", color: "white" }),
                  }}
                >
                  Choisir ce pack
                </Link>
              </div>
            ))}
          </div>

          <p
            style={{
              textAlign: "center",
              marginTop: "32px",
              fontSize: "14px",
              color: "rgba(255,255,255,0.6)",
            }}
          >
            * Tarifs configurables. Paiement sécurisé T-Money · Flooz · Carte bancaire
          </p>
        </div>
        <div
          aria-hidden
          style={{
            position: "absolute",
            bottom: 0, left: 0, right: 0,
            height: "80px",
            background: "var(--color-gray-50)",
            clipPath: "ellipse(55% 100% at 50% 100%)",
          }}
        />
      </section>

      {/* ── Testimonials ──────────────────────────────────────── */}
      <section className="section" style={{ background: "var(--color-gray-50)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <h2 style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)", marginBottom: "12px" }}>
              Ils ont trouvé leur rendez-vous
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "24px" }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="card card-padded">
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                  <div style={{ fontSize: "40px" }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--color-blue)" }}>{t.name}</div>
                    <div style={{ fontSize: "13px", color: "var(--color-gray-500)" }}>{t.age} ans · {t.city}</div>
                  </div>
                </div>
                <p style={{ color: "var(--color-gray-600)", lineHeight: 1.7, fontStyle: "italic" }}>
                  "{t.text}"
                </p>
                <div style={{ marginTop: "12px", color: "#F59E0B", fontSize: "18px" }}>★★★★★</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <section className="section" style={{ background: "white" }}>
        <div className="container" style={{ maxWidth: "720px" }}>
          <h2 style={{ textAlign: "center", fontSize: "clamp(1.5rem, 4vw, 2.5rem)", marginBottom: "48px" }}>
            Questions fréquentes
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {FAQ.map((f, i) => (
              <details
                key={i}
                className="card"
                style={{
                  padding: "20px 24px",
                  cursor: "pointer",
                  borderLeft: "4px solid var(--color-red)",
                }}
              >
                <summary
                  style={{
                    fontWeight: 700,
                    color: "var(--color-blue)",
                    fontSize: "16px",
                    listStyle: "none",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  {f.q}
                  <span style={{ fontSize: "20px", color: "var(--color-red)" }}>+</span>
                </summary>
                <p style={{ marginTop: "12px", color: "var(--color-gray-600)", lineHeight: 1.7 }}>
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────── */}
      <section
        style={{
          background: "var(--gradient-red)",
          padding: "64px 16px",
          textAlign: "center",
        }}
      >
        <div className="container">
          <h2
            className="font-script"
            style={{ fontSize: "clamp(1.8rem, 5vw, 3rem)", color: "white", marginBottom: "16px" }}
          >
            Votre histoire commence ici
          </h2>
          <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.85)", marginBottom: "32px" }}>
            Rejoignez des centaines de membres qui ont déjà trouvé leur rendez-vous à Lomé.
          </p>
          <Link
            href="/inscription"
            className="btn btn-lg"
            style={{ background: "white", color: "var(--color-red)", fontWeight: 700, boxShadow: "0 8px 30px rgba(0,0,0,0.25)" }}
          >
            Créer mon profil gratuitement
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <Footer />
    </main>
  );
}

// ── Footer Component ───────────────────────────────────────────

function Footer() {
  return (
    <footer style={{ background: "var(--color-blue-dark)", color: "rgba(255,255,255,0.75)", padding: "48px 16px 24px" }}>
      <div className="container">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "32px", marginBottom: "48px" }}>
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "2px solid var(--color-red)",
                  background: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: "0 0 16px rgba(225, 6, 0, 0.35)",
                  padding: "3px",
                }}
              >
                <Image src="/logo.png" alt="Meet Me Club" width={42} height={42} style={{ objectFit: "contain" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
                <span style={{ fontWeight: 800, fontSize: "18px", color: "white", letterSpacing: "0.2px" }}>
                  meet <span style={{ color: "var(--color-red)" }}>me</span> club
                </span>
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.75)", fontStyle: "italic" }}>
                  « Plus qu&apos;une rencontre, un rendez-vous ! »
                </span>
              </div>
            </div>
            <p style={{ fontSize: "14px", lineHeight: 1.7 }}>
              Plus qu&apos;une rencontre, un rendez-vous. La première plateforme de rencontres avec réservation au Togo.
            </p>
          </div>
          {/* Links */}
          <div>
            <h4 style={{ color: "white", marginBottom: "16px", fontSize: "15px" }}>Plateforme</h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
              {[["Le Concept", "/concept"], ["Nos tarifs", "/tarifs"], ["À propos", "/a-propos"], ["FAQ", "/faq"], ["Devenir partenaire", "/partenaires"]].map(([label, href]) => (
                <li key={href}><Link href={href} style={{ color: "inherit", textDecoration: "none", fontSize: "14px" }}>{label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 style={{ color: "white", marginBottom: "16px", fontSize: "15px" }}>Sécurité & Légal</h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
              {[["Sécurité & Confiance", "/securite"], ["CGU", "/legal/cgu"], ["Confidentialité", "/legal/confidentialite"], ["Mentions légales", "/legal/mentions"], ["Charte de conduite", "/legal/charte"]].map(([label, href]) => (
                <li key={href}><Link href={href} style={{ color: "inherit", textDecoration: "none", fontSize: "14px" }}>{label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 style={{ color: "white", marginBottom: "16px", fontSize: "15px" }}>Contact & Assistance</h4>
            <div style={{ fontSize: "14px", lineHeight: 1.8, display: "flex", flexDirection: "column", gap: "6px" }}>
              <Link href="/contact" style={{ color: "white", fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <Headphones size={15} />
                <span>Assistance & Support</span>
              </Link>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <Mail size={15} />
                <span>contact@meetmeclub.tg</span>
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <MapPin size={15} />
                <span>Lomé, Togo</span>
              </span>
            </div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <p style={{ fontSize: "13px" }}>© {new Date().getFullYear()} Meet Me Club. Tous droits réservés.</p>
          <p style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Réservé aux adultes de 18 ans et plus · Lomé, Togo</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
