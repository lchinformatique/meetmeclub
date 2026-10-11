// src/app/(public)/legal/mentions/page.tsx
// Mentions légales

import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions Légales",
};

export default function MentionsPage() {
  return (
    <div className="section" style={{ maxWidth: "780px", margin: "0 auto", padding: "48px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "28px" }}>
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
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "var(--color-blue)", margin: 0 }}>Mentions Légales</h1>
          <p style={{ color: "var(--color-gray-400)", fontSize: "14px", margin: 0 }}>Meet Me Club SARL · Lomé, Togo</p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px", color: "var(--color-gray-700)", lineHeight: 1.8, fontSize: "15px" }}>
        <section>
          <h2 style={{ fontSize: "20px", color: "var(--color-blue)", marginBottom: "12px" }}>Éditeur du site</h2>
          <p><strong>Meet Me Club</strong><br />
          Société à responsabilité limitée (SARL)<br />
          Siège social : Lomé, Togo<br />
          RCCM : [En cours d'immatriculation]<br />
          Email : contact@meetmeclub.tg</p>
        </section>

        <section>
          <h2 style={{ fontSize: "20px", color: "var(--color-blue)", marginBottom: "12px" }}>Directeur de publication</h2>
          <p>[Nom du directeur de publication]</p>
        </section>

        <section>
          <h2 style={{ fontSize: "20px", color: "var(--color-blue)", marginBottom: "12px" }}>Hébergement</h2>
          <p><strong>Vercel Inc.</strong><br />
          340 S Lemon Ave #4133, Walnut, CA 91789, USA<br />
          Site : vercel.com</p>
        </section>

        <section>
          <h2 style={{ fontSize: "20px", color: "var(--color-blue)", marginBottom: "12px" }}>Propriété intellectuelle</h2>
          <p>L'ensemble du contenu du site meetmeclub.tg (textes, images, logos, design) est protégé par le droit d'auteur et la propriété intellectuelle. Toute reproduction, même partielle, est interdite sans autorisation préalable.</p>
        </section>

        <section>
          <h2 style={{ fontSize: "20px", color: "var(--color-blue)", marginBottom: "12px" }}>Restriction d'âge</h2>
          <p>L'accès à Meet Me Club est strictement réservé aux personnes majeures (18 ans et plus). Un mécanisme de vérification de l'âge est mis en place à l'inscription.</p>
        </section>
      </div>
    </div>
  );
}
