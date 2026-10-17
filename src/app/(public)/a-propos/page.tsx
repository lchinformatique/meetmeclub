// src/app/(public)/a-propos/page.tsx
// À propos de Meet Me Club — Mission, Valeurs, Sécurité

import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "À propos",
  description: "Découvrez Meet Me Club : la première plateforme de rencontres avec réservation de rendez-vous dans des lieux d'exception.",
};

export default function AProposPage() {
  return (
    <div>
      {/* Hero */}
      <section style={{ background: "var(--gradient-blue)", padding: "70px 16px 80px", textAlign: "center", position: "relative" }}>
        <div className="container" style={{ maxWidth: "780px" }}>
          {/* Brand Signature Label */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              background: "rgba(255, 255, 255, 0.12)",
              backdropFilter: "blur(12px)",
              padding: "6px 16px 6px 6px",
              borderRadius: "var(--radius-full)",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              marginBottom: "20px",
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
              }}
            >
              <Image src="/logo.png" alt="Logo Meet Me Club" width={36} height={36} style={{ objectFit: "cover" }} />
            </div>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "white", letterSpacing: "0.5px" }}>
              MEET <span style={{ color: "var(--color-red)" }}>ME</span> CLUB · NOTRE HISTOIRE
            </span>
          </div>

          <h1 style={{ color: "white", fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 800, marginBottom: "16px", lineHeight: 1.15 }}>
            Plus qu&apos;une rencontre, un véritable rendez-vous
          </h1>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "18px", lineHeight: 1.6 }}>
            Ouverte au monde entier, Meet Me Club est la première plateforme pensée pour transformer les affinités en ligne en moments réels, mémorables et sécurisés dans les meilleurs établissements du Togo.
          </p>
        </div>
        <div aria-hidden style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "40px", background: "var(--color-gray-50)", clipPath: "ellipse(55% 100% at 50% 100%)" }} />
      </section>

      {/* Main Content */}
      <section className="section" style={{ background: "var(--color-gray-50)" }}>
        <div className="container" style={{ maxWidth: "900px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", marginBottom: "40px" }}>
            <div className="card card-padded">
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>🔒</div>
              <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-blue)", marginBottom: "8px" }}>
                Sécurité & Vérification 18+
              </h2>
              <p style={{ color: "var(--color-gray-600)", fontSize: "14px", lineHeight: 1.6 }}>
                Chaque profil est soumis à une vérification rigoureuse : numéro de téléphone certifié, majorité légale (18+) et validation par selfie. Fini les faux profils et les arnaques.
              </p>
            </div>

            <div className="card card-padded">
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>🍽️</div>
              <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-blue)", marginBottom: "8px" }}>
                Lieux d&apos;exception partenaires
              </h2>
              <p style={{ color: "var(--color-gray-600)", fontSize: "14px", lineHeight: 1.6 }}>
                Restaurants gastronomiques, lounges feutrés, terrasses en bord de mer et cafés chics. Nous réservons votre table et garantissons un accueil privilégié avec validation par QR code.
              </p>
            </div>

            <div className="card card-padded">
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>💳</div>
              <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-blue)", marginBottom: "8px" }}>
                Paiement Mobile Money local
              </h2>
              <p style={{ color: "var(--color-gray-600)", fontSize: "14px", lineHeight: 1.6 }}>
                Payez simplement par Mobile Money (T-Money, Flooz), avec confirmation instantanée et sans frais cachés. Le paiement par carte bancaire arrive bientôt.
              </p>
            </div>
          </div>

          {/* Vision card */}
          <div className="card card-padded" style={{ background: "white", padding: "40px", borderLeft: "4px solid var(--color-red)" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--color-blue)", marginBottom: "16px" }}>
              Notre vision du dating moderne
            </h2>
            <p style={{ color: "var(--color-gray-600)", fontSize: "15px", lineHeight: 1.7, marginBottom: "16px" }}>
              Nous croyons que les conversations interminables derrière un écran ne remplaceront jamais l&apos;étincelle d&apos;un premier regard autour d&apos;un bon verre ou d&apos;un dîner raffiné.
            </p>
            <p style={{ color: "var(--color-gray-600)", fontSize: "15px", lineHeight: 1.7, marginBottom: "24px" }}>
              Meet Me Club supprime l&apos;embarras du premier pas : choisissez un profil qui vous plaît, sélectionnez un lieu partenaire et un horaire, et nous nous chargeons du reste.
            </p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Link href="/inscription" className="btn btn-primary">
                Rejoindre le club ❤️
              </Link>
              <Link href="/tarifs" className="btn btn-outline-blue">
                Voir nos packs de rendez-vous
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
