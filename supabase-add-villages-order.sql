-- Add order column to villages table for reordering functionality
ALTER TABLE villages ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;

-- Set initial order based on name
UPDATE villages SET "order" = sub.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name) - 1 as row_num
  FROM villages
) sub
WHERE villages.id = sub.id;