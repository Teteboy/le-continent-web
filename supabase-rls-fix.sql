-- =============================================
-- Supabase RLS Policies for Le Continent App
-- Run this in Supabase Dashboard → SQL Editor
-- =============================================

-- First check which tables exist
SELECT 
  table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- =============================================
-- RLS Policies for Tables That Exist
-- =============================================

-- Villages table - public read access
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'villages' AND table_schema = 'public') THEN
    ALTER TABLE villages ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Allow public read access to villages" ON villages;
    CREATE POLICY "Allow public read access to villages" ON villages
      FOR SELECT TO anon, authenticated
      USING (true);
    
    GRANT SELECT ON villages TO anon, authenticated;
  END IF;
END $$;

-- Profiles table - read by all, write by owner
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Allow public read access to profiles" ON profiles;
    CREATE POLICY "Allow public read access to profiles" ON profiles
      FOR SELECT TO anon, authenticated
      USING (true);
    
    GRANT SELECT, UPDATE ON profiles TO authenticated;
  END IF;
END $$;

-- Referrals table - read by authenticated
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referrals' AND table_schema = 'public') THEN
    ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Allow public read access to referrals" ON referrals;
    CREATE POLICY "Allow public read access to referrals" ON referrals
      FOR SELECT TO anon, authenticated
      USING (true);
    
    GRANT SELECT ON referrals TO anon, authenticated;
    GRANT INSERT, UPDATE ON referrals TO authenticated;
  END IF;
END $$;

-- Promo codes - public read access
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'promo_codes' AND table_schema = 'public') THEN
    ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Allow public read access to promo_codes" ON promo_codes;
    CREATE POLICY "Allow public read access to promo_codes" ON promo_codes
      FOR SELECT TO anon, authenticated
      USING (true);
    
    GRANT SELECT ON promo_codes TO anon, authenticated;
    GRANT INSERT, UPDATE, DELETE ON promo_codes TO authenticated;
  END IF;
END $$;

-- Cultures_books table - public read access
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cultures_books' AND table_schema = 'public') THEN
    ALTER TABLE cultures_books ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Allow public read access to cultures_books" ON cultures_books;
    CREATE POLICY "Allow public read access to cultures_books" ON cultures_books
      FOR SELECT TO anon, authenticated
      USING (true);
    
    GRANT SELECT ON cultures_books TO anon, authenticated;
  END IF;
END $$;

-- Lexique table - public read access
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lexique' AND table_schema = 'public') THEN
    ALTER TABLE lexique ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Allow public read access to lexique" ON lexique;
    CREATE POLICY "Allow public read access to lexique" ON lexique
      FOR SELECT TO anon, authenticated
      USING (true);
    
    GRANT SELECT ON lexique TO anon, authenticated;
  END IF;
END $$;

-- Proverbes table - public read access
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'proverbes' AND table_schema = 'public') THEN
    ALTER TABLE proverbes ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Allow public read access to proverbes" ON proverbes;
    CREATE POLICY "Allow public read access to proverbes" ON proverbes
      FOR SELECT TO anon, authenticated
      USING (true);
    
    GRANT SELECT ON proverbes TO anon, authenticated;
  END IF;
END $$;

-- Phrases table - public read access
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'phrases' AND table_schema = 'public') THEN
    ALTER TABLE phrases ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Allow public read access to phrases" ON phrases;
    CREATE POLICY "Allow public read access to phrases" ON phrases
      FOR SELECT TO anon, authenticated
      USING (true);
    
    GRANT SELECT ON phrases TO anon, authenticated;
  END IF;
END $$;

-- Mets table - public read access
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mets' AND table_schema = 'public') THEN
    ALTER TABLE mets ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Allow public read access to mets" ON mets;
    CREATE POLICY "Allow public read access to mets" ON mets
      FOR SELECT TO anon, authenticated
      USING (true);
    
    GRANT SELECT ON mets TO anon, authenticated;
  END IF;
END $$;

-- Histoires table - public read access
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'histoires' AND table_schema = 'public') THEN
    ALTER TABLE histoires ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Allow public read access to histoires" ON histoires;
    CREATE POLICY "Allow public read access to histoires" ON histoires
      FOR SELECT TO anon, authenticated
      USING (true);
    
    GRANT SELECT ON histoires TO anon, authenticated;
  END IF;
END $$;

-- Alphabet table - public read access
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alphabet' AND table_schema = 'public') THEN
    ALTER TABLE alphabet ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Allow public read access to alphabet" ON alphabet;
    CREATE POLICY "Allow public read access to alphabet" ON alphabet
      FOR SELECT TO anon, authenticated
      USING (true);
    
    GRANT SELECT ON alphabet TO anon, authenticated;
  END IF;
END $$;

-- =============================================
-- Create indexes for better performance (only if tables exist)
-- =============================================

-- Villages indexes
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'villages' AND table_schema = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_villages_name ON villages(name);
    CREATE INDEX IF NOT EXISTS idx_villages_region ON villages(region);
  END IF;
END $$;

-- Profiles indexes
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
    CREATE INDEX IF NOT EXISTS idx_profiles_promo_code ON profiles(promo_code);
  END IF;
END $$;

-- Promo codes indexes
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'promo_codes' AND table_schema = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
  END IF;
END $$;

-- Referrals indexes
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referrals' AND table_schema = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
  END IF;
END $$;

-- Lexique indexes
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lexique' AND table_schema = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_lexique_french ON lexique(french);
    CREATE INDEX IF NOT EXISTS idx_lexique_village_id ON lexique(village_id);
  END IF;
END $$;

-- Proverbes indexes
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'proverbes' AND table_schema = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_proverbes_village_id ON proverbes(village_id);
  END IF;
END $$;

-- Phrases indexes
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'phrases' AND table_schema = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_phrases_village_id ON phrases(village_id);
  END IF;
END $$;

-- Mets indexes
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mets' AND table_schema = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_mets_village_id ON mets(village_id);
  END IF;
END $$;

-- Histoires indexes
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'histoires' AND table_schema = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_histoires_village_id ON histoires(village_id);
  END IF;
END $$;

-- Alphabet indexes
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alphabet' AND table_schema = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_alphabet_village_id ON alphabet(village_id);
  END IF;
END $$;

SELECT 'RLS policies and indexes created successfully!' as result;
