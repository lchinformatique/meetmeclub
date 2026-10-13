"use client";
// src/components/Header.tsx
// Professional, executive navigation — desktop horizontal nav + animated mobile hamburger drawer

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Compass,
  MessageSquare,
  CalendarDays,
  Gem,
  User,
  LogOut,
  LogIn,
  UserPlus,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

interface UserSession {
  id: string;
  email: string | null;
  firstName: string;
  avatarUrl: string | null;
  subscriptionTier: string;
}

interface NavLinkItem {
  href: string;
  label: string;
  Icon: any;
  badge?: number;
}

const navLinks: NavLinkItem[] = [
  { href: "/", label: "Accueil", Icon: Home },
  { href: "/decouverte", label: "Découvrir", Icon: Compass },
  { href: "/messages", label: "Messages", Icon: MessageSquare },
  { href: "/rendez-vous", label: "Sorties", Icon: CalendarDays },
  { href: "/tarifs", label: "Tarifs", Icon: Gem },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState<UserSession | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  // Fetch session on route change
  useEffect(() => {
    let isMounted = true;
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.authenticated && data.user) {
            setSessionUser(data.user);
          } else if (isMounted) {
            setSessionUser(null);
          }
        }
      } catch {
        // treat as unauthenticated
      } finally {
        if (isMounted) setLoadingUser(false);
      }
    }
    checkAuth();
    return () => { isMounted = false; };
  }, [pathname]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close on Escape key
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && mobileOpen) setMobileOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  // Prevent body scroll when mobile menu open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const handleLogout = useCallback(async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setMobileOpen(false);
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
  }, [loggingOut, router]);

  const handleBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  }, [router]);

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <>
      {/* ══════════════════════════════════════════
          MAIN HEADER BAR
      ══════════════════════════════════════════ */}
      <header
        className="sticky top-0 z-50 w-full"
        style={{
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid #E8EDF5",
          boxShadow: "0 1px 8px rgba(11,37,89,0.07)",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "0 20px",
            height: "68px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          {/* ── Brand Logo & Mobile Back Button ── */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
            {pathname !== "/" && (
              <button
                type="button"
                onClick={handleBack}
                aria-label="Retour à la page précédente"
                className="header-mobile-back-btn"
                style={{
                  display: "none",
                  alignItems: "center",
                  gap: "4px",
                  padding: "7px 11px",
                  borderRadius: "10px",
                  background: "#F1F5F9",
                  border: "1.5px solid #CBD5E1",
                  color: "#0B2559",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                  flexShrink: 0,
                }}
              >
                <ChevronLeft size={18} strokeWidth={2.5} />
                <span className="mobile-back-btn-text">Retour</span>
              </button>
            )}

            <Link
              href="/"
              aria-label="Meet Me Club — Accueil"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                textDecoration: "none",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "2px solid rgba(11,37,89,0.10)",
                  background: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "3px",
                  boxShadow: "0 2px 8px rgba(11,37,89,0.10)",
                  transition: "transform 0.2s ease",
                }}
                className="header-logo-wrap"
              >
              <Image
                src="/logo.png"
                alt="Logo Meet Me Club"
                width={38}
                height={38}
                style={{ objectFit: "contain" }}
                priority
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
              <span
                style={{
                  fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                  fontWeight: 800,
                  fontSize: "18px",
                  letterSpacing: "-0.3px",
                  color: "#0B2559",
                }}
              >
                meet <span style={{ color: "#E10600" }}>me</span> club
              </span>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#8B99B5",
                  letterSpacing: "0.9px",
                  textTransform: "uppercase",
                }}
              >
                International · Sorties Togo
              </span>
            </div>
          </Link>
        </div>

          {/* ── Desktop Navigation ───────────────── */}
          <nav
            aria-label="Navigation principale"
            style={{
              display: "none",
              alignItems: "center",
              gap: "4px",
            }}
            className="header-desktop-nav"
          >
            {navLinks.map((item) => {
              const active = isActive(item.href);
              const Icon = item.Icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                    padding: "8px 14px",
                    borderRadius: "12px",
                    textDecoration: "none",
                    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                    fontWeight: active ? 700 : 600,
                    fontSize: "14px",
                    letterSpacing: "-0.1px",
                    color: active ? "white" : "#3D4F6E",
                    background: active ? "#0B2559" : "transparent",
                    position: "relative",
                    transition: "all 0.18s ease",
                    whiteSpace: "nowrap",
                  }}
                  className={active ? "nav-link-active" : "nav-link"}
                >
                  <Icon
                    size={16}
                    strokeWidth={active ? 2.5 : 2}
                    style={{ color: active ? "white" : "#7B8FAD", flexShrink: 0 }}
                  />
                  <span>{item.label}</span>
                  {Boolean(item.badge) && (
                    <span
                      style={{
                        position: "absolute",
                        top: "6px",
                        right: "8px",
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        background: "#E10600",
                        color: "white",
                        fontSize: "9px",
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 0 0 2px white",
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* ── Auth Zone ───────────────────────── */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            {!loadingUser && sessionUser ? (
              /* Logged-in */
              <>
                <Link
                  href="/profil"
                  title="Mon profil"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "7px 12px 7px 8px",
                    borderRadius: "100px",
                    border: pathname.startsWith("/profil")
                      ? "2px solid #0B2559"
                      : "1.5px solid #D8E1EF",
                    background: pathname.startsWith("/profil") ? "#0B2559" : "white",
                    textDecoration: "none",
                    transition: "all 0.18s ease",
                  }}
                  className="profile-btn"
                >
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: "#EEF2FB",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    {sessionUser.avatarUrl ? (
                      <Image
                        src={sessionUser.avatarUrl}
                        alt={sessionUser.firstName}
                        width={28}
                        height={28}
                        style={{ objectFit: "cover", width: "100%", height: "100%" }}
                      />
                    ) : (
                      <User size={14} style={{ color: "#0B2559" }} />
                    )}
                  </div>
                  <span
                    className="header-profile-name"
                    style={{
                      fontWeight: 700,
                      fontSize: "13px",
                      color: pathname.startsWith("/profil") ? "white" : "#0B2559",
                      maxWidth: "90px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {sessionUser.firstName}
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  title="Se déconnecter"
                  aria-label="Se déconnecter de votre compte"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    borderRadius: "10px",
                    border: "1.5px solid #FCA5A5",
                    background: "#FEF2F2",
                    color: "#DC2626",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: loggingOut ? "not-allowed" : "pointer",
                    opacity: loggingOut ? 0.6 : 1,
                    transition: "all 0.18s ease",
                  }}
                  className="header-logout-btn"
                >
                  <LogOut size={15} style={{ color: "#DC2626" }} />
                  <span>
                    {loggingOut ? "Déconnexion..." : "Déconnexion"}
                  </span>
                </button>
              </>
            ) : (
              /* Unauthenticated */
              <>
                <Link
                  href="/connexion"
                  className="header-login-btn"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    borderRadius: "10px",
                    border: "1.5px solid #D8E1EF",
                    background: "white",
                    color: "#0B2559",
                    fontWeight: 700,
                    fontSize: "13px",
                    textDecoration: "none",
                    transition: "all 0.18s ease",
                    whiteSpace: "nowrap",
                  }}
                >
                  <LogIn size={14} style={{ color: "#7B8FAD" }} />
                  <span>Connexion</span>
                </Link>

                <Link
                  href="/rejoindre"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "9px 18px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #E10600 0%, #B30500 100%)",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "13px",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    boxShadow: "0 4px 14px rgba(225,6,0,0.30)",
                    transition: "all 0.18s ease",
                  }}
                  className="header-join-btn"
                >
                  <UserPlus size={14} />
                  <span>Rejoindre</span>
                </Link>
              </>
            )}

            {/* ── Hamburger (mobile only) ─────── */}
            <button
              ref={hamburgerRef}
              type="button"
              aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
              className="header-hamburger"
              style={{
                display: "none",
                alignItems: "center",
                justifyContent: "center",
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                border: "1.5px solid #D8E1EF",
                background: mobileOpen ? "#0B2559" : "white",
                color: mobileOpen ? "white" : "#0B2559",
                cursor: "pointer",
                flexShrink: 0,
                transition: "all 0.2s ease",
              }}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════
          MOBILE OVERLAY BACKDROP
      ══════════════════════════════════════════ */}
      <div
        aria-hidden="true"
        onClick={() => setMobileOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 40,
          background: "rgba(7,21,48,0.55)",
          backdropFilter: "blur(4px)",
          opacity: mobileOpen ? 1 : 0,
          pointerEvents: mobileOpen ? "auto" : "none",
          transition: "opacity 0.28s ease",
        }}
      />

      {/* ══════════════════════════════════════════
          MOBILE SLIDE-IN DRAWER
      ══════════════════════════════════════════ */}
      <div
        ref={mobileMenuRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navigation"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 50,
          width: "min(320px, 85vw)",
          background: "white",
          boxShadow: "-8px 0 40px rgba(11,37,89,0.18)",
          transform: mobileOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.30s cubic-bezier(0.16,1,0.3,1)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: "20px 20px 16px",
            borderBottom: "1px solid #EEF2FB",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}
          >
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                border: "2px solid rgba(11,37,89,0.10)",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "3px",
                background: "white",
              }}
            >
              <Image src="/logo.png" alt="Logo" width={32} height={32} style={{ objectFit: "contain" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
              <span style={{ fontWeight: 800, fontSize: "16px", color: "#0B2559" }}>
                meet <span style={{ color: "#E10600" }}>me</span> club
              </span>
              <span style={{ fontSize: "9px", color: "#8B99B5", fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase" }}>
                Club Privé International
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Fermer le menu"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              border: "1.5px solid #E8EDF5",
              background: "#F7F9FD",
              color: "#3D4F6E",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Auth Zone (En premier sur mobile) */}
        <div style={{ padding: "16px 14px 12px", borderBottom: "1px solid #EEF2FB", background: "#FAFBFD" }}>
          {!loadingUser && sessionUser ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <Link
                href="/profil"
                onClick={() => setMobileOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 14px",
                  borderRadius: "12px",
                  border: "1.5px solid #D8E1EF",
                  background: "white",
                  textDecoration: "none",
                  color: "#0B2559",
                  fontWeight: 700,
                  fontSize: "14px",
                  boxShadow: "0 1px 4px rgba(11,37,89,0.04)",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "#EEF2FB",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  {sessionUser.avatarUrl ? (
                    <Image src={sessionUser.avatarUrl} alt={sessionUser.firstName} width={36} height={36} style={{ objectFit: "cover" }} />
                  ) : (
                    <User size={16} style={{ color: "#0B2559" }} />
                  )}
                </div>
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={{ fontWeight: 700, fontSize: "14px", color: "#0B2559", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {sessionUser.firstName}
                  </div>
                  <div style={{ fontSize: "11px", color: "#8B99B5", fontWeight: 500 }}>Mon profil · Tableau de bord</div>
                </div>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  width: "100%",
                  minHeight: "42px",
                  padding: "10px 14px",
                  borderRadius: "12px",
                  border: "1.5px solid #FECACA",
                  background: "#FFF5F5",
                  color: "#DC2626",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: loggingOut ? "not-allowed" : "pointer",
                  opacity: loggingOut ? 0.6 : 1,
                  boxSizing: "border-box",
                }}
              >
                <LogOut size={15} />
                <span>{loggingOut ? "Déconnexion..." : "Se déconnecter"}</span>
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {/* Créer un compte en haut */}
              <Link
                href="/inscription"
                onClick={() => setMobileOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  width: "100%",
                  minHeight: "46px",
                  padding: "11px 16px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #E10600 0%, #B30500 100%)",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: "14px",
                  textDecoration: "none",
                  boxShadow: "0 4px 14px rgba(225,6,0,0.25)",
                  boxSizing: "border-box",
                  textAlign: "center",
                }}
              >
                <UserPlus size={17} strokeWidth={2.4} />
                <span>Créer un compte</span>
              </Link>

              {/* Connexion en bas */}
              <Link
                href="/connexion"
                onClick={() => setMobileOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  width: "100%",
                  minHeight: "46px",
                  padding: "11px 16px",
                  borderRadius: "12px",
                  border: "1.5px solid #0B2559",
                  background: "#FFFFFF",
                  color: "#0B2559",
                  fontWeight: 700,
                  fontSize: "14px",
                  textDecoration: "none",
                  boxSizing: "border-box",
                  textAlign: "center",
                }}
              >
                <LogIn size={17} strokeWidth={2.4} />
                <span>Connexion</span>
              </Link>
            </div>
          )}
        </div>

        {/* Drawer Nav Links */}
        <div style={{ padding: "12px 14px 4px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#8B99B5", textTransform: "uppercase", letterSpacing: "0.8px" }}>
            Navigation
          </span>
        </div>
        <nav
          aria-label="Navigation mobile"
          style={{ flex: 1, padding: "4px 12px 12px" }}
        >
          {navLinks.map((item) => {
            const active = isActive(item.href);
            const Icon = item.Icon;

            // map href to a color class for hover effect
            const colorClass: Record<string, string> = {
              "/": "mob-link-accueil",
              "/decouverte": "mob-link-decouverte",
              "/messages": "mob-link-messages",
              "/rendez-vous": "mob-link-sorties",
              "/tarifs": "mob-link-tarifs",
            };
            const mobClass = active ? "" : `mobile-nav-link-hover ${colorClass[item.href] || ""}`;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                aria-current={active ? "page" : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  textDecoration: "none",
                  marginBottom: "4px",
                  color: active ? "white" : "#1E2E4A",
                  background: active ? "#0B2559" : "transparent",
                  fontWeight: active ? 700 : 600,
                  fontSize: "14px",
                  transition: "all 0.18s ease",
                  position: "relative",
                }}
                className={mobClass}
              >
                <div
                  className="mob-icon"
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: active ? "rgba(255,255,255,0.15)" : "#F0F4FB",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "background 0.18s ease",
                  }}
                >
                  <Icon
                    size={17}
                    strokeWidth={active ? 2.5 : 2}
                    style={{ color: active ? "white" : "#0B2559", transition: "color 0.18s ease" }}
                  />
                </div>
                <span style={{ flex: 1 }}>{item.label}</span>
                {Boolean(item.badge) && (
                  <span
                    style={{
                      background: "#E10600",
                      color: "white",
                      fontSize: "10px",
                      fontWeight: 800,
                      padding: "2px 7px",
                      borderRadius: "100px",
                    }}
                  >
                    {item.badge}
                  </span>
                )}
                {!active && (
                  <ChevronRight size={14} style={{ color: "#B0BCD4", flexShrink: 0 }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Drawer Footer */}
        <div
          style={{
            padding: "12px 20px",
            textAlign: "center",
            fontSize: "11px",
            color: "#A0AABF",
            borderTop: "1px solid #F0F4FB",
            paddingBottom: "max(12px, env(safe-area-inset-bottom))",
          }}
        >
          © 2026 Meet Me Club · Tous droits réservés
        </div>
      </div>

      {/* ══════════════════════════════════════════
          RESPONSIVE STYLES (injected via style tag)
      ══════════════════════════════════════════ */}
      <style>{`
        /* ── Responsive breakpoints ── */
        @media (min-width: 768px) {
          .header-desktop-nav { display: flex !important; }
          .header-hamburger   { display: none !important; }
        }
        @media (max-width: 767px) {
          .header-desktop-nav      { display: none !important; }
          .header-hamburger        { display: flex !important; }
          .header-login-btn        { display: none !important; }
          .header-join-btn         { display: none !important; }
          .profile-btn             { display: none !important; }
          .logout-btn              { display: none !important; }
          .header-mobile-back-btn  { display: flex !important; }
        }

        /* ── Logo hover ── */
        .header-logo-wrap { transition: transform 0.2s ease; }
        .header-logo-wrap:hover { transform: scale(1.07); }

        /* ── Desktop nav links — per-item vivid accent on hover ── */
        .nav-link {
          transition: all 0.18s cubic-bezier(0.4,0,0.2,1);
          position: relative;
          overflow: hidden;
        }
        /* Bottom indicator bar (slides up on hover) */
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: 0; left: 50%;
          transform: translateX(-50%) scaleX(0);
          width: 60%; height: 2.5px;
          border-radius: 99px;
          background: currentColor;
          transition: transform 0.22s cubic-bezier(0.4,0,0.2,1);
          opacity: 0.7;
        }
        .nav-link:hover::after { transform: translateX(-50%) scaleX(1); }

        /* Accueil — indigo */
        .nav-link[href="/"] { --hov-bg: #EEF2FF; --hov-fg: #4338CA; --hov-ico: #6366F1; }
        /* Découvrir — teal */
        .nav-link[href="/decouverte"] { --hov-bg: #ECFDF5; --hov-fg: #0D9488; --hov-ico: #14B8A6; }
        /* Messages — violet */
        .nav-link[href="/messages"] { --hov-bg: #F5F3FF; --hov-fg: #7C3AED; --hov-ico: #8B5CF6; }
        /* Sorties — amber */
        .nav-link[href="/rendez-vous"] { --hov-bg: #FFFBEB; --hov-fg: #B45309; --hov-ico: #F59E0B; }
        /* Tarifs — rose */
        .nav-link[href="/tarifs"] { --hov-bg: #FFF1F2; --hov-fg: #BE123C; --hov-ico: #F43F5E; }

        .nav-link:not(.nav-link-active):hover {
          background: var(--hov-bg, #F0F4FB) !important;
          color:      var(--hov-fg, #0B2559) !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.06);
        }
        .nav-link:not(.nav-link-active):hover svg {
          color: var(--hov-ico, #0B2559) !important;
          transform: scale(1.15);
          transition: transform 0.18s ease, color 0.18s ease;
        }
        .nav-link:active { transform: scale(0.96) !important; }

        /* ── Auth buttons ── */
        .header-login-btn {
          transition: all 0.18s ease;
        }
        .header-login-btn:hover {
          background: #EEF2FF !important;
          border-color: #6366F1 !important;
          color: #4338CA !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99,102,241,0.18);
        }
        .header-join-btn {
          transition: all 0.20s cubic-bezier(0.4,0,0.2,1);
        }
        .header-join-btn:hover {
          background: linear-gradient(135deg, #FF3A35 0%, #E10600 100%) !important;
          box-shadow: 0 8px 24px rgba(225,6,0,0.45) !important;
          transform: translateY(-2px) scale(1.03);
        }
        .header-join-btn:active { transform: scale(0.97) !important; }

        /* ── Profile & logout ── */
        .profile-btn { transition: all 0.18s ease; }
        .profile-btn:hover {
          border-color: #6366F1 !important;
          box-shadow: 0 4px 12px rgba(99,102,241,0.15);
          transform: translateY(-1px);
        }
        .logout-btn { transition: all 0.18s ease; }
        .logout-btn:hover:not(:disabled) {
          background: #FFF0F0 !important;
          border-color: #F43F5E !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(244,63,94,0.15);
        }

        /* ── Mobile drawer links ── */
        /* Accueil */
        .mob-link-accueil:hover  { background: #EEF2FF !important; color: #4338CA !important; }
        .mob-link-accueil:hover .mob-icon  { background: #E0E7FF !important; }
        .mob-link-accueil:hover svg        { color: #6366F1 !important; }
        /* Découvrir */
        .mob-link-decouverte:hover { background: #ECFDF5 !important; color: #0D9488 !important; }
        .mob-link-decouverte:hover .mob-icon { background: #CCFBF1 !important; }
        .mob-link-decouverte:hover svg       { color: #14B8A6 !important; }
        /* Messages */
        .mob-link-messages:hover { background: #F5F3FF !important; color: #7C3AED !important; }
        .mob-link-messages:hover .mob-icon { background: #EDE9FE !important; }
        .mob-link-messages:hover svg       { color: #8B5CF6 !important; }
        /* Sorties */
        .mob-link-sorties:hover { background: #FFFBEB !important; color: #B45309 !important; }
        .mob-link-sorties:hover .mob-icon { background: #FEF3C7 !important; }
        .mob-link-sorties:hover svg       { color: #F59E0B !important; }
        /* Tarifs */
        .mob-link-tarifs:hover { background: #FFF1F2 !important; color: #BE123C !important; }
        .mob-link-tarifs:hover .mob-icon { background: #FFE4E6 !important; }
        .mob-link-tarifs:hover svg       { color: #F43F5E !important; }

        .mobile-nav-link-hover {
          transition: all 0.18s cubic-bezier(0.4,0,0.2,1);
        }
        .mobile-nav-link-hover:hover { transform: translateX(4px); }
        .mobile-nav-link-hover:active { transform: scale(0.97); }

        * { box-sizing: border-box; }
      `}</style>
    </>
  );
}
