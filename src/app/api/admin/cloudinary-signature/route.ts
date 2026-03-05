import { generateUploadSignature } from "@/lib/cloudinary";

/** POST /api/admin/cloudinary-signature — generate signed upload params */
export async function POST() {
  const params = generateUploadSignature();
  return Response.json(params);
}
