-- Seed default theme preset settings so the site works without manual configuration.
-- Uses ON CONFLICT DO NOTHING to be idempotent (safe to re-run).

INSERT INTO settings (key, value) VALUES
  ('theme_preset', 'classic-church'),
  ('theme_primary', '#0b3c5d'),
  ('theme_heading_font', '''Playfair Display'', serif'),
  ('theme_body_font', '''Inter'', sans-serif'),
  ('theme_skin', 'default'),
  ('theme_default_mode', 'system'),
  ('homepage_layout', 'default')
ON CONFLICT (key) DO NOTHING;
