-- Fonction : quantité de blouses à produire par taille, pour les commandes
-- effectivement payées et non annulées/remboursées. Réservée aux admins.
CREATE OR REPLACE FUNCTION public.blouse_production_by_size()
RETURNS TABLE (
  size text,
  quantity integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    oi.size,
    SUM(oi.quantity)::int AS quantity
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  WHERE oi.product_id = 'blouse-officielle'
    AND o.paid_at IS NOT NULL
    AND o.status NOT IN ('Annulée', 'Remboursée')
    AND public.has_role(auth.uid(), 'admin'::app_role)
  GROUP BY oi.size
  ORDER BY oi.size;
$$;

REVOKE ALL ON FUNCTION public.blouse_production_by_size() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.blouse_production_by_size() TO authenticated;
