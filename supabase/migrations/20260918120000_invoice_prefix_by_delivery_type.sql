-- Les factures des commandes individuelles (livrées au domicile de la famille) et des
-- commandes groupées (livrées à l'établissement) doivent être numérotées séparément :
-- préfixe FU-B (Boutique) pour les individuelles, FU-BE (Boutique-École) pour les groupées.
-- Chaque préfixe a sa propre séquence, indépendante de l'autre, remise à zéro chaque année.
-- Les factures déjà émises sous l'ancien préfixe FA- ne sont pas renumérotées.

ALTER TABLE public.invoice_counters DROP CONSTRAINT invoice_counters_pkey;
ALTER TABLE public.invoice_counters ADD COLUMN prefix TEXT NOT NULL DEFAULT 'FA';
ALTER TABLE public.invoice_counters ADD PRIMARY KEY (year, prefix);

CREATE OR REPLACE FUNCTION public.reserve_order_invoice_number(_order_id uuid)
RETURNS TABLE (invoice_number text, invoice_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_year integer := extract(year from now())::integer;
  order_delivery_type text;
  inv_prefix text;
  next_seq integer;
  new_number text;
  new_invoice_id uuid;
  existing record;
BEGIN
  SELECT oi.invoice_number, oi.id INTO existing
  FROM public.order_invoices oi
  WHERE oi.order_id = _order_id;

  IF FOUND THEN
    invoice_number := existing.invoice_number;
    invoice_id := existing.id;
    RETURN NEXT;
    RETURN;
  END IF;

  SELECT o.delivery_type INTO order_delivery_type
  FROM public.orders o
  WHERE o.id = _order_id;

  inv_prefix := CASE WHEN order_delivery_type = 'individual' THEN 'FU-B' ELSE 'FU-BE' END;

  INSERT INTO public.invoice_counters (year, prefix, last_sequence)
  VALUES (current_year, inv_prefix, 0)
  ON CONFLICT (year, prefix) DO NOTHING;

  UPDATE public.invoice_counters
  SET last_sequence = last_sequence + 1
  WHERE year = current_year AND prefix = inv_prefix
  RETURNING last_sequence INTO next_seq;

  new_number := inv_prefix || '-' || current_year::text || '-' || lpad(next_seq::text, 5, '0');

  INSERT INTO public.order_invoices (order_id, invoice_number, year, sequence)
  VALUES (_order_id, new_number, current_year, next_seq)
  RETURNING id INTO new_invoice_id;

  invoice_number := new_number;
  invoice_id := new_invoice_id;
  RETURN NEXT;
END;
$$;
