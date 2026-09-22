CREATE TABLE IF NOT EXISTS public.ams_recognition_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','reseller','franchise','author','vendor','affiliate','influencer','developer','creator','seo','support')),
  recognition_type text NOT NULL CHECK (recognition_type IN ('badge','medal','award','trophy','certificate','passport','seal','special')),
  asset_slug text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (achievement_id, recognition_type)
);
GRANT SELECT ON public.ams_recognition_mappings TO authenticated;
GRANT ALL ON public.ams_recognition_mappings TO service_role;
ALTER TABLE public.ams_recognition_mappings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ams_recognition_mappings_read ON public.ams_recognition_mappings;
CREATE POLICY ams_recognition_mappings_read ON public.ams_recognition_mappings FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS ams_recognition_mappings_write ON public.ams_recognition_mappings;
CREATE POLICY ams_recognition_mappings_write ON public.ams_recognition_mappings FOR ALL TO authenticated USING (public.ams_is_operator()) WITH CHECK (public.ams_is_operator());

CREATE TABLE IF NOT EXISTS public.ams_role_passports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','reseller','franchise','author','vendor','affiliate','influencer','developer','creator','seo','support')),
  passport_no text NOT NULL UNIQUE,
  verification_code text NOT NULL UNIQUE,
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  level integer NOT NULL DEFAULT 0,
  stage integer NOT NULL DEFAULT 0,
  rank integer NOT NULL DEFAULT 0,
  total_xp bigint NOT NULL DEFAULT 0,
  reputation numeric NOT NULL DEFAULT 0,
  verification text NOT NULL DEFAULT 'verified' CHECK (verification IN ('verified','pending','unverified','expired','revoked')),
  revoked_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.ams_role_passports TO authenticated;
GRANT ALL ON public.ams_role_passports TO service_role;
ALTER TABLE public.ams_role_passports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ams_role_passports_read ON public.ams_role_passports;
CREATE POLICY ams_role_passports_read ON public.ams_role_passports FOR SELECT TO authenticated USING (user_id=auth.uid() OR public.ams_is_operator());

GRANT SELECT ON public.ams_user_roles, public.ams_role_progress, public.ams_achievement_progress TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.ams_user_roles TO authenticated;
GRANT ALL ON public.ams_user_roles, public.ams_role_progress, public.ams_achievement_progress TO service_role;

CREATE OR REPLACE FUNCTION public.ams_verify_credential(p_code text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT coalesce(
    (SELECT jsonb_build_object('ok',true,'kind','passport','role',p.role,'number',p.passport_no,'status',p.verification,'issued_at',p.issued_at,'expires_at',p.expires_at,'stage',p.stage,'level',p.level,'rank',p.rank,'total_xp',p.total_xp,'holder',coalesce(pr.display_name,pr.full_name,pr.username)) FROM public.ams_role_passports p LEFT JOIN public.profiles pr ON pr.id=p.user_id WHERE p.verification_code=upper(p_code) LIMIT 1),
    (SELECT jsonb_build_object('ok',true,'kind','certificate','role',c.role,'number',c.certificate_no,'title',c.title,'status',c.verification,'issued_at',c.issued_at,'expires_at',c.expires_at,'stage',c.stage,'holder',coalesce(pr.display_name,pr.full_name,pr.username)) FROM public.ams_certificates c LEFT JOIN public.profiles pr ON pr.id=c.user_id WHERE c.verification_code=upper(p_code) LIMIT 1),
    jsonb_build_object('ok',false,'reason','not_found'));
$$;
GRANT EXECUTE ON FUNCTION public.ams_verify_credential(text) TO anon,authenticated;

COMMENT ON TABLE public.ams_recognition_mappings IS 'AMS Manager configuration mapping each real achievement to selected recognition assets.';
COMMENT ON TABLE public.ams_role_passports IS 'Persistent role-isolated digital passports derived from real AMS progression.';
COMMENT ON TABLE public.ams_passports IS 'DEPRECATED for AMS role progression: retained for compatibility; replaced by ams_role_passports.';