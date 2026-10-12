// src/app/api/appointments/route.ts
// GET  /api/appointments  — list appointments for the current user
// POST /api/appointments  — create a new appointment proposal

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PACK_PRICES: Record<string, number> = {
  DECOUVERTE: 2000,
  COMPLICE: 5000,
  DINER: 12000,
  VIP_PREMIUM: 30000,
};

const VALID_PACKS = Object.keys(PACK_PRICES);
const VALID_STATUSES = ["PENDING", "ACCEPTED", "REJECTED", "CANCELLED", "COMPLETED"];

// ── GET: list user's appointments ────────────────────────────
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  try {
    const where: Record<string, unknown> = {
      OR: [
        { proposerId: session.userId },
        { receiverId: session.userId },
      ],
    };

    if (status && VALID_STATUSES.includes(status)) {
      where.status = status;
    }

    const appointments = await (prisma as any).appointment.findMany({
      where,
      include: {
        partner: {
          select: {
            id: true,
            name: true,
            address: true,
            neighborhood: true,
            logoUrl: true,
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.warn("[GET /api/appointments] DB not available:", error);
    return NextResponse.json({ appointments: [] });
  }
}

// ── POST: propose a new appointment ──────────────────────────
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await req.json();
  const { receiverId, partnerId, pack, scheduledAt, note } = body;

  // Validate required fields
  if (!receiverId || !pack || !scheduledAt) {
    return NextResponse.json(
      { error: "receiverId, pack et scheduledAt sont requis" },
      { status: 400 }
    );
  }
  if (!VALID_PACKS.includes(pack)) {
    return NextResponse.json(
      { error: `Pack invalide. Choisissez parmi : ${VALID_PACKS.join(", ")}` },
      { status: 400 }
    );
  }
  if (receiverId === session.userId) {
    return NextResponse.json(
      { error: "Vous ne pouvez pas proposer un rendez-vous à vous-même" },
      { status: 400 }
    );
  }

  // Validate date is in the future (at least 1 hour ahead)
  const scheduled = new Date(scheduledAt);
  if (isNaN(scheduled.getTime()) || scheduled.getTime() < Date.now() + 3600000) {
    return NextResponse.json(
      { error: "La date doit être au moins 1 heure dans le futur" },
      { status: 400 }
    );
  }

  // Check for identity and selfie verification
  try {
    const userProfile = await (prisma as any).profile.findUnique({
      where: { userId: session.userId },
      select: {
        idDocumentSubmitted: true,
        idDocumentVerified: true,
        selfieSubmitted: true,
        selfieVerified: true,
      },
    });

    const isVerified = Boolean(
      (userProfile?.idDocumentSubmitted || userProfile?.idDocumentVerified) &&
      (userProfile?.selfieSubmitted || userProfile?.selfieVerified)
    );

    if (!isVerified) {
      return NextResponse.json(
        {
          error: "Vérification requise",
          needsVerification: true,
          message: "Vous devez d'abord soumettre votre pièce d'identité et votre selfie de contrôle facial avant de planifier un rendez-vous avec un partenaire.",
        },
        { status: 403 }
      );
    }

    const existing = await (prisma as any).appointment.findFirst({
      where: {
        OR: [
          { proposerId: session.userId, receiverId },
          { proposerId: receiverId, receiverId: session.userId },
        ],
        status: { in: ["PENDING", "ACCEPTED"] },
        scheduledAt: {
          gte: new Date(scheduled.getTime() - 7 * 24 * 3600000), // within a week
          lte: new Date(scheduled.getTime() + 7 * 24 * 3600000),
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error:
            "Un rendez-vous est déjà en attente ou confirmé avec cette personne pour une période proche",
        },
        { status: 409 }
      );
    }

    const appointment = await (prisma as any).appointment.create({
      data: {
        proposerId: session.userId,
        receiverId,
        partnerId: partnerId || null,
        pack,
        scheduledAt: scheduled,
        status: "PENDING",
        note: note?.trim() || null,
        priceFcfa: PACK_PRICES[pack],
      },
      include: {
        partner: {
          select: { id: true, name: true, address: true },
        },
      },
    });

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/appointments]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
