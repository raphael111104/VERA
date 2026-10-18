import { useState } from "react";
import { Button } from "../../../components/ui";
import { Notice, Section, Download, Field } from "../shared";
import { objectCsv } from "../outputs";
import { useResearchPanel } from "../panels/ResearchPanel";
import { TermHelp } from "../TermHelp";
import type { Command, Workspace } from "../types";
export function SynthesisWorkspace({
  workspace: w,
  act,
  busy,
}: {
  workspace: Workspace;
  act: (c: Command) => Promise<boolean>;
  busy: boolean;
}) {
  const [approve, setApprove] = useState(false),
    e = w.project.evidence,
    synthesis = e.syntheses.at(-1);
  const panel = useResearchPanel();
  const [theme, setTheme] = useState(""),
    [cellIds, setCellIds] = useState<string[]>([]);
  const confirmed = e.cells.filter(
    (c) =>
      c.verificationStatus === "confirmed" &&
      c.schemaVersion === e.schemas.at(-1)?.version &&
      c.protocolRevision === w.project.protocolRevision &&
      c.selectionRevision === w.project.selectionRevision,
  );
  return (
    <Section
      title="Peta temuan"
      description="Tabel dihitung dari baris terkonfirmasi pada set seleksi dan form aktif. Kategori mengikuti definisi kolom yang Anda setujui."
    >
      <TermHelp terms={["codebook", "charting"]} />
      <Notice>
        {w.evidenceSummary.included.length} laporan lolos seleksi ·{" "}
        {w.evidenceSummary.confirmedRows.length} baris siap. Baris belum
        terkonfirmasi tidak masuk perhitungan. Hasil kosong tetap dilaporkan
        sebagai hasil kosong.
      </Notice>
      {w.actor.role === "owner" && (
        <div className="mb-6 rounded-xl border border-border bg-background p-4">
          <label className="mb-4 flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={approve}
              onChange={(ev) => setApprove(ev.target.checked)}
            />
            Saya telah meninjau aturan kategori, informasi yang belum tersedia,
            dan cakupan baris yang dihitung.
          </label>
          <Button
            variant="primary"
            disabled={busy || !approve}
            onClick={() =>
              void act({
                action: "synthesis",
                data: { approveCodebook: approve },
              })
            }
          >
            Hitung versi peta temuan
          </Button>
        </div>
      )}
      {synthesis && w.evidenceSummary.synthesisStale && (
        <Notice>
          Bukti berubah setelah sintesis ini dihitung. Tabel lama dipertahankan;
          hitung versi baru setelah meninjau data.
        </Notice>
      )}
      {synthesis ? (
        <>
          <p className="text-xs tabular-nums text-subtext">
            Sintesis {synthesis.version} · seleksi {synthesis.selectionRevision}{" "}
            · form {synthesis.schemaVersion} · protokol{" "}
            {synthesis.protocolRevision} · {synthesis.excludedUnconfirmed}{" "}
            laporan belum terkonfirmasi tidak disertakan.
          </p>
          {!synthesis.recordIds.length && (
            <Notice>
              Dataset terkonfirmasi kosong. Tidak ada frekuensi atau kesimpulan
              efek yang dibuat.
            </Notice>
          )}
          {synthesis.tables.map((table) => (
            <article
              key={table.columnId}
              className="mb-4 rounded-xl border border-border bg-background p-4"
            >
              <h3 className="mt-0 text-sm font-semibold">{table.label}</h3>
              <p className="text-xs text-subtext">
                Denominator: {table.denominator} laporan dengan baris
                terkonfirmasi · nilai tersedia: {table.available}.{" "}
                {table.overlapping
                  ? "Kategori dapat tumpang tindih; jumlah kategori dapat melebihi jumlah laporan."
                  : ""}
              </p>
              <table className="w-full text-left text-sm tabular-nums">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-2">Nilai / kategori</th>
                    <th>Jumlah laporan</th>
                    <th>% denominator</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(table.counts).map(([key, count]) => (
                    <tr key={key} className="border-b border-border">
                      <td className="py-2">{key}</td>
                      <td>{count}</td>
                      <td>
                        {table.denominator
                          ? ((100 * count) / table.denominator).toFixed(1)
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mb-0 text-xs text-subtext">
                Missing:{" "}
                {Object.entries(table.missing)
                  .map(([key, count]) => `${key}: ${count}`)
                  .join(" · ") || "tidak ada"}
                . Missing tidak dihitung sebagai nilai atau nol.
              </p>
            </article>
          ))}
          <Download
            name="peta-temuan.csv"
            content={objectCsv(synthesis.tables.map((table) => ({ version: synthesis.version, ...table })))}
          />
          <Button className="ml-2" onClick={() => panel.openText("peta-temuan.csv", objectCsv(synthesis.tables.map((table) => ({ version: synthesis.version, ...table }))))}>Tinjau CSV di panel</Button>
        </>
      ) : (
        <Notice>
          Belum ada sintesis tersimpan. Siapkan form, selesaikan pilot dan
          verifikasi nilai pada Catatan Sumber, kemudian hitung versi pertama.
        </Notice>
      )}
      <p className="text-xs text-subtext">
        Peta ini hanya menggambarkan cakupan pencarian dan sumber included.
        Frekuensi kategori tidak membuktikan efek, mutu, atau ketiadaan fenomena
        di luar cakupan kajian.
      </p>
      <details className="mt-5 rounded-xl border border-border bg-background p-4">
        <summary className="cursor-pointer text-sm font-medium">
          Tema dan interpretasi yang ditinjau
        </summary>
        {(e.themes ?? []).map((t) => (
          <article key={t.id} className="my-3 border-b border-border pb-3">
            <p className="whitespace-pre-wrap text-sm">{t.text}</p>
            <p className="text-xs text-subtext">
              {t.dependency === w.evidenceSummary.dependency
                ? "Dasar bukti masih sesuai"
                : "Perlu ditinjau: bukti berubah"}{" "}
              · {t.cellIds.length} sel · {t.recordIds.length} sumber
            </p>
            <ul className="pl-5 text-xs text-subtext">
              {t.recordIds.map((id) => (
                <li key={id}>
                  {w.project.records.find((r) => r.id === id)?.title ?? id}
                </li>
              ))}
            </ul>
          </article>
        ))}
        {w.actor.role === "owner" && (
          <>
            <Field
              label="Interpretasi Anda berdasarkan sel terkonfirmasi"
              value={theme}
              onChange={setTheme}
            />
            <details className="mb-4 text-xs">
              <summary>
                Pilih sel yang mendukung interpretasi ({cellIds.length})
              </summary>
              {confirmed.slice(0, 100).map((c) => (
                <label key={c.id} className="mt-2 flex gap-2">
                  <input
                    type="checkbox"
                    checked={cellIds.includes(c.id)}
                    onChange={(ev) =>
                      setCellIds(
                        ev.target.checked
                          ? [...cellIds, c.id]
                          : cellIds.filter((id) => id !== c.id),
                      )
                    }
                  />
                  <span>
                    {w.project.records.find((r) => r.id === c.recordId)?.title}{" "}
                    · {c.columnId}: {c.value || c.state}
                  </span>
                </label>
              ))}
            </details>
            <Button
              size="small"
              disabled={busy || !theme.trim() || !cellIds.length}
              onClick={() =>
                void act({
                  action: "theme",
                  data: { text: theme, cellIds },
                }).then((ok) => {
                  if (ok) {
                    setTheme("");
                    setCellIds([]);
                  }
                })
              }
            >
              Simpan interpretasi dan tautan bukti
            </Button>
            <p className="text-xs text-subtext">
              Interpretasi tetap perlu diperiksa manusia. Hitung versi peta
              temuan baru untuk memasukkannya ke snapshot sintesis.
            </p>
          </>
        )}
      </details>
    </Section>
  );
}
