"use client";
// Publication d'une annonce : vente (comptée dans le quota du pack Complice) ou service (illimité).

import { useState } from "react";
import { ImagePlus, Send, X } from "lucide-react";
import { toJpeg } from "@/app/verification/_components/ui";
import { MAX_PHOTOS } from "@/lib/market-constants";
import { field, label, NAVY, primaryBtn, type ProSpace } from "./shared";

async function toDataUrl(file: File) {
  const blob = await toJpeg(file, 1280);
  return new Promise<string>((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.readAsDataURL(blob);
  });
}

export default function ListingForm({
  pro,
  categories,
  salesLeft,
  onPublished,
}: {
  pro: ProSpace;
  categories: Record<string, { label: string; icon: string }>;
  /** null = illimité */
  salesLeft: number | null;
  onPublished: () => void;
}) {
  const [kind, setKind] = useState<"SALE" | "SERVICE">(salesLeft === 0 ? "SERVICE" : "SALE");
  const [form, setForm] = useState({ title: "", category: "", price: "", priceLabel: "", description: "", city: pro.city || "" });
  const [photos, setPhotos] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function addPhotos(files: FileList | null) {
    if (!files) return;
    const room = MAX_PHOTOS - photos.length;
    const next = await Promise.all(Array.from(files).slice(0, room).map(toDataUrl));
    setPhotos((p) => [...p, ...next].slice(0, MAX_PHOTOS));
  }

  async function publish() {
    setSending(true);
    setMsg(null);
    try {
      const res = await fetch("/api/pro/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, kind, price: form.price === "" ? null : Number(form.price.replace(/\s/g, "")), photos }),
      });
      const d = await res.json();
      if (!res.ok) return setMsg({ ok: false, text: d.error || "Publication impossible." });
      setMsg({ ok: true, text: "Annonce publiée dans le Marché ✓" });
      setForm((f) => ({ ...f, title: "", price: "", priceLabel: "", description: "" }));
      setPhotos([]);
      onPublished();
    } catch {
      setMsg({ ok: false, text: "Connexion perdue. Réessayez." });
    } finally {
      setSending(false);
    }
  }

  const saleBlocked = kind === "SALE" && salesLeft === 0;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {(["SALE", "SERVICE"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            style={{
              padding: "12px 10px",
              borderRadius: 12,
              fontWeight: 800,
              fontSize: 14,
              cursor: "pointer",
              border: `2px solid ${kind === k ? NAVY : "#CBD5E1"}`,
              background: kind === k ? NAVY : "#fff",
              color: kind === k ? "#fff" : NAVY,
            }}
          >
            {k === "SALE" ? "🏷️ Vente" : "🤝 Service / prestation"}
            <span style={{ display: "block", fontSize: 11, fontWeight: 600, opacity: 0.85 }}>
              {k === "SALE" ? (salesLeft === null ? "Illimité" : `${salesLeft} restante(s) ce mois`) : "Illimité"}
            </span>
          </button>
        ))}
      </div>

      {saleBlocked && (
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#B45309", background: "#FFFBEB", padding: 10, borderRadius: 10 }}>
          Vous avez utilisé vos 10 annonces de vente ce mois-ci. Vous pouvez publier des services sans limite, ou passer VIP pour vendre sans limite.
        </p>
      )}

      <div>
        <label style={label}>Titre *</label>
        <input style={field} value={form.title} onChange={set("title")} maxLength={90} placeholder={kind === "SALE" ? "Ex. iPhone 13 128 Go comme neuf" : "Ex. Chambre double climatisée, petit-déjeuner inclus"} />
      </div>
      <div>
        <label style={label}>Catégorie *</label>
        <select style={field} value={form.category} onChange={set("category")}>
          <option value="">Choisir une catégorie</option>
          {Object.entries(categories).map(([k, c]) => (
            <option key={k} value={k}>
              {c.icon} {c.label}
            </option>
          ))}
        </select>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <label style={label}>Prix (FCFA)</label>
          <input style={field} value={form.price} onChange={set("price")} inputMode="numeric" placeholder="Ex. 25000" />
        </div>
        <div>
          <label style={label}>Ou mention</label>
          <input style={field} value={form.priceLabel} onChange={set("priceLabel")} disabled={form.price !== ""} maxLength={40} placeholder={kind === "SERVICE" ? "Sur devis" : "À débattre"} />
        </div>
      </div>
      <div>
        <label style={label}>Description *</label>
        <textarea style={{ ...field, minHeight: 120, resize: "vertical" }} value={form.description} onChange={set("description")} maxLength={3000} placeholder="État, caractéristiques, horaires, conditions, livraison…" />
      </div>
      <div>
        <label style={label}>Ville</label>
        <input style={field} value={form.city} onChange={set("city")} maxLength={60} />
      </div>

      <div>
        <label style={label}>
          Photos ({photos.length}/{MAX_PHOTOS}){kind === "SALE" ? " — au moins 1" : ""}
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {photos.map((p, i) => (
            <div key={i} style={{ position: "relative", aspectRatio: "1", borderRadius: 12, background: `center/cover url("${p}")` }}>
              <button type="button" onClick={() => setPhotos((ph) => ph.filter((_, j) => j !== i))} aria-label="Retirer la photo" style={{ position: "absolute", top: 4, right: 4, width: 24, height: 24, borderRadius: 12, border: "none", background: "rgba(15,23,42,0.75)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={14} />
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <label style={{ aspectRatio: "1", borderRadius: 12, border: "2px dashed #78859A", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "#F8FAFC" }}>
              <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => { addPhotos(e.target.files); e.target.value = ""; }} />
              <ImagePlus size={24} color={NAVY} />
            </label>
          )}
        </div>
      </div>

      {msg && <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: msg.ok ? "#166534" : "#B91C1C" }}>{msg.text}</p>}
      <button type="button" onClick={publish} disabled={sending || saleBlocked} style={{ ...primaryBtn, opacity: sending || saleBlocked ? 0.6 : 1 }}>
        <Send size={18} /> {sending ? "Publication…" : "Publier dans le Marché"}
      </button>
      <p style={{ margin: 0, fontSize: 12, color: "#505D70", lineHeight: 1.5 }}>
        Interdit : produits illégaux, contenus pour adultes, armes, médicaments, arnaques. Les annonces signalées peuvent être retirées.
      </p>
    </div>
  );
}
