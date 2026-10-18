# 10. Kontrak Data, State, API dan Otorisasi

Semua nama berikut adalah kontrak usulan. P0 memetakan ke storage, service dan router aktual. Pertahankan stack dan pola repo yang terbukti; jangan memaksakan ORM, framework API atau sistem auth baru.

## Entitas dan relasi

| Entitas | Field/relasi inti |
|---|---|
| ResearchProject | id, ownerId, members, mode, currentActivity, revision |
| DirectionBriefVersion | projectId, answers, candidates, choice, PCC, evidenceRefs, revision |
| ProtocolVersion | briefVersionId, components, eligibility, queryPlans, chartingPlan, appraisalPlan, synthesisPlan, status |
| ProtocolAmendment | fromVersion, toVersion, reason, changedFields, impact, actor |
| SearchRun | purpose, protocolVersionId, provider, query, counts, status, checkpoint |
| RecordOccurrence | runId, rawId, recordId, artifactId |
| EvidenceRecord | bibliographicFields, fieldProvenance, reportId, studyGroupId optional |
| DuplicateCluster | memberIds, canonicalId, matchReason, reversibleDecision |
| SelectionSetVersion | runIds, eligibleRecordIds, ledgerVersion |
| ScreeningDecision | record/reportId, reviewerId, stage, criteriaVersionId, verdict, reason, submittedAt |
| Adjudication | decisionIds, finalVerdict, rationale, resolvedBy |
| SourceArtifact | recordId, fileHash, mediaType, accessStatus, provenance |
| ChartingSchemaVersion | fields, types, missingPolicy, extractionGuidance |
| ChartingCellRevision | rowId, fieldId, valueState, value, locator, proposer, confirmer |
| SynthesisVersion | selectionVersionId, schemaVersionId, rowRevisionIds, codebook, tables |
| DraftVersion/Claim | sections, dependencyRefs, citationLinks, evidenceLinks, reviewStatus |
| LearningDecision/AssistanceEvent | initialJudgement, advice, response, assistanceLevel, policyVersion |
| AuditReport/ExportManifest | dependencyVersions, issues, outputFiles, checksum, createdAt |

Immutable snapshots untuk protokol, sintesis, keputusan yang sudah submit dan ekspor. Edits memakai revision baru, bukan menimpa provenance. Waktu disimpan UTC dengan zona asli untuk display/log pencarian. Perubahan ditulis dalam transaksi bersama event dan revision.

## Kontrak fungsi domain

`evaluateGate(projectId, stage, revision) -> {canComplete, blockers, warnings}`

`computeSelectionLedger(selectionSetVersionId) -> {countsByOrigin, countsByUnit, inconsistencies}`

`computeImpact(oldVersionId, proposedVersion) -> {affectedArtifacts, requiredReviews}`

`confirmProposal(proposalId, actorId, expectedRevision) -> {newRevision, affectedArtifacts}`

Gate dan angka dihitung secara deterministik di backend. UI memakai hasil tersebut, bukan logika status berbeda. Tidak ada endpoint model yang dapat menandai gate complete tanpa validasi.

## State

StageCompletion: not_started, in_progress, ready_for_review, completed, needs_review.

SearchRunStatus: queued, running, complete, partial, failed, cancelled.

ProposalStatus: proposed, accepted, rejected, stale.

Transisi completed → needs_review terjadi bila dependensi berubah. State job terpisah dari state tahap. Proyek boleh mempunyai beberapa tahap in_progress karena editor dan protokol bersifat iteratif.

## API usulan

| Metode dan route relatif | Input utama | Keluaran |
|---|---|---|
| POST /research-projects | identity, mode | Project |
| PUT /projects/:id/direction | brief, expectedRevision | BriefVersion |
| POST /projects/:id/protocol-versions | protocol, expectedRevision | ProtocolVersion |
| POST /projects/:id/amendments/preview | proposedProtocol | Impact |
| POST /projects/:id/search-runs | queryPlanId, purpose, approvedRevision | SearchRun |
| POST /search-runs/:id/resume | checkpoint, idempotencyKey | JobStatus |
| POST /projects/:id/imports | fileArtifactId, mapping, provenance | ImportResult |
| POST /selection-sets/:id/decisions | recordId, stage, verdict, expectedRevision | Decision |
| POST /conflicts/:id/resolve | finalVerdict, rationale | Adjudication |
| PUT /charting-rows/:id | cellChanges, expectedRevision | RowRevision |
| POST /projects/:id/syntheses | confirmedDatasetRefs | SynthesisVersion |
| PUT /drafts/:id/sections/:section | text, evidenceLinks, expectedRevision | DraftVersion |
| POST /projects/:id/audits | dependencyVersions | AuditReport |
| POST /projects/:id/exports | milestone, format, auditId | ExportJob |

Routes disesuaikan API repo; fungsi domain dan invariants dipertahankan. Server mengambil reviewerId dari identitas terautentikasi, bukan mempercayai field pengguna. Respons konflik revision membawa currentRevision dan jalan merge; jangan menerima last-write-wins untuk judgement atau protokol.

## Akses dan perlindungan proses

Owner mengelola proyek dan membership. Reviewer menilai record yang ditugaskan; decision independen reviewer lain disembunyikan juga pada respons API sebelum reveal. Adjudikator hanya menyelesaikan konflik sesuai membership. Pembimbing read/comment bila diundang. Credential admin terpisah dari data akademik.

Jika aplikasi lokal belum mempunyai identitas multiuser, P0 harus memilih model deployment yang memungkinkan reviewer sungguhan. Pilihan minimal: layanan bersama dengan autentikasi dan membership berbasis mekanisme yang sudah ada. Satu dropdown untuk berganti nama reviewer pada sesi anonim tidak cukup untuk mengklaim review independen.

## Persistensi dan migrasi

Tambahkan skema secara additive dan versioned. Cadangkan database lokal sebelum migrasi yang mengubah data. Migrasikan proyek lama ke mode legacy tanpa menebak brief/protokol; arahkan proyek riset baru ke workflow. Feature flag memungkinkan rollback UI. Downgrade tidak boleh menghapus artefak baru; bila skema tak kompatibel, dokumentasikan restore backup.

PDF dan artikel dianggap data, bukan instruksi yang boleh mengubah tool permissions. Batasi pembacaan agent pada proyek, validasi struktur keluaran, redaksi secret dan uji prompt injection dari dokumen sumber.
