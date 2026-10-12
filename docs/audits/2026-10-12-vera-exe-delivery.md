# VERA Windows executable delivery — 12 October 2026

The latest localhost implementation was rebuilt, embedded in the Rust server, packaged in the Windows launcher, tested as an isolated candidate, and installed at `C:\Project 2026\VERA\dist\VERA.exe` on 12 October 2026 at 18:08 WIB. Existing research data was preserved.

## Installed artifact

| Property | Result |
| --- | --- |
| Product / version | VERA / 0.2.17 |
| Installed size | 58,395,042 bytes |
| Installed SHA256 | `30B90BEAB6AE7DB86B08798EB83CC04F2285C63FBAB6CC7857BD780E25C6760A` |
| Previous executable backup | `dist\backups\VERA-before-20261012-180858.exe` |
| Backup SHA256 | `D695B2D0C90E094DF8C6BA89CD61F435F5BFC5231D20A195FDBCDDB9016F86F4` |
| Release server SHA256 | `92C169997CBB6ABA89F9D385304268BEEC71F1B3A58020B68A93A506CF0D92D4` |
| Embedded UI parity | 271 assets, 11,468,119 bytes; every served asset matches `ui/dist` |
| Main UI bundle | `index-D1FXru8B.js` |

Installed and backup hashes were rechecked after replacement and test cleanup. The version number remains 0.2.17; the package contents and hashes changed.

## Included behavior

- Model-first onboarding followed by eight indicators of initial research and academic-writing ability.
- Research folder management in the header; removal of the redundant header stage display.
- Consistent sidebar controls and compact model icon alignment.
- Separate preview tab groups for File, Output, Side chat, and Browser.
- Paper metadata and available abstracts shown immediately, with an external source link above the preview.
- Animated running indicators, distinct process text colors, and a green completed state.
- Model changes within an existing research folder when agents are idle, persisted per folder and shared with the next main and side-chat turns. Unsupported reasoning choices are reconciled against model capabilities.
- `bukti-pencarian.csv` download and rendered table preview, including article metadata, abstracts, claims, search logs, model provenance, RFC4180 quoting, UTF-8 BOM, and spreadsheet formula neutralization.
- Existing folders open without redundant persistence writes; conflicts have an explicit reload recovery.

The complete build is included by asset parity. Inclusion does not imply every possible workflow was exercised in this delivery run. See the feature audit `2026-10-12-vera-folder-model-csv.md` for implementation-specific evidence.

## Verification performed

1. Style lint, production UI build, TypeScript/i18n build checks, and all 250 UI tests passed. Rust workspace and launcher formatting checks passed. The focused Rust tests and clippy checks from the preceding feature audit remain separate evidence; this delivery did not run the full cross-platform CI matrix.
2. GNU release server and launcher built successfully using the existing packaging script and temporary no-space drive mapping. The mapping was removed afterward.
3. The candidate launched under an isolated profile on port 4793, opened a native window titled `VERA`, and returned health `ok: true`, version `0.2.17`, dashboard protocol `2`. Its extracted server hash matched the release server.
4. All 271 assets served by that candidate matched the production UI files by SHA256.
5. Browser interaction against the server launched by the candidate verified workspace entry, CSV preview and actual download, changing to GPT-6-Sol Max and back to GPT-6-Luna Max, persistence after reload, exclusive tab groups, paper metadata/abstract and external source link, and opening the folder manager. No captured browser console errors or visible alert errors occurred during those checks.
6. The downloaded CSV was parsed and reconciled with the completed source job: 50 article records, one search record, 26 columns, matching article identifiers/titles/abstracts, UTF-8 BOM, and no ragged rows.
7. The installed executable hash equals the tested candidate hash. The original executable backup matches its recorded original hash.
8. The isolated browser tab and smoke server were closed. Port 4793 is free; existing services on 4901, 5201, 5101, and 5301 were preserved.

Browser interaction was performed through the in-app browser against the packaged server; native startup was verified through process/window metadata. Native window controls were not automated. No new AI generation or external publication was performed. First-run onboarding was included in the build but not interactively re-tested in this delivery run. Nonfatal build warnings concerned `::highlight`, a circular route export, and large chunks.

## Evidence

The delivery evidence directory is `target\vera-exe-delivery-20261012\`:

- `installation.json`: final installation, backup, hashes, version, and health.
- `asset-verification.json`: complete embedded asset parity.
- `smoke-state.json`: isolated profile, executable, port, process and native window metadata.
- `browser-verification.json`: tab groups, metadata source link, final model, rows and captured errors.
- `model-switch.json`: persisted alternate model selection.
- `bukti-pencarian.csv` and `csv-validation.json`: actual UI download and reconciliation.
- `packaged-csv-preview.png`: packaged UI screenshot with GPT-6-Luna Max selected.
- `cleanup-verification.json`: stopped smoke process, free smoke port, retained development listeners, final executable and backup hashes.

Build, test, packaging, and smoke logs are retained as `target\vera-exe-20261012-*.log`.
