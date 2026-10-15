// src/app/api/profiles/me/photos/[id]/route.ts
// DELETE /api/profiles/me/photos/[id]
// PATCH  /api/profiles/me/photos/[id] — set as main photo or reorder
// Resilient persistence across db-store, Supabase REST and Prisma

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getProfileByUserId, saveProfile } from "@/lib/db-store";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // 1. Mise à jour db-store locale
  let photoDeletedUrl: string | null = null;
  const localProfile = getProfileByUserId(session.userId);
  if (localProfile?.photos) {
    const target = localProfile.photos.find((p) => p.id === id);
    if (target) photoDeletedUrl = target.url;

    const remaining = localProfile.photos.filter((p) => p.id !== id);
    if (target?.isMain && remaining.length > 0) {
      remaining[0].isMain = true;
    }
    saveProfile({
      userId: session.userId,
      photos: remaining,
    });
  }

  // 2. Suppression dans Supabase REST
  try {
    const { deletePhotoInSupabase } = await import("@/lib/supabase-server");
    await deletePhotoInSupabase(session.userId, id);
    if (photoDeletedUrl) {
      await deletePhotoInSupabase(session.userId, photoDeletedUrl);
    }
  } catch (supaErr) {
    console.warn("[photo DELETE] Supabase delete warning:", supaErr);
  }

  // 3. Suppression Prisma & Cloudinary (best-effort)
  try {
    const { prisma } = await import("@/lib/prisma");
    const profile = await prisma.profile.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });
    if (profile) {
      const photo = await prisma.profilePhoto.findFirst({
        where: { id, profileId: profile.id },
      });
      if (photo) {
        try {
          const { deletePhoto } = await import("@/lib/cloudinary");
          await deletePhoto(photo.publicId);
        } catch {}
        await prisma.profilePhoto.delete({ where: { id: photo.id } });
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
      }
    }
  } catch (prismaErr) {
    console.warn("[photo DELETE] Prisma delete warning:", prismaErr);
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await req.json();

  // 1. Mise à jour immédiate du store local
  let targetPhotoUrl: string | null = null;
  const localProfile = getProfileByUserId(session.userId);
  if (localProfile?.photos) {
    if (body.isMain === true) {
      const updatedPhotos = localProfile.photos.map((p) => {
        const isTarget = p.id === id;
        if (isTarget) targetPhotoUrl = p.url;
        return {
          ...p,
          isMain: isTarget,
        };
      });
      saveProfile({
        userId: session.userId,
        photos: updatedPhotos,
      });
    }
  }

  // 2. Synchronisation Supabase REST
  if (body.isMain === true) {
    try {
      const { setMainPhotoInSupabase } = await import("@/lib/supabase-server");
      await setMainPhotoInSupabase(session.userId, id);
      if (targetPhotoUrl) {
        await setMainPhotoInSupabase(session.userId, targetPhotoUrl);
      }
    } catch (supaErr) {
      console.warn("[PATCH photo] Supabase setMainPhoto warning:", supaErr);
    }
  }

  // 3. Prisma (best effort)
  try {
    const { prisma } = await import("@/lib/prisma");
    const profile = await prisma.profile.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });
    if (profile) {
      if (body.isMain === true) {
        await prisma.profilePhoto.updateMany({
          where: { profileId: profile.id },
          data: { isMain: false },
        });
        await prisma.profilePhoto.updateMany({
          where: {
            profileId: profile.id,
            OR: [{ id }, ...(targetPhotoUrl ? [{ url: targetPhotoUrl }] : [])],
          },
          data: { isMain: true },
        });
      }
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
    }
  } catch (err) {
    console.warn("[PATCH photo] Prisma update warning:", err);
  }

  return NextResponse.json({ success: true });
}
