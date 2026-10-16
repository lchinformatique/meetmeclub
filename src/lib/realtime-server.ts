// src/lib/realtime-server.ts
// Diffusion d'événements temps réel (Supabase Realtime Broadcast via REST)
// Chaque membre écoute son canal privé "mmc-inbox-<userId>" côté navigateur.

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ibfnvkelthganvmisqbn.supabase.co";
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export function inboxTopic(userId: string) {
  return `mmc-inbox-${userId}`;
}

export async function broadcastToUser(userId: string, event: string, payload: Record<string, unknown>) {
  if (!userId || !SERVICE_KEY) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [{ topic: inboxTopic(userId), event, payload, private: false }],
      }),
    });
    if (!res.ok) console.warn("[broadcastToUser]", res.status, await res.text().catch(() => ""));
    return res.ok;
  } catch (err) {
    console.warn("[broadcastToUser] Exception:", err);
    return false;
  }
}
