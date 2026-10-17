// src/app/profil/page.tsx
// Member profile page — high-contrast, fully reliable, shows plan quotas & personal details

import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getProfileByUserId, saveProfile, PLAN_LIMITS, getSubscriptionStatus } from "@/lib/db-store";
import { findPermanentVipAccount } from "@/lib/subscription-constants";
import Header from "@/components/Header";
import LogoutButton from "@/components/LogoutButton";
import ProfileInteractiveCard from "@/components/ProfileInteractiveCard";
import SubscriptionCountdown from "@/components/SubscriptionCountdown";
import { Edit3, Camera, CalendarDays, ShieldCheck, Gem, ChevronRight, Lock, CheckCircle2, Clock, MessageSquare, Store } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Mon Profil",
  robots: { index: false },
};

export default async function ProfilPage({ searchParams }: { searchParams?: Promise<{ welcome?: string }> }) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const isWelcome = Boolean(resolvedSearchParams.welcome);
  const session = await getSession();
  if (!session?.userId) redirect("/connexion");

  // 1. Toujours chercher dans Prisma en priorité pour avoir les données fraîches
  let dbUser: any = null;
  try {
    const { prisma } = await import("@/lib/prisma");
    dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: session.userId },
          { profile: { pseudo: { equals: session.userId, mode: "insensitive" as const } } },
          ...(session.email ? [{ email: { equals: session.email, mode: "insensitive" as const } }] : []),
        ],
      },
      include: {
        profile: {
          include: {
            photos: { orderBy: { order: "asc" } },
          },
        },
      },
    });
  } catch (e) {
    console.warn("Prisma user lookup warning:", e);
  }

  // 2. Récupérer ou initialiser le profil local
  let profile = getProfileByUserId(session.userId);

  // Vérifier également Supabase REST pour garantir la persistance des photos, couverture et bio
  let supaProfile: any = null;
  try {
    const { getProfileFromSupabase } = await import("@/lib/supabase-server");
    supaProfile = await getProfileFromSupabase(session.userId, session.email || undefined);
  } catch (supaErr) {
    console.warn("Supabase profile lookup warning:", supaErr);
  }

  if (!profile) {
    if (supaProfile) {
      const supaPhotos = (supaProfile.photos && supaProfile.photos.length > 0)
        ? supaProfile.photos.map((ph: any) => ({ id: ph.id, url: ph.url, isMain: ph.isMain }))
        : [];

      profile = saveProfile({
        userId: session.userId,
        firstName: supaProfile.firstName || session.email?.split("@")[0] || "Membre",
        lastName: supaProfile.lastName || "",
        pseudo: supaProfile.pseudo || supaProfile.firstName,
        gender: (supaProfile.gender as any) || "OTHER",
        age: 26,
        phone: session.phone || supaProfile.phone || dbUser?.phone || undefined,
        city: supaProfile.city || "Lomé",
        neighborhood: supaProfile.neighborhood || "Centre-ville",
        profession: supaProfile.profession || "Membre actif",
        bio: supaProfile.bio !== undefined && supaProfile.bio !== null ? supaProfile.bio : "Nouveau membre sur Meet Me Club à Lomé.",
        relationshipGoal: (supaProfile.relationshipGoal as any) || "SERIOUS",
        relationshipStatus: supaProfile.relationshipStatus || "Célibataire",
        height: supaProfile.height || null,
        hasChildren: supaProfile.hasChildren ?? false,
        religion: supaProfile.religion || undefined,
        languages: supaProfile.languages || ["Français"],
        coverUrl: supaProfile.coverUrl || undefined,
        plan: supaProfile.plan || "FREE",
        subscriptionStartedAt: supaProfile.subscriptionStartedAt || undefined,
        subscriptionExpiresAt: supaProfile.subscriptionExpiresAt || undefined,
        partnersContacted: [],
        photos: supaPhotos,
        interests: ["Discussions", "Sorties Lomé", "Cafés"],
        availabilities: [{ dayOfWeek: 5, startTime: "18:00", endTime: "22:00" }],
        isVerified: true,
        isVisible: true,
      });
    } else if (dbUser?.profile) {
      const dp = dbUser.profile;
      const dbPhotos = (dp.photos && dp.photos.length > 0)
        ? dp.photos.map((ph: any) => ({ id: ph.id, url: ph.url, isMain: ph.isMain }))
        : [];

      profile = saveProfile({
        userId: session.userId,
        firstName: dp.firstName || session.email?.split("@")[0] || "Membre",
        lastName: "",
        pseudo: dp.pseudo || dp.firstName,
        gender: (dp.gender as any) || "OTHER",
        age: 26,
        phone: session.phone || dbUser.phone || undefined,
        city: dp.city || "Lomé",
        neighborhood: dp.neighborhood || "Centre-ville",
        profession: dp.profession || "Membre actif",
        bio: dp.bio || "Nouveau membre sur Meet Me Club à Lomé.",
        relationshipGoal: (dp.relationshipGoal as any) || "SERIOUS",
        relationshipStatus: dp.relationshipStatus || "Célibataire",
        height: dp.height || null,
        hasChildren: dp.hasChildren ?? false,
        religion: dp.religion || undefined,
        languages: dp.languages || ["Français"],
        plan: "FREE",
        partnersContacted: [],
        photos: dbPhotos,
        interests: ["Discussions", "Sorties Lomé", "Cafés"],
        availabilities: [{ dayOfWeek: 5, startTime: "18:00", endTime: "22:00" }],
        isVerified: true,
        isVisible: true,
      });
    } else {
      const fallbackFirstName = session.email?.split("@")[0] || "Membre";
      profile = saveProfile({
        userId: session.userId,
        firstName: fallbackFirstName,
        lastName: "",
        pseudo: fallbackFirstName,
        gender: "OTHER",
        age: 26,
        phone: session.phone || undefined,
        city: "Lomé",
        neighborhood: "Centre-ville",
        profession: "Membre actif",
        bio: "Nouveau membre sur Meet Me Club à Lomé.",
        relationshipGoal: "SERIOUS",
        relationshipStatus: "Célibataire",
        plan: "FREE",
        partnersContacted: [],
        photos: [],
        interests: ["Discussions", "Sorties Lomé", "Cafés"],
        availabilities: [{ dayOfWeek: 5, startTime: "18:00", endTime: "22:00" }],
        isVerified: true,
        isVisible: true,
      });
    }
  } else if (supaProfile || dbUser?.profile) {
    // Si le profil existe déjà, fusionner avec les données fraîches de Supabase ou Prisma
    const freshProfile = supaProfile || dbUser?.profile;
    const rawPhotos = (supaProfile?.photos && supaProfile.photos.length > 0)
      ? supaProfile.photos
      : (dbUser?.profile?.photos && dbUser.profile.photos.length > 0)
        ? dbUser.profile.photos
        : profile.photos;

    const filteredPhotos = (rawPhotos || [])
      .filter((ph: any) => ph.url && !ph.url.includes("dicebear.com/7.x/initials"))
      .map((ph: any) => ({ id: ph.id, url: ph.url, isMain: ph.isMain }));

    profile = saveProfile({
      ...profile,
      userId: session.userId,
      firstName: freshProfile.firstName || profile.firstName,
      lastName: freshProfile.lastName !== undefined ? freshProfile.lastName : profile.lastName,
      pseudo: freshProfile.pseudo || profile.pseudo,
      dateOfBirth: freshProfile.dateOfBirth || profile.dateOfBirth,
      placeOfBirth: freshProfile.placeOfBirth || profile.placeOfBirth,
      age: freshProfile.age || profile.age,
      bio: freshProfile.bio !== undefined ? freshProfile.bio : profile.bio,
      coverUrl: freshProfile.coverUrl || profile.coverUrl,
      city: freshProfile.city || profile.city,
      neighborhood: freshProfile.neighborhood || profile.neighborhood,
      profession: freshProfile.profession || profile.profession,
      relationshipStatus: freshProfile.relationshipStatus || profile.relationshipStatus,
      relationshipGoal: (freshProfile.relationshipGoal as any) || profile.relationshipGoal,
      height: freshProfile.height !== undefined ? freshProfile.height : profile.height,
      religion: freshProfile.religion || profile.religion,
      hasChildren: freshProfile.hasChildren ?? profile.hasChildren,
      languages: freshProfile.languages || profile.languages,
      photos: filteredPhotos.length > 0 ? filteredPhotos : (profile.photos?.filter((p: any) => !p.url.includes("dicebear.com/7.x/initials")) || []),
      phone: session.phone || freshProfile.phone || profile.phone,
      // L'abonnement enregistré dans Supabase fait foi
      ...(supaProfile?.plan
        ? {
            plan: supaProfile.plan,
            subscriptionStartedAt: supaProfile.subscriptionStartedAt || undefined,
            subscriptionExpiresAt: supaProfile.subscriptionExpiresAt || undefined,
          }
        : {}),
    });
  }

  // Administrateur : nombre de paiements en attente de validation
  const { isAdminSession } = await import("@/lib/admin-auth");
  const isAdmin = await isAdminSession(session);
  let pendingPayments = 0;
  if (isAdmin) {
    try {
      const { listActivationRequests } = await import("@/lib/payments-server");
      pendingPayments = (await listActivationRequests()).length;
    } catch {}
  }

  const planInfo = PLAN_LIMITS[profile.plan] || PLAN_LIMITS.FREE;
  const contactedCount = profile.partnersContacted?.length || 0;
  const maxPartners = planInfo.maxPartners;
  const isFree = profile.plan === "FREE";

  const GOAL_LABELS: Record<string, string> = {
    FRIENDSHIP: "Amitié & Partage",
    CASUAL: "Sorties & Convivialité",
    SERIOUS: "Relation sérieuse",
    MARRIAGE: "Mariage & Foyer",
    EXCHANGE: "Échange & Discussion",
  };

  const DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  const validPhotos = (profile.photos || []).filter((p) => p.url && !p.url.includes("dicebear.com/7.x/initials"));
  const mainPhoto = validPhotos.find((p) => p.isMain) || validPhotos[0];

  const displayName = (profile.firstName || "Membre").startsWith("google_") ? "Nouveau Membre" : (profile.firstName || "Membre");
  const displayPseudo = (profile.pseudo || "").startsWith("google_") ? "membre" : profile.pseudo;
  const cleanProfile = {
    ...profile,
    firstName: displayName,
    pseudo: displayPseudo,
  };

  return (
    <div style={{ minHeight: "100dvh", background: "#F8FAFC", color: "#0F172A" }}>
      <Header />

      {/* Welcome Toast */}
      {isWelcome && (
        <div style={{ background: "var(--gradient-red)", color: "white", textAlign: "center", padding: "14px 16px", fontWeight: 700, fontSize: "15px" }}>
          Bienvenue sur Meet Me Club Lomé ! Votre profil a bien été enregistré dans le club.
        </div>
      )}

      <div className="container" style={{ paddingBlock: "28px" }}>
        {/* ── Top Bar: Title, Security Status & Unmissable Logout Button ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "14px",
            marginBottom: "24px",
            padding: "16px 20px",
            background: "white",
            borderRadius: "var(--radius-lg)",
            border: "1px solid #E2E8F0",
            boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "18px" }}>👋</span>
              <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#0B2559", margin: 0 }}>
                Espace Membre · {displayName}
              </h1>
              {displayPseudo && (
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#2563EB", background: "#EFF6FF", padding: "2px 8px", borderRadius: "var(--radius-full)" }}>
                  @{displayPseudo}
                </span>
              )}
            </div>
            <p style={{ fontSize: "13px", color: "#64748B", margin: 0 }}>
              Connecté en toute sécurité · Plan {isFree ? "Gratuit" : profile.plan}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <Link
              href="/profil/securite"
              className="btn btn-outline-blue btn-sm"
              style={{ fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <ShieldCheck size={15} />
              <span>Sécurité & Pièce d&apos;identité</span>
            </Link>

            <LogoutButton
              variant="danger"
              label="Se déconnecter"
              style={{
                padding: "8px 18px",
                fontWeight: 800,
                fontSize: "13px",
                boxShadow: "0 2px 8px rgba(220, 38, 38, 0.20)",
              }}
            />
          </div>
        </div>

        {/* ── Compteur Animé d'expiration d'abonnement & Statistiques ── */}
        <SubscriptionCountdown
          initialStatus={getSubscriptionStatus(profile)}
          profile={profile}
        />

        {/* Administrateur : paiements à valider (tentatives SasPay des membres) */}
        {isAdmin && (
          <Link
            href="/admin/paiements"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              marginBottom: "16px",
              padding: "16px 18px",
              borderRadius: "16px",
              background: pendingPayments > 0 ? "linear-gradient(135deg, #E10600 0%, #B30500 100%)" : "linear-gradient(135deg, #0B2559 0%, #163B8A 100%)",
              color: "white",
              textDecoration: "none",
              boxShadow: "0 10px 26px rgba(11,37,89,0.25)",
            }}
          >
            <span style={{ fontSize: "26px" }}>💳</span>
            <span style={{ flex: 1 }}>
              <strong style={{ display: "block", fontSize: "16px" }}>
                {pendingPayments > 0 ? `${pendingPayments} paiement(s) à valider` : "Paiements des membres"}
              </strong>
              <span style={{ fontSize: "13px", opacity: 0.9 }}>
                Comparez avec l&apos;e-mail SasPay puis validez pour activer le pass.
              </span>
            </span>
            <ChevronRight size={22} />
          </Link>
        )}

        {/* Membres VIP : vérification d'identité requise pour le badge VIP vérifié */}
        {profile.plan === "VIP" &&
          !isAdmin &&
          !findPermanentVipAccount({ userId: profile.userId, email: profile.email, pseudo: profile.pseudo }) &&
          !(profile.idDocumentVerified && profile.selfieVerified) && (
          <Link
            href="/profil/securite"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              marginBottom: "24px",
              padding: "16px 18px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
              border: "1.5px solid #FCD34D",
              textDecoration: "none",
              color: "#78350F",
            }}
          >
            <span style={{ width: 44, height: 44, borderRadius: 12, background: "#F59E0B", color: "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <ShieldCheck size={22} />
            </span>
            <span style={{ flex: 1 }}>
              <strong style={{ display: "block", fontSize: "15px" }}>Validez votre identité VIP</strong>
              <span style={{ fontSize: "13px" }}>
                Pièce d&apos;identité + selfie : obligatoire pour le badge « VIP vérifié » et la confiance des membres.
              </span>
            </span>
            <ChevronRight size={20} />
          </Link>
        )}

        <div className="profil-layout-grid">

          {/* ── Left Sidebar ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

            {/* Interactive Profile Card with Click-to-Upload */}
            <ProfileInteractiveCard profile={cleanProfile} />

            {/* Subscription & Quota Card */}
            <div className="card card-padded" style={{ background: "white", borderRadius: "var(--radius-xl)", border: isFree ? "2px solid #F59E0B" : "2px solid var(--color-blue)", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: isFree ? "#B45309" : "var(--color-blue)" }}>
                  Mon Abonnement
                </span>
                <span style={{ background: isFree ? "#FEF3C7" : "#DBEAFE", color: isFree ? "#92400E" : "#1E40AF", fontSize: "12px", fontWeight: 800, padding: "3px 10px", borderRadius: "var(--radius-full)" }}>
                  {isFree ? "Gratuit" : profile.plan}
                </span>
              </div>

              <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0F172A", marginBottom: "8px" }}>
                {planInfo.label}
              </h2>

              {isFree ? (
                <>
                  <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: "var(--radius-md)", padding: "12px", marginBottom: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 700, color: "#92400E", marginBottom: "6px" }}>
                      <span>Partenaires autorisés :</span>
                      <span>{contactedCount} / 3 partenaires</span>
                    </div>
                    <div style={{ height: "6px", background: "#E5E7EB", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(100, (contactedCount / 3) * 100)}%`, background: contactedCount >= 3 ? "#EF4444" : "#F59E0B" }} />
                    </div>
                    <p style={{ fontSize: "12px", color: "#78350F", margin: "8px 0 0", lineHeight: 1.4 }}>
                      {contactedCount >= 3
                        ? "Quota de 3 partenaires atteint. Passez au Pass Essentiel pour échanger sans limite."
                        : `Il vous reste ${3 - contactedCount} partenaire(s) gratuit(s) à choisir.`}
                    </p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <a
                      href="https://link.saspay.me/dtpycov9i-k"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                      style={{ width: "100%", textAlign: "center", justifyContent: "center", fontWeight: 800, fontSize: "14px", textDecoration: "none" }}
                    >
                      Passer au Pass Illimité — 3 000 F
                    </a>
                    <Link
                      href="/tarifs"
                      className="btn btn-outline-blue btn-sm"
                      style={{ width: "100%", textAlign: "center", justifyContent: "center", fontWeight: 700 }}
                    >
                      Voir les offres Complice (6 000 F) & VIP (15 000 F)
                    </Link>
                  </div>
                </>
              ) : (
                <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "var(--radius-md)", padding: "12px", marginBottom: "16px" }}>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "#166534", margin: 0 }}>
                    Échanges, discussions et partenaires illimités actifs.
                  </p>
                </div>
              )}
            </div>

            {/* Quick Navigation */}
            <div className="card card-padded" style={{ background: "white", borderRadius: "var(--radius-xl)", border: "1px solid #E2E8F0" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  { href: "/profil/edit", Icon: Edit3, label: "Modifier mes informations" },
                  { href: "/profil/photos", Icon: Camera, label: "Mes photos" },
                  { href: "/profil/disponibilites", Icon: CalendarDays, label: "Mes créneaux de sortie" },
                  { href: "/pro/mon-espace", Icon: Store, label: "Mon Espace Pro & mes annonces" },
                  { href: "/profil/securite", Icon: ShieldCheck, label: "Sécurité & Déconnexion" },
                  { href: "/tarifs", Icon: Gem, label: "Voir tous les abonnements" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 12px",
                      borderRadius: "var(--radius-md)",
                      color: "#1E293B",
                      textDecoration: "none",
                      fontSize: "14px",
                      fontWeight: 600,
                      transition: "background 0.15s ease",
                    }}
                  >
                    <item.Icon size={16} style={{ color: "#0B2559", flexShrink: 0 }} />
                    <span>{item.label}</span>
                    <ChevronRight size={14} style={{ marginLeft: "auto", color: "#94A3B8" }} />
                  </Link>
                ))}
              </div>
              <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid #E2E8F0" }}>
                <LogoutButton variant="danger" label="Se déconnecter de mon compte" style={{ width: "100%", justifyContent: "center" }} />
              </div>
            </div>

            {/* Direct Chat Access Card */}
            <div className="card card-padded" style={{ background: "white", borderRadius: "var(--radius-xl)", border: "1.5px solid #E2E8F0", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <MessageSquare size={18} color="#16A34A" />
                </div>
                <div>
                  <h3 style={{ fontSize: "14px", fontWeight: 800, color: "#0F172A", margin: 0 }}>Chat & Rencontres Directs</h3>
                  <p style={{ fontSize: "11px", color: "#16A34A", margin: 0, fontWeight: 700 }}>✓ Accès Actif · 3 discussions offertes</p>
                </div>
              </div>
              <p style={{ fontSize: "12px", color: "#475569", lineHeight: 1.5, margin: "0 0 12px" }}>
                Votre salon membre est prêt. Vous pouvez explorer les profils connectés et commencer à discuter dès maintenant.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <Link
                  href="/decouverte"
                  className="btn btn-sm"
                  style={{
                    width: "100%",
                    textAlign: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    background: "linear-gradient(135deg, #0B2559 0%, #163B8A 100%)",
                    color: "white",
                    padding: "9px 14px",
                    borderRadius: "10px",
                    textDecoration: "none",
                    boxShadow: "0 4px 12px rgba(11,37,89,0.20)",
                  }}
                >
                  Découvrir les membres & chatter 💬
                </Link>
                <Link
                  href="/profil/securite"
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#2563EB",
                    textAlign: "center",
                    textDecoration: "none",
                    padding: "4px",
                  }}
                >
                  Badge Certifié 🛡️ (Optionnel)
                </Link>
              </div>
            </div>
          </div>

          {/* ── Main Content Column ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

            {/* ── Alerte Photo : Incitation à ajouter sa vraie photo ── */}
            {!mainPhoto && (
              <div
                style={{
                  background: "linear-gradient(135deg, #EFF6FF 0%, #F5F3FF 100%)",
                  border: "1.5px solid #BFDBFE",
                  borderRadius: "var(--radius-xl)",
                  padding: "18px 22px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "14px",
                  boxShadow: "0 4px 14px rgba(37,99,235,0.08)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background: "white",
                      border: "1.5px solid #DBEAFE",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#1D4ED8",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                      flexShrink: 0,
                    }}
                  >
                    <Camera size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#1E3A8A", margin: "0 0 3px" }}>
                      Ajoutez votre photo de profil
                    </h3>
                    <p style={{ fontSize: "13px", color: "#475569", margin: 0, fontWeight: 500 }}>
                      Aucune fausse image par défaut : importez votre vraie photo pour être visible des membres du club.
                    </p>
                  </div>
                </div>
                <Link
                  href="/profil/photos"
                  className="btn btn-primary btn-sm"
                  style={{
                    background: "linear-gradient(135deg, #E10600 0%, #B30500 100%)",
                    color: "white",
                    fontWeight: 800,
                    fontSize: "13px",
                    padding: "10px 18px",
                    borderRadius: "12px",
                    textDecoration: "none",
                    boxShadow: "0 4px 14px rgba(225,6,0,0.28)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Camera size={15} />
                  <span>Ajouter ma photo</span>
                </Link>
              </div>
            )}

            {/* ── Chat & Options d'enrichissement Bannière ── */}
            <div
              style={{
                background: "linear-gradient(135deg, #0B2559 0%, #163B8A 100%)",
                borderRadius: "var(--radius-xl)",
                padding: "24px",
                color: "white",
                boxShadow: "0 10px 30px rgba(11,37,89,0.18)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "18px" }}>
                <div>
                  <span style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#FDE047", display: "inline-block", marginBottom: "4px" }}>
                    Espace Rencontres & Chat · Plan Gratuit
                  </span>
                  <h2 style={{ fontSize: "22px", fontWeight: 800, color: "white", margin: 0 }}>
                    Bienvenue dans votre salon membre, {profile.firstName} !
                  </h2>
                  <p style={{ fontSize: "14px", color: "#CBD5E1", margin: "6px 0 0", maxWidth: "560px", lineHeight: 1.5 }}>
                    Vos informations enrichissent les conversations avec les membres. Complétez vos photos, votre bio et vos créneaux pour commencer à chatter.
                  </p>
                </div>
                <Link
                  href="/messages"
                  className="btn btn-primary btn-md"
                  style={{
                    background: "linear-gradient(135deg, #E10600 0%, #B30500 100%)",
                    color: "white",
                    fontWeight: 800,
                    fontSize: "14px",
                    boxShadow: "0 4px 14px rgba(225,6,0,0.40)",
                    textDecoration: "none",
                  }}
                >
                  💬 Accéder au Chat ({Math.max(0, 3 - (profile.partnersContacted?.length || 0))} restants) →
                </Link>
              </div>

              {/* Raccourcis rapides d'enrichissement */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
                <Link
                  href="/profil/photos"
                  style={{
                    background: "rgba(255,255,255,0.12)",
                    borderRadius: "12px",
                    padding: "10px 12px",
                    textDecoration: "none",
                    color: "white",
                    fontSize: "13px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Camera size={16} color="#93C5FD" />
                  <span>Mes Photos</span>
                </Link>
                <Link
                  href="/profil/edit"
                  style={{
                    background: "rgba(255,255,255,0.12)",
                    borderRadius: "12px",
                    padding: "10px 12px",
                    textDecoration: "none",
                    color: "white",
                    fontSize: "13px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Edit3 size={16} color="#93C5FD" />
                  <span>Ma Bio & Infos</span>
                </Link>
                <Link
                  href="/profil/disponibilites"
                  style={{
                    background: "rgba(255,255,255,0.12)",
                    borderRadius: "12px",
                    padding: "10px 12px",
                    textDecoration: "none",
                    color: "white",
                    fontSize: "13px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <CalendarDays size={16} color="#93C5FD" />
                  <span>Créneaux sorties</span>
                </Link>
                <Link
                  href="/profil/securite"
                  style={{
                    background: "rgba(255,255,255,0.12)",
                    borderRadius: "12px",
                    padding: "10px 12px",
                    textDecoration: "none",
                    color: "white",
                    fontSize: "13px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <ShieldCheck size={16} color="#86EFAC" />
                  <span>Pièce & Selfie</span>
                </Link>
              </div>
            </div>

            {/* Personal Details & Bio */}
            <div className="card card-padded" style={{ background: "white", borderRadius: "var(--radius-xl)", border: "1px solid #E2E8F0", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--color-blue)", margin: 0 }}>
                  À propos de moi
                </h2>
                <Link href="/profil/edit" className="btn btn-ghost btn-sm" style={{ fontWeight: 700, color: "var(--color-blue)" }}>
                  Modifier
                </Link>
              </div>

              <p style={{ fontSize: "15px", color: "#334155", lineHeight: 1.7, marginBottom: "20px" }}>
                {profile.bio || "Aucune description pour le moment. Cliquez sur Modifier pour vous présenter aux membres !"}
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", padding: "16px", background: "#F8FAFC", borderRadius: "var(--radius-lg)", border: "1px solid #E2E8F0" }}>
                <div>
                  <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600, display: "block" }}>Profession</span>
                  <strong style={{ fontSize: "14px", color: "#0F172A" }}>{profile.profession || "Non spécifiée"}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600, display: "block" }}>Statut relationnel</span>
                  <strong style={{ fontSize: "14px", color: "#0F172A" }}>{profile.relationshipStatus || "Célibataire"}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600, display: "block" }}>Quartier à Lomé</span>
                  <strong style={{ fontSize: "14px", color: "#0F172A" }}>{profile.neighborhood || "Lomé"}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600, display: "block" }}>Téléphone</span>
                  <strong style={{ fontSize: "14px", color: "#0F172A" }}>{profile.phone || "+228 90 XX XX XX"}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600, display: "block" }}>Taille</span>
                  <strong style={{ fontSize: "14px", color: "#0F172A" }}>{profile.height ? `${profile.height} cm` : "Non précisée"}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600, display: "block" }}>Enfants</span>
                  <strong style={{ fontSize: "14px", color: "#0F172A" }}>{profile.hasChildren ? "A des enfants" : "Sans enfant"}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600, display: "block" }}>Langues</span>
                  <strong style={{ fontSize: "14px", color: "#0F172A" }}>
                    {Array.isArray(profile.languages) && profile.languages.length > 0
                      ? profile.languages.join(", ")
                      : "Français"}
                  </strong>
                </div>
                {profile.placeOfBirth && (
                  <div>
                    <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600, display: "block" }}>Lieu de naissance</span>
                    <strong style={{ fontSize: "14px", color: "#0F172A" }}>{profile.placeOfBirth}</strong>
                  </div>
                )}
                {profile.dateOfBirth && (
                  <div>
                    <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600, display: "block" }}>Date de naissance</span>
                    <strong style={{ fontSize: "14px", color: "#0F172A" }}>
                      {String(profile.dateOfBirth).split("T")[0]} ({profile.age || 25} ans)
                    </strong>
                  </div>
                )}
                {profile.religion && (
                  <div>
                    <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600, display: "block" }}>Religion</span>
                    <strong style={{ fontSize: "14px", color: "#0F172A" }}>{profile.religion}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Album Photos du profil (Jusqu'a 4 photos) */}
            <div className="card card-padded" style={{ background: "white", borderRadius: "var(--radius-xl)", border: "1px solid #E2E8F0", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--color-blue)", margin: "0 0 4px" }}>
                    Photos de Bio & Profil ({Math.min(profile.photos?.length || 0, 4)}/4)
                  </h2>
                  <p style={{ fontSize: "13px", color: "#64748B", margin: 0 }}>
                    Consultable et visualisable par les membres en ligne lors du chat.
                  </p>
                </div>
                <Link href="/profil/edit" className="btn btn-outline-blue btn-sm" style={{ fontWeight: 700 }}>
                  Gérer mes photos
                </Link>
              </div>

              {profile.photos && profile.photos.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "12px" }}>
                  {profile.photos.map((ph, idx) => (
                    <div
                      key={ph.id || idx}
                      style={{
                        position: "relative",
                        aspectRatio: "1/1",
                        borderRadius: "14px",
                        overflow: "hidden",
                        border: ph.isMain ? "3px solid #2563EB" : "1.5px solid #E2E8F0",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      }}
                    >
                      <img src={ph.url} alt={`Photo ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      {ph.isMain && (
                        <div style={{ position: "absolute", top: "6px", left: "6px", background: "#2563EB", color: "white", padding: "2px 8px", borderRadius: "100px", fontSize: "10px", fontWeight: 800 }}>
                          ★ Profil
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "24px", background: "#F8FAFC", borderRadius: "12px", border: "1.5px dashed #CBD5E1" }}>
                  <p style={{ color: "#64748B", fontSize: "14px", margin: "0 0 10px" }}>Aucune photo dans votre album pour le moment.</p>
                  <Link href="/profil/edit" className="btn btn-primary btn-sm" style={{ fontWeight: 800 }}>
                    + Ajouter des photos à mon album
                  </Link>
                </div>
              )}
            </div>

            {/* Relationship Goal & Intentions */}
            <div className="card card-padded" style={{ background: "white", borderRadius: "var(--radius-xl)", border: "1px solid #E2E8F0", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--color-blue)", margin: 0 }}>
                  Ce que je recherche
                </h2>
                <Link href="/profil/edit" className="btn btn-ghost btn-sm" style={{ fontWeight: 700, color: "var(--color-blue)" }}>
                  Modifier
                </Link>
              </div>

              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#FEF2F2", color: "var(--color-red)", padding: "8px 18px", borderRadius: "var(--radius-full)", fontWeight: 800, fontSize: "15px", border: "1px solid #FECACA", marginBottom: "12px" }}>
                {GOAL_LABELS[profile.relationshipGoal] || profile.relationshipGoal}
              </div>
              <p style={{ color: "#475569", fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
                Sur Meet Me Club, vous pouvez vous faire de nouveaux amis, discuter librement, partager des passions ou faire une belle rencontre amoureuse dans les meilleurs lieux de Lomé.
              </p>
            </div>

            {/* Interests Chips */}
            <div className="card card-padded" style={{ background: "white", borderRadius: "var(--radius-xl)", border: "1px solid #E2E8F0", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--color-blue)", margin: 0 }}>
                  Centres d&apos;intérêt ({profile.interests?.length || 0})
                </h2>
                <Link href="/profil/edit" className="btn btn-ghost btn-sm" style={{ fontWeight: 700, color: "var(--color-blue)" }}>
                  Modifier
                </Link>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {profile.interests && profile.interests.length > 0 ? (
                  profile.interests.map((interest: string, i: number) => (
                    <span
                      key={i}
                      style={{
                        background: "#EFF6FF",
                        color: "var(--color-blue)",
                        padding: "6px 14px",
                        borderRadius: "var(--radius-full)",
                        fontWeight: 700,
                        fontSize: "13px",
                        border: "1px solid #DBEAFE",
                      }}
                    >
                      {interest}
                    </span>
                  ))
                ) : (
                  <p style={{ color: "#64748B", fontSize: "14px" }}>Aucun centre d&apos;intérêt sélectionné.</p>
                )}
              </div>
            </div>

            {/* Availabilities */}
            <div className="card card-padded" style={{ background: "white", borderRadius: "var(--radius-xl)", border: "1px solid #E2E8F0", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--color-blue)", margin: 0 }}>
                  Mes jours libres pour sortir & échanger
                </h2>
                <Link href="/profil/disponibilites" className="btn btn-ghost btn-sm" style={{ fontWeight: 700, color: "var(--color-blue)" }}>
                  Gérer
                </Link>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px" }}>
                {DAYS.map((day, idx) => {
                  const isActive = profile.availabilities?.some((a) => a.dayOfWeek === idx);
                  return (
                    <div
                      key={day}
                      style={{
                        textAlign: "center",
                        padding: "12px 6px",
                        borderRadius: "var(--radius-md)",
                        background: isActive ? "var(--color-blue)" : "#F1F5F9",
                        color: isActive ? "white" : "#64748B",
                        fontWeight: 800,
                        fontSize: "13px",
                      }}
                    >
                      {day}
                      <span style={{ display: "block", fontSize: "10px", marginTop: "2px", opacity: 0.85 }}>
                        {isActive ? "Libre" : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Déconnexion Rapide & Sécurisée ── */}
            <div
              className="card card-padded"
              style={{
                background: "#FEF2F2",
                borderRadius: "var(--radius-xl)",
                border: "1.5px solid #FCA5A5",
                marginTop: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "16px",
                padding: "20px 24px",
              }}
            >
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#991B1B", margin: "0 0 4px 0" }}>
                  Déconnexion de votre compte
                </h3>
                <p style={{ fontSize: "13px", color: "#7F1D1D", margin: 0 }}>
                  Vous pouvez vous reconnecter à tout moment avec votre e-mail ou votre pseudo.
                </p>
              </div>
              <LogoutButton
                variant="danger"
                label="Se déconnecter"
                style={{
                  padding: "10px 24px",
                  fontWeight: 800,
                  fontSize: "14px",
                  boxShadow: "0 4px 14px rgba(220, 38, 38, 0.25)",
                }}
              />
            </div>

          </div>
        </div>
      </div>

      {/* Footer Signature */}
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
            border: "2px solid var(--color-red)",
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
        <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--color-blue)" }}>
          meet <span style={{ color: "var(--color-red)" }}>me</span> club · Lomé, Togo
        </div>
        <p style={{ fontSize: "12px", color: "#64748B", margin: 0 }}>
          « Plus qu&apos;une rencontre, un rendez-vous ! » · Réservé aux 18 ans et plus
        </p>
      </footer>
    </div>
  );
}
