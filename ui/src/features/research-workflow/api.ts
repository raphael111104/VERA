import type { ImportPreview, Request, Summary, Workspace } from "./types";

const OWNER_KEY = "vera:workflow:owner-capability:v1";
export function ownerKey(): string {
  let value = localStorage.getItem(OWNER_KEY);
  if (!value) {
    value = crypto.randomUUID() + crypto.randomUUID();
    localStorage.setItem(OWNER_KEY, value);
  }
  return value;
}
export function restoreOwnerKey(value: string): void {
  if (value.trim().length < 64 || value.trim().length > 128)
    throw new Error("Kunci akses tidak valid.");
  localStorage.setItem(OWNER_KEY, value.trim());
}
export function projectKey(id: string): string {
  const hash = new URLSearchParams(location.hash.slice(1));
  const invitation = hash.get("reviewer");
  if (invitation && invitation.length >= 64) {
    sessionStorage.setItem(`vera:reviewer:${id}`, invitation);
    history.replaceState(null, "", location.pathname + location.search);
  }
  return sessionStorage.getItem(`vera:reviewer:${id}`) ?? ownerKey();
}
export class WorkflowError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
async function request<T>(
  path: string,
  key: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(`/api/research/projects${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }).catch(() => {
    throw new WorkflowError(
      "Server localhost belum dapat dihubungi. Perubahan lokal tetap ada; coba kembali setelah server siap.",
      0,
    );
  });
  const value = (await response.json().catch(() => {
    throw new WorkflowError(
      "Respons server belum diterima lengkap. Perubahan lokal tetap ada; gunakan coba simpan lagi.",
      response.status,
    );
  })) as T & { error?: string };
  if (!response.ok)
    throw new WorkflowError(
      value.error?.startsWith("revision conflict:")
        ? "Proyek berubah di jendela lain. Jawaban Anda tetap ada; muat versi terbaru sebelum menerapkan kembali perubahan."
        : (value.error ?? `HTTP ${response.status}`),
      response.status,
    );
  return value;
}
export const listProjects = (): Promise<Summary[]> => request("", ownerKey());
export const createProject = (
  name: string,
  entry: string,
  operationId: string,
): Promise<Workspace> => request("", ownerKey(), { name, entry, operationId });
export const readProject = (id: string): Promise<Workspace> =>
  request(`/${id}`, projectKey(id));
export const changeProject = (id: string, body: Request): Promise<Workspace> =>
  request(`/${id}`, projectKey(id), body);
export const previewImport = (
  id: string,
  body: unknown,
): Promise<ImportPreview> =>
  request(`/${id}/import-preview`, projectKey(id), body);
export const sidechatRequest = (
  id: string,
  body: unknown,
): Promise<{ messages: import("../../api").ChatMessage[]; busy: boolean }> =>
  request(`/${id}/sidechat`, projectKey(id), body);
export async function artifactUrl(id: string, file: string): Promise<string> {
  const response = await fetch(
    `/api/research/projects/${id}/artifacts/${file}`,
    { headers: { Authorization: `Bearer ${projectKey(id)}` } },
  );
  if (!response.ok)
    throw new Error("PDF belum dapat dibuka. Periksa akses proyek.");
  return URL.createObjectURL(await response.blob());
}
export async function downloadExport(
  id: string,
  exportId: string,
  member?: string,
): Promise<void> {
  const blob = await exportBlob(id, exportId, member);
  const url = URL.createObjectURL(blob), link = document.createElement("a");
  link.href = url;
  link.download = member ?? `vera-export-${exportId}.zip`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function exportBlob(id: string, exportId: string, member?: string): Promise<Blob> {
  const response = await fetch(
    `/api/research/projects/${id}/exports/${exportId}${member ? `/${encodeURIComponent(member)}` : ""}`,
    { headers: { Authorization: `Bearer ${projectKey(id)}` } },
  );
  if (!response.ok)
    throw new Error(
      "Ekspor belum dapat diunduh. Periksa koneksi dan akses proyek.",
    );
  return response.blob();
}
export const learningTrace = (id: string): Promise<unknown> =>
  request(`/${id}/learning-trace`, projectKey(id));
