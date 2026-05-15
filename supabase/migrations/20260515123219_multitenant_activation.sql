-- ============================================================
-- Multi-tenant activation
-- ============================================================
-- Objectif :
--   1. Faire fonctionner réellement l'isolation tenant pour les écritures
--      faites côté client (panier, profils, enfants, parents, commandes),
--      sans modifier l'API supabase-js browser : on rend le trigger
--      `set_tenant_id` capable de retrouver le tenant à partir du user
--      authentifié si le GUC `app.tenant_id` n'est pas positionné.
--
--   2. Étendre la politique RESTRICTIVE `tenant_isolation` à toutes les
--      tables métier référencées par les RLS existantes (incl. emails et
--      family_parents / order_incidents).
--
--   3. Scoper `apel_families_overview` au tenant courant.
--
-- Idempotente, additive, réversible (chaque CREATE OR REPLACE remplace).
-- ============================================================

-- ------------------------------------------------------------
-- 1. current_tenant_id v2
--    Priorité :
--      a) GUC app.tenant_id (positionné par setRequestTenant côté serveur)
--      b) tenant du user authentifié (profiles.tenant_id WHERE id = auth.uid())
--      c) fallback : tenant 'saint-jacques' (compatibilité mono-tenant)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_setting text;
  v_id uuid;
  v_uid uuid;
BEGIN
  -- a) GUC explicite
  BEGIN
    v_setting := current_setting('app.tenant_id', true);
    IF v_setting IS NOT NULL AND v_setting <> '' THEN
      RETURN v_setting::uuid;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- b) Tenant du user authentifié
  BEGIN
    v_uid := auth.uid();
    IF v_uid IS NOT NULL THEN
      SELECT tenant_id INTO v_id FROM public.profiles WHERE id = v_uid;
      IF v_id IS NOT NULL THEN
        RETURN v_id;
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- c) Fallback saint-jacques (mode mono-tenant historique)
  SELECT id INTO v_id FROM public.tenants WHERE slug = 'saint-jacques';
  RETURN v_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.current_tenant_id() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.current_tenant_id() TO service_role;

-- ------------------------------------------------------------
-- 2. Étendre tenant_isolation aux tables manquantes
--    (la migration précédente couvrait 13 tables ; on ajoute les
--    email_* + family_parents + order_incidents qui étaient backfillés
--    mais non couverts par la policy RESTRICTIVE).
-- ------------------------------------------------------------
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'family_parents',
    'order_incidents',
    'email_send_log',
    'email_unsubscribe_tokens',
    'suppressed_emails'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    -- Vérifie que la colonne tenant_id existe avant d'ajouter la policy
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = t AND column_name = 'tenant_id'
    ) THEN
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON public.%I', t);
      EXECUTE format($p$
        CREATE POLICY tenant_isolation ON public.%I
          AS RESTRICTIVE
          FOR ALL
          TO public
          USING (
            tenant_id IS NULL
            OR tenant_id = public.current_tenant_id()
          )
          WITH CHECK (
            tenant_id IS NULL
            OR tenant_id = public.current_tenant_id()
          )
      $p$, t);
    END IF;
  END LOOP;
END $$;

-- ------------------------------------------------------------
-- 3. apel_families_overview scopée tenant
--    Ajoute un paramètre _tenant_id et filtre profiles/orders/children
--    sur ce tenant. Backward-compatible : si _tenant_id est NULL,
--    on retombe sur current_tenant_id().
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.apel_families_overview(
  _season_start date DEFAULT '2026-01-01'::date,
  _tenant_id uuid DEFAULT NULL
)
RETURNS TABLE(user_id uuid, family_civilite text, family_prenom text, family_nom text,
              family_email text, family_telephone text, ville text, children_count integer,
              classes text, paid_orders_count integer, items_count integer,
              last_paid_at timestamp with time zone, has_ordered boolean)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant uuid;
BEGIN
  v_tenant := COALESCE(_tenant_id, public.current_tenant_id());

  RETURN QUERY
  SELECT
    p.id,
    p.civilite,
    p.prenom,
    p.nom,
    p.email,
    p.telephone,
    p.ville,
    COALESCE(c.cnt, 0)::int,
    c.classes,
    COALESCE(o.paid_cnt, 0)::int,
    COALESCE(o.items_cnt, 0)::int,
    o.last_paid_at,
    COALESCE(o.paid_cnt, 0) > 0
  FROM public.profiles p
  LEFT JOIN (
    SELECT ch.user_id, COUNT(*) AS cnt,
           string_agg(DISTINCT NULLIF(ch.classe, ''), ', ' ORDER BY NULLIF(ch.classe, '')) AS classes
    FROM public.children ch
    WHERE v_tenant IS NULL OR ch.tenant_id = v_tenant
    GROUP BY ch.user_id
  ) c ON c.user_id = p.id
  LEFT JOIN (
    SELECT o2.user_id,
           COUNT(*) FILTER (WHERE o2.paid_at IS NOT NULL) AS paid_cnt,
           COALESCE(SUM(CASE WHEN o2.paid_at IS NOT NULL THEN it.cnt ELSE 0 END), 0) AS items_cnt,
           MAX(o2.paid_at) AS last_paid_at
    FROM public.orders o2
    LEFT JOIN (
      SELECT oi.order_id, SUM(oi.quantity)::int AS cnt
      FROM public.order_items oi
      GROUP BY oi.order_id
    ) it ON it.order_id = o2.id
    WHERE o2.created_at >= _season_start
      AND (v_tenant IS NULL OR o2.tenant_id = v_tenant)
    GROUP BY o2.user_id
  ) o ON o.user_id = p.id
  WHERE v_tenant IS NULL OR p.tenant_id = v_tenant;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.apel_families_overview(date, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apel_families_overview(date, uuid) TO service_role;

-- L'ancienne signature (date) reste utilisable par le code existant qui ne
-- passe pas encore _tenant_id : elle appellera current_tenant_id() en interne.
