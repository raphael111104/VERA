// Versioned pedagogic prompts and independent transfer, separate from artifact quality.
use super::{evidence, Actor, Project};
use crate::error::{anyhow, Result};
use serde_json::{json, Value};
pub const POLICY: &str = "vera-scaffolding-1";
pub const PROMPT: &str = "vera-learning-prompts-1";
pub const RUBRIC: [&str; 4] = [
    "Keselarasan pertanyaan dan kriteria",
    "Pembedaan metadata abstrak dan teks lengkap",
    "Kesesuaian kesimpulan dengan bukti",
    "Pelaporan keterbatasan dan perubahan",
];
fn required<'a>(d: &'a Value, key: &str) -> Result<&'a str> {
    d[key]
        .as_str()
        .map(str::trim)
        .filter(|s| !s.is_empty() && s.len() <= 6000)
        .ok_or_else(|| anyhow!("Field {key} perlu diisi maksimal 6.000 karakter."))
}
pub fn active_transfer(p: &Project) -> bool {
    p.evidence
        .learning
        .iter()
        .filter(|e| e["type"] == "transfer_start")
        .any(|e| {
            !p.evidence.learning.iter().any(|s| {
                ["transfer_submit", "transfer_cancel"].contains(&s["type"].as_str().unwrap_or(""))
                    && s["id"] == e["id"]
            })
        })
}
pub fn apply(p: &mut Project, actor: &Actor, action: &str, d: &Value) -> Result<()> {
    let mut event = json!({"type":action,"actorId":actor.id,"at":crate::store::now_ms(),"policyVersion":POLICY,"promptVersion":PROMPT,"dependency":evidence::dependency(p)});
    match action {
        "learning_decision" => {
            if active_transfer(p) {
                return Err(anyhow!(
                    "Selesaikan tugas transfer mandiri sebelum membuka bantuan lain."
                ));
            }
            let id = required(d, "id")?;
            if p.evidence.learning.iter().any(|e| e["id"] == id) {
                return Err(anyhow!("ID keputusan sudah digunakan."));
            }
            let activity = required(d, "activity")?;
            if ![
                "direction",
                "protocol",
                "search",
                "selection",
                "charting",
                "synthesis",
                "draft",
                "audit",
            ]
            .contains(&activity)
            {
                return Err(anyhow!("Aktivitas bantuan tidak valid."));
            }
            event["id"] = json!(id);
            event["activity"] = json!(activity);
            for key in ["judgement", "reason", "evidence"] {
                event[key] = json!(required(d, key)?);
            }
            let hypothesis = d["hypothesis"].as_str().unwrap_or("none");
            if ![
                "none",
                "novelty",
                "metadata",
                "frequency",
                "criteria",
                "competence",
            ]
            .contains(&hypothesis)
            {
                return Err(anyhow!("Pilih hipotesis bantuan yang tersedia."));
            }
            event["hypothesis"] = json!(hypothesis);
        }
        "learning_help" => {
            if active_transfer(p) {
                return Err(anyhow!(
                    "Bantuan dibatasi selama tugas transfer; hanya instruksi dan rubrik tersedia."
                ));
            }
            let id = required(d, "decisionId")?;
            let decision = p
                .evidence
                .learning
                .iter()
                .find(|e| {
                    e["type"] == "learning_decision" && e["id"] == id && e["actorId"] == actor.id
                })
                .ok_or_else(|| {
                    anyhow!("Simpan judgement awal dan alasan sebelum meminta bantuan.")
                })?;
            if decision["dependency"] != evidence::dependency(p) {
                return Err(anyhow!(
                    "Bukti kajian berubah. Catat judgement baru dengan versi terkini."
                ));
            }
            let level = d["level"]
                .as_u64()
                .filter(|n| (1..=4).contains(n))
                .ok_or_else(|| anyhow!("Tingkat bantuan 1 sampai 4."))?;
            let used = p
                .evidence
                .learning
                .iter()
                .filter(|e| e["type"] == "learning_help" && e["decisionId"] == id)
                .filter_map(|e| e["usedLevel"].as_u64())
                .max()
                .unwrap_or(0);
            if level > used + 1 {
                return Err(anyhow!(
                    "Buka bantuan bertahap agar judgement dan respons Anda tetap tertelusur."
                ));
            }
            let h = decision["hypothesis"].as_str().unwrap_or("none");
            let guidance=match h{"novelty"=>"Sedikit hasil belum membuktikan kebaruan. Periksa sinonim, cakupan database dan review terdahulu.","metadata"=>"Metadata dan abstrak tidak setara teks lengkap. Tunjukkan dokumen, halaman atau bagian yang mendukung keputusan.","frequency"=>"Frekuensi penggunaan bukan bukti efektivitas. Pisahkan jumlah laporan, desain studi dan kesimpulan efek.","criteria"=>"Perubahan kriteria setelah melihat hasil perlu amendment dan peninjauan keputusan terdampak.","competence"=>"Mutu draft berbantuan tidak mengukur kemampuan mandiri. Gunakan tugas transfer terpisah.",_=>"Cocokkan keputusan dengan pertanyaan, kriteria dan sumber yang benar-benar tersedia."};
            let proposal=match level {1=>"Bukti apa yang dapat mengubah judgement awal Anda? Tunjukkan satu bagian yang paling relevan.".to_string(),2=>guidance.to_string(),3=>format!("Contoh parsial untuk latihan, bukan keputusan kajian: Saya memilih … karena kriteria … didukung oleh …; bagian yang belum diketahui adalah …. {guidance}"),_=>format!("Usulan lengkap untuk proses pemeriksaan: (1) Baca pertanyaan dan kriteria versi acuan. (2) Buka sumber dan catat locator. (3) Bedakan fakta dari hal yang belum tersedia. (4) Bandingkan judgement awal dengan bukti. (5) Simpan revisi beserta alasan. {guidance} Keputusan, interpretasi dan persetujuan klaim tetap milik Anda.")};
            event["decisionId"] = json!(id);
            event["requestedLevel"] = json!(level);
            event["usedLevel"] = json!(level);
            event["recommendation"] = json!(proposal);
            event["modelVersion"] = json!("deterministic-local-coach-1");
            event["capabilityScope"] = json!("read_context_propose_only");
        }
        "learning_response" => {
            let id = required(d, "decisionId")?;
            if !p.evidence.learning.iter().any(|e| {
                e["type"] == "learning_help" && e["decisionId"] == id && e["actorId"] == actor.id
            }) {
                return Err(anyhow!("Buka bantuan untuk keputusan ini terlebih dahulu."));
            }
            event["decisionId"] = json!(id);
            event["response"] = json!(required(d, "response")?);
            event["finalJudgement"] = json!(required(d, "finalJudgement")?);
            event["hypothesisCorrection"] = json!(d["hypothesisCorrection"]
                .as_str()
                .unwrap_or("")
                .chars()
                .take(6000)
                .collect::<String>());
        }
        "learning_consent" => {
            event["granted"] = json!(d["granted"] == true);
            event["researchUse"] = json!(d["researchUse"] == true && d["granted"] == true);
            event["purpose"] = json!(required(d, "purpose")?);
        }
        "transfer_start" => {
            if active_transfer(p) {
                return Err(anyhow!("Tugas transfer sebelumnya belum selesai."));
            }
            let id = required(d, "id")?;
            if p.evidence.learning.iter().any(|e| e["id"] == id) {
                return Err(anyhow!("ID tugas sudah digunakan."));
            }
            let topic = required(d, "topic")?;
            let source = required(d, "evidence")?;
            if topic == p.direction.choice.trim()
                || p.records
                    .iter()
                    .any(|r| r.abstract_text.as_deref() == Some(source))
            {
                return Err(anyhow!("Transfer menggunakan topik dan evidence baru; jangan gunakan sumber latihan yang sama."));
            }
            let study = d["study"] == true;
            if study
                && !p
                    .evidence
                    .learning
                    .iter()
                    .rev()
                    .find(|e| e["type"] == "learning_consent")
                    .is_some_and(|e| e["granted"] == true && e["researchUse"] == true)
            {
                return Err(anyhow!(
                    "Mode studi memerlukan persetujuan penggunaan data penelitian yang terpisah."
                ));
            }
            for key in ["id", "topic", "evidence", "scheduledAt", "model"] {
                event[key] = json!(required(d, key)?);
            }
            event["study"] = json!(study);
            event["rubricVersion"] = json!("vera-transfer-rubric-1");
            event["rubric"] = json!(RUBRIC);
            event["assistancePolicy"] = json!("instructions_and_rubric_only");
            event["instructions"]=json!("Gunakan evidence baru untuk mengusulkan pertanyaan, kriteria kelayakan dan satu kesimpulan yang proporsional. Jelaskan batas sumber serta keputusan yang belum dapat dibuat. Jangan meminta jawaban model. Jadwal/jeda dicatat sebagai rancangan pengguna, bukan klaim transfer tertunda yang terbukti.");
        }
        "transfer_submit" | "transfer_cancel" => {
            let id = required(d, "id")?;
            if !p
                .evidence
                .learning
                .iter()
                .any(|e| e["type"] == "transfer_start" && e["id"] == id)
                || p.evidence.learning.iter().any(|e| {
                    ["transfer_submit", "transfer_cancel"]
                        .contains(&e["type"].as_str().unwrap_or(""))
                        && e["id"] == id
                })
            {
                return Err(anyhow!("Tugas transfer tidak aktif."));
            }
            event["id"] = json!(id);
            event["reason"] = json!(required(d, "reason")?);
            if action == "transfer_submit" {
                event["answer"] = json!(required(d, "answer")?);
            }
        }
        "transfer_review" => {
            let id = required(d, "id")?;
            if !p
                .evidence
                .learning
                .iter()
                .any(|e| e["type"] == "transfer_submit" && e["id"] == id)
            {
                return Err(anyhow!("Jawaban transfer belum diserahkan."));
            }
            let ratings = d["ratings"]
                .as_array()
                .filter(|r| {
                    r.len() == 4
                        && r.iter().all(|v| {
                            ["needs_review", "developing", "supported"]
                                .contains(&v.as_str().unwrap_or(""))
                        })
                })
                .ok_or_else(|| anyhow!("Isi empat penilaian rubrik kualitatif."))?;
            event["id"] = json!(id);
            event["ratings"] = json!(ratings);
            event["note"] = json!(required(d, "note")?);
            event["assessmentKind"] = json!("human_review_not_certification");
        }
        _ => return Err(anyhow!("Aksi belajar tidak tersedia.")),
    }
    p.evidence.learning.push(event);
    Ok(())
}
pub fn trace(p: &Project) -> Result<Value> {
    if !p
        .evidence
        .learning
        .iter()
        .rev()
        .find(|e| e["type"] == "learning_consent")
        .is_some_and(|e| e["granted"] == true)
    {
        return Err(anyhow!(
            "Aktifkan persetujuan ekspor trace pada proyek ini terlebih dahulu."
        ));
    }
    Ok(super::audit::redact_value(
        json!({"projectId":p.id,"policyVersion":POLICY,"purpose":"Local learning trace; no source PDF or workspace attachments","events":p.evidence.learning,"warning":"Klik, durasi dan mutu draft bukan sertifikasi kemampuan. Penggunaan penelitian mengikuti persetujuan dan tata kelola studi; tidak menjadi data pelatihan otomatis."}),
    ))
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn judgement_precedes_help_and_transfer_cannot_use_open_help() {
        let mut p = Project::new("TEST FIXTURE".into(), "interest".into());
        let actor = Actor {
            id: "owner".into(),
            role: "owner".into(),
        };
        assert!(apply(
            &mut p,
            &actor,
            "learning_help",
            &json!({"decisionId":"missing","level":1})
        )
        .is_err());
        apply(&mut p,&actor,"learning_decision",&json!({"id":"d","activity":"selection","judgement":"include","reason":"Matches population","evidence":"abstract only","hypothesis":"metadata"})).unwrap();
        apply(
            &mut p,
            &actor,
            "learning_help",
            &json!({"decisionId":"d","level":1}),
        )
        .unwrap();
        apply(&mut p,&actor,"transfer_start",&json!({"id":"t","topic":"New topic","evidence":"New fictional abstract for transfer only","scheduledAt":"2026-10-14","model":"manual","study":false})).unwrap();
        assert!(apply(
            &mut p,
            &actor,
            "learning_help",
            &json!({"decisionId":"d","level":4})
        )
        .is_err());
        apply(&mut p,&actor,"transfer_submit",&json!({"id":"t","answer":"My independent response","reason":"Evidence based rationale"})).unwrap();
        assert!(trace(&p).is_err());
        apply(
            &mut p,
            &actor,
            "learning_consent",
            &json!({"granted":true,"purpose":"Local learning trace export"}),
        )
        .unwrap();
        assert!(trace(&p).is_ok());
        apply(
            &mut p,
            &actor,
            "learning_consent",
            &json!({"granted":false,"purpose":"withdrawn"}),
        )
        .unwrap();
        assert!(trace(&p).is_err());
    }
}
