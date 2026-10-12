// src/app/profil/page.tsx
// Member profile page — high-contrast, fully reliable, shows plan quotas & personal details

import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getProfileByUserId, saveProfile, PLAN_LIMITS } from "@/lib/db-store";
import Header from "@/components/Header";
import LogoutButton from "@/components/LogoutButton";
import { Edit3, Camera, CalendarDays, ShieldCheck, Gem, ChevronRight, Lock, CheckCircle2, Clock } from "lucide-react";

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
    let dbUser: any = null;
    try {
      const { prisma } = await import("@/lib/prisma");
      dbUser = await prisma.user.findFirst({
        where: {
          OR: [
            { id: session.userId },
            ...(session.email ? [{ email: { equals: session.email, mode: "insensitive" as const } }] : []),
          ],
        },
        include: { profile: true },
      });
    } catch (e) {
      console.warn("Prisma user lookup warning:", e);
    }

    const fallbackFirstName = dbUser?.profile?.firstName || session.email?.split("@")[0] || "Membre";
    const fallbackPseudo = dbUser?.profile?.pseudo || fallbackFirstName;

    try {
      profile = saveProfile({
        userId: session.userId,
        firstName: fallbackFirstName,
        lastName: "",
        pseudo: fallbackPseudo,
        gender: (dbUser?.profile?.gender as any) || "OTHER",
        age: 26,
        phone: session.phone || undefined,
        city: dbUser?.profile?.city || "Lomé",
        neighborhood: dbUser?.profile?.neighborhood || "Centre-ville",
        profession: dbUser?.profile?.profession || "Membre actif",
        bio: dbUser?.profile?.bio || "Nouveau membre sur Meet Me Club à Lomé.",
        relationshipGoal: (dbUser?.profile?.relationshipGoal as any) || "SERIOUS",
        plan: "FREE",
        partnersContacted: [],
        photos: [
          { id: "p1", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80", isMain: true }
        ],
        interests: ["Discussions", "Sorties Lomé", "Cafés"],
        availabilities: [{ dayOfWeek: 5, startTime: "18:00", endTime: "22:00" }],
        isVerified: true,
        isVisible: true,
      });
    } catch {}

    if (!profile) {
      profile = {
        id: `prof_${session.userId}`,
        userId: session.userId,
        firstName: fallbackFirstName,
        pseudo: fallbackPseudo,
        gender: "OTHER",
        age: 26,
        city: "Lomé",
        bio: "Nouveau membre sur Meet Me Club à Lomé.",
        relationshipGoal: "SERIOUS",
        plan: "FREE",
        partnersContacted: [],
        photos: [
          { id: "p1", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80", isMain: true }
        ],
        interests: ["Discussions", "Sorties Lomé"],
        availabilities: [{ dayOfWeek: 5, startTime: "18:00", endTime: "22:00" }],
        isVerified: true,
        isVisible: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
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
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Link href="/profil/edit" className="btn btn-outline-blue btn-sm" style={{ fontWeight: 700 }}>
                      Modifier
                    </Link>
                    <LogoutButton variant="danger" label="Déconnexion" />
                  </div>
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
              <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid #E2E8F0" }}>
                <LogoutButton variant="danger" label="Se déconnecter de mon compte" style={{ width: "100%", justifyContent: "center" }} />
              </div>
            </div>

            {/* Verification Card for Chat Access */}
            <div className="card card-padded" style={{ background: "white", borderRadius: "var(--radius-xl)", border: "1.5px solid #E2E8F0", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: (profile.idDocumentSubmitted && profile.selfieSubmitted) ? "#DCFCE7" : "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {(profile.idDocumentVerified && profile.selfieVerified) ? <CheckCircle2 size={20} color="#16A34A" /> : <ShieldCheck size={20} color="#D97706" />}
                </div>
                <div>
                  <h3 style={{ fontSize: "14px", fontWeight: 800, color: "#0F172A", margin: 0 }}>Accès au Chat (18+)</h3>
                  <p style={{ fontSize: "11px", color: "#64748B", margin: 0 }}>Pièce d&apos;identité & Selfie obligatoires</p>
                </div>
              </div>
              <p style={{ fontSize: "12px", color: "#475569", lineHeight: 1.5, margin: "0 0 12px" }}>
                {(profile.idDocumentVerified && profile.selfieVerified)
                  ? "Votre identité est validée ! Vous pouvez chatter librement avec les membres selon votre plan."
                  : (profile.idDocumentSubmitted || profile.selfieSubmitted)
                  ? "Documents soumis ⏳. Validation en cours par notre équipe sous 24h pour activer le chat."
                  : "Obligatoire avant de pouvoir chatter : soumettez votre pièce d'identité et un selfie de conformité."}
              </p>
              <Link
                href="/profil/securite"
                className="btn btn-sm btn-outline-blue"
                style={{ width: "100%", textAlign: "center", justifyContent: "center", fontWeight: 700 }}
              >
                {(profile.idDocumentSubmitted && profile.selfieSubmitted) ? "Voir mon statut de sécurité" : "Soumettre ma pièce & mon selfie 🤳"}
              </Link>
            </div>
          </div>

          {/* ── Main Content Column ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

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
