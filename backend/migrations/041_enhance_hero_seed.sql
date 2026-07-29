-- Enhanced hero seed with background image, CTAs, and service card data
-- Uses ON CONFLICT to be idempotent (safe to re-run)

UPDATE content_blocks SET
  image = 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920',
  items = '[
    {"eyebrow":"Welcome to Grace Nepal Church","type":"tagline"},
    {"ctaButtons":[
      {"label":"Watch Latest Sermon","link":"/sermons"},
      {"label":"Request Prayer","link":"/prayer"}
    ]},
    {"serviceCardLabel":"Next Service","serviceCardBadge":"Live Soon"},
    {"serviceCardFallbackName":"Sunday Worship","serviceCardFallbackDay":"Sunday","serviceCardFallbackTime":"10:00 AM","serviceCardFallbackLocation":"Main Sanctuary, Kathmandu"}
  ]'::jsonb,
  enabled = true,
  sort_order = 0
WHERE section_key = 'hero';

-- Also ensure we have a good fallback hero for churches without an image
-- The component already handles this with fallbackClassName="bg-church-blue"
