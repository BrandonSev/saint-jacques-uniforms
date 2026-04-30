-- 1. Profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  civilite TEXT NOT NULL DEFAULT 'Mme',
  prenom TEXT NOT NULL DEFAULT '',
  nom TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  telephone TEXT,
  adresse TEXT,
  code_postal TEXT,
  ville TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Children
CREATE TABLE public.children (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  naissance DATE,
  classe TEXT,
  section TEXT,
  taille TEXT,
  hauteur TEXT,
  tour TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own children" ON public.children FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own children" ON public.children FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own children" ON public.children FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own children" ON public.children FOR DELETE USING (auth.uid() = user_id);

-- 3. updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER children_updated_at BEFORE UPDATE ON public.children
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, civilite, prenom, nom, telephone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'civilite', 'Mme'),
    COALESCE(NEW.raw_user_meta_data->>'prenom', ''),
    COALESCE(NEW.raw_user_meta_data->>'nom', ''),
    NEW.raw_user_meta_data->>'telephone'
  );
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- 6. Orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  order_number TEXT NOT NULL UNIQUE DEFAULT ('CMD-' || to_char(now(), 'YYYYMMDD') || '-' || lpad((floor(random()*100000))::text, 5, '0')),
  status TEXT NOT NULL DEFAULT 'En attente',
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  family_civilite TEXT,
  family_nom TEXT NOT NULL,
  family_prenom TEXT NOT NULL,
  family_email TEXT NOT NULL,
  family_telephone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER set_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 7. Order items
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  child_id UUID,
  child_prenom TEXT NOT NULL,
  child_nom TEXT NOT NULL,
  child_classe TEXT,
  child_section TEXT,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_ref TEXT NOT NULL,
  variant TEXT,
  size TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL,
  line_total NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid()));
CREATE POLICY "Users can insert own order items" ON public.order_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid()));
CREATE POLICY "Admins can view all order items" ON public.order_items FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);