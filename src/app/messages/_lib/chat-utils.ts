// src/app/messages/_lib/chat-utils.ts
// Types et fonctions utilitaires de la messagerie

export interface ChatMessage {
  id: string;
  senderId: string;
  body: string;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  location?: { label: string; lat: number; lng: number; mapsUrl: string };
  callLog?: { kind: "audio" | "video"; missed: boolean; label: string };
  createdAt: string;
  status: "SENT" | "DELIVERED" | "READ" | "PENDING" | "FAILED";
}

export interface Conversation {
  id: string;
  participantId: string;
  firstName: string;
  pseudo: string;
  photoUrl: string;
  lastMessage: string;
  lastMessageAt: string;
  lastMessageSenderId?: string;
  unreadCount: number;
  isVerified: boolean;
}

export interface Member {
  userId: string;
  firstName: string;
  pseudo?: string;
  photoUrl?: string;
  photos: Array<{ url: string; isMain?: boolean }>;
  city?: string;
  neighborhood?: string;
  bio?: string;
  profession?: string;
  relationshipGoal?: string;
  age?: number;
  plan?: string;
  gender?: string;
}

export const VICTOIRE_ID = "user_victoire_lome";

export const VICTOIRE_CONVERSATION: Conversation = {
  id: "conv_victoire_welcome",
  participantId: VICTOIRE_ID,
  firstName: "Victoire · Assistante",
  pseudo: "@victoire_lome",
  photoUrl: "/victoire_profile.jpg",
  lastMessage: "Assistante automatique · Vos questions sur le club",
  lastMessageAt: new Date().toISOString(),
  unreadCount: 0,
  isVerified: false,
};

export const GOAL_LABELS: Record<string, string> = {
  FRIENDSHIP: "Amitié & partage",
  CASUAL: "Sorties & convivialité",
  SERIOUS: "Relation sérieuse",
  MARRIAGE: "Mariage & foyer",
  EXCHANGE: "Échange & discussion",
};

export const LOME_SPOTS = [
  { name: "Plage de Lomé — Boulevard du Mono", lat: 6.1264, lng: 1.2255 },
  { name: "Bè Plage — Coco Beach", lat: 6.132, lng: 1.258 },
  { name: "Hôtel 2 Février — Place de l'Indépendance", lat: 6.1305, lng: 1.2162 },
  { name: "Tokoin — Café & Lounge", lat: 6.145, lng: 1.218 },
  { name: "Agoè-Nyivé — Carrefour 2 Lions", lat: 6.205, lng: 1.198 },
];

export function isRenderableUrl(url?: string | null): url is string {
  return Boolean(url && (url.startsWith("http") || url.startsWith("/") || url.startsWith("data:image")) && !url.includes("dicebear.com/7.x/initials"));
}

/** Convertit un message de l'API en message affichable */
export function toChatMessage(m: any): ChatMessage {
  const media: string | undefined = m.mediaUrl || undefined;
  const body: string = m.body || "";
  const isVideo = Boolean(media && (media.startsWith("data:video/") || /\.(mp4|mov|m4v)(\?|$)/i.test(media)));
  const isAudio = Boolean(
    media && (media.startsWith("data:audio/") || /\.(mp3|wav|m4a|aac|oga|weba)(\?|$)/i.test(media) || body.startsWith("🎙️"))
  );

  let location: ChatMessage["location"];
  const geo = body.match(/maps\?q=(-?[0-9.]+),(-?[0-9.]+)/);
  if (body.startsWith("📍") && geo) {
    const lat = parseFloat(geo[1]);
    const lng = parseFloat(geo[2]);
    const label = body.replace(/^📍\s*(Localisation partagée\s*:\s*)?/, "").replace(/\s*\(https?:\/\/[^)]+\)\s*$/, "").trim();
    location = { label: label || "Position partagée", lat, lng, mapsUrl: `https://www.google.com/maps?q=${lat},${lng}` };
  }

  let callLog: ChatMessage["callLog"];
  if (/^📞 Appel (vocal|vidéo)/.test(body) || /^📵 Appel (vocal|vidéo)/.test(body)) {
    callLog = {
      kind: body.includes("vidéo") ? "video" : "audio",
      missed: body.startsWith("📵"),
      label: body.replace(/^📞 |^📵 /, ""),
    };
  }

  return {
    id: m.id,
    senderId: m.senderId,
    body,
    imageUrl: media && !isVideo && !isAudio ? media : undefined,
    videoUrl: isVideo ? media : undefined,
    audioUrl: isAudio && media && media !== "synth_note" ? media : undefined,
    location,
    callLog,
    createdAt: m.createdAt || new Date().toISOString(),
    status: m.status || "SENT",
  };
}

export function formatListTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diffDays = Math.floor((startOfToday - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86400000);
  if (diffDays <= 0) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return d.toLocaleDateString("fr-FR", { weekday: "long" });
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export function formatBubbleTime(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function dayLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diffDays = Math.floor((startOfToday - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86400000);
  if (diffDays <= 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

export function previewText(body: string) {
  if (!body) return "";
  if (body.startsWith("🎙️")) return "🎙️ Note vocale";
  if (body.startsWith("📍")) return "📍 Position partagée";
  return body;
}

export function formatSeconds(sec: number) {
  return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
}

/** Réduit une photo (max 1600 px, JPEG) avant l'envoi pour un chargement rapide sur mobile */
export async function compressImage(file: File, maxSide = 1600, quality = 0.82): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  if (file.type === "image/gif") return dataUrl;
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = dataUrl;
    });
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    return dataUrl;
  }
}

export function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
