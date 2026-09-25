
CREATE TABLE public.blouse_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  size text NOT NULL UNIQUE,
  remaining integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.blouse_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view blouse stock"
  ON public.blouse_stock FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert blouse stock"
  ON public.blouse_stock FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update blouse stock"
  ON public.blouse_stock FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete blouse stock"
  ON public.blouse_stock FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_blouse_stock_updated_at
  BEFORE UPDATE ON public.blouse_stock
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.blouse_stock (size, remaining) VALUES
  ('3 ans', 0),
  ('4 ans', 32),
  ('6 ans', 32),
  ('8 ans', 40),
  ('10 ans', 52),
  ('12 ans', 39),
  ('14 ans', 10),
  ('16 ans', 3),
  ('18 ans', 1);

CREATE OR REPLACE FUNCTION public.decrement_blouse_stock(_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT size, SUM(quantity)::int AS qty
    FROM public.order_items
    WHERE order_id = _order_id
      AND product_id = 'blouse-officielle'
    GROUP BY size
  LOOP
    UPDATE public.blouse_stock
      SET remaining = GREATEST(0, remaining - r.qty)
      WHERE size = r.size;
  END LOOP;
END;
$$;
