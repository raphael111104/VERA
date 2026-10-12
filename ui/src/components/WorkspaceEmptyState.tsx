import type { LucideIcon } from "lucide-react";

export function WorkspaceEmptyState({ icon: Icon, title, description }: {
  icon: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div className="vera-empty-state flex h-full w-full min-w-0 flex-1 flex-col items-center justify-center gap-4 bg-background p-8 text-center text-muted">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-primary-subtle text-primary"><Icon size={28} strokeWidth={1.5} className="shrink-0" /></span>
      <h3 className="m-0 max-w-full wrap-anywhere text-xl font-semibold text-text">{title}</h3>
      {description && <p className="m-0 w-full max-w-80 wrap-anywhere text-sm leading-relaxed text-subtext">{description}</p>}
    </div>
  );
}
