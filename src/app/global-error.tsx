"use client";
// src/app/global-error.tsx
// Erreur au niveau racine : récupération automatique, sans écran à boutons.

import AutoRecover from "@/components/AutoRecover";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="fr">
      <head>
        <title>Meet Me Club</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
      </head>
      <body style={{ margin: 0 }}>
        <AutoRecover error={error} reset={reset} />
      </body>
    </html>
  );
}
