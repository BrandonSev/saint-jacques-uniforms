CREATE TABLE public.order_refunds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id),
  order_item_ids UUID[] NOT NULL DEFAULT '{}',
  amount NUMERIC(10,2) NOT NULL,
  reason TEXT,
  payplug_refund_id TEXT,
  status TEXT NOT NULL DEFAULT 'Réussi',
  error_message TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.order_refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all refunds"
  ON public.order_refunds FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert refunds"
  ON public.order_refunds FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update refunds"
  ON public.order_refunds FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX order_refunds_order_id_idx ON public.order_refunds(order_id);
CREATE INDEX order_refunds_status_idx ON public.order_refunds(status);
