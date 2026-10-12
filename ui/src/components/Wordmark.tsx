const VERA_LOGO = "/vera-logo.png";

/** The supplied complete brand asset for pages that have room for the wordmark. */
export function VeraLogo({ className }: { className?: string }) {
  return <img src={VERA_LOGO} alt="VERA" className={className} />;
}

/** Crop the emblem from the supplied square logo for compact UI marks. */
export function BrandMark() {
  return (
    <span className="vera-brand-mark" aria-hidden="true">
      <img src={VERA_LOGO} alt="" />
    </span>
  );
}

// VERA wordmark: logo mark + name, sized by the parent's font-size.
// Single source for the brand lockup (home and onboarding).
export function Wordmark() {
  return (
    <span className="wordmark inline-flex shrink-0 items-center">
      <VeraLogo className="vera-wordmark-image" />
    </span>
  );
}
