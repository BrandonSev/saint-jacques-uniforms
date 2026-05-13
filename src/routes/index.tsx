import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CreditCard, ShieldCheck, Truck } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { ShellMotif } from "@/components/SchoolMotif";
import { DirectorQuote } from "@/components/DirectorQuote";
import { FrenchFlag } from "@/components/FrenchFlag";
import classeBlouses from "@/assets/enfants-classe-blouses.jpg";
import schoolLogo from "@/assets/saint-jacques-blason.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Boutique groupe scolaire Saint-Jacques-de-Compostelle — Dax" },
       {
         name: "description",
         content:
           "Espace familles officiel du Groupe scolaire Saint-Jacques-de-Compostelle de Dax. Commandez les tenues officielles en quelques clics.",
       },
      { property: "og:title", content: "Boutique groupe scolaire Saint-Jacques-de-Compostelle — Dax" },
      {
        property: "og:description",
        content:
          "Espace familles officiel — commandez les uniformes du Groupe scolaire Saint-Jacques-de-Compostelle, Dax.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader schoolName="Saint-Jacques-de-Compostelle — Dax" />

      {/* Hero */}
      <section className="relative overflow-hidden bg-primary">
        <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
        <div className="absolute inset-0 -z-10 opacity-25 mix-blend-overlay">
          <img src={classeBlouses} alt="" className="h-full w-full object-cover" loading="eager" />
        </div>
        <div className="absolute inset-0 -z-10 bg-primary-deep/70" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary-deep/80 via-primary-deep/60 to-primary-deep/40" />
        <div className="pointer-events-none absolute inset-0 -z-10 text-white">
          <ShellMotif className="absolute -left-40 -top-32 h-[700px] w-[700px]" opacity={0.1} />
          <ShellMotif className="absolute -right-48 -bottom-48 h-[700px] w-[700px]" opacity={0.08} />
        </div>
        {/* Blason en filigrane plein arrière-plan (watermark global), au-dessus des overlays mais derrière le contenu */}
        <img
          src={schoolLogo}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[55rem] w-[55rem] -translate-x-1/2 -translate-y-1/2 object-scale-down opacity-[0.08] mix-blend-screen lg:left-[58%] lg:h-[65rem] lg:w-[65rem]"
        />
        <div className="mx-auto max-w-6xl w-full px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
            <div className="relative z-10 text-center lg:text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-white backdrop-blur">
                <ShieldCheck className="h-3.5 w-3.5" /> Espace familles officiel
              </span>
              <h1 className="mt-6 font-display text-white">
                <span className="block text-sm font-medium uppercase tracking-[0.32em] text-gold/90 animate-fade-in">
                  Boutique des uniformes scolaires
                </span>
                <span
                  className="mt-3 block text-4xl font-semibold tracking-tight sm:text-5xl lg:text-[3.6rem] lg:leading-[1.02] animate-fade-in"
                  style={{ animationDelay: "120ms", animationFillMode: "both" }}
                >
                  Groupe Scolaire{" "}
                  <span className="relative inline-block bg-gradient-to-r from-white via-cream to-gold bg-clip-text text-transparent">
                    Saint-Jacques
                    <span className="absolute -bottom-1 left-0 h-[3px] w-full origin-left rounded-full bg-gradient-to-r from-gold via-gold/70 to-transparent" />
                  </span>{" "}
                  de Compostelle
                </span>
                <span
                  className="mt-2 block text-2xl font-light tracking-[0.18em] text-white/80 sm:text-3xl animate-fade-in"
                  style={{ animationDelay: "260ms", animationFillMode: "both" }}
                >
                  — DAX —
                </span>
              </h1>
              <div className="mt-6 flex items-center gap-3 justify-center lg:justify-start">
                <span className="h-px w-10 bg-gold" />
                <span className="text-[10px] font-medium uppercase tracking-[0.32em] text-white/70">Depuis 2003</span>
                <span className="h-px w-10 bg-gold" />
              </div>
               <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg mx-auto lg:mx-0">
                 Bienvenue sur l'espace familles du Groupe scolaire Saint-Jacques-de-Compostelle de Dax. Commandez les
                 tenues officielles en quelques clics.
               </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <Link
                  to="/login"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-primary shadow-xl transition-all hover:gap-3"
                >
                  Accéder à mon espace famille <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="relative block mt-10 lg:mt-0">
              <div className="relative z-20 rounded-xl border border-white/20 shadow-2xl">
                <img
                  src={classeBlouses}
                  alt="Élèves en blouse"
                  className="aspect-[4/5] w-full rounded-xl object-cover sm:aspect-[16/10] lg:aspect-[4/5]"
                  loading="eager"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex min-h-[14rem] flex-col justify-end overflow-visible rounded-b-xl bg-gradient-to-t from-primary-deep/85 via-primary-deep/30 to-transparent p-5 sm:min-h-[18rem] sm:p-6 lg:min-h-[22rem]">
                  <div className="relative font-medium uppercase tracking-[0.22em] text-white/75 text-xs sm:text-sm lg:text-base">
                    {/* Rond jaune décoratif — débordant hors de l'image, centré sur le R */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -left-6 top-1/2 z-0 h-16 w-16 -translate-y-1/2 rounded-full bg-gold/80 shadow-lg sm:-left-8 sm:h-24 sm:w-24"
                    />
                    <span className="relative z-10">Rentrée 2026-2027</span>
                  </div>
                  <div className="relative z-10 mt-1 font-semibold text-white text-xl sm:text-2xl lg:text-3xl">
                    Tenues officielles validées par l'établissement
                  </div>
                </div>
              </div>
              <div className="absolute -right-4 -top-4 z-0 hidden h-20 w-20 rounded-lg border-2 border-gold/70 bg-white/10 backdrop-blur lg:block" />
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl grid w-full gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          <TrustItem
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Tenues validées par l'établissement"
            text="Chaque produit est référencé en accord avec la direction de l'école et l'association des parents d'élèves."
          />
          <TrustItem
            icon={<Truck className="h-5 w-5" />}
            title="Livraison à l'école directement pour la rentrée de septembre"
            text="Vos commandes seront distribuées avant la rentrée par l'APEL dans l'établissement. L'expédition à votre domicile sera disponible en option à partir de l'automne 2026."
          />
          <TrustItem
            icon={<FrenchFlag className="h-3.5 w-5" />}
            title="Fabrication française"
            text="Confection 100% française, en partie via l'économie sociale et solidaire (personnes en situation de handicap, en reconversion ou en réinsertion professionnelle)."
          />
          <TrustItem
            icon={<CreditCard className="h-5 w-5" />}
            title="Paiement en ligne sécurisé"
            text="Réglez vos commandes en toute confiance par carte bancaire via notre prestataire certifié."
          />
        </div>
      </section>

      <DirectorQuote
        variant="hero"
        quote="Toutes les actions menées dans notre Groupe scolaire ont pour finalité essentielle de contribuer à l'épanouissement et à la réussite du Jeune. La tenue de Saint-Jacques-de-Compostelle s'inscrit pleinement dans ce projet : elle incarne notre Éducation Intégrale, le sens de l'appartenance à notre communauté et l'attention quotidienne portée à chaque élève."
      />
      <SiteFooter />
    </div>
  );
}

function TrustItem({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="text-center">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
