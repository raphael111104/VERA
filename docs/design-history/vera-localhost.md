# VERA localhost for UI revisions

UI: <http://127.0.0.1:5201/>

Backend: <http://127.0.0.1:4901/api/health>

This checkout has no Git metadata, so `scripts/dev-slot.mjs` cannot allocate a
worktree slot. The local UI session uses equivalent isolated data and ports.
Its SQLite database is a snapshot of the current VERA database, saved under
`target/vera-ui-dev/data`. Run logs were copied beside it. Project repository
paths in the snapshot still refer to the existing repositories; editing files
or running agents against those repositories can affect their working files.

## Start again

Double-click `Jalankan-VERA-Localhost.cmd` in the project root to open the
backend and UI in separate PowerShell terminals. The launcher waits for both
services to be ready before opening the web browser at the UI URL. It reuses
servers already running for this local session and refuses ports held by other
applications. Keep both terminal windows open while using the web app; Ctrl+C
in each terminal stops its server. The existing local data and configuration
are reused. The launcher calls the installed Vite entry point with the same
arguments as `dev:ui`; it does not need to download pnpm at startup.

For manual startup, use the following commands.

Use two PowerShell terminals. The backend terminal, from the project root:

```powershell
Set-Location 'C:\Project 2026\VERA'
$env:ORX_DATA_DIR = 'C:/Project 2026/VERA/target/vera-ui-dev/data'
$env:ORX_CACHE_DIR = 'C:/Project 2026/VERA/target/vera-ui-dev/cache'
$env:XDG_CONFIG_HOME = 'C:/Project 2026/VERA/target/vera-ui-dev/config'
$env:ORX_UI_DEV_ORIGIN = 'http://127.0.0.1:5201'
& './target/vera-ui-dev/bin/orx.exe' up --port 4901 --no-browser --no-telemetry
```

The UI terminal:

```powershell
Set-Location 'C:\Project 2026\VERA\ui'
$env:ORX_BACKEND = 'http://127.0.0.1:4901'
npx --yes pnpm@10.34.6 dev:ui
```

Open the UI URL above. Ctrl+C stops each service when started this way.

## Launcher verification (2026-10-08)

The one-file CMD launcher passed PowerShell syntax validation and started both
services from a working directory outside the project (`C:\`), including the
project path containing spaces. Two PowerShell server terminals were created.
The health endpoint and UI became ready, and the existing local data directory
was retained. A repeated launch reused the same backend and UI process IDs;
the default browser-opening command completed without a reported error.
Browser navigation was not visually inspected. The test servers and their
terminal windows were stopped afterwards, leaving ports 4901 and 5201 free.
Evidence is saved in `target/vera-localhost-launcher-verification.json`.

## Editing

- React components, layout, and CSS under `ui/src` use Vite hot reload.
- `dev:ui` reuses the generated language catalog from the last build to avoid
  a lengthy automatic localization startup. After changing `ui/messages`,
  stop the UI, run `npx --yes pnpm@10.34.6 exec paraglide-js compile --silent
  --emit-ts-declarations` inside `ui`, and restart `dev:ui`.
- The ordinary `dev` command and production `build` keep automatic language
  compilation. The PDF asset middleware, API and WebSocket proxies, route
  generation, React refresh, and Tailwind plugin remain enabled in `dev:ui`.
- UI changes become part of the EXE after rebuilding `ui/dist`, the embedded
  Rust server, and the single-file launcher. Hot reload updates the website
  during revision; it does not rewrite an existing executable.
