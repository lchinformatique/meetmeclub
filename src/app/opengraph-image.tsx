// src/app/opengraph-image.tsx
// Image d'aperçu des liens partagés (WhatsApp, Facebook, Messenger, X, LinkedIn…) :
// logo officiel encadré + slogan + points forts, aux couleurs du club.

import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Meet Me Club — Plus qu'une rencontre, un rendez-vous ! Rencontres sérieuses et vérifiées, partout dans le monde.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const logo = await readFile(join(process.cwd(), "public", "logo-full.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  const point = (text: string) => (
    <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 28, color: "#E2E8F0" }}>
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          background: "#E10600",
          color: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          fontWeight: 700,
        }}
      >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7" /></svg>
      </div>
      <div style={{ display: "flex" }}>{text}</div>
    </div>
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #071530 0%, #0B2559 55%, #163B8A 100%)",
          position: "relative",
        }}
      >
        {/* Bande rouge décorative */}
        <div style={{ position: "absolute", left: 0, top: 0, width: 14, height: "100%", background: "#E10600", display: "flex" }} />

        {/* Logo encadré */}
        <div style={{ width: 500, height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div
            style={{
              width: 400,
              height: 400,
              borderRadius: 44,
              background: "#F7F7F7",
              border: "6px solid #E10600",
              boxShadow: "0 30px 70px rgba(0,0,0,0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} width={330} height={306} alt="" style={{ objectFit: "contain" }} />
          </div>
        </div>

        {/* Message */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", paddingRight: 64, gap: 22 }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 24, fontWeight: 700, letterSpacing: 4, color: "#FCA5A5" }}>
            <div style={{ width: 14, height: 14, background: "#E10600", transform: "rotate(45deg)", marginRight: 16, display: "flex" }} />
            CLUB PRIVÉ DE RENCONTRES · INTERNATIONAL
          </div>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 58, fontWeight: 800, color: "#FFFFFF", lineHeight: 1.08 }}>
            <div style={{ display: "flex" }}>Plus qu&apos;une rencontre,</div>
            <div style={{ display: "flex", color: "#FF4D4D" }}>un rendez-vous !</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 6 }}>
            {point("Membres réels et vérifiés")}
            {point("Chat privé et appels vidéo")}
            {point("Vrais rendez-vous dans les meilleurs lieux")}
          </div>
          <div style={{ display: "flex", marginTop: 10 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "16px 30px",
                borderRadius: 999,
                background: "#E10600",
                color: "#FFFFFF",
                fontSize: 28,
                fontWeight: 800,
              }}
            >
              Inscription gratuite
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              meetmeclub.net
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
