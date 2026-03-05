-- ============================================
-- Romantic Website Database Schema
-- Tables: gallery_images, site_settings
-- ============================================

-- Gallery images table
CREATE TABLE IF NOT EXISTS gallery_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  public_id TEXT NOT NULL UNIQUE,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for ordering by creation date (public gallery query)
CREATE INDEX IF NOT EXISTS idx_gallery_images_created_at
  ON gallery_images (created_at DESC);

-- Site settings table (single-row pattern via CHECK constraint)
CREATE TABLE IF NOT EXISTS site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  sphere_color TEXT NOT NULL DEFAULT '#e8a87c',
  floating_text TEXT NOT NULL DEFAULT 'Only For U',
  target_name TEXT NOT NULL DEFAULT 'Pendek.',
  particle_count INTEGER NOT NULL DEFAULT 50,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Auto-update updated_at on site_settings changes
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_site_settings_updated_at ON site_settings;
CREATE TRIGGER trg_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Row Level Security
-- ============================================
-- Strategy:
--   • anon/authenticated roles can SELECT (public read)
--   • INSERT / UPDATE / DELETE require service_role
--     (service_role bypasses RLS by default, so we only
--      need the SELECT policies for anon)
-- ============================================

ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings  ENABLE ROW LEVEL SECURITY;

-- Public read-only access
DROP POLICY IF EXISTS "Public read gallery images" ON gallery_images;
CREATE POLICY "Public read gallery images"
  ON gallery_images FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public read site settings" ON site_settings;
CREATE POLICY "Public read site settings"
  ON site_settings FOR SELECT
  TO anon, authenticated
  USING (true);
