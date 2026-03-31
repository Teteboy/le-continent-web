-- Add reset code columns to profiles table for phone-based password reset
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS reset_code VARCHAR(6),
ADD COLUMN IF NOT EXISTS reset_code_expires TIMESTAMP WITH TIME ZONE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_reset_code ON profiles(reset_code) WHERE reset_code IS NOT NULL;
