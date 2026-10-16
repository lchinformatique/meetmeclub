"use client";
// src/lib/realtime-client.ts
// Canaux temps réel côté navigateur (Supabase Realtime)
//  - "mmc-presence"        : qui est connecté en ce moment
//  - "mmc-inbox-<userId>"  : événements destinés à un membre (messages, appels, saisie…)

import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./supabase-client";

export const PRESENCE_CHANNEL = "mmc-presence";

export function inboxChannelName(userId: string) {
  return `mmc-inbox-${userId}`;
}

export function openInbox(
  userId: string,
  onEvent: (event: string, payload: any) => void
): RealtimeChannel {
  return supabase
    .channel(inboxChannelName(userId), { config: { broadcast: { self: false } } })
    .on("broadcast", { event: "*" }, (msg) => onEvent(msg.event, msg.payload))
    .subscribe();
}

/** Envoie un événement dans la boîte d'un autre membre (REST, sans s'abonner à son canal) */
export async function sendToUser(userId: string, event: string, payload: Record<string, unknown>) {
  const channel = supabase.channel(inboxChannelName(userId));
  try {
    const res = await channel.httpSend(event, payload, { timeout: 8000 });
    return res.success;
  } catch (err) {
    console.warn("[sendToUser]", event, err);
    return false;
  } finally {
    supabase.removeChannel(channel);
  }
}

export interface PresenceInfo {
  userId: string;
  firstName: string;
  photoUrl?: string | null;
  city?: string;
  plan?: string;
  onlineAt: string;
}

export function joinPresence(
  me: Omit<PresenceInfo, "onlineAt">,
  onSync: (online: Record<string, PresenceInfo>) => void
): RealtimeChannel {
  const channel = supabase.channel(PRESENCE_CHANNEL, { config: { presence: { key: me.userId } } });
  channel
    .on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<PresenceInfo>();
      const online: Record<string, PresenceInfo> = {};
      for (const [key, metas] of Object.entries(state)) {
        const latest = metas[metas.length - 1];
        if (latest) online[key] = { ...latest, userId: latest.userId || key };
      }
      onSync(online);
    })
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ ...me, onlineAt: new Date().toISOString() });
      }
    });
  return channel;
}

export function removeChannel(channel: RealtimeChannel | null | undefined) {
  if (channel) supabase.removeChannel(channel);
}
