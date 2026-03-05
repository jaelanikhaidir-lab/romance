-- ============================================
-- Seed data for Romantic Website
-- Run after schema.sql
-- ============================================

-- Insert default site settings (single row)
INSERT INTO site_settings (id, sphere_color, floating_text, target_name, particle_count)
VALUES (1, '#e8a87c', 'Only For U', 'Pendek.', 50)
ON CONFLICT (id) DO UPDATE SET
  sphere_color = EXCLUDED.sphere_color,
  floating_text = EXCLUDED.floating_text,
  target_name = EXCLUDED.target_name,
  particle_count = EXCLUDED.particle_count;

-- Sample gallery images (placeholder URLs — replace with real Cloudinary URLs)
INSERT INTO gallery_images (url, public_id, width, height) VALUES
  ('https://res.cloudinary.com/demo/image/upload/v1/samples/landscapes/nature-mountains', 'samples/landscapes/nature-mountains', 1920, 1080),
  ('https://res.cloudinary.com/demo/image/upload/v1/samples/food/spices', 'samples/food/spices', 1920, 1280),
  ('https://res.cloudinary.com/demo/image/upload/v1/samples/landscapes/beach-boat', 'samples/landscapes/beach-boat', 1920, 1280)
ON CONFLICT (public_id) DO NOTHING;
