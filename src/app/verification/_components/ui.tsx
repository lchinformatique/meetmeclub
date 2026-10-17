// src/app/verification/_components/ui.tsx
// Styles et petits éléments partagés par les trois parcours de vérification.

import type { CSSProperties, ReactNode } from "react";
import { Clock, XCircle } from "lucide-react";

export const NAVY = "#0B2559";
export const RED = "#E10600";

export type Status = "NONE" | "PENDING" | "APPROVED" | "REJECTED";

export interface VerificationData {
  configured: boolean;
  docsConfigured?: boolean;
  plan: "FREE" | "ESSENTIAL" | "COMPLICE" | "VIP";
  verified: boolean;
  callsAllowed: boolean;
  isAdmin?: boolean;
  hasProfile?: boolean;
  hasProfilePhoto?: boolean;
  selfie?: { status: Status; gestureText: string | null; note: string | null };
  document?: { status: Status; typeLabel: string | null; note: string | null; reviewedBy: string | null };
  video?: { status: Status; code: string | null; note: string | null };
  documentTypes?: Record<string, string>;
}

export const card: CSSProperties = {
  background: "white",
  borderRadius: 24,
  border: "1px solid #E2E8F0",
  boxShadow: "0 10px 30px rgba(11,37,89,0.08)",
  padding: "28px 22px",
  textAlign: "center",
};

export const primaryBtn: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  width: "100%",
  padding: "15px 20px",
  borderRadius: 14,
  border: "none",
  background: RED,
  color: "white",
  fontWeight: 800,
  fontSize: 16,
  cursor: "pointer",
  textDecoration: "none",
};

export const secondaryBtn: CSSProperties = {
  ...primaryBtn,
  background: "white",
  color: NAVY,
  border: `2px solid ${NAVY}`,
};

export const title: CSSProperties = { fontSize: 22, fontWeight: 800, color: NAVY, margin: "0 0 6px" };
export const lead: CSSProperties = { color: "#3B4658", fontSize: 14, lineHeight: 1.6, margin: "0 0 16px" };

export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        border: "3px solid rgba(255,255,255,0.4)",
        borderTopColor: "currentColor",
        borderRadius: "50%",
        display: "inline-block",
        animation: "spin 0.8s linear infinite",
      }}
    />
  );
}

export function Rejected({ note }: { note?: string | null }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        textAlign: "left",
        background: "#FEF2F2",
        border: "1px solid #FECACA",
        borderRadius: 14,
        padding: "12px 14px",
        marginBottom: 18,
        color: "#991B1B",
        fontSize: 14,
        lineHeight: 1.5,
      }}
    >
      <XCircle size={20} style={{ flexShrink: 0, marginTop: 1 }} />
      <span>
        <strong>Vérification non validée.</strong> {note || "Recommencez en suivant les consignes."}
      </span>
    </div>
  );
}

export function Pending({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <div style={card}>
      <Clock size={56} color="#D97706" style={{ margin: "0 auto 12px" }} />
      <h1 style={{ ...title, fontSize: 24 }}>{heading}</h1>
      <div style={{ ...lead, margin: 0 }}>{children}</div>
    </div>
  );
}

export function Privacy({ children }: { children: ReactNode }) {
  return <p style={{ fontSize: 12, color: "#505D70", lineHeight: 1.5, marginTop: 18, marginBottom: 0 }}>🔒 {children}</p>;
}

export function ErrorText({ children }: { children: ReactNode }) {
  return <p style={{ color: "#B91C1C", fontWeight: 600, fontSize: 14, marginTop: 14, marginBottom: 0 }}>{children}</p>;
}

/** Réduit une photo (≤ 1600 px) et la convertit en JPEG pour l'envoi */
export async function toJpeg(file: Blob, max = 1600): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("conversion"))), "image/jpeg", 0.85)
  );
}
