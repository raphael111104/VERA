//! Human-reviewed charting and reproducible synthesis; missing is never zero.
use super::{hash, selection, Actor, Project};
use crate::error::{anyhow, Result};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::{BTreeMap, HashSet};

#[derive(Clone, Debug, Default, Deserialize, Serialize)]
#[serde(default, rename_all = "camelCase", deny_unknown_fields)]
pub struct Evidence {
    pub schemas: Vec<Schema>,
    pub cells: Vec<Cell>,
    pub pilot: Option<Pilot>,
    pub syntheses: Vec<Value>,
    pub sections: Vec<Section>,
    pub claims: Vec<Claim>,
    pub files: Vec<WorkspaceFile>,
    pub appraisals: Vec<Value>,
    pub reporting: Vec<Value>,
    pub exports: Vec<Value>,
    pub learning: Vec<Value>,
    pub jobs: Vec<Value>,
    pub themes: Vec<Value>,
    pub output: Value,
}
#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Column {
    pub id: String,
    pub label: String,
    pub kind: String,
    pub required: bool,
    pub allowed_values: Vec<String>,
    pub missing_policy: Vec<String>,
    pub extraction_guidance: String,
}
#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Schema {
    pub version: i64,
    pub columns: Vec<Column>,
    pub reason: String,
}
#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Pilot {
    pub record_ids: Vec<String>,
    pub rationale: String,
    pub status: String,
    pub schema_version: i64,
}
#[derive(Clone, Debug, Default, Deserialize, Serialize)]
#[serde(default, rename_all = "camelCase", deny_unknown_fields)]
pub struct Locator {
    pub artifact_id: String,
    pub page: Option<u32>,
    pub section: String,
    pub quote: String,
    pub document_hash: String,
}
#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Cell {
    pub id: String,
    pub record_id: String,
    pub column_id: String,
    pub value: String,
    pub state: String,
    pub locator: Locator,
    pub extractor: String,
    pub verifier: Option<String>,
    pub verification_status: String,
    #[serde(default)]
    pub verification_note: String,
    pub schema_version: i64,
    pub selection_revision: i64,
    pub protocol_revision: i64,
    #[serde(default)]
    pub source_basis: String,
    pub at: i64,
}
#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Section {
    pub key: String,
    pub text: String,
    pub status: String,
    pub revision: i64,
}
#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Claim {
    pub id: String,
    pub section_key: String,
    pub text: String,
    pub claim_type: String,
    pub record_ids: Vec<String>,
    pub cell_ids: Vec<String>,
    pub source_level: String,
    pub locators: Vec<Locator>,
    pub review_status: String,
    pub reviewer: Option<String>,
    #[serde(default)]
    pub review_note: String,
    pub dependency: String,
}
#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct WorkspaceFile {
    pub id: String,
    pub name: String,
    pub text: String,
    pub checksum: String,
    pub at: i64,
}
pub const SECTION_KEYS: [&str; 9] = [
    "title",
    "abstract",
    "introduction",
    "methods",
    "results",
    "discussion",
    "conclusion",
    "references",
    "appendix",
];
fn text<'a>(v: &'a Value, key: &str) -> Result<&'a str> {
    v[key]
        .as_str()
        .ok_or_else(|| anyhow!("Field {key} diperlukan."))
}
pub fn included(p: &Project, actors: &[String]) -> Vec<String> {
    selection::canonical(p)
        .into_iter()
        .filter(|r| {
            selection::outcome(p, &r.id, "title", actors) == "include"
                && selection::outcome(p, &r.id, "fulltext", actors) == "include"
                && p.retrievals
                    .iter()
                    .rev()
                    .find(|v| v.record_id == r.id)
                    .is_some_and(|v| v.status == "retrieved")
        })
        .map(|r| r.id.clone())
        .collect()
}
pub fn latest<'a>(p: &'a Project, record: &str, column: &str) -> Option<&'a Cell> {
    p.evidence
        .cells
        .iter()
        .rev()
        .find(|c| c.record_id == record && c.column_id == column)
}
pub fn fresh(p: &Project, cell: &Cell) -> bool {
    !p.selection_stale
        && p.protocol_locked
        && cell.schema_version == p.evidence.schemas.last().map_or(0, |s| s.version)
        && cell.selection_revision == p.selection_revision
        && cell.protocol_revision == p.protocol_revision
        && cell.source_basis == source_basis(p, &cell.record_id)
}
fn source_basis(p: &Project, record: &str) -> String {
    hash(
        &serde_json::to_string(&json!([
            p.decisions
                .iter()
                .filter(|d| d.record_id == record)
                .collect::<Vec<_>>(),
            p.resolutions
                .iter()
                .filter(|d| d.record_id == record)
                .collect::<Vec<_>>(),
            p.retrievals
                .iter()
                .filter(|d| d.record_id == record)
                .collect::<Vec<_>>()
        ]))
        .unwrap_or_default(),
    )
}
pub fn dependency(p: &Project) -> String {
    let mut direction = p.direction.clone();
    direction.step = 0; // Interview navigation does not change the research question.
    let formal: Vec<_> = p
        .runs
        .iter()
        .filter(|r| r.purpose == "formal")
        .map(|r| {
            json!([
                r.id,
                r.provider,
                r.query,
                r.protocol_revision,
                r.retrieved_count,
                r.reported_total,
                r.status,
                r.checkpoint,
                r.checksum
            ])
        })
        .collect();
    hash(
        &serde_json::to_string(&json!([
            direction,
            p.protocol,
            formal,
            p.selection_revision,
            p.protocol_revision,
            p.selection_stale,
            p.protocol_locked,
            p.evidence.schemas.last(),
            p.evidence.cells,
            p.decisions,
            p.resolutions,
            p.retrievals,
            p.evidence.appraisals
        ]))
        .unwrap_or_default(),
    )
}
pub fn invalidate(p: &mut Project) {
    for section in &mut p.evidence.sections {
        if !section.text.is_empty() {
            section.status = "needs_review".into();
        }
    }
    for claim in p
        .evidence
        .claims
        .iter_mut()
        .filter(|c| c.review_status != "superseded")
    {
        claim.review_status = "needs_review".into();
    }
}
pub fn summary(p: &Project, actors: &[String]) -> Value {
    let ids = included(p, actors);
    let confirmed: Vec<_> = ids.iter().filter(|id| row_ready(p, id)).cloned().collect();
    json!({"included":ids,"confirmedRows":confirmed,"dependency":dependency(p),"synthesisStale":!synthesis_current(p),"practice":actors.len()!=2})
}
pub fn synthesis_current(p: &Project) -> bool {
    let dep = dependency(p);
    p.evidence.syntheses.last().is_some_and(|s| {
        s["dependency"] == dep
            && s["themes"]
                .as_array()
                .into_iter()
                .flatten()
                .map(|t| t["id"].clone())
                .collect::<Vec<_>>()
                == p.evidence
                    .themes
                    .iter()
                    .filter(|t| t["dependency"] == dep)
                    .map(|t| t["id"].clone())
                    .collect::<Vec<_>>()
    })
}
pub fn row_ready(p: &Project, record: &str) -> bool {
    p.evidence.schemas.last().is_some_and(|s| {
        s.columns.iter().filter(|c| c.required).all(|c| {
            latest(p, record, &c.id)
                .is_some_and(|v| fresh(p, v) && v.verification_status == "confirmed")
        })
    })
}
fn valid_locator(
    p: &Project,
    record: &str,
    locator: &Locator,
    conn: &rusqlite::Connection,
) -> Result<()> {
    if locator.quote.trim().is_empty()
        || (locator.page.is_none() && locator.section.trim().is_empty())
        || locator.page == Some(0)
    {
        return Err(anyhow!(
            "Catat kutipan dan halaman atau bagian sumber; lokasi tidak boleh ditebak."
        ));
    }
    if !p
        .retrievals
        .iter()
        .rev()
        .find(|r| r.record_id == record)
        .is_some_and(|r| {
            r.status == "retrieved" && r.artifact_id.as_deref() == Some(&locator.artifact_id)
        })
    {
        return Err(anyhow!(
            "Lokasi harus memakai dokumen teks lengkap aktif untuk record ini."
        ));
    }
    let checksum: String = conn.query_row(
        "SELECT checksum FROM rw_artifacts WHERE id=?1 AND project_id=?2 AND record_id=?3",
        rusqlite::params![locator.artifact_id, p.id, record],
        |row| row.get(0),
    )?;
    if checksum != locator.document_hash {
        return Err(anyhow!(
            "Hash dokumen tidak cocok. Buka kembali sumber yang aktif."
        ));
    }
    Ok(())
}
pub fn apply(
    p: &mut Project,
    actor: &Actor,
    actors: &[String],
    action: &str,
    data: &Value,
    conn: &rusqlite::Connection,
) -> Result<()> {
    match action {
        "chart_schema" => {
            let columns: Vec<Column> = serde_json::from_value(data["columns"].clone())?;
            let reason = text(data, "reason")?.trim();
            let mut ids = HashSet::new();
            if columns.is_empty()
                || columns.len() > 30
                || !columns.iter().any(|c| c.required)
                || reason.is_empty()
            {
                return Err(anyhow!(
                    "Tentukan 1–30 kolom, minimal satu wajib, dan alasan versi form."
                ));
            }
            for c in &columns {
                if c.id.is_empty()
                    || c.id.len() > 60
                    || !c.id.chars().all(|v| v.is_ascii_alphanumeric() || v == '_')
                    || !ids.insert(&c.id)
                    || c.label.trim().is_empty()
                    || !["text", "number", "category"].contains(&c.kind.as_str())
                    || c.extraction_guidance.trim().is_empty()
                    || c.missing_policy.iter().any(|v| {
                        !["not_reported", "not_applicable", "uncertain"].contains(&v.as_str())
                    })
                {
                    return Err(anyhow!("ID kolom unik, tipe, petunjuk ekstraksi dan kebijakan missing harus valid."));
                }
            }
            let version = p.evidence.schemas.last().map_or(1, |s| s.version + 1);
            p.evidence.schemas.push(Schema {
                version,
                columns,
                reason: reason.into(),
            });
            if let Some(pilot) = &mut p.evidence.pilot {
                pilot.status = "needs_review".into();
            }
            invalidate(p);
        }
        "chart_pilot" => {
            let mut pilot: Pilot = serde_json::from_value(data.clone())?;
            let included = included(p, actors);
            if pilot.rationale.trim().is_empty()
                || pilot.record_ids.is_empty()
                || pilot.record_ids.iter().any(|r| !included.contains(r))
                || pilot.schema_version != p.evidence.schemas.last().map_or(0, |s| s.version)
            {
                return Err(anyhow!(
                    "Pilih sumber included untuk pilot, alasan ukuran sampel dan versi form aktif."
                ));
            }
            if !["planned", "complete"].contains(&pilot.status.as_str())
                || (pilot.status == "complete"
                    && !pilot.record_ids.iter().all(|id| row_ready(p, id)))
            {
                return Err(anyhow!(
                    "Selesaikan verifikasi sel wajib pada sumber pilot terlebih dahulu."
                ));
            }
            pilot.record_ids.sort();
            pilot.record_ids.dedup();
            p.evidence.pilot = Some(pilot);
        }
        "chart_cell" => {
            if !included(p, actors).contains(&text(data, "recordId")?.to_string()) {
                return Err(anyhow!(
                    "Charting hanya untuk sumber included pada set aktif."
                ));
            }
            let schema = p
                .evidence
                .schemas
                .last()
                .ok_or_else(|| anyhow!("Simpan form charting terlebih dahulu."))?;
            let column = schema
                .columns
                .iter()
                .find(|c| Some(c.id.as_str()) == data["columnId"].as_str())
                .ok_or_else(|| anyhow!("Kolom tidak tersedia."))?;
            let state = text(data, "state")?;
            let value = text(data, "value")?;
            if state != "present" && !column.missing_policy.iter().any(|s| s == state) {
                return Err(anyhow!(
                    "Status missing tidak diizinkan oleh definisi kolom."
                ));
            }
            if state == "present"
                && (value.trim().is_empty()
                    || (column.kind == "number"
                        && !value.parse::<f64>().is_ok_and(|n| n.is_finite()))
                    || (column.kind == "category"
                        && !column.allowed_values.is_empty()
                        && value
                            .split(';')
                            .any(|v| !column.allowed_values.iter().any(|a| a == v.trim()))))
            {
                return Err(anyhow!(
                    "Nilai belum sesuai tipe atau kategori yang disetujui."
                ));
            }
            if state != "present" && !value.trim().is_empty() {
                return Err(anyhow!(
                    "Kosongkan nilai ketika status missing dipilih; unknown bukan nol."
                ));
            }
            let locator: Locator = serde_json::from_value(data["locator"].clone())?;
            if !locator.artifact_id.is_empty() {
                valid_locator(p, text(data, "recordId")?, &locator, conn)?;
            }
            p.evidence.cells.push(Cell {
                id: uuid::Uuid::new_v4().to_string(),
                record_id: text(data, "recordId")?.into(),
                column_id: column.id.clone(),
                value: value.into(),
                state: state.into(),
                locator,
                extractor: actor.id.clone(),
                verifier: None,
                verification_status: "proposed".into(),
                verification_note: String::new(),
                schema_version: schema.version,
                selection_revision: p.selection_revision,
                protocol_revision: p.protocol_revision,
                source_basis: source_basis(p, text(data, "recordId")?),
                at: crate::store::now_ms(),
            });
            invalidate(p);
        }
        "chart_verify" | "chart_dispute" => {
            let old = p
                .evidence
                .cells
                .iter()
                .find(|c| Some(c.id.as_str()) == data["cellId"].as_str())
                .ok_or_else(|| anyhow!("Sel tidak tersedia."))?
                .clone();
            if !fresh(p, &old)
                || latest(p, &old.record_id, &old.column_id).map(|c| &c.id) != Some(&old.id)
                || !included(p, actors).contains(&old.record_id)
            {
                return Err(anyhow!(
                    "Nilai atau versi sumber berubah. Catat ulang nilai pada form aktif."
                ));
            }
            if actors.len() == 2 && (!actors.contains(&actor.id) || actor.id == old.extractor) {
                return Err(anyhow!(
                    "Verifikasi membutuhkan reviewer manusia lain yang terdaftar."
                ));
            }
            if action == "chart_dispute" {
                let note = text(data, "reason")?.trim();
                if note.is_empty() {
                    return Err(anyhow!("Catat alasan perbedaan nilai."));
                }
                let mut disputed = old;
                disputed.id = uuid::Uuid::new_v4().to_string();
                disputed.verifier = Some(actor.id.clone());
                disputed.verification_status = "needs_review".into();
                disputed.verification_note = note.into();
                disputed.at = crate::store::now_ms();
                p.evidence.cells.push(disputed);
                invalidate(p);
                return Ok(());
            }
            valid_locator(p, &old.record_id, &old.locator, conn)?;
            let mut confirmed = old;
            confirmed.id = uuid::Uuid::new_v4().to_string();
            confirmed.verifier = Some(actor.id.clone());
            confirmed.verification_status = "confirmed".into();
            confirmed.at = crate::store::now_ms();
            p.evidence.cells.push(confirmed);
            invalidate(p);
        }
        "appraisal" => {
            if p.protocol.appraisal != "yes"
                || !included(p, actors).contains(&text(data, "recordId")?.to_string())
                || text(data, "instrument")?.trim().is_empty()
                || text(data, "judgement")?.trim().is_empty()
            {
                return Err(anyhow!(
                    "Appraisal mengikuti keputusan protokol, instrumen dan sumber included."
                ));
            }
            let locator: Locator = serde_json::from_value(data["locator"].clone())?;
            valid_locator(p, text(data, "recordId")?, &locator, conn)?;
            p.evidence.appraisals.push(json!({"recordId":data["recordId"],"instrument":data["instrument"],"judgement":data["judgement"],"locator":locator,"actorId":actor.id,"protocolRevision":p.protocol_revision,"selectionRevision":p.selection_revision,"at":crate::store::now_ms()}));
            invalidate(p);
        }
        "theme" => {
            let content = text(data, "text")?;
            let ids: Vec<String> = serde_json::from_value(data["cellIds"].clone())?;
            if content.trim().is_empty()
                || content.len() > 20000
                || ids.is_empty()
                || ids.len() > 100
            {
                return Err(anyhow!(
                    "Interpretasi memerlukan teks dan sel bukti terkonfirmasi."
                ));
            }
            let cells: Vec<_> = ids
                .iter()
                .filter_map(|id| {
                    p.evidence.cells.iter().find(|c| {
                        &c.id == id
                            && fresh(p, c)
                            && c.verification_status == "confirmed"
                            && latest(p, &c.record_id, &c.column_id)
                                .is_some_and(|last| last.id == c.id)
                    })
                })
                .collect();
            if cells.len() != ids.len() {
                return Err(anyhow!(
                    "Ada sel usang atau belum terkonfirmasi pada interpretasi."
                ));
            }
            let records: std::collections::BTreeSet<_> =
                cells.iter().map(|c| c.record_id.clone()).collect();
            p.evidence.themes.push(json!({"id":uuid::Uuid::new_v4().to_string(),"text":content,"recordIds":records,"cellIds":ids,"dependency":dependency(p),"approvedBy":actor.id,"origin":"human","at":crate::store::now_ms()}));
            invalidate(p);
        }
        "synthesis" => {
            if p.selection_stale || !p.protocol_locked {
                return Err(anyhow!(
                    "Tinjau dan bekukan set seleksi sebelum menghitung sintesis."
                ));
            }
            let schema = p
                .evidence
                .schemas
                .last()
                .ok_or_else(|| anyhow!("Simpan form charting terlebih dahulu."))?;
            if data["approveCodebook"] != true {
                return Err(anyhow!(
                    "Tinjau dan setujui kategori pada definisi kolom terlebih dahulu."
                ));
            }
            let ids = included(p, actors);
            if !ids.is_empty()
                && !p.evidence.pilot.as_ref().is_some_and(|pilot| {
                    pilot.status == "complete" && pilot.schema_version == schema.version
                })
            {
                return Err(anyhow!(
                    "Selesaikan pilot form pada sampel pilihan tim terlebih dahulu."
                ));
            }
            let rows: Vec<_> = ids.iter().filter(|id| row_ready(p, id)).collect();
            let mut tables = vec![];
            let mut cell_ids = vec![];
            for column in &schema.columns {
                let mut counts = BTreeMap::<String, usize>::new();
                let mut missing = BTreeMap::<String, usize>::new();
                let mut available = 0;
                for id in &rows {
                    if let Some(cell) = latest(p, id, &column.id)
                        .filter(|c| fresh(p, c) && c.verification_status == "confirmed")
                    {
                        cell_ids.push(cell.id.clone());
                        if cell.state == "present" {
                            available += 1;
                            let categories: HashSet<_> = if column.kind == "category" {
                                cell.value.split(';').map(str::trim).collect()
                            } else {
                                HashSet::from([cell.value.as_str()])
                            };
                            for category in categories {
                                *counts.entry(category.into()).or_default() += 1;
                            }
                        } else {
                            *missing.entry(cell.state.clone()).or_default() += 1;
                        }
                    } else {
                        *missing.entry("unconfirmed".into()).or_default() += 1;
                    }
                }
                tables.push(json!({"columnId":column.id,"label":column.label,"denominator":rows.len(),"available":available,"counts":counts,"missing":missing,"overlapping":column.kind=="category"}));
            }
            p.evidence.syntheses.push(json!({"version":p.evidence.syntheses.len()+1,"selectionRevision":p.selection_revision,"protocolRevision":p.protocol_revision,"schemaVersion":schema.version,"recordIds":rows,"cellIds":cell_ids,"includedCount":ids.len(),"excludedUnconfirmed":ids.len()-rows.len(),"tables":tables,"themes":p.evidence.themes.iter().filter(|t|t["dependency"]==dependency(p)).collect::<Vec<_>>(),"dependency":dependency(p),"approvedBy":actor.id,"at":crate::store::now_ms()}));
        }
        "draft_section" => {
            let key = text(data, "key")?;
            let content = text(data, "text")?;
            let status = text(data, "status")?;
            if !SECTION_KEYS.contains(&key)
                || content.len() > 200_000
                || !["empty", "outline", "draft", "needs_review", "verified"].contains(&status)
            {
                return Err(anyhow!("Bagian, panjang atau status draft tidak valid."));
            }
            if status == "verified"
                && ["results", "conclusion"].contains(&key)
                && (p.selection_stale || !synthesis_current(p))
            {
                return Err(anyhow!("Hitung dan tinjau sintesis terkini sebelum memverifikasi hasil atau kesimpulan."));
            }
            if status == "verified"
                && p.evidence
                    .claims
                    .iter()
                    .filter(|c| c.section_key == key && c.review_status != "superseded")
                    .any(|c| {
                        c.review_status != "verified"
                            || c.dependency != dependency(p)
                            || !content.contains(&c.text)
                    })
            {
                return Err(anyhow!(
                    "Tinjau klaim dan bukti terkini sebelum menandai bagian terverifikasi."
                ));
            }
            let changed = p
                .evidence
                .sections
                .iter()
                .find(|s| s.key == key)
                .is_some_and(|s| s.text != content);
            for claim in p
                .evidence
                .claims
                .iter_mut()
                .filter(|c| c.section_key == key && changed)
            {
                claim.review_status = "needs_review".into();
            }
            // Text revisions use the same immutable project history as all other changes.
            p.evidence.sections.retain(|s| s.key != key);
            p.evidence.sections.push(Section {
                key: key.into(),
                text: content.into(),
                status: if content.trim().is_empty() {
                    "empty"
                } else {
                    status
                }
                .into(),
                revision: p.revision + 1,
            });
        }
        "claim" => {
            let mut claim: Claim = serde_json::from_value(data.clone())?;
            if !SECTION_KEYS.contains(&claim.section_key.as_str())
                || claim.text.trim().is_empty()
                || !p
                    .evidence
                    .sections
                    .iter()
                    .any(|s| s.key == claim.section_key && s.text.contains(&claim.text))
                || !["factual", "statistic", "interpretation", "author_intent"]
                    .contains(&claim.claim_type.as_str())
                || !["metadata", "abstract", "fulltext"].contains(&claim.source_level.as_str())
            {
                return Err(anyhow!("Klaim harus menunjuk teks nyata pada bagian draft dan level sumber yang valid."));
            }
            if claim
                .record_ids
                .iter()
                .any(|id| !p.records.iter().any(|r| &r.id == id))
                || claim.cell_ids.iter().any(|id| {
                    !p.evidence.cells.iter().any(|c| {
                        &c.id == id
                            && claim.record_ids.contains(&c.record_id)
                            && fresh(p, c)
                            && c.verification_status == "confirmed"
                            && latest(p, &c.record_id, &c.column_id).map(|v| &v.id) == Some(id)
                    })
                })
            {
                return Err(anyhow!("Sumber/sel bukti tidak cocok atau sudah berubah."));
            }
            if claim.claim_type != "author_intent" && claim.record_ids.is_empty() {
                return Err(anyhow!("Klaim faktual memerlukan sumber."));
            }
            if claim.source_level == "abstract"
                && claim.record_ids.iter().any(|id| {
                    !p.records
                        .iter()
                        .find(|r| &r.id == id)
                        .is_some_and(|r| r.abstract_text.is_some())
                })
            {
                return Err(anyhow!("Abstrak tidak tersedia untuk sumber yang dipilih."));
            }
            if claim.source_level == "fulltext" && claim.claim_type != "author_intent" {
                for id in &claim.record_ids {
                    let locator = claim
                        .locators
                        .iter()
                        .find(|l| {
                            p.retrievals
                                .iter()
                                .rev()
                                .find(|r| &r.record_id == id)
                                .is_some_and(|r| r.artifact_id.as_deref() == Some(&l.artifact_id))
                        })
                        .ok_or_else(|| {
                            anyhow!("Cantumkan lokasi bukti untuk setiap sumber teks lengkap.")
                        })?;
                    valid_locator(p, id, locator, conn)?;
                }
            }
            claim.id = uuid::Uuid::new_v4().to_string();
            claim.review_status = "needs_review".into();
            claim.reviewer = None;
            claim.dependency = dependency(p);
            p.evidence.claims.push(claim);
        }
        "claim_verify" => {
            let current = dependency(p);
            let claim = p
                .evidence
                .claims
                .iter()
                .find(|c| Some(c.id.as_str()) == data["claimId"].as_str())
                .ok_or_else(|| anyhow!("Klaim tidak tersedia."))?;
            if claim.review_status == "superseded"
                || data["supportChecked"] != true
                || claim.dependency != current
                || !p
                    .evidence
                    .sections
                    .iter()
                    .any(|s| s.key == claim.section_key && s.text.contains(&claim.text))
            {
                return Err(anyhow!("Periksa kesesuaian dukungan dan versi bukti; DOI saja belum membuktikan dukungan."));
            }
            if claim.claim_type == "statistic"
                && (claim.cell_ids.is_empty()
                    || !p
                        .evidence
                        .syntheses
                        .last()
                        .is_some_and(|s| s["dependency"] == current))
            {
                return Err(anyhow!(
                    "Statistik memerlukan sel terkonfirmasi dan sintesis terkini."
                ));
            }
            let claim = p
                .evidence
                .claims
                .iter_mut()
                .find(|c| Some(c.id.as_str()) == data["claimId"].as_str())
                .unwrap();
            claim.review_status = "verified".into();
            claim.reviewer = Some(actor.id.clone());
        }
        "claim_retire" => {
            if text(data, "reason")?.trim().is_empty() {
                return Err(anyhow!("Catat alasan penggantian klaim."));
            }
            let claim = p
                .evidence
                .claims
                .iter_mut()
                .find(|c| Some(c.id.as_str()) == data["claimId"].as_str())
                .ok_or_else(|| anyhow!("Klaim tidak tersedia."))?;
            claim.review_status = "superseded".into();
            claim.review_note = text(data, "reason")?.into();
            // The previous claim and supplied reason remain in immutable project history.
        }
        "workspace_file" => {
            let name = text(data, "name")?;
            let content = text(data, "text")?;
            if name.trim().is_empty()
                || name.len() > 160
                || name.contains(['/', '\\'])
                || content.len() > 2_000_000
            {
                return Err(anyhow!(
                    "Pilih nama berkas tanpa path; berkas teks maksimal 2 MB."
                ));
            }
            p.evidence.files.push(WorkspaceFile {
                id: uuid::Uuid::new_v4().to_string(),
                name: name.into(),
                text: content.into(),
                checksum: hash(content),
                at: crate::store::now_ms(),
            });
        }
        _ => return Err(anyhow!("Aksi bukti tidak tersedia.")),
    }
    Ok(())
}
