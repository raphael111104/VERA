use super::Direction;

pub fn blockers(d: &Direction) -> Vec<String> {
    let mut issues = vec![];
    for (label, value) in [
        (
            "Minat atau bidang",
            if d.field.trim().is_empty() {
                &d.interest
            } else {
                &d.field
            },
        ),
        ("Hal yang dipetakan", &d.concept),
        ("Konteks", &d.context),
        ("Tujuan", &d.objective),
        ("Fokus pilihan", &d.choice),
        ("Alasan pilihan", &d.reason),
        ("Pertanyaan kajian", &d.question),
    ] {
        if value.trim().is_empty() {
            issues.push(format!("Lengkapi {label}."));
        }
    }
    if d.candidates.len() > 3 {
        issues.push("Bandingkan paling banyak tiga kandidat.".into());
    }
    if d.review_fit != "mapping" {
        issues.push(
            "Tinjau kesesuaian tujuan: pilih pemetaan bukti atau konsultasikan jenis review lain."
                .into(),
        );
    }
    issues
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn direction_accepts_non_population_and_rejects_causal_fit() {
        let mut d = Direction {
            interest: "Pendidikan".into(),
            concept: "Praktik".into(),
            context: "Kampus".into(),
            objective: "Memetakan".into(),
            choice: "Evaluasi".into(),
            reason: "Pengalaman".into(),
            question: "Apa praktiknya?".into(),
            review_fit: "mapping".into(),
            ..Default::default()
        };
        assert!(blockers(&d).is_empty());
        d.review_fit = "effectiveness".into();
        assert!(!blockers(&d).is_empty());
    }
}
