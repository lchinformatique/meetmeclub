// src/app/(public)/legal/cgu/page.tsx
// CGU (Conditions Générales d'Utilisation)

import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation",
};

export default function CGUPage() {
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
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "var(--color-blue)", margin: 0 }}>Conditions Générales d&apos;Utilisation</h1>
          <p style={{ color: "var(--color-gray-400)", fontSize: "14px", margin: 0 }}>Dernière mise à jour : Octobre 2026 · Meet Me Club Lomé</p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px", color: "var(--color-gray-700)", lineHeight: 1.8, fontSize: "15px" }}>
        <section>
          <h2 style={{ fontSize: "20px", color: "var(--color-blue)", marginBottom: "12px" }}>1. Objet</h2>
          <p>Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation de la plateforme Meet Me Club, accessible via l'application mobile et le site web meetmeclub.tg. Meet Me Club est une plateforme de mise en relation entre adultes majeurs (18 ans et plus) souhaitant se rencontrer dans des lieux soigneusement sélectionnés à Lomé, Togo.</p>
        </section>

        <section>
          <h2 style={{ fontSize: "20px", color: "var(--color-blue)", marginBottom: "12px" }}>2. Accès au service</h2>
          <p>L'inscription à Meet Me Club est strictement réservée aux personnes majeures (18 ans révolus). Toute tentative d'inscription par un mineur est interdite et entraînera la suppression immédiate du compte. La vérification de l'âge est effectuée lors de l'inscription par déclaration de la date de naissance, et peut faire l'objet de vérifications complémentaires (pièce d'identité).</p>
        </section>

        <section>
          <h2 style={{ fontSize: "20px", color: "var(--color-blue)", marginBottom: "12px" }}>3. Inscription et profil</h2>
          <p>L'utilisateur s'engage à fournir des informations exactes et à maintenir son profil à jour. Toute usurpation d'identité ou utilisation de fausses informations entraînera la suspension ou la suppression du compte sans préavis ni remboursement. Les photos de profil doivent représenter l'utilisateur lui-même et ne doivent contenir aucun contenu offensant ou illégal.</p>
        </section>

        <section>
          <h2 style={{ fontSize: "20px", color: "var(--color-blue)", marginBottom: "12px" }}>4. Utilisation du service</h2>
          <p>L'utilisateur s'engage à :</p>
          <ul style={{ paddingLeft: "24px", marginTop: "8px" }}>
            <li>Utiliser la plateforme de manière respectueuse envers les autres membres</li>
            <li>Ne pas publier de contenu offensant, discriminatoire, haineux ou à caractère pornographique</li>
            <li>Ne pas harceler, menacer ou intimider d'autres utilisateurs</li>
            <li>Ne pas utiliser la plateforme à des fins commerciales non autorisées</li>
            <li>Respecter la confidentialité des échanges privés</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: "20px", color: "var(--color-blue)", marginBottom: "12px" }}>5. Rendez-vous et paiements</h2>
          <p>Les packs de rendez-vous (Découverte, Complice, Dîner, VIP) sont payables d'avance via les moyens de paiement proposés (T-Money, Flooz, carte bancaire). Les conditions d'annulation et de remboursement varient selon le pack choisi et le délai d'annulation. Le détail est précisé lors de la réservation.</p>
        </section>

        <section>
          <h2 style={{ fontSize: "20px", color: "var(--color-blue)", marginBottom: "12px" }}>6. Responsabilité</h2>
          <p>Meet Me Club facilite la mise en relation et l'organisation logistique des rendez-vous, mais n'est en aucun cas responsable du comportement des utilisateurs lors de leurs rencontres. Meet Me Club ne garantit pas la compatibilité, la sincérité ou les intentions des membres.</p>
        </section>

        <section>
          <h2 style={{ fontSize: "20px", color: "var(--color-blue)", marginBottom: "12px" }}>7. Suppression de compte</h2>
          <p>L'utilisateur peut demander la suppression de son compte à tout moment depuis les paramètres de l'application. Les données personnelles seront supprimées conformément à notre politique de confidentialité, dans un délai de 30 jours.</p>
        </section>

        <section>
          <h2 style={{ fontSize: "20px", color: "var(--color-blue)", marginBottom: "12px" }}>8. Droit applicable</h2>
          <p>Les présentes CGU sont soumises au droit togolais. En cas de litige, les parties s'engagent à rechercher une solution amiable avant toute action judiciaire. Le tribunal compétent est celui de Lomé, République togolaise.</p>
        </section>

        <section>
          <h2 style={{ fontSize: "20px", color: "var(--color-blue)", marginBottom: "12px" }}>9. Contact</h2>
          <p>Pour toute question relative aux présentes CGU, contactez-nous à contact@meetmeclub.tg</p>
        </section>
      </div>
    </div>
  );
}
