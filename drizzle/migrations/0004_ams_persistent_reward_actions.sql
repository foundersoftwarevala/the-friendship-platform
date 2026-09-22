ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS steps_meta jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.ams_grant_reward(
  p_xp int DEFAULT 0,
  p_coins int DEFAULT 0,
  p_tokens int DEFAULT 0,
  p_award_ids uuid[] DEFAULT '{}'::uuid[],
  p_reason text DEFAULT 'manual'
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_key text := coalesce(nullif(p_reason, ''), 'manual');
  v_id uuid := gen_random_uuid();
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  IF p_xp < 0 OR p_coins < 0 OR p_tokens < 0 THEN RAISE EXCEPTION 'Rewards cannot be negative'; END IF;
  IF EXISTS (SELECT 1 FROM public.xp_transactions WHERE user_id=v_user AND metadata->>'grant_key'=v_key) THEN
    RETURN jsonb_build_object('id',NULL,'duplicate',true,'reason',v_key);
  END IF;
  INSERT INTO public.user_xp(user_id,total_xp) VALUES(v_user,p_xp)
  ON CONFLICT(user_id) DO UPDATE SET total_xp=user_xp.total_xp+excluded.total_xp,updated_at=now();
  IF p_xp > 0 THEN
    INSERT INTO public.xp_transactions(id,user_id,amount,reason,metadata)
    VALUES(v_id,v_user,p_xp,v_key,jsonb_build_object('grant_key',v_key,'coins',p_coins,'tokens',p_tokens));
  END IF;
  INSERT INTO public.reward_wallets(user_id,kind,balance) VALUES(v_user,'coins',p_coins)
  ON CONFLICT(user_id,kind) DO UPDATE SET balance=reward_wallets.balance+excluded.balance,updated_at=now();
  INSERT INTO public.reward_wallets(user_id,kind,balance) VALUES(v_user,'tokens',p_tokens)
  ON CONFLICT(user_id,kind) DO UPDATE SET balance=reward_wallets.balance+excluded.balance,updated_at=now();
  INSERT INTO public.user_awards(user_id,award_id)
  SELECT v_user,id FROM public.awards WHERE id=ANY(p_award_ids)
  ON CONFLICT(user_id,award_id) DO NOTHING;
  INSERT INTO public.ams_award_ledger(user_id,role,asset_kind,asset_slug,reason)
  SELECT v_user,'user','award',slug,v_key FROM public.awards WHERE id=ANY(p_award_ids);
  RETURN jsonb_build_object('id',v_id,'at',now(),'xp',p_xp,'coins',p_coins,'tokens',p_tokens,'awardIds',p_award_ids,'reason',v_key,'actor',v_user);
END $$;
REVOKE ALL ON FUNCTION public.ams_grant_reward(int,int,int,uuid[],text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ams_grant_reward(int,int,int,uuid[],text) TO authenticated;