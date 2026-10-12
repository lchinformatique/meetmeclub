"use client";
// src/components/Header.tsx
// Executive, high-end application navigation header with real Lucide SVG icons and live session state

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Compass,
  MessageSquare,
  Calendar,
  Gem,
  User,
  LogOut,
  LogIn,
  UserPlus,
} from "lucide-react";

interface UserSession {
  id: string;
  email: string | null;
  firstName: string;
  avatarUrl: string | null;
  subscriptionTier: string;
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState<UserSession | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.authenticated && data.user) {
            setSessionUser(data.user);
          }
        }
      } catch {
        // Silently handle error, treat as unauthenticated
      } finally {
        if (isMounted) setLoadingUser(false);
      }
    }
    checkAuth();
    return () => {
      isMounted = false;
    };
  }, [pathname]);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setSessionUser(null);
      router.push("/connexion");
      router.refresh();
    } catch {
      router.push("/connexion");
    } finally {
      setLoggingOut(false);
    }
  }

  const navLinks = [
    { href: "/", label: "Accueil", Icon: Home },
    { href: "/decouverte", label: "Découvrir", Icon: Compass },
    { href: "/messages", label: "Messages", Icon: MessageSquare, badge: 1 },
    { href: "/rendez-vous", label: "Sorties", Icon: Calendar },
    { href: "/tarifs", label: "Tarifs", Icon: Gem },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg"
          aria-label="Meet Me Club Accueil"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 shadow-sm flex items-center justify-center p-0.5 bg-white transition group-hover:scale-105">
            <Image
              src="/logo.png"
              alt="Logo Meet Me Club"
              width={36}
              height={36}
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-extrabold text-lg tracking-tight text-[#0B2559]">
              meet <span className="text-[#E10600]">me</span> club
            </span>
            <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">
              Lomé · Togo
            </span>
          </div>
        </Link>

        {/* Desktop & Tablet Navigation (Hidden on narrow mobile screens where bottom nav is active) */}
        <nav
          className="hidden md:flex items-center gap-1 lg:gap-2"
          aria-label="Navigation principale"
        >
          {navLinks.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.Icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs lg:text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-[#0B2559] text-white shadow-sm"
                    : "text-slate-700 hover:text-[#0B2559] hover:bg-slate-100"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  size={16}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={isActive ? "text-white" : "text-slate-500"}
                />
                <span>{item.label}</span>
                {Boolean(item.badge) && (
                  <span className="ml-0.5 px-1.5 py-0.2 text-[10px] font-black rounded-full bg-[#E10600] text-white shadow-xs">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Auth / Account Space */}
        <div className="flex items-center gap-2 sm:gap-3">
          {!loadingUser && sessionUser ? (
            // Logged-in State
            <div className="flex items-center gap-2">
              <Link
                href="/profil"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-semibold transition ${
                  pathname.startsWith("/profil")
                    ? "bg-[#0B2559] text-white border-[#0B2559]"
                    : "bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100"
                }`}
                title="Accéder à mon profil"
              >
                <div className="w-6 h-6 rounded-full bg-[#0B2559]/10 text-[#0B2559] flex items-center justify-center overflow-hidden">
                  {sessionUser.avatarUrl ? (
                    <Image
                      src={sessionUser.avatarUrl}
                      alt={sessionUser.firstName}
                      width={24}
                      height={24}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={14} />
                  )}
                </div>
                <span className="hidden sm:inline max-w-[100px] truncate">
                  {sessionUser.firstName}
                </span>
                <span className="sm:hidden text-xs">Profil</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200/80 transition cursor-pointer"
                title="Se déconnecter"
              >
                <LogOut size={15} />
                <span className="hidden sm:inline">
                  {loggingOut ? "Déconnexion..." : "Déconnexion"}
                </span>
              </button>
            </div>
          ) : (
            // Unauthenticated State
            <div className="flex items-center gap-2">
              <Link
                href="/connexion"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:text-[#0B2559] hover:bg-slate-100 border border-slate-200 transition"
              >
                <LogIn size={15} className="text-slate-500" />
                <span>Connexion</span>
              </Link>
              <Link
                href="/inscription"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#E10600] to-[#B30500] hover:from-[#FF2A25] hover:to-[#E10600] shadow-sm hover:shadow-md transition active:scale-[0.98]"
              >
                <UserPlus size={15} />
                <span>Rejoindre</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
