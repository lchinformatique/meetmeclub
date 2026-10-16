// src/lib/messaging-server.ts
// Messages non lus, accusés de lecture et notifications de nouveaux messages.
// S'appuie sur la colonne "status" (SENT | DELIVERED | READ) de la table messages.

import { getSupabaseAdmin } from "./supabase-server";
import { broadcastToUser } from "./realtime-server";
import { sendPushToUser } from "./push-server";

export async function getConversationIdsForUser(userId: string): Promise<string[]> {
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("conversations")
    .select("id")
    .or(`participantA.eq.${userId},participantB.eq.${userId}`);
  return (data || []).map((c: any) => c.id);
}

/** Nombre de messages non lus par conversation pour un membre */
export async function getUnreadCounts(userId: string): Promise<Record<string, number>> {
  const convIds = await getConversationIdsForUser(userId);
  if (convIds.length === 0) return {};
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("messages")
    .select("conversationId")
    .in("conversationId", convIds)
    .neq("senderId", userId)
    .neq("status", "READ")
    .is("deletedAt", null)
    .limit(2000);
  const counts: Record<string, number> = {};
  for (const row of data || []) {
    counts[row.conversationId] = (counts[row.conversationId] || 0) + 1;
  }
  return counts;
}

/** Marque comme lus tous les messages reçus dans une conversation et prévient l'expéditeur */
export async function markConversationRead(userId: string, conversationId: string) {
  const admin = getSupabaseAdmin();
  const { data: conv } = await admin
    .from("conversations")
    .select("participantA, participantB")
    .eq("id", conversationId)
    .maybeSingle();
  if (!conv || (conv.participantA !== userId && conv.participantB !== userId)) return false;

  const { error } = await admin
    .from("messages")
    .update({ status: "READ" })
    .eq("conversationId", conversationId)
    .neq("senderId", userId)
    .neq("status", "READ");
  if (error) {
    console.warn("[markConversationRead]", error);
    return false;
  }

  const partnerId = conv.participantA === userId ? conv.participantB : conv.participantA;
  await broadcastToUser(partnerId, "read", { conversationId, readerId: userId });
  return true;
}

function previewOf(body: string, mediaUrl?: string | null) {
  if (body?.startsWith("🎙️")) return "🎙️ Note vocale";
  if (body?.startsWith("📍")) return "📍 Position partagée";
  if (mediaUrl && !body) return "📷 Photo";
  const clean = (body || "").replace(/\s+/g, " ").trim();
  return clean.length > 90 ? `${clean.slice(0, 90)}…` : clean || "Nouveau message";
}

/** Prévient le destinataire d'un nouveau message : temps réel + notification téléphone */
export async function notifyNewMessage(params: {
  conversationId: string;
  messageId: string;
  senderId: string;
  recipientId: string;
  body: string;
  mediaUrl?: string | null;
  senderName?: string;
  senderPhoto?: string;
}) {
  const { conversationId, recipientId, senderId } = params;
  if (!recipientId || recipientId === senderId) return;

  let senderName = params.senderName;
  let senderPhoto = params.senderPhoto;
  if (!senderName) {
    try {
      const { getProfileFromSupabase } = await import("./supabase-server");
      const p = await getProfileFromSupabase(senderId);
      senderName = p?.firstName || "Un membre";
      senderPhoto = senderPhoto || p?.avatarUrl || p?.photos?.[0]?.url;
    } catch {
      senderName = "Un membre";
    }
  }

  const preview = previewOf(params.body, params.mediaUrl);

  await Promise.allSettled([
    // Pas de contenu du message dans le canal temps réel : le navigateur le recharge via l'API sécurisée
    broadcastToUser(recipientId, "message", {
      conversationId,
      messageId: params.messageId,
      senderId,
      senderName,
      senderPhoto: senderPhoto && senderPhoto.startsWith("http") ? senderPhoto : undefined,
    }),
    sendPushToUser(recipientId, {
      kind: "message",
      title: `💬 ${senderName}`,
      body: preview,
      url: `/messages?conv=${encodeURIComponent(conversationId)}`,
      tag: `conv-${conversationId}`,
      icon: senderPhoto && senderPhoto.startsWith("http") ? senderPhoto : undefined,
    }),
  ]);
}
