use super::{Decision, Project};
use serde_json::{json, Value};
use std::collections::HashSet;

pub fn canonical(p: &Project) -> Vec<&super::Record> {
    let formal: HashSet<_> = p
        .runs
        .iter()
        .filter(|r| r.purpose == "formal")
        .map(|r| &r.id)
        .collect();
    let removed: HashSet<_> = p
        .merges
        .iter()
        .filter(|m| m.active)
        .map(|m| &m.duplicate_id)
        .collect();
    p.records
        .iter()
        .filter(|r| formal.contains(&r.run_id) && !removed.contains(&r.id))
        .collect()
}

pub fn latest<'a>(p: &'a Project, record: &str, stage: &str, actor: &str) -> Option<&'a Decision> {
    p.decisions.iter().rev().find(|d| {
        d.record_id == record
            && d.stage == stage
            && d.actor_id == actor
            && d.selection_revision == p.selection_revision
            && d.protocol_revision == p.protocol_revision
    })
}

pub fn outcome(p: &Project, record: &str, stage: &str, reviewers: &[String]) -> String {
    if p.selection_stale {
        return "needs_review".into();
    }
    if let Some(r) = p.resolutions.iter().rev().find(|r| {
        r.record_id == record
            && r.stage == stage
            && r.selection_revision == p.selection_revision
            && reviewers.iter().all(|actor| {
                latest(p, record, stage, actor)
                    .is_some_and(|decision| r.decision_ids.contains(&decision.id))
            })
    }) {
        return r.verdict.clone();
    }
    let decisions: Vec<_> = reviewers
        .iter()
        .filter_map(|a| latest(p, record, stage, a))
        .collect();
    if decisions.len() != reviewers.len() || decisions.is_empty() {
        return "pending".into();
    }
    let first = &decisions[0].verdict;
    if decisions.iter().all(|d| &d.verdict == first) && first != "uncertain" {
        first.clone()
    } else {
        "conflict".into()
    }
}

pub fn ledger(p: &Project, reviewers: &[String]) -> Value {
    let records = canonical(p);
    let identified = p
        .records
        .iter()
        .filter(|r| {
            p.runs
                .iter()
                .any(|run| run.id == r.run_id && run.purpose == "formal")
        })
        .count();
    let screened = records
        .iter()
        .filter(|r| {
            ["include", "exclude", "conflict"]
                .contains(&outcome(p, &r.id, "title", reviewers).as_str())
        })
        .count();
    let excluded = records
        .iter()
        .filter(|r| outcome(p, &r.id, "title", reviewers) == "exclude")
        .count();
    let sought: Vec<_> = records
        .iter()
        .filter(|r| outcome(p, &r.id, "title", reviewers) == "include")
        .collect();
    let retrieval = |id: &str| p.retrievals.iter().rev().find(|r| r.record_id == id);
    let not_retrieved = sought
        .iter()
        .filter(|r| retrieval(&r.id).is_some_and(|s| s.status == "not_retrieved"))
        .count();
    let assessed = sought
        .iter()
        .filter(|r| {
            ["include", "exclude"].contains(&outcome(p, &r.id, "fulltext", reviewers).as_str())
        })
        .count();
    let full_excluded = sought
        .iter()
        .filter(|r| outcome(p, &r.id, "fulltext", reviewers) == "exclude")
        .count();
    let included = sought
        .iter()
        .filter(|r| outcome(p, &r.id, "fulltext", reviewers) == "include")
        .count();
    let conflicts = records
        .iter()
        .filter(|r| {
            outcome(p, &r.id, "title", reviewers) == "conflict"
                || outcome(p, &r.id, "fulltext", reviewers) == "conflict"
        })
        .count();
    json!({"identified":identified,"duplicates":identified-records.len(),"eligibleRecords":records.len(),"screened":screened,"pending":records.len()-screened,"excluded":excluded,"sought":sought.len(),"notRetrieved":not_retrieved,"assessed":assessed,"fullExcluded":full_excluded,"includedReports":included,"conflicts":conflicts,"studies":null,"needsReview":p.selection_stale})
}

pub fn duplicate_candidates(p: &Project) -> Value {
    let records = canonical(p);
    let mut pairs = vec![];
    for (i, a) in records.iter().enumerate() {
        for b in records.iter().skip(i + 1) {
            let doi = a
                .doi
                .as_ref()
                .filter(|s| !s.is_empty())
                .is_some_and(|d| b.doi.as_ref() == Some(d));
            let normalize = |s: &str| {
                s.chars()
                    .filter(|c| c.is_alphanumeric())
                    .flat_map(char::to_lowercase)
                    .collect::<String>()
            };
            let title = normalize(&a.title) == normalize(&b.title);
            if doi || title {
                pairs.push(json!({"canonicalId":a.id,"duplicateId":b.id,"reason":if doi {"DOI identik; periksa versi/erratum sebelum menggabungkan"} else {"Judul serupa; periksa penulis, tahun dan versi"}}));
            }
            if pairs.len() >= 100 {
                return json!(pairs);
            }
        }
    }
    json!(pairs)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::local::research_workflow::{import::record, Decision, Merge, Retrieval, SearchRun};

    #[test]
    fn prisma_fixture_counts_actual_reports_and_excludes_exploration() {
        let mut p = Project::new("TEST FIXTURE".into(), "interest".into());
        p.selection_revision = 1;
        p.protocol_revision = 1;
        p.selection_stale = false;
        for (id, purpose, count) in [("formal", "formal", 200), ("explore", "exploratory", 25)] {
            p.runs.push(serde_json::from_value::<SearchRun>(json!({"id":id,"purpose":purpose,"provider":"fixture","query":null,"searchedAt":null,"importedAt":1,"startedAt":1,"updatedAt":1,"protocolRevision":1,"reportedTotal":null,"retrievedCount":count,"status":"complete","checkpoint":null,"warnings":[],"rawPages":[],"sourceFile":null,"checksum":null})).unwrap());
            for i in 0..count {
                p.records.push(record(
                    id,
                    &i.to_string(),
                    &format!("TEST FIXTURE {i}"),
                    "",
                    "2025",
                    "",
                    "",
                ));
            }
        }
        for i in 170..200 {
            p.merges.push(Merge {
                id: i.to_string(),
                canonical_id: p.records[0].id.clone(),
                duplicate_id: p.records[i].id.clone(),
                reason: "TEST fixture duplicate".into(),
                active: true,
            });
        }
        let decisions = |record: &str, stage: &str, verdict: &str| Decision {
            id: uuid::Uuid::new_v4().to_string(),
            record_id: record.into(),
            actor_id: "human_fixture".into(),
            stage: stage.into(),
            verdict: verdict.into(),
            reason: "TEST FIXTURE".into(),
            selection_revision: 1,
            protocol_revision: 1,
            submitted_at: 1,
        };
        for i in 0..170 {
            p.decisions.push(decisions(
                &p.records[i].id,
                "title",
                if i < 120 { "exclude" } else { "include" },
            ));
        }
        for i in 120..170 {
            p.retrievals.push(Retrieval {
                record_id: p.records[i].id.clone(),
                status: if i < 125 {
                    "not_retrieved"
                } else {
                    "retrieved"
                }
                .into(),
                reason: "TEST FIXTURE".into(),
                artifact_id: None,
                at: 1,
            });
            if i >= 125 {
                p.decisions.push(decisions(
                    &p.records[i].id,
                    "fulltext",
                    if i < 140 { "exclude" } else { "include" },
                ));
            }
        }
        let counts = ledger(&p, &["human_fixture".into()]);
        for (name, count) in [
            ("identified", 200),
            ("duplicates", 30),
            ("eligibleRecords", 170),
            ("screened", 170),
            ("excluded", 120),
            ("sought", 50),
            ("notRetrieved", 5),
            ("assessed", 45),
            ("fullExcluded", 15),
            ("includedReports", 30),
        ] {
            assert_eq!(counts[name], count, "{name}");
        }
        assert!(counts["studies"].is_null());
        p.selection_stale = true;
        assert_eq!(ledger(&p, &["human_fixture".into()])["assessed"], 0);
    }
}
