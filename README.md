# VERA

VERA (Veritas Evidence & Research Agent) is a local-first workspace for literature research, coding-agent workflows, and reproducible experiments. The VERA command-line interface operates the local workspace and starts its dashboard; research data stays on your machine.

## Features

- Local research projects, experiment trees, runs, logs, and artifacts backed by SQLite.
- Coding-agent integrations and configurable execution backends, including local execution, Hugging Face Jobs, Modal, Kubernetes, SSH, Slurm, Ray, and Tinker.
- Academic discovery and paper metadata from alphaXiv, OpenAlex, bioRxiv, and PubMed.
- Local environment settings for provider credentials, research tools, and future integrations.
- A dashboard for chats, projects, experiments, files, settings, and evidence review.

Academic sources and execution backends are configured independently. VERA does not require a product-account sign-in, organization account, or managed VERA compute. Research projects, logs, and artifacts stay local unless you configure an external provider or academic source.

## Run locally

Requirements for the Rust application: the stable Rust toolchain and Cargo.

On Windows, run `Jalankan-VERA-Localhost.cmd` to start the local dashboard at <http://127.0.0.1:5201/>. The launcher builds the Rust backend from source when needed, starts the Vite dashboard, and keeps its development data under `%LOCALAPPDATA%\VERA\dev-slots` so cleaning the Cargo `target/` directory does not remove it. It requires Node.js and pnpm for the dashboard. Rust builds need either the MSVC linker (`link.exe`) or the GNU Windows Rust toolchain together with MinGW-w64 GCC; the launcher selects the available linker profile and reports missing prerequisites. If Vite is missing, it installs the locked UI dependencies.

To build the CLI and start the local dashboard from the repository root:

```sh
cargo build --locked
cargo run -- up
```

The dashboard binds to a loopback address and is intended for local use. Press `Ctrl+C` in the terminal to stop it.

## Develop

The dashboard requires Node.js 22 and pnpm 10. Install its dependencies and build the bundle from `ui/`:

```sh
cd ui
pnpm install --frozen-lockfile
pnpm build
```

`ui/dist/` is committed and embedded in the Rust server, so rebuild it after changing the dashboard. To run the dashboard checks, use `pnpm test` and `pnpm lint:styles` from `ui/`.

Main source locations:

- `src/` — Rust application, CLI, local API, storage, and integrations.
- `ui/src/` — React dashboard.
- `agent-skills/` — bundled agent guidance.
- `scripts/`, `windows/`, `linux/`, and `macos/` — development and packaging tools.
- `docs/` — platform and workflow documentation.

See the [documentation index](docs/README.md) for the repository layout and
[research workflow specifications and implementation notes](docs/research-workflow/README.md).
Build caches and local Windows packages have separate locations; follow the
[workspace cleanup guide](docs/maintenance.md) to remove generated files safely.

Use `scripts/dev-slot.mjs` for isolated local app instances on macOS and Linux. On Windows, use `Jalankan-VERA-Localhost.cmd`. See [AGENTS.md](AGENTS.md) for repository conventions and [.github/workflows/ci.yml](.github/workflows/ci.yml) for the full CI checks.

## Local data and compatibility

To preserve existing installations, VERA continues to read historical OpenResearch-named configuration and data locations, including `~/.openresearch/env` and the existing XDG data directory. These are compatibility paths; VERA does not delete or migrate their contents during startup.

Provider credentials and local environment values are stored on the user's machine. Configure external services only when you choose to use them.

## License

VERA is distributed under the MIT License. See [LICENSE](LICENSE).
