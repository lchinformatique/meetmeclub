// src/lib/cloudinary.ts
// Cloudinary helpers: signed upload, image optimization

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

export interface UploadResult {
  url: string;
  thumbnailUrl: string;
  publicId: string;
  width: number;
  height: number;
}

/**
 * Upload an image buffer or base64 to Cloudinary with automatic WebP conversion,
 * face detection, and moderation-ready folder structure.
 */
export async function uploadProfilePhoto(
  fileBuffer: Buffer,
  userId: string
): Promise<UploadResult> {
  if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_CLOUD_NAME) {
    // Development fallback when Cloudinary is not configured
    const b64 = fileBuffer.toString("base64");
    const dataUrl = `data:image/jpeg;base64,${b64}`;
    return {
      url: dataUrl,
      thumbnailUrl: dataUrl,
      publicId: `dev_${Date.now()}`,
      width: 400,
      height: 400,
    };
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: `meetmeclub/profiles/${userId}`,
          transformation: [
            { width: 800, height: 1000, crop: "limit" },
            { format: "webp", quality: "auto:good" },
          ],
          eager: [
            // Thumbnail for profile cards
            {
              width: 200,
              height: 200,
              crop: "fill",
              gravity: "face",
              format: "webp",
              quality: "auto",
            },
          ],
          resource_type: "image",
          allowed_formats: ["jpg", "jpeg", "png", "webp", "heic"],
          overwrite: false,
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error("Upload failed"));
            return;
          }
          resolve({
            url: result.secure_url,
            thumbnailUrl:
              result.eager?.[0]?.secure_url ||
              cloudinary.url(result.public_id, {
                width: 200,
                height: 200,
                crop: "fill",
                gravity: "face",
                format: "webp",
              }),
            publicId: result.public_id,
            width: result.width,
            height: result.height,
          });
        }
      )
      .end(fileBuffer);
  });
}

/**
 * Generic upload for verifications (selfies, documents)
 */
export async function uploadPhoto(
  fileData: string | Buffer,
  folder = "meetmeclub/verifications"
): Promise<{ secure_url: string; public_id: string }> {
  if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_CLOUD_NAME) {
    const url = typeof fileData === "string" ? fileData : `data:image/jpeg;base64,${fileData.toString("base64")}`;
    return {
      secure_url: url,
      public_id: `dev_verif_${Date.now()}`,
    };
  }

  if (typeof fileData === "string") {
    const res = await cloudinary.uploader.upload(fileData, {
      folder,
      resource_type: "image",
    });
    return { secure_url: res.secure_url, public_id: res.public_id };
  } else {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder, resource_type: "image" }, (err, res) => {
          if (err || !res) return reject(err || new Error("Upload failed"));
          resolve({ secure_url: res.secure_url, public_id: res.public_id });
        })
        .end(fileData);
    });
  }
}

/**
 * Delete a photo from Cloudinary
 */
export async function deletePhoto(publicId: string): Promise<void> {
  if (!process.env.CLOUDINARY_API_KEY || publicId.startsWith("dev_")) return;
  await cloudinary.uploader.destroy(publicId);
}

/**
 * Generate a signed upload URL for direct browser-to-Cloudinary uploads
 * (avoids routing large files through our server)
 */
export function generateSignedUploadParams(userId: string): {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
} {
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `meetmeclub/profiles/${userId}`;
  const params = { folder, timestamp };
  const signature = cloudinary.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET!
  );
  return {
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    folder,
  };
}
