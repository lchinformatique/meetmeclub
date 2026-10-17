// src/app/api/sorties/[id]/route.ts
// PATCH { action: "ACCEPT" | "DECLINE" | "CANCEL" }
//  · l'invité(e) accepte (→ l'équipe confirme le lieu) ou refuse
//  · chacun peut annuler tant que la sortie n'est pas confirmée

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { memberCards, notifyMember } from "@/lib/sorties";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const { id } = await params;
  const { action } = (await req.json().catch(() => ({}))) as { action?: string };

  const admin = getSupabaseAdmin();
  const { data: d } = await admin.from("date_requests").select("*").eq("id", id).maybeSingle();
  if (!d || (d.proposerId !== session.userId && d.receiverId !== session.userId)) {
    return NextResponse.json({ error: "Sortie introuvable" }, { status: 404 });
  }
  const isGuest = d.receiverId === session.userId;
  const other = isGuest ? d.proposerId : d.receiverId;
  const me = (await memberCards([session.userId]))[session.userId]?.firstName || "Votre invité(e)";
  const place = d.venueSnapshot?.proName || "le lieu choisi";

  let status: string | null = null;
  if (action === "ACCEPT" && isGuest && d.status === "WAITING_GUEST") status = "WAITING_TEAM";
  else if (action === "DECLINE" && isGuest && d.status === "WAITING_GUEST") status = "DECLINED_GUEST";
  else if (action === "CANCEL" && ["WAITING_GUEST", "WAITING_TEAM"].includes(d.status)) status = "CANCELLED";
  if (!status) return NextResponse.json({ error: "Action impossible pour cette sortie." }, { status: 400 });

  const { error } = await admin.from("date_requests").update({ status, updatedAt: new Date().toISOString() }).eq("id", id);
  if (error) return NextResponse.json({ error: "Mise à jour impossible" }, { status: 500 });

  if (status === "WAITING_TEAM") {
    await notifyMember(other, "✅ Invitation acceptée", `${me} a accepté votre sortie à ${place}. L'équipe confirme le lieu et vous prévient.`);
    try {
      const { sendAdminAlert, siteUrl } = await import("@/lib/admin-notify");
      await sendAdminAlert({
        title: "📅 Sortie à confirmer",
        body: `Une sortie à ${place} attend votre accord avec le lieu.`,
        url: "/admin/sorties",
        tag: "sortie",
        emailSubject: `Sortie à confirmer : ${place}`,
        emailHtml: `<p>Les deux membres ont accepté une sortie à <strong>${place}</strong>.</p><p>Contactez le lieu pour confirmer la disponibilité, puis validez.</p>
          <p><a href="${siteUrl()}/admin/sorties" style="display:inline-block;background:#0B2559;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:bold">Voir la demande</a></p>`,
      });
    } catch {}
  } else if (status === "DECLINED_GUEST") {
    await notifyMember(other, "Invitation déclinée", `${me} ne peut pas accepter la sortie à ${place}.`);
  } else if (status === "CANCELLED") {
    await notifyMember(other, "Sortie annulée", `${me} a annulé la sortie à ${place}.`);
  }

  return NextResponse.json({ success: true, status });
}
