// src/app/api/profiles/me/photos/[id]/route.ts
// DELETE /api/profiles/me/photos/[id]
// PATCH  /api/profiles/me/photos/[id] — set as main photo or reorder

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { deletePhoto } from "@/lib/cloudinary";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
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

  const photo = await prisma.profilePhoto.findFirst({
    where: { id, profileId: profile.id },
  });
  if (!photo) {
    return NextResponse.json({ error: "Photo introuvable" }, { status: 404 });
  }

  // Delete from Cloudinary
  try {
    await deletePhoto(photo.publicId);
  } catch (err) {
    console.warn("[photo DELETE] Cloudinary error:", err);
    // Continue even if Cloudinary deletion fails
  }

  await prisma.profilePhoto.delete({ where: { id: photo.id } });

  // If deleted photo was main, promote the next one
  if (photo.isMain) {
    const next = await prisma.profilePhoto.findFirst({
      where: { profileId: profile.id },
      orderBy: { order: "asc" },
    });
    if (next) {
      await prisma.profilePhoto.update({
        where: { id: next.id },
        data: { isMain: true },
      });
    }
  }

  try {
    const { getProfileByUserId, saveProfile } = await import("@/lib/db-store");
    const current = getProfileByUserId(session.userId);
    if (current && current.photos) {
      const remaining = current.photos.filter((p: any) => p.id !== id);
      saveProfile({ userId: session.userId, photos: remaining });
    }
  } catch {}

  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      action: "PHOTO_DELETED",
      entity: "profile_photos",
      entityId: photo.id,
    },
  });

  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
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

  const photo = await prisma.profilePhoto.findFirst({
    where: { id, profileId: profile.id },
  });
  if (!photo) {
    return NextResponse.json({ error: "Photo introuvable" }, { status: 404 });
  }

  const body = await req.json();

  // Set as main photo
  if (body.isMain === true) {
    await prisma.profilePhoto.updateMany({
      where: { profileId: profile.id },
      data: { isMain: false },
    });
    await prisma.profilePhoto.update({
      where: { id: photo.id },
      data: { isMain: true },
    });
  }

  // Reorder photos
  if (Array.isArray(body.order)) {
    await Promise.all(
      (body.order as Array<{ id: string; order: number }>).map((item) =>
        prisma.profilePhoto.updateMany({
          where: { id: item.id, profileId: profile.id },
          data: { order: item.order },
        })
      )
    );
  }

  return NextResponse.json({ success: true });
}
