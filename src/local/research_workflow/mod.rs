//! Versioned, local research projects. Models never control academic completion.
pub mod assistance;
pub mod audit;
pub mod bibliography;
pub mod direction;
pub mod evidence;
pub mod import;
pub mod learning;
pub mod outputs;
pub mod protocol;
pub mod search;
pub mod selection;

use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Clone, Debug, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", default, deny_unknown_fields)]
pub struct Direction {
    pub interest: String,
    pub experience: String,
    pub field: String,
    pub phenomenon: String,
    pub participants: String,
    pub context: String,
    pub concept: String,
    pub exclusions: String,
    pub objective: String,
    pub terms: String,
    pub seed_sources: String,
    pub candidates: Vec<String>,
    pub choice: String,
    pub reason: String,
    pub question: String,
    pub title: String,
    pub uncertainty: String,
    pub review_fit: String,
    pub instructions: String,
    pub step: usize,
    pub comparisons: Vec<Value>,
}
#[derive(Clone, Debug, Default, Deserialize, Serialize)]
#[serde(default, rename_all = "camelCase", deny_unknown_fields)]
pub struct QueryPlan {
    pub provider: String,
    pub original: String,
    pub query: String,
    pub limits_reason: String,
}

#[derive(Clone, Debug, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", default, deny_unknown_fields)]
pub struct Protocol {
    pub rationale: String,
    pub objective: String,
    pub question: String,
    pub inclusion: String,
    pub exclusion: String,
    pub sources: String,
    pub query: String,
    pub provider: String,
    pub limits_reason: String,
    pub screening: String,
    pub charting: String,
    pub charting_fields: String,
    pub appraisal: String,
    pub appraisal_reason: String,
    pub synthesis: String,
    pub registration: String,
    pub registration_url: String,
    pub amendment_reason: String,
    pub assignment_format: bool,
    pub query_plans: Vec<QueryPlan>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Record {
    pub id: String,
    pub run_id: String,
    pub raw_id: String,
    pub title: String,
    pub doi: Option<String>,
    pub year: Option<String>,
    pub authors: Option<String>,
    #[serde(rename = "abstract")]
    pub abstract_text: Option<String>,
    pub url: Option<String>,
    #[serde(default)]
    pub bibliography: bibliography::Bibliography,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchRun {
    pub id: String,
    pub purpose: String,
    pub provider: String,
    pub query: Option<String>,
    pub searched_at: Option<String>,
    pub imported_at: Option<i64>,
    pub started_at: i64,
    pub updated_at: i64,
    pub protocol_revision: i64,
    pub reported_total: Option<usize>,
    pub retrieved_count: usize,
    pub status: String,
    pub checkpoint: Option<String>,
    pub warnings: Vec<String>,
    pub raw_pages: Vec<Value>,
    pub source_file: Option<String>,
    pub checksum: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Decision {
    pub id: String,
    pub record_id: String,
    pub actor_id: String,
    pub stage: String,
    pub verdict: String,
    pub reason: String,
    pub selection_revision: i64,
    pub protocol_revision: i64,
    pub submitted_at: i64,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Merge {
    pub id: String,
    pub canonical_id: String,
    pub duplicate_id: String,
    pub reason: String,
    pub active: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Retrieval {
    pub record_id: String,
    pub status: String,
    pub reason: String,
    pub artifact_id: Option<String>,
    pub at: i64,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Resolution {
    pub record_id: String,
    pub stage: String,
    pub verdict: String,
    pub reason: String,
    pub actor_id: String,
    pub selection_revision: i64,
    pub at: i64,
    #[serde(default)]
    pub decision_ids: Vec<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub id: String,
    pub name: String,
    pub entry: String,
    pub revision: i64,
    pub current_activity: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub direction: Direction,
    pub direction_confirmed: bool,
    pub protocol: Protocol,
    pub protocol_revision: i64,
    pub protocol_locked: bool,
    pub needs_review: bool,
    pub selection_revision: i64,
    pub selection_stale: bool,
    pub runs: Vec<SearchRun>,
    pub records: Vec<Record>,
    pub merges: Vec<Merge>,
    pub decisions: Vec<Decision>,
    pub retrievals: Vec<Retrieval>,
    pub resolutions: Vec<Resolution>,
    #[serde(default)]
    pub evidence: evidence::Evidence,
}

impl Project {
    pub fn new(name: String, entry: String) -> Self {
        let now = crate::store::now_ms();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            name,
            entry,
            revision: 1,
            current_activity: "direction".into(),
            created_at: now,
            updated_at: now,
            direction: Direction::default(),
            direction_confirmed: false,
            protocol: Protocol::default(),
            protocol_revision: 0,
            protocol_locked: false,
            needs_review: false,
            selection_revision: 0,
            selection_stale: true,
            runs: vec![],
            records: vec![],
            merges: vec![],
            decisions: vec![],
            retrievals: vec![],
            resolutions: vec![],
            evidence: evidence::Evidence::default(),
        }
    }
}

#[derive(Clone, Debug)]
pub struct Actor {
    pub id: String,
    pub role: String,
}

pub fn hash(text: &str) -> String {
    use sha2::{Digest, Sha256};
    format!("{:x}", Sha256::digest(text.as_bytes()))
}
