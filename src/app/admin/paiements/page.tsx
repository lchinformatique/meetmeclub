"use client";
// src/app/admin/paiements/page.tsx
// Paiements SasPay reçus + activation manuelle d'un pass (réservé aux administrateurs).

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronLeft, CircleAlert, RefreshCw, Wallet } from "lucide-react";

interface Payment {
  id: string;
  reference: string | null;
  amount: number | null;
  charged: number | null;
  msisdn: string | null;
  plan: string | null;
  userId: string | null;
  member: string | null;
  claimedAt: string | null;
  createdAt: string;
}

const PLAN_LABEL: Record<string, string> = { ESSENTIAL: "Essentiel", COMPLICE: "Complice", VIP: "VIP" };

export default function AdminPaiementsPage() {
  const [data, setData] = useState<{
    tableReady: boolean;
    tableError: string | null;
    webhookSecretConfigured: boolean;
    payments: Payment[];
    requests: Array<{ id: string; userId: string; plan: string; phone?: string; reference?: string; createdAt: string; member?: string }>;
  } | null>(null);
  const [requestBusy, setRequestBusy] = useState<string | null>(null);

  async function decide(requestId: string, action: "approve" | "reject", label: string) {
    if (!confirm(action === "approve" ? `Valider et activer le pass de ${label} ?` : `Refuser la demande de ${label} ?`)) return;
    setRequestBusy(requestId);
    setResult(null);
    try {
      const res = await fetch("/api/payments/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setResult({ ok: false, text: d.error || "Échec" });
      else
        setResult({
          ok: true,
          text: action === "approve" ? `Pass activé pour ${label}. Le membre a reçu sa notification et son animation.` : `Demande de ${label} refusée.`,
        });
      load();
    } finally {
      setRequestBusy(null);
    }
  }
  const [error, setError] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [plan, setPlan] = useState("ESSENTIAL");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    setError("");
    const res = await fetch("/api/payments/admin", { cache: "no-store" });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) return setError(d.error || "Accès refusé");
    setData(d);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function activate(e: React.FormEvent) {
    e.preventDefault();
    if (!confirm(`Activer le Pass ${PLAN_LABEL[plan]} pour « ${identifier} » ?`)) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/payments/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, plan, paymentId }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setResult({ ok: false, text: d.error || "Échec" });
      else {
        setResult({ ok: true, text: `Pass ${PLAN_LABEL[plan]} activé jusqu'au ${new Date(d.expiresAt).toLocaleDateString("fr-FR")}. Le membre a reçu une notification.` });
        setIdentifier("");
        setPaymentId(null);
        load();
      }
    } finally {
      setBusy(false);
    }
  }

  const card: React.CSSProperties = { background: "#fff", borderRadius: 18, padding: 18, boxShadow: "0 8px 24px rgba(11,37,89,0.07)" };
  const field: React.CSSProperties = { width: "100%", height: 48, padding: "0 12px", borderRadius: 12, border: "1.5px solid #CBD5E1", fontSize: 16, boxSizing: "border-box" };

  return (
    <div style={{ minHeight: "100dvh", background: "#F4F6FB", padding: "max(16px, env(safe-area-inset-top)) 14px 40px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <Link href="/profil" style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#0B2559", fontWeight: 700, textDecoration: "none" }}>
          <ChevronLeft size={20} /> Retour
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 46, height: 46, borderRadius: 14, background: "#0B2559", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Wallet size={22} />
          </span>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 20, color: "#0B2559" }}>Paiements SasPay</h1>
            <p style={{ margin: 0, fontSize: 13, color: "#505D70" }}>Paiements reçus et activation des pass</p>
          </div>
          <button type="button" onClick={load} aria-label="Actualiser" style={{ border: "none", background: "#fff", borderRadius: 12, width: 44, height: 44, cursor: "pointer" }}>
            <RefreshCw size={18} />
          </button>
        </div>

        {error && <div style={{ ...card, color: "#B42318", fontWeight: 700 }}>{error}</div>}

        {data && (
          <div style={{ ...card, display: "flex", flexDirection: "column", gap: 8, fontSize: 14 }}>
            <strong style={{ color: "#0B2559" }}>État de la configuration</strong>
            <span style={{ display: "flex", gap: 8, color: data.webhookSecretConfigured ? "#067647" : "#B42318" }}>
              {data.webhookSecretConfigured ? <CheckCircle2 size={18} /> : <CircleAlert size={18} />}
              Clé SasPay (SASPAY_WEBHOOK_SECRET) {data.webhookSecretConfigured ? "présente" : "ABSENTE dans Vercel"}
            </span>
            <span style={{ display: "flex", gap: 8, color: data.tableReady ? "#067647" : "#B42318" }}>
              {data.tableReady ? <CheckCircle2 size={18} /> : <CircleAlert size={18} />}
              Table des paiements {data.tableReady ? "prête" : "ABSENTE : exécutez migration_v3 dans Supabase"}
            </span>
            <span style={{ color: "#3B4658" }}>
              {data.payments.length === 0
                ? "Aucun paiement reçu de SasPay pour l'instant : si un membre a payé, le webhook n'arrive pas (vérifiez le journal des webhooks SasPay)."
                : `${data.payments.length} paiement(s) reçu(s).`}
            </span>
          </div>
        )}

        {/* Demandes des membres à valider (comparer avec l'e-mail SasPay) */}
        {data && (
          <div style={{ ...card, display: "flex", flexDirection: "column", gap: 10 }}>
            <strong style={{ color: "#0B2559" }}>
              Demandes à valider {data.requests.length > 0 && <span style={{ color: "#E10600" }}>({data.requests.length})</span>}
            </strong>
            {data.requests.length === 0 && <span style={{ fontSize: 14, color: "#505D70" }}>Aucune demande en attente.</span>}
            {data.requests.map((r) => (
              <div key={r.id} style={{ border: "1.5px solid #E2E8F0", borderRadius: 14, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontWeight: 800, color: "#0F172A" }}>
                  {r.member} · Pass {PLAN_LABEL[r.plan] || r.plan}
                </div>
                <div style={{ fontSize: 13, color: "#3B4658" }}>
                  Numéro : <strong>{r.phone || "—"}</strong> · Réf. : <strong>{r.reference || "—"}</strong>
                  <br />
                  Demandé le {new Date(r.createdAt).toLocaleString("fr-FR")}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    disabled={requestBusy === r.id}
                    onClick={() => decide(r.id, "reject", r.member || "ce membre")}
                    style={{ flex: "0 0 35%", height: 44, borderRadius: 12, border: "1.5px solid #CBD5E1", background: "#fff", color: "#3B4658", fontWeight: 800, cursor: "pointer" }}
                  >
                    Refuser
                  </button>
                  <button
                    type="button"
                    disabled={requestBusy === r.id}
                    onClick={() => decide(r.id, "approve", r.member || "ce membre")}
                    style={{ flex: 1, height: 44, borderRadius: 12, border: "none", background: "#067647", color: "#fff", fontWeight: 800, cursor: "pointer" }}
                  >
                    {requestBusy === r.id ? "…" : `Valider · Pass ${PLAN_LABEL[r.plan] || r.plan}`}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Activation manuelle */}
        <form onSubmit={activate} style={{ ...card, display: "flex", flexDirection: "column", gap: 10 }}>
          <strong style={{ color: "#0B2559" }}>Activer un pass manuellement</strong>
          <input style={field} placeholder="Pseudo ou e-mail exact du membre" value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoCapitalize="none" required />
          <select style={field} value={plan} onChange={(e) => setPlan(e.target.value)}>
            <option value="ESSENTIAL">Pass Essentiel · 3 000 F</option>
            <option value="COMPLICE">Pass Complice · 6 000 F</option>
            <option value="VIP">Pass VIP · 15 000 F</option>
          </select>
          {paymentId && <span style={{ fontSize: 13, color: "#3B4658" }}>Paiement rattaché : {paymentId}</span>}
          {result && (
            <div style={{ padding: "10px 12px", borderRadius: 10, background: result.ok ? "#ECFDF5" : "#FEF2F2", color: result.ok ? "#067647" : "#B42318", fontWeight: 600, fontSize: 14 }}>
              {result.text}
            </div>
          )}
          <button type="submit" disabled={busy} style={{ height: 50, border: "none", borderRadius: 12, background: "linear-gradient(135deg,#E10600,#B30500)", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
            {busy ? "Activation…" : "Activer le pass (30 jours)"}
          </button>
        </form>

        {/* Liste des paiements */}
        {data?.payments.map((p) => (
          <div key={p.id} style={{ ...card, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 800, color: "#0F172A" }}>
                {p.amount?.toLocaleString("fr-FR")} F · {p.plan ? `Pass ${PLAN_LABEL[p.plan]}` : "montant non reconnu"}
              </div>
              <div style={{ fontSize: 13, color: "#505D70" }}>
                {new Date(p.createdAt).toLocaleString("fr-FR")} · {p.msisdn || "numéro inconnu"} · réf. {p.reference || p.id}
              </div>
            </div>
            {p.userId ? (
              <span style={{ fontSize: 13, fontWeight: 700, color: "#067647", background: "#ECFDF5", padding: "6px 10px", borderRadius: 999 }}>
                ✓ Attribué à {p.member}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setPaymentId(p.id);
                  if (p.plan) setPlan(p.plan);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                style={{ border: "1.5px solid #E10600", color: "#E10600", background: "#fff", borderRadius: 999, padding: "8px 14px", fontWeight: 800, cursor: "pointer" }}
              >
                Attribuer à un membre
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
