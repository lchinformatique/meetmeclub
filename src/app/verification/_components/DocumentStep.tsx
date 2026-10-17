"use client";
// Packs Essentiel (3 000) et Complice (6 000) : pièce d'identité (toute pièce officielle avec photo).
// Pré-contrôle par IA : validée tout de suite si tout concorde, sinon contrôlée par l'équipe.

import { useState } from "react";
import { CheckCircle2, CreditCard, ImagePlus, RefreshCw } from "lucide-react";
import { card, ErrorText, lead, NAVY, Pending, primaryBtn, Privacy, Rejected, secondaryBtn, Spinner, title, toJpeg, type VerificationData } from "./ui";

function PhotoPicker({ label, hint, file, onPick }: { label: string; hint: string; file: Blob | null; onPick: (f: Blob | null) => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  return (
    <label
      style={{
        display: "block",
        border: `2px dashed ${file ? "#16A34A" : "#78859A"}`,
        borderRadius: 16,
        padding: 12,
        cursor: "pointer",
        background: file ? "#F0FDF4" : "#F8FAFC",
        textAlign: "center",
      }}
    >
      <input
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          try {
            const jpeg = await toJpeg(f);
            onPick(jpeg);
            setPreview(URL.createObjectURL(jpeg));
          } catch {
            onPick(null);
            setPreview(null);
          }
        }}
      />
      {preview && file ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt={label} style={{ width: "100%", maxHeight: 180, objectFit: "contain", borderRadius: 10 }} />
      ) : (
        <ImagePlus size={30} color={NAVY} style={{ margin: "6px auto" }} />
      )}
      <div style={{ fontWeight: 800, color: NAVY, fontSize: 14, marginTop: 6 }}>{file ? `${label} ✓ (toucher pour changer)` : label}</div>
      <div style={{ fontSize: 12, color: "#505D70" }}>{hint}</div>
    </label>
  );
}

export default function DocumentStep({ data, onDone }: { data: VerificationData; onDone: () => void }) {
  const types = data.documentTypes || {};
  const [docType, setDocType] = useState("CNI");
  const [front, setFront] = useState<Blob | null>(null);
  const [back, setBack] = useState<Blob | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<string | null>(null);

  async function send() {
    if (!front) return setError("Ajoutez la photo du recto de votre pièce.");
    setSending(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("docType", docType);
      fd.append("front", front, "recto.jpg");
      if (back) fd.append("back", back, "verso.jpg");
      const res = await fetch("/api/verifications/document", { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok) return setError(d.error || "Envoi impossible.");
      setResult(d.message);
      setTimeout(onDone, 2500);
    } catch {
      setError("Connexion perdue. Vérifiez votre internet et réessayez.");
    } finally {
      setSending(false);
    }
  }

  const doc = data.document;
  if (doc?.status === "PENDING") {
    return (
      <Pending heading="Pièce en cours de vérification">
        Votre {doc.typeLabel?.toLowerCase() || "pièce d'identité"} a bien été reçue. L&apos;équipe Meet Me Club la vérifie et vous
        recevrez une notification dès la validation.
      </Pending>
    );
  }

  if (result) {
    return (
      <div style={card}>
        <CheckCircle2 size={52} color="#16A34A" style={{ margin: "0 auto 12px" }} />
        <p style={{ ...lead, fontWeight: 700, color: "#0F172A" }}>{result}</p>
      </div>
    );
  }

  return (
    <div style={card}>
      {doc?.status === "REJECTED" && <Rejected note={doc.note} />}
      <CreditCard size={44} color={NAVY} style={{ margin: "0 auto 10px" }} />
      <h1 style={title}>Vérifiez votre identité</h1>
      <p style={lead}>
        Envoyez une photo de votre pièce d&apos;identité. Le nom doit correspondre à celui de votre profil, et la pièce
        doit montrer votre photo et votre date de naissance.
      </p>

      <label style={{ display: "block", textAlign: "left", fontSize: 13, fontWeight: 800, color: NAVY, marginBottom: 6 }}>Type de pièce</label>
      <select
        value={docType}
        onChange={(e) => setDocType(e.target.value)}
        style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid #CBD5E1", fontSize: 15, fontWeight: 600, marginBottom: 14, background: "white" }}
      >
        {Object.entries(types).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
        <PhotoPicker label="Recto de la pièce" hint="Côté avec votre photo — obligatoire" file={front} onPick={setFront} />
        <PhotoPicker label="Verso de la pièce" hint="Facultatif — si la date de naissance est au dos" file={back} onPick={setBack} />
      </div>

      <ul style={{ textAlign: "left", color: "#334155", fontSize: 13, lineHeight: 1.7, margin: "0 0 16px", paddingLeft: 20 }}>
        <li>Pièce entière dans le cadre, posée à plat, bien éclairée</li>
        <li>Pas de reflet sur la photo ni sur les écritures</li>
        <li>Photo de la vraie carte (pas une capture d&apos;écran ni une photocopie)</li>
      </ul>

      <div style={{ display: "grid", gap: 10 }}>
        <button type="button" onClick={send} disabled={sending || !front} style={{ ...primaryBtn, opacity: sending || !front ? 0.6 : 1 }}>
          {sending ? <Spinner /> : <CheckCircle2 size={20} />} {sending ? "Analyse de votre pièce…" : "Envoyer ma pièce"}
        </button>
        {(front || back) && !sending && (
          <button type="button" onClick={() => { setFront(null); setBack(null); }} style={secondaryBtn}>
            <RefreshCw size={18} /> Recommencer
          </button>
        )}
      </div>
      {sending && <p style={{ fontSize: 13, color: "#505D70", marginTop: 10 }}>Le contrôle peut prendre jusqu&apos;à une minute, ne fermez pas la page.</p>}

      {error && <ErrorText>{error}</ErrorText>}
      <Privacy>
        Votre pièce reste strictement confidentielle : elle est lue par notre système de contrôle et, si besoin, par
        l&apos;équipe de vérification. Elle n&apos;est jamais montrée aux autres membres.
      </Privacy>
    </div>
  );
}
