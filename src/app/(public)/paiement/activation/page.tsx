// src/app/(public)/paiement/activation/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
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
  const [pendingMsg, setPendingMsg] = useState("");

  // Détection automatique : dès que SasPay confirme le paiement (webhook), le pass s'active
  // tout seul — la page le voit et lance l'animation, sans rien saisir.
  useEffect(() => {
    let stopped = false;
    let initialPlan: string | null = null;
    const startedAt = Date.now();
    const check = async () => {
      if (stopped) return;
      try {
        const res = await fetch("/api/subscription/status", { cache: "no-store" });
        if (res.ok) {
          const s = await res.json();
          if (initialPlan === null) initialPlan = s.plan;
          const justActivated =
            s.plan !== "FREE" &&
            (s.plan !== initialPlan || (s.startedAt && Date.now() - new Date(s.startedAt).getTime() < 15 * 60 * 1000));
          if (justActivated) {
            stopped = true;
            setSuccess(true);
            setSelectedPlan(s.plan);
            window.dispatchEvent(new CustomEvent("mmc:celebrate", { detail: { plan: s.plan } }));
            return;
          }
        }
      } catch {}
      if (Date.now() - startedAt < 10 * 60 * 1000) setTimeout(check, 5000);
    };
    check();
    return () => {
      stopped = true;
    };
  }, []);

  // Vérifie le paiement auprès du serveur ; s'il n'est pas encore confirmé par SasPay,
  // réessaie automatiquement toutes les 8 secondes pendant 3 minutes.
  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setPendingMsg("");

    const deadline = Date.now() + 3 * 60 * 1000;
    try {
      while (true) {
        const res = await fetch("/api/subscription/activate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: selectedPlan, phone, transactionRef }),
        });
        const data = await res.json().catch(() => ({}));

        if (res.status === 401 && data.needLogin) {
          router.push(`/connexion?callbackUrl=${encodeURIComponent(`/paiement/activation?plan=${selectedPlan}`)}`);
          return;
        }
        if (res.status === 202 && data.pending) {
          if (Date.now() > deadline) {
            throw new Error(
              "Paiement introuvable pour le moment. Vérifiez la référence ou le numéro saisi, puis réessayez. Si le problème persiste, contactez le support avec votre reçu SasPay."
            );
          }
          setPendingMsg(data.message);
          await new Promise((r) => setTimeout(r, 8000));
          continue;
        }
        if (!res.ok) throw new Error(data.error || "Erreur d'activation");

        setPendingMsg("");
        if (data.plan) setSelectedPlan(data.plan);
        setSuccess(true);
        // Animation de félicitations (puis retour sur le profil avec le nouveau statut)
        window.dispatchEvent(new CustomEvent("mmc:celebrate", { detail: { plan: data.plan || selectedPlan } }));
        return;
      }
    } catch (err: any) {
      setPendingMsg("");
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
            Vous venez de régler via <strong>Mixx by yas, Moov Money ou carte bancaire</strong> ? Si vous avez payé avec le
            numéro enregistré sur votre profil, votre pass est activé <strong>automatiquement</strong>. Sinon, indiquez
            ci-dessous le numéro utilisé ou la référence de votre reçu SasPay.
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
              {pendingMsg && (
                <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#1E3A8A", padding: "12px", borderRadius: "10px", fontSize: "14px" }}>
                  ⏳ {pendingMsg}
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 700, color: "#1E293B", marginBottom: "8px" }}>
                  Formule payée sur SasPay (le pass activé correspond au montant réellement payé) :
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
                  Numéro mobile money utilisé pour payer :
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  placeholder="Ex : +228 90 XX XX XX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid #CBD5E1", fontSize: "15px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 700, color: "#1E293B", marginBottom: "6px" }}>
                  Ou référence du reçu SasPay (carte bancaire) :
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
                {loading ? "Vérification du paiement…" : "⚡ Vérifier mon paiement et activer"}
              </button>

              <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: "20px", textAlign: "center" }}>
                <p style={{ fontSize: "13px", color: "#64748B", marginBottom: "12px" }}>
                  Besoin d'aide immédiate pour votre transaction ?
                </p>
                <a
                  href="https://wa.me/22890283580?text=Bonjour%20Meet%20Me%20Club%2C%20je%20souhaite%20continuer%20la%20discussion."
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
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                  <span>Assistance WhatsApp directe (+228 90 28 35 80)</span>
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
