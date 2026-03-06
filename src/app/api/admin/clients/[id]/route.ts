import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { clientIdSchema, settingsSchema } from "@/lib/validators";

const CLIENT_SELECT =
  "id, slug, name, sphere_color, floating_text, target_name, particle_count, music_url, created_at, updated_at";

/** PUT /api/admin/clients/[id] — update client-specific visual/audio settings */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const parsedClientId = clientIdSchema.safeParse(id);

  if (!parsedClientId.success) {
    return Response.json({ error: "Invalid client ID" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const payload = {
    sphere_color: parsed.data.sphere_color,
    floating_text: parsed.data.floating_text,
    target_name: parsed.data.target_name,
    particle_count: parsed.data.particle_count,
    music_url: parsed.data.music_url?.trim() ? parsed.data.music_url.trim() : null,
  };

  const { data, error } = await getSupabaseAdmin()
    .from("clients")
    .update(payload)
    .eq("id", parsedClientId.data)
    .select(CLIENT_SELECT)
    .single();

  if (error || !data) {
    return Response.json({ error: "Failed to update client settings" }, { status: 500 });
  }

  return Response.json({ client: data });
}