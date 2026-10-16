"use client";
// src/components/MobileBottomNav.tsx
// Professional native mobile bottom navigation bar with real SVG application icons

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, MessageSquare, Calendar, User, Gem } from "lucide-react";
import { getLanguage, t, SupportedLanguage } from "@/lib/i18n";
import { useRealtime } from "@/components/realtime/RealtimeProvider";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [lang, setLang] = useState<SupportedLanguage>("fr");

  useEffect(() => {
    setLang(getLanguage());
    const handleLang = (e: any) => {
      if (e.detail?.lang) setLang(e.detail.lang);
    };
    window.addEventListener("mmclub_lang_changed", handleLang);
    return () => window.removeEventListener("mmclub_lang_changed", handleLang);
  }, []);

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

  // Messages non lus en temps réel (RealtimeProvider)
  const { unreadTotal: unreadCount } = useRealtime();

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
    { href: "/", label: t("appTitle", lang) === "Meet Me Club" ? (lang === "en" ? "Home" : lang === "de" ? "Start" : lang === "es" ? "Inicio" : lang === "zh" ? "首页" : lang === "pt" ? "Início" : lang === "ar" ? "الرئيسية" : "Accueil") : "Accueil", Icon: Home },
    { href: "/decouverte", label: lang === "en" ? "Explore" : "Découvrir", Icon: Compass },
    { href: "/tarifs", label: lang === "en" ? "Plans" : "Plans", Icon: Gem },
    { href: "/rendez-vous", label: lang === "en" ? "Dates" : "Sorties", Icon: Calendar },
    {
      href: "/messages",
      activeHref: "/messages",
      label: t("navMessages", lang),
      Icon: MessageSquare,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      href: "/profil",
      activeHref: "/profil",
      label: t("navProfile", lang),
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

