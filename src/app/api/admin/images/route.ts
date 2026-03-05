import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { imagePayloadSchema } from "@/lib/validators";

/** GET /api/admin/images — list all gallery images (admin view) */
export async function GET() {
  const { data, error } = await getSupabaseAdmin()
    .from("gallery_images")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json(
      { error: "Failed to fetch images" },
      { status: 500 }
    );
  }

  return Response.json({ images: data });
}

/** POST /api/admin/images — add a new gallery image after Cloudinary upload */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = imagePayloadSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { url, public_id, width, height } = parsed.data;

  const { data, error } = await getSupabaseAdmin()
    .from("gallery_images")
    .insert({ url, public_id, width: width ?? null, height: height ?? null })
    .select()
    .single();

  if (error) {
    // Handle unique constraint violation on public_id
    if (error.code === "23505") {
      return Response.json(
        { error: "Image with this public_id already exists" },
        { status: 409 }
      );
    }
    return Response.json(
      { error: "Failed to save image" },
      { status: 500 }
    );
  }

  return Response.json({ image: data }, { status: 201 });
}
