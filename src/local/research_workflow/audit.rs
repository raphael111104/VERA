//! Reporting coverage is explicit human evidence, never inferred from heading presence.
use super::{evidence, selection, Project};
use crate::error::{anyhow, Result};
use serde_json::{json, Value};
use std::{
    collections::{BTreeMap, BTreeSet},
    io::{Cursor, Write},
};

pub const ITEMS: [&str; 22] = [
    "Judul scoping review",
    "Ringkasan terstruktur",
    "Rasional",
    "Tujuan dan pertanyaan",
    "Protokol dan registrasi",
    "Kriteria kelayakan",
    "Sumber informasi dan tanggal",
    "Strategi pencarian",
    "Proses pemilihan sumber",
    "Proses charting",
    "Item data",
    "Metode penilaian mutu",
    "Metode sintesis",
    "Hasil seleksi sumber",
    "Karakteristik sumber",
    "Hasil penilaian mutu",
    "Hasil individual sumber",
    "Sintesis hasil",
    "Ringkasan evidence",
    "Keterbatasan",
    "Kesimpulan",
    "Pendanaan dan peran pemberi dana",
];
pub const SECTIONS: [(&str, &str); 9] = [
    ("title", "Judul"),
    ("abstract", "Abstrak"),
    ("introduction", "Pendahuluan"),
    ("methods", "Metode"),
    ("results", "Hasil"),
    ("discussion", "Pembahasan"),
    ("conclusion", "Kesimpulan"),
    ("references", "Referensi"),
    ("appendix", "Lampiran"),
];
pub fn enabled() -> bool {
    std::env::var("VERA_WORKFLOW_FINAL_STAGES").as_deref() != Ok("0")
}
pub fn attest(p: &mut Project, d: &Value) -> Result<()> {
    let assignment = d["assignment"] == true;
    let requirement = d["requirement"].as_str().unwrap_or("").trim();
    if assignment
        && (!p.protocol.assignment_format || requirement.is_empty() || requirement.len() > 200)
    {
        return Err(anyhow!(
            "Aktifkan format tugas dan beri nama persyaratan maksimal 200 karakter."
        ));
    }
    let item = if assignment {
        0
    } else {
        d["item"]
            .as_u64()
            .filter(|n| (1..=22).contains(n))
            .ok_or_else(|| anyhow!("Item checklist tidak valid."))?
    };
    let key = d["sectionKey"].as_str().unwrap_or("");
    let quote = d["quote"].as_str().unwrap_or("").trim();
    let note = d["note"].as_str().unwrap_or("").trim();
    let section = p
        .evidence
        .sections
        .iter()
        .find(|s| s.key == key)
        .ok_or_else(|| anyhow!("Simpan bagian draft terlebih dahulu."))?;
    if quote.is_empty()
        || quote.len() > 6000
        || !section.text.contains(quote)
        || note.is_empty()
        || note.len() > 6000
    {
        return Err(anyhow!(
            "Pilih kutipan yang ada dalam bagian draft dan catat pemeriksaan Anda."
        ));
    }
    p.evidence.reporting.push(json!({"item":item,"assignment":assignment,"requirement":requirement,"instructionsComplete":d["instructionsComplete"]==true,"instructionsHash":super::hash(&p.direction.instructions),"sectionKey":key,"quote":quote,"note":note,"sectionRevision":section.revision,"dependency":evidence::dependency(p),"at":crate::store::now_ms()}));
    Ok(())
}
pub fn report(p: &Project, actors: &[String]) -> Value {
    let dependency = evidence::dependency(p);
    let checklist:Vec<_>=ITEMS.iter().enumerate().map(|(i,label)|{
        let item=i+1;
        let saved=p.evidence.reporting.iter().rev().find(|v|v["item"]==item);
        let section=saved.and_then(|v|p.evidence.sections.iter().find(|s|Some(s.key.as_str())==v["sectionKey"].as_str()));
        let current=saved.zip(section).is_some_and(|(v,s)|v["sectionRevision"]==s.revision&&v["dependency"]==dependency&&v["quote"].as_str().is_some_and(|q|s.text.contains(q)));
        let na=[12,16].contains(&item)&&p.protocol.appraisal=="no"&&!p.protocol.appraisal_reason.trim().is_empty();
        json!({"item":item,"label":label,"status":if na{"not_applicable_with_reason"}else if current{"reported"}else if saved.is_some(){"needs_review"}else{"missing"},"sectionKey":saved.map(|v|&v["sectionKey"]),"quote":saved.map(|v|&v["quote"]),"note":if na{json!(p.protocol.appraisal_reason)}else{saved.map(|v|v["note"].clone()).unwrap_or(Value::Null)},"page":null,"pageMapping":"needs_review"})
    }).collect();
    let ledger = selection::ledger(p, actors);
    let summary = evidence::summary(p, actors);
    let mut issues: Vec<Value> = vec![];
    let mut issue = |code: &str, message: &str| issues.push(json!({"code":code,"message":message}));
    if !p.protocol_locked {
        issue("protocol", "Rencana kajian belum dikunci sebagai acuan.");
    }
    if p.selection_stale {
        issue(
            "selection_stale",
            "Set seleksi perlu ditinjau dan dibekukan ulang.",
        );
    }
    if actors.len() != 2 {
        issue(
            "practice",
            "Mode latihan belum memenuhi prosedur dua manusia yang berbeda.",
        );
    }
    if !p.runs.iter().any(|r| r.purpose == "formal") {
        issue("no_formal_search", "Pencarian formal belum dilakukan.");
    }
    if p.runs.iter().any(|r| {
        r.purpose == "formal"
            && (r.status != "complete"
                || r.query.is_none()
                || r.searched_at.is_none()
                || r.protocol_revision != p.protocol_revision)
    }) {
        issue(
            "search_limits",
            "Ada pencarian formal parsial atau provenance/versi acuan belum lengkap.",
        );
    }
    if ledger["pending"].as_u64().unwrap_or(0) > 0
        || ledger["conflicts"].as_u64().unwrap_or(0) > 0
        || ledger["sought"].as_u64().unwrap_or(0)
            != ledger["assessed"].as_u64().unwrap_or(0)
                + ledger["notRetrieved"].as_u64().unwrap_or(0)
    {
        issue(
            "screening",
            "Seleksi atau retrieval masih tertunda/konflik.",
        );
    }
    if summary["confirmedRows"].as_array().map(Vec::len)
        != summary["included"].as_array().map(Vec::len)
    {
        issue(
            "charting",
            "Sebagian laporan included belum memiliki charting terkonfirmasi.",
        );
    }
    if summary["synthesisStale"] == true {
        issue(
            "synthesis",
            "Sintesis belum tersedia atau dependensinya berubah.",
        );
    }
    if p.evidence.claims.iter().any(|c| {
        c.review_status != "superseded"
            && (c.review_status != "verified" || c.dependency != dependency)
    }) {
        issue(
            "claims",
            "Ada klaim yang belum diperiksa atau buktinya berubah.",
        );
    }
    if !p
        .evidence
        .sections
        .iter()
        .any(|s| s.key == "results" && !s.text.trim().is_empty())
        || !p.evidence.claims.iter().any(|c| {
            c.section_key == "results"
                && c.review_status == "verified"
                && c.dependency == dependency
        })
    {
        issue(
            "result_support",
            "Periksa cakupan dukungan klaim pada bagian hasil, termasuk laporan hasil kosong.",
        );
    }
    for (key, _) in &SECTIONS[..8] {
        if !p
            .evidence
            .sections
            .iter()
            .any(|s| s.key == *key && !s.text.trim().is_empty() && s.status == "verified")
        {
            issue(
                &format!("section_{key}"),
                &format!("Bagian {key} belum ditulis atau belum ditinjau."),
            );
        }
    }
    if checklist.iter().any(|v| {
        !["reported", "not_applicable_with_reason"].contains(&v["status"].as_str().unwrap_or(""))
    }) {
        issue(
            "reporting",
            "Cakupan checklist belum lengkap atau memerlukan pemeriksaan ulang.",
        );
    }
    let cited = cited(p);
    if cited
        .iter()
        .any(|id| !p.records.iter().any(|r| &r.id == id))
    {
        issue(
            "citation_mismatch",
            "Ada penanda sitasi tanpa record sumber yang cocok.",
        );
    }
    if super::bibliography::references(p, &cited)
        .iter()
        .any(|r| !r.issues.is_empty())
    {
        issue(
            "reference_metadata",
            "Metadata referensi belum lengkap; format APA 7 perlu diperiksa.",
        );
    }
    if p.protocol.appraisal == "yes"
        && evidence::included(p, actors).iter().any(|id| {
            !p.evidence.appraisals.iter().any(|a| {
                a["recordId"] == *id
                    && a["protocolRevision"] == p.protocol_revision
                    && a["selectionRevision"] == p.selection_revision
            })
        })
    {
        issue("appraisal", "Penilaian mutu yang direncanakan belum tersedia untuk seluruh sumber included pada versi aktif.");
    }
    let assignment = if p.protocol.assignment_format {
        let mut mapped = BTreeMap::new();
        for v in p
            .evidence
            .reporting
            .iter()
            .filter(|v| v["assignment"] == true)
        {
            mapped.insert(v["requirement"].as_str().unwrap_or(""), v);
        }
        let items:Vec<_>=mapped.values().map(|v|{let current=v["dependency"]==dependency&&v["instructionsHash"]==super::hash(&p.direction.instructions)&&p.evidence.sections.iter().any(|s|v["sectionKey"]==s.key&&v["sectionRevision"]==s.revision&&v["quote"].as_str().is_some_and(|q|s.text.contains(q)));json!({"requirement":v["requirement"],"sectionKey":v["sectionKey"],"quote":v["quote"],"note":v["note"],"status":if current{"reported"}else{"needs_review"}})}).collect();
        let scope = p
            .evidence
            .reporting
            .iter()
            .rev()
            .find(|v| v["assignment"] == true)
            .is_some_and(|v| v["instructionsComplete"] == true);
        json!({"instructions":p.direction.instructions,"status":if scope&&!items.is_empty()&&items.iter().all(|v|v["status"]=="reported"){"reported"}else{"needs_review"},"items":items,"note":"Cakupan instruksi tugas dikonfirmasi pengguna secara terpisah; bukan status kelengkapan artikel penuh."})
    } else {
        Value::Null
    };
    if p.protocol.assignment_format && assignment["status"] != "reported" {
        issue(
            "assignment_coverage",
            "Persyaratan tugas pilihan belum dipetakan atau cakupannya belum dikonfirmasi.",
        );
    }
    if p.protocol.assignment_format && p.direction.instructions.trim().is_empty() {
        issue(
            "assignment_instructions",
            "Instruksi tugas pilihan belum tersedia.",
        );
    }
    json!({"schemaVersion":1,"projectRevision":p.revision,"coverage":{"reported":checklist.iter().filter(|v|v["status"]=="reported").count(),"notApplicable":checklist.iter().filter(|v|v["status"]=="not_applicable_with_reason").count(),"total":22,"assignment":assignment},"checklist":checklist,"unresolvedIssues":issues,"dependencyVersions":{"protocol":p.protocol_revision,"selection":p.selection_revision,"schema":p.evidence.schemas.last().map(|s|s.version).unwrap_or(0),"evidenceHash":dependency},"reviewState":if issues.is_empty(){"ready_for_review"}else{"incomplete_draft"},"ledger":ledger,"pagination":{"status":"needs_review","reason":"Nomor halaman hanya tersedia jika renderer lokal berhasil memetakan bookmark dokumen."},"citationRecordIds":cited})
}
fn cited(p: &Project) -> BTreeSet<String> {
    let mut ids: BTreeSet<String> = p
        .evidence
        .claims
        .iter()
        .filter(|c| c.review_status != "superseded")
        .flat_map(|c| c.record_ids.clone())
        .collect();
    for s in &p.evidence.sections {
        for tail in s.text.split("[@").skip(1) {
            if let Some((id, _)) = tail.split_once(']') {
                ids.insert(id.into());
            }
        }
    }
    ids
}
pub fn locators(p: &Project, actors: &[String]) -> Value {
    let audit = report(p, actors);
    let references = super::bibliography::references(p, &cited(p));
    json!(audit["checklist"].as_array().into_iter().flatten().filter(|i|i["status"]=="reported").map(|i|{let mut quote=i["quote"].as_str().unwrap_or("").to_string();for r in &references{quote=quote.replace(&format!("[@{}]",r.record_id),&r.citation);}json!({"id":format!("item_{}",i["item"]),"sectionBookmark":format!("vera_{}",i["sectionKey"].as_str().unwrap_or("")),"quote":quote})}).collect::<Vec<_>>())
}
pub fn csv_value(s: &str) -> String {
    let safe = if s.trim_start().starts_with(['=', '+', '-', '@', '\t', '\r']) {
        format!("'{s}")
    } else {
        s.into()
    };
    format!("\"{}\"", safe.replace('"', "\"\""))
}
fn csv(headers: &[&str], rows: Vec<Vec<String>>) -> Vec<u8> {
    let mut s = headers.join(",");
    for row in rows {
        s.push('\n');
        s.push_str(
            &row.iter()
                .map(|v| csv_value(v))
                .collect::<Vec<_>>()
                .join(","),
        );
    }
    s.into_bytes()
}
fn xml(s: &str) -> String {
    s.chars()
        .filter(|c| !c.is_control() || ['\n', '\t', '\r'].contains(c))
        .collect::<String>()
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
}
fn para(
    text: &str,
    style: &str,
    anchor: Option<&str>,
    id: usize,
    links: &mut Vec<String>,
) -> String {
    let mut runs = String::new();
    let mut bold = false;
    let mut italic = false;
    for word in text.split_inclusive(' ') {
        let url = word.trim();
        if url.starts_with("https://") || url.starts_with("http://") {
            links.push(url.to_string());
            runs.push_str(&format!("<w:hyperlink r:id=\"link{}\"><w:r><w:t xml:space=\"preserve\">{}</w:t></w:r></w:hyperlink>",links.len(),xml(word)));
        } else if style == "Code" {
            runs.push_str(&format!("<w:r><w:rPr><w:rFonts w:ascii=\"Consolas\" w:hAnsi=\"Consolas\"/></w:rPr><w:t xml:space=\"preserve\">{}</w:t></w:r>",xml(word)));
        } else {
            let mut rest = word;
            while !rest.is_empty() {
                if let Some(t) = rest.strip_prefix("**") {
                    bold = !bold;
                    rest = t;
                    continue;
                }
                if let Some(t) = rest.strip_prefix('*') {
                    italic = !italic;
                    rest = t;
                    continue;
                }
                let end = rest.find('*').unwrap_or(rest.len());
                let part = &rest[..end];
                runs.push_str(&format!(
                    "<w:r><w:rPr>{}{}</w:rPr><w:t xml:space=\"preserve\">{}</w:t></w:r>",
                    if bold { "<w:b/>" } else { "" },
                    if italic { "<w:i/>" } else { "" },
                    xml(part)
                ));
                rest = &rest[end..];
            }
        }
    }
    format!(
        "<w:p><w:pPr><w:pStyle w:val=\"{style}\"/></w:pPr>{}{runs}{}</w:p>",
        anchor
            .map(|a| format!("<w:bookmarkStart w:id=\"{id}\" w:name=\"vera_{a}\"/>"))
            .unwrap_or_default(),
        anchor
            .map(|_| format!("<w:bookmarkEnd w:id=\"{id}\"/>"))
            .unwrap_or_default()
    )
}
pub fn docx(markdown: &str) -> Result<Vec<u8>> {
    let mut body = String::new();
    let mut index = 0;
    let mut links = vec![];
    let mut table: Vec<Vec<String>> = vec![];
    let mut code = false;
    fn flush_table(body: &mut String, rows: &mut Vec<Vec<String>>, links: &mut Vec<String>) {
        if rows.is_empty() {
            return;
        }
        let cols = rows.iter().map(Vec::len).max().unwrap_or(1);
        let width = 9360 / cols;
        body.push_str("<w:tbl><w:tblPr><w:tblW w:w=\"9360\" w:type=\"dxa\"/><w:tblBorders>");
        for edge in ["top", "left", "bottom", "right", "insideH", "insideV"] {
            body.push_str(&format!(
                "<w:{edge} w:val=\"single\" w:sz=\"4\" w:color=\"D9D9D9\"/>"
            ));
        }
        body.push_str("</w:tblBorders><w:tblCellMar><w:top w:w=\"100\" w:type=\"dxa\"/><w:left w:w=\"100\" w:type=\"dxa\"/><w:bottom w:w=\"100\" w:type=\"dxa\"/><w:right w:w=\"100\" w:type=\"dxa\"/></w:tblCellMar></w:tblPr><w:tblGrid>");
        for _ in 0..cols {
            body.push_str(&format!("<w:gridCol w:w=\"{width}\"/>"));
        }
        body.push_str("</w:tblGrid>");
        for (i, row) in rows.iter().enumerate() {
            body.push_str(if i == 0 {
                "<w:tr><w:trPr><w:tblHeader/></w:trPr>"
            } else {
                "<w:tr>"
            });
            for c in 0..cols {
                body.push_str(&format!("<w:tc><w:tcPr><w:tcW w:w=\"{width}\" w:type=\"dxa\"/><w:vAlign w:val=\"center\"/>{}</w:tcPr>{}</w:tc>",if i==0{"<w:shd w:fill=\"EEEEEE\"/>"}else{""},para(row.get(c).map(String::as_str).unwrap_or(""),"Normal",None,0,links)));
            }
            body.push_str("</w:tr>");
        }
        body.push_str("</w:tbl>");
        rows.clear();
    }
    for line in markdown.lines() {
        if line.trim().starts_with("```") {
            flush_table(&mut body, &mut table, &mut links);
            code = !code;
            continue;
        }
        if line.trim().is_empty() {
            continue;
        }
        index += 1;
        let trimmed = line.trim();
        if code {
            body.push_str(&para(line, "Code", None, index, &mut links));
            continue;
        }
        if trimmed.starts_with('|') && trimmed.ends_with('|') {
            let row: Vec<String> = trimmed
                .trim_matches('|')
                .split('|')
                .map(|v| v.trim().to_string())
                .collect();
            if !row
                .iter()
                .all(|c| c.chars().all(|v| ['-', ':', ' '].contains(&v)))
            {
                table.push(row);
            }
            continue;
        }
        flush_table(&mut body, &mut table, &mut links);
        let (text, style) = if let Some(t) = line.strip_prefix("# ") {
            (t, "Title")
        } else if let Some(t) = line.strip_prefix("## ") {
            (t, "Heading1")
        } else {
            (line, "Normal")
        };
        let anchor = SECTIONS
            .iter()
            .find(|(_, label)| *label == text)
            .map(|(key, _)| *key);
        body.push_str(&para(text, style, anchor, index, &mut links));
    }
    flush_table(&mut body, &mut table, &mut links);
    let document=format!("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><w:document xmlns:w=\"http://schemas.openxmlformats.org/wordprocessingml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\"><w:body>{body}<w:sectPr><w:pgSz w:w=\"12240\" w:h=\"15840\"/><w:pgMar w:top=\"1440\" w:right=\"1440\" w:bottom=\"1440\" w:left=\"1440\"/></w:sectPr></w:body></w:document>");
    let relationships=format!("<?xml version=\"1.0\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles\" Target=\"styles.xml\"/>{}</Relationships>",links.iter().enumerate().map(|(i,url)|format!("<Relationship Id=\"link{}\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink\" Target=\"{}\" TargetMode=\"External\"/>",i+1,xml(url))).collect::<String>());
    let styles = r#"<?xml version="1.0" encoding="UTF-8"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/><w:color w:val="000000"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:after="240"/></w:pPr><w:rPr><w:sz w:val="36"/><w:b/><w:color w:val="000000"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="120"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:sz w:val="28"/><w:b/><w:color w:val="000000"/></w:rPr></w:style></w:styles>"#;
    archive(&BTreeMap::from([
        ("[Content_Types].xml".into(),br#"<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>"#.to_vec()),
        ("_rels/.rels".into(),br#"<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>"#.to_vec()),
        ("word/_rels/document.xml.rels".into(),relationships.into_bytes()),
        ("word/document.xml".into(),document.into_bytes()),("word/styles.xml".into(),styles.as_bytes().to_vec())]))
}
pub fn archive(files: &BTreeMap<String, Vec<u8>>) -> Result<Vec<u8>> {
    let mut zip = zip::ZipWriter::new(Cursor::new(vec![]));
    for (name, bytes) in files {
        zip.start_file(
            name,
            zip::write::SimpleFileOptions::default()
                .compression_method(zip::CompressionMethod::Deflated),
        )?;
        zip.write_all(bytes)?;
    }
    Ok(zip.finish()?.into_inner())
}
fn digest(bytes: &[u8]) -> String {
    use sha2::{Digest, Sha256};
    format!("{:x}", Sha256::digest(bytes))
}
pub type Files = BTreeMap<String, Vec<u8>>;
pub fn output_name(p: &Project, milestone: &str) -> String {
    if milestone == "article" {
        "article.docx".into()
    } else {
        let stem = p.evidence.output["filename"]
            .as_str()
            .map(str::trim)
            .filter(|s| !s.is_empty())
            .map(|s| s.trim_end_matches(".docx"))
            .unwrap_or(if milestone == "plan" {
                "rencana-kajian"
            } else {
                "coursework-companion"
            });
        format!("{stem}.docx")
    }
}
pub fn build_output(
    p: &Project,
    actors: &[String],
    id: &str,
    milestone: &str,
    rendering: Option<(Vec<u8>, Value)>,
) -> Result<(Files, Value)> {
    if milestone == "article" {
        return build(p, actors, id, rendering);
    }
    let safe = sanitized(p)?;
    let p = &safe;
    let document = super::outputs::document(p, milestone)?;
    let (mut files, mut manifest) = build(p, actors, id, None)?;
    for name in [
        "article.docx",
        "article.md",
        "checklist.csv",
        "coursework-companion.docx",
        "coursework-companion.md",
        "coursework-checklist.json",
    ] {
        files.remove(name);
    }
    let name = output_name(p, milestone);
    let stem = name.trim_end_matches(".docx");
    let bytes = docx(&document.markdown)?;
    let mut checklist = document.checklist;
    let mut pagination = json!({"status":"needs_review","reason":"Renderer lokal belum memetakan kutipan dokumen ini."});
    if let Some((pdf, pages)) = rendering {
        if pdf.starts_with(b"%PDF-") {
            pagination = json!({"status":"rendered","renderer":"Microsoft Word local","docxSha256":digest(&bytes),"pdfSha256":digest(&pdf),"anchors":pages});
            for item in &mut checklist {
                let mapping = &pages[format!("item_{}", item["item"])];
                if mapping["status"] == "rendered_quote" {
                    item["page"] = mapping["startPage"].clone();
                    item["pageEnd"] = mapping["endPage"].clone();
                    item["pageMapping"] = json!("rendered_quote");
                }
            }
            files.insert(format!("{stem}.pdf"), pdf);
        }
    }
    files.insert(name.clone(), bytes);
    files.insert(format!("{stem}.md"), document.markdown.into_bytes());
    if milestone == "coursework" {
        files.insert(
            "coursework-checklist.json".into(),
            serde_json::to_vec_pretty(&checklist)?,
        );
        files.insert(
            "checklist.csv".into(),
            csv(
                &[
                    "item",
                    "label",
                    "status",
                    "executionStatus",
                    "page",
                    "pageEnd",
                    "pageMapping",
                ],
                checklist
                    .iter()
                    .map(|v| {
                        [
                            "item",
                            "label",
                            "status",
                            "executionStatus",
                            "page",
                            "pageEnd",
                            "pageMapping",
                        ]
                        .iter()
                        .map(|k| {
                            v[*k].as_str().map(str::to_string).unwrap_or_else(|| {
                                if v[*k].is_null() {
                                    String::new()
                                } else {
                                    v[*k].to_string()
                                }
                            })
                        })
                        .collect()
                    })
                    .collect(),
            ),
        );
    }
    let versions = manifest["dependencyVersions"].clone();
    let coverage = json!({"reported":checklist.iter().filter(|i|i["status"]=="reported").count(),"notApplicable":0,"total":checklist.len(),"assignment":if milestone=="coursework"{json!({"instructions":p.direction.instructions,"status":document.review_state,"note":"Cakupan dokumen rencana pilihan item 1 dan 3 sampai 13; kegiatan masih direncanakan."})}else{Value::Null}});
    let audit = json!({"schemaVersion":2,"milestone":document.milestone,"projectRevision":p.revision,"reviewState":document.review_state,"coverage":coverage,"checklist":checklist,"unresolvedIssues":document.issues,"dependencyVersions":versions,"pagination":pagination,"executionStatus":"planned"});
    files.insert("audit.json".into(), serde_json::to_vec_pretty(&audit)?);
    for key in ["reviewState", "coverage", "unresolvedIssues", "pagination"] {
        manifest[key] = audit[key].clone();
    }
    manifest["milestone"] = json!(milestone);
    amend_package(&mut files, &mut manifest, &json!([]))?;
    Ok((files, manifest))
}
pub fn amend_package(files: &mut Files, manifest: &mut Value, amendments: &Value) -> Result<()> {
    let mut safe = amendments.clone();
    sanitize_value(&mut safe, &secrets());
    files.insert("amendments.json".into(), serde_json::to_vec_pretty(&safe)?);
    manifest["amendmentHistory"] =
        json!("All saved protocol edits and locks through the exported project revision");
    manifest["files"] = json!(files
        .iter()
        .filter(|(name, _)| name.as_str() != "manifest.json")
        .map(|(name, bytes)| json!({"name":name,"bytes":bytes.len(),"sha256":digest(bytes)}))
        .collect::<Vec<_>>());
    files.insert("manifest.json".into(), serde_json::to_vec_pretty(manifest)?);
    Ok(())
}
fn secrets() -> Vec<String> {
    [
        "SCOPUS_API_KEY",
        "OPENALEX_API_KEY",
        "NCBI_API_KEY",
        "SEMANTIC_SCHOLAR_API_KEY",
        "OPENAI_API_KEY",
        "ANTHROPIC_API_KEY",
        "GOOGLE_API_KEY",
        "GEMINI_API_KEY",
    ]
    .iter()
    .filter_map(|key| {
        std::env::var(key)
            .ok()
            .or_else(|| crate::config::synced_env_var(key))
            .filter(|s| s.len() >= 8)
    })
    .collect()
}
fn redact(s: &str, secrets: &[String]) -> String {
    let mut output = s.to_string();
    for value in secrets {
        output = output.replace(value, "[REDACTED]");
    }
    for prefix in [
        "sk-",
        "Bearer ",
        "api_key=",
        "apiKey=",
        "access_token=",
        "token=",
    ] {
        let mut start = 0;
        while let Some(i) = output[start..].find(prefix) {
            let at = start + i;
            let from = at + prefix.len();
            let end = output[from..]
                .find(|c: char| c.is_whitespace() || ['&', '"', '\'', '<', '>'].contains(&c))
                .map(|n| from + n)
                .unwrap_or(output.len());
            if end > from {
                output.replace_range(at..end, "[REDACTED]");
                start = at + 10;
            } else {
                start = from;
            }
            if start >= output.len() {
                break;
            }
        }
    }
    output
}
fn sanitize_value(v: &mut Value, secrets: &[String]) {
    match v {
        Value::String(s) => *s = redact(s, secrets),
        Value::Array(a) => a.iter_mut().for_each(|v| sanitize_value(v, secrets)),
        Value::Object(o) => o.values_mut().for_each(|v| sanitize_value(v, secrets)),
        _ => {}
    }
}
pub fn redact_value(mut value: Value) -> Value {
    sanitize_value(&mut value, &secrets());
    value
}
fn sanitized(p: &Project) -> Result<Project> {
    let mut value = serde_json::to_value(p)?;
    // Non-exported content is dropped before scanning or serializing the package.
    for key in ["files", "learning", "exports", "jobs"] {
        value["evidence"][key] = json!([]);
    }
    sanitize_value(&mut value, &secrets());
    Ok(serde_json::from_value(value)?)
}
/// A failed or absent renderer leaves null pages, never estimated pagination.
pub async fn render(bytes: Vec<u8>, locators: Value) -> Option<(Vec<u8>, Value)> {
    #[cfg(windows)]
    {
        tokio::task::spawn_blocking(move || {
            use std::{
                os::windows::process::CommandExt,
                process::{Command, Stdio},
                time::{Duration, Instant},
            };
            let dir = std::env::temp_dir().join(format!("vera-render-{}", uuid::Uuid::new_v4()));
            std::fs::create_dir_all(&dir).ok()?;
            let work = || -> Option<(Vec<u8>, Value)> {
                let doc = dir.join("article.docx");
                let script = dir.join("render.ps1");
                std::fs::write(&doc, bytes).ok()?;
                std::fs::write(
                    dir.join("article.locators.json"),
                    serde_json::to_vec(&locators).ok()?,
                )
                .ok()?;
                std::fs::write(&script, include_str!("render_workflow_docx.ps1")).ok()?;
                let mut child = Command::new("powershell.exe")
                    .args([
                        "-NoLogo",
                        "-NoProfile",
                        "-NonInteractive",
                        "-ExecutionPolicy",
                        "Bypass",
                        "-File",
                    ])
                    .arg(script)
                    .arg("-InputPath")
                    .arg(&doc)
                    .creation_flags(0x08000000)
                    .stdin(Stdio::null())
                    .stdout(Stdio::null())
                    .stderr(Stdio::null())
                    .spawn()
                    .ok()?;
                let deadline = Instant::now() + Duration::from_secs(40);
                loop {
                    match child.try_wait().ok()? {
                        Some(status) => {
                            if !status.success() {
                                return None;
                            }
                            break;
                        }
                        None => {
                            if Instant::now() > deadline {
                                let _ = child.kill();
                                let _ = child.wait();
                                return None;
                            }
                            std::thread::sleep(Duration::from_millis(100));
                        }
                    }
                }
                Some((
                    std::fs::read(dir.join("article.pdf")).ok()?,
                    serde_json::from_slice(&std::fs::read(dir.join("article.pages.json")).ok()?)
                        .ok()?,
                ))
            };
            let result = work();
            let _ = std::fs::remove_dir_all(&dir);
            result
        })
        .await
        .ok()
        .flatten()
    }
    #[cfg(not(windows))]
    {
        let _ = (bytes, locators);
        None
    }
}
pub fn build(
    p: &Project,
    actors: &[String],
    export_id: &str,
    render: Option<(Vec<u8>, Value)>,
) -> Result<(Files, Value)> {
    let safe = sanitized(p)?;
    let p = &safe;
    let mut audit = report(p, actors);
    let mut md=format!("# {}\n\nStatus {}\n\nVersi proyek {}. Pemeriksaan manusia bukan jaminan kebenaran absolut.\n\n",p.direction.title.trim().replace(['\n','\r']," "),audit["reviewState"].as_str().unwrap_or("incomplete_draft"),p.revision);
    if p.direction.title.trim().is_empty() {
        md = md.replacen(
            "# \n",
            &format!("# {}\n", p.name.replace(['\n', '\r'], " ")),
            1,
        );
    }
    for (key, label) in SECTIONS {
        let mut text = p
            .evidence
            .sections
            .iter()
            .find(|s| s.key == key)
            .map(|s| s.text.clone())
            .filter(|s| !s.trim().is_empty())
            .unwrap_or("[Belum ditulis]".into());
        for claim in p.evidence.claims.iter().filter(|c| {
            c.section_key == key && c.review_status != "superseded" && !c.record_ids.is_empty()
        }) {
            if !claim.text.contains("[@") {
                let citations = claim
                    .record_ids
                    .iter()
                    .map(|id| format!("[@{id}]"))
                    .collect::<Vec<_>>()
                    .join(" ");
                text = text.replacen(&claim.text, &format!("{} {citations}", claim.text), 1);
            }
        }
        md.push_str(&format!("## {label}\n\n{}\n\n", text));
    }
    let references = super::bibliography::references(p, &cited(p));
    md.push_str("## Daftar pustaka APA 7\n\n");
    md.push_str(
        &references
            .iter()
            .map(|r| r.reference.clone())
            .collect::<Vec<_>>()
            .join("\n\n"),
    );
    for r in &references {
        md = md.replace(&format!("[@{}]", r.record_id), &r.citation);
    }
    md.push_str("\n\n## Masalah yang belum terselesaikan\n\n");
    for issue in audit["unresolvedIssues"].as_array().into_iter().flatten() {
        md.push_str(&format!("- {}\n", issue["message"].as_str().unwrap_or("")));
    }
    let mut files = Files::new();
    files.insert("article.docx".into(), docx(&md)?);
    files.insert("article.md".into(), md.into_bytes());
    files.insert(
        "citation-map.json".into(),
        serde_json::to_vec_pretty(&references)?,
    );
    if let Some((pdf, pages)) = render {
        if pdf.starts_with(b"%PDF-") {
            audit["pagination"] = json!({"status":"rendered","renderer":"Microsoft Word local","pdfSha256":digest(&pdf),"docxSha256":digest(&files["article.docx"]),"anchors":pages});
            for item in audit["checklist"].as_array_mut().into_iter().flatten() {
                let mapping = &pages[format!("item_{}", item["item"])];
                let valid = mapping["status"] == "rendered_quote";
                item["pageMapping"] = json!(if valid {
                    "rendered_quote"
                } else {
                    "needs_review"
                });
                item["page"] = if valid {
                    mapping["startPage"].clone()
                } else {
                    Value::Null
                };
                item["pageEnd"] = if valid {
                    mapping["endPage"].clone()
                } else {
                    Value::Null
                };
            }
            files.insert("article.pdf".into(), pdf);
        }
    }
    files.insert(
        "checklist.csv".into(),
        csv(
            &[
                "item", "label", "status", "section", "page", "pageEnd", "mapping", "note",
            ],
            audit["checklist"]
                .as_array()
                .unwrap()
                .iter()
                .map(|i| {
                    [
                        "item",
                        "label",
                        "status",
                        "sectionKey",
                        "page",
                        "pageEnd",
                        "pageMapping",
                        "note",
                    ]
                    .iter()
                    .map(|k| {
                        i[*k].as_str().map(str::to_string).unwrap_or_else(|| {
                            if i[*k].is_null() {
                                String::new()
                            } else {
                                i[*k].to_string()
                            }
                        })
                    })
                    .collect()
                })
                .collect(),
        ),
    );
    let ledger = selection::ledger(p, actors);
    files.insert(
        "selection-flow.json".into(),
        serde_json::to_vec_pretty(&ledger)?,
    );
    let counts = [
        ("identified", "Record teridentifikasi"),
        ("duplicates", "Duplikat"),
        ("screened", "Record diperiksa"),
        ("excluded", "Eksklusi judul dan abstrak"),
        ("sought", "Laporan dicari"),
        ("notRetrieved", "Teks tidak diperoleh"),
        ("assessed", "Laporan dinilai"),
        ("fullExcluded", "Eksklusi teks lengkap"),
        ("includedReports", "Laporan included"),
    ];
    let mut svg=String::from("<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"640\" height=\"700\" viewBox=\"0 0 640 700\"><rect width=\"640\" height=\"700\" fill=\"white\"/><g font-family=\"Arial\" font-size=\"17\" fill=\"#111\">");
    for (i, (key, label)) in counts.iter().enumerate() {
        svg.push_str(&format!("<rect x=\"40\" y=\"{}\" width=\"560\" height=\"48\" rx=\"8\" fill=\"#fafafa\" stroke=\"#ccc\"/><text x=\"58\" y=\"{}\">{}: {}</text>",30+i*68,60+i*68,label,ledger[*key]));
    }
    svg.push_str("<text x=\"40\" y=\"670\" font-size=\"13\">Unit laporan; jumlah studi belum dipetakan. Pending dan konflik ada di ledger.</text></g></svg>");
    files.insert("selection-flow.svg".into(), svg.into_bytes());
    let search:Vec<_>=p.runs.iter().map(|r|json!({"id":r.id,"purpose":r.purpose,"provider":r.provider,"query":r.query,"searchedAt":r.searched_at,"importedAt":r.imported_at,"reportedTotal":r.reported_total,"retrievedCount":r.retrieved_count,"status":r.status,"protocolRevision":r.protocol_revision})).collect();
    files.insert(
        "search-log.json".into(),
        serde_json::to_vec_pretty(&search)?,
    );
    files.insert(
        "search-log.csv".into(),
        csv(
            &[
                "run",
                "purpose",
                "provider",
                "query",
                "searchedAt",
                "importedAt",
                "reportedTotal",
                "retrievedCount",
                "status",
                "protocolRevision",
            ],
            p.runs
                .iter()
                .map(|r| {
                    vec![
                        r.id.clone(),
                        r.purpose.clone(),
                        r.provider.clone(),
                        r.query.clone().unwrap_or_default(),
                        r.searched_at.clone().unwrap_or_default(),
                        r.imported_at.map(|n| n.to_string()).unwrap_or_default(),
                        r.reported_total.map(|n| n.to_string()).unwrap_or_default(),
                        r.retrieved_count.to_string(),
                        r.status.clone(),
                        r.protocol_revision.to_string(),
                    ]
                })
                .collect(),
        ),
    );
    files.insert("screening.json".into(),serde_json::to_vec_pretty(&json!({"decisions":p.decisions,"resolutions":p.resolutions,"retrievals":p.retrievals,"merges":p.merges}))?);
    files.insert(
        "screening.csv".into(),
        csv(
            &[
                "recordId",
                "title",
                "stage",
                "reviewer",
                "decision",
                "reason",
                "selectionRevision",
                "protocolRevision",
            ],
            p.decisions
                .iter()
                .map(|d| {
                    vec![
                        d.record_id.clone(),
                        p.records
                            .iter()
                            .find(|r| r.id == d.record_id)
                            .map(|r| r.title.clone())
                            .unwrap_or_default(),
                        d.stage.clone(),
                        d.actor_id.clone(),
                        d.verdict.clone(),
                        d.reason.clone(),
                        d.selection_revision.to_string(),
                        d.protocol_revision.to_string(),
                    ]
                })
                .collect(),
        ),
    );
    let included = evidence::included(p, actors);
    let cells: Vec<_> = p
        .evidence
        .cells
        .iter()
        .filter(|c| {
            included.contains(&c.record_id)
                && c.verification_status == "confirmed"
                && evidence::fresh(p, c)
                && evidence::latest(p, &c.record_id, &c.column_id).is_some_and(|v| v.id == c.id)
        })
        .collect();
    files.insert("charting.json".into(),serde_json::to_vec_pretty(&json!({"includedRecordIds":included,"confirmedCells":cells,"excludedUnconfirmed":true}))?);
    files.insert(
        "charting.csv".into(),
        csv(
            &[
                "recordId",
                "columnId",
                "value",
                "missingState",
                "page",
                "section",
                "documentHash",
                "schemaVersion",
                "selectionRevision",
                "protocolRevision",
            ],
            cells
                .iter()
                .map(|c| {
                    vec![
                        c.record_id.clone(),
                        c.column_id.clone(),
                        c.value.clone(),
                        c.state.clone(),
                        c.locator.page.map(|n| n.to_string()).unwrap_or_default(),
                        c.locator.section.clone(),
                        c.locator.document_hash.clone(),
                        c.schema_version.to_string(),
                        c.selection_revision.to_string(),
                        c.protocol_revision.to_string(),
                    ]
                })
                .collect(),
        ),
    );
    files.insert(
        "codebook.json".into(),
        serde_json::to_vec_pretty(&p.evidence.schemas)?,
    );
    files.insert(
        "synthesis.json".into(),
        serde_json::to_vec_pretty(&p.evidence.syntheses)?,
    );
    files.insert(
        "appraisal.json".into(),
        serde_json::to_vec_pretty(&p.evidence.appraisals)?,
    );
    files.insert(
        "claim-links.json".into(),
        serde_json::to_vec_pretty(&p.evidence.claims)?,
    );
    files.insert("amendments.json".into(),serde_json::to_vec_pretty(&json!({"protocolRevision":p.protocol_revision,"reason":p.protocol.amendment_reason,"note":"Riwayat versi protokol lengkap tersedia pada riwayat proyek lokal."}))?);
    if p.protocol.assignment_format {
        let mut task=format!("# Dokumen pendamping tugas\n\nStatus draft perlu diperiksa sesuai instruksi.\n\n## Instruksi pengguna\n\n{}\n\n## Rencana kajian\n\n{}\n\nPertanyaan {}\n\nKriteria inklusi {}\n\nKriteria eksklusi {}\n\nStrategi pencarian {}\n\nCharting {}\n\nSintesis {}\n\n## Pemeriksaan format\n\nCakupan persyaratan menurut pemeriksaan pengguna {}. Ini terpisah dari kelengkapan artikel dan verifikasi halaman akhir.\n",p.direction.instructions,p.protocol.rationale,p.protocol.question,p.protocol.inclusion,p.protocol.exclusion,p.protocol.query,p.protocol.charting,p.protocol.synthesis,audit["coverage"]["assignment"]["status"]);
        for item in audit["coverage"]["assignment"]["items"]
            .as_array()
            .into_iter()
            .flatten()
        {
            task.push_str(&format!(
                "\n\n## {}\n\nStatus {}\n\n{}\n\nCatatan {}\n",
                item["requirement"].as_str().unwrap_or(""),
                item["status"].as_str().unwrap_or("needs_review"),
                item["quote"].as_str().unwrap_or(""),
                item["note"].as_str().unwrap_or("")
            ));
        }
        files.insert(
            "coursework-checklist.json".into(),
            serde_json::to_vec_pretty(&audit["coverage"]["assignment"])?,
        );
        files.insert("coursework-companion.docx".into(), docx(&task)?);
        files.insert("coursework-companion.md".into(), task.into_bytes());
    }
    files.insert("audit.json".into(), serde_json::to_vec_pretty(&audit)?);
    let manifest = json!({"schemaVersion":1,"exportId":export_id,"projectId":p.id,"projectRevision":p.revision,"reviewState":audit["reviewState"],"coverage":audit["coverage"],"unresolvedIssues":audit["unresolvedIssues"],"dependencyVersions":audit["dependencyVersions"],"pagination":audit["pagination"],"files":files.iter().map(|(name,bytes)|json!({"name":name,"bytes":bytes.len(),"sha256":digest(bytes)})).collect::<Vec<_>>(),"excluded":["source PDF blobs","raw provider responses","workspace attachments","credentials and capability tokens","learning traces"],"citationStyle":"APA 7 draft; missing metadata needs review","amendmentHistory":"Companion contains current amendment; immutable protocol revisions remain in local project history"});
    files.insert(
        "manifest.json".into(),
        serde_json::to_vec_pretty(&manifest)?,
    );
    Ok((files, manifest))
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn blank_draft_and_conditional_appraisal_remain_honest() {
        let mut p = Project::new("TEST FIXTURE".into(), "interest".into());
        p.protocol.appraisal = "no".into();
        p.protocol.appraisal_reason = "Mapping only".into();
        let a = report(&p, &["owner".into()]);
        assert_eq!(a["checklist"].as_array().unwrap().len(), 22);
        assert_eq!(a["checklist"][11]["status"], "not_applicable_with_reason");
        assert_eq!(a["reviewState"], "incomplete_draft");
        assert_eq!(a["ledger"]["includedReports"], 0);
        assert!(a["checklist"][0]["page"].is_null());
        assert!(build(&p, &["owner".into()], "fixture", None).is_ok());
    }
    #[test]
    fn marking_reported_requires_quote_and_revision_and_registration_can_be_honest() {
        let mut p = Project::new("TEST FIXTURE".into(), "interest".into());
        p.protocol.registration = "not_registered".into();
        p.evidence.sections.push(super::super::evidence::Section {
            key: "methods".into(),
            text: "Kajian belum diregistrasi.".into(),
            status: "draft".into(),
            revision: 2,
        });
        assert!(attest(&mut p, &json!({"item":5,"sectionKey":"methods","quote":"Kajian belum diregistrasi.","note":"Status aktual telah dilaporkan"})).is_ok());
        assert_eq!(
            report(&p, &["owner".into()])["checklist"][4]["status"],
            "reported"
        );
        p.evidence.sections[0].revision += 1;
        assert_eq!(
            report(&p, &["owner".into()])["checklist"][4]["status"],
            "needs_review"
        );
        assert!(attest(
            &mut p,
            &json!({"item":6,"sectionKey":"methods","quote":"made up","note":"ok"})
        )
        .is_err());
    }
    #[test]
    fn package_excludes_source_blobs_learning_tokens_and_csv_formulas() {
        let mut p = Project::new("TEST FIXTURE".into(), "interest".into());
        p.evidence
            .files
            .push(super::super::evidence::WorkspaceFile {
                id: "x".into(),
                name: "secret.txt".into(),
                text: "sk-this-must-never-be-exported".into(),
                checksum: "x".into(),
                at: 1,
            });
        p.evidence
            .learning
            .push(json!({"private":"private-learning-trace"}));
        let (files, _) = build(&p, &["owner".into()], "fixture", None).unwrap();
        assert!(!format!("{files:?}").contains("sk-this-must-never-be-exported"));
        assert!(!format!("{files:?}").contains("private-learning-trace"));
        assert_eq!(csv_value("=HYPERLINK(1)"), "\"'=HYPERLINK(1)\"");
    }
    #[test]
    fn coursework_is_separate_and_inline_credentials_are_redacted() {
        let mut p = Project::new("TEST FIXTURE".into(), "assignment".into());
        p.protocol.assignment_format = true;
        p.direction.instructions = "TEST lecturer requests methods only".into();
        p.protocol.query = "TEST api_key=FAKESECRET query".into();
        let (files, manifest) = build(&p, &["owner".into()], "test", None).unwrap();
        assert!(files.contains_key("coursework-companion.docx"));
        assert_eq!(manifest["coverage"]["total"], 22);
        assert_eq!(manifest["coverage"]["assignment"]["status"], "needs_review");
        assert!(!format!("{files:?}").contains("FAKESECRET"));
        p.evidence.sections.push(evidence::Section {
            key: "methods".into(),
            text: "TEST stated methods".into(),
            status: "draft".into(),
            revision: 2,
        });
        attest(&mut p,&json!({"assignment":true,"requirement":"Methods only","instructionsComplete":true,"sectionKey":"methods","quote":"TEST stated methods","note":"TEST instruction mapped"})).unwrap();
        assert_eq!(
            report(&p, &["owner".into()])["coverage"]["assignment"]["status"],
            "reported"
        );
        assert_eq!(
            report(&p, &["owner".into()])["reviewState"],
            "incomplete_draft"
        );
    }
}
