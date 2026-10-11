"use client";
// src/app/(auth)/connexion/page.tsx
// Login: phone/email + OTP

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ConnexionForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/decouverte";

  const [targetType, setTargetType] = useState<"phone" | "email">("phone");
  const [target, setTarget] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState<"target" | "otp">("target");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devCode, setDevCode] = useState("");

  function getFullTarget() {
    return targetType === "phone" ? `+228${target.replace(/\D/g, "")}` : target;
  }

  async function handleDemoLogin() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/demo", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        router.push(callbackUrl || "/decouverte");
      } else {
        setError(data.error || "Erreur de connexion démo.");
      }
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: getFullTarget(), type: targetType === "phone" ? "SMS" : "EMAIL", purpose: "LOGIN" }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erreur."); return; }
      if (data.devCode) setDevCode(data.devCode);
      setStep("otp");
    } catch { setError("Erreur réseau."); }
    finally { setLoading(false); }
  }

  function handleOtpChange(i: number, v: string) {
    const d = v.replace(/\D/g, "").slice(-1);
    const next = [...otp]; next[i] = d; setOtp(next);
    if (d && i < 5) document.getElementById(`l-otp-${i + 1}`)?.focus();
  }
  function handleOtpKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[i] && i > 0) document.getElementById(`l-otp-${i - 1}`)?.focus();
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const code = otp.join("");
    if (code.length !== 6) { setError("Entrez les 6 chiffres."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: getFullTarget(), code, purpose: "LOGIN" }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Code incorrect."); return; }
      router.push(data.redirect || callbackUrl);
    } catch { setError("Erreur réseau."); }
    finally { setLoading(false); }
  }

  return (
    <div className="card card-padded animate-fade-in">
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <div style={{ fontSize: "48px", marginBottom: "8px" }}>👋</div>
        <h1 style={{ fontSize: "26px", marginBottom: "6px" }}>
          {step === "target" ? "Bon retour !" : "Entrez votre code"}
        </h1>
        <p style={{ color: "var(--color-gray-500)", fontSize: "15px" }}>
          {step === "target" ? "Connectez-vous à votre compte" : `Code envoyé à votre ${targetType === "phone" ? "téléphone" : "email"}`}
        </p>
      </div>

      {error && (
        <div role="alert" style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "var(--radius-md)", padding: "12px 16px", color: "#991B1B", fontSize: "14px", marginBottom: "20px" }}>
          ⚠️ {error}
        </div>
      )}
      {devCode && (
        <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "var(--radius-md)", padding: "10px 14px", color: "#166534", fontSize: "13px", marginBottom: "16px" }}>
          🛠️ DEV — code : <strong>{devCode}</strong>
        </div>
      )}

      {step === "target" && (
        <form onSubmit={handleSendOtp} noValidate>
          <div style={{ display: "flex", background: "var(--color-gray-100)", borderRadius: "var(--radius-full)", padding: "4px", marginBottom: "20px" }}>
            {(["phone", "email"] as const).map((t) => (
              <button key={t} type="button" onClick={() => { setTargetType(t); setTarget(""); }}
                style={{ flex: 1, padding: "8px 16px", borderRadius: "var(--radius-full)", border: "none", fontWeight: 600, fontSize: "14px", cursor: "pointer", transition: "all var(--transition-fast)", background: targetType === t ? "white" : "transparent", color: targetType === t ? "var(--color-blue)" : "var(--color-gray-500)", boxShadow: targetType === t ? "var(--shadow-sm)" : "none" }}>
                {t === "phone" ? "📱 Téléphone" : "📧 Email"}
              </button>
            ))}
          </div>

          {targetType === "phone" ? (
            <div className="input-group" style={{ marginBottom: "24px" }}>
              <label htmlFor="login-phone" className="input-label">Numéro de téléphone</label>
              <div className="input-with-prefix">
                <span className="input-prefix">🇹🇬 +228</span>
                <input id="login-phone" type="tel" inputMode="numeric" className="input" placeholder="XX XX XX XX" value={target} onChange={(e) => setTarget(e.target.value)} maxLength={8} required autoComplete="tel" />
              </div>
            </div>
          ) : (
            <div className="input-group" style={{ marginBottom: "24px" }}>
              <label htmlFor="login-email" className="input-label">Email</label>
              <input id="login-email" type="email" className="input" placeholder="votre@email.com" value={target} onChange={(e) => setTarget(e.target.value)} required autoComplete="email" />
            </div>
          )}

          <button type="submit" id="btn-login-send" className={`btn btn-primary${loading ? " btn-loading" : ""}`} style={{ width: "100%", marginBottom: "16px" }} disabled={loading}>
            {loading ? "" : "Recevoir mon code →"}
          </button>
          <p style={{ textAlign: "center", fontSize: "14px", color: "var(--color-gray-500)" }}>
            Pas encore de compte ?{" "}
            <Link href="/inscription" style={{ color: "var(--color-red)", fontWeight: 600 }}>S'inscrire</Link>
          </p>

          {/* 1-Click Fast Test Button */}
          <div style={{ marginTop: "24px", paddingTop: "18px", borderTop: "1px dashed var(--color-gray-200)", textAlign: "center" }}>
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="btn btn-outline-blue"
              style={{
                width: "100%",
                background: "rgba(11, 46, 107, 0.04)",
                borderColor: "var(--color-blue)",
                fontWeight: 700,
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              ⚡ Connexion Démo Immédiate (1-clic)
            </button>
            <span style={{ fontSize: "11px", color: "var(--color-gray-400)", marginTop: "6px", display: "block" }}>
              Accès direct sans SMS ni mot de passe pour tester toutes les fonctionnalités
            </span>
          </div>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={handleVerify} noValidate>
          <p style={{ textAlign: "center", fontSize: "14px", color: "var(--color-gray-500)", marginBottom: "28px" }}>
            Code envoyé à <strong style={{ color: "var(--color-blue)" }}>{targetType === "phone" ? `+228 ${target}` : target}</strong>
          </p>
          <div className="otp-group" style={{ marginBottom: "28px" }}>
            {otp.map((d, i) => (
              <input key={i} id={`l-otp-${i}`} type="text" inputMode="numeric" className={`otp-input${d ? " filled" : ""}`} value={d}
                onChange={(e) => handleOtpChange(i, e.target.value)} onKeyDown={(e) => handleOtpKey(i, e)}
                maxLength={1} aria-label={`Chiffre ${i + 1}`} autoComplete={i === 0 ? "one-time-code" : "off"} />
            ))}
          </div>
          <button type="submit" id="btn-login-verify" className={`btn btn-primary${loading ? " btn-loading" : ""}`} style={{ width: "100%", marginBottom: "12px" }} disabled={loading || otp.join("").length !== 6}>
            {loading ? "" : "Se connecter ✓"}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" style={{ width: "100%" }} onClick={() => { setStep("target"); setOtp(Array(6).fill("")); setError(""); }}>
            ← Modifier
          </button>
        </form>
      )}
    </div>
  );
}

export default function ConnexionPage() {
  return (
    <Suspense fallback={<div className="auth-card" style={{ padding: "40px", textAlign: "center", color: "var(--color-gray-500)" }}>Chargement...</div>}>
      <ConnexionForm />
    </Suspense>
  );
}
