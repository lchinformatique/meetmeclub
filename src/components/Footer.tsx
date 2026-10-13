// src/components/Footer.tsx
// Footer épuré scindé en 3 parties compactes sur fond bleu pour iPhone & smartphone

import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Mail, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer
      style={{
        background: "var(--color-blue-dark)",
        color: "rgba(255, 255, 255, 0.75)",
        padding: "32px 16px 20px",
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
      }}
    >
      <div className="container" style={{ maxWidth: "1100px", margin: "0 auto" }}>
        {/* Grille scindée en 3 parties compactes */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "24px",
            marginBottom: "24px",
          }}
          className="footer-three-parts-grid"
        >
          {/* ── 1ère Partie : Identité & Contact ── */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
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
                  padding: "2px",
                }}
              >
                <Image src="/logo.png" alt="Meet Me Club" width={30} height={30} style={{ objectFit: "contain" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
                <span style={{ fontWeight: 800, fontSize: "16px", color: "white" }}>
                  meet <span style={{ color: "var(--color-red)" }}>me</span> club
                </span>
                <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", fontStyle: "italic" }}>
                  Plus qu&apos;une rencontre, un rendez-vous !
                </span>
              </div>
            </div>

            <p style={{ fontSize: "12px", lineHeight: 1.5, color: "rgba(255,255,255,0.65)", marginBottom: "10px" }}>
              Le club privé international de vraies rencontres avec réservation au Togo.
            </p>

            <div style={{ fontSize: "12px", display: "flex", flexDirection: "column", gap: "4px", color: "rgba(255,255,255,0.8)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <MapPin size={13} className="text-red-400" />
                <span>Lomé, Togo</span>
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <Mail size={13} className="text-amber-300" />
                <span>contact@meetmeclub.tg</span>
              </span>
            </div>
          </div>

          {/* ── 2ème Partie : Navigation Essentielle ── */}
          <div>
            <h4 style={{ color: "white", marginBottom: "10px", fontSize: "12px", letterSpacing: "0.8px", textTransform: "uppercase", fontWeight: 800 }}>
              Navigation
            </h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "8px", padding: 0, margin: 0 }}>
              {[
                ["Découvrir les profils", "/decouverte"],
                ["Nos tarifs & plans", "/tarifs"],
                ["Rejoindre le club", "/rejoindre"],
                ["Lieux partenaires à Lomé", "/partenaires"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link
                    href={href}
                    style={{
                      color: "rgba(255,255,255,0.72)",
                      textDecoration: "none",
                      fontSize: "13px",
                      transition: "color 0.15s ease",
                    }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── 3ème Partie : Sécurité, Charte & Légal ── */}
          <div>
            <h4 style={{ color: "white", marginBottom: "10px", fontSize: "12px", letterSpacing: "0.8px", textTransform: "uppercase", fontWeight: 800 }}>
              Sécurité & Légal
            </h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "8px", padding: 0, margin: 0 }}>
              {[
                ["Charte de confidentialité", "/legal/confidentialite"],
                ["Conditions d'utilisation (CGU)", "/legal/cgu"],
                ["Mentions légales", "/legal/mentions"],
                ["Assistance & Contact", "/contact"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link
                    href={href}
                    style={{
                      color: "rgba(255,255,255,0.72)",
                      textDecoration: "none",
                      fontSize: "13px",
                      transition: "color 0.15s ease",
                    }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Barre Basse Copyright & 18+ ── */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.08)",
            paddingTop: "14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", margin: 0 }}>
            © {new Date().getFullYear()} Meet Me Club · Tous droits réservés.
          </p>
          <p style={{ fontSize: "11px", display: "flex", alignItems: "center", gap: "5px", color: "rgba(255,255,255,0.5)", margin: 0 }}>
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>Accès strictement réservé aux 18 ans et plus</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
