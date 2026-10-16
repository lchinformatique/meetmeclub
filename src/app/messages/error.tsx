"use client";
// src/app/messages/error.tsx
// Erreur dans la messagerie : récupération automatique (retour au profil en dernier recours).

import AutoRecover from "@/components/AutoRecover";

export default function MessagesError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <AutoRecover error={error} reset={reset} fallback="/profil" />;
}
