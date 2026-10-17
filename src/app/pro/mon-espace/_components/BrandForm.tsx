"use client";
// Formulaire de l'Espace Pro : marque, logo, bannière, activité, présentation et contacts.

import { useState } from "react";
import { ImagePlus, Save } from "lucide-react";
import { toJpeg } from "@/app/verification/_components/ui";
import { field, label, NAVY, primaryBtn, type ProSpace } from "./shared";

async function fileToDataUrl(file: File, max: number) {
  const blob = await toJpeg(file, max);
  return new Promise<string>((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.readAsDataURL(blob);
  });
}

export default function BrandForm({
  pro,
  activities,
  onSaved,
}: {
  pro: ProSpace | null;
  activities: Record<string, string>;
  onSaved: (pro: ProSpace) => void;
}) {
  const [form, setForm] = useState({
    name: pro?.name || "",
    activity: pro?.activity || "ENTREPRENEUR",
    description: pro?.description || "",
    city: pro?.city || "Lomé",
    neighborhood: pro?.neighborhood || "",
    whatsapp: pro?.whatsapp || "",
    facebook: pro?.facebook || "",
    phone: pro?.phone || "",
    website: pro?.website || "",
  });
  const [logo, setLogo] = useState<string | null>(pro?.logoUrl || null);
  const [cover, setCover] = useState<string | null>(pro?.coverUrl || null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/pro/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          // Nouvelle image = data URL ; image inchangée = on n'envoie rien
          logoUrl: logo?.startsWith("data:") ? logo : logo === null && pro?.logoUrl ? null : undefined,
          coverUrl: cover?.startsWith("data:") ? cover : cover === null && pro?.coverUrl ? null : undefined,
        }),
      });
      const d = await res.json();
      if (!res.ok) return setMsg({ ok: false, text: d.error || "Enregistrement impossible." });
      setMsg({ ok: true, text: pro ? "Espace Pro mis à jour ✓" : "Votre Espace Pro est créé ✓" });
      onSaved(d.pro);
    } catch {
      setMsg({ ok: false, text: "Connexion perdue. Réessayez." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {/* Aperçu bannière + logo */}
      <div style={{ borderRadius: 18, overflow: "hidden", background: "#fff", border: "1px solid #E2E8F0" }}>
        <label style={{ display: "block", height: 130, cursor: "pointer", position: "relative", background: cover ? `center/cover url("${cover}")` : "linear-gradient(135deg,#0B2559,#163B8A)" }}>
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={async (e) => { const f = e.target.files?.[0]; if (f) setCover(await fileToDataUrl(f, 1600)); e.target.value = ""; }} />
          <span style={{ position: "absolute", right: 10, bottom: 10, background: "rgba(15,23,42,0.7)", color: "#fff", fontSize: 12, fontWeight: 700, padding: "5px 10px", borderRadius: 999, display: "inline-flex", gap: 6, alignItems: "center" }}>
            <ImagePlus size={14} /> {cover ? "Changer la bannière" : "Ajouter une bannière"}
          </span>
        </label>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", padding: "0 14px 14px", marginTop: -36 }}>
          <label style={{ width: 76, height: 76, borderRadius: 18, border: "4px solid #fff", background: logo ? `center/cover url("${logo}")` : "#E2E8F0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 6px 16px rgba(0,0,0,0.15)" }}>
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={async (e) => { const f = e.target.files?.[0]; if (f) setLogo(await fileToDataUrl(f, 512)); e.target.value = ""; }} />
            {!logo && <ImagePlus size={24} color={NAVY} />}
          </label>
          <div style={{ minWidth: 0 }}>
            <strong style={{ display: "block", fontSize: 17, color: "#0F172A" }}>{form.name || "Nom de votre marque"}</strong>
            <span style={{ fontSize: 13, color: "#64748B" }}>
              {activities[form.activity]} {form.city ? `· ${form.city}` : ""}
            </span>
          </div>
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 12, color: "#64748B" }}>Touchez la bannière ou le logo pour ajouter vos images.</p>

      <div>
        <label style={label}>Nom de la marque / de l&apos;activité *</label>
        <input style={field} value={form.name} onChange={set("name")} maxLength={60} placeholder="Ex. Hôtel Le Bénin, Chez Ama Couture…" />
      </div>
      <div>
        <label style={label}>Type d&apos;activité *</label>
        <select style={field} value={form.activity} onChange={set("activity")}>
          {Object.entries(activities).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label style={label}>Présentation</label>
        <textarea style={{ ...field, minHeight: 110, resize: "vertical" }} value={form.description} onChange={set("description")} maxLength={1500} placeholder="Qui êtes-vous, que proposez-vous, vos horaires, vos points forts…" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <label style={label}>Ville</label>
          <input style={field} value={form.city} onChange={set("city")} maxLength={60} />
        </div>
        <div>
          <label style={label}>Quartier</label>
          <input style={field} value={form.neighborhood} onChange={set("neighborhood")} maxLength={60} placeholder="Ex. Tokoin" />
        </div>
      </div>

      <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 14, padding: 12, display: "grid", gap: 10 }}>
        <strong style={{ fontSize: 14, color: "#166534" }}>Contacts (au moins un) — visibles par les membres connectés</strong>
        <div>
          <label style={label}>Numéro WhatsApp</label>
          <input style={field} value={form.whatsapp} onChange={set("whatsapp")} inputMode="tel" placeholder="Ex. +228 90 12 34 56" />
        </div>
        <div>
          <label style={label}>Page Facebook</label>
          <input style={field} value={form.facebook} onChange={set("facebook")} placeholder="Lien de la page ou nom (ex. hotellebenin)" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={label}>Téléphone</label>
            <input style={field} value={form.phone} onChange={set("phone")} inputMode="tel" />
          </div>
          <div>
            <label style={label}>Site web</label>
            <input style={field} value={form.website} onChange={set("website")} placeholder="https://…" />
          </div>
        </div>
      </div>

      {msg && <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: msg.ok ? "#166534" : "#B91C1C" }}>{msg.text}</p>}
      <button type="button" onClick={save} disabled={saving} style={{ ...primaryBtn, opacity: saving ? 0.7 : 1 }}>
        <Save size={18} /> {saving ? "Enregistrement…" : pro ? "Enregistrer les modifications" : "Créer mon Espace Pro"}
      </button>
    </div>
  );
}
