//! APA 7 author-date references using explicit metadata, with no guessed names.
use super::{Project, Record};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::{BTreeMap, BTreeSet};
#[derive(Clone, Debug, Default, Serialize, Deserialize)]
#[serde(default, rename_all = "camelCase", deny_unknown_fields)]
pub struct Author {
    pub family: String,
    pub given: String,
    pub literal: String,
}
#[derive(Clone, Debug, Default, Serialize, Deserialize)]
#[serde(default, rename_all = "camelCase", deny_unknown_fields)]
pub struct Bibliography {
    pub authors: Vec<Author>,
    pub title: Option<String>,
    pub year: Option<String>,
    pub doi: Option<String>,
    pub url: Option<String>,
    pub container_title: String,
    pub volume: String,
    pub issue: String,
    pub pages: String,
    pub article_number: String,
    pub publisher: String,
    pub kind: String,
    pub reviewed: bool,
    pub note: String,
    pub provenance: String,
}
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Reference {
    pub record_id: String,
    pub citation: String,
    pub reference: String,
    pub issues: Vec<String>,
    pub metadata: Bibliography,
}
fn string(v: &Value, key: &str) -> String {
    v[key].as_str().unwrap_or("").to_string()
}
pub fn from_crossref(v: &Value) -> Bibliography {
    Bibliography {
        authors: v["author"]
            .as_array()
            .into_iter()
            .flatten()
            .map(|a| Author {
                family: string(a, "family"),
                given: string(a, "given"),
                literal: string(a, "name"),
            })
            .collect(),
        container_title: v["container-title"][0].as_str().unwrap_or("").into(),
        volume: string(v, "volume"),
        issue: string(v, "issue"),
        pages: string(v, "page"),
        article_number: string(v, "article-number"),
        publisher: string(v, "publisher"),
        kind: string(v, "type"),
        provenance: "Crossref original deposit".into(),
        ..Default::default()
    }
}
pub fn names(text: &str) -> Vec<Author> {
    text.split(';')
        .flat_map(|s| s.split(" and "))
        .filter(|s| !s.trim().is_empty())
        .map(|s| {
            if let Some((family, given)) = s.split_once(',') {
                Author {
                    family: family.trim().into(),
                    given: given.trim().into(),
                    literal: String::new(),
                }
            } else {
                Author {
                    literal: s.trim().trim_matches(['{', '}']).into(),
                    ..Default::default()
                }
            }
        })
        .collect()
}
pub fn resolve(p: &Project, r: &Record) -> Bibliography {
    if r.bibliography.reviewed
        || !r.bibliography.authors.is_empty()
        || !r.bibliography.provenance.is_empty()
    {
        return r.bibliography.clone();
    }
    if let Some(run) = p.runs.iter().find(|s| s.id == r.run_id) {
        for raw in &run.raw_pages {
            let response = &raw["response"];
            if let Some(e) = response["message"]["items"].as_array().and_then(|a| {
                a.iter().find(|e| {
                    e["DOI"]
                        .as_str()
                        .is_some_and(|d| super::import::doi(d) == r.doi)
                })
            }) {
                return from_crossref(e);
            }
        }
    }
    Bibliography {
        authors: r.authors.as_deref().map(names).unwrap_or_default(),
        provenance: if r.authors.as_ref().is_some_and(|a| a.contains(',')) {
            "Imported explicit family, given names".into()
        } else {
            "Legacy display names; check name structure".into()
        },
        ..Default::default()
    }
}
fn initials(s: &str) -> String {
    s.split_whitespace()
        .map(|word| {
            word.split('-')
                .filter_map(|s| s.chars().next())
                .map(|c| format!("{}.", c.to_uppercase()))
                .collect::<Vec<_>>()
                .join("-")
        })
        .collect::<Vec<_>>()
        .join(" ")
}
fn family(a: &Author) -> &str {
    if a.literal.is_empty() {
        &a.family
    } else {
        &a.literal
    }
}
fn author_reference(a: &Author) -> String {
    if !a.literal.is_empty() {
        a.literal.clone()
    } else if a.given.is_empty() {
        a.family.clone()
    } else {
        format!("{}, {}", a.family, initials(&a.given))
    }
}
fn join_authors(authors: &[Author]) -> String {
    let names: Vec<_> = authors.iter().map(author_reference).collect();
    if names.len() > 20 {
        return format!("{}, …, {}", names[..19].join(", "), names.last().unwrap());
    }
    match names.len() {
        0 => String::new(),
        1 => names[0].clone(),
        _ => format!(
            "{}, & {}",
            names[..names.len() - 1].join(", "),
            names.last().unwrap()
        ),
    }
}
fn year(r: &Record, b: &Bibliography) -> String {
    b.year
        .as_ref()
        .or(r.year.as_ref())
        .filter(|y| !y.trim().is_empty())
        .cloned()
        .unwrap_or_else(|| "n.d.".into())
}
fn title<'a>(r: &'a Record, b: &'a Bibliography) -> &'a str {
    b.title
        .as_deref()
        .filter(|s| !s.trim().is_empty())
        .unwrap_or(&r.title)
}
pub fn references(p: &Project, ids: &BTreeSet<String>) -> Vec<Reference> {
    let mut rows: Vec<_> = ids
        .iter()
        .filter_map(|id| {
            p.records
                .iter()
                .find(|r| &r.id == id)
                .map(|r| (r, resolve(p, r)))
        })
        .collect();
    rows.sort_by_key(|(r, b)| {
        (
            b.authors
                .first()
                .map(|a| family(a).to_lowercase())
                .unwrap_or_else(|| title(r, b).to_lowercase()),
            year(r, b),
            title(r, b).to_lowercase(),
        )
    });
    let identity = |r: &Record, b: &Bibliography| {
        format!(
            "{}:{}",
            b.authors
                .iter()
                .map(|a| format!("{}|{}|{}", a.family, a.given, a.literal))
                .collect::<Vec<_>>()
                .join(";"),
            year(r, b)
        )
    };
    let mut groups = BTreeMap::<String, usize>::new();
    for (r, b) in &rows {
        *groups.entry(identity(r, b)).or_default() += 1;
    }
    let mut seen = BTreeMap::<String, usize>::new();
    rows.into_iter().map(|(r,b)|{
        let key=identity(r,&b);let position=seen.entry(key.clone()).or_default();let suffix=if groups[&key]>1&&!b.authors.is_empty(){let n=*position;let mut digits=vec![];let mut n=n+1;while n>0{n-=1;digits.push((b'a'+(n%26) as u8) as char);n/=26;}digits.iter().rev().collect::<String>()}else{String::new()};*position+=1;
        let raw_year=year(r,&b);let y=if raw_year=="n.d."&&!suffix.is_empty(){format!("n.d.-{suffix}")}else{format!("{raw_year}{suffix}")};
        let name=match b.authors.len(){0=>format!("“{}”",title(r,&b).split_whitespace().take(6).collect::<Vec<_>>().join(" ")),1=>family(&b.authors[0]).into(),2=>format!("{} & {}",family(&b.authors[0]),family(&b.authors[1])),_=>format!("{} et al.",family(&b.authors[0]))};
        let t=title(r,&b).trim_end_matches('.');let mut issues=vec![];
        if b.authors.is_empty(){issues.push("Penulis tidak tersedia; judul digunakan sesuai aturan referensi tanpa penulis.".into());}
        if raw_year=="n.d."{issues.push("Tanggal tidak tersedia; n.d. digunakan tanpa menebak tahun.".into());}
        if !b.reviewed&&(b.provenance.starts_with("Legacy")||b.authors.iter().any(|a|!a.literal.is_empty())){issues.push("Struktur nama penulis belum diperiksa; nama tampilan dipertahankan.".into());}
        let mut reference=if b.authors.is_empty(){format!("{t}. ({y}).")}else{format!("{} ({y}). {t}.",join_authors(&b.authors).trim_end_matches('.').to_string()+".")};
        if !b.container_title.is_empty(){reference.push_str(&format!(" *{}{}*{}{}.",b.container_title,if b.volume.is_empty(){String::new()}else{format!(", {}",b.volume)},if b.issue.is_empty(){String::new()}else{format!("({})",b.issue)},if !b.pages.is_empty(){format!(", {}",b.pages.replace('-',"–"))}else if !b.article_number.is_empty(){format!(", Article {}",b.article_number)}else{String::new()}));}
        else if ["book","report","posted-content","preprint","webpage"].contains(&b.kind.as_str()){reference=reference.replace(&format!("{t}."),&format!("*{t}*."));if !b.publisher.is_empty(){reference.push_str(&format!(" {}.",b.publisher.trim_end_matches('.')));}}
        else{issues.push("Jenis sumber atau nama terbitan belum tersedia; lengkapi metadata untuk format APA 7.".into());}
        let doi=b.doi.as_ref().or(r.doi.as_ref()).and_then(|d|super::import::doi(d));let url=doi.map(|d|format!("https://doi.org/{d}")).or_else(||b.url.clone().or(r.url.clone())).filter(|u|u.starts_with("https://")||u.starts_with("http://"));
        if let Some(url)=url{reference.push(' ');reference.push_str(&url);}else{issues.push("DOI atau URL sumber belum tersedia.".into());}
        Reference{record_id:r.id.clone(),citation:format!("({name}, {y})"),reference,issues,metadata:b}
    }).collect()
}
pub fn update(p: &mut Project, data: &Value) -> crate::error::Result<()> {
    use crate::error::anyhow;
    let b: Bibliography = serde_json::from_value(data["bibliography"].clone())?;
    if b.authors.len() > 100
        || serde_json::to_vec(&b)?.len() > 20000
        || b.note.trim().is_empty()
        || b.authors
            .iter()
            .any(|a| a.family.trim().is_empty() && a.literal.trim().is_empty())
    {
        return Err(anyhow!(
            "Isi nama penulis eksplisit dan catatan pemeriksaan metadata; maksimal 100 penulis."
        ));
    }
    if let Some(d) = &b.doi {
        if !d.is_empty() && super::import::doi(d).is_none() {
            return Err(anyhow!("DOI tidak valid."));
        }
    }
    let r = p
        .records
        .iter_mut()
        .find(|r| Some(r.id.as_str()) == data["recordId"].as_str())
        .ok_or_else(|| anyhow!("Sumber tidak tersedia dalam proyek."))?;
    r.bibliography = Bibliography {
        provenance: "Human metadata correction; original record and provider response retained"
            .into(),
        ..b
    };
    Ok(())
}
#[cfg(test)]
mod tests {
    use super::super::{import::record, Project};
    use super::*;
    use serde_json::json;
    #[test]
    fn apa_author_date_and_same_year_suffixes_are_consistent() {
        let mut p = Project::new("TEST FIXTURE".into(), "topic".into());
        for (raw, title) in [("1", "Alpha study"), ("2", "Beta study")] {
            let mut r = record(
                "test",
                raw,
                title,
                "10.9999/test",
                "2025",
                "Smith, Jane; Doe, John",
                "",
            );
            r.bibliography=serde_json::from_value(json!({"authors":[{"family":"Smith","given":"Jane"},{"family":"Doe","given":"John"}],"containerTitle":"Test Journal","volume":"12","issue":"2","pages":"10-20","kind":"journal-article","reviewed":true})).unwrap();
            p.records.push(r);
        }
        let ids = p.records.iter().map(|r| r.id.clone()).collect();
        let refs = references(&p, &ids);
        assert_eq!(refs[0].citation, "(Smith & Doe, 2025a)");
        assert_eq!(refs[1].citation, "(Smith & Doe, 2025b)");
        assert!(refs[0].reference.contains("Smith, J., & Doe, J. (2025a)."));
        assert!(refs[0].reference.contains("*Test Journal, 12*(2), 10–20."));
        assert!(refs[0].reference.ends_with("https://doi.org/10.9999/test"));
    }
    #[test]
    fn missing_metadata_and_legacy_names_are_not_invented() {
        let mut p = Project::new("TEST FIXTURE".into(), "topic".into());
        p.records.push(record(
            "test",
            "1",
            "A source with no author",
            "",
            "",
            "",
            "",
        ));
        let refs = references(&p, &[p.records[0].id.clone()].into_iter().collect());
        assert!(refs[0].citation.contains("n.d."));
        assert!(!refs[0].reference.contains("Anonymous"));
        assert!(!refs[0].issues.is_empty());
    }
}
