"use client";
// src/app/error.tsx
// Erreur d'une page : récupération automatique, sans écran à boutons.

import AutoRecover from "@/components/AutoRecover";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <AutoRecover error={error} reset={reset} />;
}
