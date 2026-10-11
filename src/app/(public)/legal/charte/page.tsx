// src/app/(public)/legal/charte/page.tsx
// Charte de bonne conduite et de respect mutuel

import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Charte de bonne conduite",
  description: "Règles de respect, courtoisie et sécurité au sein de la communauté Meet Me Club à Lomé.",
};

export default function ChartePage() {
  return (
    <div style={{ background: "var(--color-gray-50)", minHeight: "80vh", paddingBlock: "50px" }}>
      <div className="container" style={{ maxWidth: "800px" }}>
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
            <h1 style={{ fontSize: "28px", fontWeight: 800, color: "var(--color-blue)", margin: 0 }}>
              Charte de bonne conduite
            </h1>
            <p style={{ color: "var(--color-gray-500)", fontSize: "14px", margin: 0 }}>
              Les valeurs fondamentales de la communauté Meet Me Club
            </p>
          </div>
        </div>

        <div className="card card-padded" style={{ background: "white", display: "flex", flexDirection: "column", gap: "24px" }}>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-blue)", marginBottom: "8px" }}>
              1. Respect et consentement mutuel
            </h2>
            <p style={{ color: "var(--color-gray-600)", fontSize: "14px", lineHeight: 1.7 }}>
              Chaque membre mérite d&apos;être traité avec courtoisie, considération et bienveillance. Aucun harcèlement, insulte, discrimination ou pression ne sera toléré. Le consentement libre et éclairé est obligatoire à chaque étape.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-blue)", marginBottom: "8px" }}>
              2. Authenticité des profils
            </h2>
            <p style={{ color: "var(--color-gray-600)", fontSize: "14px", lineHeight: 1.7 }}>
              Vos photos doivent correspondre à votre identité réelle. L&apos;utilisation d&apos;images trompeuses, de photos de tiers ou d&apos;avatars artificiels entraîne la suspension immédiate du compte.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-blue)", marginBottom: "8px" }}>
              3. Ponctualité et engagement lors des rendez-vous
            </h2>
            <p style={{ color: "var(--color-gray-600)", fontSize: "14px", lineHeight: 1.7 }}>
              Un rendez-vous accepté engage votre responsabilité envers l&apos;autre membre et l&apos;établissement partenaire. En cas d&apos;empêchement majeur, prévenez au moins 24 heures à l&apos;avance. Les absences répétées injustifiées (« ghosting ») font l&apos;objet de sanctions.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-blue)", marginBottom: "8px" }}>
              4. Respect des lieux partenaires
            </h2>
            <p style={{ color: "var(--color-gray-600)", fontSize: "14px", lineHeight: 1.7 }}>
              Adoptez une tenue et une attitude soignées dans nos restaurants, lounges et espaces VIP partenaires à Lomé. Présentez courtoisement votre QR code à l&apos;accueil.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-blue)", marginBottom: "8px" }}>
              5. Tolérance zéro envers les abus
            </h2>
            <p style={{ color: "var(--color-gray-600)", fontSize: "14px", lineHeight: 1.7 }}>
              Toute sollicitation financière, tentative de fraude, chantage ou proposition illicite entraîne le bannissement définitif et sans préavis du membre, avec signalement aux autorités compétentes le cas échéant.
            </p>
          </div>

          <div style={{ paddingTop: "16px", borderTop: "1px solid var(--color-gray-100)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <Link href="/" className="btn btn-outline-blue btn-sm">
              ← Retour à l&apos;accueil
            </Link>
            <Link href="/inscription" className="btn btn-primary btn-sm">
              J&apos;adhère et je m&apos;inscris ❤️
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
