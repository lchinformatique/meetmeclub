"use client";
// src/components/MobileBottomNav.tsx
// Native-like mobile bottom navigation bar for iPhone, Android & tablets

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Accueil", icon: "🏠" },
  { href: "/decouverte", label: "Découvrir", icon: "🔍" },
  { href: "/messages", label: "Messages", icon: "💬", badge: 1 },
  { href: "/rendez-vous", label: "Sorties", icon: "📅" },
  { href: "/profil", label: "Profil", icon: "👤" },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  // Don't show bottom nav inside full onboarding wizard
  if (pathname === "/onboarding") return null;

  return (
    <nav className="mobile-bottom-nav" aria-label="Navigation mobile">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`mobile-nav-item ${isActive ? "active" : ""}`}
          >
            <div className="mobile-nav-icon-wrapper">
              <span className="mobile-nav-icon">{item.icon}</span>
              {item.badge && (
                <span className="mobile-nav-badge">{item.badge}</span>
              )}
            </div>
            <span className="mobile-nav-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
