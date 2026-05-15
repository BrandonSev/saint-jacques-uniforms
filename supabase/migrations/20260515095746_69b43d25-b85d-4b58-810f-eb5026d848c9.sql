-- Phase 3 — Auto-fill tenant_id on INSERT
-- Triggers BEFORE INSERT, fallback safe vers saint-jacques.

-- =========================================
-- 1. Fonction current_tenant_id()
-- =========================================
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
BEGIN
  -- 1. Tente de lire le tenant injecté par la couche serveur (GUC de session)
  BEGIN
    v_setting := current_setting('app.tenant_id', true);
    IF v_setting IS NOT NULL AND v_setting <> '' THEN
      RETURN v_setting::uuid;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- ignore et tombe sur le fallback
    NULL;
  END;

  -- 2. Fallback : tenant par défaut saint-jacques
  SELECT id INTO v_id FROM public.tenants WHERE slug = 'saint-jacques';
  RETURN v_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.current_tenant_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_tenant_id() TO authenticated, service_role;

-- =========================================
-- 2. Fonction trigger set_tenant_id()
-- =========================================
CREATE OR REPLACE FUNCTION public.set_tenant_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := public.current_tenant_id();
  END IF;
  RETURN NEW;
END;
$$;

-- =========================================
-- 3. Application des triggers sur les 14 tables
-- =========================================
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'profiles', 'children', 'family_parents',
    'orders', 'order_items', 'order_status_history', 'order_incidents',
    'delivery_options', 'client_counters', 'order_sequences',
    'user_roles', 'email_send_log', 'email_unsubscribe_tokens', 'suppressed_emails'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_set_tenant_id ON public.%I', t);
    EXECUTE format(
      'CREATE TRIGGER trg_set_tenant_id BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id()',
      t
    );
  END LOOP;
END $$;