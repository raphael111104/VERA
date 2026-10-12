import { type Experiment, type Run, fmtNumber } from "../api";
import { activeWorkspaceRuns } from "../workspaceRuns";
import { getComputeSettingsQuery } from "../queries/settings";
import { TARGET_LABELS } from "../computeTargets";
import { useEffect, useMemo, useRef } from "react";
import { FolderOpen, Package, GitBranch, Cpu, MessagesSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getSessionWorktreeQuery } from "../queries/files";
import { countChanges, parseDiffFiles } from "./GitDiff";
import { m } from "../paraglide/messages.js";
import { Button, MenuItem, StatusIndicator } from "./ui";

export function WorkspaceTools({ expanded, experiments, runs, onOpenExperiment, activeView, projectId, onCompute, sessionId, busy, onChanges, onFiles, onArtifacts, onSideChat }: {
  expanded: boolean;
  experiments: Experiment[];
  runs: Run[];
  onOpenExperiment: (id: string, runId: string) => void;
  activeView: "files" | "artifacts" | "experiments" | "terminal" | null;
  projectId: string;
  onCompute: () => void;
  sessionId: string | null;
  busy: boolean;
  onChanges: () => void;
  onFiles: () => void;
  onTerminal: () => void;
  onArtifacts: () => void;
  onExperiments: () => void;
  /** Absent until there is a chat to branch from. */
  onSideChat?: () => void;
}) {
  const experimentRows = activeWorkspaceRuns(experiments, runs, sessionId);
  const compute = useQuery({ ...getComputeSettingsQuery(projectId), enabled: expanded });
  const defaultBackend = compute.data?.configuredDefaultBackend ?? compute.data?.defaultBackend;
  const computeLabel = defaultBackend ? TARGET_LABELS[defaultBackend]() : compute.isPending ? "…" : compute.isError ? m.model_picker_unavailable() : m.settings_not_set();
  const items = [
    { id: "files", label: m.vera_file(), Icon: FolderOpen, onClick: onFiles },
    { id: "artifacts", label: m.vera_output(), Icon: Package, onClick: onArtifacts },
  ];
  return (
    <div className="workspace-tools vera-workspace-toolbar shrink-0 border-b border-border bg-background px-6 py-2.5">
      <nav aria-label={m.workspace_tools_heading()} className="flex flex-wrap items-center gap-2">
        <span className="vera-toolbar-caption me-auto text-xs font-medium text-subtext">{m.workspace_tools_heading()}</span>
        {items.map(({ id, label, Icon, onClick }) => (
          <Button key={id} variant="ghost" active={activeView === id} className="vera-tool-button" aria-label={label} aria-pressed={activeView === id} onClick={onClick} data-onboarding={id === "artifacts" ? "nav-artifacts" : undefined}>
            <Icon size={16} /><span>{label}</span>
          </Button>
        ))}
        {onSideChat && <Button variant="ghost" className="vera-tool-button" aria-label={m.vera_assistence()} onClick={onSideChat}><MessagesSquare size={16} /><span>{m.vera_assistence()}</span></Button>}
      </nav>
      {expanded && (
        <div className="vera-worktree-strip mt-2 flex flex-wrap items-center gap-3 border-t border-border-variant pt-2 text-xs text-subtext">
          <Button variant="ghost" size="small" onClick={onCompute} className="gap-2 text-xs font-normal"><Cpu size={14} />{m.workspace_default_compute()}: {computeLabel}</Button>
          {sessionId && <div className="max-w-72"><ChatBranch key={sessionId} sessionId={sessionId} busy={busy} onChanges={onChanges} /></div>}
          {experimentRows.length > 0 && <div className="ms-auto flex flex-wrap items-center gap-2"><StatusIndicator tone="success" live /><span>{m.workspace_active_experiments()}</span>{experimentRows.map((row) => <Button key={row.run.id} variant="ghost" size="small" onClick={() => onOpenExperiment(row.experiment.id, row.run.id)}>{row.experiment.title || row.experiment.slug}</Button>)}</div>}
        </div>
      )}
    </div>
  );
}

function ChatBranch({ sessionId, busy, onChanges }: { sessionId: string; busy: boolean; onChanges: () => void }) {
  const worktree = useQuery({ ...getSessionWorktreeQuery(sessionId), refetchInterval: busy ? 5_000 : false });
  const wasBusy = useRef(busy);
  const { refetch } = worktree;
  useEffect(() => {
    if (wasBusy.current && !busy) void refetch();
    wasBusy.current = busy;
  }, [busy, refetch]);
  const wt = worktree.data;
  const counts = useMemo(() => {
    if (!wt?.diff || wt.diff.truncated) return null;
    const parsed = parseDiffFiles(wt.diff.diff, false);
    if (parsed.failed) return null;
    return parsed.files.map(countChanges).reduce((total, file) => ({
      additions: total.additions + file.additions,
      deletions: total.deletions + file.deletions,
    }), { additions: 0, deletions: 0 });
  }, [wt?.diff]);
  if (!wt?.exists) return null;
  return (
    <MenuItem className="min-h-7 py-1" onClick={onChanges} title={wt.branch ?? m.settings_detached()}>
      <span className="flex min-w-0 items-center gap-4">
        <GitBranch size={15} className="shrink-0" />
        <span>{m.code_browser_header_changes()}</span>
      </span>
      {counts ? (
        <span className="flex shrink-0 gap-1 text-xs tabular-nums">
          <span className="text-accent-green">+{fmtNumber(counts.additions)}</span>
          <span className="text-accent-red">−{fmtNumber(counts.deletions)}</span>
        </span>
      ) : (
        <span className="shrink-0 text-xs text-subtext">{wt.files?.length === 1 ? m.git_diff_one_changed_file() : m.git_diff_changed_file_count({ count: fmtNumber(wt.files?.length ?? 0) })}</span>
      )}
    </MenuItem>
  );
}
