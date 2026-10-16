// src/app/api/profiles/me/photos/route.ts
// POST /api/profiles/me/photos — upload photo (Cloudinary + fallback local base64)
// GET  /api/profiles/me/photos — liste des photos du profil courant

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getProfileByUserId, saveProfile } from "@/lib/db-store";

const MAX_PHOTOS = 4;

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

  // 2. Supabase REST (source de vérité, commune à tous les serveurs)
  let photos: Array<{ id: string; url: string; thumbnailUrl: string; isMain: boolean; order: number; status: string }> = [];
  {
    try {
      const { getProfileFromSupabase } = await import("@/lib/supabase-server");
      const supa = await getProfileFromSupabase(session.userId);
      if (supa?.photos && supa.photos.length > 0) {
        photos = supa.photos.map((p: any, i: number) => ({
          id: p.id || `supa_${i}`,
          url: p.url,
          thumbnailUrl: p.url,
          isMain: p.isMain,
          order: i,
          status: "APPROVED",
        }));
        saveProfile({
          userId: session.userId,
          photos: photos.map((p) => ({ id: p.id, url: p.url, isMain: p.isMain })),
        });
      }
    } catch (e) {
      console.warn("Supabase photos fallback warning:", e);
    }
  }

  // 3. Dernier recours : store local de ce serveur
  if (photos.length === 0) {
    const local = getProfileByUserId(session.userId);
    photos = (local?.photos || []).map((p, i) => ({
      id: p.id,
      url: p.url,
      thumbnailUrl: p.url,
      isMain: p.isMain,
      order: i,
      status: "APPROVED",
    }));
  }

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
  let existingCount = localProfile?.photos?.length || 0;
  // Le store local de ce serveur peut être vide : Supabase fait foi
  try {
    const { getProfileFromSupabase } = await import("@/lib/supabase-server");
    const supa = await getProfileFromSupabase(session.userId, session.email || undefined);
    if (supa?.photos) existingCount = Math.max(existingCount, supa.photos.length);
  } catch {}

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

    // ── 1. Upload vers Supabase Storage bucket 'profile-media' ──────────
    let finalUrl = base64Input;
    let finalThumbnail = base64Input;
    let photoId = `ph_${Date.now()}`;

    if (buffer) {
      try {
        const { uploadToSupabaseStorage } = await import("@/lib/supabase-storage");
        const uploadRes = await uploadToSupabaseStorage(
          session.userId,
          isMainPhoto ? "avatar" : "gallery",
          buffer,
          "image/webp",
          `photo_${Date.now()}`
        );
        finalUrl = uploadRes.url;
        finalThumbnail = uploadRes.url;
        photoId = uploadRes.path;
      } catch (storageErr) {
        console.warn("[photos POST] Supabase Storage upload failed, trying Cloudinary fallback:", storageErr);
        try {
          const { uploadProfilePhoto } = await import("@/lib/cloudinary");
          const uploaded = await uploadProfilePhoto(buffer, session.userId);
          finalUrl = uploaded.url;
          finalThumbnail = uploaded.thumbnailUrl || uploaded.url;
        } catch {}
      }
    }

    // ── 1.b Synchronisation directe Supabase Database (profile_photos) ──
    try {
      const { savePhotoInSupabase } = await import("@/lib/supabase-server");
      const saved = await savePhotoInSupabase(session.userId, finalUrl, isMainPhoto, existingCount + 1);
      if (saved?.id) photoId = saved.id;
    } catch (supaErr) {
      console.warn("[photos POST] Supabase REST save warning:", supaErr);
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
