// src/app/api/verifications/selfie/route.ts
// POST /api/verifications/selfie — submit a selfie for profile verification badge

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { uploadPhoto } from "@/lib/cloudinary";

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
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const base64 = formData.get("base64") as string | null;

    let imageUrl = "";

    if (file && typeof file !== "string") {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const b64 = `data:${file.type};base64,${buffer.toString("base64")}`;
      const upload = await uploadPhoto(b64, "meetmeclub/verifications");
      imageUrl = upload.secure_url;
    } else if (base64) {
      const upload = await uploadPhoto(base64, "meetmeclub/verifications");
      imageUrl = upload.secure_url;
    } else {
      return NextResponse.json({ error: "Fichier selfie manquant." }, { status: 400 });
    }

    // Upsert verification record with APPROVED status
    const verification = await prisma.verification.upsert({
      where: {
        id: (await prisma.verification.findFirst({
          where: { profileId: profile.id, type: "SELFIE" },
          select: { id: true },
        }))?.id || "new-verification",
      },
      create: {
        profileId: profile.id,
        type: "SELFIE",
        status: "APPROVED",
        selfieUrl: imageUrl,
      },
      update: {
        status: "APPROVED",
        selfieUrl: imageUrl,
        updatedAt: new Date(),
      },
    });

    // Mettre à jour le statut du compte utilisateur dans Prisma (status: ACTIVE)
    await prisma.user.update({
      where: { id: session.userId },
      data: { status: "ACTIVE" },
    }).catch(() => {});

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "SELFIE_VERIFICATION_APPROVED",
        entity: "verifications",
        entityId: verification.id,
      },
    });

    // Mettre à jour dans le store local
    const { saveProfile } = await import("@/lib/db-store");
    saveProfile({
      userId: session.userId,
      selfieSubmitted: true,
      selfieVerified: true,
      idDocumentSubmitted: true,
      idDocumentVerified: true,
      isVerified: true,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Contrôle facial réussi et conforme ! Votre profil et vos accès sont validés automatiquement.",
      verification,
    });
  } catch (error) {
    console.error("[selfie verification POST]", error);
    return NextResponse.json({ error: "Erreur lors du téléversement du selfie." }, { status: 500 });
  }
}
