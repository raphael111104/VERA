import { ArrowDownRight, ArrowRight, BookMarked, BookOpenText, FilePenLine, Quote } from "lucide-react";
import { m } from "../paraglide/messages.js";
import { BrandMark, VeraLogo } from "./Wordmark";
import { Button } from "./ui";
import { cn } from "./ui/cn";
import { HeroBackdrop } from "./HeroBackdrop";

/** The opening page belongs to each launch, independently of saved setup. */
export function VeraLandingPage({ onEnter, exiting = false }: { onEnter: () => void; exiting?: boolean }) {
  const steps = [
    { title: m.vera_landing_literature_title(), description: m.vera_landing_literature_detail(), icon: BookOpenText },
    { title: m.vera_landing_evidence_title(), description: m.vera_landing_evidence_detail(), icon: Quote },
    { title: m.vera_landing_writing_title(), description: m.vera_landing_writing_detail(), icon: FilePenLine },
  ];

  return (
    <section className={cn("vera-landing bg-canvas text-text", exiting && "vera-landing-leaving")} aria-labelledby="vera-landing-title" inert={exiting}>
      <div className="vera-landing-titlebar" aria-hidden="true" onMouseDown={(event) => { if (event.button === 0) window.ipc?.postMessage("titlebar:drag"); }} />
      <div className="vera-landing-content mx-auto grid h-full min-h-0 w-full max-w-300">
        <header className="vera-landing-header flex items-center justify-between gap-6 border-b border-border">
          <div className="flex items-center gap-3" aria-label="VERA — Veritas Evidence & Research Agent">
            <span className="size-10 shrink-0"><BrandMark /></span>
            <span className="text-2xl font-semibold">VERA</span>
            <span className="vera-landing-brand-note border-l border-border pl-4 text-xs leading-relaxed text-subtext">Veritas Evidence<br />&amp; Research Agent</span>
          </div>
          <nav className="flex items-center gap-6 text-sm" aria-label={m.vera_navigation()}>
            <a className="vera-landing-nav text-subtext" href="#vera-research-flow">{m.vera_landing_flow()}</a>
            <Button variant="ghost" onClick={onEnter} disabled={exiting} className="vera-landing-header-enter">
              {m.vera_landing_enter()} <ArrowRight size={16} aria-hidden="true" />
            </Button>
          </nav>
        </header>

        <main className="vera-landing-main grid min-h-0">
          <div className="vera-landing-hero grid items-center">
            <HeroBackdrop exiting={exiting} />
            <div className="vera-landing-story">
              <p className="vera-landing-eyebrow m-0 flex items-center gap-3 text-sm font-medium text-subtext"><span className="h-px w-8 bg-primary" aria-hidden="true" />{m.vera_landing_workspace()}</p>
              <h1 id="vera-landing-title" className="vera-landing-title text-balance">
                <span>{m.vera_landing_question()}</span>
                <em>{m.vera_landing_evidence()}</em>
              </h1>
              <p className="vera-landing-description text-pretty text-lg leading-relaxed text-subtext">{m.vera_landing_description()}</p>
              <div className="vera-landing-actions flex flex-wrap items-center gap-x-6 gap-y-4">
                <Button variant="primary" size="large" className="vera-landing-enter" onClick={onEnter} disabled={exiting} autoFocus>
                  {m.vera_landing_enter()} <ArrowRight size={19} aria-hidden="true" />
                </Button>
                <a className="vera-landing-link inline-flex items-center gap-2 text-sm text-text" href="#vera-research-flow">{m.vera_landing_flow()} <ArrowDownRight size={17} aria-hidden="true" /></a>
              </div>
              <p className="vera-landing-local flex items-start gap-2 text-xs leading-relaxed text-subtext"><BookMarked size={15} className="mt-0.5 shrink-0" aria-hidden="true" />{m.vera_landing_source_note()}</p>
            </div>

            <figure className="vera-landing-identity m-0 flex items-center justify-center">
              <VeraLogo className="vera-landing-logo" />
            </figure>
          </div>

          <section id="vera-research-flow" className="vera-landing-workflow" aria-labelledby="vera-research-flow-title">
            <div className="vera-landing-workflow-heading flex flex-wrap items-baseline justify-between gap-3">
              <h2 id="vera-research-flow-title" className="m-0 text-balance">{m.vera_landing_flow_title()}</h2>
              <p className="m-0 text-sm text-subtext">{m.vera_landing_flow_note()}</p>
            </div>
            <ol className="vera-landing-steps m-0 grid list-none p-0">
              {steps.map(({ title, description, icon: StepIcon }, index) => (
                <li key={title} className="vera-landing-step">
                  <div className="vera-landing-step-heading flex items-center gap-4" aria-hidden="true">
                    <span className="vera-landing-step-number tabular-nums text-primary">0{index + 1}</span>
                    <span className="vera-landing-step-rule h-px flex-1 bg-border" />
                    <StepIcon size={21} strokeWidth={1.4} className="text-subtext" />
                  </div>
                  <h3 className="font-medium text-balance">{title}</h3>
                  <p className="m-0 text-sm leading-relaxed text-pretty text-subtext">{description}</p>
                </li>
              ))}
            </ol>
          </section>
        </main>

        <footer className="vera-landing-footer flex flex-wrap items-center justify-between gap-4 border-t border-border text-xs text-subtext">
          <div className="flex items-center gap-3"><span className="size-6 shrink-0"><BrandMark /></span><span>VERA · {m.vera_landing_workspace()}</span></div>
          <span className="vera-landing-footer-note">{m.vera_landing_footer()}</span>
        </footer>
      </div>
    </section>
  );
}
