// src/lib/admin-notify.ts
// Alertes envoyées uniquement à l'administrateur : notification téléphone, événement temps réel
// (pastille du menu Admin) et e-mail (ADMIN_NOTIFY_EMAIL, par défaut lchinformatique@gmail.com).

import { getAdminUserIds } from "./admin-auth";

const DEFAULT_ADMIN_EMAIL = "lchinformatique@gmail.com";

export async function sendAdminAlert(alert: {
  title: string;
  body: string;
  url: string;
  tag: string;
  emailSubject: string;
  emailHtml: string;
}) {
  const { sendPushToUser } = await import("./push-server");
  const { broadcastToUser } = await import("./realtime-server");
  const adminIds = await getAdminUserIds();

  await Promise.allSettled([
    ...adminIds.map((id) =>
      sendPushToUser(id, { kind: "message", title: alert.title, body: alert.body, url: alert.url, tag: alert.tag })
    ),
    ...adminIds.map((id) => broadcastToUser(id, "admin-alert", { title: alert.title, url: alert.url })),
    sendAdminEmail(alert.emailSubject, alert.emailHtml),
  ]);
}

async function sendAdminEmail(subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_NOTIFY_EMAIL || DEFAULT_ADMIN_EMAIL;
  if (!apiKey) return;
  try {
    const { Resend } = await import("resend");
    const { error } = await new Resend(apiKey).emails.send({
      from: process.env.EMAIL_FROM || "Meet Me Club <noreply@meetmeclub.net>",
      to,
      subject,
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;border-radius:16px;border:1px solid #E2E8F0">
        <div style="font-size:20px;font-weight:800;color:#0B2559;margin-bottom:12px">Meet Me Club · Administration</div>
        ${html}
      </div>`,
    });
    if (error) console.warn("[admin email]", error);
  } catch (err) {
    console.warn("[admin email]", err);
  }
}

export function siteUrl() {
  return process.env.NEXT_PUBLIC_APP_URL?.startsWith("http") && !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")
    ? process.env.NEXT_PUBLIC_APP_URL
    : "https://www.meetmeclub.net";
}

/** Nouveau membre inscrit */
export async function alertNewMember(m: { firstName?: string; pseudo?: string; email?: string; via: "Google" | "e-mail" }) {
  const who = `${m.firstName || "Nouveau membre"}${m.pseudo ? ` (@${m.pseudo})` : ""}`;
  await sendAdminAlert({
    title: "👤 Nouveau membre inscrit",
    body: `${who} vient de rejoindre le club (${m.via}).`,
    url: "/admin/membres",
    tag: "new-member",
    emailSubject: `Nouveau membre : ${who}`,
    emailHtml: `<p><strong>${who}</strong> vient de créer son compte avec ${m.via}.</p>
      <p>E-mail : ${m.email || "—"}</p>
      <p><a href="${siteUrl()}/admin/membres" style="display:inline-block;background:#0B2559;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:bold">Voir les membres</a></p>`,
  });
}
