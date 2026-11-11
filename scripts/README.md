# Scripts

Reusable development, packaging, asset generation, maintenance, and verification
scripts. Embedded runtime scripts used directly by the Rust binary at compile
time live alongside their Rust modules in `src/` (`src/folder_picker.ps1`,
`src/commands/up/install_opencode.ps1`, `src/local/opencode_invocation.mjs`,
and `src/local/research_workflow/render_workflow_docx.ps1`).

## Development and workspace maintenance

- `dev-slot.mjs` / `dev-slot.test.mjs` — Isolated local development slots on macOS and Linux (on Windows, use `Jalankan-VERA-Localhost.cmd` in the repository root).
- `clean-workspace.ps1` / `clean-workspace.test.ps1` — Safe inventory and cleanup of disposable build/tool/WebView caches.

## Packaging and release

- `build-linux-appimage.sh` / `smoke-test-linux-appimage.sh` — Linux desktop AppImage builder and virtual-display smoke test.
- `build-macos-app.sh` / `package-macos-app.sh` — macOS `.app` bundle and styled `.dmg` packager.
- `release_notes.py` / `test_release_notes.py` — Release notes composer and unit tests.

## Asset and fixture generation

- `generate-icon.mjs` / `generate-ico.mjs` — Application PNG and Windows `.ico` generators.
- `generate-dmg-background.mjs` — macOS DMG installer background generator.
- `generate-demo-evidence.mjs` — Regenerates `demo/nanochat/evidence` metrics from recorded training logs.
- `prepare-vera-hero.py` — Encodes the landing page hero backdrop video and poster frame.

## Verification and compatibility suites

- `test_research_workflow.py` — End-to-end P1–P8 HTTP acceptance suite against an isolated `orx` backend using synthetic fixtures.
- `test_academic_search_live.py` — Bounded live-provider search diagnostics across Scopus, PubMed, OpenAlex, Crossref, bioRxiv, and alphaXiv.
- `test-opencode-compat.py` / `test-opencode-compat-host.py` — OpenCode harness compatibility checks.
- `test-ssh-container.sh` — Disposable container test for SSH execution targets.

