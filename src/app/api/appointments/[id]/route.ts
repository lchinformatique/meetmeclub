// src/app/api/appointments/[id]/route.ts
// PATCH /api/appointments/[id] — update appointment status (accept/reject/cancel)
// GET   /api/appointments/[id] — get a single appointment

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

// ── GET: single appointment ──────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const { id } = await params;

  try {
    const appointment = await (prisma as any).appointment.findFirst({
      where: {
        id,
        OR: [
          { proposerId: session.userId },
          { receiverId: session.userId },
        ],
      },
      include: {
        partner: true,
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Rendez-vous introuvable" }, { status: 404 });
    }

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error("[GET /api/appointments/[id]]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ── PATCH: update appointment status ─────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const { action, cancelReason } = body;

  const VALID_ACTIONS = ["ACCEPT", "REJECT", "CANCEL", "COMPLETE"];
  if (!action || !VALID_ACTIONS.includes(action)) {
    return NextResponse.json(
      { error: `Action invalide. Choisissez parmi : ${VALID_ACTIONS.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const appointment = await (prisma as any).appointment.findFirst({
      where: {
        id,
        OR: [
          { proposerId: session.userId },
          { receiverId: session.userId },
        ],
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Rendez-vous introuvable" }, { status: 404 });
    }

    // Permission checks per action
    if (action === "ACCEPT" || action === "REJECT") {
      if (appointment.receiverId !== session.userId) {
        return NextResponse.json(
          { error: "Seul le destinataire peut accepter ou refuser" },
          { status: 403 }
        );
      }
      if (appointment.status !== "PENDING") {
        return NextResponse.json(
          { error: "Ce rendez-vous ne peut plus être accepté ou refusé" },
          { status: 409 }
        );
      }
    }

    if (action === "CANCEL") {
      if (!["PENDING", "ACCEPTED"].includes(appointment.status)) {
        return NextResponse.json(
          { error: "Ce rendez-vous ne peut plus être annulé" },
          { status: 409 }
        );
      }
    }

    if (action === "COMPLETE") {
      if (appointment.status !== "ACCEPTED") {
        return NextResponse.json(
          { error: "Seuls les rendez-vous acceptés peuvent être marqués comme terminés" },
          { status: 409 }
        );
      }
      if (new Date(appointment.scheduledAt) > new Date()) {
        return NextResponse.json(
          { error: "Le rendez-vous n'a pas encore eu lieu" },
          { status: 409 }
        );
      }
    }

    // Build update payload
    const updateData: Record<string, unknown> = {};
    switch (action) {
      case "ACCEPT":
        updateData.status = "ACCEPTED";
        // Generate unique QR code on acceptance
        updateData.qrCode = `QR-MMC-${randomBytes(6).toString("hex").toUpperCase()}`;
        break;
      case "REJECT":
        updateData.status = "REJECTED";
        break;
      case "CANCEL":
        updateData.status = "CANCELLED";
        updateData.cancelReason = cancelReason?.trim() || null;
        break;
      case "COMPLETE":
        updateData.status = "COMPLETED";
        updateData.completedAt = new Date();
        break;
    }

    const updated = await (prisma as any).appointment.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ appointment: updated });
  } catch (error) {
    console.error("[PATCH /api/appointments/[id]]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
