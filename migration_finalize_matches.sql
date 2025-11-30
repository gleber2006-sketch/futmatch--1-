-- Migration: Add 'Finalizada' status and auto-finalize function
-- Description: Adds the 'Finalizada' status to matches and creates a function to automatically finalize expired matches

-- Step 1: Add 'Finalizada' to the match_status enum type
-- Note: PostgreSQL doesn't allow direct ALTER TYPE for enums, so we need to handle this carefully
-- If the type doesn't exist yet, this will create it. If it exists, you may need to recreate it.

DO $$ 
BEGIN
    -- Check if 'Finalizada' already exists in the enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'Finalizada' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'match_status')
    ) THEN
        -- Add 'Finalizada' to the enum
        ALTER TYPE match_status ADD VALUE 'Finalizada';
    END IF;
END $$;

-- Step 2: Create function to finalize expired matches
CREATE OR REPLACE FUNCTION finalize_expired_matches()
RETURNS TABLE(finalized_count INTEGER) AS $$
DECLARE
    count_updated INTEGER;
BEGIN
    -- Update matches where:
    -- 1. Date has passed
    -- 2. Status is not already 'Finalizada' or 'Cancelado'
    UPDATE matches
    SET status = 'Finalizada'
    WHERE date < NOW()
      AND status NOT IN ('Finalizada', 'Cancelado');
    
    -- Get the number of rows updated
    GET DIAGNOSTICS count_updated = ROW_COUNT;
    
    -- Return the count
    RETURN QUERY SELECT count_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION finalize_expired_matches() TO authenticated, anon, service_role;

-- Step 4: Create a function that can be called periodically (optional, for manual testing)
COMMENT ON FUNCTION finalize_expired_matches() IS 'Finalizes all matches whose date has passed. Returns the number of matches finalized.';

-- Step 5: Finalize any existing expired matches immediately
SELECT finalize_expired_matches();
