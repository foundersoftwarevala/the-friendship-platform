CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
SELECT EXISTS (
SELECT 1 FROM public.user_roles
WHERE user_id = _user_id
AND role IN ('admin','super_admin','boss','boss_owner','founder')
)
$fn$;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;
DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='rarity_tier') THEN CREATE TYPE public.rarity_tier AS ENUM ('common', 'rare', 'epic', 'legendary', 'mythic'); END IF; END $guard$;
DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='trophy_tier') THEN CREATE TYPE public.trophy_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum'); END IF; END $guard$;
DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='entity_status') THEN CREATE TYPE public.entity_status AS ENUM ('active', 'inactive', 'archived', 'draft'); END IF; END $guard$;
DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='mission_cadence') THEN CREATE TYPE public.mission_cadence AS ENUM ('daily', 'weekly', 'monthly', 'seasonal'); END IF; END $guard$;
DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='claim_status') THEN CREATE TYPE public.claim_status AS ENUM ('pending', 'approved', 'rejected', 'fulfilled'); END IF; END $guard$;
DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='wallet_kind') THEN CREATE TYPE public.wallet_kind AS ENUM ('coins', 'tokens', 'rewards'); END IF; END $guard$;
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $fn$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $fn$;
CREATE TABLE IF NOT EXISTS public.achievement_categories (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, description TEXT,
icon TEXT, color TEXT, sort_order INT DEFAULT 0,
status public.entity_status NOT NULL DEFAULT 'active',
created_by UUID REFERENCES auth.users(id),
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.badge_collections (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, description TEXT,
icon TEXT, color TEXT,
status public.entity_status NOT NULL DEFAULT 'active',
created_by UUID REFERENCES auth.users(id),
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.achievements (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, description TEXT,
category_id UUID REFERENCES public.achievement_categories(id) ON DELETE SET NULL,
rarity public.rarity_tier NOT NULL DEFAULT 'common',
icon TEXT, color TEXT, image_url TEXT,
xp_reward INT NOT NULL DEFAULT 0,
conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
rewards JSONB NOT NULL DEFAULT '[]'::jsonb,
status public.entity_status NOT NULL DEFAULT 'active',
is_secret BOOLEAN NOT NULL DEFAULT false,
sort_order INT DEFAULT 0,
created_by UUID REFERENCES auth.users(id),
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.badges (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, description TEXT,
collection_id UUID REFERENCES public.badge_collections(id) ON DELETE SET NULL,
rarity public.rarity_tier NOT NULL DEFAULT 'common',
icon TEXT, color TEXT, image_url TEXT,
conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
status public.entity_status NOT NULL DEFAULT 'active',
created_by UUID REFERENCES auth.users(id),
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.trophies (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, description TEXT,
tier public.trophy_tier NOT NULL DEFAULT 'bronze',
icon TEXT, color TEXT, image_url TEXT,
conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
status public.entity_status NOT NULL DEFAULT 'active',
created_by UUID REFERENCES auth.users(id),
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.xp_sources (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL,
description TEXT, default_xp INT NOT NULL DEFAULT 0,
status public.entity_status NOT NULL DEFAULT 'active',
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.xp_rules (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
name TEXT NOT NULL, description TEXT,
source_id UUID REFERENCES public.xp_sources(id) ON DELETE CASCADE,
xp_value INT NOT NULL DEFAULT 0,
multiplier NUMERIC NOT NULL DEFAULT 1.0,
conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
cooldown_seconds INT DEFAULT 0, max_per_day INT,
status public.entity_status NOT NULL DEFAULT 'active',
created_by UUID REFERENCES auth.users(id),
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.levels (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
level_number INT NOT NULL UNIQUE, name TEXT NOT NULL,
xp_required INT NOT NULL, rewards JSONB NOT NULL DEFAULT '[]'::jsonb,
icon TEXT, color TEXT,
status public.entity_status NOT NULL DEFAULT 'active',
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.ranks (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
rank_number INT NOT NULL UNIQUE, name TEXT NOT NULL, min_xp INT NOT NULL,
benefits JSONB NOT NULL DEFAULT '[]'::jsonb,
icon TEXT, color TEXT,
status public.entity_status NOT NULL DEFAULT 'active',
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.user_xp (
user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
total_xp BIGINT NOT NULL DEFAULT 0,
current_level INT NOT NULL DEFAULT 1,
current_rank INT NOT NULL DEFAULT 1,
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.xp_transactions (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
amount INT NOT NULL,
source_id UUID REFERENCES public.xp_sources(id) ON DELETE SET NULL,
rule_id UUID REFERENCES public.xp_rules(id) ON DELETE SET NULL,
reason TEXT, metadata JSONB DEFAULT '{}'::jsonb,
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_xp_tx_user ON public.xp_transactions(user_id, created_at DESC);
CREATE TABLE IF NOT EXISTS public.user_achievements (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
progress NUMERIC NOT NULL DEFAULT 0, unlocked_at TIMESTAMPTZ,
metadata JSONB DEFAULT '{}'::jsonb,
UNIQUE (user_id, achievement_id)
);
CREATE TABLE IF NOT EXISTS public.user_badges (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
UNIQUE (user_id, badge_id)
);
CREATE TABLE IF NOT EXISTS public.user_trophies (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
trophy_id UUID NOT NULL REFERENCES public.trophies(id) ON DELETE CASCADE,
earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
UNIQUE (user_id, trophy_id)
);
CREATE TABLE IF NOT EXISTS public.user_streaks (
user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
current_streak INT NOT NULL DEFAULT 0,
longest_streak INT NOT NULL DEFAULT 0,
last_active_date DATE,
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
CREATE TABLE IF NOT EXISTS public.seasons (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, description TEXT,
starts_at TIMESTAMPTZ NOT NULL, ends_at TIMESTAMPTZ NOT NULL,
theme JSONB DEFAULT '{}'::jsonb,
status public.entity_status NOT NULL DEFAULT 'active',
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.campaigns (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, description TEXT,
starts_at TIMESTAMPTZ, ends_at TIMESTAMPTZ,
rewards JSONB DEFAULT '[]'::jsonb,
status public.entity_status NOT NULL DEFAULT 'active',
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.events (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, description TEXT,
starts_at TIMESTAMPTZ, ends_at TIMESTAMPTZ,
rewards JSONB DEFAULT '[]'::jsonb,
status public.entity_status NOT NULL DEFAULT 'active',
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.missions (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
name TEXT NOT NULL, description TEXT,
cadence public.mission_cadence NOT NULL DEFAULT 'daily',
season_id UUID REFERENCES public.seasons(id) ON DELETE SET NULL,
conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
rewards JSONB NOT NULL DEFAULT '[]'::jsonb,
xp_reward INT NOT NULL DEFAULT 0,
starts_at TIMESTAMPTZ, ends_at TIMESTAMPTZ,
status public.entity_status NOT NULL DEFAULT 'active',
created_by UUID REFERENCES auth.users(id),
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.quests (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
name TEXT NOT NULL, description TEXT,
steps JSONB NOT NULL DEFAULT '[]'::jsonb,
rewards JSONB NOT NULL DEFAULT '[]'::jsonb,
xp_reward INT NOT NULL DEFAULT 0,
status public.entity_status NOT NULL DEFAULT 'active',
created_by UUID REFERENCES auth.users(id),
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.challenges (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
name TEXT NOT NULL, description TEXT,
conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
rewards JSONB NOT NULL DEFAULT '[]'::jsonb,
xp_reward INT NOT NULL DEFAULT 0,
starts_at TIMESTAMPTZ, ends_at TIMESTAMPTZ,
status public.entity_status NOT NULL DEFAULT 'active',
created_by UUID REFERENCES auth.users(id),
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.user_mission_progress (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
progress NUMERIC NOT NULL DEFAULT 0,
completed_at TIMESTAMPTZ, period_key TEXT,
UNIQUE (user_id, mission_id, period_key)
);
CREATE TABLE IF NOT EXISTS public.rewards (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, description TEXT,
cost_coins INT NOT NULL DEFAULT 0, cost_tokens INT NOT NULL DEFAULT 0,
stock INT, image_url TEXT, icon TEXT,
eligibility JSONB NOT NULL DEFAULT '{}'::jsonb,
rarity public.rarity_tier NOT NULL DEFAULT 'common',
status public.entity_status NOT NULL DEFAULT 'active',
created_by UUID REFERENCES auth.users(id),
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.reward_wallets (
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
kind public.wallet_kind NOT NULL,
balance BIGINT NOT NULL DEFAULT 0,
updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
PRIMARY KEY (user_id, kind)
);
CREATE TABLE IF NOT EXISTS public.claims (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE RESTRICT,
status public.claim_status NOT NULL DEFAULT 'pending',
cost_coins INT NOT NULL DEFAULT 0, cost_tokens INT NOT NULL DEFAULT 0,
notes TEXT, decided_by UUID REFERENCES auth.users(id),
decided_at TIMESTAMPTZ, fulfilled_at TIMESTAMPTZ,
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_claims_user ON public.claims(user_id, created_at DESC);
CREATE TABLE IF NOT EXISTS public.leaderboard_definitions (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, description TEXT,
scope TEXT NOT NULL DEFAULT 'global', scope_value TEXT,
metric TEXT NOT NULL DEFAULT 'xp',
formula JSONB DEFAULT '{}'::jsonb,
refresh_minutes INT NOT NULL DEFAULT 15,
status public.entity_status NOT NULL DEFAULT 'active',
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.leaderboard_entries (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
definition_id UUID NOT NULL REFERENCES public.leaderboard_definitions(id) ON DELETE CASCADE,
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
rank INT NOT NULL, score BIGINT NOT NULL DEFAULT 0,
computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
UNIQUE (definition_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_lb_def_rank ON public.leaderboard_entries(definition_id, rank);
CREATE TABLE IF NOT EXISTS public.notification_templates (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
key TEXT UNIQUE NOT NULL,
title_template TEXT NOT NULL, body_template TEXT NOT NULL,
channel TEXT NOT NULL DEFAULT 'in_app',
status public.entity_status NOT NULL DEFAULT 'active',
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.notification_rules (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
name TEXT NOT NULL, trigger TEXT NOT NULL,
template_id UUID REFERENCES public.notification_templates(id) ON DELETE SET NULL,
conditions JSONB DEFAULT '{}'::jsonb,
status public.entity_status NOT NULL DEFAULT 'active',
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.notifications (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
title TEXT NOT NULL, body TEXT,
kind TEXT NOT NULL DEFAULT 'info',
read_at TIMESTAMPTZ, data JSONB DEFAULT '{}'::jsonb,
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE TABLE IF NOT EXISTS public.activity_logs (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
activity TEXT NOT NULL, metadata JSONB DEFAULT '{}'::jsonb,
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_user ON public.activity_logs(user_id, created_at DESC);
CREATE TABLE IF NOT EXISTS public.analytics_events (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
event_type TEXT NOT NULL, payload JSONB DEFAULT '{}'::jsonb,
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_analytics_event ON public.analytics_events(event_type, created_at DESC);
CREATE TABLE IF NOT EXISTS public.ai_prompts (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
key TEXT UNIQUE NOT NULL, name TEXT NOT NULL, prompt TEXT NOT NULL,
model TEXT NOT NULL DEFAULT 'google/gemini-3-flash-preview',
config JSONB DEFAULT '{}'::jsonb,
status public.entity_status NOT NULL DEFAULT 'active',
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
DO $do$ DECLARE t TEXT; BEGIN
FOR t IN SELECT unnest(ARRAY[
'achievement_categories','badge_collections','achievements','badges','trophies',
'xp_sources','xp_rules','levels','ranks','user_xp','xp_transactions',
'user_achievements','user_badges','user_trophies','user_streaks',
'seasons','campaigns','events','missions','quests','challenges','user_mission_progress',
'rewards','reward_wallets','claims',
'leaderboard_definitions','leaderboard_entries',
'notification_templates','notification_rules','notifications',
'activity_logs','analytics_events',
'ai_prompts'
]) LOOP
EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated;', t);
EXECUTE format('GRANT ALL ON public.%I TO service_role;', t);
EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
END LOOP;
END $do$;
DO $do$ DECLARE t TEXT; BEGIN
FOR t IN SELECT unnest(ARRAY[
'achievement_categories','badge_collections','achievements','badges','trophies',
'xp_sources','xp_rules','levels','ranks',
'seasons','campaigns','events','missions','quests','challenges',
'rewards','claims',
'leaderboard_definitions','notification_templates','notification_rules',
'ai_prompts'
]) LOOP
EXECUTE format('CREATE OR REPLACE TRIGGER trg_%I_touch BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();', t, t);
END LOOP;
END $do$;