"use client";
// src/app/decouverte/page.tsx
// Member Discovery Page — Browse verified profiles in Togo with Plan Quota Enforcement

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import CommunityStatsWidget from "@/components/CommunityStatsWidget";
import { Sparkles, Crown } from "lucide-react";

interface ProfileItem {
  id: string;
  userId?: string;
  firstName: string;
  pseudo: string | null;
  gender: string;
  city: string;
  neighborhood: string | null;
  profession: string | null;
  relationshipGoal: string;
  bio: string | null;
  profileCompleteness: number;
  photos: Array<{ id: string; url: string; isMain: boolean }>;
  interests: Array<{ interest: { id: string; name: string; icon: string | null } } | any>;
  verifications: Array<{ type: string }>;
  user?: {
    dateOfBirth?: string;
    phoneVerifiedAt?: string | null;
  };
  age?: number;
}

// No sample profiles — only real registered users from API
const SAMPLE_PROFILES: ProfileItem[] = [];

const GOAL_LABELS: Record<string, string> = {
  EXCHANGE: "Échanger & Discuter",
  FRIENDSHIP: "Amitié & Partage",
  SERIOUS: "Relation sérieuse",
  MARRIAGE: "Mariage",
  CASUAL: "Sortie conviviale",
};

export default function DecouvertePage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [genderFilter, setGenderFilter] = useState<string>("ALL");
  const [goalFilter, setGoalFilter] = useState<string>("ALL");
  const [cityFilter, setCityFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [matchModal, setMatchModal] = useState<ProfileItem | null>(null);

  // User subscription & quota state
  const [myProfile, setMyProfile] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [upgradeModal, setUpgradeModal] = useState<{ open: boolean; targetName?: string }>({ open: false });
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  // Read category from query params (e.g. from onboarding redirection)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get("category") || params.get("goal");
      if (cat && ["EXCHANGE", "FRIENDSHIP", "SERIOUS", "MARRIAGE", "CASUAL"].includes(cat)) {
        setGoalFilter(cat);
      }
    }
  }, []);

  // Load user profile & plan info
  const loadMyProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/profiles/me");
      if (res.ok) {
        const data = await res.json();
        setMyProfile(data.profile);
      }
    } catch (e) {
      console.warn("Could not load user profile:", e);
    }
  }, []);

  useEffect(() => {
    loadMyProfile();
  }, [loadMyProfile]);

  // Load community profiles
  useEffect(() => {
    async function fetchProfiles() {
      try {
        const res = await fetch("/api/profiles");
        if (res.status === 401) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }
        setIsAuthenticated(true);
        const data = await res.json();
        if (data.profiles && data.profiles.length > 0) {
          setProfiles(data.profiles);
        } else {
          setProfiles(SAMPLE_PROFILES);
        }
      } catch {
        setIsAuthenticated(false);
        setProfiles(SAMPLE_PROFILES);
      } finally {
        setLoading(false);
      }
    }
    fetchProfiles();
  }, []);

  // Handle contact attempt with quota enforcement
  const handleInitiateExchange = async (profile: ProfileItem, action: "CHAT" | "RDV") => {
    const targetId = profile.userId || profile.id;
    const contactedList: string[] = myProfile?.partnersContacted || [];
    const isAlreadyContacted = contactedList.includes(targetId);
    const plan = myProfile?.plan || "FREE";
    const maxAllowed = plan === "FREE" ? 3 : Infinity;

    // Check if free plan limit reached
    if (!isAlreadyContacted && contactedList.length >= maxAllowed) {
      setUpgradeModal({ open: true, targetName: profile.firstName });
      return;
    }

    // Record contact on server
    try {
      const contactRes = await fetch("/api/partners/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: targetId }),
      });
      if (contactRes.status === 403) {
        setSecurityModalOpen(true);
        return;
      }
      // Refresh myProfile locally
      await loadMyProfile();
    } catch (e) {
      console.warn("Could not record partner contact:", e);
    }

    if (action === "CHAT") {
      router.push(`/messages?contact=${targetId}`);
    } else {
      router.push(`/rendez-vous/nouveau?avec=${targetId}`);
    }
  };

  // Instant test upgrade for demonstration
  const handleTestUpgrade = async (plan: "ESSENTIAL" | "FREE") => {
    setUpgrading(true);
    try {
      const res = await fetch("/api/subscription/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (res.ok) {
        await loadMyProfile();
        setUpgradeModal({ open: false });
      }
    } finally {
      setUpgrading(false);
    }
  };

  const handleLike = useCallback(
    async (profile: ProfileItem) => {
      if (likedIds.has(profile.id)) return;
      setLikedIds((prev) => new Set(prev).add(profile.id));
      try {
        const res = await fetch("/api/likes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toUserId: profile.id }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.isMatch) setMatchModal(profile);
        }
      } catch {
        // optimistic UI persists
      }
    },
    [likedIds]
  );

  function computeAge(profile: ProfileItem): number {
    if (profile.age) return profile.age;
    if (!profile.user?.dateOfBirth) return 25;
    const dob = new Date(profile.user.dateOfBirth);
    const diffMs = Date.now() - dob.getTime();
    return Math.abs(new Date(diffMs).getUTCFullYear() - 1970);
  }

  const filtered = useMemo(() => {
    return profiles.filter((p) => {
      if (genderFilter !== "ALL" && p.gender !== genderFilter) return false;
      if (goalFilter !== "ALL" && p.relationshipGoal !== goalFilter) return false;
      if (cityFilter !== "ALL" && p.city !== cityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.firstName.toLowerCase().includes(q) || (p.pseudo && p.pseudo.toLowerCase().includes(q));
        const matchesNeighborhood = p.neighborhood && p.neighborhood.toLowerCase().includes(q);
        const matchesProfession = p.profession && p.profession.toLowerCase().includes(q);
        if (!matchesName && !matchesNeighborhood && !matchesProfession) return false;
      }
      return true;
    });
  }, [profiles, genderFilter, goalFilter, cityFilter, searchQuery]);

  // Quota computations
  const currentPlan = myProfile?.plan || "FREE";
  const contactedCount = myProfile?.partnersContacted?.length || 0;
  const isFreePlan = currentPlan === "FREE";
  const remainingFreePartners = Math.max(0, 3 - contactedCount);

  return (
    <div style={{ minHeight: "100dvh", background: "#F8FAFC" }}>
      {/* Standardized Member Header */}
      <Header />

      {/* ── Landing publique si non-connecté ───────────────────── */}
      {isAuthenticated === false && (
        <main>
          {/* Section Présentation Meet Me Club */}
          <section style={{ background: "linear-gradient(160deg, #071530 0%, #0B2559 55%, #1a0a3c 100%)", padding: "64px 20px 72px", textAlign: "center", color: "white" }}>
            <div className="container" style={{ maxWidth: "860px", margin: "0 auto" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.22)", borderRadius: "9999px", padding: "6px 18px", marginBottom: "22px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10B981", boxShadow: "0 0 8px #10B981" }} />
                <span style={{ fontSize: "13px", fontWeight: 700, color: "white" }}>Le Club Privé n°1 de Rendez-vous au Togo · Lomé</span>
              </div>

              <h1 style={{ fontSize: "clamp(2rem, 5.5vw, 3.2rem)", fontWeight: 800, color: "white", marginBottom: "18px", lineHeight: 1.15 }}>
                Bienvenue sur <span style={{ color: "#FFD700" }}>Meet Me Club</span>
              </h1>

              <p style={{ fontSize: "clamp(1.05rem, 2.5vw, 1.25rem)", color: "rgba(255,255,255,0.92)", marginBottom: "16px", lineHeight: 1.7, maxWidth: "760px", margin: "0 auto 16px" }}>
                Meet Me Club est le premier club privé international pensé pour transformer les simples échanges virtuels en <strong>vrais rendez-vous inoubliables</strong> dans les plus beaux cadres de Lomé. Fini les faux profils et les conversations sans suite : ici, tout est authentique, sécurisé et organisé de A à Z.
              </p>

              <p className="font-script" style={{ fontSize: "clamp(1.4rem, 3.5vw, 1.9rem)", color: "#FFD700", marginBottom: "36px" }}>
                « Plus qu&apos;une rencontre, un rendez-vous ! »
              </p>

              {/* Les 3 Piliers Clés */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "40px", textAlign: "left" }}>
                <div style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "18px", padding: "20px" }}>
                  <div style={{ fontSize: "28px", marginBottom: "10px" }}>🛡️</div>
                  <div style={{ fontSize: "15px", fontWeight: 800, color: "white", marginBottom: "6px" }}>Profils 100% Vérifiés (+18)</div>
                  <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>
                    Contrôle systématique de majorité et certification d&apos;identité pour échanger en toute confiance avec de vraies personnes.
                  </div>
                </div>

                <div style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "18px", padding: "20px" }}>
                  <div style={{ fontSize: "28px", marginBottom: "10px" }}>🍽️</div>
                  <div style={{ fontSize: "15px", fontWeight: 800, color: "white", marginBottom: "6px" }}>Lieux Partenaires Sélectionnés</div>
                  <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>
                    Restaurants réputés, lounges feutrés et salons privés à Lomé où votre table et vos consommations sont prêtes à l&apos;arrivée.
                  </div>
                </div>

                <div style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "18px", padding: "20px" }}>
                  <div style={{ fontSize: "28px", marginBottom: "10px" }}>🔒</div>
                  <div style={{ fontSize: "15px", fontWeight: 800, color: "white", marginBottom: "6px" }}>Discrétion & Zéro Harcèlement</div>
                  <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>
                    Votre numéro de téléphone n&apos;est jamais communiqué. Tout passe par notre messagerie chiffrée avec contrôle d&apos;accès strict.
                  </div>
                </div>
              </div>

              {/* Chiffres Clés */}
              <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "28px", padding: "20px", background: "rgba(0,0,0,0.2)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)" }}>
                {[
                  { v: "1 200+", l: "Célibataires Inscrits" },
                  { v: "12", l: "Lieux Partenaires Lomé" },
                  { v: "340+", l: "Rendez-vous Réalisés" },
                  { v: "4.7 / 5 ★", l: "Satisfaction Membres" },
                ].map((s) => (
                  <div key={s.l} style={{ textAlign: "center", minWidth: "120px" }}>
                    <div style={{ fontSize: "1.7rem", fontWeight: 800, color: "#FFD700" }}>{s.v}</div>
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", marginTop: "2px" }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section Les Packs de Rendez-vous organisés */}
          <section style={{ background: "#FFFFFF", padding: "64px 20px" }}>
            <div className="container" style={{ maxWidth: "980px", margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: "40px" }}>
                <span style={{ fontSize: "12px", fontWeight: 800, color: "#E10600", textTransform: "uppercase", letterSpacing: "1px" }}>
                  Des formules adaptées à chaque envie
                </span>
                <h2 style={{ fontSize: "clamp(1.6rem, 4vw, 2.3rem)", fontWeight: 800, color: "#0B2559", marginTop: "6px" }}>
                  Nos 4 Packs de Rendez-vous Clé en Main
                </h2>
                <p style={{ fontSize: "14px", color: "#64748B", maxWidth: "600px", margin: "10px auto 0" }}>
                  Choisissez une formule selon vos attentes. Le club s&apos;occupe de la réservation et de l&apos;accueil pour que vous n&apos;ayez qu&apos;à profiter de l&apos;instant.
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "40px" }}>
                {[
                  {
                    name: "Découverte",
                    price: "2 000",
                    tag: "Rencontre Conviviale",
                    desc: "Idéal pour briser la glace dans un café ou salon public partenaire.",
                    features: ["Lieu public vérifié", "Chat sécurisé inclus", "Rappels automatiques de RDV"],
                    color: "#0B2559",
                    bg: "#F8FAFC",
                    popular: false,
                  },
                  {
                    name: "Complice",
                    price: "5 000",
                    tag: "Détente & Boisson",
                    desc: "Table réservée avec 1 boisson offerte par personne dans un cadre chaleureux.",
                    features: ["Table réservée à votre nom", "1 boisson incluse / pers.", "Chat dédié & suivi"],
                    color: "#3B82F6",
                    bg: "#F0F7FF",
                    popular: false,
                  },
                  {
                    name: "Dîner",
                    price: "12 000",
                    tag: "⭐ Le Plus Prisé",
                    desc: "La formule romantique par excellence avec menu complet en restaurant partenaire.",
                    features: ["Table réservée soignée", "Menu complet (Entrée/Plat/Boisson)", "Ambiance tamisée intime"],
                    color: "#E10600",
                    bg: "#FFF5F5",
                    popular: true,
                  },
                  {
                    name: "VIP Premium",
                    price: "30 000",
                    tag: "👑 Prestige & Intimité",
                    desc: "Espace privatif d'exception, menu gastronomique et accueil dédié haut de gamme.",
                    features: ["Espace privatif exclusif", "Repas gastronomique + Champagne", "Appels vidéo live illimités"],
                    color: "#D97706",
                    bg: "#FFFBEB",
                    popular: false,
                  },
                ].map((pack) => (
                  <div
                    key={pack.name}
                    style={{
                      background: pack.bg,
                      border: pack.popular ? "2px solid #E10600" : "1.5px solid #E2E8F0",
                      borderRadius: "20px",
                      padding: "24px 20px",
                      display: "flex",
                      flexDirection: "column",
                      position: "relative",
                      boxShadow: pack.popular ? "0 12px 30px rgba(225, 6, 0, 0.12)" : "0 4px 12px rgba(0,0,0,0.04)",
                    }}
                  >
                    {pack.popular && (
                      <div style={{ position: "absolute", top: "-11px", left: "50%", transform: "translateX(-50%)", background: "#E10600", color: "white", fontSize: "11px", fontWeight: 800, padding: "3px 14px", borderRadius: "9999px", whiteSpace: "nowrap" }}>
                        ⭐ Recommandé
                      </div>
                    )}
                    <div style={{ fontSize: "12px", fontWeight: 800, color: pack.color, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {pack.tag}
                    </div>
                    <div style={{ fontSize: "20px", fontWeight: 800, color: "#0B2559", margin: "4px 0" }}>
                      {pack.name}
                    </div>
                    <div style={{ fontSize: "26px", fontWeight: 800, color: pack.color, marginBottom: "8px" }}>
                      {pack.price} <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748B" }}>FCFA</span>
                    </div>
                    <p style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.4, marginBottom: "16px", minHeight: "36px" }}>
                      {pack.desc}
                    </p>
                    <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                      {pack.features.map((f, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#334155", fontWeight: 600 }}>
                          <span style={{ color: "#10B981" }}>✓</span>
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── ESPACE D'ENTRÉE ATTRACTIF AVEC CRÉATION DE COMPTE ── */}
          <section style={{ background: "linear-gradient(135deg, #071530 0%, #0B2559 100%)", padding: "64px 20px 80px", color: "white" }}>
            <div className="container" style={{ maxWidth: "680px", margin: "0 auto", textAlign: "center" }}>
              <div
                style={{
                  background: "rgba(255,255,255,0.08)",
                  backdropFilter: "blur(16px)",
                  border: "2px solid rgba(255,255,255,0.2)",
                  borderRadius: "28px",
                  padding: "36px 24px",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
                }}
              >
                <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(225, 6, 0, 0.2)", border: "1px solid rgba(225, 6, 0, 0.4)", borderRadius: "9999px", padding: "6px 16px", marginBottom: "16px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 800, color: "#FF6B6B" }}>🎁 Offre Spéciale de Bienvenue</span>
                </div>

                <h2 style={{ fontSize: "clamp(1.6rem, 4.5vw, 2.3rem)", fontWeight: 800, color: "white", marginBottom: "12px" }}>
                  Activez votre <span style={{ color: "#FFD700" }}>Plan Gratuit</span> en 30 secondes
                </h2>

                <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.9)", lineHeight: 1.6, marginBottom: "24px", maxWidth: "520px", margin: "0 auto 24px" }}>
                  Rejoignez dès maintenant notre communauté de célibataires à Lomé. Dès votre premier accès, bénéficiez de <strong>7 jours d&apos;essai offert</strong> avec 3 contacts inclus pour démarrer vos premières discussions !
                </p>

                {/* Avantages Inclus */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", marginBottom: "28px", textAlign: "left" }}>
                  {[
                    "✓ 7 jours d'essai 100% gratuit",
                    "✓ 3 contacts débloqués au choix",
                    "✓ Messagerie privée sécurisée",
                    "✓ Réservation de RDV disponible",
                  ].map((adv, i) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.1)", borderRadius: "10px", padding: "8px 12px", fontSize: "12px", fontWeight: 700, color: "white" }}>
                      {adv}
                    </div>
                  ))}
                </div>

                {/* Boutons d'Action Directe */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "420px", margin: "0 auto" }}>
                  <Link
                    href="/rejoindre"
                    className="btn btn-lg"
                    style={{
                      background: "linear-gradient(135deg, #E10600 0%, #B30500 100%)",
                      color: "white",
                      fontWeight: 800,
                      fontSize: "16px",
                      padding: "16px 28px",
                      borderRadius: "9999px",
                      textDecoration: "none",
                      boxShadow: "0 8px 30px rgba(225, 6, 0, 0.45)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                    }}
                  >
                    <span>❤️ Rejoindre le Club & Activer mon Plan Gratuit</span>
                  </Link>

                  <Link
                    href="/connexion"
                    className="btn"
                    style={{
                      background: "rgba(255,255,255,0.15)",
                      border: "1.5px solid rgba(255,255,255,0.35)",
                      color: "white",
                      fontWeight: 700,
                      fontSize: "14px",
                      padding: "13px 20px",
                      borderRadius: "9999px",
                      textDecoration: "none",
                    }}
                  >
                    Déjà membre ? S&apos;identifier avec ses identifiants
                  </Link>
                </div>

                <div style={{ marginTop: "20px", fontSize: "11px", color: "rgba(255,255,255,0.6)" }}>
                  Plateforme réservée aux personnes majeures (+18) · Données chiffrées & confidentielles
                </div>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* ── Contenu membres connectés ───────────────────────────── */}
      {isAuthenticated !== false && (
      <main className="container" style={{ paddingBlock: "28px" }}>
        {/* Subscription Quota Status Banner */}
        <div
          style={{
            background: isFreePlan
              ? "linear-gradient(135deg, #0B2E6B 0%, #1E3A8A 100%)"
              : "linear-gradient(135deg, #065F46 0%, #047857 100%)",
            borderRadius: "16px",
            padding: "20px 24px",
            color: "white",
            marginBottom: "24px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            boxShadow: "0 6px 20px rgba(11, 46, 107, 0.15)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                flexShrink: 0,
              }}
            >
              {isFreePlan ? <Sparkles size={22} className="text-amber-300" /> : <Crown size={22} className="text-amber-300" />}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "12px", textTransform: "uppercase", fontWeight: 800, letterSpacing: "1px", background: "rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: "9999px" }}>
                  {isFreePlan ? "Plan Gratuit" : `Abonnement ${currentPlan}`}
                </span>
                <span style={{ fontSize: "14px", fontWeight: 700 }}>
                  {isFreePlan
                    ? `${contactedCount} / 3 partenaires contactés (${remainingFreePartners} restant${remainingFreePartners > 1 ? "s" : ""})`
                    : "Partenaires & discussions 100% ILLIMITÉS"}
                </span>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: "13px", color: "rgba(255, 255, 255, 0.9)" }}>
                {isFreePlan
                  ? "Vous pouvez échanger, discuter ou fixer un rendez-vous avec jusqu'à 3 membres de votre choix."
                  : "Aucune limite : discutez, partagez des passions et faites-vous des amis librement à Lomé !"}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {isFreePlan ? (
              <button
                type="button"
                onClick={() => setUpgradeModal({ open: true })}
                className="btn btn-primary"
                style={{
                  background: "#E10600",
                  borderColor: "#E10600",
                  color: "white",
                  fontWeight: 700,
                  fontSize: "13px",
                  padding: "10px 18px",
                  borderRadius: "10px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Sparkles size={16} />
                <span>Débloquer l&apos;Illimité (3 000 F CFA)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleTestUpgrade("FREE")}
                className="btn btn-ghost"
                style={{
                  color: "white",
                  borderColor: "rgba(255,255,255,0.3)",
                  fontSize: "12px",
                  padding: "6px 12px",
                }}
              >
                Tester retour au Plan Gratuit
              </button>
            )}
          </div>
        </div>

        {/* Live Community Statistics Banner */}
        <div style={{ marginBottom: "20px" }}>
          <CommunityStatsWidget compact />
        </div>

        {/* Hero Section */}
        <div
          style={{
            background: "white",
            borderRadius: "18px",
            padding: "28px 30px",
            border: "1px solid #E2E8F0",
            marginBottom: "24px",
            boxShadow: "0 4px 15px rgba(0, 0, 0, 0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "6px" }}>
            <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#0F172A", margin: 0 }}>
              Membres Meet Me Club à Lomé
            </h1>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#059669", background: "#ECFDF5", padding: "3px 10px", borderRadius: "9999px" }}>
              ✓ Profils certifiés
            </span>
          </div>
          <p style={{ color: "#475569", fontSize: "15px", margin: 0, lineHeight: 1.5 }}>
            Faites des rencontres selon vos envies : partage de passions, discussions amicales, ou rendez-vous en toute sérénité.
          </p>
        </div>

        {/* Filters Bar */}
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "20px",
            border: "1px solid #E2E8F0",
            marginBottom: "28px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
            {/* Search Input */}
            <input
              type="text"
              placeholder="🔍 Nom, prénom, quartier, métier..."
              className="input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ color: "#0F172A", fontWeight: 500 }}
            />

            {/* Gender filter */}
            <select
              className="input"
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              style={{ color: "#0F172A", fontWeight: 600 }}
            >
              <option value="ALL">Tous les genres</option>
              <option value="FEMALE">👩 Femmes uniquement</option>
              <option value="MALE">👨 Hommes uniquement</option>
            </select>

            {/* Goal filter */}
            <select
              className="input"
              value={goalFilter}
              onChange={(e) => setGoalFilter(e.target.value)}
              style={{ color: "#0F172A", fontWeight: 600 }}
            >
              <option value="ALL">Tous les objectifs</option>
              <option value="EXCHANGE">Échanger & Discuter</option>
              <option value="FRIENDSHIP">Amitié & Partage</option>
              <option value="SERIOUS">Relation sérieuse</option>
              <option value="MARRIAGE">Mariage</option>
              <option value="CASUAL">Sortie conviviale</option>
            </select>

            {/* City filter */}
            <select
              className="input"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              style={{ color: "#0F172A", fontWeight: 600 }}
            >
              <option value="ALL">Toutes les villes</option>
              <option value="Lomé">Lomé</option>
              <option value="Kpalimé">Kpalimé</option>
              <option value="Kara">Kara</option>
            </select>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", color: "#475569" }}>
            <span>
              <strong style={{ color: "#0F172A" }}>{filtered.length}</strong> profil(s) visible(s)
            </span>
            {(genderFilter !== "ALL" || goalFilter !== "ALL" || cityFilter !== "ALL" || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setGenderFilter("ALL");
                  setGoalFilter("ALL");
                  setCityFilter("ALL");
                  setSearchQuery("");
                }}
                className="btn btn-ghost btn-sm"
                style={{ padding: "4px 8px", fontSize: "12px", color: "#E10600", fontWeight: 700 }}
              >
                Réinitialiser les filtres ✕
              </button>
            )}
          </div>
        </div>

        {/* Profiles Grid */}
        {loading ? (
          <div style={{ textAlign: "center", paddingBlock: "60px" }}>
            <p style={{ color: "#0F172A", fontWeight: 700, fontSize: "16px" }}>Chargement des profils du club...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: "white", borderRadius: "16px", padding: "48px 24px", textAlign: "center", border: "1px solid #E2E8F0" }}>
            <h3 style={{ fontSize: "18px", color: "#0F172A", marginBlock: "10px 4px", fontWeight: 700 }}>
              Aucun profil trouvé
            </h3>
            <p style={{ fontSize: "14px", color: "#64748B", marginBottom: "16px" }}>
              Essayez de réinitialiser vos critères de recherche.
            </p>
          </div>
        ) : (
          <div
            className="discovery-profiles-grid"
            style={{
              display: "grid",
              gap: "20px",
            }}
          >
            {filtered.map((profile) => {
              const age = computeAge(profile);
              const mainPhoto = profile.photos?.find((p) => p.isMain) || profile.photos?.[0];
              const targetId = profile.userId || profile.id;
              const isAlreadyContacted = myProfile?.partnersContacted?.includes(targetId);

              return (
                <div
                  key={profile.id}
                  style={{
                    background: "white",
                    borderRadius: "20px",
                    overflow: "hidden",
                    border: "1px solid #E2E8F0",
                    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.05)",
                    display: "flex",
                    flexDirection: "column",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                >
                  {/* Photo Container */}
                  <div
                    style={{ position: "relative", width: "100%", height: "280px", background: "#0F172A", userSelect: "none" }}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    {mainPhoto ? (
                      <Image
                        src={mainPhoto.url}
                        alt={profile.firstName}
                        fill
                        style={{ objectFit: "cover", pointerEvents: "none", userSelect: "none" }}
                        sizes="(max-width: 768px) 100vw, 320px"
                        draggable={false}
                      />
                    ) : (
                      <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: "#4B5563", fontSize: "14px", fontWeight: 600 }}>
                        Photo non disponible
                      </div>
                    )}

                    {/* Anti-download transparent protective layer */}
                    <div style={{ position: "absolute", inset: 0, zIndex: 1 }} onContextMenu={(e) => e.preventDefault()} />

                    {/* Watermark de confidentialité */}
                    <span className="secure-watermark">Meet Me Club • Confidentiel</span>

                    {/* Partner Contacted Status Badge */}
                    {isAlreadyContacted && (
                      <div style={{ position: "absolute", top: "12px", left: "12px" }}>
                        <span
                          style={{
                            background: "rgba(11, 46, 107, 0.85)",
                            color: "white",
                            fontSize: "11px",
                            fontWeight: 800,
                            padding: "4px 10px",
                            borderRadius: "9999px",
                            backdropFilter: "blur(6px)",
                          }}
                        >
                          ✓ Partenaire déjà choisi
                        </span>
                      </div>
                    )}

                    {/* Gradient bottom overlay with Name & Location */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        insetInline: 0,
                        padding: "18px 16px 14px",
                        background: "linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.5) 60%, transparent 100%)",
                        color: "white",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                        <h3 style={{ fontSize: "21px", fontWeight: 800, margin: 0, color: "white" }}>
                          {profile.firstName}
                          {age ? `, ${age} ans` : ""}
                        </h3>
                      </div>
                      <p style={{ fontSize: "13px", color: "#E2E8F0", marginTop: "3px", margin: 0, fontWeight: 500 }}>
                        {profile.city} {profile.neighborhood ? `· ${profile.neighborhood}` : ""}
                      </p>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
                    {/* Goal & Profession */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          padding: "4px 10px",
                          background: "#EFF6FF",
                          color: "#0B2E6B",
                          borderRadius: "9999px",
                          border: "1px solid #BFDBFE",
                        }}
                      >
                        {GOAL_LABELS[profile.relationshipGoal] || profile.relationshipGoal}
                      </span>
                      {profile.profession && (
                        <span style={{ fontSize: "12px", color: "#334155", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {profile.profession}
                        </span>
                      )}
                    </div>

                    {/* Bio */}
                    {profile.bio && (
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#1E293B",
                          lineHeight: "1.5",
                          margin: 0,
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {profile.bio}
                      </p>
                    )}

                    {/* Action Buttons */}
                    <div style={{ marginTop: "auto", paddingTop: "10px", display: "flex", gap: "8px", alignItems: "center" }}>
                      {/* Like button */}
                      <button
                        type="button"
                        onClick={() => handleLike(profile)}
                        title={likedIds.has(profile.id) ? "Aimé !" : "Aimer"}
                        style={{
                          width: "42px",
                          height: "42px",
                          borderRadius: "12px",
                          border: likedIds.has(profile.id) ? "2px solid #E10600" : "1px solid #CBD5E1",
                          background: likedIds.has(profile.id) ? "#FEF2F2" : "white",
                          fontSize: "18px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={likedIds.has(profile.id) ? "#E10600" : "none"} stroke={likedIds.has(profile.id) ? "#E10600" : "#94A3B8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                      </button>

                      {/* Échanger / Discuter button */}
                      <button
                        type="button"
                        onClick={() => handleInitiateExchange(profile, "CHAT")}
                        className="btn btn-outline-blue btn-sm"
                        style={{
                          flex: 1,
                          justifyContent: "center",
                          fontWeight: 700,
                          padding: "10px",
                          borderRadius: "10px",
                        }}
                      >
                        💬 Discuter
                      </button>

                      {/* Rendez-vous button */}
                      <button
                        type="button"
                        onClick={() => handleInitiateExchange(profile, "RDV")}
                        className="btn btn-primary btn-sm"
                        style={{
                          flex: 1,
                          justifyContent: "center",
                          fontWeight: 700,
                          padding: "10px",
                          borderRadius: "10px",
                        }}
                      >
                        📅 Sortie
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── EN BAS DE LA RUBRIQUE DES COMPTES : PROPOSITION DES 4 PACKS DE RENDEZ-VOUS ── */}
        <section
          style={{
            marginTop: "56px",
            background: "var(--gradient-blue)",
            borderRadius: "28px",
            padding: "48px 24px",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 20px 50px rgba(11, 37, 89, 0.25)",
          }}
        >
          <div
            style={{
              textAlign: "center",
              marginBottom: "44px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              maxWidth: "760px",
              marginInline: "auto",
              paddingInline: "12px",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 16px",
                borderRadius: "9999px",
                background: "rgba(255, 255, 255, 0.15)",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                color: "white",
                fontSize: "12px",
                fontWeight: 700,
                marginBottom: "14px",
              }}
            >
              <span>☕ Rendez-vous & Sorties Clé en Main à Lomé</span>
            </div>
            <h2
              style={{
                fontSize: "clamp(1.65rem, 5vw, 2.4rem)",
                fontWeight: 800,
                color: "#FFFFFF",
                marginBottom: "12px",
                textAlign: "center",
                lineHeight: 1.25,
                textShadow: "0 2px 10px rgba(0, 0, 0, 0.35)",
              }}
            >
              Envie de concrétiser une belle rencontre ?
            </h2>
            <p
              style={{
                fontSize: "clamp(14px, 3.8vw, 16px)",
                color: "rgba(255,255,255,0.9)",
                textAlign: "center",
                maxWidth: "600px",
                marginInline: "auto",
                lineHeight: 1.5,
                textShadow: "0 1px 6px rgba(0, 0, 0, 0.25)",
              }}
            >
              Proposez un vrai rendez-vous à votre partenaire dans les plus beaux cadres de Lomé avec nos 4 packs clé en main.
            </p>
          </div>

          <div className="home-packs-grid">
            {[
              {
                name: "Découverte",
                price: "2 000",
                description: "Rencontre simple en lieu public",
                features: ["Lieu public vérifié", "Chat sécurisé inclus", "Rappels automatiques"],
                color: "var(--color-gray-500)",
                popular: false,
              },
              {
                name: "Complice",
                price: "5 000",
                description: "Table réservée + 1 boisson par personne",
                features: ["Table réservée à votre nom", "1 boisson incluse / pers.", "Chat dédié & suivi"],
                color: "var(--color-blue)",
                popular: false,
              },
              {
                name: "Dîner",
                price: "12 000",
                description: "Menu complet dans un lieu partenaire",
                features: [
                  "Table réservée soignée",
                  "Menu complet (Entrée/Plat/Boisson)",
                  "Ambiance tamisée intime",
                  "Rappels automatiques",
                ],
                color: "var(--color-red)",
                popular: true,
              },
              {
                name: "VIP Premium",
                price: "30 000",
                description: "Espace privatif, menu complet, accueil dédié",
                features: [
                  "Espace privatif exclusif",
                  "Repas gastronomique + Champagne",
                  "Accueil dédié haut de gamme",
                  "Appels vidéo live illimités",
                ],
                color: "#B8860B",
                popular: false,
              },
            ].map((pack) => (
              <div
                key={pack.name}
                style={{
                  background: pack.popular ? "white" : "rgba(255,255,255,0.08)",
                  border: pack.popular ? `3px solid var(--color-red)` : "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "var(--radius-xl)",
                  padding: "26px 18px",
                  position: "relative",
                  backdropFilter: pack.popular ? "none" : "blur(8px)",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  {pack.popular && (
                    <div
                      style={{
                        position: "absolute",
                        top: "-14px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "var(--gradient-red)",
                        color: "white",
                        padding: "4px 16px",
                        borderRadius: "var(--radius-full)",
                        fontSize: "12px",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                      }}
                    >
                      ⭐ Le plus populaire
                    </div>
                  )}
                  <div
                    style={{
                      width: "48px",
                      height: "6px",
                      background: pack.color,
                      borderRadius: "var(--radius-full)",
                      marginBottom: "16px",
                    }}
                  />
                  <h3
                    style={{
                      fontSize: "19px",
                      fontWeight: 800,
                      color: pack.popular ? "var(--color-blue)" : "white",
                      marginBottom: "6px",
                    }}
                  >
                    {pack.name}
                  </h3>
                  <p
                    style={{
                      fontSize: "13px",
                      color: pack.popular ? "var(--color-gray-500)" : "rgba(255,255,255,0.7)",
                      marginBottom: "18px",
                      minHeight: "36px",
                      lineHeight: 1.4,
                    }}
                  >
                    {pack.description}
                  </p>
                  <div
                    style={{
                      fontSize: "26px",
                      fontWeight: 800,
                      color: pack.popular ? pack.color : "white",
                      marginBottom: "18px",
                    }}
                  >
                    {pack.price}{" "}
                    <span style={{ fontSize: "13px", fontWeight: 400, opacity: 0.75 }}>
                      FCFA
                    </span>
                  </div>
                  <ul style={{ listStyle: "none", marginBottom: "22px", padding: 0 }}>
                    {pack.features.map((f) => (
                      <li
                        key={f}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "13px",
                          color: pack.popular ? "var(--color-gray-600)" : "rgba(255,255,255,0.85)",
                          marginBottom: "8px",
                          lineHeight: 1.3,
                        }}
                      >
                        <span style={{ color: pack.popular ? "var(--color-red)" : "#FFD700", fontWeight: "bold" }}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href="/rendez-vous/nouveau"
                  className={`btn ${pack.popular ? "btn-primary" : "btn-outline-red"}`}
                  style={{
                    width: "100%",
                    marginTop: "auto",
                    justifyContent: "center",
                    textDecoration: "none",
                    ...(pack.popular ? {} : { borderColor: "rgba(255,255,255,0.4)", color: "white" }),
                  }}
                >
                  Choisir ce pack →
                </Link>
              </div>
            ))}
          </div>

          <p
            style={{
              textAlign: "center",
              marginTop: "32px",
              fontSize: "13px",
              color: "rgba(255,255,255,0.65)",
            }}
          >
            * Tarifs en FCFA. Paiement sécurisé T-Money · Flooz · Carte bancaire
          </p>
        </section>
      </main>
      )}

      {/* ── Quota Upgrade Modal ─────────────────────────────── */}
      {upgradeModal.open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setUpgradeModal({ open: false })}
        >
          <div
            style={{
              background: "white",
              borderRadius: "24px",
              padding: "32px 28px",
              maxWidth: "460px",
              width: "100%",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "#FEF2F2",
                border: "2px solid #E10600",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                margin: "0 auto 16px",
              }}
            >
              🔒
            </div>

            <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#0F172A", marginBottom: "8px" }}>
              Limite du Plan Gratuit atteinte
            </h2>

            <p style={{ fontSize: "15px", color: "#475569", lineHeight: 1.6, marginBottom: "20px" }}>
              Votre Plan Gratuit vous permet d'échanger avec <strong style={{ color: "#0F172A" }}>3 partenaires au choix</strong>.
              {upgradeModal.targetName ? ` Pour contacter ${upgradeModal.targetName} et continuer à discuter librement, ` : " "}
              débloquez le <strong style={{ color: "#0B2E6B" }}>Pass Essentiel (3 000 FCFA / mois)</strong> pour des échanges illimités !
            </p>

            <div
              style={{
                background: "#F8FAFC",
                borderRadius: "14px",
                padding: "16px",
                border: "1px solid #E2E8F0",
                marginBottom: "24px",
                textAlign: "left",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: "14px", color: "#0F172A", marginBottom: "8px" }}>
                ✨ Ce que vous débloquez immédiatement :
              </div>
              <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", color: "#334155", lineHeight: 1.6 }}>
                <li>Partenaires & discussions 100% ILLIMITÉS</li>
                <li>Amitié, échange ou rencontres sans contrainte de date</li>
                <li>Voir qui a visité et liké votre profil</li>
              </ul>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {/* Primary Direct Saspay Payment */}
              <a
                href="https://link.saspay.me/dtpycov9i-k"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  padding: "14px",
                  borderRadius: "12px",
                  fontWeight: 800,
                  fontSize: "15px",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#E10600",
                  borderColor: "#E10600",
                  boxShadow: "0 8px 24px rgba(225, 6, 0, 0.35)",
                }}
              >
                <span>💳 Débloquer en Illimité (3 000 F · Saspay)</span>
              </a>
              <div style={{ textAlign: "center", fontSize: "12px", color: "#64748B", fontWeight: 600 }}>
                📱 Mixx by yas & Moov Money acceptés
              </div>

              {/* View all Tarifs */}
              <Link
                href="/tarifs"
                className="btn btn-outline-blue"
                style={{ width: "100%", justifyContent: "center", padding: "11px", borderRadius: "12px", fontWeight: 700 }}
              >
                Voir toutes les formules (Complice 6 000 F, VIP 15 000 F)
              </Link>

              <Link
                href="/paiement/activation"
                className="btn btn-primary"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  padding: "12px",
                  borderRadius: "12px",
                  fontWeight: 700,
                  fontSize: "13px",
                  background: "#E10600",
                  borderColor: "#E10600",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>💳 Activer via Carte Bancaire ou Mobile Money</span>
              </Link>

              <button
                type="button"
                onClick={() => setUpgradeModal({ open: false })}
                className="btn btn-ghost"
                style={{ width: "100%", justifyContent: "center", color: "#64748B", fontSize: "13px" }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security Verification Modal (CNI + Selfie Facial) */}
      {securityModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10, 20, 45, 0.82)",
            backdropFilter: "blur(8px)",
            zIndex: 1400,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setSecurityModalOpen(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "24px",
              padding: "32px",
              maxWidth: "520px",
              width: "100%",
              boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
              border: "1px solid #E2E8F0",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: "center", marginBottom: "22px" }}>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background: "#FEF2F2",
                  color: "#DC2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "30px",
                  margin: "0 auto 12px",
                  boxShadow: "0 4px 14px rgba(220, 38, 38, 0.2)",
                }}
              >
                🛡️
              </div>
              <h2 style={{ fontSize: "21px", fontWeight: 900, color: "#0B2559", marginBottom: "8px" }}>
                Vérification d&apos;identité obligatoire
              </h2>
              <p style={{ fontSize: "14px", color: "#64748B", margin: 0, lineHeight: 1.5 }}>
                Pour garantir un espace 100% réel, sécurisé et protéger l&apos;image des membres à Lomé, vous devez certifier votre identité avant d&apos;entrer en contact avec des partenaires.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "14px",
                  borderRadius: "14px",
                  background: "#F8FAFC",
                  border: "1.5px solid #E2E8F0",
                }}
              >
                <span style={{ fontSize: "22px" }}>🪪</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "14px", color: "#0B2559" }}>
                    Étape 1 : Pièce d&apos;identité officielle
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                    CNI, Passeport, Permis de conduire, Carte d&apos;électeur, Carte consulaire ou Carte de séjour avec photo.
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "14px",
                  borderRadius: "14px",
                  background: "#F8FAFC",
                  border: "1.5px solid #E2E8F0",
                }}
              >
                <span style={{ fontSize: "22px" }}>📸</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "14px", color: "#0B2559" }}>
                    Étape 2 : Contrôle facial instantané (Selfie)
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                    Prenez un selfie net avec votre appareil photo montrant clairement votre visage pour confirmer votre profil.
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "12px",
                  background: "#ECFDF5",
                  border: "1px solid #A7F3D0",
                  fontSize: "12px",
                  color: "#065F46",
                  lineHeight: 1.4,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>🔒</span>
                <span>Protection totale : vos documents et votre selfie restent strictement confidentiels et ne sont jamais visibles ni téléchargeables par les autres membres.</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Link
                href="/profil/securite"
                className="btn btn-primary"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  fontWeight: 800,
                  padding: "14px",
                  fontSize: "15px",
                  background: "#E10600",
                  color: "white",
                  textDecoration: "none",
                  borderRadius: "14px",
                  boxShadow: "0 4px 14px rgba(225, 6, 0, 0.35)",
                }}
              >
                Valider mes pièces & selfie maintenant 🛡️
              </Link>
              <button
                type="button"
                onClick={() => setSecurityModalOpen(false)}
                className="btn btn-ghost"
                style={{ color: "#64748B", fontSize: "13px", padding: "10px" }}
              >
                Plus tard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Match Modal */}
      {matchModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.8)",
            backdropFilter: "blur(6px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setMatchModal(null)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "24px",
              padding: "36px 28px",
              maxWidth: "420px",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: "64px", marginBottom: "8px" }}>🎉❤️</div>
            <h2 style={{ fontSize: "26px", fontWeight: 800, color: "#E10600", marginBottom: "8px" }}>
              C'est un Match !
            </h2>
            <p style={{ fontSize: "15px", color: "#475569", marginBottom: "24px", lineHeight: 1.5 }}>
              Vous et <strong style={{ color: "#0B2E6B" }}>{matchModal.firstName}</strong> vous êtes likés mutuellement !
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setMatchModal(null)}
                className="btn btn-ghost"
                style={{ flex: 1, color: "#64748B" }}
              >
                Continuer
              </button>
              <button
                onClick={() => {
                  setMatchModal(null);
                  handleInitiateExchange(matchModal, "CHAT");
                }}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                💬 Discuter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer brand signature */}
      <footer
        style={{
          marginTop: "60px",
          padding: "36px 16px 28px",
          textAlign: "center",
          borderTop: "1px solid #E2E8F0",
          background: "white",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            overflow: "hidden",
            border: "2px solid #E10600",
            background: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 10px rgba(225, 6, 0, 0.15)",
            padding: "3px",
          }}
        >
          <Image src="/logo.png" alt="Meet Me Club" width={38} height={38} style={{ objectFit: "contain" }} />
        </div>
        <div style={{ fontSize: "16px", fontWeight: 800, color: "#0B2E6B" }}>
          meet <span style={{ color: "#E10600" }}>me</span> club · Lomé, Togo
        </div>
        <p style={{ fontSize: "13px", color: "#64748B", margin: 0 }}>
          « Plus qu'une rencontre, un rendez-vous ! » · 🔞 Réservé aux 18 ans et plus
        </p>
      </footer>
    </div>
  );
}
