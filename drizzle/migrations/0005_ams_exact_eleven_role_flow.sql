-- Exact eleven-role AMS common flow. This migration is additive: it introduces
-- role-scoped state and verification, repairs server functions, and wires only
-- business tables that are present in this deployment.

CREATE TABLE IF NOT EXISTS public.ams_user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','reseller','franchise','author','vendor','affiliate','influencer','developer','creator','seo','support')),
  source text NOT NULL DEFAULT 'platform_role',
  source_reference text,
  active boolean NOT NULL DEFAULT true,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS public.ams_role_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','reseller','franchise','author','vendor','affiliate','influencer','developer','creator','seo','support')),
  total_xp bigint NOT NULL DEFAULT 0,
  current_level integer NOT NULL DEFAULT 0,
  current_stage integer NOT NULL DEFAULT 0,
  current_rank integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS public.ams_achievement_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','reseller','franchise','author','vendor','affiliate','influencer','developer','creator','seo','support')),
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  progress numeric NOT NULL DEFAULT 0,
  target numeric NOT NULL DEFAULT 1,
  state text NOT NULL DEFAULT 'locked' CHECK (state IN ('locked','in_progress','available','earned','verified','revoked')),
  earned_at timestamptz,
  verified_at timestamptz,
  revoked_at timestamptz,
  source_event_id uuid REFERENCES public.ams_activity_events(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, achievement_id)
);

ALTER TABLE public.ams_passports ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
ALTER TABLE public.ams_passports ADD COLUMN IF NOT EXISTS verification_code text;
ALTER TABLE public.ams_passports ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE public.ams_passports ADD COLUMN IF NOT EXISTS revoked_at timestamptz;
ALTER TABLE public.ams_certificates ADD COLUMN IF NOT EXISTS verification_code text;
ALTER TABLE public.ams_certificates ADD COLUMN IF NOT EXISTS expires_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS ams_passports_user_role_uidx ON public.ams_passports(user_id, role);
CREATE UNIQUE INDEX IF NOT EXISTS ams_passports_verification_code_uidx ON public.ams_passports(verification_code) WHERE verification_code IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ams_certificates_verification_code_uidx ON public.ams_certificates(verification_code) WHERE verification_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS ams_events_user_role_idx ON public.ams_activity_events(user_id, role, occurred_at DESC);
CREATE INDEX IF NOT EXISTS ams_ledger_user_role_idx ON public.ams_award_ledger(user_id, role, created_at DESC);

ALTER TABLE public.ams_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ams_role_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ams_achievement_progress ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.ams_is_operator()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles r
    WHERE r.user_id = auth.uid()
      AND r.role::text IN ('admin','boss','boss_owner','super_admin')
  );
$$;

DROP POLICY IF EXISTS ams_user_roles_read ON public.ams_user_roles;
CREATE POLICY ams_user_roles_read ON public.ams_user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.ams_is_operator());
DROP POLICY IF EXISTS ams_user_roles_write ON public.ams_user_roles;
CREATE POLICY ams_user_roles_write ON public.ams_user_roles FOR ALL TO authenticated
USING (public.ams_is_operator()) WITH CHECK (public.ams_is_operator());
DROP POLICY IF EXISTS ams_role_progress_read ON public.ams_role_progress;
CREATE POLICY ams_role_progress_read ON public.ams_role_progress FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.ams_is_operator());
DROP POLICY IF EXISTS ams_achievement_progress_read ON public.ams_achievement_progress;
CREATE POLICY ams_achievement_progress_read ON public.ams_achievement_progress FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.ams_is_operator());

CREATE OR REPLACE FUNCTION public.ams_sync_platform_roles(p_user_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer := 0;
BEGIN
  INSERT INTO public.ams_user_roles(user_id, role, source, source_reference)
  SELECT p_user_id,
         CASE r.role::text
           WHEN 'customer' THEN 'user'
           WHEN 'marketplace-user' THEN 'user'
           ELSE r.role::text
         END,
         'platform_role', r.role::text
  FROM public.user_roles r
  WHERE r.user_id = p_user_id
    AND r.role::text IN ('customer','marketplace-user','reseller','franchise','author','vendor','affiliate','influencer','developer','seo','support')
  ON CONFLICT (user_id, role) DO UPDATE SET active = true, source_reference = EXCLUDED.source_reference;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.ams_sync_platform_roles(uuid) FROM public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.ams_ingest_event(
  p_user_id uuid, p_event_key text, p_entity_type text DEFAULT NULL,
  p_entity_id text DEFAULT NULL, p_value numeric DEFAULT 1,
  p_occurred_at timestamptz DEFAULT now(), p_source text DEFAULT 'system',
  p_payload jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_role text; v_id uuid; v_ids jsonb := '[]'::jsonb; v_count integer := 0;
BEGIN
  IF p_user_id IS NULL OR coalesce(p_event_key,'') = '' THEN
    RETURN jsonb_build_object('ok',false,'reason','user_and_event_required');
  END IF;
  PERFORM public.ams_sync_platform_roles(p_user_id);
  FOR v_role IN
    SELECT ur.role FROM public.ams_user_roles ur
    WHERE ur.user_id=p_user_id AND ur.active
      AND ur.role IN ('user','reseller','franchise','author','vendor','affiliate','influencer','developer','creator','seo','support')
    ORDER BY ur.role
  LOOP
    v_id := NULL;
    INSERT INTO public.ams_activity_events
      (user_id,role,event_key,entity_type,entity_id,value,occurred_at,source,dedupe_key,payload)
    VALUES
      (p_user_id,v_role,p_event_key,p_entity_type,p_entity_id,coalesce(p_value,1),coalesce(p_occurred_at,now()),coalesce(p_source,'system'),
       coalesce(p_entity_type,'-')||':'||coalesce(p_entity_id,'-')||':'||p_event_key||':'||p_user_id::text||':'||v_role,
       coalesce(p_payload,'{}'::jsonb))
    ON CONFLICT (dedupe_key) DO NOTHING RETURNING id INTO v_id;
    IF v_id IS NOT NULL THEN v_count := v_count + 1; v_ids := v_ids || to_jsonb(v_id); END IF;
  END LOOP;
  IF v_count = 0 AND NOT EXISTS (SELECT 1 FROM public.ams_user_roles WHERE user_id=p_user_id AND active) THEN
    RETURN jsonb_build_object('ok',false,'reason','no_ams_role');
  END IF;
  RETURN jsonb_build_object('ok',true,'events_created',v_count,'event_ids',v_ids,'duplicate',v_count=0);
END $$;
REVOKE ALL ON FUNCTION public.ams_ingest_event(uuid,text,text,text,numeric,timestamptz,text,jsonb) FROM public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.ams_asset_state(
  p_user uuid, p_xp bigint, p_min_xp bigint, p_stage integer,
  p_earned boolean, p_verified boolean, p_revoked boolean
) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN p_revoked THEN 'revoked'
    WHEN p_verified THEN 'verified'
    WHEN p_earned THEN 'earned'
    WHEN p_user IS NULL THEN 'locked'
    WHEN p_xp >= p_min_xp THEN 'available'
    WHEN p_xp > 0 OR p_stage = 1 THEN 'in_progress'
    ELSE 'locked'
  END;
$$;
GRANT EXECUTE ON FUNCTION public.ams_asset_state(uuid,bigint,bigint,integer,boolean,boolean,boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.ams_evaluate_user_role(p_user_id uuid, p_role text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ev record; rl record; ach record; v_xp_added bigint:=0; v_total bigint:=0; v_stage integer:=0; v_rank integer:=0; v_gain bigint; v_today integer; v_last timestamptz; v_progress numeric; v_target numeric; v_event uuid;
BEGIN
  IF p_role NOT IN ('user','reseller','franchise','author','vendor','affiliate','influencer','developer','creator','seo','support') OR
     NOT EXISTS (SELECT 1 FROM public.ams_user_roles WHERE user_id=p_user_id AND role=p_role AND active) THEN
    RETURN jsonb_build_object('ok',false,'reason','role_not_assigned','role',p_role);
  END IF;
  FOR ev IN SELECT * FROM public.ams_activity_events WHERE user_id=p_user_id AND role=p_role AND processed_at IS NULL ORDER BY occurred_at,id LOOP
    FOR rl IN
      SELECT r.id,r.source_id,r.xp_value,r.multiplier,r.cooldown_seconds,r.max_per_day
      FROM public.xp_rules r JOIN public.xp_sources s ON s.id=r.source_id
      WHERE s.slug=ev.event_key AND coalesce(r.status,'active')='active' AND coalesce(s.status,'active')='active'
        AND r.conditions->>'role'=p_role
    LOOP
      IF coalesce(rl.cooldown_seconds,0)>0 THEN
        SELECT max(created_at) INTO v_last FROM public.xp_transactions WHERE user_id=p_user_id AND rule_id=rl.id AND metadata->>'ams_role'=p_role;
        IF v_last IS NOT NULL AND v_last > ev.occurred_at-make_interval(secs=>rl.cooldown_seconds) THEN CONTINUE; END IF;
      END IF;
      IF coalesce(rl.max_per_day,0)>0 THEN
        SELECT count(*) INTO v_today FROM public.xp_transactions WHERE user_id=p_user_id AND rule_id=rl.id AND metadata->>'ams_role'=p_role AND created_at>=date_trunc('day',ev.occurred_at) AND created_at<date_trunc('day',ev.occurred_at)+interval '1 day';
        IF v_today>=rl.max_per_day THEN CONTINUE; END IF;
      END IF;
      v_gain:=floor(coalesce(rl.xp_value,0)*coalesce(rl.multiplier,1))::bigint;
      IF v_gain<>0 THEN
        INSERT INTO public.xp_transactions(user_id,amount,source_id,rule_id,reason,metadata)
        VALUES(p_user_id,v_gain,rl.source_id,rl.id,'ams:'||ev.event_key,jsonb_build_object('event_id',ev.id,'entity',ev.entity_id,'ams_role',p_role));
        INSERT INTO public.ams_award_ledger(user_id,role,event_id,rule_id,asset_kind,xp_awarded,reason)
        VALUES(p_user_id,p_role,ev.id,rl.id,'xp',v_gain,'ams:'||ev.event_key);
        v_xp_added:=v_xp_added+v_gain;
      END IF;
    END LOOP;
    UPDATE public.ams_activity_events SET processed_at=now() WHERE id=ev.id;
  END LOOP;

  SELECT coalesce(sum(amount),0) INTO v_total FROM public.xp_transactions WHERE user_id=p_user_id AND metadata->>'ams_role'=p_role;
  SELECT coalesce(max(stage),0) INTO v_stage FROM public.ams_role_stages WHERE role=p_role AND min_xp<=v_total;
  SELECT coalesce(max(rank_number),0) INTO v_rank FROM public.ranks WHERE min_xp<=v_total AND coalesce(status,'active')='active';
  INSERT INTO public.ams_role_progress(user_id,role,total_xp,current_level,current_stage,current_rank,updated_at)
  VALUES(p_user_id,p_role,v_total,v_stage,v_stage,v_rank,now())
  ON CONFLICT(user_id,role) DO UPDATE SET total_xp=EXCLUDED.total_xp,current_level=EXCLUDED.current_level,current_stage=EXCLUDED.current_stage,current_rank=EXCLUDED.current_rank,updated_at=now();

  FOR ach IN SELECT a.id,a.slug,a.conditions FROM public.achievements a WHERE coalesce(a.status,'active')='active' AND a.conditions->>'role'=p_role LOOP
    v_target:=coalesce((ach.conditions->>'threshold')::numeric,(ach.conditions->>'stage')::numeric,1);
    IF ach.conditions ? 'event_key' THEN
      SELECT coalesce(sum(value),0),max(id) INTO v_progress,v_event FROM public.ams_activity_events WHERE user_id=p_user_id AND role=p_role AND event_key=ach.conditions->>'event_key';
    ELSE v_progress:=v_stage; v_event:=NULL; END IF;
    INSERT INTO public.ams_achievement_progress(user_id,role,achievement_id,progress,target,state,earned_at,source_event_id,updated_at)
    VALUES(p_user_id,p_role,ach.id,v_progress,v_target,
      CASE WHEN v_progress>=v_target THEN 'earned' WHEN v_progress>0 OR v_target=1 THEN 'in_progress' ELSE 'locked' END,
      CASE WHEN v_progress>=v_target THEN now() ELSE NULL END,v_event,now())
    ON CONFLICT(user_id,role,achievement_id) DO UPDATE SET progress=EXCLUDED.progress,target=EXCLUDED.target,
      state=CASE WHEN ams_achievement_progress.state IN ('verified','revoked') THEN ams_achievement_progress.state ELSE EXCLUDED.state END,
      earned_at=coalesce(ams_achievement_progress.earned_at,EXCLUDED.earned_at),source_event_id=coalesce(EXCLUDED.source_event_id,ams_achievement_progress.source_event_id),updated_at=now();
    IF v_progress>=v_target THEN
      INSERT INTO public.user_achievements(user_id,achievement_id,progress,unlocked_at,metadata)
      VALUES(p_user_id,ach.id,100,now(),jsonb_build_object('ams_role',p_role,'source_event_id',v_event)) ON CONFLICT(user_id,achievement_id) DO NOTHING;
    END IF;
  END LOOP;

  INSERT INTO public.user_trophies(user_id,trophy_id,earned_at)
  SELECT p_user_id,t.id,now() FROM public.trophies t WHERE t.conditions->>'role'=p_role AND (t.conditions->>'stage')::int<=v_stage AND coalesce(t.status,'active')='active' ON CONFLICT DO NOTHING;
  INSERT INTO public.user_badges(user_id,badge_id,earned_at)
  SELECT p_user_id,b.id,now() FROM public.badges b WHERE b.conditions->>'role'=p_role AND (b.conditions->>'stage')::int<=v_stage AND coalesce(b.status,'active')='active' ON CONFLICT DO NOTHING;
  PERFORM public.ams_issue_awards(p_user_id,p_role,v_stage);

  INSERT INTO public.ams_passports(user_id,role,passport_no,verification_code,level,stage,verification,updated_at)
  VALUES(p_user_id,p_role,'SV-'||upper(substr(p_role,1,3))||'-'||upper(substr(replace(p_user_id::text,'-',''),1,12)),upper(encode(digest('passport:'||p_user_id::text||':'||p_role,'sha256'),'hex')),v_stage,v_stage,'verified',now())
  ON CONFLICT(user_id,role) DO UPDATE SET level=EXCLUDED.level,stage=EXCLUDED.stage,verification=CASE WHEN ams_passports.verification='revoked' THEN 'revoked' ELSE 'verified' END,updated_at=now();

  RETURN jsonb_build_object('ok',true,'role',p_role,'xp_awarded',v_xp_added,'total_xp',v_total,'stage',v_stage,'rank',v_rank);
END $$;
REVOKE ALL ON FUNCTION public.ams_evaluate_user_role(uuid,text) FROM public,anon,authenticated;

CREATE OR REPLACE FUNCTION public.ams_evaluate_user(p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; result jsonb:='[]'::jsonb;
BEGIN
  PERFORM public.ams_sync_platform_roles(p_user_id);
  FOR r IN SELECT role FROM public.ams_user_roles WHERE user_id=p_user_id AND active ORDER BY role LOOP
    result:=result||jsonb_build_array(public.ams_evaluate_user_role(p_user_id,r.role));
  END LOOP;
  RETURN jsonb_build_object('ok',true,'roles',result);
END $$;
REVOKE ALL ON FUNCTION public.ams_evaluate_user(uuid) FROM public,anon,authenticated;

CREATE OR REPLACE FUNCTION public.ams_role_chain(p_role text,p_user_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE v_target uuid:=coalesce(p_user_id,auth.uid()); v_xp bigint:=0; v_stage integer:=0; v_chain jsonb;
BEGIN
  IF p_role NOT IN ('user','reseller','franchise','author','vendor','affiliate','influencer','developer','creator','seo','support') THEN RETURN jsonb_build_object('ok',false,'reason','unknown_role'); END IF;
  IF v_target IS DISTINCT FROM auth.uid() AND NOT public.ams_is_operator() THEN RETURN jsonb_build_object('ok',false,'reason','not_permitted'); END IF;
  IF v_target IS NOT NULL AND NOT public.ams_is_operator() AND NOT EXISTS(SELECT 1 FROM public.ams_user_roles WHERE user_id=v_target AND role=p_role AND active) THEN RETURN jsonb_build_object('ok',false,'reason','role_not_assigned'); END IF;
  SELECT total_xp,current_stage INTO v_xp,v_stage FROM public.ams_role_progress WHERE user_id=v_target AND role=p_role;
  v_xp:=coalesce(v_xp,0); v_stage:=coalesce(v_stage,0);
  SELECT jsonb_agg(row_to_json(s)::jsonb ORDER BY s.stage) INTO v_chain FROM (
    SELECT st.stage,st.title,st.tagline,st.min_xp,
      (SELECT min_xp FROM public.ams_role_stages n WHERE n.role=st.role AND n.stage=st.stage+1) next_min_xp,
      CASE WHEN v_target IS NULL OR v_xp<=st.min_xp THEN 0 WHEN v_xp>=coalesce((SELECT min_xp FROM public.ams_role_stages n WHERE n.role=st.role AND n.stage=st.stage+1),st.min_xp) THEN 100 ELSE floor((v_xp-st.min_xp)::numeric*100/nullif((SELECT min_xp FROM public.ams_role_stages n WHERE n.role=st.role AND n.stage=st.stage+1)-st.min_xp,0))::int END progress_pct,
      jsonb_build_object('slug',t.slug,'name',t.name,'tier',t.tier,'state',public.ams_asset_state(v_target,v_xp,st.min_xp,st.stage,ut.id IS NOT NULL,false,false)) trophy,
      jsonb_build_object('slug',aw.slug,'name',aw.name,'rarity',aw.rarity,'state',public.ams_asset_state(v_target,v_xp,st.min_xp,st.stage,uaw.id IS NOT NULL,uaw.claimed_at IS NOT NULL,false)) award,
      jsonb_build_object('slug',b.slug,'name',b.name,'rarity',b.rarity,'state',public.ams_asset_state(v_target,v_xp,st.min_xp,st.stage,ub.id IS NOT NULL,false,false)) badge,
      jsonb_build_object('slug',ac.slug,'name',ac.name,'rarity',ac.rarity,'state',coalesce(ap.state,public.ams_asset_state(v_target,v_xp,st.min_xp,st.stage,ua.id IS NOT NULL,false,false))) achievement,
      jsonb_build_object('rank',(SELECT name FROM public.ranks WHERE rank_number=st.stage),'level',(SELECT name FROM public.levels WHERE level_number=st.stage)) standing
    FROM public.ams_role_stages st
    LEFT JOIN public.trophies t ON t.conditions->>'role'=st.role AND (t.conditions->>'stage')::int=st.stage
    LEFT JOIN public.user_trophies ut ON ut.trophy_id=t.id AND ut.user_id=v_target
    LEFT JOIN public.awards aw ON aw.conditions->>'role'=st.role AND (aw.conditions->>'stage')::int=st.stage
    LEFT JOIN public.user_awards uaw ON uaw.award_id=aw.id AND uaw.user_id=v_target
    LEFT JOIN public.badges b ON b.conditions->>'role'=st.role AND (b.conditions->>'stage')::int=st.stage
    LEFT JOIN public.user_badges ub ON ub.badge_id=b.id AND ub.user_id=v_target
    LEFT JOIN public.achievements ac ON ac.conditions->>'role'=st.role AND (ac.conditions->>'stage')::int=st.stage
    LEFT JOIN public.user_achievements ua ON ua.achievement_id=ac.id AND ua.user_id=v_target
    LEFT JOIN public.ams_achievement_progress ap ON ap.achievement_id=ac.id AND ap.user_id=v_target AND ap.role=p_role
    WHERE st.role=p_role
  ) s;
  RETURN jsonb_build_object('ok',true,'role',p_role,'user_id',v_target,'total_xp',v_xp,'current_stage',v_stage,
    'passport',(SELECT jsonb_build_object('passport_no',passport_no,'verification_code',verification_code,'verification',verification,'issued_at',issued_at) FROM public.ams_passports WHERE user_id=v_target AND role=p_role),
    'stages',coalesce(v_chain,'[]'::jsonb));
END $$;
GRANT EXECUTE ON FUNCTION public.ams_role_chain(text,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.ams_verify_credential(p_code text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT coalesce(
    (SELECT jsonb_build_object('ok',true,'kind','passport','role',p.role,'number',p.passport_no,'status',p.verification,'issued_at',p.issued_at,'expires_at',p.expires_at,'stage',p.stage,'holder',coalesce(pr.display_name,pr.full_name,pr.username)) FROM public.ams_passports p LEFT JOIN public.profiles pr ON pr.id=p.user_id WHERE p.verification_code=upper(p_code) LIMIT 1),
    (SELECT jsonb_build_object('ok',true,'kind','certificate','role',c.role,'number',c.certificate_no,'title',c.title,'status',c.verification,'issued_at',c.issued_at,'expires_at',c.expires_at,'stage',c.stage,'holder',coalesce(pr.display_name,pr.full_name,pr.username)) FROM public.ams_certificates c LEFT JOIN public.profiles pr ON pr.id=c.user_id WHERE c.verification_code=upper(p_code) LIMIT 1),
    jsonb_build_object('ok',false,'reason','not_found'));
$$;
GRANT EXECUTE ON FUNCTION public.ams_verify_credential(text) TO anon,authenticated;

CREATE OR REPLACE FUNCTION public.ams_on_ticket_resolved()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF new.status::text IN ('resolved','closed') AND coalesce(old.status::text,'') NOT IN ('resolved','closed') AND new.assignee_id IS NOT NULL THEN
    PERFORM public.ams_ingest_event(new.assignee_id,'support.resolved','ams_tickets',new.id::text,1,coalesce(new.resolved_at,new.closed_at,now()),'trigger',jsonb_build_object('ticket_no',new.ticket_no));
  END IF;
  RETURN new;
EXCEPTION WHEN OTHERS THEN RETURN new;
END $$;
DROP TRIGGER IF EXISTS ams_ticket_resolved ON public.ams_tickets;
CREATE TRIGGER ams_ticket_resolved AFTER UPDATE ON public.ams_tickets FOR EACH ROW EXECUTE FUNCTION public.ams_on_ticket_resolved();

COMMENT ON TABLE public.ams_user_roles IS 'Exact AMS progression roles assigned from existing platform identity or verified business modules; separate from platform RBAC.';
COMMENT ON TABLE public.ams_role_progress IS 'Per-user, per-AMS-role XP, level, stage and rank state.';
COMMENT ON TABLE public.ams_achievement_progress IS 'Role-isolated achievement progress and lifecycle: locked, in progress, available, earned, verified or revoked.';