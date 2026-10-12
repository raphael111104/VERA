//! Local research collections persist independently of any browser or Git checkout.
use super::*;
use crate::local::research::Brief;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ResearchFolder {
    pub id: String,
    pub name: String,
    pub brief: Brief,
    pub job_id: Option<String>,
    pub selection: Option<serde_json::Value>,
    #[serde(default)]
    pub revision: i64,
}

impl ResearchFolder {
    fn validate(&mut self) -> Result<()> {
        uuid::Uuid::parse_str(&self.id)?;
        self.name = self.name.trim().to_string();
        if self.name.is_empty() || self.name.chars().count() > 100 || self.revision < 0 {
            return Err(anyhow!("Nama folder wajib diisi, maksimal 100 karakter."));
        }
        if let Some(id) = &self.job_id {
            uuid::Uuid::parse_str(id)?;
        }
        for text in [
            &self.brief.field,
            &self.brief.focus,
            &self.brief.context,
            &self.brief.reason,
        ] {
            if text.chars().count() > 800 {
                return Err(anyhow!("Draf riset terlalu panjang."));
            }
        }
        if let Some(selection) = &self.selection {
            if !selection.is_object() || serde_json::to_vec(selection)?.len() > 4096 {
                return Err(anyhow!("Setelan model tidak valid."));
            }
            if selection["harness"]
                .as_str()
                .is_none_or(|value| !crate::local::harness::is_chat_harness(value))
                || ["model", "reasoningLevel", "permissionMode", "serviceTier"]
                    .iter()
                    .any(|key| !selection[*key].is_null() && !selection[*key].is_string())
            {
                return Err(anyhow!("Setelan model tidak valid."));
            }
        }
        Ok(())
    }
}

impl Store {
    pub fn research_folders(&self) -> Result<Vec<ResearchFolder>> {
        let mut query = self
            .conn
            .prepare("SELECT document FROM research_folders ORDER BY rowid")?;
        let rows = query.query_map([], |row| row.get::<_, String>(0))?;
        rows.map(|row| Ok(serde_json::from_str(&row?)?)).collect()
    }

    pub fn save_research_folder(&self, mut folder: ResearchFolder) -> Result<ResearchFolder> {
        folder.validate()?;
        let expected = folder.revision;
        folder.revision = folder
            .revision
            .checked_add(1)
            .ok_or_else(|| anyhow!("Versi folder tidak valid."))?;
        let document = serde_json::to_string(&folder)?;
        let changed = if expected == 0 {
            self.conn.execute("INSERT OR IGNORE INTO research_folders (id, revision, document) VALUES (?1, ?2, ?3)", params![folder.id, folder.revision, document])?
        } else {
            self.conn.execute("UPDATE research_folders SET revision = ?2, document = ?3 WHERE id = ?1 AND revision = ?4", params![folder.id, folder.revision, document, expected])?
        };
        if changed == 0 {
            return Err(anyhow!(
                "Folder berubah di jendela lain. Muat ulang sebelum menyimpan kembali."
            ));
        }
        Ok(folder)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    fn folder() -> ResearchFolder {
        ResearchFolder {
            id: uuid::Uuid::new_v4().to_string(),
            name: "Riset A".into(),
            brief: Brief {
                field: "Pendidikan".into(),
                focus: String::new(),
                context: String::new(),
                reason: String::new(),
            },
            job_id: None,
            selection: None,
            revision: 0,
        }
    }
    #[test]
    fn research_folder_isolation_reopen_and_conflict() {
        let dir =
            std::env::temp_dir().join(format!("orx-research-folders-{}", uuid::Uuid::new_v4()));
        let store = Store::open_at(dir.clone()).unwrap();
        let a = store.save_research_folder(folder()).unwrap();
        let mut b = folder();
        b.name = "Riset B".into();
        store.save_research_folder(b).unwrap();
        let mut updated = a.clone();
        updated.brief.focus = "Klaim dan bukti".into();
        store.save_research_folder(updated).unwrap();
        assert!(store.save_research_folder(a).is_err());
        drop(store);
        let folders = Store::open_at(dir.clone())
            .unwrap()
            .research_folders()
            .unwrap();
        assert_eq!(folders.len(), 2);
        assert_eq!(folders[0].brief.focus, "Klaim dan bukti");
        assert_eq!(folders[1].brief.focus, "");
        let _ = std::fs::remove_dir_all(dir);
    }
    #[test]
    fn research_folder_rejects_invalid_identity_and_names() {
        let mut value = folder();
        value.id = "../other".into();
        assert!(value.validate().is_err());
        let mut value = folder();
        value.name = "  ".into();
        assert!(value.validate().is_err());
        let mut value = folder();
        value.job_id = Some("bad".into());
        assert!(value.validate().is_err());
    }
}
