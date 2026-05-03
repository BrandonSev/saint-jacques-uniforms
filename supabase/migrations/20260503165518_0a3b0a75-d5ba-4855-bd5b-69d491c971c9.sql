-- =========================================================
-- 1. delivery_options
-- =========================================================
CREATE TABLE public.delivery_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  active boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.delivery_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view active delivery options"
  ON public.delivery_options FOR SELECT
  TO authenticated
  USING (active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage delivery options - insert"
  ON public.delivery_options FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage delivery options - update"
  ON public.delivery_options FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage delivery options - delete"
  ON public.delivery_options FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_delivery_options_updated_at
  BEFORE UPDATE ON public.delivery_options
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.delivery_options (code, label, description, active, is_default, position)
VALUES
  ('home', 'Livraison à domicile', 'Livraison à l''adresse de votre choix.', true, true, 1),
  ('pickup', 'Retrait à l''établissement', 'Retrait au secrétariat de l''établissement.', false, false, 2);

-- =========================================================
-- 2. orders : nouveaux champs livraison / suivi / paiement
-- =========================================================
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_mode text NOT NULL DEFAULT 'home',
  ADD COLUMN IF NOT EXISTS shipping_label text,
  ADD COLUMN IF NOT EXISTS shipping_recipient text,
  ADD COLUMN IF NOT EXISTS shipping_address text,
  ADD COLUMN IF NOT EXISTS shipping_postal text,
  ADD COLUMN IF NOT EXISTS shipping_city text,
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS tracking_carrier text,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS payplug_payment_id text,
  ADD COLUMN IF NOT EXISTS payment_url text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- Trigger updated_at sur orders (au cas où il n'existe pas déjà)
DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Politique admin update orders
CREATE POLICY "Admins can update orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- 3. Numérotation client + commande
-- =========================================================
CREATE TABLE public.client_counters (
  user_id uuid PRIMARY KEY,
  client_number int NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own client counter"
  ON public.client_counters FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE SEQUENCE public.client_number_seq START 1;

CREATE TABLE public.order_sequences (
  user_id uuid PRIMARY KEY,
  last_seq int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own order sequence"
  ON public.order_sequences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Fonction qui attribue le client_number si absent et incrémente le seq
CREATE OR REPLACE FUNCTION public.generate_order_number(_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _client_number int;
  _seq int;
BEGIN
  -- Récupère ou crée le client_number
  SELECT client_number INTO _client_number
  FROM public.client_counters WHERE user_id = _user_id;

  IF _client_number IS NULL THEN
    _client_number := nextval('public.client_number_seq');
    INSERT INTO public.client_counters (user_id, client_number)
    VALUES (_user_id, _client_number)
    ON CONFLICT (user_id) DO UPDATE SET client_number = client_counters.client_number
    RETURNING client_number INTO _client_number;
  END IF;

  -- Incrémente le compteur de commandes du client
  INSERT INTO public.order_sequences (user_id, last_seq)
  VALUES (_user_id, 1)
  ON CONFLICT (user_id) DO UPDATE
    SET last_seq = order_sequences.last_seq + 1, updated_at = now()
  RETURNING last_seq INTO _seq;

  RETURN 'CMD-' || to_char(now(), 'YYYYMMDD') || '-C' || lpad(_client_number::text, 3, '0') || '-' || lpad(_seq::text, 3, '0');
END;
$$;

-- Trigger BEFORE INSERT sur orders
CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'orders.user_id is required to generate order_number';
  END IF;
  -- Toujours regénérer pour respecter le format (ignore le DEFAULT random)
  NEW.order_number := public.generate_order_number(NEW.user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_set_number ON public.orders;
CREATE TRIGGER trg_orders_set_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_order_number();

-- Rattrapage : attribue un client_number aux familles existantes (ordre created_at de leur 1ère commande)
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT user_id FROM public.orders
    GROUP BY user_id
    ORDER BY MIN(created_at)
  LOOP
    INSERT INTO public.client_counters (user_id, client_number)
    VALUES (r.user_id, nextval('public.client_number_seq'))
    ON CONFLICT (user_id) DO NOTHING;
  END LOOP;
END $$;

-- =========================================================
-- 4. order_status_history
-- =========================================================
CREATE TABLE public.order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  status text NOT NULL,
  note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_status_history_order ON public.order_status_history(order_id, created_at DESC);

ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own order history"
  ON public.order_status_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_status_history.order_id AND o.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "System and admins insert order history"
  ON public.order_status_history FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_status_history.order_id AND o.user_id = auth.uid())
  );

-- Trigger : à chaque changement de status sur orders, insère une ligne d'historique
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.order_status_history (order_id, status, created_by)
    VALUES (NEW.id, NEW.status, NEW.user_id);
  ELSIF (TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status) THEN
    INSERT INTO public.order_status_history (order_id, status, created_by)
    VALUES (NEW.id, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_log_status ON public.orders;
CREATE TRIGGER trg_orders_log_status
  AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.log_order_status_change();