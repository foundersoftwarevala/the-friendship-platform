CREATE SEQUENCE IF NOT EXISTS public.ams_ticket_seq START 1001;
GRANT USAGE, SELECT ON SEQUENCE public.ams_ticket_seq TO authenticated, service_role;
DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='ams_status') THEN CREATE TYPE public.ams_status AS ENUM (
'draft','submitted','assigned','accepted','in_progress',
'waiting_customer','waiting_developer','waiting_qa','testing',
'resolved','closed','reopened','cancelled','archived'
); END IF; END $guard$;
DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='ams_priority') THEN CREATE TYPE public.ams_priority AS ENUM ('low','medium','high','critical'); END IF; END $guard$;
DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='ams_event_kind') THEN CREATE TYPE public.ams_event_kind AS ENUM (
'created','updated','status_changed','assigned','reassigned','transferred',
'commented','internal_note','escalated','resolved','closed','reopened',
'archived','restored','attachment_added','attachment_removed'
); END IF; END $guard$;
DO $guard$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='ams_chat_channel') THEN CREATE TYPE public.ams_chat_channel AS ENUM ('support','developer','qa','boss','ai','customer'); END IF; END $guard$;
CREATE TABLE IF NOT EXISTS public.ams_tickets (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
ticket_no text UNIQUE NOT NULL DEFAULT ('AMS-' || lpad(nextval('public.ams_ticket_seq')::text, 6, '0')),
subject text NOT NULL, description text,
product text, category text,
priority public.ams_priority NOT NULL DEFAULT 'medium',
status public.ams_status NOT NULL DEFAULT 'draft',
department text, team text,
expected_resolution_at timestamptz,
created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
assignee_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
customer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
tags text[] NOT NULL DEFAULT '{}',
metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
resolved_at timestamptz, closed_at timestamptz, deleted_at timestamptz,
created_at timestamptz NOT NULL DEFAULT now(),
updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ams_tickets_status_idx ON public.ams_tickets(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS ams_tickets_assignee_idx ON public.ams_tickets(assignee_id);
CREATE INDEX IF NOT EXISTS ams_tickets_creator_idx ON public.ams_tickets(created_by);
CREATE INDEX IF NOT EXISTS ams_tickets_priority_idx ON public.ams_tickets(priority);
CREATE INDEX IF NOT EXISTS ams_tickets_created_at_idx ON public.ams_tickets(created_at DESC);
CREATE OR REPLACE TRIGGER ams_tickets_touch BEFORE UPDATE ON public.ams_tickets FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ams_tickets TO authenticated;
GRANT ALL ON public.ams_tickets TO service_role;
ALTER TABLE public.ams_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ams_tickets read" ON public.ams_tickets;
CREATE POLICY "ams_tickets read" ON public.ams_tickets FOR SELECT TO authenticated USING (created_by = auth.uid() OR assignee_id = auth.uid() OR customer_id = auth.uid() OR public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "ams_tickets insert" ON public.ams_tickets;
CREATE POLICY "ams_tickets insert" ON public.ams_tickets FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
DROP POLICY IF EXISTS "ams_tickets update" ON public.ams_tickets;
CREATE POLICY "ams_tickets update" ON public.ams_tickets FOR UPDATE TO authenticated USING (created_by = auth.uid() OR assignee_id = auth.uid() OR public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "ams_tickets delete" ON public.ams_tickets;
CREATE POLICY "ams_tickets delete" ON public.ams_tickets FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));
CREATE TABLE IF NOT EXISTS public.ams_events (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
ticket_id uuid NOT NULL REFERENCES public.ams_tickets(id) ON DELETE CASCADE,
actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
kind public.ams_event_kind NOT NULL,
from_value text, to_value text,
payload jsonb NOT NULL DEFAULT '{}'::jsonb,
created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ams_events_ticket_idx ON public.ams_events(ticket_id, created_at DESC);
GRANT SELECT, INSERT ON public.ams_events TO authenticated;
GRANT ALL ON public.ams_events TO service_role;
ALTER TABLE public.ams_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ams_events read" ON public.ams_events;
CREATE POLICY "ams_events read" ON public.ams_events FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.ams_tickets t WHERE t.id = ticket_id));
DROP POLICY IF EXISTS "ams_events insert" ON public.ams_events;
CREATE POLICY "ams_events insert" ON public.ams_events FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid());
CREATE TABLE IF NOT EXISTS public.ams_comments (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
ticket_id uuid NOT NULL REFERENCES public.ams_tickets(id) ON DELETE CASCADE,
author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
body text NOT NULL,
is_internal boolean NOT NULL DEFAULT false,
created_at timestamptz NOT NULL DEFAULT now(),
updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ams_comments_ticket_idx ON public.ams_comments(ticket_id, created_at);
CREATE OR REPLACE TRIGGER ams_comments_touch BEFORE UPDATE ON public.ams_comments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ams_comments TO authenticated;
GRANT ALL ON public.ams_comments TO service_role;
ALTER TABLE public.ams_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ams_comments read" ON public.ams_comments;
CREATE POLICY "ams_comments read" ON public.ams_comments FOR SELECT TO authenticated USING (
EXISTS (SELECT 1 FROM public.ams_tickets t WHERE t.id = ticket_id
AND (t.created_by = auth.uid() OR t.assignee_id = auth.uid() OR t.customer_id = auth.uid() OR public.is_admin(auth.uid())))
AND (is_internal = false OR public.is_admin(auth.uid())
OR EXISTS (SELECT 1 FROM public.ams_tickets t2 WHERE t2.id = ticket_id AND t2.assignee_id = auth.uid()))
);
DROP POLICY IF EXISTS "ams_comments insert" ON public.ams_comments;
CREATE POLICY "ams_comments insert" ON public.ams_comments FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
DROP POLICY IF EXISTS "ams_comments update" ON public.ams_comments;
CREATE POLICY "ams_comments update" ON public.ams_comments FOR UPDATE TO authenticated USING (author_id = auth.uid());
DROP POLICY IF EXISTS "ams_comments delete" ON public.ams_comments;
CREATE POLICY "ams_comments delete" ON public.ams_comments FOR DELETE TO authenticated USING (author_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE TABLE IF NOT EXISTS public.ams_chat_messages (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
ticket_id uuid NOT NULL REFERENCES public.ams_tickets(id) ON DELETE CASCADE,
channel public.ams_chat_channel NOT NULL DEFAULT 'support',
author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
role text NOT NULL DEFAULT 'user',
body text NOT NULL,
pinned boolean NOT NULL DEFAULT false,
bookmarked boolean NOT NULL DEFAULT false,
metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ams_chat_ticket_idx ON public.ams_chat_messages(ticket_id, channel, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ams_chat_messages TO authenticated;
GRANT ALL ON public.ams_chat_messages TO service_role;
ALTER TABLE public.ams_chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ams_chat read" ON public.ams_chat_messages;
CREATE POLICY "ams_chat read" ON public.ams_chat_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.ams_tickets t WHERE t.id = ticket_id
AND (t.created_by = auth.uid() OR t.assignee_id = auth.uid() OR t.customer_id = auth.uid() OR public.is_admin(auth.uid()))));
DROP POLICY IF EXISTS "ams_chat insert" ON public.ams_chat_messages;
CREATE POLICY "ams_chat insert" ON public.ams_chat_messages FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid() OR author_id IS NULL);
DROP POLICY IF EXISTS "ams_chat update" ON public.ams_chat_messages;
CREATE POLICY "ams_chat update" ON public.ams_chat_messages FOR UPDATE TO authenticated USING (author_id = auth.uid() OR public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "ams_chat delete" ON public.ams_chat_messages;
CREATE POLICY "ams_chat delete" ON public.ams_chat_messages FOR DELETE TO authenticated USING (author_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE TABLE IF NOT EXISTS public.ams_attachments (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
ticket_id uuid NOT NULL REFERENCES public.ams_tickets(id) ON DELETE CASCADE,
uploader_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
file_name text NOT NULL,
file_size bigint NOT NULL DEFAULT 0,
mime_type text, url text NOT NULL,
created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ams_attachments_ticket_idx ON public.ams_attachments(ticket_id);
GRANT SELECT, INSERT, DELETE ON public.ams_attachments TO authenticated;
GRANT ALL ON public.ams_attachments TO service_role;
ALTER TABLE public.ams_attachments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ams_att read" ON public.ams_attachments;
CREATE POLICY "ams_att read" ON public.ams_attachments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.ams_tickets t WHERE t.id = ticket_id
AND (t.created_by = auth.uid() OR t.assignee_id = auth.uid() OR t.customer_id = auth.uid() OR public.is_admin(auth.uid()))));
DROP POLICY IF EXISTS "ams_att insert" ON public.ams_attachments;
CREATE POLICY "ams_att insert" ON public.ams_attachments FOR INSERT TO authenticated WITH CHECK (uploader_id = auth.uid());
DROP POLICY IF EXISTS "ams_att delete" ON public.ams_attachments;
CREATE POLICY "ams_att delete" ON public.ams_attachments FOR DELETE TO authenticated USING (uploader_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE TABLE IF NOT EXISTS public.chat_conversations (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
title text,
module text NOT NULL DEFAULT 'AMS',
allowed_roles text[] NOT NULL DEFAULT ARRAY['user','admin','super_admin']::text[],
created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
created_at timestamptz NOT NULL DEFAULT now(),
updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_conversations TO authenticated;
GRANT ALL ON public.chat_conversations TO service_role;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.chat_participants (
conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
role text NOT NULL DEFAULT 'user',
joined_at timestamptz NOT NULL DEFAULT now(),
PRIMARY KEY (conversation_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_participants TO authenticated;
GRANT ALL ON public.chat_participants TO service_role;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.chat_messages (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
body text NOT NULL,
metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS chat_messages_conv_created_idx ON public.chat_messages(conversation_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.is_chat_participant(_conv uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
SELECT EXISTS (
SELECT 1 FROM public.chat_participants
WHERE conversation_id = _conv AND user_id = _user
);
$$;
CREATE OR REPLACE FUNCTION public.can_post_in_chat(_conv uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
SELECT EXISTS (
SELECT 1
FROM public.chat_participants p
JOIN public.chat_conversations c ON c.id = p.conversation_id
WHERE p.conversation_id = _conv
AND p.user_id = _user
AND (
p.role = ANY (c.allowed_roles)
OR public.is_admin(_user)
)
);
$$;
DROP POLICY IF EXISTS "chat_conv_select_participants" ON public.chat_conversations;
CREATE POLICY "chat_conv_select_participants"
ON public.chat_conversations FOR SELECT TO authenticated
USING (public.is_chat_participant(id, auth.uid()));
DROP POLICY IF EXISTS "chat_conv_insert_self" ON public.chat_conversations;
CREATE POLICY "chat_conv_insert_self" ON public.chat_conversations FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());
DROP POLICY IF EXISTS "chat_conv_update_creator_or_admin" ON public.chat_conversations;
CREATE POLICY "chat_conv_update_creator_or_admin" ON public.chat_conversations FOR UPDATE TO authenticated
USING (created_by = auth.uid() OR public.is_admin(auth.uid()))
WITH CHECK (created_by = auth.uid() OR public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "chat_part_select_same_conv" ON public.chat_participants;
CREATE POLICY "chat_part_select_same_conv"
ON public.chat_participants FOR SELECT TO authenticated
USING (public.is_chat_participant(conversation_id, auth.uid()));
DROP POLICY IF EXISTS "chat_part_insert_creator_or_admin" ON public.chat_participants;
CREATE POLICY "chat_part_insert_creator_or_admin" ON public.chat_participants FOR INSERT TO authenticated
WITH CHECK (
public.is_admin(auth.uid())
OR EXISTS (
SELECT 1 FROM public.chat_conversations c
WHERE c.id = conversation_id AND c.created_by = auth.uid()
)
OR user_id = auth.uid()
);
DROP POLICY IF EXISTS "chat_part_delete_self_or_admin" ON public.chat_participants;
CREATE POLICY "chat_part_delete_self_or_admin" ON public.chat_participants FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "chat_msg_select_participants" ON public.chat_messages;
CREATE POLICY "chat_msg_select_participants"
ON public.chat_messages FOR SELECT TO authenticated
USING (public.is_chat_participant(conversation_id, auth.uid()));
DROP POLICY IF EXISTS "chat_msg_insert_authorized_role" ON public.chat_messages;
CREATE POLICY "chat_msg_insert_authorized_role" ON public.chat_messages FOR INSERT TO authenticated
WITH CHECK (
sender_id = auth.uid()
AND public.can_post_in_chat(conversation_id, auth.uid())
);
DROP POLICY IF EXISTS "chat_msg_delete_own_or_admin" ON public.chat_messages;
CREATE POLICY "chat_msg_delete_own_or_admin" ON public.chat_messages FOR DELETE TO authenticated
USING (sender_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE OR REPLACE TRIGGER chat_conversations_touch
BEFORE UPDATE ON public.chat_conversations
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE OR REPLACE FUNCTION public.bump_chat_conversation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
UPDATE public.chat_conversations SET updated_at = now() WHERE id = NEW.conversation_id;
RETURN NEW;
END; $$;
CREATE OR REPLACE TRIGGER chat_messages_bump_conv
AFTER INSERT ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.bump_chat_conversation();
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.chat_conversations REPLICA IDENTITY FULL;
ALTER TABLE public.chat_participants REPLICA IDENTITY FULL;
DO $p$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='chat_messages') THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages; END IF; END $p$;
DO $p$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='chat_conversations') THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations; END IF; END $p$;
DO $p$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='chat_participants') THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_participants; END IF; END $p$;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE base_handle text;
BEGIN
base_handle := COALESCE(NEW.raw_user_meta_data ->> 'username', NEW.raw_user_meta_data ->> 'handle',
NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''), 'user-' || substr(NEW.id::text, 1, 8));
INSERT INTO public.profiles (id, email, full_name, username, phone, handle, display_name, job_title)
VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name', base_handle, NEW.phone,
base_handle, COALESCE(NEW.raw_user_meta_data ->> 'full_name', base_handle),
NEW.raw_user_meta_data ->> 'job_title')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.user_roles (user_id, role)
VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data ->> 'role')::public.app_role, 'customer'))
ON CONFLICT DO NOTHING;
INSERT INTO public.user_xp (user_id, total_xp) VALUES (NEW.id, 0) ON CONFLICT DO NOTHING;
RETURN NEW;
END; $fn$;
INSERT INTO public.user_xp (user_id, total_xp)
SELECT p.id, 0 FROM public.profiles p
LEFT JOIN public.user_xp x ON x.user_id = p.id WHERE x.user_id IS NULL;