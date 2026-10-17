"use client";
// src/app/verification/page.tsx
// Vérification obligatoire, selon la formule du membre :
//  · Essai gratuit       → selfie en direct avec geste imposé (contrôlé par l'équipe)
//  · Essentiel / Complice → pièce d'identité (pré-contrôle IA, sinon équipe)
//  · VIP                 → vidéo en direct (contrôlée par l'équipe, débloque les appels)

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronLeft, ImagePlus, Loader2 } from "lucide-react";
import SelfieStep from "./_components/SelfieStep";
import DocumentStep from "./_components/DocumentStep";
import VideoStep from "./_components/VideoStep";
import { card, lead, NAVY, primaryBtn, title, type VerificationData } from "./_components/ui";

const PLAN_LABEL: Record<string, string> = {
  FREE: "Essai gratuit",
  ESSENTIAL: "Pack Essentiel",
  COMPLICE: "Pack Complice",
  VIP: "Pass VIP",
};

export default function VerificationPage() {
  const router = useRouter();
  const [data, setData] = useState<VerificationData | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/verifications/selfie", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/connexion?callbackUrl=/verification");
      return;
    }
    const d = await res.json();
    if (!res.ok) return setError(d.error || "Chargement impossible.");
    setData(d);
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  // Une vérification est en attente : on regarde régulièrement si l'équipe a répondu
  const waiting = data && [data.selfie?.status, data.document?.status, data.video?.status].includes("PENDING");
  useEffect(() => {
    if (!waiting) return;
    const t = setInterval(load, 20_000);
    return () => clearInterval(t);
  }, [waiting, load]);

  function body() {
    if (!data) {
      return (
        <div style={card}>
          {error ? (
            <p style={{ color: "#B91C1C", fontWeight: 600 }}>{error}</p>
          ) : (
            <Loader2 size={32} color={NAVY} style={{ animation: "spin 1s linear infinite" }} />
          )}
        </div>
      );
    }

    const docsReady = data.docsConfigured !== false;
    const isVip = data.plan === "VIP";
    const needsVideo = isVip && docsReady && !data.isAdmin && data.video?.status !== "APPROVED";

    if (data.verified) {
      return (
        <div style={{ display: "grid", gap: 16 }}>
          <div style={card}>
            <CheckCircle2 size={56} color="#16A34A" style={{ margin: "0 auto 12px" }} />
            <h1 style={{ ...title, fontSize: 24 }}>Profil vérifié</h1>
            <p style={lead}>
              {data.isAdmin
                ? "Compte administrateur : aucune vérification n'est nécessaire."
                : "Votre profil a été vérifié. Vous pouvez échanger avec tous les membres."}
            </p>
            <Link href="/decouverte" style={primaryBtn}>
              Découvrir les membres
            </Link>
          </div>
          {needsVideo && <VideoStep data={data} onDone={load} verifiedAlready />}
        </div>
      );
    }

    // Une photo de profil est nécessaire pour comparer (selfie et vidéo)
    const needsPhoto = !isDocumentPlan(data.plan, docsReady);
    if (needsPhoto && (!data.hasProfile || !data.hasProfilePhoto)) {
      return (
        <div style={card}>
          <ImagePlus size={52} color={NAVY} style={{ margin: "0 auto 12px" }} />
          <h1 style={title}>Ajoutez d&apos;abord une photo</h1>
          <p style={lead}>
            Votre vérification sera comparée à votre photo de profil. Ajoutez une photo nette où l&apos;on voit bien votre
            visage, puis revenez ici.
          </p>
          <Link href={data.hasProfile ? "/profil/photos" : "/profil/edit"} style={primaryBtn}>
            {data.hasProfile ? "Ajouter ma photo de profil" : "Compléter mon profil"}
          </Link>
        </div>
      );
    }

    if (isVip && docsReady) return <VideoStep data={data} onDone={load} verifiedAlready={false} />;
    if (isDocumentPlan(data.plan, docsReady)) return <DocumentStep data={data} onDone={load} />;
    return <SelfieStep data={data} onDone={load} />;
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#F8FAFC" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <header style={{ background: "white", borderBottom: "1px solid #E2E8F0", height: 64, display: "flex", alignItems: "center", position: "sticky", top: 0, zIndex: 40 }}>
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/profil" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none", color: NAVY, fontWeight: 700, fontSize: 14 }}>
            <ChevronLeft size={18} />
            <span>Mon profil</span>
          </Link>
          <span style={{ fontWeight: 800, color: NAVY, fontSize: 15 }}>
            Vérification{data?.plan ? ` · ${PLAN_LABEL[data.plan]}` : ""}
          </span>
        </div>
      </header>
      <main className="container" style={{ maxWidth: 480, paddingBlock: 28 }}>
        {body()}
      </main>
    </div>
  );
}

function isDocumentPlan(plan: string, docsReady: boolean) {
  return docsReady && (plan === "ESSENTIAL" || plan === "COMPLICE");
}
