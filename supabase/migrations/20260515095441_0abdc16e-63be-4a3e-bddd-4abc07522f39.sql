-- Phase 2 — Add tenant_id (nullable) + backfill + indexes
-- Additive, non bloquant. RLS inchangé.

DO $$
DECLARE
  sj_id uuid;
  t text;
  tables text[] := ARRAY[
    'profiles', 'children', 'family_parents',
    'orders', 'order_items', 'order_status_history', 'order_incidents',
    'delivery_options', 'client_counters', 'order_sequences',
    'user_roles', 'email_send_log', 'email_unsubscribe_tokens', 'suppressed_emails'
  ];
BEGIN
  SELECT id INTO sj_id FROM public.tenants WHERE slug = 'saint-jacques';
  IF sj_id IS NULL THEN
    RAISE EXCEPTION 'Tenant saint-jacques introuvable. Lancer Phase 1 d''abord.';
  END IF;

  FOREACH t IN ARRAY tables LOOP
    -- 1. Ajout colonne tenant_id nullable
    EXECUTE format(
      'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE RESTRICT',
      t
    );

    -- 2. Backfill vers saint-jacques
    EXECUTE format(
      'UPDATE public.%I SET tenant_id = $1 WHERE tenant_id IS NULL',
      t
    ) USING sj_id;

    -- 3. Index sur tenant_id
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON public.%I(tenant_id)',
      'idx_' || t || '_tenant_id', t
    );
  END LOOP;
END $$;