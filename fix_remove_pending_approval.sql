-- ========================================
-- CORREÇÃO: Remover sistema de aprovação
-- ========================================
-- Execute este SQL no Supabase SQL Editor
-- Todos os participantes entrarão automaticamente como 'confirmed'
-- ========================================

CREATE OR REPLACE FUNCTION public.join_match_with_token(
  p_match_id bigint
) RETURNS text AS $$
DECLARE
  v_user_id uuid;
  v_slots int;
  v_filled int;
  v_balance int;
  v_match_status text;
BEGIN
  -- Obter o ID do usuário autenticado
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN 'NOT_AUTHENTICATED';
  END IF;

  -- Verificar se a partida existe
  SELECT slots, filled_slots, status 
  INTO v_slots, v_filled, v_match_status
  FROM matches 
  WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN 'MATCH_NOT_FOUND';
  END IF;
  
  -- Verificar se a partida está fechada
  IF v_match_status IN ('Cancelado', 'Confirmado', 'Finalizada') THEN
    RETURN 'MATCH_CLOSED';
  END IF;

  -- Verificar se já está na partida
  IF EXISTS (
    SELECT 1 FROM match_participants 
    WHERE match_id = p_match_id AND user_id = v_user_id
  ) THEN
    RETURN 'ALREADY_IN';
  END IF;

  -- Verificar saldo
  SELECT balance INTO v_balance FROM tokens WHERE user_id = v_user_id;
  
  IF v_balance IS NULL OR v_balance < 1 THEN
    RETURN 'NO_TOKENS';
  END IF;
  
  -- Verificar se está cheia
  IF v_filled >= v_slots THEN
    RETURN 'MATCH_FULL';
  END IF;

  -- SEMPRE adicionar como 'confirmed' (SEM APROVAÇÃO)
  INSERT INTO match_participants (match_id, user_id, status, joined_at)
  VALUES (p_match_id, v_user_id, 'confirmed', now());
  
  -- NÃO atualizar filled_slots aqui - será atualizado via realtime subscription
  -- que conta automaticamente os participantes com status 'confirmed'
  
  -- Deduzir token
  UPDATE tokens SET balance = balance - 1, updated_at = now() WHERE user_id = v_user_id;
  
  RETURN 'OK';
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'ERROR';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION public.join_match_with_token(bigint) TO authenticated;
