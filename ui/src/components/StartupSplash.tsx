import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { BrandMark } from "./Wordmark";
import { VeraLandingPage } from "./VeraLandingPage";
import { m } from "../paraglide/messages.js";
import { cn } from "./ui/cn";

const SHOW_LANDING_EVENT = "vera:show-landing";

export function showLandingPage() {
  window.dispatchEvent(new Event(SHOW_LANDING_EVENT));
}

/** Every document and native reopen shows splash → landing → workspace.
 * Keep a started workspace mounted across reopens, including unsaved input. */
export function StartupSplash({ children }: { children: ReactNode }) {
  const researchEntry = useRef(window.location.pathname.startsWith('/research'));
  const [phase, setPhase] = useState<"intro" | "splash-leaving" | "landing" | "landing-leaving" | "done">(researchEntry.current ? "done" : "intro");
  const [started, setStarted] = useState(researchEntry.current);
  const [launch, setLaunch] = useState(0);
  const workspace = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const reopen = () => {
      previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setPhase("intro");
      setLaunch((value) => value + 1);
    };
    const showLanding = () => {
      previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setStarted(true);
      setPhase("landing");
    };
    window.addEventListener("vera:launch", reopen);
    window.addEventListener(SHOW_LANDING_EVENT, showLanding);
    return () => {
      window.removeEventListener("vera:launch", reopen);
      window.removeEventListener(SHOW_LANDING_EVENT, showLanding);
    };
  }, []);

  useEffect(() => {
    if (researchEntry.current && launch === 0) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hold = window.setTimeout(() => setPhase("splash-leaving"), reducedMotion ? 450 : 2100);
    const finish = window.setTimeout(() => setPhase("landing"), reducedMotion ? 450 : 2340);
    return () => {
      window.clearTimeout(hold);
      window.clearTimeout(finish);
    };
  }, [launch]);

  useEffect(() => {
    if (phase !== "landing-leaving") return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finish = window.setTimeout(() => setPhase("done"), reducedMotion ? 0 : 180);
    return () => window.clearTimeout(finish);
  }, [phase]);

  useLayoutEffect(() => {
    if (phase !== "done") return;
    const target = previousFocus.current?.isConnected ? previousFocus.current : workspace.current;
    target?.focus({ preventScroll: true });
    previousFocus.current = null;
  }, [phase]);

  const enterWorkspace = () => {
    if (phase !== "landing") return;
    if (!window.location.pathname.startsWith("/research")) {
      window.location.assign("/research");
      return;
    }
    setStarted(true);
    setPhase("landing-leaving");
  };

  return (
    <>
      {started && <div ref={workspace} className="h-full outline-none" tabIndex={-1} inert={phase !== "done"} aria-hidden={phase !== "done" ? true : undefined}>{children}</div>}
      {(phase === "landing" || phase === "landing-leaving") && (
        <div className="fixed inset-0 z-250"><VeraLandingPage onEnter={enterWorkspace} exiting={phase === "landing-leaving"} /></div>
      )}
      {(phase === "intro" || phase === "splash-leaving") && (
        <section
          key={launch}
          className={cn("vera-splash fixed inset-0 z-250 flex flex-col items-center justify-center bg-background text-text", phase === "splash-leaving" && "vera-splash-leaving")}
          aria-label="VERA — Veritas Evidence & Research Agent"
          aria-busy="true"
        >
          <div className="vera-splash-drag absolute inset-x-0 top-0 h-12" onMouseDown={(event) => {
            if (event.button === 0) window.ipc?.postMessage("titlebar:drag");
          }} aria-hidden="true" />
          <div className="vera-splash-lockup">
            <div className="vera-splash-symbol" aria-hidden="true">
              <span className="vera-splash-frame" />
              <span className="vera-splash-frame-inner" />
              <span className="vera-splash-mark"><BrandMark /></span>
            </div>
            <h1 className="vera-splash-name">VERA</h1>
            <p className="vera-splash-subtitle">Veritas Evidence &amp; Research Agent</p>
            <div className="vera-splash-rule" aria-hidden="true"><span /></div>
          </div>
          <p className="vera-splash-status absolute bottom-12 flex items-center gap-3 text-xs text-subtext" role="status">
            <span className="vera-splash-pulse size-1.5 rounded-full bg-primary" aria-hidden="true" />
            {m.vera_starting_app()}
          </p>
        </section>
      )}
    </>
  );
}
