// Types et styles partagés de l'Espace Pro (côté navigateur)

import type { CSSProperties } from "react";

export const NAVY = "#0B2559";
export const RED = "#E10600";

export interface ProSpace {
  id: string;
  slug: string;
  name: string;
  activity: string;
  logoUrl: string | null;
  coverUrl: string | null;
  description: string | null;
  city: string | null;
  neighborhood: string | null;
  whatsapp: string | null;
  facebook: string | null;
  phone: string | null;
  website: string | null;
  isActive: boolean;
}

export interface MyListing {
  id: string;
  title: string;
  category: string;
  kind: "SALE" | "SERVICE";
  price: number | null;
  priceLabel: string | null;
  photos: string[];
  status: "ACTIVE" | "SOLD" | "REMOVED" | "DELETED";
  views: number;
  removedReason: string | null;
  createdAt: string;
}

export const field: CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  border: "1.5px solid #CBD5E1",
  fontSize: 15,
  color: "#0F172A",
  background: "#fff",
  boxSizing: "border-box",
};

export const label: CSSProperties = { display: "block", fontSize: 13, fontWeight: 800, color: NAVY, marginBottom: 5 };

export const primaryBtn: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  width: "100%",
  padding: "14px 18px",
  borderRadius: 14,
  border: "none",
  background: RED,
  color: "#fff",
  fontWeight: 800,
  fontSize: 16,
  cursor: "pointer",
  textDecoration: "none",
};

export const panel: CSSProperties = {
  background: "#fff",
  borderRadius: 20,
  padding: 16,
  boxShadow: "0 6px 20px rgba(11,37,89,0.07)",
};
