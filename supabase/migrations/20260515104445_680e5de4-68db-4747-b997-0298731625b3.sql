ALTER TABLE public.delivery_options DROP CONSTRAINT IF EXISTS delivery_options_code_key;
CREATE UNIQUE INDEX IF NOT EXISTS delivery_options_tenant_code_key
  ON public.delivery_options (tenant_id, code);