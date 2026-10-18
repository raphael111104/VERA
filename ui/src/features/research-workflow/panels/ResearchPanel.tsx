import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  FileText,
  Folder,
  Globe,
  MessageSquare,
  PanelRightClose,
  PanelRightOpen,
  ExternalLink,
  Lightbulb,
} from "lucide-react";
import { Button, IconButton } from "../../../components/ui";
import { cn } from "../../../components/ui/cn";
import { Md } from "../../../components/Md";
import { ResearchBrowser } from "../../../components/ResearchBrowser";
import {
  ModelPicker,
  defaultSelection,
  type ModelSelection,
} from "../../../components/ModelPicker";
import {
  getHarnesses,
  getUiState,
  reasoningFor,
  reconcileReasoning,
  type Harness,
  type ChatMessage,
} from "../../../api";
import {
  artifactUrl,
  sidechatRequest,
  exportBlob,
  downloadExport,
} from "../api";
import { workingData, outputBlob, saveBlob } from "../outputs";
import { OutputPreview, type PreviewDocument } from "./OutputPreview";
import { researchBrowserUrl } from "../../../researchBrowser";
import { manuscript } from "../draft/ManuscriptEditor";
import { researchChatError } from "../../../researchChatSettings";
import { initialDraft } from "../draft/InitialDraft";
import { Download } from "../shared";
import type { Command, Workspace } from "../types";
import { ResearchGuide } from "./ResearchGuide";

interface PanelActions {
  openRecord: (id: string) => void;
  openPdf: (id: string) => void;
  openText: (name: string, text: string) => void;
  openFiles: () => void;
  openExport: (exportId: string, name: string) => Promise<void>;
  openBrowser: (url: string, title?: string) => void;
}
const Context = createContext<PanelActions>({
  openRecord: () => {},
  openPdf: () => {},
  openText: () => {},
  openFiles: () => {},
  openExport: async () => {},
  openBrowser: () => {},
});
export const useResearchPanel = () => useContext(Context);
const tabs = [
  ["guide", "Panduan", Lightbulb],
  ["output", "Pratinjau", FileText],
  ["files", "Berkas", Folder],
  ["browser", "Browser", Globe],
  ["chat", "Sidechat", MessageSquare],
] as const;
export function ResearchPanel({
  workspace: w,
  act,
  busy,
  children,
  activity,
  onNavigate,
}: {
  workspace: Workspace;
  act: (c: Command) => Promise<boolean>;
  busy: boolean;
  children: ReactNode;
  activity: string;
  onNavigate: (activity: string) => void;
}) {
  const [tab, setTab] = useState("guide"),
    [open, setOpen] = useState(
      () =>
        window.matchMedia("(min-width: 1024px)").matches &&
        localStorage.getItem("vera:workflow:panel") !== "closed",
    ),
    [wide, setWide] = useState(false),
    [recordId, setRecordId] = useState(""),
    [pdfId, setPdfId] = useState(""),
    [pdf, setPdf] = useState(""),
    [document, setDocument] = useState<PreviewDocument | null>(null),
    [raw, setRaw] = useState(false),
    [error, setError] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [browserTarget, setBrowserTarget] = useState<{
    url: string;
    title: string;
  } | null>(null);
  const previewRequest = useRef(0);
  useEffect(
    () => () => {
      previewRequest.current++;
    },
    [],
  );
  const [selection, setSelection] = useState<ModelSelection | null>(null),
    [harnesses, setHarnesses] = useState<Harness[]>([]);
  const [refreshModels, setRefreshModels] = useState(0);
  const [recordFilter, setRecordFilter] = useState(""),
    [recordPage, setRecordPage] = useState(0);
  const filteredRecords = w.project.records.filter((r) =>
    `${r.title} ${r.authors ?? ""} ${r.doi ?? ""}`
      .toLowerCase()
      .includes(recordFilter.toLowerCase()),
  );
  useEffect(() => {
    let live = true;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;
    const load = () =>
      void Promise.all([getHarnesses(), getUiState()])
        .then(([items, state]) => {
          if (!live) return;
          const ready = items.filter((h) => h.agentReady && !h.catalogPending);
          setHarnesses(ready);
          let saved: ModelSelection | null = null;
          try {
            saved = JSON.parse(
              localStorage.getItem(`vera:workflow:model:${w.project.id}`) ||
                "null",
            );
          } catch {}
          const next =
            [saved, state.preferredAgent, defaultSelection(ready)].find(
              (v) => v && ready.some((h) => h.id === v.harness),
            ) ?? null;
          const selectedHarness = ready.find((h) => h.id === next?.harness);
          const chosenModel =
            next?.model &&
            selectedHarness?.models.length &&
            !selectedHarness.models.some((m) => m.id === next.model)
              ? selectedHarness.models[0].id
              : (next?.model ?? null);
          setSelection(
            next
              ? {
                  ...next,
                  model: chosenModel,
                  reasoningLevel: reconcileReasoning(
                    ready.find((h) => h.id === next.harness),
                    chosenModel,
                    next.reasoningLevel,
                  ),
                }
              : null,
          );
          if (
            ++attempts < 20 &&
            items.some(
              (h) =>
                h.catalogPending ||
                h.accountLoading ||
                (h.installed && h.authState === "unknown"),
            )
          )
            timer = setTimeout(load, 3000);
        })
        .catch((problem) => {
          if (live) {
            setError(String(problem));
            timer = setTimeout(load, 5000);
          }
        });
    load();
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [w.project.id, refreshModels]);
  useEffect(() => {
    let live = true;
    let url = "";
    setPdf("");
    if (pdfId)
      void artifactUrl(w.project.id, pdfId)
        .then((next) => {
          url = next;
          if (live) setPdf(next);
          else URL.revokeObjectURL(next);
        })
        .catch((problem) => live && setError(String(problem)));
    return () => {
      live = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [w.project.id, pdfId]);
  const show = (next: string) => {
    setOpen(true);
    setTab(next);
    localStorage.setItem("vera:workflow:panel", "open");
  };
  const actions: PanelActions = {
    openRecord: (id) => {
      previewRequest.current++;
      setPreviewLoading(false);
      setBrowserTarget(null);
      setRecordId(id);
      setPdfId("");
      setDocument(null);
      show("output");
    },
    openPdf: (id) => {
      previewRequest.current++;
      setPreviewLoading(false);
      setPdfId(id);
      setDocument(null);
      setRecordId("");
      show("output");
    },
    openText: (name, text) => {
      previewRequest.current++;
      setPreviewLoading(false);
      setDocument({ name, text });
      setPdfId("");
      setRecordId("");
      setRaw(false);
      show("output");
    },
    openFiles: () => show("files"),
    openBrowser: (url, title = "Sumber kajian") => {
      const next = researchBrowserUrl(url);
      if (!next) {
        setError("Alamat jurnal atau paper belum valid.");
        return;
      }
      setBrowserTarget({ url: next, title });
      show("browser");
    },
    openExport: async (exportId, name) => {
      const request = ++previewRequest.current;
      setPdfId("");
      setRecordId("");
      setDocument({ name, text: "" });
      setRaw(false);
      setError("");
      setPreviewLoading(true);
      show("output");
      try {
        const blob = await exportBlob(w.project.id, exportId, name);
        const next = {
          name,
          text: /\.docx$/i.test(name) ? "" : await blob.text(),
          blob,
        };
        if (request === previewRequest.current) setDocument(next);
      } catch (e) {
        if (request === previewRequest.current) setError(String(e));
      } finally {
        if (request === previewRequest.current) setPreviewLoading(false);
      }
    },
  };
  const selected = w.project.records.find((r) => r.id === recordId),
    harness = harnesses.find((h) => h.id === selection?.harness),
    reasoning = reasoningFor(harness, selection?.model ?? null);
  const selectedUrl =
    researchBrowserUrl(selected?.url ?? "") ||
    researchBrowserUrl(selected?.doi ?? "");
  const currentDocument: PreviewDocument = document ?? {
    name: "draft-kajian.docx",
    text: w.project.evidence.sections.length
      ? manuscript(w)
      : initialDraft(w.project),
  };
  const choose = (value: ModelSelection) => {
    const next = {
      ...value,
      reasoningLevel: reconcileReasoning(
        harnesses.find((h) => h.id === value.harness),
        value.model,
        value.reasoningLevel,
      ),
    };
    setSelection(next);
    localStorage.setItem(
      `vera:workflow:model:${w.project.id}`,
      JSON.stringify(next),
    );
  };
  const generated = [
    {
      name: "draft-kajian.docx",
      text: w.project.evidence.sections.length
        ? manuscript(w)
        : initialDraft(w.project),
    },
    { name: "rencana-kajian.docx", text: initialDraft(w.project) },
    ...workingData(w),
  ];
  const sourceFiles = [
    ...w.project.evidence.files,
    ...w.project.runs
      .filter((r) => r.sourceFile)
      .map((r) => ({
        name: r.sourceFile!,
        text: r.rawPages?.[0]?.original ?? JSON.stringify(r, null, 2),
      })),
  ];
  const attach = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 2_000_000) {
      setError(
        "Berkas teks maksimal 2 MB. Unggah PDF sumber melalui Pemilihan Sumber.",
      );
      return;
    }
    const text = await file.text();
    if (text.includes("\0")) {
      setError("Berkas biner tidak dapat dipratinjau sebagai teks.");
      return;
    }
    if (
      await act({ action: "workspace_file", data: { name: file.name, text } })
    ) {
      actions.openText(file.name, text);
      setError("");
    }
  };
  return (
    <Context.Provider value={actions}>
      <div className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden">
        {children}
        <aside
          aria-label="Panel pendamping kajian"
          className={
            open
              ? cn(
                  "flex min-h-0 shrink-0 flex-col border-l border-border bg-background max-lg:absolute max-lg:inset-y-0 max-lg:right-0 max-lg:z-30 max-lg:w-full max-lg:max-w-md max-lg:shadow-xl",
                  wide ? "w-1/2" : "w-96 max-w-full",
                )
              : "flex shrink-0 flex-col border-l border-border bg-background p-1"
          }
        >
          {!open ? (
            <>
              <IconButton
                aria-label="Buka panel kanan"
                onClick={() => show(tab)}
              >
                <PanelRightOpen size={18} />
              </IconButton>
              {tabs.map(([id, label, Icon]) => (
                <IconButton
                  key={id}
                  aria-label={`Buka ${label}`}
                  onClick={() => show(id)}
                >
                  <Icon size={17} />
                </IconButton>
              ))}
            </>
          ) : (
            <>
              <div className="flex shrink-0 items-center justify-between gap-2 px-3 py-2">
                <span className="text-xs font-medium text-subtext">
                  Panel pendamping
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    size="small"
                    variant="ghost"
                    className="hidden lg:inline-flex"
                    onClick={() => setWide(!wide)}
                  >
                    {wide ? "Ringkas" : "Perluas"}
                  </Button>
                  <IconButton
                    aria-label="Tutup panel kanan"
                    onClick={() => {
                      setOpen(false);
                      localStorage.setItem("vera:workflow:panel", "closed");
                    }}
                  >
                    <PanelRightClose size={17} />
                  </IconButton>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1 border-b border-border px-2 pb-2">
                <div
                  role="group"
                  aria-label="Panel kanan"
                  className="flex min-w-0 flex-1 gap-1"
                >
                  {tabs.map(([id, label, Icon]) => (
                    <Button
                      key={id}
                      role="button"
                      aria-pressed={tab === id}
                      aria-controls={`research-panel-${id}`}
                      id={`research-tab-${id}`}
                      size="small"
                      variant="ghost"
                      active={tab === id}
                      className="h-auto min-h-9 min-w-0 flex-1 flex-col gap-1 px-1 py-2 [&.active]:text-primary"
                      onClick={() => setTab(id)}
                    >
                      <Icon size={16} className="shrink-0" />
                      <span className="text-xs">{label}</span>
                    </Button>
                  ))}
                </div>
              </div>
              {error && (
                <p role="alert" className="px-4 text-xs text-accent-red">
                  {error}
                </p>
              )}
              <div
                role="region"
                aria-labelledby="research-tab-guide"
                id="research-panel-guide"
                className={
                  tab === "guide" ? "flex min-h-0 flex-1 flex-col" : "hidden"
                }
              >
                <ResearchGuide
                  key={`${w.project.id}:${activity}`}
                  workspace={w}
                  activity={activity}
                  act={act}
                  busy={busy}
                  selection={selection}
                  onNavigate={(next) => {
                    onNavigate(next);
                    if (!window.matchMedia("(min-width: 1024px)").matches)
                      setOpen(false);
                  }}
                  onFiles={actions.openFiles}
                  onRecord={actions.openRecord}
                  onPdf={actions.openPdf}
                  modelControls={
                    <>
                      <ModelPicker
                        value={selection}
                        onSelect={choose}
                        reasoningChoices={reasoning.choices}
                        defaultReasoningId={reasoning.defaultId}
                        onSelectReasoning={(id) =>
                          selection &&
                          choose({ ...selection, reasoningLevel: id })
                        }
                        showServiceTier={false}
                        disabled={!harnesses.length}
                        modelHeading="Model AI"
                        effortHeading="Tingkat usaha"
                      />
                      <Button
                        size="small"
                        variant="ghost"
                        onClick={() => setRefreshModels((value) => value + 1)}
                      >
                        Muat ulang model
                      </Button>
                    </>
                  }
                />
              </div>
              <div
                role="region"
                aria-labelledby="research-tab-output"
                id="research-panel-output"
                hidden={tab !== "output"}
                className="min-h-0 flex-1 overflow-y-auto"
              >
                {previewLoading ? (
                  <p role="status" className="p-4 text-sm">
                    Memuat berkas ekspor…
                  </p>
                ) : pdfId ? (
                  <div className="flex h-full min-h-0 flex-col">
                    {pdf ? (
                      <>
                        <a
                          href={pdf}
                          target="_blank"
                          rel="noreferrer"
                          className="p-3 text-xs"
                        >
                          Buka PDF di tab terpisah
                        </a>
                        <iframe
                          title="PDF sumber kajian"
                          src={pdf}
                          className="min-h-0 w-full flex-1 border-0"
                        />
                      </>
                    ) : (
                      <p role="status" className="p-4 text-sm">
                        Memuat PDF…
                      </p>
                    )}
                  </div>
                ) : selected ? (
                  <article className="p-4">
                    <h3 className="mt-0 text-base font-semibold text-balance">
                      {selected.title}
                    </h3>
                    <p className="text-xs text-subtext">
                      {selected.authors || "Penulis tidak tersedia"} ·{" "}
                      {selected.year || "Tahun tidak tersedia"}
                    </p>
                    <p className="text-xs text-subtext">
                      Metadata/abstrak dari pencarian. Belum setara pembacaan
                      teks lengkap.
                    </p>
                    {selectedUrl && (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="small"
                          onClick={() =>
                            actions.openBrowser(selectedUrl, selected.title)
                          }
                        >
                          Buka di Browser kanan
                        </Button>
                        <a
                          className="inline-flex items-center gap-1 text-xs"
                          href={selectedUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink size={13} />
                          Sumber asli
                        </a>
                      </div>
                    )}
                    <h4 className="text-sm">Abstrak</h4>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-subtext">
                      {selected.abstract || "Abstrak tidak tersedia."}
                    </p>
                    {w.artifacts
                      .filter((a) => a.recordId === selected.id)
                      .map((a) => (
                        <Button
                          key={a.id}
                          size="small"
                          onClick={() => actions.openPdf(a.id)}
                        >
                          Baca PDF
                        </Button>
                      ))}
                  </article>
                ) : (
                  <div className="p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <h3 className="m-0 text-sm font-semibold">
                        {currentDocument.name}
                      </h3>
                      {!(
                        currentDocument.blob &&
                        /\.docx$/i.test(currentDocument.name)
                      ) && (
                        <Button
                          size="small"
                          variant="ghost"
                          onClick={() => setRaw(!raw)}
                        >
                          {raw ? "Tampilan baca" : "Sumber mentah"}
                        </Button>
                      )}
                      <Button
                        size="small"
                        disabled={downloadBusy}
                        onClick={() => {
                          setDownloadBusy(true);
                          setError("");
                          void (
                            currentDocument.blob
                              ? Promise.resolve(currentDocument.blob)
                              : outputBlob(currentDocument)
                          )
                            .then((blob) =>
                              saveBlob(currentDocument.name, blob),
                            )
                            .catch((e) => setError(String(e)))
                            .finally(() => setDownloadBusy(false));
                        }}
                      >
                        {downloadBusy
                          ? "Menyiapkan…"
                          : `Unduh ${/\.docx$/i.test(currentDocument.name) ? "DOCX" : /\.csv$/i.test(currentDocument.name) ? "CSV" : "berkas"}`}
                      </Button>
                    </div>
                    <OutputPreview
                      document={currentDocument}
                      raw={raw}
                      openBrowser={(url) => actions.openBrowser(url)}
                    />
                  </div>
                )}
              </div>
              <div
                role="region"
                aria-labelledby="research-tab-files"
                id="research-panel-files"
                hidden={tab !== "files"}
                className="min-h-0 flex-1 overflow-y-auto p-4"
              >
                <p className="mt-0 text-xs leading-relaxed text-subtext">
                  Berkas dan keluaran folder kajian ini disimpan lokal. PDF
                  sumber tetap mengikuti hak akses proyek.
                </p>
                {w.actor.role === "owner" && (
                  <label className="mb-4 block text-sm">
                    Tambahkan berkas teks
                    <input
                      className="mt-2 block w-full text-xs"
                      type="file"
                      accept=".md,.txt,.json,.csv,.ris,.bib"
                      disabled={busy}
                      onChange={(ev) =>
                        void attach(ev.target.files?.[0]).catch((problem) =>
                          setError(String(problem)),
                        )
                      }
                    />
                  </label>
                )}
                <h3 className="text-sm font-semibold">
                  Keluaran kerja saat ini
                </h3>
                <p className="text-xs text-subtext">
                  DOCX untuk dokumen, CSV untuk tabel. Klik nama berkas untuk
                  meninjaunya di panel kanan. Keluaran mengikuti revisi yang
                  tersimpan.
                </p>
                {generated.map((file, i) => (
                  <div
                    key={i}
                    className="mb-2 rounded-lg border border-border p-3"
                  >
                    <Button
                      size="small"
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => actions.openText(file.name, file.text)}
                    >
                      <FileText size={14} />
                      <span className="truncate">{file.name}</span>
                    </Button>
                    <Download name={file.name} content={file.text} />
                  </div>
                ))}
                {!!w.project.evidence.exports.length && (
                  <section className="mt-6">
                    <h3 className="text-sm font-semibold">
                      Paket ekspor tersimpan
                    </h3>
                    {[...w.project.evidence.exports]
                      .reverse()
                      .map((manifest) => (
                        <details
                          key={manifest.exportId}
                          className="mb-3 rounded-lg border border-border p-3"
                        >
                          <summary className="cursor-pointer text-sm font-medium">
                            Revisi {manifest.projectRevision} ·{" "}
                            {manifest.reviewState === "ready_for_review"
                              ? "Siap ditinjau"
                              : "Draft belum lengkap"}
                          </summary>
                          {manifest.files
                            .filter((file) => /\.(docx|csv)$/i.test(file.name))
                            .map((file) => (
                              <div
                                key={file.name}
                                className="mt-3 flex flex-wrap gap-2"
                              >
                                <Button
                                  size="small"
                                  className="min-w-0 max-w-full justify-start"
                                  onClick={() =>
                                    void actions.openExport(
                                      manifest.exportId,
                                      file.name,
                                    )
                                  }
                                >
                                  <FileText size={14} />
                                  <span className="truncate">{file.name}</span>
                                </Button>
                                <Button
                                  size="small"
                                  variant="ghost"
                                  onClick={() =>
                                    void downloadExport(
                                      w.project.id,
                                      manifest.exportId,
                                      file.name,
                                    ).catch((e) => setError(String(e)))
                                  }
                                >
                                  Unduh
                                </Button>
                              </div>
                            ))}
                        </details>
                      ))}
                  </section>
                )}
                {!!sourceFiles.length && (
                  <details className="mt-6 rounded-lg border border-border p-3">
                    <summary className="cursor-pointer text-sm font-medium">
                      Berkas sumber dan lampiran ({sourceFiles.length})
                    </summary>
                    <p className="text-xs text-subtext">
                      Format asli dipertahankan agar hasil impor dapat diaudit.
                    </p>
                    {sourceFiles.map((file, i) => (
                      <div key={i} className="mt-3 flex flex-wrap gap-2">
                        <Button
                          size="small"
                          onClick={() => actions.openText(file.name, file.text)}
                        >
                          <span className="max-w-60 truncate">{file.name}</span>
                        </Button>
                        <Download name={file.name} content={file.text} />
                      </div>
                    ))}
                  </details>
                )}
                <h3 className="mt-6 text-sm font-medium">
                  Sumber tersimpan ({w.project.records.length})
                </h3>
                <label className="mb-3 block text-xs">
                  Cari sumber tersimpan
                  <input
                    className="mt-1 w-full rounded-md border border-border bg-background p-2"
                    value={recordFilter}
                    onChange={(e) => {
                      setRecordFilter(e.target.value);
                      setRecordPage(0);
                    }}
                  />
                </label>
                <p className="text-xs text-subtext">
                  {filteredRecords.length} sumber cocok · halaman{" "}
                  {recordPage + 1}
                </p>
                {filteredRecords
                  .slice(recordPage * 50, (recordPage + 1) * 50)
                  .map((r) => (
                    <Button
                      key={r.id}
                      variant="ghost"
                      className="mb-2 w-full justify-start"
                      onClick={() => actions.openRecord(r.id)}
                    >
                      <FileText size={14} />
                      <span className="truncate">{r.title}</span>
                    </Button>
                  ))}
                <div className="mb-4 flex gap-2">
                  <Button
                    size="small"
                    disabled={recordPage === 0}
                    onClick={() => setRecordPage(recordPage - 1)}
                  >
                    Sumber sebelumnya
                  </Button>
                  <Button
                    size="small"
                    disabled={(recordPage + 1) * 50 >= filteredRecords.length}
                    onClick={() => setRecordPage(recordPage + 1)}
                  >
                    Sumber berikutnya
                  </Button>
                </div>
                {w.artifacts.map((a) => (
                  <Button
                    key={a.id}
                    variant="ghost"
                    className="mb-2 w-full justify-start"
                    onClick={() => actions.openPdf(a.id)}
                  >
                    <FileText size={15} />
                    <span className="truncate">
                      {w.project.records.find((r) => r.id === a.recordId)
                        ?.title || a.id}
                      .pdf
                    </span>
                  </Button>
                ))}
              </div>
              <div
                role="region"
                aria-labelledby="research-tab-browser"
                id="research-panel-browser"
                hidden={tab !== "browser"}
                className={
                  tab === "browser" ? "flex min-h-0 flex-1 flex-col" : "hidden"
                }
              >
                <ResearchBrowser
                  key={browserTarget?.url ?? selectedUrl ?? "browser"}
                  url={browserTarget?.url ?? selectedUrl ?? ""}
                  title={
                    browserTarget?.title ?? selected?.title ?? "Browser kajian"
                  }
                />
              </div>
              <div
                role="region"
                aria-labelledby="research-tab-chat"
                id="research-panel-chat"
                hidden={tab !== "chat"}
                className={
                  tab === "chat" ? "flex min-h-0 flex-1 flex-col" : "hidden"
                }
              >
                <div className="shrink-0 border-b border-border p-3">
                  {!selection && (
                    <p className="mt-0 text-xs text-subtext">
                      Menunggu model AI yang siap. Konfigurasikan atau login
                      agent melalui pengaturan VERA bila diperlukan.
                    </p>
                  )}
                  <ModelPicker
                    value={selection}
                    onSelect={choose}
                    reasoningChoices={reasoning.choices}
                    defaultReasoningId={reasoning.defaultId}
                    onSelectReasoning={(id) =>
                      selection && choose({ ...selection, reasoningLevel: id })
                    }
                    showServiceTier={false}
                    disabled={!harnesses.length}
                    modelHeading="Model AI"
                    effortHeading="Tingkat usaha"
                    helpText="Setelan sidechat folder kajian. Pilihan tingkat usaha mengikuti model."
                  />
                </div>
                <Button
                  size="small"
                  variant="ghost"
                  className="m-2"
                  onClick={() => show("guide")}
                >
                  Buka panduan dan usulan tahap ini
                </Button>
                <div className="flex min-h-0 flex-1 flex-col">
                  <Sidechat
                    key={`${w.project.id}:${selection?.harness}`}
                    workspace={w}
                    selection={selection}
                  />
                </div>
                <Button
                  size="small"
                  variant="ghost"
                  onClick={() => setRefreshModels((value) => value + 1)}
                >
                  Muat ulang model
                </Button>
              </div>
            </>
          )}
        </aside>
      </div>
    </Context.Provider>
  );
}
function Sidechat({
  workspace: w,
  selection,
}: {
  workspace: Workspace;
  selection: ModelSelection | null;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]),
    [input, setInput] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [sending, setSending] = useState(false);
  const pendingTurn = useRef<{ text: string; id: string } | null>(null);
  const request = async (action: string, extra: object = {}) => {
    return sidechatRequest(w.project.id, {
      action,
      harness: selection?.harness,
      model: selection?.model ?? null,
      reasoningLevel: selection?.reasoningLevel ?? null,
      ...extra,
    });
  };
  useEffect(() => {
    if (!selection || w.actor.role !== "owner") return;
    let live = true;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const value = await request("read");
        if (live) {
          setMessages(value.messages);
          setBusy(value.busy);
          const last = value.messages.at(-1);
          if (last?.role === "assistant" && last.completedAt)
            setError(researchChatError(last) ?? "");
        }
      } catch (problem) {
        if (live) setError(String(problem));
      }
      if (live) timer = setTimeout(() => void poll(), 1800);
    };
    void poll();
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [selection?.harness]);
  const send = async () => {
    if (sending || busy || !input.trim()) return;
    setSending(true);
    if (pendingTurn.current?.text !== input)
      pendingTurn.current = { text: input, id: crypto.randomUUID() };
    try {
      const data = await request("send", {
        text: input,
        clientTurnId: pendingTurn.current!.id,
      });
      setMessages(data.messages);
      setBusy(data.busy);
      setInput("");
      pendingTurn.current = null;
      setError("");
    } catch (problem) {
      setError(String(problem));
    } finally {
      setSending(false);
    }
  };
  if (w.actor.role !== "owner")
    return (
      <p className="p-4 text-sm text-subtext">
        Sidechat pribadi dikelola pemilik kajian; keputusan reviewer tetap
        independen.
      </p>
    );
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className="min-h-0 flex-1 overflow-y-auto p-4"
        role="log"
        aria-label="Percakapan VERA"
        aria-live="polite"
      >
        {!messages.length && (
          <p className="mt-0 text-sm text-subtext">
            Diskusikan fokus, sumber atau tulisan. AI membaca konteks kajian
            tersimpan; jawabannya tetap usulan.
          </p>
        )}
        {messages.map((m) => (
          <article key={m.id} className="mb-5">
            <strong className="text-xs">
              {m.role === "user" ? "Anda" : "VERA"}
            </strong>
            <Md
              text={
                m.parts
                  .filter((p) => p.type === "text")
                  .map((p) => p.text ?? "")
                  .join("\n")
                  .split("PERTANYAAN MAHASISWA: ")
                  .at(-1) ?? ""
              }
            />
            {m.role === "assistant" &&
              m.completedAt &&
              researchChatError(m) && (
                <p className="text-xs text-accent-red">
                  {researchChatError(m)}
                </p>
              )}
          </article>
        ))}
        {busy && (
          <p role="status" className="text-xs text-subtext">
            VERA sedang menyiapkan jawaban…
          </p>
        )}
        {error && (
          <p role="alert" className="text-xs text-accent-red">
            {error}
          </p>
        )}
      </div>
      <form
        className="shrink-0 border-t border-border p-3"
        onSubmit={(ev) => {
          ev.preventDefault();
          void send();
        }}
      >
        <label className="text-xs">
          Pertanyaan untuk VERA
          <textarea
            className="mt-2 block w-full"
            rows={3}
            maxLength={16000}
            value={input}
            onChange={(ev) => setInput(ev.target.value)}
            disabled={!selection || sending}
          />
        </label>
        <div className="mt-2 flex justify-end gap-2">
          {busy ? (
            <Button
              size="small"
              onClick={() =>
                void request("stop")
                  .then((data) => setBusy(data.busy))
                  .catch((problem) => setError(String(problem)))
              }
            >
              Hentikan
            </Button>
          ) : (
            <Button
              type="submit"
              size="small"
              variant="primary"
              disabled={!selection || sending || !input.trim()}
            >
              {sending ? "Mengirim…" : "Kirim"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
