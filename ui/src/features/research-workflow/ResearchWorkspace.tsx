import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  FileText,
  History,
  ListChecks,
  Search,
  Compass,
  ArrowLeft,
  Home,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
  NotebookPen,
  Network,
  ClipboardCheck,
  GraduationCap,
} from "lucide-react";
import { cn } from "../../components/ui/cn";
import { BrandMark } from "../../components/Wordmark";
import { Button, IconButton } from "../../components/ui";
import { showLandingPage } from "../../components/StartupSplash";
import { readProject, changeProject, WorkflowError } from "./api";
import { WorkflowWriter } from "./persistence";
import { DirectionInterview } from "./direction/DirectionInterview";
import { ProtocolEditor } from "./protocol/ProtocolEditor";
import { SearchWorkspace } from "./search/SearchWorkspace";
import { SelectionWorkspace } from "./selection/SelectionWorkspace";
import { ManuscriptEditor } from "./draft/ManuscriptEditor";
import { ChartingWorkspace } from "./evidence/ChartingWorkspace";
import { SynthesisWorkspace } from "./evidence/SynthesisWorkspace";
import { ResearchPanel } from "./panels/ResearchPanel";
import { AuditWorkspace } from "./audit/AuditWorkspace";
import { LearningWorkspace } from "./learning/LearningWorkspace";
import { Notice, Section } from "./shared";
import type { Command, Direction, Protocol, Workspace } from "./types";

const activities = [
  ["direction", "Arah Kajian", Compass],
  ["protocol", "Rencana Kajian", BookOpen],
  ["search", "Sumber", Search],
  ["selection", "Pemilihan Sumber", ListChecks],
  ["charting", "Catatan Sumber", NotebookPen],
  ["synthesis", "Peta Temuan", Network],
  ["draft", "Draft Artikel", FileText],
  ["audit", "Pemeriksaan dan Ekspor", ClipboardCheck],
  ["learning", "Belajar bersama VERA", GraduationCap],
  ["history", "Riwayat", History],
] as const;
const navigationGroups = [
  { label: "1. Siapkan kajian", keys: ["direction", "protocol"] },
  {
    label: "2. Kumpulkan bukti",
    keys: ["search", "selection", "charting", "synthesis"],
  },
  { label: "3. Tulis dan periksa", keys: ["draft", "audit"] },
  { label: "Pendamping", keys: ["learning", "history"] },
];

export function ResearchWorkspace({ id }: { id: string }) {
  const query = useQuery({
    queryKey: ["research-project", id],
    queryFn: () => readProject(id),
    retry: false,
    refetchOnWindowFocus: false,
    gcTime: 0,
  });
  return query.data && !query.isFetching ? (
    <WorkspaceContent initial={query.data} />
  ) : (
    <main className="h-full overflow-y-auto bg-canvas p-8">
      <Link to="/research">Kembali ke daftar kajian</Link>
      <p role={query.error ? "alert" : "status"} className="mt-5">
        {query.error ? String(query.error) : "Memuat proyek kajian…"}
      </p>
      {query.error && (
        <Button onClick={() => void query.refetch()}>Coba lagi</Button>
      )}
    </main>
  );
}

function WorkspaceContent({ initial }: { initial: Workspace }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem("vera:workflow:sidebar") === "collapsed",
  );
  const pendingKey = `vera:workflow:pending:${initial.project.id}`;
  const [recovery] = useState<{
    baseRevision: number;
    direction: Direction;
    protocol: Protocol;
    dirty: { direction: boolean; protocol: boolean };
  } | null>(() => {
    if (initial.actor.role !== "owner") return null;
    try {
      return JSON.parse(localStorage.getItem(pendingKey) || "null");
    } catch {
      return null;
    }
  });
  const recoveredConflict =
    !!recovery && recovery.baseRevision !== initial.project.revision;
  const [w, setW] = useState(initial),
    [direction, setDirection] = useState(
      recovery?.direction ?? initial.project.direction,
    ),
    [protocol, setProtocol] = useState(
      recovery?.protocol ?? initial.project.protocol,
    );
  const [activity, setActivity] = useState(
      initial.actor.role === "reviewer"
        ? "selection"
        : !initial.finalStagesEnabled &&
            ["audit", "learning"].includes(initial.project.currentActivity)
          ? "draft"
          : initial.project.currentActivity,
    ),
    [error, setError] = useState(
      recoveredConflict
        ? "Ada jawaban lokal yang belum tersimpan dari revisi sebelumnya. Unduh jawaban untuk dibandingkan dengan versi server."
        : "",
    ),
    [status, setStatus] = useState(
      recovery ? "Jawaban lokal dipulihkan" : "Tersimpan",
    ),
    [busy, setBusy] = useState(false),
    [conflict, setConflict] = useState(recoveredConflict);
  const drafts = useRef({ direction, protocol });
  drafts.current = { direction, protocol };
  const dirty = useRef(
    recovery?.dirty ?? { direction: false, protocol: false },
  );
  const acknowledgedRevision = useRef(initial.project.revision);
  const persistPending = () => {
    try {
      if (dirty.current.direction || dirty.current.protocol)
        localStorage.setItem(
          pendingKey,
          JSON.stringify({
            baseRevision: acknowledgedRevision.current,
            ...drafts.current,
            dirty: dirty.current,
          }),
        );
      else localStorage.removeItem(pendingKey);
    } catch {
      /* The unload guard still protects the in-memory draft if browser storage is full. */
    }
  };
  const owner = w.actor.role === "owner";
  const writer = useRef<WorkflowWriter<
    Workspace & { revision: number }
  > | null>(null);
  if (!writer.current)
    writer.current = new WorkflowWriter(
      initial.project.revision,
      async (request) => {
        const value = await changeProject(initial.project.id, request);
        return { ...value, revision: value.project.revision };
      },
      (value) => {
        acknowledgedRevision.current = value.project.revision;
        setW(value);
        if (!dirty.current.direction) {
          setDirection(value.project.direction);
          drafts.current.direction = value.project.direction;
        }
        if (!dirty.current.protocol) {
          setProtocol(value.project.protocol);
          drafts.current.protocol = value.project.protocol;
        }
      },
    );
  const saveDraft = async (
    kind: "direction" | "protocol",
  ): Promise<boolean> => {
    if (!dirty.current[kind]) return true;
    const draft = drafts.current[kind];
    setStatus("Menyimpan…");
    try {
      await writer.current!.save({ action: kind, data: draft });
      if (drafts.current[kind] === draft) dirty.current[kind] = false;
      persistPending();
      setStatus(
        dirty.current.direction || dirty.current.protocol
          ? "Perubahan belum tersimpan"
          : "Tersimpan",
      );
      setError("");
      return true;
    } catch (problem) {
      setStatus("Gagal tersimpan");
      setError(String(problem));
      if (problem instanceof WorkflowError && problem.status === 409)
        setConflict(true);
      return false;
    }
  };
  const flush = async (): Promise<boolean> =>
    (await saveDraft("direction")) && (await saveDraft("protocol"));
  useEffect(() => {
    if (
      !owner ||
      conflict ||
      (!dirty.current.direction && !dirty.current.protocol)
    )
      return;
    const timer = setTimeout(() => {
      void (async () => {
        if (dirty.current.direction) await saveDraft("direction");
        else if (dirty.current.protocol) await saveDraft("protocol");
      })();
    }, 900);
    return () => clearTimeout(timer);
  }, [direction, protocol, conflict]);
  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => {
      if (
        dirty.current.direction ||
        dirty.current.protocol ||
        status === "Menyimpan…"
      )
        event.preventDefault();
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [status]);
  useEffect(() => {
    document.title = `${w.project.name} — VERA`;
  }, [w.project.name]);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [activity]);
  const act = async (command: Command): Promise<boolean> => {
    if (conflict) return false;
    setBusy(true);
    setError("");
    setStatus(
      ["search", "resume_search"].includes(command.action)
        ? "Mengambil halaman sumber…"
        : "Menyimpan…",
    );
    try {
      if (!(await flush())) return false;
      await writer.current!.save(command);
      setStatus("Tersimpan");
      return true;
    } catch (problem) {
      setError(String(problem));
      setStatus("Gagal tersimpan");
      if (problem instanceof WorkflowError && problem.status === 409)
        setConflict(true);
      return false;
    } finally {
      setBusy(false);
    }
  };
  const navigate = async (next: string) => {
    if (owner) {
      if (!(await act({ action: "activity", data: { activity: next } })))
        return;
    }
    setActivity(next);
  };
  const directionChange = (next: Direction) => {
    dirty.current.direction = true;
    drafts.current.direction = next;
    persistPending();
    setStatus("Perubahan belum tersimpan");
    setDirection(next);
  };
  const protocolChange = (next: Protocol) => {
    dirty.current.protocol = true;
    drafts.current.protocol = next;
    persistPending();
    setStatus("Perubahan belum tersimpan");
    setProtocol(next);
  };
  const confirm = async () => {
    if (await act({ action: "confirm_direction", data: {} })) {
      const d = drafts.current.direction;
      const next = {
        ...drafts.current.protocol,
        objective: drafts.current.protocol.objective || d.objective,
        question: drafts.current.protocol.question || d.question,
      };
      protocolChange(next);
      setActivity("protocol");
    }
  };
  const retry = async () => {
    setBusy(true);
    try {
      await writer.current!.retry();
      setError("");
      setStatus("Tersimpan");
      if (dirty.current.direction) await saveDraft("direction");
      if (dirty.current.protocol) await saveDraft("protocol");
    } catch (problem) {
      setError(String(problem));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas text-text">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-5 py-3">
        <Link to="/research" className="flex items-center gap-3 text-text">
          <span className="size-8">
            <BrandMark />
          </span>
          <strong>VERA</strong>
          <span className="hidden text-sm text-subtext sm:block">
            Ruang kajian
          </span>
        </Link>
        <span className="min-w-0 truncate text-sm font-medium">
          {w.project.name}
        </span>
        <span className="shrink-0 text-xs text-subtext">
          {owner
            ? "Pemilik proyek"
            : `Reviewer · ${w.members.find((m) => m.id === w.actor.id)?.name || "Anggota"}`}
        </span>
      </header>
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <aside
          aria-label="Navigasi kajian"
          className={cn(
            "flex min-h-0 shrink-0 flex-col border-b border-border bg-background md:border-r md:border-b-0",
            sidebarCollapsed ? "p-2 md:w-16" : "p-3 md:w-56",
          )}
        >
          <div
            className={cn(
              "mb-2 flex shrink-0 items-center gap-2",
              sidebarCollapsed ? "justify-center" : "justify-between px-2",
            )}
          >
            {!sidebarCollapsed && (
              <span className="text-xs font-medium text-subtext">
                Navigasi kajian
              </span>
            )}
            <IconButton
              aria-label={
                sidebarCollapsed
                  ? "Perluas sidebar kajian"
                  : "Ringkas sidebar kajian"
              }
              title={
                sidebarCollapsed
                  ? "Perluas sidebar kajian"
                  : "Ringkas sidebar kajian"
              }
              aria-expanded={!sidebarCollapsed}
              aria-controls="research-stage-navigation"
              onClick={() =>
                setSidebarCollapsed((value) => {
                  localStorage.setItem(
                    "vera:workflow:sidebar",
                    value ? "expanded" : "collapsed",
                  );
                  return !value;
                })
              }
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen size={18} />
              ) : (
                <PanelLeftClose size={18} />
              )}
            </IconButton>
          </div>
          <nav
            id="research-stage-navigation"
            className="flex gap-3 overflow-x-auto md:min-h-0 md:flex-1 md:flex-col md:gap-4 md:overflow-y-auto"
            aria-label="Tahap kajian"
          >
            {navigationGroups.map((group) => (
              <div
                key={group.label}
                className="flex shrink-0 gap-1 md:flex-col"
              >
                <p
                  className={cn(
                    "mb-2 mt-1 px-3 text-xs font-medium text-subtext",
                    sidebarCollapsed ? "sr-only" : "hidden md:block",
                  )}
                >
                  {group.label}
                </p>
                {activities
                  .filter(
                    ([key]) =>
                      group.keys.includes(key) &&
                      (w.finalStagesEnabled ||
                        !["audit", "learning"].includes(key)),
                  )
                  .map(([key, label, Icon]) => (
                    <Button
                      key={key}
                      variant="ghost"
                      className={cn(
                        "h-auto min-h-9 justify-start gap-2 px-3 py-2 text-left text-sm md:whitespace-normal [&.active]:text-primary",
                        activity === key && "font-semibold",
                        sidebarCollapsed &&
                          "size-10 min-h-10 justify-center p-0",
                      )}
                      active={activity === key}
                      aria-current={activity === key ? "page" : undefined}
                      title={sidebarCollapsed ? label : undefined}
                      onClick={() => void navigate(key)}
                      disabled={busy}
                    >
                      <Icon size={16} className="shrink-0" aria-hidden="true" />
                      <span
                        className={
                          sidebarCollapsed ? "sr-only" : "min-w-0 flex-1"
                        }
                      >
                        {label}
                      </span>
                      {!sidebarCollapsed &&
                        ((key === "direction" &&
                          w.project.directionConfirmed) ||
                          (key === "protocol" && w.project.protocolLocked)) && (
                          <Check
                            size={13}
                            className="shrink-0 text-subtext"
                            aria-label="Konfirmasi tersimpan"
                          />
                        )}
                    </Button>
                  ))}
              </div>
            ))}
          </nav>
          <div
            className={cn(
              "mt-3 hidden shrink-0 space-y-2 border-t border-border pb-1 pt-3 text-xs leading-relaxed text-subtext md:block",
              sidebarCollapsed ? "px-0" : "px-3",
            )}
          >
            <Link
              to="/research"
              title="Semua kajian"
              className={cn(
                "flex min-h-9 items-center gap-2 text-text",
                sidebarCollapsed && "justify-center",
              )}
            >
              <ArrowLeft size={15} />
              <span className={sidebarCollapsed ? "sr-only" : ""}>
                Semua kajian
              </span>
            </Link>
            <button
              type="button"
              title="Halaman awal"
              className={cn(
                "flex min-h-9 w-full items-center gap-2",
                sidebarCollapsed && "justify-center",
              )}
              onClick={showLandingPage}
            >
              <Home size={15} />
              <span className={sidebarCollapsed ? "sr-only" : ""}>
                Halaman awal
              </span>
            </button>
          </div>
        </aside>
        <ResearchPanel
          workspace={w}
          act={act}
          busy={busy}
          activity={activity}
          onNavigate={(next) => {
            if (next !== activity) void navigate(next);
            else document.getElementById("research-main-stage")?.focus();
          }}
        >
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-background px-6 py-3">
              <h1
                ref={heading}
                tabIndex={-1}
                className="m-0 min-w-0 text-sm font-medium outline-none"
              >
                {activities.find((a) => a[0] === activity)?.[1] || "Kajian"}
              </h1>
              <span className="flex items-center gap-3 text-xs text-subtext">
                <span role="status" aria-live="polite">
                  {status}
                </span>
                <span className="hidden tabular-nums xl:inline">
                  Revisi {w.project.revision}
                </span>
                {owner && (
                  <Button
                    size="small"
                    disabled={busy || conflict}
                    onClick={() => void flush()}
                  >
                    Simpan sekarang
                  </Button>
                )}
              </span>
            </div>
            <main
              key={activity}
              id="research-main-stage"
              tabIndex={-1}
              className="min-h-0 flex-1 overflow-y-auto px-4 py-6 lg:px-7"
            >
              <div className="mx-auto max-w-4xl">
                {error && (
                  <div
                    role="alert"
                    className="mb-5 rounded-lg border border-border bg-background p-4 text-sm text-accent-red"
                  >
                    <p className="mt-0">{error}</p>
                    {conflict ? (
                      <>
                        <p className="text-subtext">
                          Salin jawaban sebelum memuat ulang. Muat ulang tidak
                          menggabungkan perubahan secara otomatis.
                        </p>
                        <Button
                          onClick={() => {
                            const content = JSON.stringify(
                              drafts.current,
                              null,
                              2,
                            );
                            const url = URL.createObjectURL(
                              new Blob([content], { type: "application/json" }),
                            );
                            const link = document.createElement("a");
                            link.href = url;
                            link.download = "jawaban-belum-tersimpan.json";
                            link.click();
                            setTimeout(() => URL.revokeObjectURL(url), 1000);
                          }}
                        >
                          Unduh jawaban saya
                        </Button>{" "}
                        <Button
                          onClick={() => {
                            dirty.current = {
                              direction: false,
                              protocol: false,
                            };
                            localStorage.removeItem(pendingKey);
                            location.reload();
                          }}
                        >
                          Muat versi terbaru
                        </Button>
                      </>
                    ) : (
                      <Button disabled={busy} onClick={() => void retry()}>
                        Coba simpan lagi
                      </Button>
                    )}
                  </div>
                )}
                {w.project.needsReview && (
                  <Notice>
                    Arah atau rencana berubah. Periksa kembali versi acuan dan
                    set seleksi sebelum melanjutkan.
                  </Notice>
                )}
                {activity === "direction" &&
                  (owner ? (
                    <DirectionInterview
                      value={direction}
                      workspace={w}
                      onChange={directionChange}
                      busy={busy}
                      confirm={() => void confirm()}
                    />
                  ) : (
                    <Notice>Arah kajian: {w.project.direction.question}</Notice>
                  ))}
                {activity === "protocol" &&
                  (owner ? (
                    <ProtocolEditor
                      value={protocol}
                      workspace={w}
                      onChange={protocolChange}
                      busy={busy}
                      lock={() =>
                        void act({ action: "lock_protocol", data: {} }).then(
                          (saved) => {
                            if (saved) setActivity("search");
                          },
                        )
                      }
                    />
                  ) : (
                    <Section title="Rencana acuan">
                      <p>{w.project.protocol.question}</p>
                      <p>Inklusi: {w.project.protocol.inclusion}</p>
                      <p>Eksklusi: {w.project.protocol.exclusion}</p>
                    </Section>
                  ))}
                {activity === "search" && (
                  <SearchWorkspace workspace={w} act={act} busy={busy} />
                )}
                {activity === "selection" && (
                  <SelectionWorkspace workspace={w} act={act} busy={busy} />
                )}
                {activity === "charting" && (
                  <ChartingWorkspace workspace={w} act={act} busy={busy} />
                )}
                {activity === "synthesis" && (
                  <SynthesisWorkspace workspace={w} act={act} busy={busy} />
                )}
                {activity === "draft" && (
                  <ManuscriptEditor workspace={w} act={act} busy={busy} />
                )}
                {activity === "audit" && (
                  <AuditWorkspace workspace={w} act={act} busy={busy} />
                )}
                {activity === "learning" && (
                  <LearningWorkspace workspace={w} act={act} busy={busy} />
                )}
                {activity === "history" && (
                  <Section
                    title="Riwayat versi"
                    description="Perubahan tersimpan sebagai versi baru. Membuka proyek tidak menambah revisi."
                  >
                    {w.history.length ? (
                      <ol className="list-none space-y-3 p-0">
                        {w.history.map((item) => (
                          <li
                            key={item.revision}
                            className="rounded-lg border border-border bg-background p-4 text-sm"
                          >
                            <strong>
                              Revisi {item.revision} · {item.action}
                            </strong>
                            <p className="mb-0 text-xs text-subtext">
                              {new Date(item.at).toLocaleString("id-ID")} ·{" "}
                              {item.actorId}
                            </p>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <Notice>
                        Riwayat lengkap dikelola pemilik proyek. Keputusan Anda
                        tetap terlihat pada tahap seleksi.
                      </Notice>
                    )}
                  </Section>
                )}
              </div>
            </main>
          </div>
        </ResearchPanel>
      </div>
    </div>
  );
}
