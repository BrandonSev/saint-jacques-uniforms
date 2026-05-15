-- Harden Phase 3 functions: revoke direct execute from public/anon/authenticated.
-- Triggers continue à fonctionner (le owner de la fonction est utilisé via SECURITY DEFINER).

REVOKE EXECUTE ON FUNCTION public.current_tenant_id() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_tenant_id()     FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.current_tenant_id() TO service_role;
GRANT EXECUTE ON FUNCTION public.set_tenant_id()     TO service_role;