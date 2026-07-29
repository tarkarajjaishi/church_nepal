-- Clean up duplicate service_times rows (seed ran multiple times)
-- Keep only one row (smallest id, compared as text since uuid has no MIN
-- aggregate) for each unique (name, day, time) combo.

DELETE FROM service_times
WHERE id::text NOT IN (
  SELECT MIN(id::text)
  FROM service_times
  GROUP BY name, day, time
);
