-- Paramètres globaux de livraison : date limite de commande groupée et frais fixes
-- appliqués aux commandes passées après cette date (livraison individuelle).
CREATE TABLE public.shipping_settings (
  id BOOLEAN NOT NULL DEFAULT true PRIMARY KEY CHECK (id),
  group_order_deadline TIMESTAMP WITH TIME ZONE,
  individual_shipping_fee NUMERIC NOT NULL DEFAULT 0,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

INSERT INTO public.shipping_settings (id) VALUES (true);

ALTER TABLE public.shipping_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read shipping settings"
  ON public.shipping_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can update shipping settings"
  ON public.shipping_settings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Mode et frais de livraison figés sur la commande au moment du checkout, indépendamment
-- d'une modification ultérieure des paramètres globaux.
ALTER TABLE public.orders ADD COLUMN delivery_type TEXT NOT NULL DEFAULT 'grouped';
ALTER TABLE public.orders ADD COLUMN shipping_fee NUMERIC NOT NULL DEFAULT 0;

-- Bordereau de livraison : mêmes garanties atomiques que order_invoices (compteur par
-- année verrouillé en transaction, contrainte UNIQUE sur order_id).
CREATE TABLE public.shipping_slip_counters (
  year INTEGER NOT NULL PRIMARY KEY,
  last_sequence INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE public.order_shipping_slips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id),
  slip_number TEXT NOT NULL UNIQUE,
  year INTEGER NOT NULL,
  sequence INTEGER NOT NULL,
  pdf_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.order_shipping_slips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all shipping slips"
  ON public.order_shipping_slips FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX order_shipping_slips_order_id_idx ON public.order_shipping_slips(order_id);

CREATE OR REPLACE FUNCTION public.reserve_order_shipping_slip_number(_order_id uuid)
RETURNS TABLE (slip_number text, slip_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_year integer := extract(year from now())::integer;
  next_seq integer;
  new_number text;
  new_slip_id uuid;
  existing record;
BEGIN
  SELECT s.slip_number, s.id INTO existing
  FROM public.order_shipping_slips s
  WHERE s.order_id = _order_id;

  IF FOUND THEN
    slip_number := existing.slip_number;
    slip_id := existing.id;
    RETURN NEXT;
    RETURN;
  END IF;

  INSERT INTO public.shipping_slip_counters (year, last_sequence)
  VALUES (current_year, 0)
  ON CONFLICT (year) DO NOTHING;

  UPDATE public.shipping_slip_counters
  SET last_sequence = last_sequence + 1
  WHERE year = current_year
  RETURNING last_sequence INTO next_seq;

  new_number := 'BL-' || current_year::text || '-' || lpad(next_seq::text, 5, '0');

  INSERT INTO public.order_shipping_slips (order_id, slip_number, year, sequence)
  VALUES (_order_id, new_number, current_year, next_seq)
  RETURNING id INTO new_slip_id;

  slip_number := new_number;
  slip_id := new_slip_id;
  RETURN NEXT;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reserve_order_shipping_slip_number(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_order_shipping_slip_number(uuid) TO service_role;

-- Bucket privé : bordereaux accessibles uniquement via URL signée générée côté serveur admin.
INSERT INTO storage.buckets (id, name, public) VALUES ('shipping-slips', 'shipping-slips', false);
