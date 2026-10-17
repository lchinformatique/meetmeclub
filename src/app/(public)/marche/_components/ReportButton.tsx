"use client";
// Signaler une annonce (membres connectés)

import { useState } from "react";
import { Flag } from "lucide-react";
import { REPORT_REASONS } from "@/lib/market-constants";

export default function ReportButton({ listingId, loggedIn }: { listingId: string; loggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState("");

  async function report(reason: string) {
    const r = await fetch(`/api/market/${listingId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    const d = await r.json().catch(() => ({}));
    setOpen(false);
    setDone(r.ok ? "Merci, l'équipe Meet Me Club va examiner cette annonce." : d.error || "Signalement impossible.");
  }

  if (done) return <p style={{ fontSize: 13, color: "#475569", margin: "10px 0 0" }}>{done}</p>;
  if (!loggedIn) return null;

  return (
    <div style={{ marginTop: 12 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#B42318", fontWeight: 700, fontSize: 13, cursor: "pointer", padding: 0 }}
      >
        <Flag size={14} /> Signaler cette annonce
      </button>
      {open && (
        <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
          {REPORT_REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => report(r)}
              style={{ textAlign: "left", padding: "9px 12px", borderRadius: 10, border: "1.5px solid #FECACA", background: "#FEF2F2", color: "#991B1B", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
            >
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
