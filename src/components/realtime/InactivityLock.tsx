"use client";
// src/components/realtime/InactivityLock.tsx
// Verrouillage après 30 minutes sans activité réelle (toucher, clavier, défilement).
// Déverrouillage : compte Google, ou pseudo + mot de passe. Le membre reste sur sa page.

import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import GoogleAuthButton from "@/components/GoogleAuthButton";

const IDLE_MS = 30 * 60 * 1000;
const PING_EVERY_MS = 60 * 1000;
const LAST_KEY = "mmc_last_activity";

function readLast() {
  try {
    return Number(localStorage.getItem(LAST_KEY) || 0);
  } catch {
    return 0;
  }
}

export default function InactivityLock({ active, paused }: { active: boolean; paused: boolean }) {
  const [locked, setLocked] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lastPing = useRef(0);
  const lockedRef = useRef(false);
  const pausedRef = useRef(paused);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const lock = useCallback(() => {
    if (lockedRef.current || pausedRef.current) return;
    lockedRef.current = true;
    setLocked(true);
    try {
      setIdentifier(localStorage.getItem("meetmeclub_saved_identifier") || "");
    } catch {}
  }, []);

  const ping = useCallback(async () => {
    lastPing.current = Date.now();
    try {
      const res = await fetch("/api/auth/activity", { method: "POST" });
      if (res.status === 401) lock(); // le serveur a déjà verrouillé la session
    } catch {}
  }, [lock]);

  useEffect(() => {
    if (!active) return;

    // Ouverture : la session est active côté serveur (sinon `active` serait faux) → on repart de maintenant
    try {
      localStorage.setItem(LAST_KEY, String(Date.now()));
    } catch {}
    ping();

    const onActivity = () => {
      if (lockedRef.current) return;
      const now = Date.now();
      try {
        localStorage.setItem(LAST_KEY, String(now));
      } catch {}
      if (now - lastPing.current > PING_EVERY_MS) ping();
    };
    const check = () => {
      if (lockedRef.current) return;
      const lastAct = readLast();
      if (lastAct && Date.now() - lastAct > IDLE_MS) lock();
    };
    const onVisible = () => document.visibilityState === "visible" && check();

    const events: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "touchstart", "wheel", "scroll"];
    events.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true, capture: true }));
    document.addEventListener("visibilitychange", onVisible);
    const timer = setInterval(check, 30_000);
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, onActivity, { capture: true } as any));
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(timer);
    };
  }, [active, lock, ping]);

  // Pendant un appel, on ne verrouille jamais
  useEffect(() => {
    if (paused) {
      try {
        localStorage.setItem(LAST_KEY, String(Date.now()));
      } catch {}
    }
  }, [paused]);

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!identifier.trim() || !password) return setError("Entrez votre pseudo et votre mot de passe.");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setError(data.error || "Identifiants incorrects.");
      try {
        localStorage.setItem(LAST_KEY, String(Date.now()));
        localStorage.setItem("meetmeclub_saved_identifier", identifier.trim());
      } catch {}
      window.location.reload();
    } catch {
      setError("Erreur réseau, réessayez.");
    } finally {
      setBusy(false);
    }
  }

  if (!locked) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Session verrouillée"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 6000,
        background: "linear-gradient(160deg, #071530 0%, #0B2559 55%, #163B8A 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "max(20px, env(safe-area-inset-top)) 16px max(20px, env(safe-area-inset-bottom))",
        overflowY: "auto",
      }}
    >
      <div style={{ width: "100%", maxWidth: 400, background: "#fff", borderRadius: 24, padding: "28px 22px", boxShadow: "0 30px 70px rgba(0,0,0,0.35)" }}>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div style={{ position: "relative", width: 76, height: 76, margin: "0 auto 12px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-icon.png" alt="Meet Me Club" width={76} height={76} style={{ borderRadius: "50%", boxShadow: "0 6px 18px rgba(11,37,89,0.18)" }} />
            <span style={{ position: "absolute", right: -2, bottom: -2, width: 30, height: 30, borderRadius: "50%", background: "#E10600", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid #fff" }}>
              <Lock size={14} />
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: 20, color: "#0B2559" }}>Session verrouillée</h2>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: "#505D70", lineHeight: 1.5 }}>
            Pour protéger votre compte, Meet Me Club se verrouille après 30 minutes d&apos;inactivité.
          </p>
        </div>

        <GoogleAuthButton
          label="Déverrouiller avec Google"
          onError={setError}
          onBeforeStart={() => {
            try {
              localStorage.setItem("mmc_after_login", window.location.pathname + window.location.search);
              localStorage.setItem(LAST_KEY, String(Date.now()));
            } catch {}
            return true;
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0", color: "#78859A", fontSize: 12, fontWeight: 700 }}>
          <span style={{ flex: 1, height: 1, background: "#E2E8F0" }} /> OU <span style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
        </div>

        <form onSubmit={unlock} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Pseudo ou e-mail"
            autoComplete="username"
            autoCapitalize="none"
            style={{ height: 50, padding: "0 14px", borderRadius: 12, border: "1.5px solid #CBD5E1", fontSize: 16 }}
          />
          <div style={{ position: "relative" }}>
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              autoComplete="current-password"
              autoFocus
              style={{ width: "100%", boxSizing: "border-box", height: 50, padding: "0 44px 0 14px", borderRadius: 12, border: "1.5px solid #CBD5E1", fontSize: 16 }}
            />
            <button type="button" onClick={() => setShow((v) => !v)} aria-label="Afficher le mot de passe" style={{ position: "absolute", right: 10, top: 13, border: "none", background: "none", color: "#78859A" }}>
              {show ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {error && <div style={{ fontSize: 13, color: "#B42318", fontWeight: 600 }}>{error}</div>}
          <button
            type="submit"
            disabled={busy}
            style={{ height: 50, border: "none", borderRadius: 12, background: "linear-gradient(135deg, #0B2559, #163B8A)", color: "#fff", fontWeight: 800, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            {busy && <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />}
            Déverrouiller
          </button>
        </form>

        <button
          type="button"
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
            window.location.href = "/connexion";
          }}
          style={{ width: "100%", marginTop: 14, border: "none", background: "none", color: "#505D70", fontSize: 13, fontWeight: 700, textDecoration: "underline", cursor: "pointer" }}
        >
          Ce n&apos;est pas mon compte
        </button>
      </div>
    </div>
  );
}
