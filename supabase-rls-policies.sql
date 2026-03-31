-- Run this in Supabase SQL Editor to enable public read access
-- This fixes the issue where queries timeout for anonymous users

-- First, check if RLS is enabled on each table
-- Then create policies to allow public read access

-- Villages table - public read access
DROP POLICY IF EXISTS "Public can read villages" ON villages;
CREATE POLICY "Public can read villages" ON villages FOR SELECT USING (true);

-- Lexique table - public read access  
DROP POLICY IF EXISTS "Public can read lexique" ON lexique;
CREATE POLICY "Public can read lexique" ON lexique FOR SELECT USING (true);

-- Histoires table - public read access
DROP POLICY IF EXISTS "Public can read histoires" ON histoires;
CREATE POLICY "Public can read histoires" ON histoires FOR SELECT USING (true);

-- Proverbes table - public read access
DROP POLICY IF EXISTS "Public can read proverbes" ON proverbes;
CREATE POLICY "Public can read proverbes" ON proverbes FOR SELECT USING (true);

-- Mets table - public read access
DROP POLICY IF EXISTS "Public can read mets" ON mets;
CREATE POLICY "Public can read mets" ON mets FOR SELECT USING (true);

-- Phrases table - public read access
DROP POLICY IF EXISTS "Public can read phrases" ON phrases;
CREATE POLICY "Public can read phrases" ON phrases FOR SELECT USING (true);

-- Alphabet table - public read access
DROP POLICY IF EXISTS "Public can read alphabet" ON alphabet;
CREATE POLICY "Public can read alphabet" ON alphabet FOR SELECT USING (true);

-- Cultures_books table - public read access
DROP POLICY IF EXISTS "Public can read cultures_books" ON cultures_books;
CREATE POLICY "Public can read cultures_books" ON cultures_books FOR SELECT USING (true);

-- Profiles table - users can read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);

-- Referrals table - users can read their own referrals
DROP POLICY IF EXISTS "Users can read own referrals" ON referrals;
CREATE POLICY "Users can read own referrals" ON referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Referrals table - users can insert their own referral (when they are being referred)
DROP POLICY IF EXISTS "Users can insert own referrals" ON referrals;
CREATE POLICY "Users can insert own referrals" ON referrals FOR INSERT WITH CHECK (auth.uid() = referred_id);

-- Referrals table - users can update their own referral earnings
DROP POLICY IF EXISTS "Users can update own referral earnings" ON referrals;
CREATE POLICY "Users can update own referral earnings" ON referrals FOR UPDATE USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Promo_codes table - public read access
DROP POLICY IF EXISTS "Public can read promo_codes" ON promo_codes;
CREATE POLICY "Public can read promo_codes" ON promo_codes FOR SELECT USING (true);

-- Confirm policies created
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
