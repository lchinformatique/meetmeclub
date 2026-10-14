"use client";
// src/components/MobileBottomNav.tsx
// Professional native mobile bottom navigation bar with real SVG application icons

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, MessageSquare, Calendar, User } from "lucide-react";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Check real authentication status
  useEffect(() => {
    let isMounted = true;
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setIsAuthenticated(Boolean(data.authenticated && data.user));
        } else if (isMounted) {
          setIsAuthenticated(false);
        }
      } catch {
        if (isMounted) setIsAuthenticated(false);
      }
    }
    checkAuth();
    return () => {
      isMounted = false;
    };
  }, [pathname]);

  // Hide bottom nav on auth flow, onboarding & messaging for clean full-screen WhatsApp UX
  if (
    pathname === "/onboarding" ||
    pathname === "/inscription" ||
    pathname === "/connexion" ||
    pathname.startsWith("/messages")
  ) {
    return null;
  }

  const navItems = [
    { href: "/", label: "Accueil", Icon: Home },
    { href: "/decouverte", label: "Découvrir", Icon: Compass },
    {
      href: isAuthenticated ? "/messages" : "/connexion?callbackUrl=/messages",
      activeHref: "/messages",
      label: "Messages",
      Icon: MessageSquare,
      badge: undefined,
    },
    { href: "/rendez-vous", label: "Sorties", Icon: Calendar },
    {
      href: isAuthenticated ? "/profil" : "/connexion?callbackUrl=/profil",
      activeHref: "/profil",
      label: "Profil",
      Icon: User,
    },
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="Navigation mobile principale">
      {navItems.map((item) => {
        const matchHref = item.activeHref || item.href;
        const isActive =
          matchHref === "/" ? pathname === "/" : pathname.startsWith(matchHref);
        const IconComponent = item.Icon;

        return (
          <Link
            key={item.label}
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

