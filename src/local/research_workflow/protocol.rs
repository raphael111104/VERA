use super::Protocol;

pub fn blockers(p: &Protocol) -> Vec<String> {
    let mut issues = vec![];
    for (label, value) in [
        ("alasan kajian", &p.rationale),
        ("tujuan", &p.objective),
        ("pertanyaan", &p.question),
        ("aturan inklusi", &p.inclusion),
        ("aturan eksklusi", &p.exclusion),
        ("sumber informasi", &p.sources),
        ("query", &p.query),
        ("prosedur seleksi", &p.screening),
        ("proses pencatatan", &p.charting),
        ("kolom pencatatan", &p.charting_fields),
        ("rencana rangkuman", &p.synthesis),
        ("keputusan appraisal", &p.appraisal),
        ("alasan appraisal", &p.appraisal_reason),
    ] {
        if value.trim().is_empty() {
            issues.push(format!("Lengkapi {label}."));
        }
    }
    if !["yes", "no"].contains(&p.appraisal.as_str()) {
        issues.push("Pilih keputusan penilaian mutu dan catat alasannya.".into());
    }
    if ![
        "openalex", "scopus", "crossref", "pubmed", "alphaxiv", "biorxiv",
    ]
    .contains(&p.provider.as_str())
    {
        issues.push("Pilih database untuk query acuan.".into());
    }
    if !["", "not_registered", "internal", "registered", "published"]
        .contains(&p.registration.as_str())
    {
        issues.push("Status registrasi tidak valid.".into());
    }
    if ["registered", "published"].contains(&p.registration.as_str())
        && !p.registration_url.starts_with("https://")
    {
        issues.push("Cantumkan tautan registrasi/publikasi yang nyata.".into());
    }
    if p.query_plans.len() > 10 {
        issues.push("Maksimal sepuluh strategi pencarian per versi rencana.".into());
    }
    for plan in &p.query_plans {
        if ![
            "openalex", "scopus", "crossref", "pubmed", "alphaxiv", "biorxiv",
        ]
        .contains(&plan.provider.as_str())
            || plan.query.trim().is_empty()
            || plan.query.len() > 2000
            || plan.original.trim().is_empty()
            || plan.limits_reason.trim().is_empty()
        {
            issues.push("Setiap strategi tambahan membutuhkan database, query asli, query yang dikirim dan alasan batas.".into());
        }
    }
    issues
}
pub fn alignment(p: &Protocol) -> Vec<String> {
    let mut warnings = vec![];
    let question = p.question.to_lowercase();
    let fields = p.charting_fields.to_lowercase();
    for term in [
        "konteks", "context", "hambatan", "barrier", "desain", "design",
    ] {
        if question.contains(term) && !fields.contains(term) {
            warnings.push(format!(
                "Pertanyaan menyebut {term}; periksa apakah kolom pencatatan mencakupnya."
            ));
        }
    }
    if p.query.split_whitespace().count() < 2 {
        warnings.push("Query sangat singkat; periksa sinonim dan cakupan tanpa menambahkan pembatas sembarangan.".into());
    }
    warnings
}

pub fn impact() -> Vec<&'static str> {
    vec![
        "Pencarian formal lama tetap disimpan dengan versi acuannya.",
        "Seleksi sumber perlu ditinjau dan dibekukan kembali.",
        "Draft awal memakai rencana terbaru; hasil pelaksanaan tidak dibuat otomatis.",
    ]
}
