"use client";
// src/components/PasswordCard.tsx
// Créer / changer son mot de passe Meet Me Club (connexion avec pseudo + mot de passe,
// en plus de la connexion Google).

import { useEffect, useState } from "react";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";

export default function PasswordCard() {
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/password")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setHasPassword(Boolean(d?.hasPassword)))
      .catch(() => setHasPassword(false));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (next.length < 8) return setMsg({ ok: false, text: "Au moins 8 caractères." });
    if (next !== confirm) return setMsg({ ok: false, text: "Les deux mots de passe ne sont pas identiques." });
    setSaving(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: next, currentPassword: current || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setMsg({ ok: false, text: data.error || "Échec, réessayez." });
      setMsg({ ok: true, text: "Mot de passe enregistré ✓ Vous pouvez vous connecter avec votre pseudo." });
      setHasPassword(true);
      setCurrent("");
      setNext("");
      setConfirm("");
      // Proposer au téléphone de mémoriser le mot de passe
      try {
        const id = localStorage.getItem("meetmeclub_saved_identifier");
        const PC = (window as any).PasswordCredential;
        if (id && PC && navigator.credentials?.store) await navigator.credentials.store(new PC({ id, password: next }));
      } catch {}
    } finally {
      setSaving(false);
    }
  }

  const input: React.CSSProperties = {
    width: "100%",
    height: 50,
    padding: "0 44px 0 14px",
    borderRadius: 12,
    border: "1.5px solid #CBD5E1",
    fontSize: 16,
    boxSizing: "border-box",
  };

  return (
    <form
      onSubmit={submit}
      style={{ background: "white", borderRadius: 16, padding: 20, border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", gap: 12 }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ width: 42, height: 42, borderRadius: 12, background: "#EEF3FF", color: "#0B2559", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <KeyRound size={20} />
        </span>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, color: "#0B2559" }}>
            {hasPassword ? "Changer mon mot de passe" : "Créer mon mot de passe"}
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: "#505D70" }}>
            Pour vous connecter avec votre pseudo, en plus de Google.
          </p>
        </div>
      </div>

      {hasPassword && (
        <input
          type={show ? "text" : "password"}
          placeholder="Mot de passe actuel"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          style={input}
        />
      )}
      <div style={{ position: "relative" }}>
        <input
          type={show ? "text" : "password"}
          placeholder="Nouveau mot de passe (8 caractères min.)"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          style={input}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label="Afficher le mot de passe"
          style={{ position: "absolute", right: 10, top: 13, border: "none", background: "none", color: "#78859A", cursor: "pointer" }}
        >
          {show ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
      <input
        type={show ? "text" : "password"}
        placeholder="Confirmer le nouveau mot de passe"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        style={input}
      />

      {msg && (
        <div style={{ padding: "10px 12px", borderRadius: 10, fontSize: 14, fontWeight: 600, background: msg.ok ? "#ECFDF5" : "#FEF2F2", color: msg.ok ? "#067647" : "#B42318" }}>
          {msg.text}
        </div>
      )}

      <button
        type="submit"
        disabled={saving || hasPassword === null}
        style={{ height: 50, border: "none", borderRadius: 12, background: "linear-gradient(135deg, #0B2559, #163B8A)", color: "white", fontWeight: 800, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}
      >
        {saving && <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />}
        {hasPassword ? "Changer le mot de passe" : "Créer le mot de passe"}
      </button>
    </form>
  );
}
