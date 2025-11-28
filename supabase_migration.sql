-- Supabase migration for Boost feature
-- Adiciona colunas de boost (se ainda não existirem) e cria a função RPC boost_match

-- 1. Colunas na tabela matches
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS boost_score integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_boosted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS boost_until timestamptz NULL;

-- 2. Índice para ordenação rápida
CREATE INDEX IF NOT EXISTS idx_matches_boost ON public.matches (boost_score DESC, boost_until DESC);

-- 3. Função RPC para aplicar boost a uma partida
--    Deduz 2 tokens do usuário, marca a partida como impulsionada e define o prazo de 12h.
CREATE OR REPLACE FUNCTION public.boost_match(p_match_id bigint, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_balance int;
    v_now timestamptz := now();
    v_boost_until timestamptz := now() + interval '12 hour';
    v_match record;
BEGIN
    -- Verifica saldo do usuário
    SELECT balance INTO v_balance FROM public.tokens WHERE user_id = p_user_id;
    IF v_balance IS NULL OR v_balance < 2 THEN
        RETURN jsonb_build_object('status', 'INSUFFICIENT_FUNDS');
    END IF;

    -- Atualiza a partida
    UPDATE public.matches
    SET boost_score = COALESCE(boost_score, 0) + 1,
        is_boosted = true,
        boost_until = v_boost_until
    WHERE id = p_match_id
    RETURNING * INTO v_match;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('status', 'MATCH_NOT_FOUND');
    END IF;

    -- Deduz tokens
    UPDATE public.tokens
    SET balance = balance - 2,
        updated_at = now()
    WHERE user_id = p_user_id;

    -- Retorna partida atualizada
    RETURN jsonb_build_object(
        'status', 'OK',
        'match', jsonb_build_object(
            'id', v_match.id,
            'boost_score', v_match.boost_score,
            'is_boosted', v_match.is_boosted,
            'boost_until', v_match.boost_until,
            'date', v_match.date,
            'name', v_match.name,
            'sport', v_match.sport,
            'location', v_match.location,
            'slots', v_match.slots,
            'filled_slots', v_match.filled_slots,
            'status', v_match.status
        )
    );
END;
$$;

-- 4. Concede permissão ao papel autenticado para usar a função
GRANT EXECUTE ON FUNCTION public.boost_match(bigint, uuid) TO authenticated;
