CREATE TABLE public.order_corrections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id),
  order_item_id UUID NOT NULL REFERENCES public.order_items(id),
  field TEXT NOT NULL DEFAULT 'size',
  old_value TEXT NOT NULL,
  new_value TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'À traiter',
  note TEXT,
  requester_email TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.order_corrections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all corrections"
  ON public.order_corrections FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert corrections"
  ON public.order_corrections FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update corrections"
  ON public.order_corrections FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update order items size"
  ON public.order_items FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX order_corrections_order_id_idx ON public.order_corrections(order_id);
CREATE INDEX order_corrections_status_idx ON public.order_corrections(status);
