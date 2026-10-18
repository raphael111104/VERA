import { Button } from "../../../components/ui";
import { Select } from "../../../components/ui/Select";
import { Field } from "../shared";
import type { Protocol, Workspace } from "../types";
export function QueryPlans({
  value,
  workspace,
  onChange,
}: {
  value: Protocol;
  workspace: Workspace;
  onChange: (p: Protocol) => void;
}) {
  const rows = value.queryPlans ?? [];
  const update = (index: number, patch: Partial<(typeof rows)[number]>) =>
    onChange({
      ...value,
      queryPlans: rows.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    });
  return (
    <details className="mb-5 rounded-xl border border-border bg-background p-4">
      <summary className="cursor-pointer text-sm font-medium">
        Query tambahan per database ({rows.length})
      </summary>
      <p className="text-xs leading-relaxed text-subtext">
        Sesuaikan sintaks untuk setiap database. Simpan query asli dan query
        yang disetujui beserta alasan perubahan atau batasnya. Semuanya
        mengikuti versi rencana acuan yang sama.
      </p>
      {rows.map((r, i) => (
        <fieldset key={i} className="mb-4 rounded-lg border border-border p-4">
          <legend className="text-sm">Query {i + 1}</legend>
          <label className="mb-4 block text-sm">
            Database
            <Select
              className="mt-2 w-full"
              value={r.provider}
              onChange={(e) => update(i, { provider: e.target.value })}
            >
              {workspace.capabilities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </label>
          <Field
            label="Query asli"
            value={r.original}
            onChange={(original) => update(i, { original })}
          />
          <Field
            label="Query yang disetujui"
            value={r.query}
            onChange={(query) => update(i, { query })}
          />
          <Field
            label="Alasan penyesuaian sintaks dan batas pencarian"
            value={r.limitsReason}
            onChange={(limitsReason) => update(i, { limitsReason })}
          />
          <Button
            size="small"
            onClick={() =>
              onChange({ ...value, queryPlans: rows.filter((_, j) => j !== i) })
            }
          >
            Hapus query {i + 1}
          </Button>
        </fieldset>
      ))}
      <Button
        size="small"
        disabled={rows.length >= 10}
        onClick={() =>
          onChange({
            ...value,
            queryPlans: [
              ...rows,
              {
                provider: workspace.capabilities[0]?.id ?? "openalex",
                original: "",
                query: "",
                limitsReason: "",
              },
            ],
          })
        }
      >
        Tambah query database
      </Button>
    </details>
  );
}
