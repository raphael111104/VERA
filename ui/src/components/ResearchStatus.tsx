import { CheckCircle2, CircleAlert, LoaderCircle, PauseCircle } from "lucide-react";

export type ResearchStatusKind = "running" | "complete" | "error" | "cancelled";

/** Text and icons carry the meaning even when animation or color is unavailable. */
export function ResearchStatus({ status, children }: { status: ResearchStatusKind; children: React.ReactNode }) {
  const Icon = status === "running" ? LoaderCircle : status === "complete" ? CheckCircle2 : status === "cancelled" ? PauseCircle : CircleAlert;
  return <span className={`vera-agent-status is-${status}`} role="status" aria-live="polite">
    <Icon size={17} className={status === "running" ? "vera-agent-spinner" : ""} aria-hidden="true" />
    <span>{children}</span>
  </span>;
}
