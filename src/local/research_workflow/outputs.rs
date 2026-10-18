//! Standard plans and opt-in coursework are separate from completed review articles.
use super::{bibliography, Project, Protocol};
use crate::error::{anyhow, Result};
use serde_json::{json, Value};
use std::collections::BTreeSet;
pub struct Document {
    pub markdown: String,
    pub checklist: Vec<Value>,
    pub locators: Vec<Value>,
    pub review_state: String,
    pub issues: Vec<Value>,
    pub milestone: String,
}
pub fn registration(p: &Protocol) -> String {
    match p.registration.as_str() {
        "not_registered" => "Kajian belum diregistrasi secara eksternal.".into(),
        "internal" => {
            "Rencana tersimpan secara internal di VERA; ini bukan registrasi publik.".into()
        }
        "registered" => format!(
            "Registrasi yang dilaporkan pengguna: {}",
            p.registration_url
        ),
        "published" => format!(
            "Publikasi protokol yang dilaporkan pengguna: {}",
            p.registration_url
        ),
        _ => {
            "Status registrasi belum diputuskan; tidak ada nomor atau tautan yang dibuat otomatis."
                .into()
        }
    }
}
fn filled(s: &str) -> String {
    if s.trim().is_empty() {
        "[Belum diisi]".into()
    } else {
        s.to_string()
    }
}
pub fn document(p: &Project, milestone: &str) -> Result<Document> {
    if !["plan", "coursework"].contains(&milestone) {
        return Err(anyhow!("Jenis keluaran rencana tidak valid."));
    }
    let coursework = milestone == "coursework";
    if coursework && !p.protocol.assignment_format {
        return Err(anyhow!(
            "Aktifkan keluaran tugas pilihan pada Rencana Kajian terlebih dahulu."
        ));
    }
    let q = &p.protocol;
    let title = filled(&p.direction.title);
    let components:Vec<(usize,&str,String,&str)>=vec![
        (1,"Judul",title.clone(),"title"),
        (3,"Alasan kajian",filled(&q.rationale),"introduction"),
        (4,"Tujuan dan pertanyaan",format!("{}\n\nPertanyaan: {}\n\nSiapa atau apa: {}\n\nKonsep: {}\n\nKonteks: {}",filled(&q.objective),filled(&q.question),filled(&p.direction.participants),filled(&p.direction.concept),filled(&p.direction.context)),"introduction"),
        (5,"Protokol dan registrasi",format!("{}\n\nVersi acuan internal {}. Prosedur di bawah direncanakan; belum dianggap telah dilaksanakan.",registration(q),p.protocol_revision),"methods"),
        (6,"Kriteria kelayakan",format!("Inklusi: {}\n\nEksklusi: {}\n\nBatas pencarian dan alasan: {}",filled(&q.inclusion),filled(&q.exclusion),filled(&q.limits_reason)),"methods"),
        (7,"Sumber informasi",format!("{}\n\nTanggal pelaksanaan aktual mengikuti log run formal. Tanggal impor tidak menggantikan tanggal pencarian.",filled(&q.sources)),"methods"),
        (8,"Strategi pencarian",format!("Database acuan: {}\n\nQuery\n\n```\n{}\n```\n\n{}",q.provider,filled(&q.query),q.query_plans.iter().map(|s|format!("{}\nQuery asli\n\n```\n{}\n```\n\nQuery yang disetujui\n\n```\n{}\n```\n\nFilter dalam query dan alasan: {}",s.provider,s.original,s.query,s.limits_reason)).collect::<Vec<_>>().join("\n\n")),"methods"),
        (9,"Seleksi sumber",filled(&q.screening),"methods"),
        (10,"Proses pencatatan informasi",filled(&q.charting),"methods"),
        (11,"Item data",filled(&q.charting_fields),"methods"),
        (12,"Keputusan penilaian mutu",format!("Penilaian mutu {}.\n\nAlasan: {}",match q.appraisal.as_str(){"yes"=>"direncanakan", "no"=>"tidak direncanakan",_=>"belum diputuskan"},filled(&q.appraisal_reason)),"methods"),
        (13,"Rencana sintesis",filled(&q.synthesis),"methods")];
    let mut markdown=format!("# {title}\n\n{}\n\nStatus: rencana kajian. Kegiatan yang direncanakan tidak dianggap hasil pelaksanaan.\n\n",if coursework{"Dokumen pendamping instruksi perkuliahan pilihan"}else{"Rencana kajian"});
    if coursework {
        if p.evidence.output["identityRequired"] == true {
            markdown.push_str(&format!(
                "Nama: {}\n\nNIM: {}\n\nProgram studi: {}\n\n",
                filled(p.evidence.output["studentName"].as_str().unwrap_or("")),
                filled(p.evidence.output["studentId"].as_str().unwrap_or("")),
                filled(p.evidence.output["program"].as_str().unwrap_or(""))
            ));
        }
        markdown.push_str(&format!(
            "## Instruksi perkuliahan\n\n{}\n\n",
            filled(&p.direction.instructions)
        ));
    }
    let blockers = super::protocol::blockers(q);
    let mut issues: Vec<Value> = blockers
        .iter()
        .map(|message| json!({"code":"plan_incomplete","message":message}))
        .collect();
    if !p.protocol_locked {
        issues.push(json!({"code":"plan_not_locked","message":"Pilih versi rencana acuan sebelum menyebut rencana siap ditinjau."}));
    }
    if coursework && p.direction.instructions.trim().is_empty() {
        issues.push(
            json!({"code":"instructions_missing","message":"Instruksi tugas belum disimpan."}),
        );
    }
    if coursework
        && p.evidence.output["identityRequired"] == true
        && ["studentName", "studentId", "program"].iter().any(|k| {
            p.evidence.output[*k]
                .as_str()
                .is_none_or(|s| s.trim().is_empty())
        })
    {
        issues.push(json!({"code":"identity_missing","message":"Identitas yang diminta instruksi belum lengkap."}));
    }
    let mut checklist = vec![];
    let mut locators = vec![];
    for (item, label, text, section) in components {
        let heading = if coursework {
            format!("{item}. {label}")
        } else {
            label.to_string()
        };
        markdown.push_str(&format!("## {heading}\n\n{text}\n\n"));
        if coursework {
            let status = if text.contains("[Belum diisi]") {
                "missing"
            } else {
                "reported"
            };
            checklist.push(json!({"item":item,"label":label,"status":status,"executionStatus":"planned","sectionKey":section,"quote":text,"page":null,"pageEnd":null,"pageMapping":"needs_review"}));
            locators.push(json!({"id":format!("item_{item}"),"heading":heading,"quote":text}));
        }
    }
    let mut ids = BTreeSet::new();
    for tail in markdown.split("[@").skip(1) {
        if let Some((id, _)) = tail.split_once(']') {
            ids.insert(id.to_string());
        }
    }
    let references = bibliography::references(p, &ids);
    if references.len() != ids.len() {
        issues.push(json!({"code":"citation_mismatch","message":"Ada penanda sitasi tanpa record sumber yang cocok."}));
    }
    for r in &references {
        markdown = markdown.replace(&format!("[@{}]", r.record_id), &r.citation);
        for item in &mut checklist {
            if let Some(quote) = item["quote"].as_str() {
                item["quote"] = json!(quote.replace(&format!("[@{}]", r.record_id), &r.citation));
            }
        }
        for locator in &mut locators {
            if let Some(quote) = locator["quote"].as_str() {
                locator["quote"] =
                    json!(quote.replace(&format!("[@{}]", r.record_id), &r.citation));
            }
        }
        for message in &r.issues {
            issues.push(
                json!({"code":"reference_metadata","message":message,"recordId":r.record_id}),
            );
        }
    }
    markdown.push_str("## Referensi\n\n");
    markdown.push_str(&if references.is_empty() {
        "[Belum ada sitasi sumber yang ditautkan dalam rencana.]".into()
    } else {
        references
            .iter()
            .map(|r| r.reference.clone())
            .collect::<Vec<_>>()
            .join("\n\n")
    });
    markdown.push_str(&format!("\n\n## Lampiran strategi pencarian\n\n```\n{}\n```\n\n## Lampiran rancangan pencatatan informasi\n\n{}\n\n",filled(&q.query),filled(&q.charting_fields)));
    for item in p.evidence.output["requirements"]
        .as_array()
        .into_iter()
        .flatten()
    {
        markdown.push_str(&format!(
            "## {}\n\n{}\n\n",
            item["label"].as_str().unwrap_or("Persyaratan tambahan"),
            item["text"].as_str().unwrap_or("[Belum diisi]")
        ));
    }
    let review_state =
        if issues.is_empty() && checklist.iter().all(|v| v["status"] == "reported") {
            "ready_for_review"
        } else {
            "incomplete_draft"
        }
        .into();
    Ok(Document {
        markdown,
        checklist,
        locators,
        review_state,
        issues,
        milestone: milestone.into(),
    })
}
pub fn settings(p: &mut Project, data: &Value) -> Result<()> {
    if serde_json::to_vec(data)?.len() > 30000 {
        return Err(anyhow!("Pengaturan keluaran terlalu panjang."));
    }
    let language = data["language"].as_str().unwrap_or("id");
    if !["id", "en"].contains(&language) {
        return Err(anyhow!("Pilih bahasa draft Indonesia atau Inggris."));
    }
    for key in ["studentName", "studentId", "program", "filename"] {
        if data[key]
            .as_str()
            .is_some_and(|s| s.len() > 160 || s.contains(['\n', '\r']))
        {
            return Err(anyhow!("Identitas atau nama berkas terlalu panjang."));
        }
    }
    if data["filename"]
        .as_str()
        .is_some_and(|s| s.contains(['/', '\\', ':', '*', '?', '"', '<', '>', '|']))
    {
        return Err(anyhow!(
            "Nama berkas harus berupa nama sederhana tanpa lokasi folder."
        ));
    }
    if data["requirements"].as_array().is_some_and(|rows| {
        rows.len() > 10
            || rows.iter().any(|r| {
                r["label"]
                    .as_str()
                    .is_none_or(|s| s.trim().is_empty() || s.len() > 200)
                    || r["text"].as_str().is_none_or(|s| s.len() > 6000)
            })
    }) {
        return Err(anyhow!(
            "Maksimal sepuluh persyaratan dengan judul dan isi yang valid."
        ));
    }
    p.evidence.output = data.clone();
    Ok(())
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn standard_plan_and_optional_coursework_have_different_coverage() {
        let mut p = Project::new("TEST FIXTURE".into(), "interest".into());
        let plan = document(&p, "plan").unwrap();
        assert!(plan.markdown.contains("direncanakan"));
        assert!(plan.checklist.is_empty());
        assert!(document(&p, "coursework").is_err());
        p.protocol.assignment_format = true;
        let task = document(&p, "coursework").unwrap();
        assert_eq!(
            task.checklist
                .iter()
                .map(|v| v["item"].as_u64().unwrap())
                .collect::<Vec<_>>(),
            vec![1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
        );
        assert!(task.markdown.contains("[Belum diisi]"));
        assert!(!task.markdown.contains("NIM:"));
        p.evidence.output = json!({"identityRequired":true,"studentName":"TEST STUDENT","studentId":"TEST ONLY","program":"TEST PROGRAM"});
        let task = document(&p, "coursework").unwrap();
        assert!(task.markdown.contains("NIM: TEST ONLY"));
        assert!(!document(&p, "plan").unwrap().markdown.contains("NIM:"));
        assert!(task.checklist.iter().all(|v| v["page"].is_null()));
    }
}
