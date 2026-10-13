// src/app/(auth)/layout.tsx
// Auth pages layout — centered, with logo and brand gradient background

import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--gradient-warm)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Sticky mini header */}
      <header
        style={{
          background: "white",
          boxShadow: "var(--shadow-sm)",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          href="/"
          style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              overflow: "hidden",
              border: "2px solid rgba(11, 46, 107, 0.12)",
              background: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Image src="/logo.png" alt="Meet Me Club" width={40} height={40} style={{ objectFit: "cover" }} priority />
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
            <span style={{ fontWeight: 800, fontSize: "17px", color: "var(--color-blue)" }}>
              meet <span style={{ color: "var(--color-red)" }}>me</span> club
            </span>
            <span style={{ fontSize: "9px", fontWeight: 700, color: "var(--color-gray-400)", letterSpacing: "1px", textTransform: "uppercase" }}>
              Club Privé International
            </span>
          </div>
        </Link>
        <span
          style={{
            fontSize: "12px",
            background: "rgba(225,6,0,0.1)",
            color: "var(--color-red)",
            padding: "4px 10px",
            borderRadius: "var(--radius-full)",
            fontWeight: 700,
          }}
        >
          🔞 18+ uniquement
        </span>
      </header>

      {/* Main */}
      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 16px",
        }}
      >
        <div style={{ width: "100%", maxWidth: "440px" }}>
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          textAlign: "center",
          padding: "16px",
          fontSize: "12px",
          color: "var(--color-gray-500)",
        }}
      >
        En continuant, vous acceptez nos{" "}
        <Link href="/legal/cgu" style={{ color: "var(--color-red)" }}>
          CGU
        </Link>{" "}
        et notre{" "}
        <Link href="/legal/confidentialite" style={{ color: "var(--color-red)" }}>
          Politique de confidentialité
        </Link>
        .
      </footer>
    </div>
  );
}
