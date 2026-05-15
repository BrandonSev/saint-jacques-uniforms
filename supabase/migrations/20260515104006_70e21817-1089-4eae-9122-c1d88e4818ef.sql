-- Étape 6 : numérotation des commandes scopée par tenant.
-- Comportement :
--   * lit le tenant courant (via current_tenant_id() ou la colonne tenant_id de la commande)
--   * si tenants.config->>'order_prefix' est défini, préfixe le numéro
--     (ex: 'SJDC-CMD-...'). Sinon on garde le format historique 'CMD-...'
--     pour ne RIEN changer côté Saint-Jacques-de-Compostelle.
-- Réversible : revert à la version précédente sans perte de données.

CREATE OR REPLACE FUNCTION public.generate_order_number(_user_id uuid, _tenant_id uuid DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _client_number int;
  _seq int;
  _effective_tenant uuid;
  _prefix text;
  _base text;
BEGIN
  _effective_tenant := COALESCE(_tenant_id, public.current_tenant_id());

  -- Compteur client (inchangé : par user_id ; SJC n'a qu'un tenant donc pas
  -- de collision. Pour des familles multi-tenant à terme, on pourra scoper
  -- par (tenant_id, user_id) ; non-breaking pour l'instant).
  SELECT client_number INTO _client_number
  FROM public.client_counters WHERE user_id = _user_id;

  IF _client_number IS NULL THEN
    _client_number := nextval('public.client_number_seq');
    INSERT INTO public.client_counters (user_id, client_number)
    VALUES (_user_id, _client_number)
    ON CONFLICT (user_id) DO UPDATE SET client_number = client_counters.client_number
    RETURNING client_number INTO _client_number;
  END IF;

  -- Séquence de commande par utilisateur.
  INSERT INTO public.order_sequences (user_id, last_seq)
  VALUES (_user_id, 1)
  ON CONFLICT (user_id) DO UPDATE
    SET last_seq = order_sequences.last_seq + 1, updated_at = now()
  RETURNING last_seq INTO _seq;

  _base := 'CMD-' || to_char(now(), 'YYYYMMDD')
        || '-C' || lpad(_client_number::text, 3, '0')
        || '-' || lpad(_seq::text, 3, '0');

  -- Préfixe tenant éventuel (vide pour SJC : format historique préservé).
  SELECT NULLIF(trim(config->>'order_prefix'), '') INTO _prefix
  FROM public.tenants
  WHERE id = _effective_tenant;

  IF _prefix IS NOT NULL THEN
    RETURN _prefix || '-' || _base;
  END IF;

  RETURN _base;
END;
$function$;

-- Le trigger set_order_number propage le tenant_id de la commande au
-- générateur, garantissant un préfixe cohérent même si current_tenant_id()
-- n'est pas positionné dans la session (ex: insertion via service role).
CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'orders.user_id is required to generate order_number';
  END IF;
  -- NEW.tenant_id a déjà été positionné par le trigger set_tenant_id (ordre
  -- alphabétique des triggers BEFORE INSERT : set_tenant_id < set_order_number).
  NEW.order_number := public.generate_order_number(NEW.user_id, NEW.tenant_id);
  RETURN NEW;
END;
$function$;