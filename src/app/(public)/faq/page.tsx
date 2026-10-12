// src/app/(public)/faq/page.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface FAQItem {
  q: string;
  a: string;
  category: string;
}

const faqs: FAQItem[] = [
  {
    category: "Abonnements & Quotas",
    q: "Comment fonctionne le Plan Gratuit ?",
    a: "Le Plan Gratuit permet à toute personne de s'inscrire, de créer son profil complet avec ses coordonnées et ses photos, d'apparaître dans la base de données de Lomé et de choisir/échanger avec jusqu'à 3 partenaires distincts sans payer un seul franc. C'est l'idéal pour tester le service et faire ses premières rencontres !",
  },
  {
    category: "Abonnements & Quotas",
    q: "Que se passe-t-il après avoir contacté 3 partenaires avec le compte Gratuit ?",
    a: "Une fois votre quota de 3 partenaires atteint, le système vous invite à passer à l'un de nos abonnements mensuels (Pass Essentiel à 3 000 F, Pass Complice à 6 000 F, ou Pass VIP à 15 000 F) pour débloquer des contacts illimités et des avantages exclusifs.",
  },
  {
    category: "Abonnements & Quotas",
    q: "Quels modes de paiement sont acceptés au Togo ?",
    a: "Nous acceptons les paiements locaux les plus simples et rapides : T-Money (Togocom) et Moov Money (Flooz). L'activation de votre abonnement est immédiate.",
  },
  {
    category: "Échanges & Rencontres",
    q: "Dois-je obligatoirement organiser un rendez-vous physique ?",
    a: "Absolument pas ! Meet Me Club respecte votre rythme. Vous pouvez rester de simples amis, discuter par messagerie, vous envoyer des messages vocaux, des photos, et partager des idées sans aucune contrainte de sortie physique.",
  },
  {
    category: "Échanges & Rencontres",
    q: "Comment fonctionnent les messages vocaux et les appels vidéo ?",
    a: "Directement dans votre salon de discussion sécurisé ! Vous pouvez enregistrer et écouter des messages vocaux d'un clic, ou lancer un appel vidéo en direct pour être 100% sûr(e) de l'identité de votre interlocuteur.",
  },
  {
    category: "Sécurité & Lieux",
    q: "Où se déroulent les rendez-vous si je souhaite faire une sortie ?",
    a: "Si vous décidez d'aller boire un verre ou dîner, vous pouvez choisir parmi notre réseau d'établissements partenaires sécurisés à Lomé (Hôtels, Lounges, Salons de thé). Des réductions exclusives et des accueils VIP y sont réservés pour nos membres.",
  },
  {
    category: "Sécurité & Lieux",
    q: "Comment contacter l'assistance en cas de besoin ?",
    a: "Un bouton WhatsApp direct et notre assistant interactif 24/7 sont disponibles en permanence en bas à droite de votre écran pour répondre instantanément à toutes vos interrogations.",
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

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
            <span style={{ fontSize: "13px", fontWeight: 700, color: "white" }}>QUESTIONS FRÉQUENTES</span>
          </div>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 2.8rem)", fontWeight: 800, marginBottom: "16px" }}>
            Tout ce que vous devez savoir
          </h1>
          <p style={{ fontSize: "17px", color: "#E2E8F0", lineHeight: 1.6 }}>
            Consultez nos réponses pour profiter au maximum de votre expérience Meet Me Club au Togo.
          </p>
        </div>
      </section>

      {/* Accordion FAQ */}
      <section className="container" style={{ maxWidth: "860px", padding: "60px 20px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {faqs.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                style={{
                  background: "white",
                  borderRadius: "16px",
                  border: isOpen ? "1px solid #0B2559" : "1px solid #E2E8F0",
                  boxShadow: isOpen ? "0 6px 20px rgba(11,37,89,0.08)" : "0 2px 8px rgba(0,0,0,0.02)",
                  overflow: "hidden",
                  transition: "all 0.2s ease",
                }}
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "20px 24px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    gap: "16px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "white", background: "#0B2559", padding: "3px 8px", borderRadius: "6px" }}>
                      {item.category}
                    </span>
                    <span style={{ fontSize: "16px", fontWeight: 700, color: "#0F172A" }}>
                      {item.q}
                    </span>
                  </div>
                  <span style={{ fontSize: "18px", color: "#0B2559", fontWeight: 800, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s ease" }}>
                    ▼
                  </span>
                </button>
                {isOpen && (
                  <div style={{ padding: "0 24px 22px", color: "#475569", fontSize: "14px", lineHeight: 1.7, borderTop: "1px solid #F1F5F9", paddingTop: "14px" }}>
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Still have questions */}
        <div style={{ marginTop: "50px", textAlign: "center", background: "white", padding: "32px", borderRadius: "20px", border: "1px solid #E2E8F0" }}>
          <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#0F172A", marginBottom: "8px" }}>Vous avez encore une question ?</h3>
          <p style={{ fontSize: "14px", color: "#64748B", marginBottom: "20px" }}>Notre équipe et notre assistant interactif sont là pour vous aider à tout moment.</p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/contact" className="btn btn-outline-blue">
              Page de contact
            </Link>
            <a
              href="https://wa.me/22890283580?text=Bonjour%20Meet%20Me%20Club%2C%20je%20souhaite%20continuer%20la%20discussion."
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              Écrire sur WhatsApp (+228 90 28 35 80)
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
