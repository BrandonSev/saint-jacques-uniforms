-- Phase 5 : politique RESTRICTIVE d'isolation tenant.
-- S'ajoute (via AND) aux politiques permissives existantes.

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'children',
    'client_counters',
    'delivery_options',
    'family_parents',
    'order_incidents',
    'order_items',
    'order_sequences',
    'order_status_history',
    'orders',
    'product_sizes',
    'products',
    'profiles',
    'user_roles'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
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
  END LOOP;
END $$;