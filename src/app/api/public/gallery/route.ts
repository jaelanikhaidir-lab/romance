import { getSupabase } from "@/lib/supabase";
import type { GalleryImageRow, SiteSettingsRow } from "@/lib/types";

function normalizeLegacySettings(
  settings: Partial<SiteSettingsRow>
): Partial<SiteSettingsRow> {
  if (
    settings.floating_text === "Only For U" &&
    settings.target_name === "My Love"
  ) {
    return { ...settings, target_name: "Pendek." };
  }
  return settings;
}

export async function GET() {
  const supabase = getSupabase();

  const [imagesRes, settingsRes] = await Promise.all([
    supabase
      .from("gallery_images")
      .select("id, url, public_id, width, height, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("site_settings").select("*").eq("id", 1).single(),
  ]);

  if (imagesRes.error) {
    return Response.json(
      { error: "Failed to fetch images" },
      { status: 500 }
    );
  }

  const images: GalleryImageRow[] = imagesRes.data ?? [];
  const settings: Partial<SiteSettingsRow> = normalizeLegacySettings(
    settingsRes.data ?? {}
  );

  return Response.json({ images, settings });
}
