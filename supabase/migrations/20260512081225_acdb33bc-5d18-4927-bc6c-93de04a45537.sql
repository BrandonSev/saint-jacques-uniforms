-- Fonction principale : liste des familles avec statut commande rentrée 2026
-- Restreinte aux rôles 'admin' et 'apel'. Ne renvoie JAMAIS de montants.
CREATE OR REPLACE FUNCTION public.apel_families_overview(_season_start date DEFAULT '2026-01-01')
RETURNS TABLE (
  user_id uuid,
  family_civilite text,
  family_prenom text,
  family_nom text,
  family_email text,
  family_telephone text,
  ville text,
  children_count integer,
  classes text,
  paid_orders_count integer,
  items_count integer,
  last_paid_at timestamptz,
  has_ordered boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id AS user_id,
    p.civilite,
    p.prenom,
    p.nom,
    p.email,
    p.telephone,
    p.ville,
    COALESCE(c.cnt, 0)::int AS children_count,
    c.classes,
    COALESCE(o.paid_cnt, 0)::int AS paid_orders_count,
    COALESCE(o.items_cnt, 0)::int AS items_count,
    o.last_paid_at,
    COALESCE(o.paid_cnt, 0) > 0 AS has_ordered
  FROM public.profiles p
  LEFT JOIN (
    SELECT user_id, COUNT(*) AS cnt,
           string_agg(DISTINCT NULLIF(classe, ''), ', ' ORDER BY NULLIF(classe, '')) AS classes
    FROM public.children
    GROUP BY user_id
  ) c ON c.user_id = p.id
  LEFT JOIN (
    SELECT o.user_id,
           COUNT(*) FILTER (WHERE o.paid_at IS NOT NULL) AS paid_cnt,
           COALESCE(SUM(CASE WHEN o.paid_at IS NOT NULL THEN it.cnt ELSE 0 END), 0) AS items_cnt,
           MAX(o.paid_at) AS last_paid_at
    FROM public.orders o
    LEFT JOIN (
      SELECT order_id, SUM(quantity)::int AS cnt
      FROM public.order_items GROUP BY order_id
    ) it ON it.order_id = o.id
    WHERE o.created_at >= _season_start
    GROUP BY o.user_id
  ) o ON o.user_id = p.id
  WHERE public.has_role(auth.uid(), 'admin'::app_role)
     OR public.has_role(auth.uid(), 'apel'::app_role)
$$;

REVOKE ALL ON FUNCTION public.apel_families_overview(date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apel_families_overview(date) TO authenticated;
