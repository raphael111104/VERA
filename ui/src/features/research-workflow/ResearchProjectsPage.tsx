import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, BookOpen, FolderOpen, Plus } from "lucide-react";
import { BrandMark } from "../../components/Wordmark";
import { Button } from "../../components/ui";
import { createProject, listProjects, ownerKey, restoreOwnerKey } from "./api";
import { Notice } from "./shared";
import { TermHelp } from "./TermHelp";
import {
  createOrOpenDemoProject,
  DEMO_PROJECT_NAME,
} from "./demoProject";

export function ResearchProjectsPage() {
  const projects = useQuery({
    queryKey: ["research-projects"],
    queryFn: listProjects,
  });
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [entry, setEntry] = useState("interest");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [operation] = useState(() => crypto.randomUUID());
  const [recovery, setRecovery] = useState("");
  const [learn, setLearn] = useState(false);
  const [demoBusy, setDemoBusy] = useState(false);
  const [demoProgress, setDemoProgress] = useState("");
  const [demoError, setDemoError] = useState("");
  const savedDemo = projects.data?.some(
    (project) => project.name === DEMO_PROJECT_NAME,
  );
  const demoAutoStarted = useRef(false);
  useEffect(() => {
    if (!projects.data || projects.error || demoAutoStarted.current) return;
    const marker = `vera:workflow:demo-bootstrap:v1:${ownerKey()}`;
    if (savedDemo) {
      localStorage.setItem(marker, "ready");
      return;
    }
    // Seed once per local owner. Deleting a demo later must remain a choice;
    // an interrupted preparation can be resumed with the demo button.
    if (localStorage.getItem(marker)) return;
    demoAutoStarted.current = true;
    localStorage.setItem(marker, "started");
    setDemoBusy(true);
    setDemoError("");
    void createOrOpenDemoProject(projects.data, setDemoProgress)
      .then(async () => {
        localStorage.setItem(marker, "ready");
        await projects.refetch();
        setDemoProgress("Demo sudah tersimpan dan siap dibuka.");
      })
      .catch((problem) => {
        setDemoError(String(problem));
        void projects.refetch();
      })
      .finally(() => setDemoBusy(false));
  }, [projects.data, projects.error, projects.refetch, savedDemo]);
  return (
    <div className="h-full overflow-y-auto bg-canvas text-text">
      <header className="flex items-center justify-between gap-4 border-b border-border bg-background px-6 py-4">
        <span className="flex items-center gap-3 font-semibold">
          <span className="size-8">
            <BrandMark />
          </span>
          VERA{" "}
          <span className="text-sm font-normal text-subtext">Ruang kajian</span>
        </span>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-sm font-medium text-primary">
          Dari minat menuju kajian yang terarah
        </p>
        <h1 className="text-3xl font-semibold text-balance">
          Apa yang ingin Anda pahami?
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-subtext text-pretty">
          Mulai dari pengalaman, topik, atau instruksi yang Anda bawa. VERA
          membantu menyusun rencana, mencari sumber, dan mencatat keputusan
          dalam satu proyek.
        </p>
        <section className="mt-7 rounded-xl border border-primary/30 bg-background p-5 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-5">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-canvas text-primary">
              <BookOpen size={21} aria-hidden="true" />
            </span>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
                Contoh tersimpan
              </p>
              <h2 className="m-0 text-base font-semibold">
                Lihat alur kajian dari awal sampai ekspor
              </h2>
              <p className="mb-0 mt-1 max-w-2xl text-sm text-subtext">
                Demo lokal mencakup arah, rencana, sumber, seleksi, matriks,
                sintesis, draf, audit, refleksi belajar, dan paket Word/CSV.
                Semua data diberi label simulasi; tidak ada pencarian akademik
                eksternal.
              </p>
            </div>
          </div>
          <Button
            className="mt-4 shrink-0 sm:mt-0"
            variant="primary"
            disabled={
              demoBusy || projects.isPending || !!projects.error
            }
            onClick={() => {
              setDemoBusy(true);
              setDemoError("");
              setDemoProgress("");
              void createOrOpenDemoProject(
                projects.data ?? [],
                setDemoProgress,
              )
                .then(async (id) => {
                  await projects.refetch();
                  await navigate({
                    to: "/research/$researchProjectId",
                    params: { researchProjectId: id },
                  });
                })
                .catch((problem) => {
                  setDemoError(String(problem));
                  void projects.refetch();
                })
                .finally(() => setDemoBusy(false));
            }}
          >
            <ArrowRight size={16} aria-hidden="true" />
            {demoBusy
              ? "Menyiapkan demo…"
              : savedDemo
                ? "Buka demo tersimpan"
                : "Buat demo tersimpan"}
          </Button>
          {demoProgress && (
            <p
              role="status"
              aria-live="polite"
              className="mt-3 text-xs text-subtext sm:basis-full sm:text-right"
            >
              {demoProgress}
            </p>
          )}
          {demoError && (
            <p
              role="alert"
              className="mt-3 text-sm text-accent-red sm:basis-full sm:text-right"
            >
              Demo belum selesai disiapkan. {demoError} Proyek yang sudah
              tersimpan tetap tersedia untuk dilanjutkan.
            </p>
          )}
        </section>
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <section className="rounded-xl border border-border bg-background p-6">
            <h2 className="m-0 text-lg font-semibold">Mulai kajian baru</h2>
            <p className="text-sm text-subtext">
              Scoping Review memetakan apa yang sudah diteliti tentang suatu
              topik. Anda dapat mulai tanpa istilah teknis atau model AI.
            </p>
            <div className="mb-4 flex flex-wrap gap-2">
              <Button size="small" onClick={() => setLearn(true)}>
                Pelajari dulu
              </Button>
              <Button
                size="small"
                onClick={() => {
                  setLearn(false);
                  document.getElementById("research-project-name")?.focus();
                }}
              >
                Mulai tanpa istilah teknis
              </Button>
            </div>
            {learn && (
              <>
                <p className="text-sm leading-relaxed text-subtext">
                  Contoh: Anda ingin memahami praktik umpan balik dalam
                  pendidikan tinggi. Kajian dapat memetakan jenis praktik,
                  peserta, konteks dan cara penelitiannya. Pertanyaan tentang
                  praktik yang paling efektif memerlukan pertimbangan metode
                  yang berbeda.
                </p>
                <TermHelp />
              </>
            )}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setBusy(true);
                setError("");
                void createProject(name, entry, operation)
                  .then((value) =>
                    navigate({
                      to: "/research/$researchProjectId",
                      params: { researchProjectId: value.project.id },
                    }),
                  )
                  .catch((problem) => setError(String(problem)))
                  .finally(() => setBusy(false));
              }}
            >
              <label className="mb-5 block text-sm font-medium">
                Nama proyek
                <input
                  id="research-project-name"
                  className="mt-2 w-full rounded-md border border-border bg-background p-3"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  placeholder="Contoh: Kajian praktik pembelajaran"
                  required
                />
              </label>
              <fieldset className="m-0 border-0 p-0">
                <legend className="mb-3 text-sm font-medium">
                  Dari mana Anda ingin mulai?
                </legend>
                {[
                  [
                    "interest",
                    "Bantu saya menemukan topik",
                    "Mulai dari minat dan pengalaman Anda.",
                  ],
                  [
                    "topic",
                    "Saya sudah punya topik",
                    "Periksa pertanyaan dan batas kajiannya.",
                  ],
                  [
                    "assignment",
                    "Saya membawa instruksi tugas",
                    "Simpan instruksi; pemetaan format bersifat pilihan.",
                  ],
                ].map(([value, label, detail]) => (
                  <label
                    key={value}
                    className="mb-2 flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3"
                  >
                    <input
                      type="radio"
                      name="entry"
                      value={value}
                      checked={entry === value}
                      onChange={() => setEntry(value)}
                      className="mt-1"
                    />
                    <span className="text-sm font-medium">
                      {label}
                      <span className="mt-1 block text-xs font-normal text-subtext">
                        {detail}
                      </span>
                    </span>
                  </label>
                ))}
              </fieldset>
              {error && (
                <p role="alert" className="text-sm text-accent-red">
                  {error}
                </p>
              )}
              <Button
                className="mt-5"
                variant="primary"
                type="submit"
                disabled={busy || !name.trim()}
              >
                <Plus size={16} />
                {busy ? "Membuat proyek…" : "Mulai menentukan arah"}
              </Button>
            </form>
          </section>
          <section>
            <h2 className="mt-0 text-lg font-semibold">Lanjutkan pekerjaan</h2>
            {projects.isPending ? (
              <p role="status">Memuat proyek…</p>
            ) : projects.error ? (
              <Notice>
                Proyek belum dapat dimuat.{" "}
                <Button onClick={() => void projects.refetch()}>
                  Coba lagi
                </Button>
              </Notice>
            ) : !projects.data?.length ? (
              <Notice>
                Belum ada proyek kajian pada browser ini. Buat proyek pertama
                dari minat Anda.
              </Notice>
            ) : (
              <ul className="m-0 list-none space-y-3 p-0">
                {projects.data.map((project) => (
                  <li key={project.id}>
                    <Link
                      className="flex items-center gap-3 rounded-lg border border-border bg-background p-4 text-text"
                      to="/research/$researchProjectId"
                      params={{ researchProjectId: project.id }}
                    >
                      <FolderOpen size={18} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {project.name}
                        </span>
                        <span className="text-xs text-subtext">
                          Revisi {project.revision} ·{" "}
                          {new Date(project.updatedAt).toLocaleString("id-ID")}
                        </span>
                      </span>
                      <ArrowRight size={16} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-5 text-xs leading-relaxed text-subtext">
              Data proyek disimpan lokal di VERA. Kunci akses pemilik tersimpan
              pada browser ini; gunakan browser/profil yang sama untuk
              melanjutkan.
            </p>
            <details className="mt-6 text-sm">
              <summary className="cursor-pointer">
                Simpan atau pulihkan kunci akses pemilik
              </summary>
              <p className="text-xs text-subtext">
                Simpan kunci secara pribadi agar proyek tetap dapat dibuka jika
                data browser hilang. Kunci memberi akses ke proyek milik Anda
                dan terpisah dari ekspor penelitian.
              </p>
              <Button
                size="small"
                onClick={() => {
                  const url = URL.createObjectURL(
                    new Blob([ownerKey()], { type: "text/plain" }),
                  );
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = "kunci-pemilik-vera.txt";
                  link.click();
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                }}
              >
                Unduh kunci akses
              </Button>
              <label className="my-3 block text-xs">
                Kunci yang pernah disimpan
                <input
                  type="password"
                  className="mt-2 block w-full border border-border bg-background p-2"
                  autoComplete="off"
                  value={recovery}
                  onChange={(e) => setRecovery(e.target.value)}
                />
              </label>
              <Button
                size="small"
                disabled={!recovery}
                onClick={() => {
                  try {
                    restoreOwnerKey(recovery);
                    setRecovery("");
                    void projects.refetch();
                  } catch (problem) {
                    setError(String(problem));
                  }
                }}
              >
                Pulihkan akses
              </Button>
            </details>
          </section>
        </div>
      </main>
    </div>
  );
}
