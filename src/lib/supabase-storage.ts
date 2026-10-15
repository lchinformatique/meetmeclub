// src/lib/supabase-storage.ts
// Direct Supabase Storage management for Meet Me Club
// Handles Avatar, Cover, and 8-Photo Album in 'profile-media' bucket

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ibfnvkelthganvmisqbn.supabase.co";

const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliZm52a2VsdGhnYW52bWlzcWJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTc1MjM4OSwiZXhwIjoyMTA3MzI4Mzg5fQ.fDWsssdgxrz9tRbxzrmR9dKZe8t9ygHAQxNjmlBCKcw";

export const BUCKET_NAME = "profile-media";

export interface UploadResult {
  path: string;
  url: string;
  publicId?: string;
}

/**
 * Uploads a file (Buffer or Base64 data URL) into Supabase Storage
 * Organizes paths cleanly: {userId}/{type}/{timestamp}_{filename}
 */
export async function uploadToSupabaseStorage(
  userId: string,
  type: "avatar" | "cover" | "gallery",
  fileOrBase64: Buffer | string,
  mimeType: string = "image/webp",
  originalFilename?: string
): Promise<UploadResult> {
  let buffer: Buffer;
  let finalMime = mimeType;

  if (typeof fileOrBase64 === "string") {
    // If it's a data:image/... base64 string
    const match = fileOrBase64.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      finalMime = match[1];
      buffer = Buffer.from(match[2], "base64");
    } else {
      buffer = Buffer.from(fileOrBase64, "base64");
    }
  } else {
    buffer = fileOrBase64;
  }

  // Determine file extension
  let ext = "webp";
  if (finalMime.includes("jpeg") || finalMime.includes("jpg")) ext = "jpg";
  else if (finalMime.includes("png")) ext = "png";
  else if (finalMime.includes("gif")) ext = "gif";

  const safeName = (originalFilename || `${type}_${Date.now()}`)
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_{2,}/g, "_");

  const storagePath = `${userId}/${type}/${Date.now()}_${safeName}.${ext}`;
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${storagePath}`;

  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": finalMime,
      "x-upsert": "true",
    },
    body: new Uint8Array(buffer),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("[uploadToSupabaseStorage] Error:", res.status, errorText);
    throw new Error(`Erreur upload Supabase Storage (${res.status}): ${errorText}`);
  }

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${storagePath}`;
  return {
    path: storagePath,
    url: publicUrl,
    publicId: storagePath,
  };
}

/**
 * Deletes a file from Supabase Storage
 */
export async function deleteFromSupabaseStorage(storagePath: string): Promise<boolean> {
  if (!storagePath) return false;
  try {
    const cleanPath = storagePath.includes(BUCKET_NAME)
      ? storagePath.split(`${BUCKET_NAME}/`)[1]
      : storagePath;

    const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${cleanPath}`;
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    });

    return res.ok;
  } catch (err) {
    console.warn("[deleteFromSupabaseStorage] Warning:", err);
    return false;
  }
}
