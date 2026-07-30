CREATE TABLE public.order_billing (
  order_id UUID NOT NULL PRIMARY KEY REFERENCES public.orders(id),
  billing_name TEXT,
  billing_address TEXT,
  billing_postal TEXT,
  billing_city TEXT,
  invoice_number TEXT,
  note TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.order_billing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all billing edits"
  ON public.order_billing FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert billing edits"
  ON public.order_billing FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update billing edits"
  ON public.order_billing FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
