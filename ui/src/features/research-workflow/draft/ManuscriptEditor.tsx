import { useEffect, useState } from "react";
import { Button } from "../../../components/ui";
import { Select } from "../../../components/ui/Select";
import { Field, Notice, Section, Download } from "../shared";
import { useResearchPanel } from "../panels/ResearchPanel";
import type { Command, Workspace } from "../types";
export const sectionLabels: Record<string, string> = {
  title: "Judul",
  abstract: "Abstrak",
  introduction: "Pendahuluan",
  methods: "Metode",
  results: "Hasil",
  discussion: "Pembahasan",
  conclusion: "Kesimpulan",
  references: "Referensi",
  appendix: "Lampiran",
};
export const sectionStatuses: Record<string, string> = {
  empty: "Kosong",
  outline: "Kerangka",
  draft: "Draft",
  needs_review: "Perlu ditinjau",
  verified: "Ditinjau sesuai prosedur proyek",
};
export function manuscript(w: Workspace): string {
  return [
    `# ${w.project.direction.title || w.project.name}`,
    "Status: draft kerja; periksa klaim, cakupan dan prosedur yang benar-benar dilaksanakan.",
    `Versi proyek ${w.project.revision}; seleksi ${w.project.selectionRevision}; form ${w.project.evidence.schemas.at(-1)?.version ?? 0}.`,
    ...Object.entries(sectionLabels).map(([key, label]) => {
      const section = w.project.evidence.sections.find((s) => s.key === key);
      return `## ${label}\n\nStatus: ${sectionStatuses[section?.status ?? "empty"]}\n\n${section?.text || "[Belum ditulis.]"}`;
    }),
    "## Catatan integritas",
    `${w.evidenceSummary.included.length} laporan included; ${w.evidenceSummary.confirmedRows.length} baris terkonfirmasi. ${w.reviewMode === "practice" ? "Proyek memakai mode latihan satu penilai." : ""} ${w.evidenceSummary.synthesisStale ? "Sintesis perlu dihitung ulang." : ""}`,
    `${w.project.evidence.claims.filter((c) => c.reviewStatus !== "superseded" && (c.reviewStatus !== "verified" || c.dependency !== w.evidenceSummary.dependency)).length} tautan klaim belum diverifikasi atau berubah. Verifikasi manusia bukan jaminan kebenaran absolut.`,
    `Paket Word, checklist dan pemetaan halaman tersedia melalui Audit dan Ekspor. Pratinjau ini mengikuti draft kerja saat ini.`,
  ].join("\n\n");
}
export function ManuscriptEditor({
  workspace: w,
  act,
  busy,
}: {
  workspace: Workspace;
  act: (c: Command) => Promise<boolean>;
  busy: boolean;
}) {
  const [key, setKey] = useState("introduction");
  const panel = useResearchPanel();
  return (
    <Section
      title="Draft artikel"
      description="Tulis sejak awal. Rencana dan kegiatan aktual dibedakan; usulan baru diterapkan melalui revisi yang terlihat."
    >
      <nav
        aria-label="Bagian artikel"
        className="mb-5 grid grid-cols-3 gap-1 rounded-xl border border-border bg-background p-2"
      >
        {Object.entries(sectionLabels).map(([id, label]) => (
          <Button
            key={id}
            size="small"
            active={id === key}
            aria-pressed={id === key}
            className="h-auto min-h-9 whitespace-normal px-2 py-2 text-xs [&.active]:text-primary"
            variant="ghost"
            onClick={() => setKey(id)}
          >
            {label}
          </Button>
        ))}
      </nav>
      <div className="mb-4 rounded-xl border border-border bg-background p-4 sm:p-5">
        <SectionEditor
          key={key}
          sectionKey={key}
          workspace={w}
          act={act}
          busy={busy}
        />
      </div>
      <div className="flex flex-wrap gap-2"><Download name="draft-kajian.docx" content={manuscript(w)} /><Button onClick={() => panel.openText("draft-kajian.docx", manuscript(w))}>Tinjau DOCX di panel</Button></div>
    </Section>
  );
}
function SectionEditor({
  sectionKey: key,
  workspace: w,
  act,
  busy,
}: {
  sectionKey: string;
  workspace: Workspace;
  act: (c: Command) => Promise<boolean>;
  busy: boolean;
}) {
  const section = w.project.evidence.sections.find((s) => s.key === key),
    cacheKey = `vera:workflow:section:${w.project.id}:${key}`,
    panel = useResearchPanel(),
    owner = w.actor.role === "owner";
  const [recovery] = useState<{
    text: string;
    status: string;
    baseRevision: number;
  } | null>(() => {
    try {
      return owner
        ? JSON.parse(localStorage.getItem(cacheKey) || "null")
        : null;
    } catch {
      return null;
    }
  });
  const [content, setContent] = useState(recovery?.text ?? section?.text ?? ""),
    [status, setStatus] = useState(
      recovery?.status ?? section?.status ?? "draft",
    ),
    [dirty, setDirty] = useState(!!recovery),
    [claim, setClaim] = useState(""),
    [claimType, setClaimType] = useState("factual"),
    [sourceLevel, setSourceLevel] = useState("fulltext"),
    [recordId, setRecordId] = useState(""),
    [cellId, setCellId] = useState(""),
    [checked, setChecked] = useState(false),
    [suggestion, setSuggestion] = useState("");
  useEffect(() => {
    if (!dirty) return;
    localStorage.setItem(
      cacheKey,
      JSON.stringify({
        text: content,
        status,
        baseRevision: recovery?.baseRevision ?? w.project.revision,
      }),
    );
  }, [content, status, dirty]);
  useEffect(() => {
    const guard = (ev: BeforeUnloadEvent) => {
      if (dirty) ev.preventDefault();
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty]);
  const save = async (next = content, nextStatus = status) => {
    if (
      await act({
        action: "draft_section",
        data: { key, text: next, status: nextStatus },
      })
    ) {
      setContent(next);
      setStatus(nextStatus);
      setDirty(false);
      localStorage.removeItem(cacheKey);
    }
  };
  const cells = w.project.evidence.cells.filter(
    (c) =>
      c.recordId === recordId &&
      c.verificationStatus === "confirmed" &&
      w.project.evidence.cells
        .slice()
        .reverse()
        .find((v) => v.recordId === c.recordId && v.columnId === c.columnId)
        ?.id === c.id,
  );
  const selected = cells.find((c) => c.id === cellId);
  const propose = () => {
    const p = w.project;
    setSuggestion(
      key === "title"
        ? p.direction.title
        : key === "methods"
          ? `Rencana acuan versi ${p.protocolRevision}. Prosedur yang direncanakan: ${p.protocol.screening}\n\nPencarian aktual tersimpan: ${p.runs.filter((r) => r.purpose === "formal").length} run formal; ${w.ledger.identified ?? 0} record diterima; ${w.ledger.includedReports ?? 0} laporan included. ${w.reviewMode === "practice" ? "Seleksi saat ini dilakukan dalam mode latihan satu penilai." : "Dua identitas reviewer terdaftar; periksa keputusan aktual sebelum menyatakan seluruh prosedur selesai."}\n\nPencatatan yang direncanakan: ${p.protocol.charting}\n\nLengkapi batas cakupan, konflik dan rincian prosedur aktual.`
          : key === "results"
            ? `[Kerangka hasil: laporkan alur seleksi dari ledger dan rangkum peta temuan terkonfirmasi. Jangan menyimpulkan efek dari frekuensi kategori.]\n\nLaporan included saat ini: ${w.ledger.includedReports ?? 0}; baris terkonfirmasi: ${w.evidenceSummary.confirmedRows.length}. ${w.evidenceSummary.synthesisStale ? "Peta temuan perlu dihitung ulang." : ""}`
            : key === "references"
              ? p.records
                  .filter((r) => w.evidenceSummary.included.includes(r.id))
                  .map(
                    (r) =>
                      `${r.authors || "[Penulis perlu diperiksa]"} (${r.year || "[Tahun perlu diperiksa]"}). ${r.title}. ${r.doi ? `https://doi.org/${r.doi}` : r.url || "[URL perlu diperiksa]"}`,
                  )
                  .join("\n\n")
              : key === "introduction"
                ? p.protocol.rationale ||
                  "[Tuliskan rasional dan kaitkan klaim faktual dengan sumber.]"
                : `[Kerangka ${sectionLabels[key].toLowerCase()}: tuliskan berdasarkan bukti yang telah diperiksa, dengan batas cakupan dan ketidakpastian.]`,
    );
  };
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="m-0 text-base font-semibold">{sectionLabels[key]}</h3>
        <Select
          aria-label="Status bagian draft"
          disabled={!owner}
          value={status}
          onChange={(ev) => {
            setStatus(ev.target.value);
            setDirty(true);
          }}
        >
          {Object.entries(sectionStatuses).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </Select>
      </div>
      {section?.status === "needs_review" && (
        <Notice>
          Versi bukti berubah. Tulisan dipertahankan; tinjau bagian dan tautan
          klaim sebelum menandai terverifikasi.
        </Notice>
      )}
      {recovery && (
        <Notice>
          Salinan lokal dipulihkan dari revisi {recovery.baseRevision}.
          Bandingkan dengan versi tersimpan sebelum menerapkannya.
          {section && (
            <details>
              <summary>Teks tersimpan di server</summary>
              <p className="whitespace-pre-wrap">{section.text}</p>
            </details>
          )}
        </Notice>
      )}
      <textarea
        aria-label={`Isi bagian ${sectionLabels[key]}`}
        className="mb-4 min-h-64 w-full rounded-md border border-border bg-background p-4 text-sm leading-relaxed"
        rows={14}
        maxLength={200000}
        readOnly={!owner}
        value={content}
        onChange={(ev) => {
          setContent(ev.target.value);
          setDirty(true);
        }}
      />
      <div className="mb-6 flex flex-wrap gap-2">
        {owner && (
          <Button
            variant="primary"
            disabled={busy || !dirty}
            onClick={() => void save()}
          >
            Simpan bagian
          </Button>
        )}
        <Button
          onClick={() => panel.openText(`${sectionLabels[key]}.docx`, content)}
        >
          Pratinjau di kanan
        </Button>
        {owner && (
          <Button disabled={busy} onClick={propose}>
            Siapkan usulan kerangka
          </Button>
        )}
        <span role="status" className="self-center text-xs text-subtext">
          {dirty
            ? "Perubahan lokal · simpan bagian untuk membuat revisi"
            : "Tersimpan"}
        </span>
      </div>
      {suggestion && (
        <details
          open
          className="mb-6 rounded-xl border border-border bg-background p-4"
        >
          <summary className="font-medium">Usulan untuk ditinjau</summary>
          <p className="whitespace-pre-wrap text-sm text-subtext">
            {suggestion}
          </p>
          <Button
            disabled={busy}
            onClick={() =>
              void save(
                content ? `${content}\n\n${suggestion}` : suggestion,
                "outline",
              ).then(() => setSuggestion(""))
            }
          >
            Terapkan dengan menambahkan ke draft
          </Button>
          <Button variant="ghost" onClick={() => setSuggestion("")}>
            Abaikan
          </Button>
        </details>
      )}
      <details className="mb-6 rounded-xl border border-border bg-background p-4">
        <summary className="cursor-pointer font-medium">
          Klaim dan bukti ·{" "}
          {w.project.evidence.claims.filter((c) => c.sectionKey === key).length}
        </summary>
        <p className="text-xs text-subtext">
          DOI/metadata valid berbeda dengan dukungan isi. Pilih sel
          terkonfirmasi untuk membawa lokasi bukti teks lengkap. Klaim statistik
          memerlukan sintesis terkini. Pemeriksaan manusia tetap diperlukan
          untuk kutipan yang belum ditautkan dan generalisasi.
        </p>
        {owner && (
          <>
            <Field
              label="Teks klaim persis seperti pada bagian tersimpan"
              value={claim}
              onChange={setClaim}
            />
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                Jenis klaim
                <Select
                  className="mt-2 w-full"
                  aria-label="Jenis klaim"
                  value={claimType}
                  onChange={(ev) => setClaimType(ev.target.value)}
                >
                  <option value="factual">Faktual</option>
                  <option value="statistic">Statistik</option>
                  <option value="interpretation">Interpretasi</option>
                  <option value="author_intent">Tujuan penulis</option>
                </Select>
              </label>
              <label className="text-sm">
                Level sumber
                <Select
                  className="mt-2 w-full"
                  aria-label="Level bukti klaim"
                  value={sourceLevel}
                  onChange={(ev) => setSourceLevel(ev.target.value)}
                >
                  <option value="metadata">Metadata saja</option>
                  <option value="abstract">Abstrak</option>
                  <option value="fulltext">Teks lengkap</option>
                </Select>
              </label>
            </div>
            <label className="mb-4 block text-sm">
              Sumber pendukung
              <Select
                aria-label="Sumber pendukung klaim"
                className="mt-2 w-full"
                value={recordId}
                onChange={(ev) => {
                  setRecordId(ev.target.value);
                  setCellId("");
                }}
              >
                <option value="">Pilih sumber</option>
                {w.project.records.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </Select>
            </label>
            <label className="mb-4 block text-sm">
              Sel charting terkonfirmasi
              <Select
                className="mt-2 w-full"
                aria-label="Sel bukti klaim"
                value={cellId}
                onChange={(ev) => setCellId(ev.target.value)}
              >
                <option value="">Tanpa sel (metadata/abstrak/tujuan)</option>
                {cells.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.columnId}: {c.value || c.state}
                  </option>
                ))}
              </Select>
            </label>
            <Button
              disabled={busy || dirty || !claim.trim()}
              onClick={() =>
                void act({
                  action: "claim",
                  data: {
                    id: "",
                    sectionKey: key,
                    text: claim,
                    claimType,
                    recordIds: recordId ? [recordId] : [],
                    cellIds: cellId ? [cellId] : [],
                    sourceLevel,
                    locators: selected ? [selected.locator] : [],
                    reviewStatus: "needs_review",
                    reviewer: null,
                    dependency: "",
                  },
                })
              }
            >
              Tautkan klaim
            </Button>
          </>
        )}
        {w.project.evidence.claims
          .filter((c) => c.sectionKey === key)
          .map((c) => (
            <article
              key={c.id}
              className="mt-4 border-t border-border pt-4 text-sm"
            >
              <p>{c.text}</p>
              <p className="text-xs text-subtext">
                {c.claimType} · {c.sourceLevel} · {c.reviewStatus}{" "}
                {c.dependency !== w.evidenceSummary.dependency
                  ? "· bukti berubah"
                  : ""}
              </p>
              {c.recordIds.map((id) => (
                <Button
                  key={id}
                  size="small"
                  variant="ghost"
                  onClick={() => panel.openRecord(id)}
                >
                  Periksa sumber
                </Button>
              ))}
              {owner && c.reviewStatus !== "superseded" && (
                <>
                  <label className="my-3 flex gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(ev) => setChecked(ev.target.checked)}
                    />
                    Saya memeriksa bahwa sumber mendukung klaim, angka dan batas
                    generalisasinya.
                  </label>
                  <Button
                    size="small"
                    disabled={busy || !checked}
                    onClick={() =>
                      void act({
                        action: "claim_verify",
                        data: { claimId: c.id, supportChecked: checked },
                      })
                    }
                  >
                    Catat pemeriksaan dukungan
                  </Button>
                  <Button
                    size="small"
                    variant="ghost"
                    disabled={busy}
                    onClick={() =>
                      void act({
                        action: "claim_retire",
                        data: {
                          claimId: c.id,
                          reason:
                            "Pengguna mengganti atau menarik tautan klaim melalui editor; riwayat dipertahankan.",
                        },
                      })
                    }
                  >
                    Ganti / tarik tautan klaim
                  </Button>
                </>
              )}
            </article>
          ))}
      </details>
    </>
  );
}
