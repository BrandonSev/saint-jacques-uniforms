-- Hardening : la fonction est appelée uniquement par le trigger
-- set_order_number (SECURITY DEFINER). On révoque EXECUTE pour anon et
-- authenticated afin de ne pas l'exposer via l'API PostgREST.
REVOKE EXECUTE ON FUNCTION public.generate_order_number(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_order_number(uuid) FROM PUBLIC, anon, authenticated;