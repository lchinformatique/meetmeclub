"use client";
// Lien « Contacter l'équipe » : ouvre une conversation avec l'équipe Meet Me Club dans la
// messagerie interne (connexion demandée si besoin). Remplace l'assistance WhatsApp.

import { useState, type CSSProperties, type ReactNode } from "react";
import { useRouter } from "next/navigation";

export async function openSupportChat(router: ReturnType<typeof useRouter>, message?: string) {
  const r = await fetch("/api/support", { cache: "no-store" }).then((x) => x.json()).catch(() => ({ userId: null }));
  const target = r.userId
    ? `/messages?contact=${encodeURIComponent(r.userId)}${message ? `&message=${encodeURIComponent(message)}` : ""}`
    : "/messages";
  router.push(target);
}

export default function SupportChatLink({
  children,
  message,
  style,
  className,
}: {
  children: ReactNode;
  message?: string;
  style?: CSSProperties;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className={className}
      style={{ cursor: "pointer", ...style }}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await openSupportChat(router, message);
        setBusy(false);
      }}
    >
      {children}
    </button>
  );
}
