import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useEffect, useState } from "react";
import { Check, ChevronRight, Heart, Minus, Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { ShellMotif } from "@/components/SchoolMotif";
import { ChildPicker } from "@/components/ChildPicker";
import { DirectorQuote } from "@/components/DirectorQuote";
import { useStore } from "@/lib/store";
import blouseProduct from "@/assets/blouse-bleue-officielle.jpeg";
import bloussePliee from "@/assets/blouse-pliee.jpeg";
import classeBlouses from "@/assets/enfants-classe-blouses.jpg";
import margueritePortrait from "@/assets/marguerite-de-perignon.jpg";
import { PageWatermark } from "@/components/PageWatermark";

export const Route = createFileRoute("/blouse-officielle")({
  head: () => ({
    meta: [
      { title: "Blouse officielle — Maternelle & Élémentaire" },
      {
        name: "description",
        content:
          "Blouse scolaire officielle du Groupe Saint-Jacques-de-Compostelle, portée au quotidien par les élèves.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <MaternellePage />
    </RequireAuth>
  ),
});

const sizes = ["4 ans", "6 ans", "8 ans", "10 ans", "12 ans", "14 ans", "16 ans", "18 ans"];

function MaternellePage() {
  const { addToCart, children } = useStore();
  const [size, setSize] = useState("6 ans");
  const [qty, setQty] = useState(1);
  const [childId, setChildId] = useState("");
  const [activeImg, setActiveImg] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const gallery = [blouseProduct, classeBlouses, bloussePliee];

  const FAV_KEY = "sjc.favorites";
  const PRODUCT_ID = "blouse-officielle";

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      const list: string[] = raw ? JSON.parse(raw) : [];
      setIsFavorite(list.includes(PRODUCT_ID));
    } catch {}
  }, []);

  const toggleFavorite = () => {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      const list: string[] = raw ? JSON.parse(raw) : [];
      const next = list.includes(PRODUCT_ID)
        ? list.filter((id) => id !== PRODUCT_ID)
        : [...list, PRODUCT_ID];
      localStorage.setItem(FAV_KEY, JSON.stringify(next));
      const nowFav = next.includes(PRODUCT_ID);
      setIsFavorite(nowFav);
      toast.success(nowFav ? "Ajouté à vos favoris" : "Retiré de vos favoris");
    } catch {
      toast.error("Impossible d'enregistrer le favori");
    }
  };

  const handleAdd = () => {
    if (children.length === 0) { toast.error("Ajoutez d'abord un enfant"); return; }
    if (!childId) { toast.error("Choisissez un enfant"); return; }
    addToCart({
      productId: "blouse-officielle",
      name: "Blouse scolaire officielle SJDC",
      ref: "Riviera Dax",
      price: 30,
      size,
      qty,
      image: blouseProduct,
      childId,
    });
    toast.success("Blouse ajoutée au panier");
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-background/80">
      <PageWatermark />
      <SiteHeader schoolName="Saint-Jacques-de-Compostelle — Dax" />

      {/* Breadcrumb */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center gap-1.5 px-4 py-3 text-xs text-muted-foreground sm:px-6 lg:px-8">
          <Link to="/boutique" className="hover:text-primary">Boutique</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/maternelle" className="hover:text-primary">Maternelle & Élémentaire</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Blouse officielle</span>
        </div>
      </div>

      <section className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute right-0 top-0 -z-0 h-96 w-96 text-primary">
          <ShellMotif className="h-full w-full" opacity={0.04} />
        </div>
        <div className="relative grid gap-10 lg:grid-cols-2">
          {/* Gallery */}
          <div>
            <div className="overflow-hidden rounded-3xl border border-border bg-secondary">
              <img
                src={gallery[activeImg]}
                alt="Blouse scolaire officielle"
                className="aspect-square w-full object-cover"
                loading="eager"
              />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {gallery.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`overflow-hidden rounded-xl border-2 transition-all ${
                    activeImg === i ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="" className="aspect-square w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
              <ShieldCheck className="h-3 w-3" /> Tenue officielle de l'établissement
            </span>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Blouse scolaire officielle SJDC
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Ref : Riviera Dax · Maternelle & Élémentaire
            </p>

            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-3xl font-semibold text-foreground">30 €</span>
              <span className="rounded-md bg-[var(--school-yellow)]/30 px-2 py-0.5 text-xs font-medium text-foreground">
                Tarif famille
              </span>
            </div>

            <p className="mt-6 leading-relaxed text-foreground/80">
              Blouse officielle du groupe scolaire — portée au quotidien par les élèves.
              Coton mélangé de couleur bleu Riviera, fermeture centrale par 5 boutons
              pressions jaunes, élastiquage léger autour des poignets, col biais, semi
              contrasté bleu Riviera foncé, écusson du blason de l'école brodé sur le
              coeur et 1 poche plaquée à gauche au porté. Confectionnée dans nos
              ateliers français.
            </p>

            {/* Pour quel enfant — d'abord */}
            <div className="mt-8">
              <label className="text-sm font-semibold text-foreground">Pour quel enfant ?</label>
              <div className="mt-3"><ChildPicker value={childId} onChange={setChildId} filter={(c) => c.section === "Maternelle" || c.section === "Élémentaire"} /></div>
            </div>

            {/* Size */}
            <div className="mt-8">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground">Taille</label>
                <Link to="/aide/guide-tailles" className="text-xs text-primary hover:underline">Guide des tailles</Link>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-8">
                {sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`h-12 rounded-lg border text-sm font-medium transition-all ${
                      size === s
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-foreground hover:border-primary/40"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Qty + Add */}
            <div className="mt-8 flex items-stretch gap-3">
              <div className="inline-flex h-14 items-center rounded-xl border border-border bg-card">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="flex h-full w-12 items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-base font-semibold text-foreground">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="flex h-full w-12 items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button onClick={handleAdd} disabled={children.length === 0 || !childId}
                className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)] transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">
                {children.length === 0 ? "Ajoutez un enfant" : !childId ? "Choisir un enfant" : "Ajouter au panier"}
              </button>
              <button
                onClick={toggleFavorite}
                aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                aria-pressed={isFavorite}
                title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                className={`inline-flex h-14 w-14 items-center justify-center rounded-xl border transition-colors ${
                  isFavorite
                    ? "border-[var(--rouge)]/40 bg-[var(--rouge)]/10 text-[var(--rouge)]"
                    : "border-border bg-card text-muted-foreground hover:text-primary"
                }`}
              >
                <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
              </button>
            </div>

            {/* Trust */}
            <div className="mt-8 grid gap-3 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2">
              <Bullet icon={<ShieldCheck className="h-4 w-4" />} text="Conforme aux exigences SJDC " />
              <Bullet icon={<Check className="h-4 w-4" />} text="Coton certifié OEKO-TEX" />
              <Bullet icon={<Check className="h-4 w-4" />} text="Fabrication française" />
            </div>
          </div>
        </div>

        {/* Description bloc */}
        <div className="mt-16 rounded-3xl bg-secondary p-8 sm:p-12">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Pensée pour le quotidien des élèves de SJDC
              </h2>
            </div>
            <div className="space-y-4 text-sm leading-relaxed text-foreground/80 lg:col-span-2">
              <p>
                La blouse de Saint-Jacques-de-Compostelle est portée par tous les élèves de maternelle et d'élémentaire. Sa coupe à la fois ajustée et ample, permet une grande liberté de mouvement tout en offrant une apparence harmonieuse. 
              </p>
              <p>
                Elle protège les vêtements pendant les activités du quotidien.
              </p>
              <p>
                Tissu résistant, lavable en machine à 40°C, détachable facilement et séchage rapide. 
              </p>
            </div>
          </div>
        </div>

        {/* Mot de la cheffe d'établissement du 1er degré */}
        <figure className="mt-12 overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)]">
          <div className="grid items-stretch gap-0 md:grid-cols-[auto,1fr]">
            <div className="relative h-64 w-full md:h-full md:w-64">
              <img
                src={margueritePortrait}
                alt="Marguerite de Pérignon, Cheffe d'établissement du 1er degré"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="flex flex-col justify-center p-8 sm:p-10">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
                Le mot de la cheffe d'établissement — 1er degré
              </span>
              <blockquote className="mt-5 font-display text-lg leading-relaxed text-foreground sm:text-xl">
                <p>
                  « J'ai choisi avec soin la couleur bleu Riviera et chaque détail de cette
                  blouse pour qu'elle accompagne nos élèves avec élégance et fierté, dans la
                  douceur du quotidien comme dans les grands moments de leur scolarité. »
                </p>
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span className="h-px w-10 bg-gold" />
                <div>
                  <div className="text-sm font-semibold text-foreground">Marguerite de Pérignon</div>
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Cheffe d'établissement · 1er degré
                  </div>
                </div>
              </figcaption>
            </div>
          </div>
        </figure>

      </section>

      <DirectorQuote
        variant="hero"
        quote="Notre mission première d'Éducation se construit et se renforce jour après jour, au service du Jeune. Porter la blouse de Saint-Jacques-de-Compostelle, c'est rejoindre cette communauté qui travaille avec attachement et dévotion à former des adultes responsables, équilibrés, épanouis et confiants en leur avenir."
      />

      <SiteFooter />
    </div>
  );
}

function Bullet({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-foreground">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </span>
      {text}
    </div>
  );
}