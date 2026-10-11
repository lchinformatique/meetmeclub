// src/app/api/profiles/me/availabilities/route.ts
// GET  /api/profiles/me/availabilities — get weekly availabilities
// POST /api/profiles/me/availabilities — replace weekly availabilities

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const AvailabilitiesSchema = z.object({
  availabilities: z.array(
    z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      startTime: z.string().default("09:00"),
      endTime: z.string().default("18:00"),
    })
  ),
});

export async function GET() {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }

  const items = await prisma.availability.findMany({
    where: { profileId: profile.id },
    orderBy: { dayOfWeek: "asc" },
  });

  return NextResponse.json({ availabilities: items });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const parsed = AvailabilitiesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Données invalides" }, { status: 400 });
    }

    // Replace all availabilities transactionally
    await prisma.$transaction([
      prisma.availability.deleteMany({
        where: { profileId: profile.id },
      }),
      prisma.availability.createMany({
        data: parsed.data.availabilities.map((a) => ({
          profileId: profile.id,
          dayOfWeek: a.dayOfWeek,
          startTime: a.startTime,
          endTime: a.endTime,
        })),
      }),
    ]);

    const updated = await prisma.availability.findMany({
      where: { profileId: profile.id },
      orderBy: { dayOfWeek: "asc" },
    });

    return NextResponse.json({ availabilities: updated });
  } catch (error) {
    console.error("[availabilities POST]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
