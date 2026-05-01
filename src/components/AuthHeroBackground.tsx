import schoolLogo from "@/assets/saint-jacques-blason.png";
import classeBlouses from "@/assets/enfants-classe-blouses.jpg";
import { ShellMotif } from "@/components/SchoolMotif";

/**
 * Fond visuel commun aux pages d'authentification (login, reset-password,
 * mot-de-passe-oublié). Reprend le filigrane du blason et les motifs du hero.
 */
export function AuthHeroBackground() {
  return (
    <>
      <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
      <div className="absolute inset-0 -z-10 opacity-25 mix-blend-overlay">
        <img src={classeBlouses} alt="" className="h-full w-full object-cover" loading="lazy" />
      </div>
      <div className="absolute inset-0 -z-10 bg-primary-deep/70" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary-deep/80 via-primary-deep/60 to-primary-deep/85" />
      <div className="pointer-events-none absolute inset-0 -z-10 text-white">
        <ShellMotif className="absolute -left-40 -top-32 h-[700px] w-[700px]" opacity={0.1} />
        <ShellMotif className="absolute -right-48 -bottom-48 h-[700px] w-[700px]" opacity={0.08} />
      </div>
      <img
        src={schoolLogo}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[55rem] w-[55rem] -translate-x-1/2 -translate-y-1/2 object-scale-down opacity-[0.08] mix-blend-screen lg:left-[58%] lg:h-[65rem] lg:w-[65rem]"
      />
    </>
  );
}