CREATE OR REPLACE FUNCTION public.apply_order_correction_stock(_correction_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c RECORD;
  i RECORD;
  target_remaining int;
BEGIN
  SELECT order_item_id, old_value, new_value INTO c
  FROM public.order_corrections
  WHERE id = _correction_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'correction not found';
  END IF;

  SELECT product_id INTO i
  FROM public.order_items
  WHERE id = c.order_item_id;

  IF i.product_id IS DISTINCT FROM 'blouse-officielle' THEN
    RETURN;
  END IF;

  SELECT remaining INTO target_remaining
  FROM public.blouse_stock
  WHERE size = c.new_value
  FOR UPDATE;

  IF target_remaining IS NULL OR target_remaining <= 0 THEN
    RAISE EXCEPTION 'stock_exhausted';
  END IF;

  UPDATE public.blouse_stock SET remaining = remaining - 1 WHERE size = c.new_value;
  UPDATE public.blouse_stock SET remaining = remaining + 1 WHERE size = c.old_value;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.apply_order_correction_stock(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_order_correction_stock(uuid) TO service_role;
