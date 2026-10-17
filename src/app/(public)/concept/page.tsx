// src/app/(public)/concept/page.tsx
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Le Concept | Meet Me Club",
  description: "Découvrez le concept Meet Me Club : de la discussion authentique au rendez-vous sécurisé dans les meilleurs lieux.",
};

export default function ConceptPage() {
  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      {/* Hero */}
      <section style={{ background: "linear-gradient(135deg, #0B2559 0%, #071530 100%)", padding: "70px 20px", color: "white", textAlign: "center" }}>
        <div className="container" style={{ maxWidth: "800px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              background: "rgba(255, 255, 255, 0.12)",
              backdropFilter: "blur(10px)",
              padding: "6px 16px 6px 6px",
              borderRadius: "9999px",
              marginBottom: "18px",
            }}
          >
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "white", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "2px solid #E10600" }}>
              <Image src="/logo.png" alt="Logo" width={28} height={28} style={{ objectFit: "contain" }} priority />
            </div>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "white" }}>MEET ME CLUB · NOTRE VISION</span>
          </div>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 800, marginBottom: "16px" }}>
            « Plus qu'une rencontre, un rendez-vous ! »
          </h1>
          <p style={{ fontSize: "17px", color: "#E2E8F0", lineHeight: 1.6 }}>
            Une expérience sécurisée et authentique, partout dans le monde. Échangez librement (amitié, partage d'idées, amour) et passez du virtuel au réel quand vous vous sentez prêt(e).
          </p>
        </div>
      </section>

      {/* Pillars */}
      <section className="container" style={{ maxWidth: "1000px", padding: "60px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
          <div className="card" style={{ background: "white", padding: "32px 24px", borderRadius: "20px", border: "1px solid #E2E8F0" }}>
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>🤝</div>
            <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#0F172A", marginBottom: "8px" }}>Liberté totale d'échange</h3>
            <p style={{ fontSize: "14px", color: "#475569", lineHeight: 1.6 }}>
              Aucune contrainte de rendez-vous obligatoire immédiat. Vous pouvez commencer par échanger par messages, partager des vocaux, photos et positions GPS, ou faire un appel vidéo en direct.
            </p>
          </div>

          <div className="card" style={{ background: "white", padding: "32px 24px", borderRadius: "20px", border: "1px solid #E2E8F0" }}>
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>🛡️</div>
            <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#0F172A", marginBottom: "8px" }}>Sécurité & Vérification 100%</h3>
            <p style={{ fontSize: "14px", color: "#475569", lineHeight: 1.6 }}>
              Finis les faux profils. Grâce à notre système d'appel vidéo et de vérification humaine, vous savez exactement à qui vous parlez avant même votre première sortie.
            </p>
          </div>

          <div className="card" style={{ background: "white", padding: "32px 24px", borderRadius: "20px", border: "1px solid #E2E8F0" }}>
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>🍷</div>
            <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#0F172A", marginBottom: "8px" }}>Cadres prestigieux</h3>
            <p style={{ fontSize: "14px", color: "#475569", lineHeight: 1.6 }}>
              Quand vous décidez de vous rencontrer, nous réservons votre table dans nos établissements partenaires réputés (hôtels, restaurants et lounges sélectionnés), avec boissons et repas inclus.
            </p>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "48px" }}>
          <Link href="/inscription" className="btn btn-primary btn-lg" style={{ padding: "16px 36px", borderRadius: "14px", fontWeight: 800 }}>
            Rejoindre la communauté Meet Me Club ❤️
          </Link>
        </div>
      </section>
    </div>
  );
}
