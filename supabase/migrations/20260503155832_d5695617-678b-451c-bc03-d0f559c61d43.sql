CREATE POLICY "Admins can update incidents"
ON public.order_incidents
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));