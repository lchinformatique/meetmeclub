"use client";
// src/app/support/page.tsx
// Contacter l'équipe Meet Me Club : ouvre la conversation d'assistance dans la messagerie
// interne. ?message=… préremplit le premier message (ex. prévenir avant un paiement).

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { openSupportChat } from "@/components/SupportChatLink";

function SupportInner() {
  const router = useRouter();
  const params = useSearchParams();
  useEffect(() => {
    openSupportChat(router, params.get("message") || "Bonjour l'équipe Meet Me Club, j'ai besoin d'aide.");
  }, [router, params]);
  return (
    <div style={{ minHeight: "60dvh", display: "flex", alignItems: "center", justifyContent: "center", color: "#3B4658", fontWeight: 600 }}>
      Ouverture de la messagerie de l&apos;équipe…
    </div>
  );
}

export default function SupportPage() {
  return (
    <Suspense fallback={null}>
      <SupportInner />
    </Suspense>
  );
}
