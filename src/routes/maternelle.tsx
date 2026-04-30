import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, ChevronRight, Heart, Minus, Plus, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { ShellMotif } from "@/components/SchoolMotif";
import { ChildPicker } from "@/components/ChildPicker";
import { useStore } from "@/lib/store";
import blouseProduct from "@/assets/blouse-bleue-officielle.jpeg";
import bloussePliee from "@/assets/blouse-pliee.jpeg";
import classeBlouses from "@/assets/enfants-classe-blouses.jpg";

export const Route = createFileRoute("/maternelle")({
  head: () => ({
    meta: [
      { title: "Blouse officielle — Maternelle & Élémentaire" },
      {
        name: "description",
        content:
          "Blouse scolaire officielle du Groupe Saint-Jacques de Compostelle, portée au quotidien par les élèves.",
      },
    ],
  }),
  component: MaternellePage,
});

const sizes = ["3 ans", "4 ans", "5 ans", "6 ans", "7 ans", "8 ans", "9 ans", "10 ans"];

function MaternellePage() {
  const { addToCart, children } = useStore();
  const [size, setSize] = useState("6 ans");
  const [qty, setQty] = useState(1);
  const [childId, setChildId] = useState("");
  const [activeImg, setActiveImg] = useState(0);
  const gallery = [blouseProduct, classeBlouses, bloussePliee];

  const handleAdd = () => {
    if (children.length === 0) { toast.error("Ajoutez d'abord un enfant"); return; }
    if (!childId) { toast.error("Choisissez un enfant"); return; }
    addToCart({
      productId: "blouse-officielle", name: "Blouse scolaire officielle",
      ref: "SJC-BLS-2025", price: 30, size, qty, image: blouseProduct,
      childId,
    });
    toast.success("Blouse ajoutée au panier");
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader schoolName="Saint-Jacques de Compostelle — Dax" />

      {/* Breadcrumb */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center gap-1.5 px-4 py-3 text-xs text-muted-foreground sm:px-6 lg:px-8">
          <Link to="/niveau" className="hover:text-primary">Boutique</Link>
          <ChevronRight className="h-3 w-3" />
          <span>Maternelle & Élémentaire (PS → CM1)</span>
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
              Blouse scolaire officielle
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Réf. SJC-BLS-2025 · Maternelle & Élémentaire
            </p>

            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-3xl font-semibold text-foreground">30,00 €</span>
              <span className="rounded-md bg-[var(--school-yellow)]/30 px-2 py-0.5 text-xs font-medium text-foreground">
                Tarif famille
              </span>
            </div>

            <p className="mt-6 leading-relaxed text-foreground/80">
              Blouse officielle du groupe scolaire — portée au quotidien par les élèves.
              Coton mélangé bleu Riviera, fermeture boutonnée, col contrasté bleu marine,
              écusson brodé poitrine et poches plaquées. Confectionnée dans nos ateliers
              français.
            </p>

            {/* Size */}
            <div className="mt-8">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground">Taille</label>
                <button className="text-xs text-primary hover:underline">Guide des tailles</button>
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
              <button className="inline-flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:text-primary">
                <Heart className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pour quel enfant ?</div>
              <div className="mt-2"><ChildPicker value={childId} onChange={setChildId} /></div>
            </div>

            {/* Trust */}
            <div className="mt-8 grid gap-3 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2">
              <Bullet icon={<Truck className="h-4 w-4" />} text="Livraison à l'école sous 5 à 7 jours" />
              <Bullet icon={<ShieldCheck className="h-4 w-4" />} text="Échange de taille gratuit pendant 30 jours" />
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
                Pensée pour le quotidien des élèves
              </h2>
            </div>
            <div className="space-y-4 text-sm leading-relaxed text-foreground/80 lg:col-span-2">
              <p>
                La blouse Saint-Jacques de Compostelle est portée par tous les élèves de
                maternelle et d'élémentaire. Sa coupe ample permet une grande liberté de
                mouvement et protège les vêtements pendant les activités manuelles.
              </p>
              <p>
                Tissu résistant, lavable en machine à 40°C, séchage rapide. Les boutons
                jaunes facilitent l'apprentissage de l'autonomie pour les plus petits.
              </p>
            </div>
          </div>
        </div>
      </section>

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