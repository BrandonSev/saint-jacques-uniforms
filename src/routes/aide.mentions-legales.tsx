import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";

export const Route = createFileRoute("/aide/mentions-legales")({
  head: () => ({
    meta: [
      { title: "Mentions légales — Saint-Jacques de Compostelle" },
      { name: "description", content: "Informations légales relatives à l'éditeur et à l'hébergeur du site." },
    ],
  }),
  component: MentionsPage,
});

function MentionsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader schoolName="Saint-Jacques de Compostelle — Dax" />
      <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          <span className="h-px w-6 bg-gold" /> Légal
        </span>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Mentions légales</h1>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground/85">
          <section>
            <h2 className="text-base font-semibold text-foreground">Éditeur du site</h2>
            <p className="mt-2">
              France Uniformes — Société par actions simplifiée<br />
              Siège social : France<br />
              Email : <a href="mailto:info@franceuniformes.fr" className="text-primary hover:underline">info@franceuniformes.fr</a>
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">Directeur de la publication</h2>
            <p className="mt-2">La direction de France Uniformes.</p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">Hébergement</h2>
            <p className="mt-2">Le site est hébergé sur une infrastructure cloud sécurisée.</p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">Propriété intellectuelle</h2>
            <p className="mt-2">
              L'ensemble des contenus (textes, images, logos) sont la propriété de France Uniformes ou
              de leurs ayants droit. Toute reproduction sans autorisation est interdite.
            </p>
          </section>
        </div>
      </article>
      <SiteFooter />
    </div>
  );
}