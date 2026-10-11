// src/app/(public)/legal/confidentialite/page.tsx
// Politique de confidentialité

import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de Confidentialité",
};

export default function ConfidentialitePage() {
  return (
    <div className="section" style={{ maxWidth: "780px", margin: "0 auto", padding: "48px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "24px" }}>
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            overflow: "hidden",
            border: "2px solid var(--color-red)",
            background: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 10px rgba(225, 6, 0, 0.15)",
            flexShrink: 0,
          }}
        >
          <Image src="/logo.png" alt="Meet Me Club" width={44} height={44} style={{ objectFit: "cover" }} />
        </div>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "var(--color-blue)", margin: 0 }}>Politique de Confidentialité</h1>
          <p style={{ color: "var(--color-gray-400)", fontSize: "14px", margin: 0 }}>Dernière mise à jour : Octobre 2026 · Meet Me Club Lomé</p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px", color: "var(--color-gray-700)", lineHeight: 1.8, fontSize: "15px" }}>
        <section>
          <h2 style={{ fontSize: "20px", color: "var(--color-blue)", marginBottom: "12px" }}>1. Données collectées</h2>
          <p>Nous collectons les données suivantes lors de votre inscription et de l'utilisation du service :</p>
          <ul style={{ paddingLeft: "24px", marginTop: "8px" }}>
            <li><strong>Identité</strong> : prénom, pseudo, date de naissance, genre</li>
            <li><strong>Contact</strong> : numéro de téléphone et/ou adresse email</li>
            <li><strong>Profil</strong> : photos, bio, centres d'intérêt, ville, profession</li>
            <li><strong>Utilisation</strong> : historique de navigation, rendez-vous, messages échangés</li>
            <li><strong>Technique</strong> : adresse IP, type d'appareil, système d'exploitation</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: "20px", color: "var(--color-blue)", marginBottom: "12px" }}>2. Finalité du traitement</h2>
          <p>Vos données sont utilisées pour :</p>
          <ul style={{ paddingLeft: "24px", marginTop: "8px" }}>
            <li>Permettre votre inscription et gérer votre compte</li>
            <li>Faciliter la mise en relation avec d'autres membres</li>
            <li>Organiser les rendez-vous et les réservations</li>
            <li>Vérifier votre identité et votre âge (18+)</li>
            <li>Assurer la sécurité de la plateforme et prévenir les fraudes</li>
            <li>Vous envoyer des notifications relatives à vos rendez-vous</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: "20px", color: "var(--color-blue)", marginBottom: "12px" }}>3. Partage de données</h2>
          <p>Vos données ne sont jamais vendues. Elles peuvent être partagées avec :</p>
          <ul style={{ paddingLeft: "24px", marginTop: "8px" }}>
            <li><strong>Lieux partenaires</strong> : prénom uniquement, pour la réservation du rendez-vous</li>
            <li><strong>Prestataires techniques</strong> : hébergement, envoi SMS/email, paiement (données minimales)</li>
            <li><strong>Autorités</strong> : sur réquisition judiciaire uniquement</li>
          </ul>
          <p style={{ marginTop: "8px" }}>Votre numéro de téléphone, adresse email et localisation exacte ne sont jamais affichés sur votre profil public.</p>
        </section>

        <section>
          <h2 style={{ fontSize: "20px", color: "var(--color-blue)", marginBottom: "12px" }}>4. Durée de conservation</h2>
          <ul style={{ paddingLeft: "24px" }}>
            <li>Données de profil : durée d'utilisation du compte + 30 jours après suppression</li>
            <li>Messages : 12 mois après envoi</li>
            <li>Logs de connexion : 12 mois</li>
            <li>Données de paiement : 5 ans (obligation légale)</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: "20px", color: "var(--color-blue)", marginBottom: "12px" }}>5. Vos droits</h2>
          <p>Conformément à la législation togolaise sur la protection des données, vous disposez des droits suivants :</p>
          <ul style={{ paddingLeft: "24px", marginTop: "8px" }}>
            <li><strong>Accès</strong> : consulter l'ensemble de vos données personnelles</li>
            <li><strong>Rectification</strong> : corriger des informations inexactes</li>
            <li><strong>Suppression</strong> : demander la suppression de votre compte et données</li>
            <li><strong>Portabilité</strong> : recevoir vos données dans un format exploitable</li>
            <li><strong>Opposition</strong> : vous opposer à certains traitements</li>
          </ul>
          <p style={{ marginTop: "8px" }}>Pour exercer ces droits, contactez-nous à <strong>privacy@meetmeclub.tg</strong></p>
        </section>

        <section>
          <h2 style={{ fontSize: "20px", color: "var(--color-blue)", marginBottom: "12px" }}>6. Sécurité</h2>
          <p>Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles pour protéger vos données : chiffrement en transit (TLS), hashage des mots de passe et codes OTP, contrôle d'accès strict, et audits réguliers.</p>
        </section>

        <section>
          <h2 style={{ fontSize: "20px", color: "var(--color-blue)", marginBottom: "12px" }}>7. Contact</h2>
          <p>Pour toute question relative à la protection de vos données : <strong>privacy@meetmeclub.tg</strong></p>
        </section>
      </div>
    </div>
  );
}
