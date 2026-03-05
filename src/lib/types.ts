/** Row shape for the gallery_images table */
export interface GalleryImageRow {
  id: string;
  url: string;
  public_id: string;
  width: number | null;
  height: number | null;
  created_at: string;
}

/** Row shape for the site_settings table */
export interface SiteSettingsRow {
  id: number;
  sphere_color: string;
  floating_text: string;
  target_name: string;
  particle_count: number;
  updated_at: string;
}
