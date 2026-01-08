-- Migration: Add available_roles to profiles
-- Description: Adds an array column to store the roles a user offers (e.g., 'Goleiro', 'Juiz')

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS available_roles text[] DEFAULT '{}';

-- Update RLS policies to allow users to update their own roles
-- (Assuming existing update policy covers all columns, but good to verify if policies are restrictive)
-- For now, just the column addition is sufficient as the standard update policy usually covers "all columns" for "own row".
