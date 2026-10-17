// src/lib/market-broadcast.ts
// Diffusion d'une annonce validée : chaque membre reçoit un message de l'équipe dans sa messagerie
// (avec le lien de l'annonce), une notification sur son téléphone et une mise à jour en direct.

import { getSupabaseAdmin, findOrCreateConversationInSupabase, saveMessageInSupabase } from "./supabase-server";
import { notifyNewMessage } from "./messaging-server";
import { VICTOIRE_USER_ID } from "./victoire-bot";
import { formatPrice } from "./market-constants";

const SITE = "https://www.meetmeclub.net";

export async function broadcastListing(listingId: string, senderId: string): Promise<{ sent: number }> {
  const admin = getSupabaseAdmin();
  const { data: l } = await admin
    .from("pro_listings")
    .select('id, title, price, "priceLabel", city, status, pro:pro_spaces(name)')
    .eq("id", listingId)
    .maybeSingle();
  if (!l || l.status !== "ACTIVE") return { sent: 0 };

  const pro: any = (l as any).pro;
  const body =
    `📢 Nouvelle annonce au Marché Meet Me Club\n` +
    `« ${l.title} »${pro?.name ? ` — ${pro.name}` : ""}\n` +
    `${formatPrice(l as any)}${l.city ? ` · ${l.city}` : ""}\n` +
    `👉 Voir l'annonce : ${SITE}/marche/annonce/${l.id}`;

  const { data: members } = await admin.from("profiles").select("userId").limit(10000);
  const recipients = Array.from(new Set((members || []).map((m: any) => m.userId))).filter(
    (id) => id && id !== senderId && id !== VICTOIRE_USER_ID
  );

  let sent = 0;
  for (let i = 0; i < recipients.length; i += 10) {
    await Promise.allSettled(
      recipients.slice(i, i + 10).map(async (userId) => {
        const conv = await findOrCreateConversationInSupabase(senderId, userId);
        if (!conv?.id) return;
        const messageId = `msg_ann_${l.id.slice(-12)}_${Date.now().toString(36)}_${userId.slice(-10)}`;
        const saved = await saveMessageInSupabase({ id: messageId, conversationId: conv.id, senderId, body });
        if (!saved) return;
        sent++;
        await notifyNewMessage({
          conversationId: conv.id,
          messageId,
          senderId,
          recipientId: userId,
          body,
          senderName: "Équipe Meet Me Club",
        });
      })
    );
  }
  return { sent };
}
