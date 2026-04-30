import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export type Child = {
  id: string;
  prenom: string;
  nom: string;
  naissance: string;
  classe: string;
  section: string;
  taille: string;
  hauteur: string;
  tour: string;
  initials: string;
  color: string;
};

export type Profile = {
  id: string;
  civilite: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string | null;
  adresse: string | null;
  code_postal: string | null;
  ville: string | null;
};

export type CartItem = {
  id: string;
  productId: string;
  name: string;
  ref: string;
  price: number;
  size: string;
  qty: number;
  image: string;
  childId: string;
};

const COLORS = [
  "from-primary/15 to-primary/5",
  "from-gold/25 to-gold/5",
  "from-primary-lagoon/15 to-primary-lagoon/5",
  "from-[var(--rouge)]/15 to-[var(--rouge)]/5",
];

function decorate(
  c: { id: string; prenom: string; nom: string; naissance: string | null; classe: string | null; section: string | null; taille: string | null; hauteur: string | null; tour: string | null },
  idx: number,
): Child {
  const initials = ((c.prenom[0] ?? "") + (c.nom[0] ?? "")).toUpperCase();
  return {
    id: c.id,
    prenom: c.prenom,
    nom: c.nom,
    naissance: c.naissance ?? "",
    classe: c.classe ?? "",
    section: c.section ?? "",
    taille: c.taille ?? "",
    hauteur: c.hauteur ?? "",
    tour: c.tour ?? "",
    initials,
    color: COLORS[idx % COLORS.length],
  };
}

type StoreCtx = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  authLoading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (patch: Partial<Omit<Profile, "id" | "email">>) => Promise<void>;

  children: Child[];
  addChild: (c: Omit<Child, "id" | "initials" | "color">) => Promise<void>;
  updateChild: (id: string, patch: Partial<Omit<Child, "id" | "initials" | "color">>) => Promise<void>;
  removeChild: (id: string) => Promise<void>;

  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "id">) => void;
  updateQty: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  cartCount: number;
  checkout: () => Promise<{ orderId: string; orderNumber: string }>;
};

const Ctx = createContext<StoreCtx | null>(null);

function useLocal<T>(key: string, initial: T): [T, (v: T | ((p: T) => T)) => void] {
  const [val, setVal] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setVal(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, [key]);
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }, [key, val, hydrated]);
  return [val, setVal];
}

export function StoreProvider({ children: kids }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [childList, setChildList] = useState<Child[]>([]);
  const [cart, setCart] = useLocal<CartItem[]>("sjc.cart", []);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (!s) {
        setProfile(null);
        setChildList([]);
        setIsAdmin(false);
      }
    });
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = useCallback(async (uid: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
    if (data) setProfile(data as Profile);
  }, []);

  const loadChildren = useCallback(async (uid: string) => {
    const { data } = await supabase.from("children").select("*").eq("user_id", uid).order("created_at", { ascending: true });
    if (data) setChildList(data.map((c, i) => decorate(c as any, i)));
  }, []);

  const loadAdmin = useCallback(async (uid: string) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid).eq("role", "admin").maybeSingle();
    setIsAdmin(!!data);
  }, []);

  useEffect(() => {
    if (user) {
      loadProfile(user.id);
      loadChildren(user.id);
      loadAdmin(user.id);
    }
  }, [user, loadProfile, loadChildren, loadAdmin]);

  const value = useMemo<StoreCtx>(() => ({
    user, session, profile, authLoading, isAdmin,
    signOut: async () => { await supabase.auth.signOut(); },
    refreshProfile: async () => { if (user) await loadProfile(user.id); },
    updateProfile: async (patch) => {
      if (!user) return;
      const { data, error } = await supabase.from("profiles").update(patch).eq("id", user.id).select().single();
      if (error) throw error;
      if (data) setProfile(data as Profile);
    },

    children: childList,
    addChild: async (c) => {
      if (!user) return;
      const { data, error } = await supabase.from("children").insert({
        user_id: user.id,
        prenom: c.prenom, nom: c.nom,
        naissance: c.naissance || null,
        classe: c.classe || null, section: c.section || null,
        taille: c.taille || null, hauteur: c.hauteur || null, tour: c.tour || null,
      }).select().single();
      if (error) throw error;
      if (data) setChildList((p) => [...p, decorate(data as any, p.length)]);
    },
    updateChild: async (id, patch) => {
      const dbPatch: any = { ...patch };
      if ("naissance" in dbPatch && !dbPatch.naissance) dbPatch.naissance = null;
      const { data, error } = await supabase.from("children").update(dbPatch).eq("id", id).select().single();
      if (error) throw error;
      if (data) setChildList((p) => p.map((c, i) => (c.id === id ? decorate(data as any, i) : c)));
    },
    removeChild: async (id) => {
      const { error } = await supabase.from("children").delete().eq("id", id);
      if (error) throw error;
      setChildList((p) => p.filter((c) => c.id !== id));
      setCart((p) => p.filter((i) => i.childId !== id));
    },

    cart,
    addToCart: (item) => {
      setCart((prev) => {
        const existing = prev.find((i) => i.productId === item.productId && i.size === item.size && i.childId === item.childId);
        if (existing) return prev.map((i) => (i.id === existing.id ? { ...i, qty: i.qty + item.qty } : i));
        return [...prev, { ...item, id: `${item.productId}-${item.size}-${item.childId}-${Date.now()}` }];
      });
    },
    updateQty: (id, qty) => setCart((prev) => qty <= 0 ? prev.filter((i) => i.id !== id) : prev.map((i) => i.id === id ? { ...i, qty } : i)),
    removeFromCart: (id) => setCart((prev) => prev.filter((i) => i.id !== id)),
    clearCart: () => setCart([]),
    cartCount: cart.reduce((s, i) => s + i.qty, 0),
    checkout: async () => {
      if (!user || !profile) throw new Error("Non connecté");
      if (cart.length === 0) throw new Error("Panier vide");
      const total = cart.reduce((s, i) => s + i.qty * i.price, 0);
      const { data: order, error: oErr } = await supabase.from("orders").insert({
        user_id: user.id,
        status: "Envoyée",
        total_amount: total,
        family_civilite: profile.civilite,
        family_nom: profile.nom,
        family_prenom: profile.prenom,
        family_email: profile.email,
        family_telephone: profile.telephone,
      }).select().single();
      if (oErr) throw oErr;
      const items = cart.map((i) => {
        const child = childList.find((c) => c.id === i.childId);
        const [productId, ...variantParts] = i.productId.split("::");
        return {
          order_id: order.id,
          child_id: i.childId || null,
          child_prenom: child?.prenom ?? "—",
          child_nom: child?.nom ?? "—",
          child_classe: child?.classe ?? null,
          child_section: child?.section ?? null,
          product_id: productId,
          product_name: i.name,
          product_ref: i.ref,
          variant: variantParts.join("::") || null,
          size: i.size,
          quantity: i.qty,
          unit_price: i.price,
          line_total: i.qty * i.price,
        };
      });
      const { error: iErr } = await supabase.from("order_items").insert(items);
      if (iErr) throw iErr;
      setCart([]);
      return { orderId: order.id, orderNumber: order.order_number };
    },
  }), [user, session, profile, authLoading, isAdmin, childList, cart, setCart, loadProfile]);

  return <Ctx.Provider value={value}>{kids}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}