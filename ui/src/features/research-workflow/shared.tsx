import { useId, type ReactNode } from "react";
import { Button } from "../../components/ui";
import { ChevronDown } from "lucide-react";
import { outputBlob, saveBlob } from "./outputs";
import { useState } from "react";

export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-6">
      <h2 className="m-0 text-xl font-semibold text-balance">{title}</h2>
      {description && (
        <p className="mb-0 mt-2 max-w-3xl text-sm leading-relaxed text-subtext text-pretty">
          {description}
        </p>
      )}
      <div className="mt-5">{children}</div>
    </section>
  );
}
/** Native disclosure keeps form values mounted while reducing the initial workload. */
export function FormGroup({
  title,
  description,
  number,
  children,
  open = false,
}: {
  title: string;
  description?: string;
  number?: number;
  children: ReactNode;
  open?: boolean;
}) {
  return (
    <details
      open={open}
      className="group mb-4 rounded-xl border border-border bg-background"
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-xl p-4 focus-visible:outline-2 focus-visible:outline-text [&::-webkit-details-marker]:hidden">
        {number && (
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-surface text-xs font-medium tabular-nums text-subtext">
            {number}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">{title}</span>
          {description && (
            <span className="mt-1 block text-xs leading-relaxed text-subtext">
              {description}
            </span>
          )}
        </span>
        <ChevronDown
          size={16}
          className="shrink-0 text-subtext group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="border-t border-border p-4 sm:p-5">{children}</div>
    </details>
  );
}
export function ViewSwitcher({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly (readonly [string, string])[];
  onChange: (value: string) => void;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="mb-5 flex flex-wrap gap-1 rounded-lg border border-border bg-background p-1"
    >
      {options.map(([id, title]) => (
        <Button
          key={id}
          variant="ghost"
          active={value === id}
          aria-pressed={value === id}
          className="h-auto min-h-9 min-w-0 flex-1 whitespace-normal px-3 py-2 text-sm [&.active]:text-primary"
          onClick={() => onChange(id)}
        >
          {title}
        </Button>
      ))}
    </div>
  );
}
export function Field({
  label,
  hint,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  const hintId = useId();
  return (
    <label className="mb-4 block text-sm font-medium">
      {label}
      <textarea
        className="mt-2 block w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm font-normal leading-relaxed focus-visible:outline-2 focus-visible:outline-accent-red"
        aria-describedby={hint ? hintId : undefined}
        rows={rows}
        value={value}
        maxLength={6000}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && (
        <span
          id={hintId}
          className="mt-1.5 block text-xs font-normal leading-relaxed text-subtext"
        >
          {hint}
        </span>
      )}
    </label>
  );
}
export function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 rounded-lg border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-subtext text-pretty [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
      {children}
    </div>
  );
}
export function Issues({ items }: { items: string[] }) {
  return items.length ? (
    <details className="my-4 text-sm text-subtext">
      <summary className="cursor-pointer">
        {items.length} bagian perlu dilengkapi
      </summary>
      <ul className="pl-5">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </details>
  ) : null;
}
export function Download({ name, content }: { name: string; content: string }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const extension = name.split(".").at(-1)?.toLowerCase();
  const label =
    extension === "docx" ? "Word (.docx)" : extension === "json"
      ? "JSON"
      : extension === "md"
        ? "Markdown"
        : extension === "bib"
          ? "BibTeX"
          : extension === "csv"
            ? "CSV"
            : extension === "ris"
              ? "RIS"
              : "berkas";
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
    <Button disabled={busy}
      onClick={() => {
        setBusy(true); setError("");
        void outputBlob({ name, text: content }).then((blob) => saveBlob(name, blob)).catch((e) => setError(String(e))).finally(() => setBusy(false));
      }}
    >
      {busy ? "Menyiapkan…" : `Unduh ${label}`}
    </Button>
    {error && <span role="alert" className="text-xs text-accent-red">{error}</span>}
    </span>
  );
}
