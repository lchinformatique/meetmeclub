// src/app/api/profiles/me/photos/route.ts
// POST /api/profiles/me/photos — upload photo (Cloudinary + fallback local base64)
// GET  /api/profiles/me/photos — liste des photos du profil courant

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getProfileByUserId, saveProfile } from "@/lib/db-store";

const MAX_PHOTOS = 8;

// ── GET: liste des photos ─────────────────────────────────────
export async function GET() {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // 1. Essayer Prisma d'abord
  try {
    const { prisma } = await import("@/lib/prisma");
    const profile = await prisma.profile.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });
    if (profile) {
      const photos = await prisma.profilePhoto.findMany({
        where: { profileId: profile.id },
        orderBy: { order: "asc" },
      });
      if (photos.length > 0) {
        return NextResponse.json({ photos });
      }
    }
  } catch {
    // Prisma non dispo → fallback local
  }

  // 2. Fallback store local
  const local = getProfileByUserId(session.userId);
  const photos = (local?.photos || []).map((p, i) => ({
    id: p.id,
    url: p.url,
    thumbnailUrl: p.url,
    isMain: p.isMain,
    order: i,
    status: "APPROVED",
  }));
  return NextResponse.json({ photos });
}

// ── POST: upload photo ────────────────────────────────────────
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // Récupérer le profil local pour limiter le nombre de photos
  const localProfile = getProfileByUserId(session.userId);
  const existingCount = localProfile?.photos?.length || 0;

  if (existingCount >= MAX_PHOTOS) {
    return NextResponse.json(
      { error: `Limite de ${MAX_PHOTOS} photos atteinte.` },
      { status: 400 }
    );
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    let base64Input = "";
    let buffer: Buffer | null = null;

    let isMainPhoto = true;
    if (contentType.includes("application/json")) {
      const body = await request.json();
      if (!body.base64) {
        return NextResponse.json(
          { error: "Aucun contenu d'image (base64) fourni." },
          { status: 400 }
        );
      }
      isMainPhoto = body.isMain !== undefined ? Boolean(body.isMain) : true;
      base64Input = body.base64;
      const base64Data = base64Input.replace(/^data:image\/\w+;base64,/, "");
      buffer = Buffer.from(base64Data, "base64");
    } else {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "Aucun fichier fourni." }, { status: 400 });
      }
      if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "Format non accepté. Seuls les images sont autorisées." },
          { status: 400 }
        );
      }
      if (file.size > 8 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Image trop lourde (max 8 Mo)." },
          { status: 400 }
        );
      }
      const isMainParam = formData.get("isMain");
      if (isMainParam !== null) {
        isMainPhoto = isMainParam === "true" || isMainParam === "1";
      }
      buffer = Buffer.from(await file.arrayBuffer());
      const b64 = buffer.toString("base64");
      base64Input = `data:${file.type};base64,${b64}`;
    }

    // ── 1. Tentative Cloudinary + Prisma ────────────────────────
    let finalUrl = base64Input;
    let finalThumbnail = base64Input;
    let photoId = `local_${Date.now()}`;

    try {
      const { uploadProfilePhoto } = await import("@/lib/cloudinary");
      if (!buffer) throw new Error("no buffer");
      const uploaded = await uploadProfilePhoto(buffer, session.userId);
      finalUrl = uploaded.url;
      finalThumbnail = uploaded.thumbnailUrl || uploaded.url;
    } catch (cloudErr) {
      console.warn("[photos POST] Cloudinary failed or skipped, using base64 URL:", cloudErr);
    }

    try {
      const { prisma } = await import("@/lib/prisma");
      // Assure que le profil Prisma existe
      let prismaProfile = await prisma.profile.findUnique({
        where: { userId: session.userId },
        include: { photos: true },
      });

      if (!prismaProfile) {
        const lp = localProfile;
        prismaProfile = await prisma.profile.create({
          data: {
            userId: session.userId,
            firstName: lp?.firstName || session.email?.split("@")[0] || "Membre",
            gender: (lp?.gender as any) || "OTHER",
            city: lp?.city || "Lomé",
            bio: lp?.bio || "Membre Meet Me Club.",
            relationshipGoal: (lp?.relationshipGoal as any) || "SERIOUS",
            isVisible: true,
            pseudo: lp?.pseudo || null,
          },
          include: { photos: true },
        });
      }

      // Si définie comme photo principale, démoter les anciennes photos
      if (isMainPhoto) {
        await prisma.profilePhoto.updateMany({
          where: { profileId: prismaProfile.id },
          data: { isMain: false },
        });
      }

      const dbPhoto = await prisma.profilePhoto.create({
        data: {
          profileId: prismaProfile.id,
          url: finalUrl,
          thumbnailUrl: finalThumbnail,
          publicId: photoId,
          isMain: isMainPhoto,
          order: prismaProfile.photos.length,
          status: "APPROVED",
        },
      });
      photoId = dbPhoto.id;
    } catch (prismaErr) {
      console.warn("[photos POST] Prisma save failed (using local store):", prismaErr);
    }

    // ── 2. Mise à jour immédiate du store local (toujours) ──────
    const updatedPhotos = [
      // Nouvelle photo avec le statut isMain demandé
      { id: photoId, url: finalUrl, isMain: isMainPhoto },
      // Les anciennes photos
      ...(localProfile?.photos || []).map((p) => ({
        ...p,
        isMain: isMainPhoto ? false : p.isMain,
      })),
    ];

    saveProfile({
      userId: session.userId,
      photos: updatedPhotos,
    });

    return NextResponse.json(
      {
        photo: {
          id: photoId,
          url: finalUrl,
          thumbnailUrl: finalThumbnail,
          isMain: isMainPhoto,
          order: existingCount,
          status: "APPROVED",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[photos POST]", error);
    return NextResponse.json(
      { error: "Erreur lors de l'upload de la photo." },
      { status: 500 }
    );
  }
}
