-- order_refunds.status reste une colonne TEXT libre (pas un enum) ; la valeur transitoire
-- 'En cours' (réservation posée, appel PayPlug en cours, résultat pas encore connu) est donc
-- déjà supportée par le schéma existant sans migration de colonne.

CREATE OR REPLACE FUNCTION public.reserve_order_refund(
  _order_id uuid,
  _order_item_ids uuid[],
  _amount numeric,
  _reason text,
  _created_by uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  locked_order_id uuid;
  already_refunded boolean;
  new_refund_id uuid;
BEGIN
  SELECT id INTO locked_order_id
  FROM public.orders
  WHERE id = _order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;

  -- Une réservation 'En cours' ne bloque que si elle est récente : passé 2 minutes
  -- (largement suffisant pour un aller-retour PayPlug normal), on considère qu'elle est
  -- bloquée (crash serveur, timeout, échec de la finalisation) et on la laisse expirer
  -- pour ne pas bloquer indéfiniment un ré-remboursement des mêmes items.
  SELECT EXISTS (
    SELECT 1
    FROM public.order_refunds
    WHERE order_id = _order_id
      AND order_item_ids && _order_item_ids
      AND (
        status = 'Réussi'
        OR (status = 'En cours' AND created_at > now() - interval '2 minutes')
      )
  ) INTO already_refunded;

  IF already_refunded THEN
    RAISE EXCEPTION 'already_refunded';
  END IF;

  INSERT INTO public.order_refunds (
    order_id, order_item_ids, amount, reason, status, created_by
  ) VALUES (
    _order_id, _order_item_ids, _amount, _reason, 'En cours', _created_by
  )
  RETURNING id INTO new_refund_id;

  RETURN new_refund_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reserve_order_refund(uuid, uuid[], numeric, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_order_refund(uuid, uuid[], numeric, text, uuid) TO service_role;
