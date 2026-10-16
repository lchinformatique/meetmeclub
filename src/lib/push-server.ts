// src/lib/push-server.ts
// Notifications Web Push (téléphone / ordinateur, même navigateur fermé)
// Les abonnements sont stockés dans la table existante "notifications"
// (type = PUSH_SUBSCRIPTION, title = endpoint, data = abonnement JSON).

import webpush from "web-push";
import { getSupabaseAdmin } from "./supabase-server";

const PUSH_TYPE = "PUSH_SUBSCRIPTION";
const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:contact@meetmeclub.net";

let configured = false;
function ensureConfigured() {
  if (configured) return true;
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return false;
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  configured = true;
  return true;
}

export function isPushConfigured() {
  return Boolean(VAPID_PUBLIC && VAPID_PRIVATE);
}

export interface PushSubscriptionJSON {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export async function savePushSubscription(userId: string, sub: PushSubscriptionJSON) {
  const admin = getSupabaseAdmin();
  // Un endpoint = un appareil. On le réattribue au membre courant.
  await admin.from("notifications").delete().eq("type", PUSH_TYPE).eq("title", sub.endpoint);
  const { error } = await admin.from("notifications").insert({
    id: `push_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId,
    type: PUSH_TYPE,
    title: sub.endpoint,
    body: "",
    data: sub,
    createdAt: new Date().toISOString(),
  });
  if (error) console.warn("[savePushSubscription]", error);
  return !error;
}

export async function removePushSubscription(endpoint: string) {
  const admin = getSupabaseAdmin();
  await admin.from("notifications").delete().eq("type", PUSH_TYPE).eq("title", endpoint);
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
  kind?: "message" | "call" | "missed-call";
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!ensureConfigured()) return 0;
  const admin = getSupabaseAdmin();
  const { data: rows } = await admin
    .from("notifications")
    .select("id, data")
    .eq("userId", userId)
    .eq("type", PUSH_TYPE);
  if (!rows?.length) return 0;

  let sent = 0;
  await Promise.all(
    rows.map(async (row: any) => {
      try {
        await webpush.sendNotification(row.data, JSON.stringify(payload), {
          TTL: payload.kind === "call" ? 45 : 60 * 60 * 24,
          urgency: "high",
        });
        sent++;
      } catch (err: any) {
        // Abonnement expiré ou révoqué → nettoyage
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await admin.from("notifications").delete().eq("id", row.id);
        } else {
          console.warn("[sendPushToUser]", err?.statusCode, err?.body || err?.message);
        }
      }
    })
  );
  return sent;
}
