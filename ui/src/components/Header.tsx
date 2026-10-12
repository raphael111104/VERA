import { m } from "../paraglide/messages.js";
import { FileText, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { BrandMark } from "./Wordmark";
import { IconButton } from "./ui";
import type { ReactNode } from "react";

export function VeraAppHeader({ children }: {
  children?: ReactNode;
}) {
  return (
    <header className="vera-app-header flex shrink-0 items-center gap-5 border-b border-border bg-background px-6 py-3 mac-titlebar:ps-20 win-titlebar:pe-36">
      <div className="vera-brand-lockup flex min-w-0 shrink-0 items-center gap-3" aria-label="VERA — Veritas Evidence & Research Agent">
        <span className="vera-header-logo size-10 shrink-0"><BrandMark /></span>
        <div className="vera-brand-copy flex min-w-0 flex-col gap-0.5">
          <span className="vera-brand-name text-xl font-semibold leading-tight">VERA</span>
          <span className="vera-brand-description truncate text-xs text-subtext">Veritas Evidence &amp; Research Agent</span>
        </div>
      </div>
      {children}
    </header>
  );
}

export function VeraWorkContext({ label, title }: {
  label: string;
  title: string;
}) {
  return (
    <div className="vera-header-context ms-auto flex min-w-0 items-center gap-4">
      <div className="flex min-w-0 flex-col gap-0.5 text-end">
        <span className="vera-header-context-label truncate text-xs text-subtext" title={label}>{label}</span>
        <span className="vera-header-context-title truncate text-sm font-medium text-text" title={title}>{title}</span>
      </div>
      <span className="vera-header-context-icon flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-primary" aria-hidden="true">
        <FileText size={18} strokeWidth={1.5} />
      </span>
    </div>
  );
}

export function RailHeader({ sidebarOpen, onToggleSidebar }: {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}) {
  const sidebarLabel = sidebarOpen ? m.header_hide_sidebar() : m.chat_panel_show_sidebar();
  return (
    <div className="rail-brand flex items-center justify-between gap-2 border-b border-border shrink-0">
      <span className="rail-brand-label min-w-0 flex-1 truncate text-xs font-semibold text-subtext">{m.vera_workspace()}</span>
      <IconButton
        className="vera-sidebar-toggle rail-sidebar-toggle rounded-md"
        aria-label={sidebarLabel}
        aria-expanded={sidebarOpen}
        aria-controls="vera-sidebar"
        data-tip={sidebarLabel}
        onClick={onToggleSidebar}
      >
        {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
      </IconButton>
    </div>
  );
}
