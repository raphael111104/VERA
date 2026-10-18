# Workspace maintenance

## Folder ownership

| Folder | Purpose | Cleanup policy |
|---|---|---|
| `src/`, `tests/` | Rust application and integration tests | Source; retain |
| `ui/src/`, `ui/tests/`, `ui/messages/`, `ui/public/` | Dashboard source, tests, catalogs, and static assets | Source; retain |
| `ui/dist/` | Generated dashboard embedded in the server | Committed; regenerate with `pnpm build`, never treat as a disposable cache |
| `ui/node_modules/` | Installed development dependencies | Retain dependencies; delete only disposable tool caches |
| `scripts/` | Reusable development, test, and maintenance commands | Source; retain |
| `windows/`, `linux/`, `macos/` | Platform packaging tools and assets | Source; retain |
| `docs/research-workflow/` | Workflow implementation reports and `specification/` | Retain specifications and dated evidence summaries |
| `target/`, `windows/launcher/target/` | Rust build outputs and isolated test/package fixtures | Rebuildable; remove when no build or candidate test is running |
| `dist/` | Current local Windows distribution | Retain `VERA.exe`, `VERA-Setup.exe`, manifest, instructions, and checksums; excluded from Git |
| `dist/backups/` | Superseded local distribution copies | Remove only after validating the current package |

## Inspect and clean

Run these commands from the repository root in PowerShell 7.2 or later:

```powershell
# Read-only inventory of disposable dashboard/tool caches.
pwsh -File scripts/clean-workspace.ps1

# Include Rust outputs, installer downloads/staging, and old test fixtures.
pwsh -File scripts/clean-workspace.ps1 -BuildArtifacts

# Apply that cleanup and clear only VERA's WebView rendering/HTTP caches.
pwsh -File scripts/clean-workspace.ps1 -BuildArtifacts -WebViewCache -Apply

# After validating the current package, also remove old distribution backups.
pwsh -File scripts/clean-workspace.ps1 -RollbackPackages -Apply
```

The command previews by default. It rejects paths outside its explicit roots,
reparse points, tracked files, and cleanup while relevant processes are running.
`-BuildArtifacts` removes ordinary build outputs in `target/`, including temporary
test reports and downloaded packaging tools. Windows-created junctions in test
profiles are skipped and reported; their ordinary siblings are still cleaned.
A later build can recreate the outputs. Do not put reusable
scripts or research projects in `target/`.

WebView cleanup is limited to named HTTP, code, GPU, and shader cache directories
under `%LOCALAPPDATA%\VERA\single-file\orx.exe.WebView2\EBWebView`. It retains
local storage, IndexedDB, cookies, preferences, the extracted runtime, and all
research data. The localhost browser's shared Chrome/Edge profile is outside
this command's scope. Vite dependency caches are covered inside the repository.

Configuration, database files, research logs/artifacts, Git worktrees, agent
homes, and historical OpenResearch paths remain intact. A directory called
`cache` under application or agent data is not automatically disposable.

After removing build artifacts, `Jalankan-VERA-Localhost.cmd` rebuilds its backend
and Vite regenerates its dependency cache. The current `dist/VERA.exe` and
`dist/VERA-Setup.exe` run independently of `target/` and `ui/node_modules/`.

## Validation before publication

Follow `.github/workflows/ci.yml`. At minimum, run UI styles, tests, and build;
Rust/launcher formatting, tests, and clippy; and relevant workflow acceptance
checks. Use `windows/build-single-file.ps1` when rebuilding the embedded app,
and validate an isolated package before replacing a working distribution.
Windows checks do not establish that the Linux AppImage or macOS app works.

The clean-up command has a fixture-based safety check:

```powershell
pwsh -File scripts/clean-workspace.test.ps1
```
