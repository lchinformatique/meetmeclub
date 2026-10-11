// src/app/(public)/layout.tsx
// Public pages layout — shared header/footer

import Link from "next/link";
import Image from "next/image";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Age Banner */}
      <div style={{ background: "var(--color-blue)", color: "white", textAlign: "center", padding: "8px 16px", fontSize: "13px", fontWeight: 500 }}>
        🔞 Site réservé aux adultes de 18 ans et plus
      </div>

      {/* Header */}
      <header style={{ height: "var(--header-height)", background: "white", boxShadow: "var(--shadow-sm)", position: "sticky", top: 0, zIndex: 100, display: "flex", alignItems: "center" }}>
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                overflow: "hidden",
                border: "2px solid rgba(11, 46, 107, 0.12)",
                background: "white",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                padding: "3px",
              }}
            >
              <Image src="/logo.png" alt="Meet Me Club" width={38} height={38} style={{ objectFit: "contain" }} priority />
            </div>
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
              <span style={{ fontWeight: 800, fontSize: "18px", color: "var(--color-blue)", letterSpacing: "-0.3px" }}>
                meet <span style={{ color: "var(--color-red)" }}>me</span> club
              </span>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-gray-400)", letterSpacing: "1px", textTransform: "uppercase" }}>
                Lomé · Togo
              </span>
            </div>
          </Link>
          <nav style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Link href="/tarifs" className="btn btn-ghost btn-sm">Tarifs</Link>
            <Link href="/connexion" className="btn btn-outline-blue btn-sm">Connexion</Link>
            <Link href="/inscription" className="btn btn-primary btn-sm">Rejoindre ❤️</Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main style={{ minHeight: "calc(100vh - var(--header-height) - 36px)" }}>
        {children}
      </main>

      {/* Footer */}
      <footer style={{ background: "var(--color-blue-dark)", color: "rgba(255,255,255,0.75)", padding: "48px 16px 24px" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "32px", marginBottom: "48px" }}>
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
              <p style={{ fontSize: "14px", lineHeight: 1.7 }}>Plus qu'une rencontre, un rendez-vous.</p>
            </div>
            <div>
              <h4 style={{ color: "white", marginBottom: "16px", fontSize: "15px" }}>Plateforme</h4>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
                {[["Le Concept", "/concept"], ["Tarifs", "/tarifs"], ["À propos", "/a-propos"], ["FAQ", "/faq"], ["Devenir partenaire", "/partenaires"]].map(([l, h]) => (
                  <li key={h}><Link href={h} style={{ color: "inherit", textDecoration: "none", fontSize: "14px" }}>{l}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 style={{ color: "white", marginBottom: "16px", fontSize: "15px" }}>Sécurité & Légal</h4>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
                {[["Sécurité & Confiance", "/securite"], ["CGU", "/legal/cgu"], ["Confidentialité", "/legal/confidentialite"], ["Mentions légales", "/legal/mentions"]].map(([l, h]) => (
                  <li key={h}><Link href={h} style={{ color: "inherit", textDecoration: "none", fontSize: "14px" }}>{l}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 style={{ color: "white", marginBottom: "16px", fontSize: "15px" }}>Contact & Assistance</h4>
              <p style={{ fontSize: "14px", lineHeight: 1.8 }}>
                <Link href="/contact" style={{ color: "white", fontWeight: 700, textDecoration: "none", display: "inline-block", marginBottom: "6px" }}>💬 Écrire au Support</Link><br />
                📧 contact@meetmeclub.tg<br />
                📍 Lomé, Togo
              </p>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "24px", textAlign: "center" }}>
            <p style={{ fontSize: "13px" }}>© {new Date().getFullYear()} Meet Me Club · 🔞 18+ · Lomé, Togo</p>
          </div>
        </div>
      </footer>
    </>
  );
}
