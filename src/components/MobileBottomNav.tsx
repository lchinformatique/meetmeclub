"use client";
// src/components/MobileBottomNav.tsx
// Professional native mobile bottom navigation bar with real SVG application icons

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, Compass, MessageSquare, Calendar, User, Gem, LayoutDashboard } from "lucide-react";
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

  // Pastille « nouveau » du Marché : une annonce plus récente que la dernière visite
  const [marketNew, setMarketNew] = useState(false);
  useEffect(() => {
    let alive = true;
    const check = async () => {
      try {
        const { latest } = await (await fetch("/api/market/latest", { cache: "no-store" })).json();
        let seen: string | null = null;
        try {
          seen = localStorage.getItem("mmc:market-seen");
        } catch {}
        if (alive) setMarketNew(Boolean(latest && (!seen || new Date(latest) > new Date(seen))));
      } catch {}
    };
    const onSeen = () => setMarketNew(false);
    check();
    const timer = setInterval(check, 5 * 60 * 1000);
    window.addEventListener("mmc:market-seen", onSeen);
    return () => {
      alive = false;
      clearInterval(timer);
      window.removeEventListener("mmc:market-seen", onSeen);
    };
  }, []);

  // Messages non lus en temps réel (RealtimeProvider)
  const { unreadTotal: unreadCount, me, adminPending } = useRealtime();

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
    // Le Marché (annonces des pros) remplace « Accueil » : le logo du site ramène à l'accueil
    { href: "/marche", label: lang === "en" ? "Market" : "Marché", Icon: Store, badge: marketNew && !pathname.startsWith("/marche") ? "•" : undefined },
    { href: "/decouverte", label: lang === "en" ? "Explore" : "Découvrir", Icon: Compass },
    // L'administrateur voit « Admin » à la place de « Plans » (invisible pour les membres)
    me?.isAdmin
      ? { href: "/admin", activeHref: "/admin", label: "Admin", Icon: LayoutDashboard, badge: adminPending > 0 ? adminPending : undefined }
      : { href: "/tarifs", label: lang === "en" ? "Plans" : "Plans", Icon: Gem },
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

