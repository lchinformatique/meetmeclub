"use client";
// src/app/(auth)/inscription/page.tsx
// Registration: phone/email + date of birth (18+ check) + OTP verification

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Step = "identity" | "otp";

export default function InscriptionPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("identity");
  const [targetType, setTargetType] = useState<"phone" | "email">("phone");
  const [target, setTarget] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devCode, setDevCode] = useState("");

  // ── 18+ check client-side ─────────────────────────────────────
  function isAdultFront(dob: string): boolean {
    if (!dob) return false;
    const eighteenAgo = new Date();
    eighteenAgo.setFullYear(eighteenAgo.getFullYear() - 18);
    return new Date(dob) <= eighteenAgo;
  }

  function getFullTarget() {
    return targetType === "phone" ? `+228${target.replace(/\D/g, "")}` : target;
  }

  // ── Step 1: Send OTP ──────────────────────────────────────────
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!dateOfBirth) { setError("Veuillez entrer votre date de naissance."); return; }
    if (!isAdultFront(dateOfBirth)) {
      setError("Désolé, Meet Me Club est réservé aux personnes de 18 ans et plus. 🔞");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: getFullTarget(),
          type: targetType === "phone" ? "SMS" : "EMAIL",
          purpose: "REGISTRATION",
          dateOfBirth,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erreur lors de l'envoi."); return; }
      if (data.devCode) setDevCode(data.devCode);
      setStep("otp");
    } catch { setError("Erreur réseau. Vérifiez votre connexion."); }
    finally { setLoading(false); }
  }

  // ── OTP input ─────────────────────────────────────────────────
  function handleOtpChange(i: number, v: string) {
    const d = v.replace(/\D/g, "").slice(-1);
    const next = [...otp]; next[i] = d; setOtp(next);
    if (d && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
  }
  function handleOtpKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[i] && i > 0) document.getElementById(`otp-${i - 1}`)?.focus();
  }
  function handlePaste(e: React.ClipboardEvent) {
    const t = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (t.length === 6) { setOtp(t.split("")); e.preventDefault(); }
  }

  // ── Step 2: Verify OTP ────────────────────────────────────────
  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const code = otp.join("");
    if (code.length !== 6) { setError("Entrez les 6 chiffres du code."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: getFullTarget(), code, purpose: "REGISTRATION", dateOfBirth }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Code incorrect."); return; }
      router.push(data.redirect || "/onboarding");
    } catch { setError("Erreur réseau. Veuillez réessayer."); }
    finally { setLoading(false); }
  }

  const maxDob = new Date(Date.now() - 18 * 365.25 * 86400000).toISOString().split("T")[0];

  return (
    <div className="card card-padded animate-fade-in">
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <div className="animate-heart-beat" style={{ fontSize: "48px", marginBottom: "8px" }}>❤️</div>
        <h1 style={{ fontSize: "26px", marginBottom: "6px" }}>
          {step === "identity" ? "Rejoindre Meet Me Club" : "Vérification du code"}
        </h1>
        <p style={{ color: "var(--color-gray-500)", fontSize: "15px" }}>
          {step === "identity" ? "Créez votre compte gratuitement" : `Code envoyé par ${targetType === "phone" ? "SMS" : "email"}`}
        </p>
      </div>

      {/* Error */}
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

      {/* Step 1 */}
      {step === "identity" && (
        <form onSubmit={handleSendOtp} noValidate>
          {/* Toggle phone/email */}
          <div style={{ display: "flex", background: "var(--color-gray-100)", borderRadius: "var(--radius-full)", padding: "4px", marginBottom: "20px" }}>
            {(["phone", "email"] as const).map((t) => (
              <button key={t} type="button" onClick={() => { setTargetType(t); setTarget(""); }}
                style={{ flex: 1, padding: "8px 16px", borderRadius: "var(--radius-full)", border: "none", fontWeight: 600, fontSize: "14px", cursor: "pointer", transition: "all var(--transition-fast)", background: targetType === t ? "white" : "transparent", color: targetType === t ? "var(--color-blue)" : "var(--color-gray-500)", boxShadow: targetType === t ? "var(--shadow-sm)" : "none" }}>
                {t === "phone" ? "📱 Téléphone" : "📧 Email"}
              </button>
            ))}
          </div>

          {targetType === "phone" ? (
            <div className="input-group" style={{ marginBottom: "16px" }}>
              <label htmlFor="phone" className="input-label">Numéro de téléphone</label>
              <div className="input-with-prefix">
                <span className="input-prefix">🇹🇬 +228</span>
                <input id="phone" type="tel" inputMode="numeric" className="input" placeholder="XX XX XX XX" value={target} onChange={(e) => setTarget(e.target.value)} maxLength={8} required autoComplete="tel" />
              </div>
            </div>
          ) : (
            <div className="input-group" style={{ marginBottom: "16px" }}>
              <label htmlFor="email" className="input-label">Adresse email</label>
              <input id="email" type="email" className="input" placeholder="votre@email.com" value={target} onChange={(e) => setTarget(e.target.value)} required autoComplete="email" />
            </div>
          )}

          <div className="input-group" style={{ marginBottom: "24px" }}>
            <label htmlFor="dob" className="input-label">
              Date de naissance
              <span style={{ background: "rgba(225,6,0,0.1)", color: "var(--color-red)", fontSize: "11px", padding: "2px 8px", borderRadius: "var(--radius-full)", fontWeight: 700, marginLeft: "8px" }}>18+ requis</span>
            </label>
            <input id="dob" type="date" className="input" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} max={maxDob} required />
            <p style={{ fontSize: "12px", color: "var(--color-gray-400)" }}>🔒 Votre âge est vérifié pour garantir la sécurité de tous.</p>
          </div>

          <button type="submit" id="btn-send-otp" className={`btn btn-primary${loading ? " btn-loading" : ""}`} style={{ width: "100%" }} disabled={loading}>
            {loading ? "" : "Recevoir mon code →"}
          </button>

          <p style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "var(--color-gray-500)" }}>
            Déjà un compte ?{" "}
            <Link href="/connexion" style={{ color: "var(--color-red)", fontWeight: 600 }}>Se connecter</Link>
          </p>
        </form>
      )}

      {/* Step 2 */}
      {step === "otp" && (
        <form onSubmit={handleVerify} noValidate>
          <p style={{ textAlign: "center", fontSize: "14px", color: "var(--color-gray-500)", marginBottom: "28px" }}>
            Code envoyé à <strong style={{ color: "var(--color-blue)" }}>{targetType === "phone" ? `+228 ${target}` : target}</strong>
          </p>
          <div className="otp-group" onPaste={handlePaste} style={{ marginBottom: "28px" }}>
            {otp.map((d, i) => (
              <input key={i} id={`otp-${i}`} type="text" inputMode="numeric" className={`otp-input${d ? " filled" : ""}`} value={d}
                onChange={(e) => handleOtpChange(i, e.target.value)} onKeyDown={(e) => handleOtpKey(i, e)}
                maxLength={1} aria-label={`Chiffre ${i + 1}`} autoComplete={i === 0 ? "one-time-code" : "off"} />
            ))}
          </div>
          <button type="submit" id="btn-verify-otp" className={`btn btn-primary${loading ? " btn-loading" : ""}`} style={{ width: "100%", marginBottom: "12px" }} disabled={loading || otp.join("").length !== 6}>
            {loading ? "" : "Vérifier mon code ✓"}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" style={{ width: "100%" }} onClick={() => { setStep("identity"); setOtp(Array(6).fill("")); setError(""); }}>
            ← Modifier mes informations
          </button>
          <p style={{ textAlign: "center", marginTop: "16px", fontSize: "13px", color: "var(--color-gray-400)" }}>
            Code expiré ?{" "}
            <button type="button" style={{ background: "none", border: "none", color: "var(--color-red)", fontWeight: 600, cursor: "pointer", fontSize: "13px" }} onClick={handleSendOtp}>
              Renvoyer
            </button>
          </p>
        </form>
      )}
    </div>
  );
}
