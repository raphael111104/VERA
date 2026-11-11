# Documentation

| Location | Contents |
|---|---|
| [Architecture](architecture/README.md) | Interactive system architecture diagram (`index.html`), specification (`vera.architecture.json`), and verification receipts |
| [Research workflow](research-workflow/README.md) | Implementation status, decisions, testing reports, and the original [specification](research-workflow/specification/README.md) |
| [Windows](windows.md) | Desktop executable, installer, isolated package validation, and compatibility |
| [Linux](linux.md) | WebKitGTK desktop build, AppImage packaging, and CLI usage |
| [Local models](local-models.md) | Connecting LM Studio, oMLX, Ollama, and OpenAI-compatible local servers via OpenCode |
| [Maintenance](maintenance.md) | Repository layout, generated files, and safe cache cleanup |
| [Design history](design-history/README.md) | Earlier UI reports, screenshots, and isolated design previews |
| [Audits](audits/README.md) | Dated observations, live search checks, and their verification limits |

Application code stays in `src/` and `ui/src/`. Reusable development tools stay
in [`scripts/`](../scripts/README.md); platform packaging stays in `windows/`,
`linux/`, and `macos/`. The interactive system architecture viewer lives in
`docs/architecture/`. The original `VERA_Workflow_Codex_Pack/` documents live in
`docs/research-workflow/specification/`. Earlier `docs/vera-revision/` reports
live in `docs/research-workflow/`. Their dates and historical findings are
preserved; they are not assertions about the latest build.
