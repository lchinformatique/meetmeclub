// src/app/api/profiles/me/photos/route.ts
// POST /api/profiles/me/photos — upload a photo to Cloudinary
// GET  /api/profiles/me/photos — list photos

import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { uploadProfilePhoto } from "@/lib/cloudinary";

const MAX_PHOTOS = 8;

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Non authentifié" }, { status: 401 });

  const profile = await prisma.profile.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });
  if (!profile) return Response.json({ error: "Profil introuvable" }, { status: 404 });

  const photos = await prisma.profilePhoto.findMany({
    where: { profileId: profile.id },
    orderBy: { order: "asc" },
  });

  return Response.json({ photos });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Non authentifié" }, { status: 401 });

  const profile = await prisma.profile.findUnique({
    where: { userId: session.userId },
    include: { photos: true },
  });
  if (!profile) {
    return Response.json({ error: "Complétez d'abord votre profil." }, { status: 400 });
  }
  if (profile.photos.length >= MAX_PHOTOS) {
    return Response.json({ error: `Limite de ${MAX_PHOTOS} photos atteinte.` }, { status: 400 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    let buffer: Buffer;

    if (contentType.includes("application/json")) {
      const body = await request.json();
      if (!body.base64) {
        return Response.json({ error: "Aucun contenu d'image (base64) fourni." }, { status: 400 });
      }
      const base64Data = body.base64.replace(/^data:image\/\w+;base64,/, "");
      buffer = Buffer.from(base64Data, "base64");
    } else {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) return Response.json({ error: "Aucun fichier fourni." }, { status: 400 });

      const allowedTypes = ["image/jpeg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        return Response.json({
          error: "Format non accepté. Seuls les formats JPEG (.jpg, .jpeg) et PNG (.png) sont autorisés.",
        }, { status: 400 });
      }
      if (file.size > 5 * 1024 * 1024) {
        return Response.json({
          error: "Taille d'image excessive. Chaque image doit peser moins de 5 Mo.",
        }, { status: 400 });
      }

      buffer = Buffer.from(await file.arrayBuffer());
    }

    const result = await uploadProfilePhoto(buffer, session.userId);

    const isFirst = profile.photos.length === 0;
    const photo = await prisma.profilePhoto.create({
      data: {
        profileId: profile.id,
        url: result.url,
        thumbnailUrl: result.thumbnailUrl,
        publicId: result.publicId,
        isMain: isFirst,
        order: profile.photos.length,
        status: "PENDING",
      },
    });

    await prisma.auditLog.create({
      data: { userId: session.userId, action: "PHOTO_UPLOADED", entity: "profile_photos", entityId: photo.id },
    });

    // Mettre a jour aussi le profil local immediatement
    try {
      const { getProfileByUserId, saveProfile } = await import("@/lib/db-store");
      const local = getProfileByUserId(session.userId);
      if (local) {
        const updatedPhotos = [...(local.photos || []), { id: photo.id, url: result.url, isMain: isFirst }];
        saveProfile({ ...local, photos: updatedPhotos });
      }
    } catch {}

    return Response.json({ photo }, { status: 201 });
  } catch (error) {
    console.error("[photos POST]", error);
    return Response.json({ error: "Erreur lors de l'upload." }, { status: 500 });
  }
}
