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
  tour_taille: string;
  tour_bassin: string;
  genre: "" | "Fille" | "Garçon";
  initials: string;
  color: string;
  blouse_portee_2025: "" | "oui" | "non";
  taille_blouse_2025: string;
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
  family_name: string | null;
  code_etablissement: string | null;
};

export type FamilyParent = {
  id: string;
  role: string;
  civilite: string;
  prenom: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  code_postal: string | null;
  ville: string | null;
  is_primary: boolean;
  position: number;
  is_shipping_default: boolean;
  has_alt_shipping: boolean;
  shipping_label: string | null;
  shipping_adresse: string | null;
  shipping_code_postal: string | null;
  shipping_ville: string | null;
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

export type ShippingChoice = {
  mode: "home" | "pickup";
  recipient?: string;
  address?: string;
  postal?: string;
  city?: string;
  label?: string;
};

const COLORS = [
  "from-primary/15 to-primary/5",
  "from-gold/25 to-gold/5",
  "from-primary-lagoon/15 to-primary-lagoon/5",
  "from-[var(--rouge)]/15 to-[var(--rouge)]/5",
];

function decorate(
  c: { id: string; prenom: string; nom: string; naissance: string | null; classe: string | null; section: string | null; taille: string | null; hauteur: string | null; tour: string | null; tour_taille?: string | null; tour_bassin?: string | null; genre?: string | null; blouse_portee_2025?: boolean | null; taille_blouse_2025?: string | null },
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
    tour_taille: c.tour_taille ?? "",
    tour_bassin: c.tour_bassin ?? "",
    genre: (c.genre as Child["genre"]) ?? "",
    initials,
    color: COLORS[idx % COLORS.length],
    blouse_portee_2025:
      c.blouse_portee_2025 === true ? "oui" : c.blouse_portee_2025 === false ? "non" : "",
    taille_blouse_2025: c.taille_blouse_2025 ?? "",
  };
}

type StoreCtx = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  authLoading: boolean;
  isAdmin: boolean;
  isApel: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (patch: Partial<Omit<Profile, "id" | "email">>) => Promise<void>;

  children: Child[];
  addChild: (c: Omit<Child, "id" | "initials" | "color">) => Promise<void>;
  updateChild: (id: string, patch: Partial<Omit<Child, "id" | "initials" | "color">>) => Promise<void>;
  removeChild: (id: string) => Promise<void>;

  parents: FamilyParent[];
  addParent: (p: Partial<Omit<FamilyParent, "id">>) => Promise<void>;
  updateParent: (id: string, patch: Partial<Omit<FamilyParent, "id">>) => Promise<void>;
  removeParent: (id: string) => Promise<void>;

  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "id">) => void;
  updateQty: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  cartCount: number;
  checkout: (shipping: ShippingChoice) => Promise<{ orderId: string; orderNumber: string }>;
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
  const [parentList, setParentList] = useState<FamilyParent[]>([]);
  const [cart, setCart] = useLocal<CartItem[]>("sjc.cart", []);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isApel, setIsApel] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (!s) {
        setProfile(null);
        setChildList([]);
        setParentList([]);
        setIsAdmin(false);
        setIsApel(false);
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

  const loadParents = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from("family_parents")
      .select("*")
      .eq("user_id", uid)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });
    if (data) setParentList(data as FamilyParent[]);
  }, []);

  const loadAdmin = useCallback(async (uid: string) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    const roles = (data ?? []).map((r: any) => r.role);
    setIsAdmin(roles.includes("admin"));
    setIsApel(roles.includes("apel"));
  }, []);

  useEffect(() => {
    if (user) {
      loadProfile(user.id);
      loadChildren(user.id);
      loadParents(user.id);
      loadAdmin(user.id);
    }
  }, [user, loadProfile, loadChildren, loadParents, loadAdmin]);

  const familyDisplayName = profile?.family_name || profile?.nom || "";
  const displayedChildren = childList.map((c) => {
    const nom = familyDisplayName || c.nom;
    const initials = ((c.prenom[0] ?? "") + (nom[0] ?? "")).toUpperCase();
    return { ...c, nom, initials };
  });

  const value = useMemo<StoreCtx>(() => ({
    user, session, profile, authLoading, isAdmin, isApel,
    signOut: async () => { await supabase.auth.signOut(); },
    refreshProfile: async () => { if (user) await loadProfile(user.id); },
    updateProfile: async (patch) => {
      if (!user) return;
      const { data, error } = await supabase.from("profiles").update(patch).eq("id", user.id).select().single();
      if (error) throw error;
      if (data) setProfile(data as Profile);
    },

    children: displayedChildren,
    addChild: async (c) => {
      if (!user) return;
      const { data, error } = await supabase.from("children").insert({
        user_id: user.id,
        prenom: c.prenom, nom: c.nom,
        naissance: c.naissance || null,
        classe: c.classe || null, section: c.section || null,
        taille: c.taille || null, hauteur: c.hauteur || null, tour: c.tour || null,
        tour_taille: c.tour_taille || null,
        tour_bassin: c.tour_bassin || null,
        genre: c.genre || null,
        blouse_portee_2025:
          c.blouse_portee_2025 === "oui" ? true : c.blouse_portee_2025 === "non" ? false : null,
        taille_blouse_2025: c.taille_blouse_2025 || null,
      }).select().single();
      if (error) throw error;
      if (data) setChildList((p) => [...p, decorate(data as any, p.length)]);
    },
    updateChild: async (id, patch) => {
      const dbPatch: any = { ...patch };
      if ("naissance" in dbPatch && !dbPatch.naissance) dbPatch.naissance = null;
      if ("genre" in dbPatch && !dbPatch.genre) dbPatch.genre = null;
      if ("blouse_portee_2025" in dbPatch) {
        dbPatch.blouse_portee_2025 =
          dbPatch.blouse_portee_2025 === "oui"
            ? true
            : dbPatch.blouse_portee_2025 === "non"
              ? false
              : null;
      }
      if ("taille_blouse_2025" in dbPatch && !dbPatch.taille_blouse_2025) {
        dbPatch.taille_blouse_2025 = null;
      }
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

    parents: parentList,
    addParent: async (p) => {
      if (!user) return;
      const position = parentList.length;
      const { data, error } = await supabase.from("family_parents").insert({
        user_id: user.id,
        role: p.role || (position === 0 ? "Mère" : "Père"),
        civilite: p.civilite || "Mme",
        prenom: p.prenom || "",
        nom: p.nom || "",
        email: p.email || null,
        telephone: p.telephone || null,
        adresse: p.adresse || null,
        code_postal: p.code_postal || null,
        ville: p.ville || null,
        is_primary: position === 0,
        position,
      }).select().single();
      if (error) throw error;
      if (data) setParentList((prev) => [...prev, data as FamilyParent]);
    },
    updateParent: async (id, patch) => {
      const { data, error } = await supabase.from("family_parents").update(patch).eq("id", id).select().single();
      if (error) throw error;
      if (data) setParentList((prev) => prev.map((p) => (p.id === id ? (data as FamilyParent) : p)));
    },
    removeParent: async (id) => {
      const { error } = await supabase.from("family_parents").delete().eq("id", id);
      if (error) throw error;
      setParentList((prev) => prev.filter((p) => p.id !== id));
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
    checkout: async (shipping) => {
      if (!user || !profile) throw new Error("Non connecté");
      if (cart.length === 0) throw new Error("Panier vide");
      const total = cart.reduce((s, i) => s + i.qty * i.price, 0);
      const { data: order, error: oErr } = await supabase.from("orders").insert({
        user_id: user.id,
        status: "En attente paiement",
        total_amount: total,
        family_civilite: profile.civilite,
        family_nom: profile.nom,
        family_prenom: profile.prenom,
        family_email: profile.email,
        family_telephone: profile.telephone,
        shipping_mode: shipping.mode,
        shipping_label: shipping.label ?? null,
        shipping_recipient: shipping.recipient ?? null,
        shipping_address: shipping.address ?? null,
        shipping_postal: shipping.postal ?? null,
        shipping_city: shipping.city ?? null,
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
  }), [user, session, profile, authLoading, isAdmin, isApel, childList, displayedChildren, parentList, cart, setCart, loadProfile]);

  return <Ctx.Provider value={value}>{kids}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}