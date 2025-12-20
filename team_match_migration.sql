-- Add team_id to matches table
ALTER TABLE public.matches 
ADD COLUMN IF NOT EXISTS team_id BIGINT REFERENCES public.teams(id) ON DELETE SET NULL;

-- Update create_match_with_tokens RPC to accept team_id
CREATE OR REPLACE FUNCTION public.create_match_with_tokens(
    p_name TEXT,
    p_sport TEXT,
    p_location TEXT,
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION,
    p_date TIMESTAMP WITH TIME ZONE,
    p_slots INTEGER,
    p_rules TEXT,
    p_is_private BOOLEAN,
    p_invite_code TEXT,
    p_team_id BIGINT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_match_id BIGINT;
    v_balance INTEGER;
    v_match_data JSONB;
BEGIN
    v_user_id := auth.uid();

    -- Check balance
    SELECT balance INTO v_balance FROM tokens WHERE user_id = v_user_id;
    
    IF v_balance IS NULL OR v_balance < 3 THEN
        RAISE EXCEPTION 'INSUFFICIENT_FUNDS';
    END IF;

    -- Deduct tokens
    UPDATE tokens SET balance = balance - 3 WHERE user_id = v_user_id;

    -- Insert Match
    INSERT INTO matches (
        created_by, name, sport, location, lat, lng, date, slots, rules, is_private, invite_code, team_id
    ) VALUES (
        v_user_id, p_name, p_sport, p_location, p_lat, p_lng, p_date, p_slots, p_rules, p_is_private, p_invite_code, p_team_id
    ) RETURNING id INTO v_match_id;

    -- Add Creator as Participant
    INSERT INTO match_participants (match_id, user_id, status)
    VALUES (v_match_id, v_user_id, 'confirmed');

    -- Return the created match (as json)
    SELECT row_to_json(m)::jsonb INTO v_match_data FROM matches m WHERE id = v_match_id;
    
    RETURN v_match_data;
END;
$$;
