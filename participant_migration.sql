-- Add new columns to match_participants if they don't exist
ALTER TABLE match_participants 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'confirmed',
ADD COLUMN IF NOT EXISTS joined_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS waitlist_position int;

-- Update existing rows to have defaults
UPDATE match_participants SET status = 'confirmed', joined_at = now() WHERE status IS NULL;

-- Create or replace the join_match logic to handle waitlist
CREATE OR REPLACE FUNCTION join_match_with_waitlist(
  p_match_id bigint,
  p_user_id uuid
) RETURNS text AS $$
DECLARE
  v_slots int;
  v_filled int;
  v_balance int;
  v_status text;
  v_waitlist_pos int;
BEGIN
  -- Check if match exists and is open
  SELECT slots, filled_slots, status INTO v_slots, v_filled, v_status
  FROM matches WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN 'MATCH_NOT_FOUND';
  END IF;
  
  IF v_status = 'Cancelado' THEN
    RETURN 'MATCH_CANCELLED';
  END IF;

  -- Check if already joined
  IF EXISTS (SELECT 1 FROM match_participants WHERE match_id = p_match_id AND user_id = p_user_id) THEN
    RETURN 'ALREADY_IN';
  END IF;

  -- Check balance (cost is 1 coin)
  SELECT balance INTO v_balance FROM tokens WHERE user_id = p_user_id;
  IF v_balance < 1 THEN
    RETURN 'NO_TOKENS';
  END IF;

  -- Determine status based on capacity
  IF v_filled < v_slots THEN
    -- Join as confirmed
    INSERT INTO match_participants (match_id, user_id, status, joined_at)
    VALUES (p_match_id, p_user_id, 'confirmed', now());
    
    -- Update match filled slots
    UPDATE matches SET filled_slots = filled_slots + 1 WHERE id = p_match_id;
    
    -- Deduct token
    UPDATE tokens SET balance = balance - 1 WHERE user_id = p_user_id;
    
    RETURN 'JOINED_CONFIRMED';
  ELSE
    -- Join as waitlist
    -- Calculate next position
    SELECT COALESCE(MAX(waitlist_position), 0) + 1 INTO v_waitlist_pos 
    FROM match_participants 
    WHERE match_id = p_match_id AND status = 'waitlist';
    
    INSERT INTO match_participants (match_id, user_id, status, joined_at, waitlist_position)
    VALUES (p_match_id, p_user_id, 'waitlist', now(), v_waitlist_pos);
    
    -- Note: We do NOT deduct tokens for waitlist (optional rule, but fair)
    -- OR we deduct and refund later. Let's assume we deduct to reserve commitment.
    UPDATE tokens SET balance = balance - 1 WHERE user_id = p_user_id;
    
    RETURN 'JOINED_WAITLIST';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
