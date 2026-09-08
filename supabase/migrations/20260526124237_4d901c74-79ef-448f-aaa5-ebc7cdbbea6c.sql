
REVOKE EXECUTE ON FUNCTION public.decrement_blouse_stock(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_blouse_stock(uuid) TO service_role;
