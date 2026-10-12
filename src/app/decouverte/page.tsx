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

const SAMPLE_PROFILES: ProfileItem[] = [
  {
    id: "prof_1",
    userId: "usr_1",
    firstName: "Ama",
    pseudo: "Ama_Lomé",
    gender: "FEMALE",
    city: "Lomé",
    neighborhood: "Nyékonakpoè",
    profession: "Styliste de mode",
    relationshipGoal: "SERIOUS",
    bio: "Passionnée de culture togolaise, de bonne musique acoustique et de sorties conviviales. Ouverte pour discuter, se faire des amis ou trouver une belle relation sincère.",
    profileCompleteness: 95,
    photos: [
      { id: "p1", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80", isMain: true },
    ],
    interests: [
      { interest: { id: "i1", name: "Mode & Design", icon: "👗" } },
      { interest: { id: "i2", name: "Musique Live", icon: "🎵" } },
      { interest: { id: "i3", name: "Gastronomie", icon: "🍽️" } },
    ],
    verifications: [{ type: "SELFIE" }, { type: "PHONE" }],
    age: 24,
  },
  {
    id: "prof_2",
    userId: "usr_2",
    firstName: "Koffi",
    pseudo: "Koffi_Pro",
    gender: "MALE",
    city: "Lomé",
    neighborhood: "Tokoin",
    profession: "Ingénieur logiciel",
    relationshipGoal: "FRIENDSHIP",
    bio: "Curieux et attentionné. J'aime partager des discussions enrichissantes autour d'un cocktail ou d'un café, échanger et faire de belles rencontres dans le respect.",
    profileCompleteness: 90,
    photos: [
      { id: "p2", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80", isMain: true },
    ],
    interests: [
      { interest: { id: "i4", name: "Technologie", icon: "💻" } },
      { interest: { id: "i5", name: "Cafés & Lounges", icon: "☕" } },
      { interest: { id: "i6", name: "Entrepreneuriat", icon: "💼" } },
    ],
    verifications: [{ type: "PHONE" }],
    age: 28,
  },
  {
    id: "prof_3",
    userId: "usr_3",
    firstName: "Farida",
    pseudo: "Farida_B",
    gender: "FEMALE",
    city: "Lomé",
    neighborhood: "Bè-Kpota",
    profession: "Comptable & Danseuse",
    relationshipGoal: "EXCHANGE",
    bio: "Souriante et dynamique ! J'adore l'art, les soirées détendues au bord de la plage à Lomé et rire. Discutons en toute franchise.",
    profileCompleteness: 88,
    photos: [
      { id: "p3", url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80", isMain: true },
    ],
    interests: [
      { interest: { id: "i7", name: "Danse & Art", icon: "🎨" } },
      { interest: { id: "i8", name: "Plage de Lomé", icon: "🌊" } },
      { interest: { id: "i9", name: "Cinéma", icon: "🎬" } },
    ],
    verifications: [{ type: "SELFIE" }, { type: "PHONE" }],
    age: 26,
  },
  {
    id: "prof_4",
    userId: "usr_4",
    firstName: "Edem",
    pseudo: "Edem_Togo",
    gender: "MALE",
    city: "Lomé",
    neighborhood: "Agoè-Nyivé",
    profession: "Architecte d'intérieur",
    relationshipGoal: "SERIOUS",
    bio: "Épicurien et respectueux. Recherche des échanges authentiques, une complicité intellectuelle et de bons moments partagés.",
    profileCompleteness: 92,
    photos: [
      { id: "p4", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80", isMain: true },
    ],
    interests: [
      { interest: { id: "i10", name: "Architecture", icon: "📐" } },
      { interest: { id: "i11", name: "Jazz & Soul", icon: "🎷" } },
      { interest: { id: "i12", name: "Fitness", icon: "💪" } },
    ],
    verifications: [{ type: "PHONE" }],
    age: 31,
  },
];

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
  const [upgradeModal, setUpgradeModal] = useState<{ open: boolean; targetName?: string }>({ open: false });
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
          router.push("/connexion");
          return;
        }
        const data = await res.json();
        if (data.profiles && data.profiles.length > 0) {
          setProfiles(data.profiles);
        } else {
          setProfiles(SAMPLE_PROFILES);
        }
      } catch {
        setProfiles(SAMPLE_PROFILES);
      } finally {
        setLoading(false);
      }
    }
    fetchProfiles();
  }, [router]);

  // Handle contact attempt with subscription quota enforcement
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
      await fetch("/api/partners/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: targetId }),
      });
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

      {/* Main Container */}
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
      </main>

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
                  padding: "11px",
                  borderRadius: "12px",
                  fontWeight: 700,
                  fontSize: "13px",
                  background: "#E10600",
                  borderColor: "#E10600",
                  color: "white",
                }}
              >
                Activer via T-Money / Moov Money
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
