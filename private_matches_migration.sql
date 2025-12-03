-- Migration: Add Private Matches and Invite System
-- Adds privacy controls and referral tracking to FutMatch

-- 1. Add privacy and invite columns to matches table
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS is_private boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS invite_code text UNIQUE;

-- 2. Add referral tracking to profiles table  
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS signup_bonus_claimed boolean DEFAULT false;

-- 3. Create index for fast invite code lookups
CREATE INDEX IF NOT EXISTS idx_matches_invite_code ON public.matches (invite_code) WHERE invite_code IS NOT NULL;

-- 4. Create index for referral tracking
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles (referred_by) WHERE referred_by IS NOT NULL;

-- 5. Add comment for documentation
COMMENT ON COLUMN public.matches.is_private IS 'If true, match is only accessible via invite link';
COMMENT ON COLUMN public.matches.invite_code IS 'Unique invite code for private matches';
COMMENT ON COLUMN public.profiles.referred_by IS 'User ID of the person who referred this user';
COMMENT ON COLUMN public.profiles.signup_bonus_claimed IS 'Whether the user has claimed their signup bonus from referral';
