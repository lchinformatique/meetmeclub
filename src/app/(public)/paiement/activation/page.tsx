// src/app/(public)/paiement/activation/page.tsx
"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

function ActivationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPlan = searchParams.get("plan") || "ESSENTIAL";

  const [selectedPlan, setSelectedPlan] = useState<string>(initialPlan);
  const [phone, setPhone] = useState<string>("");
  const [transactionRef, setTransactionRef] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/subscription/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          phone,
          transactionRef,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur d'activation");
      }

      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Impossible d'activer le compte pour le moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", padding: "60px 20px" }}>
      <div className="container" style={{ maxWidth: "600px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "white",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #E10600",
              boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
              marginBottom: "16px",
            }}
          >
            <Image src="/logo.png" alt="Logo" width={46} height={46} style={{ objectFit: "contain" }} priority />
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#0B2559", marginBottom: "8px" }}>
            Activation de votre Abonnement
          </h1>
          <p style={{ color: "#64748B", fontSize: "15px" }}>
            Vous venez de régler via <strong>Saspay (T-Money ou Flooz)</strong> ? Renseignez votre numéro pour activer vos accès instantanément.
          </p>
        </div>

        <div className="card" style={{ background: "white", borderRadius: "20px", padding: "36px 30px", border: "1px solid #E2E8F0", boxShadow: "0 8px 30px rgba(0,0,0,0.05)" }}>
          {success ? (
            <div style={{ textAlign: "center", padding: "20px 10px" }}>
              <div style={{ fontSize: "56px", marginBottom: "16px" }}>🎉👑</div>
              <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#166534", marginBottom: "10px" }}>
                Abonnement Activé avec Succès !
              </h2>
              <p style={{ color: "#15803D", fontSize: "15px", lineHeight: 1.6, marginBottom: "26px" }}>
                Félicitations ! Vos fonctionnalités illimitées sont désormais opérationnelles. Vous pouvez échanger sans limite et profiter de toutes vos options.
              </p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                <Link href="/decouverte" className="btn btn-primary" style={{ padding: "12px 24px", fontWeight: 700 }}>
                  🔍 Explorer les Membres
                </Link>
                <Link href="/profil" className="btn btn-outline-blue" style={{ padding: "12px 24px", fontWeight: 700 }}>
                  👤 Mon Profil
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleActivate} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {errorMsg && (
                <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#991B1B", padding: "12px", borderRadius: "10px", fontSize: "14px" }}>
                  ⚠️ {errorMsg}
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 700, color: "#1E293B", marginBottom: "8px" }}>
                  Formule souscrite sur Saspay :
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                  {[
                    { id: "ESSENTIAL", name: "Pass Essentiel", price: "3 000 F" },
                    { id: "COMPLICE", name: "Pass Complice", price: "6 000 F" },
                    { id: "VIP", name: "Pass VIP", price: "15 000 F" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPlan(p.id)}
                      style={{
                        padding: "12px 8px",
                        borderRadius: "12px",
                        border: selectedPlan === p.id ? "2px solid #0B2559" : "1px solid #CBD5E1",
                        background: selectedPlan === p.id ? "rgba(11, 46, 107, 0.06)" : "white",
                        fontWeight: 700,
                        textAlign: "center",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontSize: "13px", color: "#0F172A" }}>{p.name}</div>
                      <div style={{ fontSize: "12px", color: "#E10600", marginTop: "2px" }}>{p.price}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 700, color: "#1E293B", marginBottom: "6px" }}>
                  Numéro T-Money ou Flooz utilisé pour le paiement :
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ex: +228 90 XX XX XX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid #CBD5E1", fontSize: "15px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 700, color: "#1E293B", marginBottom: "6px" }}>
                  Référence de transaction ou SMS Saspay (facultatif) :
                </label>
                <input
                  type="text"
                  placeholder="Ex: REF-SASPAY-XXXX"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid #CBD5E1", fontSize: "14px" }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-lg"
                style={{ width: "100%", justifyContent: "center", padding: "14px", fontWeight: 800, fontSize: "16px", borderRadius: "12px" }}
              >
                {loading ? "Vérification en cours..." : "⚡ Valider et Activer mon Abonnement"}
              </button>

              <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: "20px", textAlign: "center" }}>
                <p style={{ fontSize: "13px", color: "#64748B", marginBottom: "12px" }}>
                  Besoin d'aide immédiate pour votre transaction ?
                </p>
                <a
                  href="https://wa.me/22890000000?text=Bonjour%20Meet%20Me%20Club%2C%20j%27ai%20effectu%C3%A9%20un%20paiement%20Saspay%20et%20je%20souhaite%20activer%20mon%20abonnement"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "#166534",
                    background: "#F0FDF4",
                    border: "1px solid #86EFAC",
                    padding: "8px 16px",
                    borderRadius: "9999px",
                    fontSize: "13px",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  <span>💬 Assistance WhatsApp directe (+228 90 00 00 00)</span>
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ActivationPage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", textAlign: "center" }}>Chargement...</div>}>
      <ActivationContent />
    </Suspense>
  );
}
