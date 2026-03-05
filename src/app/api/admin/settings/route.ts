import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { settingsSchema } from "@/lib/validators";
import type { SiteSettingsRow } from "@/lib/types";

function normalizeLegacySettings(settings: SiteSettingsRow): SiteSettingsRow {
  if (
    settings.floating_text === "Only For U" &&
    settings.target_name === "My Love"
  ) {
    return { ...settings, target_name: "Pendek." };
  }
  return settings;
}

/** GET /api/admin/settings — fetch current site settings */
export async function GET() {
  const { data, error } = await getSupabaseAdmin()
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) {
    return Response.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }

  return Response.json({ settings: normalizeLegacySettings(data) });
}

/** PUT /api/admin/settings — update site settings (upsert single row) */
export async function PUT(request: Request) {
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

  const { sphere_color, floating_text, target_name, particle_count } =
    parsed.data;

  const { data, error } = await getSupabaseAdmin()
    .from("site_settings")
    .upsert(
      { id: 1, sphere_color, floating_text, target_name, particle_count },
      { onConflict: "id" }
    )
    .select()
    .single();

  if (error) {
    return Response.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }

  return Response.json({ settings: data });
}
