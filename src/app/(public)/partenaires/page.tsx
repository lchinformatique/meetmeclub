// src/app/(public)/partenaires/page.tsx
// Page partenaires — Restaurants, lounges et hôtels partenaires

import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Devenir Partenaire",
  description: "Rejoignez le réseau d'établissements partenaires Meet Me Club. Augmentez votre fréquentation avec une clientèle qualifiée.",
};

export default function PartenairesPage() {
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
              MEET <span style={{ color: "var(--color-red)" }}>ME</span> CLUB · ESPACE PARTENAIRES
            </span>
          </div>

          <h1 style={{ color: "white", fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 800, marginBottom: "16px", lineHeight: 1.15 }}>
            Accueillez les rendez-vous Meet Me Club dans votre établissement
          </h1>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "18px", lineHeight: 1.6 }}>
            Restaurants, lounges, hôtels, rooftops : développez votre chiffre d&apos;affaires en devenant un lieu officiel de rendez-vous.
          </p>
        </div>
        <div aria-hidden style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "40px", background: "var(--color-gray-50)", clipPath: "ellipse(55% 100% at 50% 100%)" }} />
      </section>

      {/* Main Content */}
      <section className="section" style={{ background: "var(--color-gray-50)" }}>
        <div className="container" style={{ maxWidth: "860px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "24px", marginBottom: "40px" }}>
            <div className="card card-padded">
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>📈</div>
              <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-blue)", marginBottom: "8px" }}>
                Clientèle qualifiée & régulière
              </h3>
              <p style={{ color: "var(--color-gray-600)", fontSize: "14px", lineHeight: 1.6 }}>
                Des couples et célibataires vérifiés viennent consommer dans votre établissement pour des rendez-vous préparés et prépayés.
              </p>
            </div>

            <div className="card card-padded">
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>📲</div>
              <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-blue)", marginBottom: "8px" }}>
                Validation par QR code instantanée
              </h3>
              <p style={{ color: "var(--color-gray-600)", fontSize: "14px", lineHeight: 1.6 }}>
                Scannez le bon de réservation des membres avec votre smartphone en 2 secondes. Aucun matériel spécifique n&apos;est requis.
              </p>
            </div>

            <div className="card card-padded">
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>💰</div>
              <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-blue)", marginBottom: "8px" }}>
                Revenus garantis & virements rapides
              </h3>
              <p style={{ color: "var(--color-gray-600)", fontSize: "14px", lineHeight: 1.6 }}>
                Les réservations sont prépayées via T-Money / Flooz. Vous êtes réglé directement selon les forfaits consommés.
              </p>
            </div>
          </div>

          {/* Contact Partner Form */}
          <div className="card card-padded" style={{ background: "white", padding: "40px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--color-blue)", marginBottom: "8px" }}>
              Demande de partenariat
            </h2>
            <p style={{ color: "var(--color-gray-500)", fontSize: "14px", marginBottom: "28px" }}>
              Remplissez ce formulaire et notre équipe vous contactera sous 24 heures pour convenir d&apos;une visite de présentation.
            </p>

            <form style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label className="form-label">Nom de l&apos;établissement *</label>
                  <input type="text" className="form-input" placeholder="Ex: Le Cacao Lounge" required />
                </div>
                <div>
                  <label className="form-label">Type d&apos;établissement *</label>
                  <select className="form-input" required defaultValue="restaurant">
                    <option value="restaurant">Restaurant gastronomique</option>
                    <option value="lounge">Lounge Bar / Rooftop</option>
                    <option value="hotel">Hôtel / Espace VIP</option>
                    <option value="cafe">Café chic / Glacier</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label className="form-label">Ville et pays *</label>
                  <input type="text" className="form-input" placeholder="Ex : Abidjan, Côte d'Ivoire" required />
                </div>
                <div>
                  <label className="form-label">Numéro de téléphone (WhatsApp) *</label>
                  <input type="tel" className="form-input" placeholder="Numéro avec l'indicatif du pays" required />
                </div>
              </div>

              <div>
                <label className="form-label">Nom & fonction du responsable *</label>
                <input type="text" className="form-input" placeholder="Ex: Jean Mensah — Gérant" required />
              </div>

              <div>
                <label className="form-label">Message ou particularités</label>
                <textarea className="form-input" rows={3} placeholder="Ambiance, capacité d'accueil, formule proposée…" />
              </div>

              <button type="button" className="btn btn-primary" style={{ alignSelf: "flex-start", paddingInline: "28px" }}>
                Envoyer ma demande de partenariat →
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
