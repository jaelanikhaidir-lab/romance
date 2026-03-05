import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { deleteCloudinaryImage } from "@/lib/cloudinary";

/** DELETE /api/admin/images/[id] — remove an image from DB + Cloudinary */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return Response.json({ error: "Invalid image ID" }, { status: 400 });
  }

  // Fetch the image first to get the public_id for Cloudinary cleanup
  const supabaseAdmin = getSupabaseAdmin();
  const { data: image, error: fetchError } = await supabaseAdmin
    .from("gallery_images")
    .select("id, public_id")
    .eq("id", id)
    .single();

  if (fetchError || !image) {
    return Response.json({ error: "Image not found" }, { status: 404 });
  }

  // Delete from Cloudinary (best-effort — don't block DB deletion)
  await deleteCloudinaryImage(image.public_id).catch(() => {
    // Log but don't fail if Cloudinary removal fails
    console.warn(`Cloudinary delete failed for ${image.public_id}`);
  });

  // Delete from database
  const { error: deleteError } = await supabaseAdmin
    .from("gallery_images")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return Response.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }

  return Response.json({ ok: true });
}
