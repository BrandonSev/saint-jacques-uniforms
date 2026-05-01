CREATE TABLE public.order_incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  order_item_id UUID NOT NULL,
  user_id UUID NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  incident_type TEXT NOT NULL,
  description TEXT NOT NULL,
  eligible BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'En attente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.order_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own incidents"
  ON public.order_incidents FOR INSERT
  WITH CHECK (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()
  ));

CREATE POLICY "Users can view own incidents"
  ON public.order_incidents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all incidents"
  ON public.order_incidents FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX order_incidents_order_id_idx ON public.order_incidents(order_id);
CREATE INDEX order_incidents_user_id_idx ON public.order_incidents(user_id);