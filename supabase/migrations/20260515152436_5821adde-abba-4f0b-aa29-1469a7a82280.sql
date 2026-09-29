
CREATE TABLE public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id text NOT NULL,
  name text NOT NULL,
  ref text NOT NULL,
  price numeric NOT NULL,
  size text NOT NULL,
  qty integer NOT NULL DEFAULT 1,
  image text NOT NULL DEFAULT '',
  child_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id, size, child_id)
);

CREATE INDEX idx_cart_items_user ON public.cart_items(user_id);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cart"
  ON public.cart_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cart"
  ON public.cart_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart"
  ON public.cart_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cart"
  ON public.cart_items FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER cart_items_set_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
