-- Clean up duplicate entries in medicine_traditionnel table

-- First, check for duplicates
SELECT category, title, COUNT(*) as count
FROM medicine_traditionnel
GROUP BY category, title
HAVING COUNT(*) > 1;

-- Delete duplicates - keep only the first occurrence using a different approach
DELETE FROM medicine_traditionnel
WHERE EXISTS (
  SELECT 1 FROM medicine_traditionnel t2
  WHERE medicine_traditionnel.category = t2.category
  AND medicine_traditionnel.title = t2.title
  AND medicine_traditionnel.created_at > t2.created_at
);

-- Verify the cleanup
SELECT category, COUNT(*) as total_remedies
FROM medicine_traditionnel
GROUP BY category
ORDER BY category;
