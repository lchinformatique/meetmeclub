"use client";
// src/app/admin/annonce/page.tsx
// Envoi d'une notification à tous les membres (nouveautés, mises à jour, événements).
// Réservé aux administrateurs (contrôle côté serveur).

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Megaphone, Send } from "lucide-react";

export default function AnnoncePage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!confirm("Envoyer cette notification à tous les membres ?")) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, url }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setResult({ ok: false, text: data.error || "Envoi impossible." });
      else {
        setResult({ ok: true, text: `Notification envoyée à ${data.sent} appareil(s) sur ${data.devices}.` });
        setTitle("");
        setBody("");
      }
    } catch {
      setResult({ ok: false, text: "Erreur réseau." });
    } finally {
      setSending(false);
    }
  }

  const field: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1.5px solid #CBD5E1",
    fontSize: 16,
    fontFamily: "inherit",
    boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100dvh", background: "#F4F6FB", padding: "max(16px, env(safe-area-inset-top)) 16px 40px" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <Link href="/profil" style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#0B2559", fontWeight: 700, textDecoration: "none", marginBottom: 16 }}>
          <ChevronLeft size={20} /> Retour
        </Link>

        <form onSubmit={send} style={{ background: "#fff", borderRadius: 20, padding: 22, boxShadow: "0 10px 30px rgba(11,37,89,0.08)", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 46, height: 46, borderRadius: 14, background: "#0B2559", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Megaphone size={22} />
            </span>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, color: "#0B2559" }}>Annonce à tous les membres</h1>
              <p style={{ margin: 0, fontSize: 13, color: "#505D70" }}>Notification en haut du téléphone de chaque membre abonné</p>
            </div>
          </div>

          <label style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>
            Titre
            <input style={{ ...field, marginTop: 6 }} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="Ex : Nouveauté sur Meet Me Club" required />
          </label>
          <label style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>
            Message
            <textarea style={{ ...field, marginTop: 6, minHeight: 100, resize: "vertical" }} value={body} onChange={(e) => setBody(e.target.value)} maxLength={220} placeholder="Ex : Les appels vidéo sont disponibles pour les membres VIP !" required />
          </label>
          <label style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>
            Page ouverte au toucher
            <select style={{ ...field, marginTop: 6 }} value={url} onChange={(e) => setUrl(e.target.value)}>
              <option value="/">Accueil</option>
              <option value="/messages">Messagerie</option>
              <option value="/decouverte">Découverte des membres</option>
              <option value="/tarifs">Tarifs / pass</option>
              <option value="/vip">Mur VIP</option>
              <option value="/rendez-vous">Sorties</option>
            </select>
          </label>

          {result && (
            <div style={{ padding: "12px 14px", borderRadius: 12, background: result.ok ? "#ECFDF5" : "#FEF2F2", color: result.ok ? "#067647" : "#B42318", fontWeight: 600, fontSize: 14 }}>
              {result.text}
            </div>
          )}

          <button
            type="submit"
            disabled={sending}
            style={{ height: 52, border: "none", borderRadius: 14, background: "linear-gradient(135deg, #E10600, #B30500)", color: "#fff", fontWeight: 800, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", opacity: sending ? 0.7 : 1 }}
          >
            <Send size={18} /> {sending ? "Envoi en cours…" : "Envoyer à tous les membres"}
          </button>
        </form>
      </div>
    </div>
  );
}
