-- Compteur de numérotation comptable par année civile (remise à zéro chaque 1er janvier).
CREATE TABLE public.invoice_counters (
  year INTEGER NOT NULL PRIMARY KEY,
  last_sequence INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE public.order_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id),
  invoice_number TEXT NOT NULL UNIQUE,
  year INTEGER NOT NULL,
  sequence INTEGER NOT NULL,
  pdf_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.order_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all invoices"
  ON public.order_invoices FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX order_invoices_order_id_idx ON public.order_invoices(order_id);

-- Réservation atomique du numéro de facture : verrouille le compteur de l'année en cours,
-- l'incrémente, et insère la ligne order_invoices dans la même transaction. La contrainte
-- UNIQUE sur order_id empêche qu'une commande obtienne deux numéros (pas de régénération) ;
-- le verrou FOR UPDATE sur invoice_counters empêche deux appels concurrents d'obtenir la
-- même séquence (pas de doublon ni de trou dans la numérotation comptable).
CREATE OR REPLACE FUNCTION public.reserve_order_invoice_number(_order_id uuid)
RETURNS TABLE (invoice_number text, invoice_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_year integer := extract(year from now())::integer;
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

  INSERT INTO public.invoice_counters (year, last_sequence)
  VALUES (current_year, 0)
  ON CONFLICT (year) DO NOTHING;

  UPDATE public.invoice_counters
  SET last_sequence = last_sequence + 1
  WHERE year = current_year
  RETURNING last_sequence INTO next_seq;

  new_number := 'FA-' || current_year::text || '-' || lpad(next_seq::text, 5, '0');

  INSERT INTO public.order_invoices (order_id, invoice_number, year, sequence)
  VALUES (_order_id, new_number, current_year, next_seq)
  RETURNING id INTO new_invoice_id;

  invoice_number := new_number;
  invoice_id := new_invoice_id;
  RETURN NEXT;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reserve_order_invoice_number(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_order_invoice_number(uuid) TO service_role;

-- Bucket privé : les factures ne sont accessibles que via URL signée générée côté serveur admin.
INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', false);
