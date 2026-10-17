"use client";
// src/components/VerificationGate.tsx
// Renvoie vers /verification tout membre connecté dont le visage n'a pas encore été validé
// lorsqu'il ouvre un espace d'échange. Le serveur bloque de toute façon les actions
// (messages, appels, likes, rendez-vous) : ceci évite simplement des écrans vides.

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const GATED = ["/decouverte", "/messages", "/chat", "/discuter", "/vip", "/rendez-vous"];

export default function VerificationGate() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!pathname || !GATED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return;
    let cancelled = false;
    fetch("/api/verifications/selfie", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && data.verified === false && !data.grace) router.replace("/verification");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return null;
}
