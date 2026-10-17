"use client";
// Formulaire de l'Espace Pro : marque, logo, bannière, activité, présentation et contacts.

import { useState } from "react";
import { ImagePlus, Save } from "lucide-react";
import { toJpeg } from "@/app/verification/_components/ui";
import CountryPicker from "@/components/forms/CountryPicker";
import PhoneField from "@/components/forms/PhoneField";
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
    city: pro?.city || "",
    country: pro?.country || "",
    address: pro?.address || "",
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
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 12 }}>
      {/* Aperçu bannière + logo */}
      <div style={{ borderRadius: 18, overflow: "hidden", background: "#fff", border: "1px solid #E2E8F0" }}>
        <label style={{ display: "block", height: 150, cursor: "pointer", position: "relative", background: cover ? `center/cover url("${cover}")` : "linear-gradient(135deg,#DFE6F7,#F3E8F3)", borderBottom: "1px solid #E4E8F1" }}>
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={async (e) => { const f = e.target.files?.[0]; if (f) setCover(await fileToDataUrl(f, 1600)); e.target.value = ""; }} />
          <span style={{ position: "absolute", right: 10, top: 10, background: "rgba(255,255,255,0.95)", color: "#2F4A8A", border: "1px solid #E4E8F1", fontSize: 12, fontWeight: 800, padding: "6px 11px", borderRadius: 999, display: "inline-flex", gap: 6, alignItems: "center", boxShadow: "0 4px 12px rgba(30,42,68,0.12)" }}>
            <ImagePlus size={14} /> {cover ? "Changer la bannière" : "Ajouter une bannière"}
          </span>
        </label>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", padding: "0 14px 14px", marginTop: -40 }}>
          <label style={{ width: 84, height: 84, borderRadius: 20, border: "4px solid #fff", outline: "1.5px solid #E4E8F1", background: logo ? `center/cover url("${logo}")` : "#EEF2FB", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 6px 16px rgba(0,0,0,0.15)" }}>
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={async (e) => { const f = e.target.files?.[0]; if (f) setLogo(await fileToDataUrl(f, 512)); e.target.value = ""; }} />
            {!logo && <ImagePlus size={24} color={NAVY} />}
          </label>
          <div style={{ minWidth: 0, paddingTop: 46 }}>
            <strong style={{ display: "block", fontSize: 17, color: "#1E2A44", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{form.name || "Nom de votre marque"}</strong>
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
      <div>
        <label style={label}>Pays *</label>
        <CountryPicker value={form.country} onChange={(c) => setForm((f) => ({ ...f, country: c.iso }))} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
        <div>
          <label style={label}>Ville *</label>
          <input style={field} value={form.city} onChange={set("city")} maxLength={60} placeholder="Votre ville" />
        </div>
        <div>
          <label style={label}>Adresse *</label>
          <input style={field} value={form.address} onChange={set("address")} maxLength={160} placeholder="N°, rue, code postal" />
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 12, color: "#64748B" }}>L&apos;adresse de votre activité est affichée sur votre vitrine : transparence et confiance pour les membres.</p>

      <div style={{ background: "#F3FAF7", border: "1px solid #CDE9DF", borderRadius: 14, padding: 12, display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 10 }}>
        <strong style={{ fontSize: 14, color: "#2E6B5D" }}>Vos contacts</strong>
        <p style={{ margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.5 }}>
          Affichés aux membres connectés sous vos annonces et sur votre vitrine. Les membres peuvent aussi vous écrire
          directement dans la messagerie Meet Me Club.
        </p>
        <div>
          <label style={label}>Téléphone *</label>
          <PhoneField value={form.phone} defaultCountry={form.country || null} onChange={(phone) => setForm((f) => ({ ...f, phone }))} />
        </div>
        <div>
          <label style={label}>WhatsApp (facultatif)</label>
          <PhoneField value={form.whatsapp} defaultCountry={form.country || null} onChange={(whatsapp) => setForm((f) => ({ ...f, whatsapp }))} placeholder="Numéro WhatsApp" />
        </div>
        <div>
          <label style={label}>Page Facebook (facultatif)</label>
          <input style={field} value={form.facebook} onChange={set("facebook")} placeholder="Lien ou nom de la page" />
        </div>
        <div>
          <label style={label}>Site web (facultatif)</label>
          <input style={field} value={form.website} onChange={set("website")} placeholder="https://…" />
        </div>
      </div>

      {msg && <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: msg.ok ? "#166534" : "#B91C1C" }}>{msg.text}</p>}
      <button type="button" onClick={save} disabled={saving} style={{ ...primaryBtn, opacity: saving ? 0.7 : 1 }}>
        <Save size={18} /> {saving ? "Enregistrement…" : pro ? "Enregistrer les modifications" : "Créer mon Espace Pro"}
      </button>
    </div>
  );
}
