-- Migration: Add coach_specialties to profiles
-- Description: Adds an array column to store the coaching specialties (e.g., 'Vôlei', 'Goleiro') separate from player positions.

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS coach_specialties text[] DEFAULT '{}';
