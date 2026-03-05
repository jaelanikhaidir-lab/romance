import crypto from "crypto";

// ── Public (safe to expose to browser) ──────────────────────
export const CLOUDINARY_CLOUD_NAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
export const CLOUDINARY_UPLOAD_FOLDER =
  process.env.CLOUDINARY_UPLOAD_FOLDER || "romantic-gallery";

// ── Server-only secrets ─────────────────────────────────────
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY!;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET!;

/**
 * Generate a signed upload parameter set for the Cloudinary
 * Upload Widget / direct POST from the browser.
 *
 * The browser sends these params + the file to
 * https://api.cloudinary.com/v1_1/<cloud>/image/upload
 */
export function generateUploadSignature() {
  const timestamp = Math.round(Date.now() / 1000);

  const paramsToSign: Record<string, string | number> = {
    folder: CLOUDINARY_UPLOAD_FOLDER,
    timestamp,
  };

  // Cloudinary expects alphabetically sorted key=value pairs
  const sortedParams = Object.keys(paramsToSign)
    .sort()
    .map((key) => `${key}=${paramsToSign[key]}`)
    .join("&");

  const signature = crypto
    .createHash("sha1")
    .update(sortedParams + CLOUDINARY_API_SECRET)
    .digest("hex");

  return {
    signature,
    timestamp,
    api_key: CLOUDINARY_API_KEY,
    folder: CLOUDINARY_UPLOAD_FOLDER,
    cloud_name: CLOUDINARY_CLOUD_NAME,
  };
}

/**
 * Delete an image from Cloudinary by its public_id.
 * Called server-side when an admin removes a gallery image.
 */
export async function deleteCloudinaryImage(publicId: string): Promise<boolean> {
  const timestamp = Math.round(Date.now() / 1000);

  const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}`;
  const signature = crypto
    .createHash("sha1")
    .update(paramsToSign + CLOUDINARY_API_SECRET)
    .digest("hex");

  const form = new URLSearchParams({
    public_id: publicId,
    timestamp: String(timestamp),
    api_key: CLOUDINARY_API_KEY,
    signature,
  });

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
    { method: "POST", body: form }
  );

  if (!res.ok) return false;
  const data = await res.json();
  return data.result === "ok";
}
