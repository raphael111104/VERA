# Documentation

| Location | Contents |
|---|---|
| [Research workflow](research-workflow/README.md) | Implementation status, decisions, testing reports, and the original [specification](research-workflow/specification/README.md) |
| [Windows](windows.md) | Desktop executable, installer, isolated package validation, and compatibility |
| [Maintenance](maintenance.md) | Repository layout, generated files, and safe cache cleanup |
| [Design history](design-history/) | Earlier UI reports, screenshots, and isolated design previews |
| [Audits](audits/) | Dated observations and their verification limits |

Application code stays in `src/` and `ui/src/`. Reusable development tools stay
in `scripts/`; platform packaging stays in `windows/`, `linux/`, and `macos/`.
The original `VERA_Workflow_Codex_Pack/` documents now live in
`docs/research-workflow/specification/`. Earlier `docs/vera-revision/` reports
now live in `docs/research-workflow/`. Their dates and historical findings are
preserved; they are not assertions about the latest build.
