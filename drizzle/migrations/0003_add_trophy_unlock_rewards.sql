CREATE OR REPLACE FUNCTION public.unlock_trophy(
  _trophy_slug text,
  _trophy_name text,
  _achievement_slug text,
  _achievement_name text,
  _xp_reward integer DEFAULT 100
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_trophy_id uuid;
  v_achievement_id uuid;
  v_new_unlock boolean := false;
  v_award_id uuid;
  v_xp_before bigint := 0;
  v_xp_after bigint := 0;
  v_level_number integer := 1;
  v_level_name text := 'Level 1';
  v_rank_number integer := 1;
  v_rank_name text := 'Rank 1';
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Sign in required';
  END IF;

  IF coalesce(trim(_trophy_slug), '') = '' OR coalesce(trim(_achievement_slug), '') = '' THEN
    RAISE EXCEPTION 'Unlock identity is required';
  END IF;

  INSERT INTO public.trophies (name, slug, description, tier, icon, conditions, status)
  VALUES (
    coalesce(nullif(trim(_trophy_name), ''), 'AMS Trophy'),
    lower(trim(_trophy_slug)),
    'Role progression trophy unlocked from the AMS museum.',
    'bronze',
    'trophy',
    jsonb_build_array(jsonb_build_object('source', 'trophy-gallery')),
    'active'
  )
  ON CONFLICT (slug) DO NOTHING;

  SELECT id INTO v_trophy_id
  FROM public.trophies
  WHERE slug = lower(trim(_trophy_slug));

  INSERT INTO public.achievements (name, slug, description, rarity, xp_reward, icon, conditions, rewards, status, is_secret)
  VALUES (
    coalesce(nullif(trim(_achievement_name), ''), 'Trophy Achievement'),
    lower(trim(_achievement_slug)),
    'Achievement awarded when the matching AMS trophy is unlocked.',
    'rare',
    greatest(coalesce(_xp_reward, 100), 0),
    'sparkles',
    jsonb_build_array(jsonb_build_object('source', 'trophy-gallery')),
    jsonb_build_object('xp', greatest(coalesce(_xp_reward, 100), 0), 'trophy_slug', lower(trim(_trophy_slug))),
    'active',
    false
  )
  ON CONFLICT (slug) DO NOTHING;

  SELECT id INTO v_achievement_id
  FROM public.achievements
  WHERE slug = lower(trim(_achievement_slug));

  INSERT INTO public.user_trophies (user_id, trophy_id)
  VALUES (v_user_id, v_trophy_id)
  ON CONFLICT (user_id, trophy_id) DO NOTHING
  RETURNING id INTO v_award_id;

  v_new_unlock := v_award_id IS NOT NULL;

  IF v_new_unlock THEN
    INSERT INTO public.user_achievements (user_id, achievement_id, progress, unlocked_at, metadata)
    VALUES (
      v_user_id,
      v_achievement_id,
      100,
      now(),
      jsonb_build_object('source', 'trophy-gallery', 'trophy_slug', lower(trim(_trophy_slug)))
    )
    ON CONFLICT (user_id, achievement_id) DO UPDATE
      SET progress = 100,
          unlocked_at = coalesce(public.user_achievements.unlocked_at, excluded.unlocked_at),
          metadata = excluded.metadata;

    SELECT coalesce(total_xp, 0) INTO v_xp_before
    FROM public.user_xp
    WHERE user_id = v_user_id
    FOR UPDATE;

    v_xp_after := coalesce(v_xp_before, 0) + greatest(coalesce(_xp_reward, 100), 0);

    SELECT level_number, name INTO v_level_number, v_level_name
    FROM public.levels
    WHERE status = 'active' AND xp_required <= v_xp_after
    ORDER BY xp_required DESC
    LIMIT 1;

    SELECT rank_number, name INTO v_rank_number, v_rank_name
    FROM public.ranks
    WHERE status = 'active' AND min_xp <= v_xp_after
    ORDER BY min_xp DESC
    LIMIT 1;

    v_level_number := coalesce(v_level_number, 1);
    v_level_name := coalesce(v_level_name, 'Level 1');
    v_rank_number := coalesce(v_rank_number, 1);
    v_rank_name := coalesce(v_rank_name, 'Rank 1');

    INSERT INTO public.user_xp (user_id, total_xp, current_level, current_rank, updated_at)
    VALUES (v_user_id, v_xp_after, v_level_number, v_rank_number, now())
    ON CONFLICT (user_id) DO UPDATE
      SET total_xp = excluded.total_xp,
          current_level = excluded.current_level,
          current_rank = excluded.current_rank,
          updated_at = now();

    INSERT INTO public.xp_transactions (user_id, amount, reason, metadata)
    VALUES (
      v_user_id,
      greatest(coalesce(_xp_reward, 100), 0),
      'trophy:' || lower(trim(_trophy_slug)),
      jsonb_build_object('trophy_slug', lower(trim(_trophy_slug)), 'achievement_slug', lower(trim(_achievement_slug)))
    );
  ELSE
    SELECT coalesce(total_xp, 0), coalesce(current_level, 1), coalesce(current_rank, 1)
      INTO v_xp_after, v_level_number, v_rank_number
    FROM public.user_xp
    WHERE user_id = v_user_id;

    v_xp_after := coalesce(v_xp_after, 0);
    v_level_number := coalesce(v_level_number, 1);
    v_rank_number := coalesce(v_rank_number, 1);

    SELECT name INTO v_level_name FROM public.levels WHERE level_number = v_level_number LIMIT 1;
    SELECT name INTO v_rank_name FROM public.ranks WHERE rank_number = v_rank_number LIMIT 1;
    v_level_name := coalesce(v_level_name, 'Level ' || v_level_number::text);
    v_rank_name := coalesce(v_rank_name, 'Rank ' || v_rank_number::text);
  END IF;

  RETURN jsonb_build_object(
    'newly_unlocked', v_new_unlock,
    'xp_awarded', CASE WHEN v_new_unlock THEN greatest(coalesce(_xp_reward, 100), 0) ELSE 0 END,
    'total_xp', v_xp_after,
    'level_number', v_level_number,
    'level_name', v_level_name,
    'rank_number', v_rank_number,
    'rank_name', v_rank_name,
    'trophy_slug', lower(trim(_trophy_slug)),
    'achievement_slug', lower(trim(_achievement_slug))
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.unlock_trophy(text, text, text, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.unlock_trophy(text, text, text, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unlock_trophy(text, text, text, text, integer) TO service_role;