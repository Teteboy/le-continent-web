-- Run this in Supabase SQL Editor to fix slow loading issues
-- These indexes will dramatically speed up queries

-- Indexes for villages table
CREATE INDEX IF NOT EXISTS idx_villages_name ON villages(name);
CREATE INDEX IF NOT EXISTS idx_villages_region ON villages(region);

-- Indexes for lexique table  
CREATE INDEX IF NOT EXISTS idx_lexique_village_id ON lexique(village_id);
CREATE INDEX IF NOT EXISTS idx_lexique_french ON lexique(french);
CREATE INDEX IF NOT EXISTS idx_lexique_village_created ON lexique(village_id, created_at);

-- Indexes for histoires table
CREATE INDEX IF NOT EXISTS idx_histoires_village_id ON histoires(village_id);
CREATE INDEX IF NOT EXISTS idx_histoires_village_created ON histoires(village_id, created_at);

-- Indexes for proverbes table
CREATE INDEX IF NOT EXISTS idx_proverbes_village_id ON proverbes(village_id);
CREATE INDEX IF NOT EXISTS idx_proverbes_village_created ON proverbes(village_id, created_at);

-- Indexes for mets table
CREATE INDEX IF NOT EXISTS idx_mets_village_id ON mets(village_id);
CREATE INDEX IF NOT EXISTS idx_mets_village_created ON mets(village_id, created_at);

-- Indexes for phrases table
CREATE INDEX IF NOT EXISTS idx_phrases_village_id ON phrases(village_id);
CREATE INDEX IF NOT EXISTS idx_phrases_village_created ON phrases(village_id, created_at);

-- Indexes for alphabet table
CREATE INDEX IF NOT EXISTS idx_alphabet_village_id ON alphabet(village_id);
CREATE INDEX IF NOT EXISTS idx_alphabet_village_created ON alphabet(village_id, created_at);

-- Index for cultures_books table
CREATE INDEX IF NOT EXISTS idx_cultures_books_category ON cultures_books(category);

-- Index for profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_promo_code ON profiles(promo_code) WHERE promo_code IS NOT NULL;

-- Index for referrals table (correct column names)
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_created ON referrals(referrer_id, created_at);

-- Confirm indexes created
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public';
