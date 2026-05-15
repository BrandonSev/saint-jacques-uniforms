import { Link } from "@tanstack/react-router";
import { ChevronRight, Info, ShieldCheck } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { ShellMotif } from "@/components/SchoolMotif";
import poloPorte from "@/assets/college-polo-porte.jpg";
import { PageWatermark } from "@/components/PageWatermark";

export default function CollegePage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background/80">
      <PageWatermark />
      <SiteHeader schoolName="Saint-Jacques-de-Compostelle — Dax" />

      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl flex w-full min-w-0 items-center gap-1.5 px-4 py-3 text-xs text-muted-foreground sm:px-6 lg:px-8">
          <Link to="/boutique" className="shrink-0 hover:text-primary">
            Boutique
          </Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <span className="min-w-0 flex-1 truncate text-foreground">Collège (CM2 → 4ᵉ)</span>
        </div>
      </div>

      {/* Hero */}
      <section
        className="relative overflow-hidden border-b border-border"
        style={{ background: "var(--gradient-soft)" }}
      >
        <div className="pointer-events-none absolute inset-0 text-primary">
          <ShellMotif className="absolute -left-32 -bottom-32 h-[480px] w-[480px]" opacity={0.05} />
        </div>
        <div className="relative mx-auto max-w-6xl grid w-full items-center gap-10 px-4 pt-6 pb-12 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:px-8">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-300 bg-yellow-100 px-3 py-1 font-semibold uppercase tracking-wider text-sm text-yellow-900">
              <ShieldCheck className="h-3 w-3" /> Trousseau non géré par France Uniformes
            </span>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Collège</h1>
            <p className="mt-3 max-w-xl leading-relaxed text-muted-foreground">
              Le trousseau du collège n'est pas géré par France Uniformes pour le moment. Pour toute information
              concernant les tenues des classes de CM2, 6ᵉ, 5ᵉ et 4ᵉ, merci de vous adresser directement à
              l'établissement ou à l'APEL du groupe scolaire Saint-Jacques-de-Compostelle.
            </p>
          </div>
          <div className="relative h-64 overflow-hidden rounded-3xl border border-border lg:h-80">
            <img src={poloPorte} alt="Collégien en uniforme" className="h-full w-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 to-transparent" />
          </div>
        </div>
      </section>

      {/* Info block */}
      <section className="mx-auto max-w-3xl w-full px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-card)] sm:p-10">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
              <Info className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                Trousseau collège non disponible à la commande
              </h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                Le trousseau du collège n'a pas été retenu dans notre catalogue. France Uniformes ne propose donc
                pas, à ce jour, de tenues pour les niveaux CM2, 6ᵉ, 5ᵉ et 4ᵉ du groupe scolaire
                Saint-Jacques-de-Compostelle.
              </p>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Pour connaître les pièces attendues et les modalités d'achat, merci de vous rapprocher
                directement&nbsp;:
              </p>
              <ul className="mt-3 space-y-2 text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>de l'<strong className="text-foreground">établissement</strong> Saint-Jacques-de-Compostelle&nbsp;;</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>ou de l'<strong className="text-foreground">APEL</strong> du groupe scolaire.</span>
                </li>
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/boutique"
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                >
                  Retour à la boutique
                </Link>
                <Link
                  to="/aide/contact"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-secondary"
                >
                  Nous contacter
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
