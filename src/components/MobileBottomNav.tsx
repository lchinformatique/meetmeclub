"use client";
// src/components/MobileBottomNav.tsx
// Professional native mobile bottom navigation bar with real SVG application icons

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, MessageSquare, Calendar, User } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Accueil", Icon: Home },
  { href: "/decouverte", label: "Découvrir", Icon: Compass },
  { href: "/messages", label: "Messages", Icon: MessageSquare, badge: 1 },
  { href: "/rendez-vous", label: "Sorties", Icon: Calendar },
  { href: "/profil", label: "Profil", Icon: User },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  // Hide bottom nav on auth flow & onboarding wizards for clean UX
  if (
    pathname === "/onboarding" ||
    pathname === "/inscription" ||
    pathname === "/connexion"
  ) {
    return null;
  }

  return (
    <nav className="mobile-bottom-nav" aria-label="Navigation mobile principale">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const IconComponent = item.Icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`mobile-nav-item ${isActive ? "active" : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            <div className="mobile-nav-icon-wrapper">
              <IconComponent
                className="mobile-nav-icon"
                size={20}
                strokeWidth={isActive ? 2.5 : 1.9}
              />
              {Boolean(item.badge) && (
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
