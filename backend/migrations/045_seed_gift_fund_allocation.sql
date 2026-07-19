-- ============================================================================
-- Allocate the seeded demo gifts (from 038_rich_seed_data.sql) across the
-- seeded funds (from 030_all_remaining_features.sql) so that giving-by-fund
-- reports, the giving dashboard, and fund detail pages are demoable.
--
-- Funds carry random UUIDs, so we resolve them by NAME. We only touch the
-- known demo gifts (transaction_id LIKE 'TXN-2026-%') that still have a NULL
-- fund_id, which keeps this migration idempotent and safe for real gifts.
-- ============================================================================

-- Tithe fund: every explicit "Monthly tithe" gift.
UPDATE donations
SET fund_id = (SELECT id FROM funds WHERE name = 'Tithe' LIMIT 1)
WHERE fund_id IS NULL
  AND transaction_id LIKE 'TXN-2026-%'
  AND notes = 'Monthly tithe';

-- Missions fund: a recurring set of givers (spread across months).
UPDATE donations
SET fund_id = (SELECT id FROM funds WHERE name = 'Missions' LIMIT 1)
WHERE fund_id IS NULL
  AND transaction_id IN (
    'TXN-2026-0006','TXN-2026-0017','TXN-2026-0031','TXN-2026-0047','TXN-2026-0059'
  );

-- Building fund: a handful of larger designated gifts.
UPDATE donations
SET fund_id = (SELECT id FROM funds WHERE name = 'Building Fund' LIMIT 1)
WHERE fund_id IS NULL
  AND transaction_id IN (
    'TXN-2026-0011','TXN-2026-0025','TXN-2026-0040','TXN-2026-0050'
  );

-- Benevolence fund: a few compassion-oriented gifts.
UPDATE donations
SET fund_id = (SELECT id FROM funds WHERE name = 'Benevolence' LIMIT 1)
WHERE fund_id IS NULL
  AND transaction_id IN (
    'TXN-2026-0010','TXN-2026-0027','TXN-2026-0044'
  );

-- Scholarship fund: student-support gifts.
UPDATE donations
SET fund_id = (SELECT id FROM funds WHERE name = 'Scholarship Fund' LIMIT 1)
WHERE fund_id IS NULL
  AND transaction_id IN (
    'TXN-2026-0019','TXN-2026-0034','TXN-2026-0053'
  );

-- Everything else in the demo set defaults to the General Fund.
UPDATE donations
SET fund_id = (SELECT id FROM funds WHERE name = 'General Fund' LIMIT 1)
WHERE fund_id IS NULL
  AND transaction_id LIKE 'TXN-2026-%';
