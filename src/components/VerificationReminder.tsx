"use client";
// Rappel aux nouveaux membres pendant leurs 3 jours d'essai : ils peuvent échanger, mais doivent
// faire leur vérification (selfie) avant la date limite, sinon les échanges seront bloqués.

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, X } from "lucide-react";

const HIDDEN_ON = ["/verification", "/admin", "/connexion", "/inscription", "/onboarding", "/auth", "/support", "/legal"];
const LATER_KEY = "mmc:verif-reminder-later";

function remaining(endIso: string) {
  const ms = new Date(endIso).getTime() - Date.now();
  if (ms <= 0) return "aujourd'hui";
  const h = Math.ceil(ms / 3600000);
  return h >= 48 ? `${Math.ceil(h / 24)} jours` : h >= 24 ? "1 jour" : `${h} h`;
}

export default function VerificationReminder() {
  const pathname = usePathname() || "/";
  const [endsAt, setEndsAt] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
      setEndsAt(null);
      return;
    }
    try {
      if (sessionStorage.getItem(LATER_KEY)) return;
    } catch {}
    let alive = true;
    fetch("/api/verifications/selfie", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive || !d) return;
        setEndsAt(d.grace && d.graceEndsAt ? d.graceEndsAt : null);
        setPending([d.selfie?.status, d.document?.status, d.video?.status].includes("PENDING"));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [pathname]);

  if (!endsAt) return null;

  const date = new Date(endsAt).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div
      role="status"
      style={{
        position: "fixed",
        left: 12,
        right: 12,
        bottom: "calc(78px + env(safe-area-inset-bottom))",
        zIndex: 9990,
        maxWidth: 560,
        margin: "0 auto",
        background: "#FFF8EC",
        border: "1.5px solid #F3DFB5",
        borderRadius: 16,
        padding: "12px 40px 12px 14px",
        boxShadow: "0 12px 30px rgba(24,34,58,0.18)",
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <ShieldCheck size={22} color="#B7791F" style={{ flexShrink: 0 }} />
      <span style={{ flex: "1 1 200px", fontSize: 13.5, color: "#5C3F12", lineHeight: 1.45 }}>
        {pending ? (
          <>
            <strong>Votre vérification est en cours.</strong> L&apos;équipe la valide très vite : continuez à échanger en attendant.
          </>
        ) : (
          <>
            <strong>Validez votre profil par selfie avant {date}</strong> (encore {remaining(endsAt)}) pour continuer à échanger
            avec les membres.
          </>
        )}
      </span>
      {!pending && (
        <Link
          href="/verification"
          style={{ background: "#2F4A8A", color: "#fff", fontWeight: 800, fontSize: 14, padding: "9px 14px", borderRadius: 12, textDecoration: "none", whiteSpace: "nowrap" }}
        >
          Faire ma vérification
        </Link>
      )}
      <button
        type="button"
        aria-label="Masquer pour cette visite"
        onClick={() => {
          try {
            sessionStorage.setItem(LATER_KEY, "1");
          } catch {}
          setEndsAt(null);
        }}
        style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: 14, border: "none", background: "transparent", color: "#8A6A2F", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
