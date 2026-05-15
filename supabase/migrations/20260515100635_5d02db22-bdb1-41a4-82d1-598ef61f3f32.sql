
-- ============================================================
-- A. Email queue helpers: SET search_path + restrict execution
-- ============================================================
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;

-- ============================================================
-- B. Private schema for non-exposed SECURITY DEFINER helpers
-- ============================================================
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, anon, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

REVOKE EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

-- ============================================================
-- C. Recreate every RLS policy that references has_role(...)
--    to point at private.has_role(...)
-- ============================================================
DO $$
DECLARE
  r record;
  new_qual text;
  new_check text;
  cmd_kw text;
  roles_str text;
  stmt text;
BEGIN
  FOR r IN
    SELECT n.nspname AS schemaname,
           c.relname AS tablename,
           p.polname AS policyname,
           p.polcmd,
           p.polpermissive,
           p.polroles,
           pg_get_expr(p.polqual, p.polrelid) AS qual,
           pg_get_expr(p.polwithcheck, p.polrelid) AS with_check
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pg_get_expr(p.polqual, p.polrelid) LIKE '%has_role(%'
       OR pg_get_expr(p.polwithcheck, p.polrelid) LIKE '%has_role(%'
  LOOP
    -- Replace bare has_role( references with private.has_role(
    -- (preserve existing private. or public. qualifiers)
    new_qual := regexp_replace(coalesce(r.qual, ''), '(?<![\.\w])has_role\(', 'private.has_role(', 'g');
    new_check := regexp_replace(coalesce(r.with_check, ''), '(?<![\.\w])has_role\(', 'private.has_role(', 'g');
    -- Also handle existing public.has_role explicit references
    new_qual := replace(new_qual, 'public.has_role(', 'private.has_role(');
    new_check := replace(new_check, 'public.has_role(', 'private.has_role(');

    cmd_kw := CASE r.polcmd
                WHEN 'r' THEN 'SELECT'
                WHEN 'a' THEN 'INSERT'
                WHEN 'w' THEN 'UPDATE'
                WHEN 'd' THEN 'DELETE'
                WHEN '*' THEN 'ALL'
              END;

    SELECT string_agg(quote_ident(rolname), ', ')
      INTO roles_str
      FROM pg_roles
     WHERE oid = ANY(r.polroles);
    IF roles_str IS NULL THEN
      roles_str := 'PUBLIC';
    END IF;

    EXECUTE format('DROP POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);

    stmt := format('CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s',
                   r.policyname,
                   r.schemaname,
                   r.tablename,
                   CASE WHEN r.polpermissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END,
                   cmd_kw,
                   roles_str);
    IF r.qual IS NOT NULL THEN
      stmt := stmt || ' USING (' || new_qual || ')';
    END IF;
    IF r.with_check IS NOT NULL THEN
      stmt := stmt || ' WITH CHECK (' || new_check || ')';
    END IF;
    EXECUTE stmt;
  END LOOP;
END $$;

-- ============================================================
-- D. Refactor apel_families_overview
--    Authorization is now handled in TypeScript before the call.
--    Function is service_role-only; remove the auth.uid() gate
--    (which always returned NULL when invoked via service_role).
-- ============================================================
CREATE OR REPLACE FUNCTION public.apel_families_overview(_season_start date DEFAULT '2026-01-01'::date)
RETURNS TABLE(user_id uuid, family_civilite text, family_prenom text, family_nom text,
              family_email text, family_telephone text, ville text, children_count integer,
              classes text, paid_orders_count integer, items_count integer,
              last_paid_at timestamp with time zone, has_ordered boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id AS user_id,
    p.civilite,
    p.prenom,
    p.nom,
    p.email,
    p.telephone,
    p.ville,
    COALESCE(c.cnt, 0)::int AS children_count,
    c.classes,
    COALESCE(o.paid_cnt, 0)::int AS paid_orders_count,
    COALESCE(o.items_cnt, 0)::int AS items_count,
    o.last_paid_at,
    COALESCE(o.paid_cnt, 0) > 0 AS has_ordered
  FROM public.profiles p
  LEFT JOIN (
    SELECT user_id, COUNT(*) AS cnt,
           string_agg(DISTINCT NULLIF(classe, ''), ', ' ORDER BY NULLIF(classe, '')) AS classes
    FROM public.children
    GROUP BY user_id
  ) c ON c.user_id = p.id
  LEFT JOIN (
    SELECT o.user_id,
           COUNT(*) FILTER (WHERE o.paid_at IS NOT NULL) AS paid_cnt,
           COALESCE(SUM(CASE WHEN o.paid_at IS NOT NULL THEN it.cnt ELSE 0 END), 0) AS items_cnt,
           MAX(o.paid_at) AS last_paid_at
    FROM public.orders o
    LEFT JOIN (
      SELECT order_id, SUM(quantity)::int AS cnt
      FROM public.order_items GROUP BY order_id
    ) it ON it.order_id = o.id
    WHERE o.created_at >= _season_start
    GROUP BY o.user_id
  ) o ON o.user_id = p.id
$$;

REVOKE EXECUTE ON FUNCTION public.apel_families_overview(date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apel_families_overview(date) TO service_role;

-- ============================================================
-- E. Restrict current_tenant_id (called by trigger as SECURITY DEFINER)
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.current_tenant_id() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.current_tenant_id() TO service_role;

-- ============================================================
-- F. Drop the now-unused public.has_role
-- ============================================================
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
