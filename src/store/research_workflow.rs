//! Additive schema and immutable workflow revisions, independent of Git projects.
use super::*;
use crate::local::research_workflow::{hash, Actor, Project};
use serde_json::{json, Value};

impl Store {
    pub fn workflow_job_result(&self, id: &str, key: &str, job: &str) -> Result<Option<Value>> {
        let (p, actor) = self.workflow_project(id, key)?;
        if actor.role != "owner"
            || !p
                .evidence
                .jobs
                .iter()
                .any(|j| j["id"] == job && j["actorId"] == actor.id)
        {
            return Err(anyhow!("access denied"));
        }
        let saved: Option<String> = self
            .conn
            .query_row(
                "SELECT result FROM rw_job_results WHERE project_id=?1 AND job_id=?2",
                params![id, job],
                |r| r.get(0),
            )
            .optional()?;
        saved
            .map(|s| serde_json::from_str(&s).map_err(Into::into))
            .transpose()
    }
    pub fn workflow_save_job_result(
        &self,
        id: &str,
        key: &str,
        job: &str,
        value: &Value,
    ) -> Result<()> {
        self.workflow_job_result(id, key, job)?;
        self.conn.execute(
            "INSERT OR IGNORE INTO rw_job_results(project_id,job_id,result) VALUES(?1,?2,?3)",
            params![id, job, serde_json::to_string(value)?],
        )?;
        Ok(())
    }
    pub fn workflow_amendments(&self, id: &str) -> Result<Value> {
        let mut query=self.conn.prepare("SELECT revision,action,actor_id,created_at,document FROM rw_versions WHERE project_id=?1 ORDER BY revision")?;
        let rows = query.query_map([id], |r| {
            Ok((
                r.get::<_, i64>(0)?,
                r.get::<_, String>(1)?,
                r.get::<_, String>(2)?,
                r.get::<_, i64>(3)?,
                r.get::<_, String>(4)?,
            ))
        })?;
        let mut protocol = Value::Null;
        let mut result = vec![];
        for row in rows {
            let (revision, action, actor, at, document) = row?;
            let v: Value = serde_json::from_str(&document)?;
            if v["_delta"] == 1 {
                if let Some(p) = v["set"].get("protocol") {
                    protocol = p.clone();
                }
            } else if let Some(p) = v.get("protocol") {
                protocol = p.clone();
            }
            if ["protocol", "lock_protocol"].contains(&action.as_str()) {
                result.push(json!({"revision":revision,"action":action,"actorId":actor,"at":at,"protocol":protocol}));
            }
        }
        Ok(json!(result))
    }
    pub fn workflow_export(&self, id: &str, file: &str) -> Result<Vec<u8>> {
        Ok(self.conn.query_row(
            "SELECT bytes FROM rw_export_files WHERE project_id=?1 AND id=?2",
            params![id, file],
            |r| r.get(0),
        )?)
    }
    pub fn workflow_artifacts(&self, id: &str) -> Result<Value> {
        let mut query = self
            .conn
            .prepare("SELECT id,record_id,checksum FROM rw_artifacts WHERE project_id=?1")?;
        let rows=query.query_map([id],|row|Ok(json!({"id":row.get::<_,String>(0)?,"recordId":row.get::<_,String>(1)?,"checksum":row.get::<_,String>(2)?})))?;
        Ok(Value::Array(
            rows.collect::<std::result::Result<Vec<_>, _>>()?,
        ))
    }
    fn workflow_response(&self, response: &str) -> Result<Project> {
        let pointer: Value = serde_json::from_str(response)?;
        let Some(id) = pointer["projectId"].as_str() else {
            return Ok(serde_json::from_value(pointer)?);
        };
        let revision = pointer["revision"]
            .as_i64()
            .ok_or_else(|| anyhow!("Invalid workflow revision pointer"))?;
        let current: String =
            self.conn
                .query_row("SELECT document FROM rw_projects WHERE id=?1", [id], |r| {
                    r.get(0)
                })?;
        let current: Project = serde_json::from_str(&current)?;
        if current.revision == revision {
            return Ok(current);
        }
        let mut query=self.conn.prepare("SELECT document FROM rw_versions WHERE project_id=?1 AND revision<=?2 ORDER BY revision")?;
        let rows = query.query_map(params![id, revision], |r| r.get::<_, String>(0))?;
        let mut state = Value::Null;
        for row in rows {
            let version: Value = serde_json::from_str(&row?)?;
            if version["_delta"] == 1 {
                for (key, value) in version["set"]
                    .as_object()
                    .ok_or_else(|| anyhow!("Invalid revision delta"))?
                {
                    state[key] = value.clone();
                }
                for (key, value) in version["append"]
                    .as_object()
                    .ok_or_else(|| anyhow!("Invalid revision delta"))?
                {
                    state[key]
                        .as_array_mut()
                        .ok_or_else(|| anyhow!("Invalid revision array"))?
                        .extend(
                            value
                                .as_array()
                                .ok_or_else(|| anyhow!("Invalid revision append"))?
                                .iter()
                                .cloned(),
                        );
                }
                // Older snapshots have no evidence field. Decode both their full
                // documents and the new nested deltas without dropping history.
                if version.get("evidenceSet").is_some() || version.get("evidenceAppend").is_some() {
                    if !state["evidence"].is_object() {
                        state["evidence"] = serde_json::to_value(
                            crate::local::research_workflow::evidence::Evidence::default(),
                        )?;
                    }
                    if let Some(fields) = version["evidenceSet"].as_object() {
                        for (key, value) in fields {
                            state["evidence"][key] = value.clone();
                        }
                    }
                    if let Some(fields) = version["evidenceAppend"].as_object() {
                        for (key, value) in fields {
                            if state["evidence"].get(key).is_none() {
                                state["evidence"][key] = json!([]);
                            }
                            state["evidence"][key]
                                .as_array_mut()
                                .ok_or_else(|| anyhow!("Invalid evidence revision array"))?
                                .extend(
                                    value
                                        .as_array()
                                        .ok_or_else(|| anyhow!("Invalid evidence revision append"))?
                                        .iter()
                                        .cloned(),
                                );
                        }
                    }
                }
            } else {
                state = version;
            }
        }
        let project: Project = serde_json::from_value(state)?;
        if project.revision != revision {
            return Err(anyhow!("Workflow revision history incomplete"));
        }
        Ok(project)
    }
    pub(crate) fn workflow_schema(&self) -> Result<()> {
        let exists: bool = self.conn.query_row(
            "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='rw_schema')",
            [],
            |r| r.get(0),
        )?;
        if exists {
            let version: i64 =
                self.conn
                    .query_row("SELECT MAX(version) FROM rw_schema", [], |r| r.get(0))?;
            if version != 1 {
                return Err(anyhow!(
                    "Versi skema workflow tidak didukung; gunakan build yang sesuai atau backup."
                ));
            }
            self.conn.execute_batch("CREATE TABLE IF NOT EXISTS rw_export_files(project_id TEXT NOT NULL,id TEXT NOT NULL,bytes BLOB NOT NULL,PRIMARY KEY(project_id,id)); CREATE TABLE IF NOT EXISTS rw_job_results(project_id TEXT NOT NULL,job_id TEXT NOT NULL,result TEXT NOT NULL,PRIMARY KEY(project_id,job_id));")?;
            return Ok(());
        }
        self.conn.execute_batch("BEGIN IMMEDIATE;
        CREATE TABLE IF NOT EXISTS rw_schema(version INTEGER PRIMARY KEY);
        CREATE TABLE IF NOT EXISTS rw_projects(id TEXT PRIMARY KEY, owner_hash TEXT NOT NULL, document TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS rw_versions(project_id TEXT NOT NULL, revision INTEGER NOT NULL, document TEXT NOT NULL, actor_id TEXT NOT NULL, action TEXT NOT NULL, created_at INTEGER NOT NULL, PRIMARY KEY(project_id,revision));
        CREATE TABLE IF NOT EXISTS rw_operations(owner_hash TEXT NOT NULL, operation_id TEXT NOT NULL, request_hash TEXT NOT NULL, response TEXT NOT NULL, PRIMARY KEY(owner_hash,operation_id));
        CREATE TABLE IF NOT EXISTS rw_members(project_id TEXT NOT NULL, token_hash TEXT PRIMARY KEY, actor_id TEXT NOT NULL, name TEXT NOT NULL, active INTEGER NOT NULL, expires_at INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS rw_artifacts(id TEXT PRIMARY KEY, project_id TEXT NOT NULL, record_id TEXT NOT NULL, checksum TEXT NOT NULL, data BLOB NOT NULL);
        CREATE TABLE IF NOT EXISTS rw_export_files(project_id TEXT NOT NULL,id TEXT NOT NULL,bytes BLOB NOT NULL,PRIMARY KEY(project_id,id));
        CREATE TABLE IF NOT EXISTS rw_job_results(project_id TEXT NOT NULL,job_id TEXT NOT NULL,result TEXT NOT NULL,PRIMARY KEY(project_id,job_id));
        INSERT OR IGNORE INTO rw_schema VALUES(1); COMMIT;")?;
        Ok(())
    }

    pub fn workflow_list(&self, key: &str) -> Result<Value> {
        let mut q = self
            .conn
            .prepare("SELECT document FROM rw_projects WHERE owner_hash=?1 ORDER BY rowid DESC")?;
        let rows = q.query_map([hash(key)], |r| r.get::<_, String>(0))?;
        let mut result = vec![];
        for row in rows {
            let p: Project = serde_json::from_str(&row?)?;
            result.push(json!({"id":p.id,"name":p.name,"entry":p.entry,"revision":p.revision,"currentActivity":p.current_activity,"updatedAt":p.updated_at}));
        }
        Ok(json!(result))
    }

    pub fn workflow_replay(
        &self,
        id: &str,
        key: &str,
        operation: &str,
        request: &Value,
    ) -> Result<Option<Project>> {
        self.workflow_project(id, key)?;
        let scope = hash(&format!("{}:{id}", hash(key)));
        let saved:Option<(String,String)>=self.conn.query_row("SELECT request_hash,response FROM rw_operations WHERE owner_hash=?1 AND operation_id=?2",params![scope,operation],|r|Ok((r.get(0)?,r.get(1)?))).optional()?;
        if let Some((prior, response)) = saved {
            if prior != hash(&serde_json::to_string(request)?) {
                return Err(anyhow!("Operation ID already used for different input"));
            }
            return Ok(Some(self.workflow_response(&response)?));
        }
        Ok(None)
    }

    pub fn workflow_project(&self, id: &str, key: &str) -> Result<(Project, Actor)> {
        let (owner, document): (String, String) = self
            .conn
            .query_row(
                "SELECT owner_hash,document FROM rw_projects WHERE id=?1",
                [id],
                |r| Ok((r.get(0)?, r.get(1)?)),
            )
            .optional()?
            .ok_or_else(|| anyhow!("access denied"))?;
        let token = hash(key);
        let actor = if owner == token {
            Actor {
                id: format!("owner_{}", &token[..20]),
                role: "owner".into(),
            }
        } else {
            self.conn.query_row("SELECT actor_id FROM rw_members WHERE project_id=?1 AND token_hash=?2 AND active=1 AND expires_at>?3", params![id,token,now_ms()], |r| Ok(Actor {id:r.get(0)?,role:"reviewer".into()})).optional()?.ok_or_else(|| anyhow!("access denied"))?
        };
        Ok((serde_json::from_str(&document)?, actor))
    }

    pub fn workflow_members(&self, id: &str) -> Result<Vec<(String, String)>> {
        let mut q = self.conn.prepare("SELECT actor_id,name FROM rw_members WHERE project_id=?1 AND active=1 AND expires_at>?2 ORDER BY rowid")?;
        let rows = q.query_map(params![id, now_ms()], |r| Ok((r.get(0)?, r.get(1)?)))?;
        Ok(rows.collect::<std::result::Result<Vec<_>, _>>()?)
    }

    pub fn workflow_create(
        &self,
        key: &str,
        operation: &str,
        name: &str,
        entry: &str,
    ) -> Result<Project> {
        let request_hash = hash(&format!("{name}\n{entry}"));
        let tx = rusqlite::Transaction::new_unchecked(
            &self.conn,
            rusqlite::TransactionBehavior::Immediate,
        )?;
        if let Some((prior, response)) = tx.query_row("SELECT request_hash,response FROM rw_operations WHERE owner_hash=?1 AND operation_id=?2", params![hash(key),operation], |r| Ok((r.get::<_,String>(0)?,r.get::<_,String>(1)?))).optional()? {
            if prior != request_hash { return Err(anyhow!("Operation ID already used for different input")); }
            return self.workflow_response(&response);
        }
        let project = Project::new(name.trim().into(), entry.into());
        let document = serde_json::to_string(&project)?;
        tx.execute(
            "INSERT INTO rw_projects VALUES(?1,?2,?3)",
            params![project.id, hash(key), document],
        )?;
        tx.execute(
            "INSERT INTO rw_versions VALUES(?1,1,?2,?3,'create',?4)",
            params![
                project.id,
                document,
                format!("owner_{}", &hash(key)[..20]),
                now_ms()
            ],
        )?;
        tx.execute(
            "INSERT INTO rw_operations VALUES(?1,?2,?3,?4)",
            params![
                hash(key),
                operation,
                request_hash,
                serde_json::to_string(
                    &json!({"projectId":project.id,"revision":project.revision})
                )?
            ],
        )?;
        tx.commit()?;
        Ok(project)
    }

    pub fn workflow_change(
        &self,
        id: &str,
        key: &str,
        operation: &str,
        expected: i64,
        request: &Value,
        update: impl FnOnce(&mut Project, &Actor, &Connection) -> Result<()>,
    ) -> Result<Project> {
        let request_hash = hash(&serde_json::to_string(request)?);
        // Reserve the writer before reading; a deferred read-to-write upgrade in
        // WAL mode can fail immediately while background jobs commit changes.
        let tx = rusqlite::Transaction::new_unchecked(
            &self.conn,
            rusqlite::TransactionBehavior::Immediate,
        )?;
        let (mut project, actor) = self.workflow_project(id, key)?;
        let scope = hash(&format!("{}:{id}", hash(key)));
        if let Some((prior,response)) = tx.query_row("SELECT request_hash,response FROM rw_operations WHERE owner_hash=?1 AND operation_id=?2",params![scope,operation],|r| Ok((r.get::<_,String>(0)?,r.get::<_,String>(1)?))).optional()? {
            if prior != request_hash { return Err(anyhow!("Operation ID already used for different input")); }
            return self.workflow_response(&response);
        }
        if project.revision != expected {
            return Err(anyhow!("revision conflict:{}", project.revision));
        }
        let before = serde_json::to_value(&project)?;
        update(&mut project, &actor, &tx)?;
        project.revision += 1;
        project.updated_at = now_ms();
        let document = serde_json::to_string(&project)?;
        let after = serde_json::to_value(&project)?;
        let mut changed = serde_json::Map::new();
        let mut appended = serde_json::Map::new();
        let mut evidence_set = serde_json::Map::new();
        let mut evidence_append = serde_json::Map::new();
        for (key, value) in after
            .as_object()
            .ok_or_else(|| anyhow!("Invalid workflow document"))?
        {
            if before.get(key) == Some(value) {
                continue;
            }
            if key == "evidence" {
                for (field, next) in value
                    .as_object()
                    .ok_or_else(|| anyhow!("Invalid evidence document"))?
                {
                    let old = &before["evidence"][field];
                    if old == next {
                        continue;
                    }
                    if let (Some(old), Some(new)) = (old.as_array(), next.as_array()) {
                        if new.starts_with(old) {
                            evidence_append.insert(field.clone(), json!(&new[old.len()..]));
                            continue;
                        }
                    }
                    evidence_set.insert(field.clone(), next.clone());
                }
                continue;
            }
            if let (Some(old), Some(new)) = (before[key].as_array(), value.as_array()) {
                if new.starts_with(old) {
                    appended.insert(key.clone(), json!(&new[old.len()..]));
                    continue;
                }
            }
            changed.insert(key.clone(), value.clone());
        }
        // Evidence/raw imports are not copied for every keystroke or decision.
        let delta = serde_json::to_string(
            &json!({"_delta":1,"set":changed,"append":appended,"evidenceSet":evidence_set,"evidenceAppend":evidence_append}),
        )?;
        tx.execute(
            "UPDATE rw_projects SET document=?2 WHERE id=?1",
            params![id, document],
        )?;
        tx.execute(
            "INSERT INTO rw_versions VALUES(?1,?2,?3,?4,?5,?6)",
            params![
                id,
                project.revision,
                delta,
                actor.id,
                request["action"].as_str().unwrap_or("change"),
                now_ms()
            ],
        )?;
        tx.execute(
            "INSERT INTO rw_operations VALUES(?1,?2,?3,?4)",
            params![
                scope,
                operation,
                request_hash,
                serde_json::to_string(&json!({"projectId":id,"revision":project.revision}))?
            ],
        )?;
        tx.commit()?;
        Ok(project)
    }

    pub fn workflow_history(&self, id: &str) -> Result<Value> {
        let mut q = self.conn.prepare("SELECT revision,action,actor_id,created_at FROM rw_versions WHERE project_id=?1 ORDER BY revision DESC LIMIT 100")?;
        let rows = q.query_map([id],|r| Ok(json!({"revision":r.get::<_,i64>(0)?,"action":r.get::<_,String>(1)?,"actorId":r.get::<_,String>(2)?,"at":r.get::<_,i64>(3)?})))?;
        Ok(json!(rows.collect::<std::result::Result<Vec<_>, _>>()?))
    }

    pub fn workflow_artifact(&self, id: &str, artifact: &str) -> Result<Vec<u8>> {
        Ok(self.conn.query_row(
            "SELECT data FROM rw_artifacts WHERE project_id=?1 AND id=?2",
            params![id, artifact],
            |r| r.get(0),
        )?)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn model_results_are_scoped_and_do_not_race_manual_revisions() {
        let dir = std::env::temp_dir().join(format!("vera-job-{}", uuid::Uuid::new_v4()));
        let store = Store::open_at(dir.clone()).unwrap();
        let p = store
            .workflow_create("owner", "create", "TEST FIXTURE", "interest")
            .unwrap();
        let saved = store
            .workflow_change(
                &p.id,
                "owner",
                "job",
                1,
                &json!({"action":"job"}),
                |p, actor, _| {
                    p.evidence
                        .jobs
                        .push(json!({"id":"j","actorId":actor.id,"status":"queued"}));
                    Ok(())
                },
            )
            .unwrap();
        let result = json!({"proposal":{"summary":"TEST result"}});
        assert!(store
            .workflow_save_job_result(&p.id, "outsider", "j", &result)
            .is_err());
        store
            .workflow_save_job_result(&p.id, "owner", "j", &result)
            .unwrap();
        assert_eq!(
            store.workflow_project(&p.id, "owner").unwrap().0.revision,
            saved.revision
        );
        store
            .workflow_save_job_result(&p.id, "owner", "j", &json!({"changed":true}))
            .unwrap();
        drop(store);
        let store = Store::open_at(dir.clone()).unwrap();
        assert_eq!(
            store.workflow_job_result(&p.id, "owner", "j").unwrap(),
            Some(result)
        );
        assert!(store
            .workflow_job_result(&p.id, "owner", "foreign-job")
            .is_err());
        drop(store);
        let _ = std::fs::remove_dir_all(dir);
    }
    #[test]
    fn historical_retry_reconstructs_immutable_revision_without_copying_corpus() {
        let dir =
            std::env::temp_dir().join(format!("vera-workflow-history-{}", uuid::Uuid::new_v4()));
        let store = Store::open_at(dir.clone()).unwrap();
        let p = store
            .workflow_create("owner", "create", "TEST FIXTURE", "interest")
            .unwrap();
        let request = json!({"action":"import","fixture":true});
        let saved = store
            .workflow_change(&p.id, "owner", "import", 1, &request, |p, _, _| {
                p.records
                    .push(crate::local::research_workflow::import::record(
                        "fixture",
                        "1",
                        "TEST FIXTURE",
                        "",
                        "",
                        "",
                        &"a".repeat(100_000),
                    ));
                Ok(())
            })
            .unwrap();
        let mut revision = saved.revision;
        for i in 0..10 {
            revision = store
                .workflow_change(
                    &p.id,
                    "owner",
                    &format!("navigate-{i}"),
                    revision,
                    &json!({"action":"activity","i":i}),
                    |p, _, _| {
                        p.current_activity = if i % 2 == 0 { "search" } else { "selection" }.into();
                        Ok(())
                    },
                )
                .unwrap()
                .revision;
        }
        let retried = store
            .workflow_change(&p.id, "owner", "import", 1, &request, |_, _, _| {
                panic!("historical retry cannot write")
            })
            .unwrap();
        assert_eq!(retried.revision, 2);
        assert_eq!(
            retried.records[0].abstract_text.as_ref().unwrap().len(),
            100_000
        );
        assert_eq!(
            store.workflow_project(&p.id, "owner").unwrap().0.revision,
            revision
        );
        let bytes: i64 = store
            .conn
            .query_row(
                "SELECT SUM(LENGTH(document)) FROM rw_versions WHERE project_id=?1",
                [&p.id],
                |r| r.get(0),
            )
            .unwrap();
        assert!(
            bytes < 150_000,
            "unchanged corpus must not be copied for every navigation: {bytes}"
        );
        drop(store);
        let _ = std::fs::remove_dir_all(dir);
    }
    #[test]
    fn nested_evidence_history_appends_and_replays_legacy_snapshot() {
        use crate::local::research_workflow::evidence::WorkspaceFile;
        let dir = std::env::temp_dir().join(format!("vera-evidence-{}", uuid::Uuid::new_v4()));
        let store = Store::open_at(dir.clone()).unwrap();
        let p = store
            .workflow_create("owner", "create", "TEST FIXTURE", "interest")
            .unwrap();
        let mut old = serde_json::to_value(&p).unwrap();
        old.as_object_mut().unwrap().remove("evidence");
        store
            .conn
            .execute(
                "UPDATE rw_versions SET document=?2 WHERE project_id=?1 AND revision=1",
                params![p.id, serde_json::to_string(&old).unwrap()],
            )
            .unwrap();
        let request = json!({"action":"workspace_file","test":true});
        for index in 0..5 {
            store
                .workflow_change(
                    &p.id,
                    "owner",
                    &format!("file-{index}"),
                    index + 1,
                    &request,
                    |p, _, _| {
                        p.evidence.files.push(WorkspaceFile {
                            id: index.to_string(),
                            name: "TEST.md".into(),
                            text: format!("TEST-{index} {}", "x".repeat(10_000)),
                            checksum: "TEST checksum".into(),
                            at: 0,
                        });
                        Ok(())
                    },
                )
                .unwrap();
        }
        let replay = store
            .workflow_change(&p.id, "owner", "file-0", 1, &request, |_, _, _| {
                panic!("retry must not write")
            })
            .unwrap();
        assert_eq!(replay.evidence.files.len(), 1);
        assert!(replay.evidence.files[0].text.starts_with("TEST-0"));
        let bytes: i64 = store
            .conn
            .query_row(
                "SELECT SUM(LENGTH(document)) FROM rw_versions WHERE project_id=?1",
                [&p.id],
                |r| r.get(0),
            )
            .unwrap();
        assert!(
            bytes < 65_000,
            "charting/file history must append instead of duplicating existing evidence: {bytes}"
        );
        assert_eq!(
            store
                .workflow_project(&p.id, "owner")
                .unwrap()
                .0
                .evidence
                .files
                .len(),
            5
        );
        drop(store);
        let _ = std::fs::remove_dir_all(dir);
    }
    #[test]
    fn workflow_save_waits_for_a_background_writer_before_reading() {
        let dir = std::env::temp_dir().join(format!("vera-writer-{}", uuid::Uuid::new_v4()));
        let store = Store::open_at(dir.clone()).unwrap();
        let project = store
            .workflow_create("owner", "create", "TEST FIXTURE", "interest")
            .unwrap();
        let (send, receive) = std::sync::mpsc::channel();
        let background_dir = dir.clone();
        let id = project.id.clone();
        let background = std::thread::spawn(move || {
            let other = Store::open_at(background_dir).unwrap();
            let tx = rusqlite::Transaction::new_unchecked(
                &other.conn,
                rusqlite::TransactionBehavior::Immediate,
            )
            .unwrap();
            tx.execute("UPDATE rw_projects SET document=document WHERE id=?1", [id])
                .unwrap();
            send.send(()).unwrap();
            std::thread::sleep(std::time::Duration::from_millis(100));
            tx.commit().unwrap();
        });
        receive.recv().unwrap();
        let saved = store
            .workflow_change(
                &project.id,
                "owner",
                "save",
                1,
                &json!({"action":"activity"}),
                |p, _, _| {
                    p.current_activity = "audit".into();
                    Ok(())
                },
            )
            .unwrap();
        assert_eq!(saved.revision, 2);
        background.join().unwrap();
        drop(store);
        let _ = std::fs::remove_dir_all(dir);
    }
    #[test]
    fn project_reopens_retries_and_denies_foreign_identity() {
        let dir = std::env::temp_dir().join(format!("vera-workflow-{}", uuid::Uuid::new_v4()));
        let store = Store::open_at(dir.clone()).unwrap();
        let p = store
            .workflow_create("owner-key", "create", "Riset", "interest")
            .unwrap();
        assert_eq!(
            store
                .workflow_create("owner-key", "create", "Riset", "interest")
                .unwrap()
                .id,
            p.id
        );
        let req = json!({"action":"direction","interest":"Pendidikan"});
        let saved = store
            .workflow_change(&p.id, "owner-key", "save", 1, &req, |p, _, _| {
                p.direction.interest = "Pendidikan".into();
                Ok(())
            })
            .unwrap();
        let retry = store
            .workflow_change(&p.id, "owner-key", "save", 1, &req, |_, _, _| {
                panic!("retry must not write twice")
            })
            .unwrap();
        assert_eq!(retry.revision, saved.revision);
        assert!(store
            .workflow_change(&p.id, "owner-key", "other", 1, &req, |_, _, _| Ok(()))
            .is_err());
        assert!(store.workflow_project(&p.id, "foreign-key").is_err());
        assert_eq!(store.workflow_list("foreign-key").unwrap(), json!([]));
        drop(store);
        let store = Store::open_at(dir.clone()).unwrap();
        let (resumed, _) = store.workflow_project(&p.id, "owner-key").unwrap();
        assert_eq!(resumed.direction.interest, "Pendidikan");
        assert_eq!(resumed.revision, 2);
        assert_eq!(
            store
                .workflow_history(&p.id)
                .unwrap()
                .as_array()
                .unwrap()
                .len(),
            2
        );
        drop(store);
        let _ = std::fs::remove_dir_all(dir);
    }
}
