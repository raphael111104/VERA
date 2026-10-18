//! Small bounded bibliographic importer. Original input is retained separately.
use super::{hash, Record};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Clone, Debug, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Mapping {
    pub title: String,
    pub doi: String,
    pub year: String,
    pub authors: String,
    pub abstract_field: String,
}

#[derive(Clone, Debug, Serialize)]
pub struct Preview {
    pub records: Vec<Record>,
    pub errors: Vec<String>,
    pub headers: Vec<String>,
}

pub fn doi(value: &str) -> Option<String> {
    let clean = value.trim().to_lowercase();
    let clean = clean
        .trim_start_matches("https://doi.org/")
        .trim_start_matches("http://doi.org/")
        .trim_start_matches("doi:")
        .trim();
    (clean.starts_with("10.") && clean.contains('/') && !clean.chars().any(char::is_whitespace))
        .then(|| clean.into())
}

pub fn record(
    run: &str,
    raw: &str,
    title: &str,
    doi_value: &str,
    year: &str,
    authors: &str,
    abstract_text: &str,
) -> Record {
    let doi = doi(doi_value);
    Record {
        id: hash(&format!("{run}:{raw}")),
        run_id: run.into(),
        raw_id: raw.into(),
        title: title.trim().into(),
        url: doi.as_ref().map(|s| format!("https://doi.org/{s}")),
        doi,
        year: (!year.trim().is_empty()).then(|| year.trim().into()),
        authors: (!authors.trim().is_empty()).then(|| authors.trim().into()),
        abstract_text: (!abstract_text.trim().is_empty()).then(|| abstract_text.trim().into()),
        bibliography: super::bibliography::Bibliography::default(),
    }
}

fn csv(text: &str) -> (Vec<Vec<String>>, Vec<String>) {
    let mut rows = vec![];
    let mut row = vec![];
    let mut cell = String::new();
    let mut quoted = false;
    let mut chars = text.trim_start_matches('\u{feff}').chars().peekable();
    while let Some(c) = chars.next() {
        match c {
            '"' if quoted && chars.peek() == Some(&'"') => {
                cell.push('"');
                chars.next();
            }
            '"' => quoted = !quoted,
            ',' if !quoted => row.push(std::mem::take(&mut cell)),
            '\n' if !quoted => {
                row.push(std::mem::take(&mut cell));
                if row.iter().any(|s| !s.trim().is_empty()) {
                    rows.push(std::mem::take(&mut row));
                } else {
                    row.clear();
                }
            }
            '\r' if !quoted => {}
            _ => cell.push(c),
        }
    }
    if !quoted && (!cell.is_empty() || !row.is_empty()) {
        row.push(cell);
        rows.push(row);
    }
    (
        rows,
        if quoted {
            vec!["CSV memiliki kutip yang tidak ditutup; periksa berkas sebelum commit.".into()]
        } else {
            vec![]
        },
    )
}

pub fn parse(format: &str, text: &str, run: &str, mapping: &Mapping) -> Preview {
    let mut result = Preview {
        records: vec![],
        errors: vec![],
        headers: vec![],
    };
    let mut entries: Vec<HashMap<String, String>> = vec![];
    match format {
        "csv" => {
            let (mut rows, errors) = csv(text);
            result.errors = errors;
            if rows.is_empty() {
                result.errors.push("Berkas kosong.".into());
                return result;
            }
            result.headers = rows
                .remove(0)
                .iter()
                .map(|s| s.trim().to_lowercase())
                .collect();
            for (i, row) in rows.into_iter().enumerate() {
                if row.len() != result.headers.len() {
                    result
                        .errors
                        .push(format!("Baris {}: jumlah kolom tidak sesuai.", i + 2));
                    continue;
                }
                entries.push(result.headers.iter().cloned().zip(row).collect());
            }
        }
        "ris" => {
            let mut current: HashMap<String, String> = HashMap::new();
            let mut last = String::new();
            for line in text.lines() {
                if line.starts_with("ER  -") {
                    entries.push(std::mem::take(&mut current));
                    last.clear();
                    continue;
                }
                if line.len() >= 6 && line.is_ascii() && &line[2..6] == "  - " {
                    last = line[..2].to_lowercase();
                    let value = line[6..].trim();
                    current
                        .entry(last.clone())
                        .and_modify(|s| {
                            s.push_str("; ");
                            s.push_str(value);
                        })
                        .or_insert(value.into());
                } else if let Some((tag, value)) = line.split_once("  - ") {
                    last = tag.trim().to_lowercase();
                    current
                        .entry(last.clone())
                        .and_modify(|s| {
                            s.push_str("; ");
                            s.push_str(value.trim());
                        })
                        .or_insert(value.trim().into());
                } else if !last.is_empty() {
                    current.entry(last.clone()).and_modify(|s| {
                        s.push(' ');
                        s.push_str(line.trim());
                    });
                }
            }
            if !current.is_empty() {
                result
                    .errors
                    .push("RIS terakhir tidak memiliki penutup ER; record belum diimpor.".into());
            }
        }
        "bibtex" => {
            for block in text.split('@').skip(1) {
                let Some(start) = block.find('{') else {
                    result.errors.push("Entri BibTeX tanpa pembuka.".into());
                    continue;
                };
                let body = &block[start + 1..];
                let Some(comma) = body.find(',') else {
                    continue;
                };
                let mut fields = HashMap::new();
                let mut rest = body[comma + 1..].trim();
                while let Some(eq) = rest.find('=') {
                    let key = rest[..eq]
                        .trim()
                        .trim_start_matches(',')
                        .trim()
                        .to_lowercase();
                    let value = rest[eq + 1..].trim_start();
                    if value.starts_with('{') {
                        let mut depth = 0;
                        let mut end = None;
                        for (i, c) in value.char_indices() {
                            if c == '{' {
                                depth += 1;
                            }
                            if c == '}' {
                                depth -= 1;
                                if depth == 0 {
                                    end = Some(i);
                                    break;
                                }
                            }
                        }
                        let Some(end) = end else {
                            result
                                .errors
                                .push("BibTeX memiliki kurung tidak seimbang.".into());
                            break;
                        };
                        fields.insert(key, value[1..end].into());
                        rest = value[end + 1..].trim_start_matches(',').trim();
                    } else if let Some(tail) = value.strip_prefix('"') {
                        let Some(end) = tail.find('"') else {
                            result
                                .errors
                                .push("BibTeX memiliki kutip tidak seimbang.".into());
                            break;
                        };
                        fields.insert(key, tail[..end].into());
                        rest = tail[end + 1..].trim_start_matches(',').trim();
                    } else {
                        let end = value.find([',', '}']).unwrap_or(value.len());
                        fields.insert(key, value[..end].trim().into());
                        rest = value[end..].trim_start_matches(',').trim();
                    }
                    if rest.starts_with('}') {
                        break;
                    }
                }
                entries.push(fields);
            }
        }
        _ => result.errors.push("Pilih CSV, RIS atau BibTeX.".into()),
    }
    for (i, entry) in entries.iter().enumerate() {
        let get = |custom: &str, keys: &[&str]| -> String {
            if !custom.is_empty() {
                return entry
                    .get(&custom.to_lowercase())
                    .cloned()
                    .unwrap_or_default();
            }
            keys.iter()
                .find_map(|k| entry.get(*k))
                .cloned()
                .unwrap_or_default()
        };
        let title = get(&mapping.title, &["title", "document title", "ti", "t1"]);
        if title.trim().is_empty() {
            result
                .errors
                .push(format!("Entri {}: judul tidak tersedia.", i + 1));
            continue;
        }
        result.records.push(record(
            run,
            &format!("row:{}", i + 1),
            &title,
            &get(&mapping.doi, &["doi", "do"]),
            &get(&mapping.year, &["year", "py", "publication year"]),
            &get(&mapping.authors, &["authors", "author", "au", "a1"]),
            &get(&mapping.abstract_field, &["abstract", "ab", "n2"]),
        ));
        if let Some(r) = result.records.last_mut() {
            let container = get("", &["journal", "jf", "jo", "t2", "source title"]);
            let pages = get("", &["pages", "page", "sp"]);
            let end = get("", &["ep"]);
            r.bibliography = super::bibliography::Bibliography {
                authors: super::bibliography::names(&get(
                    &mapping.authors,
                    &["authors", "author", "au", "a1"],
                )),
                container_title: container.clone(),
                volume: get("", &["volume", "vl"]),
                issue: get("", &["issue", "is", "number"]),
                pages: if !end.is_empty() && !pages.contains('-') {
                    format!("{pages}-{end}")
                } else {
                    pages
                },
                publisher: get("", &["publisher", "pb"]),
                kind: if !container.is_empty() {
                    "journal-article".into()
                } else {
                    String::new()
                },
                provenance: format!("Original {format} import row {}", i + 1),
                ..Default::default()
            };
        }
    }
    result
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn parses_csv_ris_bibtex_and_reports_bad_rows() {
        let p = parse(
            "csv",
            "Title,DOI,Year\n\"Quoted, title\",https://doi.org/10.1/ABC,2025\nbad,row",
            "run",
            &Mapping::default(),
        );
        assert_eq!(p.records.len(), 1);
        assert_eq!(p.errors.len(), 1);
        assert_eq!(p.records[0].doi.as_deref(), Some("10.1/abc"));
        assert_eq!(
            parse(
                "ris",
                "TY  - JOUR\nTI  - Riset\nPY  - 2025\nER  -\n",
                "r",
                &Mapping::default()
            )
            .records
            .len(),
            1
        );
        assert_eq!(
            parse(
                "bibtex",
                "@article{x, title={Nested {title}}, year={2025}}",
                "r",
                &Mapping::default()
            )
            .records
            .len(),
            1
        );
    }
}
