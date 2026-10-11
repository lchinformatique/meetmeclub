// src/app/(public)/securite/page.tsx
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sécurité & Confiance | Meet Me Club Togo",
  description: "Notre engagement pour votre sécurité : vérification vidéo, lieux partenaires surveillés à Lomé, et modération 24/7.",
};

export default function SecuritePage() {
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
            <span style={{ fontSize: "13px", fontWeight: 700, color: "white" }}>SÉCURITÉ & BIENVEILLANCE</span>
          </div>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 2.8rem)", fontWeight: 800, marginBottom: "16px" }}>
            Votre sécurité est notre priorité absolue
          </h1>
          <p style={{ fontSize: "17px", color: "#E2E8F0", lineHeight: 1.6 }}>
            Rencontrez des personnes réelles et bienveillantes à Lomé dans un environnement contrôlé, respectueux et vérifié.
          </p>
        </div>
      </section>

      {/* Mesures de sécurité */}
      <section className="container" style={{ maxWidth: "1000px", padding: "60px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", marginBottom: "50px" }}>
          <div className="card" style={{ background: "white", padding: "32px 24px", borderRadius: "20px", border: "1px solid #E2E8F0", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: "36px", marginBottom: "14px" }}>📹</div>
            <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#0F172A", marginBottom: "8px" }}>Appel Vidéo de Vérification</h3>
            <p style={{ fontSize: "14px", color: "#475569", lineHeight: 1.6 }}>
              Vérifiez directement l'identité de votre interlocuteur avant toute rencontre physique. Aucun risque de mauvaises surprises ou de profils usurpés.
            </p>
          </div>

          <div className="card" style={{ background: "white", padding: "32px 24px", borderRadius: "20px", border: "1px solid #E2E8F0", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: "36px", marginBottom: "14px" }}>📍</div>
            <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#0F172A", marginBottom: "8px" }}>Partage GPS Sécurisé</h3>
            <p style={{ fontSize: "14px", color: "#475569", lineHeight: 1.6 }}>
              Partagez facilement votre position géographique sur WhatsApp ou Google Maps avec vos proches lorsque vous partez à un rendez-vous.
            </p>
          </div>

          <div className="card" style={{ background: "white", padding: "32px 24px", borderRadius: "20px", border: "1px solid #E2E8F0", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: "36px", marginBottom: "14px" }}>☕</div>
            <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#0F172A", marginBottom: "8px" }}>Lieux Partenaires Sélectionnés</h3>
            <p style={{ fontSize: "14px", color: "#475569", lineHeight: 1.6 }}>
              Tous nos établissements partenaires à Lomé (hôtels, salons de thé, lounges) sont des espaces publics sécurisés et de grande renommée.
            </p>
          </div>
        </div>

        {/* 5 Règles d'Or */}
        <div style={{ background: "white", padding: "40px 32px", borderRadius: "24px", border: "1px solid #E2E8F0", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", marginBottom: "50px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#0B2559", marginBottom: "20px" }}>
            🛡️ Les 5 Règles d'Or pour vos rencontres à Lomé
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {[
              { num: "1", title: "Faites un appel vidéo avant de vous voir", desc: "Quelques minutes d'échange vocal ou vidéo suffisent pour confirmer la sympathie et l'authenticité de la personne." },
              { num: "2", title: "Choisissez toujours un lieu public pour le premier rendez-vous", desc: "Privilégiez les établissements partenaires Meet Me Club ou un café très fréquenté en journée." },
              { num: "3", title: "Prévenez un(e) ami(e) ou un proche", desc: "Partagez l'adresse du rendez-vous et convenez d'un appel rassurant en fin de rencontre." },
              { num: "4", title: "Restez maître de votre transport", desc: "Déplacez-vous par vos propres moyens (voiture, moto personnelle ou taxi officiel)." },
              { num: "5", title: "Ne partagez jamais vos coordonnées bancaires ou codes secrets", desc: "Meet Me Club n'exige aucun paiement direct entre membres. Les abonnements se font exclusivement via notre interface sécurisée T-Money et Flooz." },
            ].map((rule) => (
              <div key={rule.num} style={{ display: "flex", gap: "16px", alignItems: "flex-start", padding: "12px 16px", background: "#F8FAFC", borderRadius: "12px" }}>
                <span style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#0B2559", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, flexShrink: 0, fontSize: "14px" }}>
                  {rule.num}
                </span>
                <div>
                  <h4 style={{ fontSize: "16px", fontWeight: 700, color: "#0F172A", marginBottom: "4px" }}>{rule.title}</h4>
                  <p style={{ fontSize: "14px", color: "#64748B", margin: 0, lineHeight: 1.5 }}>{rule.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center" }}>
          <Link href="/inscription" className="btn btn-primary btn-lg" style={{ padding: "16px 36px", fontSize: "16px", fontWeight: 800 }}>
            Rejoindre la communauté en toute confiance ❤️
          </Link>
        </div>
      </section>
    </div>
  );
}
