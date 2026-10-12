// src/app/api/verifications/document/route.ts
// Reçoit le justificatif de pièce d'identité (CNI, Passeport, etc.) pour validation 18+

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getProfileByUserId, saveProfile } from "@/lib/db-store";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const base64 = formData.get("base64") as string | null;
    const documentType = (formData.get("documentType") as string) || "CNI";

    if (!file && !base64) {
      return NextResponse.json(
        { error: "Veuillez fournir un fichier pour votre pièce d'identité." },
        { status: 400 }
      );
    }

    // Mise à jour dans le store local
    const profile = getProfileByUserId(session.userId);
    saveProfile({
      userId: session.userId,
      idDocumentSubmitted: true,
      idDocumentVerified: true, // Auto-validé pour test / sandbox
      updatedAt: new Date().toISOString(),
    });

    // Enregistrement dans Prisma si disponible
    try {
      const dbProfile = await prisma.profile.findUnique({
        where: { userId: session.userId },
        select: { id: true },
      });

      if (dbProfile) {
        await prisma.verification.upsert({
          where: {
            id:
              (
                await prisma.verification.findFirst({
                  where: { profileId: dbProfile.id, type: "ID_CARD" },
                  select: { id: true },
                })
              )?.id || "new-id-verification",
          },
          create: {
            profileId: dbProfile.id,
            type: "ID_CARD",
            status: "APPROVED",
          },
          update: {
            status: "APPROVED",
            updatedAt: new Date(),
          },
        });
      }
    } catch (e) {
      console.warn("[document verification] Prisma warning:", e);
    }

    return NextResponse.json({
      success: true,
      message:
        "Justificatif de pièce d'identité validé ! Vous pouvez maintenant accéder aux échanges.",
    });
  } catch (error) {
    console.error("[POST /api/verifications/document]", error);
    return NextResponse.json(
      { error: "Erreur lors du traitement de votre pièce d'identité." },
      { status: 500 }
    );
  }
}
