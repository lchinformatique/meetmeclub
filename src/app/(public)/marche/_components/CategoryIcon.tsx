// Icônes professionnelles des catégories du Marché, chacune avec une teinte douce.

import {
  BedDouble,
  Briefcase,
  Building2,
  Car,
  Hammer,
  Handshake,
  HeartPulse,
  Package,
  PartyPopper,
  Shirt,
  ShoppingBasket,
  Smartphone,
  Sofa,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

export const CATEGORY_STYLE: Record<string, { Icon: LucideIcon; tint: string; bg: string }> = {
  HOTEL: { Icon: BedDouble, tint: "#4F6BD8", bg: "#EEF2FD" },
  RESTAURANT: { Icon: UtensilsCrossed, tint: "#D9774B", bg: "#FDF1EB" },
  REAL_ESTATE: { Icon: Building2, tint: "#3D8C7A", bg: "#EAF5F2" },
  EVENTS: { Icon: PartyPopper, tint: "#B05FC4", bg: "#F6EEF9" },
  FASHION: { Icon: Shirt, tint: "#D0607F", bg: "#FCEEF2" },
  ARTISAN: { Icon: Hammer, tint: "#9A7348", bg: "#F6F0E9" },
  SERVICES: { Icon: Handshake, tint: "#3E8BC2", bg: "#EBF4FA" },
  ELECTRONICS: { Icon: Smartphone, tint: "#5A6B86", bg: "#EEF1F5" },
  HOME: { Icon: Sofa, tint: "#7D6BC4", bg: "#F1EFFA" },
  VEHICLES: { Icon: Car, tint: "#C2554F", bg: "#FBEDEC" },
  FOOD: { Icon: ShoppingBasket, tint: "#5E9B4C", bg: "#EEF6EB" },
  HEALTH: { Icon: HeartPulse, tint: "#D45A6A", bg: "#FCEEF0" },
  JOBS: { Icon: Briefcase, tint: "#4C6E91", bg: "#ECF1F6" },
  OTHER: { Icon: Package, tint: "#7A8597", bg: "#F1F3F6" },
};

export default function CategoryIcon({ category, size = 22, boxed = true }: { category: string; size?: number; boxed?: boolean }) {
  const st = CATEGORY_STYLE[category] || CATEGORY_STYLE.OTHER;
  const { Icon } = st;
  if (!boxed) return <Icon size={size} color={st.tint} strokeWidth={1.8} aria-hidden />;
  const box = Math.round(size * 2.1);
  return (
    <span
      aria-hidden
      style={{
        width: box,
        height: box,
        borderRadius: Math.round(box * 0.32),
        background: st.bg,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Icon size={size} color={st.tint} strokeWidth={1.8} />
    </span>
  );
}
