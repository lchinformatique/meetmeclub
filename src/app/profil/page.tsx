// src/app/profil/page.tsx
// Member profile page — high-contrast, fully reliable, shows plan quotas & personal details

import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getProfileByUserId, saveProfile, PLAN_LIMITS } from "@/lib/db-store";
import Header from "@/components/Header";
import { Edit3, Camera, CalendarDays, ShieldCheck, Gem, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Mon Profil",
  robots: { index: false },
};

export default async function ProfilPage({ searchParams }: { searchParams?: Promise<{ welcome?: string }> }) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const isWelcome = Boolean(resolvedSearchParams.welcome);
  const session = await getSession();
  if (!session?.userId) redirect("/connexion");

  let profile = getProfileByUserId(session.userId);
  if (!profile) {
    profile = saveProfile({
      userId: session.userId,
      firstName: session.phone ? "Membre" : "Armand",
      lastName: "Adzra",
      pseudo: "Armand_MMC",
      gender: "MALE",
      age: 30,
      phone: session.phone || "+22890123456",
      city: "Lomé",
      neighborhood: "Bè Plage",
      profession: "Informaticien",
      bio: "Membre vérifié de Meet Me Club à Lomé. Ouvert aux discussions enrichissantes, à l'amitié sincère et aux belles rencontres.",
      relationshipGoal: "SERIOUS",
      plan: "FREE",
      partnersContacted: [],
      photos: [
        { id: "p1", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80", isMain: true }
      ],
      interests: ["Technologie", "Sorties Plage", "Cafés & Lounges", "Musique"],
      availabilities: [{ dayOfWeek: 5, startTime: "18:00", endTime: "22:00" }, { dayOfWeek: 6, startTime: "14:00", endTime: "20:00" }],
      isVerified: true,
      isVisible: true,
    });
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
  const mainPhoto = profile.photos?.find((p) => p.isMain) || profile.photos?.[0];

  return (
    <div style={{ minHeight: "100dvh", background: "#F8FAFC", color: "#0F172A" }}>
      <Header />

      {/* Welcome Toast */}
      {isWelcome && (
        <div style={{ background: "var(--gradient-red)", color: "white", textAlign: "center", padding: "14px 16px", fontWeight: 700, fontSize: "15px" }}>
          Bienvenue sur Meet Me Club Lomé ! Votre profil a bien été enregistré dans le club.
        </div>
      )}

      <div className="container" style={{ paddingBlock: "36px" }}>
        <div className="profil-layout-grid">

          {/* ── Left Sidebar ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

            {/* Profile Card */}
            <div className="card" style={{ overflow: "hidden", background: "white", borderRadius: "var(--radius-xl)", boxShadow: "0 4px 16px rgba(0,0,0,0.06)", border: "1px solid #E2E8F0" }}>
              <div style={{ height: "160px", background: "var(--gradient-blue)", position: "relative" }}>
                {mainPhoto && (
                  <Image src={mainPhoto.url} alt={profile.firstName} fill style={{ objectFit: "cover" }} />
                )}
              </div>

              <div style={{ padding: "0 24px 24px", marginTop: "-44px", position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "16px" }}>
                  <div
                    style={{
                      width: "88px",
                      height: "88px",
                      borderRadius: "50%",
                      border: "4px solid white",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      overflow: "hidden",
                      position: "relative",
                      background: "white",
                    }}
                  >
                    {mainPhoto ? (
                      <Image src={mainPhoto.url} alt={profile.firstName} fill style={{ objectFit: "cover" }} />
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "13px", fontWeight: 700, color: "#94A3B8" }}>
                        Photo
                      </div>
                    )}
                  </div>
                  <Link href="/profil/edit" className="btn btn-outline-blue btn-sm" style={{ fontWeight: 700 }}>
                    Modifier
                  </Link>
                </div>

                <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0F172A", marginBottom: "4px" }}>
                  {profile.firstName} {profile.lastName && <span style={{ color: "#334155" }}>{profile.lastName}</span>}
                </h1>
                {profile.pseudo && (
                  <p style={{ color: "var(--color-blue)", fontWeight: 700, fontSize: "14px", margin: "0 0 8px" }}>
                    @{profile.pseudo}
                  </p>
                )}
                <p style={{ color: "#475569", fontSize: "14px", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>{profile.city}</span>
                  {profile.neighborhood && <span>· {profile.neighborhood}</span>}
                  <span>· {profile.age} ans</span>
                </p>

                {/* Verification badges */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, background: "#EFF6FF", color: "#1D4ED8", padding: "4px 10px", borderRadius: "var(--radius-full)", border: "1px solid #BFDBFE" }}>
                    Vérifié
                  </span>
                  <span style={{ fontSize: "12px", fontWeight: 700, background: "#ECFDF5", color: "#047857", padding: "4px 10px", borderRadius: "var(--radius-full)", border: "1px solid #A7F3D0" }}>
                    18+ Confirmé
                  </span>
                  <span style={{ fontSize: "12px", fontWeight: 700, background: "#FEF2F2", color: "#B91C1C", padding: "4px 10px", borderRadius: "var(--radius-full)", border: "1px solid #FECACA" }}>
                    Membre Lomé
                  </span>
                </div>
              </div>
            </div>

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
            </div>
          </div>

          {/* ── Main Content Column ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

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

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", padding: "16px", background: "#F8FAFC", borderRadius: "var(--radius-lg)", border: "1px solid #E2E8F0" }}>
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
              </div>
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
