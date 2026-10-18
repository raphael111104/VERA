import { Select } from "../../../components/ui/Select";
import { useEffect, useState } from "react";
import { Button } from "../../../components/ui";
import { useResearchPanel } from "../panels/ResearchPanel";
import { Field, Notice, Section } from "../shared";
import type { Command, Workspace } from "../types";

const labels: Record<string, string> = {
  pending: "Menunggu keputusan",
  include: "Dipilih",
  exclude: "Tidak sesuai",
  uncertain: "Belum yakin",
  conflict: "Perlu penyelesaian perbedaan",
  needs_review: "Perlu ditinjau kembali",
};
const ledgerLabels: Record<string, string> = {
  identified: "Record formal diterima",
  duplicates: "Duplikasi disisihkan",
  eligibleRecords: "Record dalam set",
  screened: "Judul-abstrak dinilai",
  pending: "Menunggu penilaian",
  excluded: "Eksklusi judul-abstrak",
  sought: "Laporan dicari",
  notRetrieved: "Teks belum diperoleh",
  assessed: "Teks lengkap dinilai",
  fullExcluded: "Eksklusi teks lengkap",
  includedReports: "Laporan terpilih",
  conflicts: "Perbedaan belum selesai",
};

export function SelectionWorkspace({
  workspace,
  act,
  busy,
}: {
  workspace: Workspace;
  act: (command: Command) => Promise<boolean>;
  busy: boolean;
}) {
  const p = workspace.project,
    owner = workspace.actor.role === "owner",
    panel = useResearchPanel();
  const [recordId, setRecordId] = useState(""),
    [stage, setStage] = useState("title"),
    [verdict, setVerdict] = useState(""),
    [reason, setReason] = useState(""),
    [name, setName] = useState(""),
    [declared, setDeclared] = useState(false),
    [link, setLink] = useState(""),
    [limitations, setLimitations] = useState(false),
    [legal, setLegal] = useState(false),
    [error, setError] = useState("");
  const formalIds = new Set(
    p.runs.filter((r) => r.purpose === "formal").map((r) => r.id),
  );
  const removed = new Set(
    p.merges.filter((m) => m.active).map((m) => m.duplicateId),
  );
  const records = p.records.filter(
    (r) => formalIds.has(r.runId) && !removed.has(r.id),
  );
  const record = records.find((r) => r.id === recordId) ?? records[0];
  const retrieval = p.retrievals
    .slice()
    .reverse()
    .find((r) => r.recordId === record?.id);
  const status = workspace.statuses.find((s) => s.recordId === record?.id);
  const own = p.decisions
    .slice()
    .reverse()
    .find(
      (d) =>
        d.recordId === record?.id &&
        d.stage === stage &&
        d.actorId === workspace.actor.id &&
        d.selectionRevision === p.selectionRevision &&
        d.protocolRevision === p.protocolRevision,
    );
  useEffect(() => {
    setVerdict("");
    setReason("");
  }, [record?.id, stage]);

  const upload = async (file: File | undefined) => {
    if (!file || !record) return;
    if (!legal) {
      setError("Konfirmasi akses legal sebelum unggah.");
      return;
    }
    if (file.size > 4_000_000) {
      setError("PDF maksimal 4 MB.");
      return;
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = "";
    for (const b of bytes) binary += String.fromCharCode(b);
    await act({
      action: "upload_fulltext",
      data: {
        recordId: record.id,
        filename: file.name,
        base64: btoa(binary),
        legalAccess: legal,
      },
    });
  };
  return (
    <Section
      title="Pilih sumber yang sesuai"
      description="Nilai berdasarkan kriteria versi acuan. Keputusan awal tetap tersimpan; perbedaan diselesaikan dengan alasan tersendiri."
    >
      <Notice>
        {workspace.reviewMode === "two_reviewers"
          ? "Dua identitas reviewer terdaftar. Masing-masing harus dipakai oleh manusia yang berbeda; AI tidak menggantikan reviewer."
          : "Latihan satu reviewer. Prosedur dua manusia belum terpenuhi."}{" "}
        Keputusan pihak lain disembunyikan sampai keduanya mengirim keputusan
        pada record dan tahap yang sama.
      </Notice>
      {owner && (
        <details className="mb-6 rounded-lg border border-border bg-background p-4">
          <summary className="cursor-pointer text-sm font-medium">
            Reviewer dan akses proyek
          </summary>
          <p className="text-xs leading-relaxed text-subtext">
            Buat undangan untuk dua manusia. Buka masing-masing pada
            browser/profil terpisah. Tautan berlaku 30 hari dan memberi akses
            reviewer pada proyek ini. Pemilik/administrator komputer tetap pihak
            tepercaya.
          </p>
          <ul className="list-none p-0">
            {workspace.members.map((m) => (
              <li
                key={m.id}
                className="my-2 flex items-center justify-between gap-3 text-sm"
              >
                <span>{m.name}</span>
                <Button
                  size="small"
                  disabled={busy}
                  onClick={() =>
                    void act({ action: "revoke", data: { actorId: m.id } })
                  }
                >
                  Cabut akses
                </Button>
              </li>
            ))}
          </ul>
          {workspace.members.length < 2 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const token = crypto.randomUUID() + crypto.randomUUID();
                void act({
                  action: "invite",
                  data: { name, token, declaredHuman: declared },
                }).then((saved) => {
                  if (!saved) return;
                  setLink(
                    `${location.origin}/research/${p.id}#reviewer=${encodeURIComponent(token)}`,
                  );
                  setName("");
                  setDeclared(false);
                });
              }}
            >
              <label className="block text-sm">
                Nama reviewer
                <input
                  className="my-2 block w-full border border-border bg-background p-2"
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>
              <label className="my-3 flex gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={declared}
                  onChange={(e) => setDeclared(e.target.checked)}
                />
                Reviewer adalah manusia yang berbeda dari reviewer lain.
              </label>
              <Button
                type="submit"
                disabled={busy || !declared || !name.trim()}
              >
                Buat undangan reviewer
              </Button>
            </form>
          )}
          {link && (
            <label className="mt-4 block text-xs text-subtext">
              Salin tautan undangan ini dan sampaikan kepada reviewer yang
              dituju
              <input
                className="mt-2 block w-full border border-border bg-background p-2 text-sm"
                readOnly
                value={link}
                onFocus={(e) => e.target.select()}
              />
            </label>
          )}
        </details>
      )}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {["identified", "pending", "includedReports", "conflicts"].map(
          (key) => (
            <div
              key={key}
              className="rounded-lg border border-border bg-background p-3"
            >
              <p className="m-0 text-xs text-subtext">{ledgerLabels[key]}</p>
              <strong className="mt-1 block text-xl tabular-nums">
                {String(workspace.ledger[key] ?? 0)}
              </strong>
            </div>
          ),
        )}
      </div>
      <details className="mb-5 rounded-lg border border-border bg-background p-4 text-sm">
        <summary className="cursor-pointer font-medium">
          Rincian alur dan jumlah seleksi
        </summary>
        <dl className="my-4 grid grid-cols-2 gap-4">
          {Object.entries(ledgerLabels).map(([key, label]) => (
            <div key={key}>
              <dt className="text-xs text-subtext">{label}</dt>
              <dd className="ml-0 mt-1 font-medium tabular-nums">
                {String(workspace.ledger[key] ?? 0)}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mb-0 text-xs leading-relaxed text-subtext">
          Angka memakai unit record/laporan, bukan jumlah studi. Satu studi
          dapat memiliki beberapa laporan. Data eksploratif tidak masuk ledger.
        </p>
      </details>
      {owner && (
        <>
          {workspace.duplicateCandidates.length > 0 && (
            <details className="mb-5 rounded-lg border border-border p-4">
              <summary className="cursor-pointer text-sm font-medium">
                {workspace.duplicateCandidates.length} pasangan kemungkinan
                duplikat
              </summary>
              {workspace.duplicateCandidates.map((pair) => (
                <div
                  key={pair.canonicalId + pair.duplicateId}
                  className="my-4 border-b border-border pb-4 text-sm"
                >
                  <p>
                    {p.records.find((r) => r.id === pair.canonicalId)?.title}
                    <br />
                    {p.records.find((r) => r.id === pair.duplicateId)?.title}
                  </p>
                  <p className="text-xs text-subtext">{pair.reason}</p>
                  <Button
                    size="small"
                    disabled={busy}
                    onClick={() => void act({ action: "merge", data: pair })}
                  >
                    Konfirmasi penggabungan
                  </Button>
                </div>
              ))}
            </details>
          )}
          {p.merges
            .filter((m) => m.active)
            .map((m) => (
              <p key={m.id} className="text-sm text-subtext">
                Duplikasi digabung:{" "}
                {p.records.find((r) => r.id === m.duplicateId)?.title}{" "}
                <Button
                  size="small"
                  disabled={busy}
                  onClick={() =>
                    void act({ action: "undo_merge", data: { mergeId: m.id } })
                  }
                >
                  Batalkan penggabungan
                </Button>
              </p>
            ))}
          {p.selectionStale && (
            <Notice>
              Set seleksi perlu dibekukan setelah hasil formal, rencana atau
              anggota berubah. Keputusan lama tetap disimpan tetapi belum
              dipakai pada versi set baru.
              <label className="my-3 flex gap-2">
                <input
                  type="checkbox"
                  checked={limitations}
                  onChange={(e) => setLimitations(e.target.checked)}
                />
                Saya meninjau run parsial/gagal dan versi rencana lama serta
                menerima keterbatasan cakupannya, bila ada.
              </label>
              <Button
                variant="primary"
                disabled={busy || !p.runs.some((r) => r.purpose === "formal")}
                onClick={() =>
                  void act({
                    action: "freeze_selection",
                    data: { acceptLimitations: limitations },
                  })
                }
              >
                Bekukan set untuk seleksi
              </Button>
            </Notice>
          )}
        </>
      )}
      {!record ? (
        <Notice>
          Belum ada sumber formal. Jalankan pencarian atau impor formal melalui
          tahap Sumber.
        </Notice>
      ) : (
        <div className="grid gap-5 xl:grid-cols-3">
          <aside className="max-h-96 overflow-y-auto rounded-lg border border-border p-2 xl:col-span-1">
            <p className="px-2 text-xs text-subtext">Antrean sumber</p>
            {records.map((r) => (
              <button
                key={r.id}
                type="button"
                className="mb-1 block w-full rounded-lg border border-border bg-background p-3 text-left text-sm focus-visible:outline-2 focus-visible:outline-text aria-pressed:border-primary aria-pressed:bg-surface"
                aria-pressed={record.id === r.id}
                onClick={() => setRecordId(r.id)}
              >
                <span className="block font-medium">{r.title}</span>
                <span className="mt-1 block text-xs text-subtext">
                  {
                    labels[
                      workspace.statuses.find((s) => s.recordId === r.id)
                        ?.title ?? "pending"
                    ]
                  }
                </span>
              </button>
            ))}
          </aside>
          <article className="rounded-lg border border-border bg-background p-5 xl:col-span-2">
            <h3 className="mt-0 text-lg font-semibold text-balance">
              {record.title}
            </h3>
            <p className="text-xs text-subtext">
              {record.authors || "Penulis belum tersedia"} ·{" "}
              {record.year || "Tahun belum tersedia"} ·{" "}
              {record.doi || record.rawId}
            </p>
            <Button size="small" onClick={() => panel.openRecord(record.id)}>
              Pratinjau sumber di kanan
            </Button>
            {record.url && /^https:\/\//.test(record.url) && (
              <a
                href={record.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-primary"
              >
                Buka sumber/DOI
              </a>
            )}
            <details className="my-4 text-sm" open>
              <summary>Abstrak yang tersedia</summary>
              <p className="leading-relaxed text-subtext">
                {record.abstract ||
                  "Abstrak tidak tersedia. Metadata tidak setara pembacaan teks lengkap."}
              </p>
            </details>
            <details className="my-4 text-sm">
              <summary>Kriteria versi acuan {p.protocolRevision}</summary>
              <p>Inklusi: {p.protocol.inclusion}</p>
              <p>Eksklusi: {p.protocol.exclusion}</p>
            </details>
            <div className="my-4 flex gap-2">
              <Button
                size="small"
                variant={stage === "title" ? "primary" : "ghost"}
                onClick={() => setStage("title")}
              >
                Judul-abstrak
              </Button>
              <Button
                size="small"
                variant={stage === "fulltext" ? "primary" : "ghost"}
                onClick={() => setStage("fulltext")}
              >
                Teks lengkap
              </Button>
            </div>
            <p className="text-sm">
              Status bersama:{" "}
              {
                labels[
                  (stage === "title" ? status?.title : status?.fulltext) ??
                    "pending"
                ]
              }
            </p>
            {own && (
              <Notice>
                Keputusan Anda: {labels[own.verdict]} — {own.reason}. Koreksi
                berikutnya membuat entri baru, tanpa menimpa keputusan ini.
              </Notice>
            )}
            {stage === "fulltext" && (
              <>
                <Notice>
                  Status perolehan: {retrieval?.status || "not_requested"}
                  {retrieval?.reason && ` — ${retrieval.reason}`}. Belum
                  diperoleh berarti belum dinilai, bukan eksklusi setelah teks
                  lengkap.
                </Notice>
                {owner && (
                  <>
                    <label className="my-3 flex gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={legal}
                        onChange={(e) => setLegal(e.target.checked)}
                      />
                      Saya memiliki akses legal ke PDF yang diunggah.
                    </label>
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      aria-label="Unggah PDF teks lengkap"
                      disabled={busy || !legal}
                      onChange={(e) =>
                        void upload(e.target.files?.[0]).catch((problem) =>
                          setError(String(problem)),
                        )
                      }
                    />
                    <Field
                      label="Catatan perolehan atau alasan belum diperoleh"
                      value={reason}
                      onChange={setReason}
                    />
                    <div className="mb-4 flex flex-wrap gap-2">
                      {[
                        ["requested", "Catat permintaan"],
                        ["not_retrieved", "Catat belum diperoleh"],
                      ].map(([value, label]) => (
                        <Button
                          key={value}
                          size="small"
                          disabled={busy || !reason.trim()}
                          onClick={() =>
                            void act({
                              action: "retrieval",
                              data: {
                                recordId: record.id,
                                status: value,
                                reason,
                              },
                            })
                          }
                        >
                          {label}
                        </Button>
                      ))}
                    </div>
                  </>
                )}
                {retrieval?.artifactId && (
                  <Button
                    size="small"
                    onClick={() => panel.openPdf(retrieval.artifactId!)}
                  >
                    Baca teks lengkap di panel kanan
                  </Button>
                )}
              </>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void act({
                  action: "decision",
                  data: { recordId: record.id, stage, verdict, reason },
                }).then((saved) => {
                  if (!saved) return;
                  setVerdict("");
                  setReason("");
                });
              }}
            >
              <label className="block text-sm font-medium">
                Keputusan Anda
                <Select
                  className="my-2 block w-full border border-border bg-background p-3"
                  value={verdict}
                  onChange={(e) => setVerdict(e.target.value)}
                >
                  <option value="">
                    Pilih setelah membaca sumber dan kriteria
                  </option>
                  <option value="include">Pilih / lanjutkan</option>
                  <option value="exclude">Tidak sesuai kriteria</option>
                  <option value="uncertain">Belum yakin</option>
                </Select>
              </label>
              <Field
                label="Alasan berbasis kriteria"
                value={reason}
                onChange={setReason}
              />
              <Button
                type="submit"
                variant="primary"
                disabled={
                  busy ||
                  p.selectionStale ||
                  !verdict ||
                  !reason.trim() ||
                  (owner && workspace.members.length > 0) ||
                  (stage === "fulltext" && retrieval?.status !== "retrieved")
                }
              >
                Simpan keputusan
              </Button>
            </form>
            {owner &&
              (stage === "title" ? status?.title : status?.fulltext) ===
                "conflict" && (
                <div className="mt-5 border-t border-border pt-4">
                  <h4>Perbedaan keputusan</h4>
                  {p.decisions
                    .filter(
                      (d) =>
                        d.recordId === record.id &&
                        d.stage === stage &&
                        d.selectionRevision === p.selectionRevision,
                    )
                    .map((d) => (
                      <p key={d.id} className="text-sm">
                        {workspace.members.find((m) => m.id === d.actorId)
                          ?.name || d.actorId}
                        : {labels[d.verdict]} — {d.reason}
                      </p>
                    ))}
                  <p className="text-xs text-subtext">
                    Pemilik bertindak sebagai adjudikator lokal; alasan dan
                    keputusan awal tetap tersimpan.
                  </p>
                  <Button
                    disabled={
                      busy ||
                      !["include", "exclude"].includes(verdict) ||
                      !reason.trim()
                    }
                    onClick={() =>
                      void act({
                        action: "resolve",
                        data: { recordId: record.id, stage, verdict, reason },
                      })
                    }
                  >
                    Simpan resolusi dengan alasan di atas
                  </Button>
                </div>
              )}
            {error && (
              <p role="alert" className="text-sm text-accent-red">
                {error}
              </p>
            )}
          </article>
        </div>
      )}
    </Section>
  );
}
