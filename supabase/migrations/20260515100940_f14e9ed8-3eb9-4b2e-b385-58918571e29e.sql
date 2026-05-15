
CREATE OR REPLACE FUNCTION public.set_request_tenant(_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifie que le tenant existe et est actif avant de le positionner,
  -- pour éviter qu'un appelant injecte un UUID arbitraire.
  IF _tenant_id IS NULL THEN
    PERFORM set_config('app.tenant_id', '', true);
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.tenants WHERE id = _tenant_id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Unknown or inactive tenant: %', _tenant_id
      USING ERRCODE = '22023';
  END IF;

  PERFORM set_config('app.tenant_id', _tenant_id::text, true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_request_tenant(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_request_tenant(uuid) TO service_role;
