import { slugifyClientName } from "@/lib/client-slug";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { clientCreateSchema } from "@/lib/validators";

const CLIENT_SELECT =
  "id, slug, name, sphere_color, floating_text, target_name, particle_count, music_url, created_at, updated_at";

/** GET /api/admin/clients — list all clients for admin management */
export async function GET() {
  const { data, error } = await getSupabaseAdmin()
    .from("clients")
    .select(CLIENT_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: "Failed to fetch clients" }, { status: 500 });
  }

  return Response.json({ clients: data ?? [] });
}

/** POST /api/admin/clients — create a new client with an auto-generated slug */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = clientCreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const name = parsed.data.name.trim();
  const desiredSlug = slugifyClientName(parsed.data.slug?.trim() || name);

  if (!desiredSlug) {
    return Response.json(
      { error: "Unable to generate a valid slug from the provided client name" },
      { status: 400 }
    );
  }

  for (let attempt = 0; attempt < 25; attempt += 1) {
    const slug = attempt === 0 ? desiredSlug : `${desiredSlug}-${attempt + 1}`;

    const { data, error } = await getSupabaseAdmin()
      .from("clients")
      .insert({
        name,
        slug,
        sphere_color: "#e8a87c",
        floating_text: "Only For U",
        target_name: "Pendek.",
        particle_count: 50,
        music_url: "/message-in-a-bottle-taylor-swift.mp3",
      })
      .select(CLIENT_SELECT)
      .single();

    if (!error && data) {
      return Response.json({ client: data }, { status: 201 });
    }

    if (error?.code === "23505") {
      continue;
    }

    return Response.json({ error: "Failed to create client" }, { status: 500 });
  }

  return Response.json(
    { error: "Unable to create a unique slug for this client" },
    { status: 409 }
  );
}