//! Provider pages, never a claim of exhaustive retrieval. Verified 2026-10-14.
use super::{hash, import::record, Record, SearchRun};
use crate::error::{anyhow, Result};
use serde_json::{json, Value};
use std::time::Duration;

pub struct Page {
    pub records: Vec<Record>,
    pub total: Option<usize>,
    pub checkpoint: Option<String>,
    pub raw: Value,
}

pub fn apply_page(
    run: &mut SearchRun,
    records: &mut Vec<Record>,
    page: Result<Page>,
) -> Result<()> {
    match page {
        Ok(page) => {
            let old_cursor = run.checkpoint.clone();
            let received = page.records.len();
            for record in page.records {
                if !records.iter().any(|old| old.id == record.id) {
                    records.push(record);
                }
            }
            run.retrieved_count = records.iter().filter(|r| r.run_id == run.id).count();
            run.reported_total = page.total;
            run.checkpoint = page.checkpoint;
            run.status = if run.reported_total.is_some_and(|n| run.retrieved_count >= n)
                || (run.reported_total.is_none() && run.checkpoint.is_none() && received < 25)
            {
                "complete"
            } else {
                "partial"
            }
            .into();
            run.raw_pages.push(json!({"checksum":hash(&serde_json::to_string(&page.raw)?),"response":page.raw,"at":crate::store::now_ms()}));
            if run.status == "partial"
                && (received == 0 || run.checkpoint.is_none() || old_cursor == run.checkpoint)
            {
                run.warnings.push("Pagination belum membuktikan seluruh hasil diterima. Periksa checkpoint dan cakupan.".into());
            }
        }
        Err(error) => {
            run.status = if run.retrieved_count > 0 {
                "partial"
            } else {
                "failed"
            }
            .into();
            run.warnings.push(error.to_string());
        }
    }
    run.updated_at = crate::store::now_ms();
    Ok(())
}

pub fn capabilities() -> Value {
    json!([
        {"id":"crossref","label":"Crossref","configured":true,"detail":"Metadata deposit penerbit; cursor 25 record. Abstrak tidak selalu tersedia."},
        {"id":"pubmed","label":"PubMed","configured":true,"detail":"E-utilities NLM, 25 record per halaman; batas 10.000 ID per query. Metadata/abstrak, bukan fulltext."},
        {"id":"alphaxiv","label":"alphaXiv / arXiv","configured":true,"detail":"Konektor discovery alphaXiv lama; snapshot terbatas, total dan pagination tidak tersedia. Bukan pencarian menyeluruh arXiv."},
        {"id":"biorxiv","label":"bioRxiv via OpenAlex","configured":true,"detail":"OpenAlex dengan filter sumber bioRxiv yang tercatat. Metadata preprint, belum tentu peer-reviewed."},
        {"id":"openalex","label":"OpenAlex","configured":credential("OPENALEX_API_KEY").is_some(),"detail":"Metadata/abstrak bila tersedia; halaman 25 record. Akses mengikuti kebijakan provider."},
        {"id":"scopus","label":"Scopus","configured":credential("SCOPUS_API_KEY").is_some(),"detail":"STANDARD metadata, halaman 25 record. API key dan entitlement diperlukan; fulltext tidak dijamin."}
    ])
}

fn credential(name: &str) -> Option<String> {
    std::env::var(name)
        .ok()
        .filter(|s| !s.trim().is_empty())
        .or_else(|| crate::config::synced_env_var(name))
}

pub async fn page(
    provider: &str,
    query: &str,
    cursor: Option<&str>,
    run: &str,
    legacy_crossref_order: bool,
) -> Result<Page> {
    if provider == "alphaxiv" {
        if cursor.is_some() {
            return Err(anyhow!("Konektor alphaXiv tidak menyediakan pagination. Gunakan ekspor asli untuk cakupan tambahan."));
        }
        let hits = tokio::time::timeout(
            Duration::from_secs(40),
            crate::client::discover_papers_by_keyword(
                query,
                crate::client::PaperDiscoveryOptions {
                    published_after: None,
                    published_before: None,
                    prioritize: "default",
                },
            ),
        )
        .await
        .map_err(|_| anyhow!("alphaXiv timeout; coba kembali."))??;
        let raw = serde_json::to_value(&hits)?;
        let records = hits
            .iter()
            .take(25)
            .map(|h| {
                let mut r = record(
                    run,
                    &h.paper_id,
                    &h.title,
                    "",
                    h.publication_date.as_deref().unwrap_or(""),
                    "",
                    &h.abstract_,
                );
                r.url = Some(format!("https://arxiv.org/abs/{}", h.paper_id));
                r
            })
            .collect();
        return Ok(Page {
            records,
            total: None,
            checkpoint: None,
            raw,
        });
    }
    if provider == "pubmed" {
        return pubmed_page(query, cursor, run).await;
    }
    let client = crate::net::remote_client()
        .timeout(Duration::from_secs(35))
        .build()?;
    let request = match provider {
        "openalex" | "biorxiv" => {
            let mut req = client.get("https://api.openalex.org/works").query(&[
                ("search", query),
                ("per_page", "25"),
                ("cursor", cursor.unwrap_or("*")),
            ]);
            if let Some(key) = credential("OPENALEX_API_KEY") {
                req = req.bearer_auth(key);
            }
            if provider == "biorxiv" {
                req = req.query(&[(
                    "filter",
                    format!(
                        "primary_location.source.id:{}",
                        crate::client::BIORXIV_SOURCE_ID
                    ),
                )]);
            }
            req
        }
        "crossref" => {
            let request = client
                .get("https://api.crossref.org/works")
                .query(&[
                    ("query", query),
                    ("rows", "25"),
                    ("cursor", cursor.unwrap_or("*")),
                ])
                .header("User-Agent", concat!("VERA/", env!("CARGO_PKG_VERSION")));
            if legacy_crossref_order {
                request
            } else {
                request.query(&[("sort", "score"), ("order", "desc")])
            }
        }
        "scopus" => {
            let key=credential("SCOPUS_API_KEY").ok_or_else(||anyhow!("Scopus belum dikonfigurasi. Tambahkan SCOPUS_API_KEY di pengaturan environment atau gunakan impor ekspor database."))?;
            let mut req = client
                .get("https://api.elsevier.com/content/search/scopus")
                .header("X-ELS-APIKey", key)
                .header("Accept", "application/json")
                .query(&[
                    ("query", query),
                    ("count", "25"),
                    ("view", "STANDARD"),
                    ("cursor", cursor.unwrap_or("*")),
                ]);
            if let Some(token) = credential("SCOPUS_INST_TOKEN") {
                req = req.header("X-ELS-Insttoken", token);
            }
            req
        }
        _ => return Err(anyhow!("Provider belum didukung.")),
    };
    let mut response = request
        .try_clone()
        .ok_or_else(|| anyhow!("Request tidak dapat diulang."))?
        .send()
        .await
        .map_err(|_| {
            anyhow!(
                "Provider tidak dapat dihubungi. Query dan checkpoint tetap tersimpan; coba lagi."
            )
        })?;
    for attempt in 0..2u64 {
        if response.status() != reqwest::StatusCode::TOO_MANY_REQUESTS {
            break;
        }
        let delay = response
            .headers()
            .get("Retry-After")
            .and_then(|s| s.to_str().ok())
            .and_then(|s| s.parse::<u64>().ok())
            .unwrap_or(1 << attempt);
        if delay > 5 {
            return Err(anyhow!("Provider membatasi request. Coba lagi setelah {delay} detik; checkpoint dipertahankan."));
        }
        tokio::time::sleep(Duration::from_secs(delay)).await;
        response = request
            .try_clone()
            .ok_or_else(|| anyhow!("Request tidak dapat diulang."))?
            .send()
            .await
            .map_err(|_| anyhow!("Provider belum dapat dihubungi; checkpoint dipertahankan."))?;
    }
    let status = response.status();
    if !status.is_success() {
        return Err(anyhow!("Provider mengembalikan HTTP {}. Periksa credential/entitlement atau batas request; tidak ada hasil pengganti.",status.as_u16()));
    }
    let raw: Value = response
        .json()
        .await
        .map_err(|_| anyhow!("Respons provider tidak valid."))?;
    // Provider links/meta must not copy configured credentials into the audit store.
    let mut sanitized = serde_json::to_string(&raw)?;
    for name in ["OPENALEX_API_KEY", "SCOPUS_API_KEY", "SCOPUS_INST_TOKEN"] {
        if let Some(secret) = credential(name) {
            if !secret.is_empty() {
                sanitized = sanitized.replace(&secret, "[redacted]");
            }
        }
    }
    let mut raw: Value = serde_json::from_str(&sanitized)?;
    if !raw.is_object() {
        return Err(anyhow!("Respons provider harus berupa objek metadata."));
    }
    raw["_veraRequest"] = json!({"provider":provider,"query":query,"pageSize":25,"crossrefSort":if provider=="crossref"&&!legacy_crossref_order{Some("score")}else{None},"cursor":cursor});
    if provider == "crossref" {
        return crossref_page(raw, run);
    }
    parse(
        if provider == "biorxiv" {
            "openalex"
        } else {
            provider
        },
        raw,
        run,
    )
}

fn crossref_page(raw: Value, run: &str) -> Result<Page> {
    let root = &raw["message"];
    let entries = root["items"]
        .as_array()
        .ok_or_else(|| anyhow!("Crossref items tidak tersedia."))?;
    let mut records = vec![];
    for e in entries {
        let doi = e["DOI"]
            .as_str()
            .ok_or_else(|| anyhow!("Crossref DOI tidak tersedia."))?;
        let title = e["title"][0]
            .as_str()
            .ok_or_else(|| anyhow!("Crossref judul tidak tersedia."))?;
        let authors = e["author"]
            .as_array()
            .map(|a| {
                a.iter()
                    .map(|a| {
                        format!(
                            "{} {}",
                            a["given"].as_str().unwrap_or(""),
                            a["family"].as_str().unwrap_or("")
                        )
                    })
                    .collect::<Vec<_>>()
                    .join("; ")
            })
            .unwrap_or_default();
        let year = e["published"]["date-parts"][0][0]
            .as_u64()
            .map(|n| n.to_string())
            .unwrap_or_default();
        let mut r = record(
            run,
            doi,
            title,
            doi,
            &year,
            &authors,
            e["abstract"].as_str().unwrap_or(""),
        );
        r.bibliography = super::bibliography::from_crossref(e);
        records.push(r);
    }
    Ok(Page {
        total: root["total-results"].as_u64().map(|n| n as usize),
        checkpoint: if entries.len() < 25 {
            None
        } else {
            root["next-cursor"].as_str().map(str::to_string)
        },
        records,
        raw,
    })
}
async fn pubmed_page(query: &str, cursor: Option<&str>, run: &str) -> Result<Page> {
    let offset = cursor
        .unwrap_or("0")
        .parse::<usize>()
        .map_err(|_| anyhow!("Checkpoint PubMed tidak valid."))?;
    if offset >= 10_000 {
        return Err(anyhow!("PubMed ESearch membatasi 10.000 ID; pecah query dan simpan run terpisah atau impor ekspor asli."));
    }
    let client = crate::net::remote_client()
        .timeout(Duration::from_secs(35))
        .build()?;
    let base = crate::config::pubmed_api_url();
    let search: Value = client
        .get(format!("{base}/esearch.fcgi"))
        .query(&[
            ("db", "pubmed"),
            ("term", query),
            ("retmode", "json"),
            ("retmax", "25"),
            ("retstart", &offset.to_string()),
            ("sort", "relevance"),
            ("tool", "vera"),
        ])
        .send()
        .await
        .map_err(|_| anyhow!("PubMed tidak dapat dihubungi."))?
        .error_for_status()
        .map_err(|e| anyhow!("PubMed HTTP {:?}", e.status()))?
        .json()
        .await
        .map_err(|_| anyhow!("Respons PubMed tidak valid."))?;
    let root = &search["esearchresult"];
    if root.get("errorlist").is_some() || search.get("error").is_some() {
        return Err(anyhow!("Query PubMed ditolak. Periksa sintaks."));
    }
    let ids = root["idlist"]
        .as_array()
        .ok_or_else(|| anyhow!("PubMed ID list tidak tersedia."))?
        .iter()
        .filter_map(Value::as_str)
        .collect::<Vec<_>>();
    let total = root["count"].as_str().and_then(|s| s.parse::<usize>().ok());
    let xml = if ids.is_empty() {
        "<PubmedArticleSet/>".into()
    } else {
        client
            .get(format!("{base}/efetch.fcgi"))
            .query(&[
                ("db", "pubmed"),
                ("id", &ids.join(",")),
                ("retmode", "xml"),
                ("tool", "vera"),
            ])
            .send()
            .await
            .map_err(|_| anyhow!("PubMed EFetch tidak dapat dihubungi."))?
            .error_for_status()
            .map_err(|e| anyhow!("PubMed EFetch HTTP {:?}", e.status()))?
            .text()
            .await
            .map_err(|_| anyhow!("Teks metadata PubMed tidak dapat dibaca."))?
    };
    let articles = crate::client::parse_pubmed_articles(&xml)?;
    if articles.len() != ids.len() {
        return Err(anyhow!(
            "EFetch belum mengembalikan seluruh ID halaman; checkpoint dipertahankan."
        ));
    }
    let records = articles
        .iter()
        .map(|a| {
            let mut r = record(
                run,
                &a.pmid,
                &a.title,
                a.doi.as_deref().unwrap_or(""),
                a.publication_date.as_deref().unwrap_or(""),
                &a.authors.join("; "),
                &a.abstract_,
            );
            r.url = Some(format!("https://pubmed.ncbi.nlm.nih.gov/{}/", a.pmid));
            r
        })
        .collect();
    Ok(Page {
        records,
        total,
        checkpoint: total
            .filter(|n| offset + ids.len() < *n)
            .map(|_| (offset + ids.len()).to_string()),
        raw: json!({"search":search,"efetchXml":xml}),
    })
}

pub fn parse(provider: &str, raw: Value, run: &str) -> Result<Page> {
    let mut records = vec![];
    let (total, checkpoint) = if provider == "openalex" {
        let entries = raw["results"]
            .as_array()
            .ok_or_else(|| anyhow!("OpenAlex results tidak tersedia."))?;
        for entry in entries {
            let id = entry["id"]
                .as_str()
                .ok_or_else(|| anyhow!("Record provider tidak memiliki ID."))?;
            let title = entry["display_name"].as_str().unwrap_or("");
            if title.is_empty() {
                return Err(anyhow!(
                    "Record provider tidak memiliki judul; halaman belum diterapkan."
                ));
            }
            let mut words = vec![];
            if let Some(index) = entry["abstract_inverted_index"].as_object() {
                for (word, positions) in index {
                    if let Some(positions) = positions.as_array() {
                        for pos in positions.iter().filter_map(Value::as_u64) {
                            words.push((pos, word.as_str()));
                        }
                    }
                }
            }
            words.sort_by_key(|w| w.0);
            let abstract_text = words.iter().map(|w| w.1).collect::<Vec<_>>().join(" ");
            let authors = entry["authorships"]
                .as_array()
                .map(|a| {
                    a.iter()
                        .filter_map(|v| v["author"]["display_name"].as_str())
                        .collect::<Vec<_>>()
                        .join("; ")
                })
                .unwrap_or_default();
            let mut r = record(
                run,
                id,
                title,
                entry["doi"].as_str().unwrap_or(""),
                &entry["publication_year"]
                    .as_i64()
                    .map(|n| n.to_string())
                    .unwrap_or_default(),
                &authors,
                &abstract_text,
            );
            if r.url.is_none() {
                r.url = Some(id.into());
            }
            records.push(r);
        }
        (
            raw["meta"]["count"].as_u64().map(|n| n as usize),
            raw["meta"]["next_cursor"].as_str().map(str::to_string),
        )
    } else {
        let root = &raw["search-results"];
        let entries = root["entry"]
            .as_array()
            .ok_or_else(|| anyhow!("Scopus entry tidak tersedia."))?;
        for entry in entries {
            if entry.get("error").is_some() {
                if root["opensearch:totalResults"] == "0" {
                    continue;
                }
                return Err(anyhow!("Scopus tidak memberikan record yang dapat dibaca."));
            }
            let id = entry["eid"]
                .as_str()
                .or(entry["dc:identifier"].as_str())
                .ok_or_else(|| anyhow!("Scopus ID tidak tersedia."))?;
            let title = entry["dc:title"]
                .as_str()
                .ok_or_else(|| anyhow!("Scopus judul tidak tersedia."))?;
            let r = record(
                run,
                id,
                title,
                entry["prism:doi"].as_str().unwrap_or(""),
                entry["prism:coverDate"].as_str().unwrap_or(""),
                entry["dc:creator"].as_str().unwrap_or(""),
                entry["dc:description"].as_str().unwrap_or(""),
            );
            records.push(r);
        }
        (
            root["opensearch:totalResults"]
                .as_str()
                .and_then(|s| s.parse().ok()),
            root["cursor"]["@next"].as_str().map(str::to_string),
        )
    };
    Ok(Page {
        records,
        total,
        checkpoint,
        raw,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn crossref_cursor_preserves_unknown_abstract_and_deposit_metadata() {
        let raw = json!({"message":{"total-results":1000,"next-cursor":"n","items":[{"DOI":"10.9999/fixture","title":["TEST FIXTURE"],"published":{"date-parts":[[2025]]},"author":[{"given":"Test","family":"Author"}]}]}});
        let page = crossref_page(raw, "test").unwrap();
        assert_eq!(page.total, Some(1000));
        assert_eq!(page.records.len(), 1);
        assert!(page.records[0].abstract_text.is_none());
        assert_eq!(page.records[0].authors.as_deref(), Some("Test Author"));
        assert!(page.checkpoint.is_none()); // Last short page, never invent a continuation.
    }
    #[test]
    fn provider_total_is_not_received_count() {
        let p=parse("openalex",json!({"meta":{"count":1000,"next_cursor":"next"},"results":[{"id":"W1","display_name":"Test fixture","publication_year":2025}]}),"r").unwrap();
        assert_eq!(p.total, Some(1000));
        assert_eq!(p.records.len(), 1);
        assert!(p.checkpoint.is_some());
    }
    #[test]
    fn interrupted_page_stays_partial_and_retry_does_not_duplicate_occurrences() {
        let mut run:SearchRun=serde_json::from_value(json!({"id":"r","purpose":"formal","provider":"fixture","query":"test","searchedAt":null,"importedAt":null,"startedAt":1,"updatedAt":1,"protocolRevision":1,"reportedTotal":null,"retrievedCount":0,"status":"queued","checkpoint":null,"warnings":[],"rawPages":[],"sourceFile":null,"checksum":null})).unwrap();
        let mut records = vec![];
        let make = || Page {
            records: (0..100)
                .map(|i| record("r", &i.to_string(), "TEST FIXTURE", "", "", "", ""))
                .collect(),
            total: Some(1000),
            checkpoint: Some("next".into()),
            raw: json!({"fixture":true}),
        };
        apply_page(&mut run, &mut records, Ok(make())).unwrap();
        apply_page(&mut run, &mut records, Err(anyhow!("TEST timeout"))).unwrap();
        assert_eq!(run.status, "partial");
        assert_eq!(run.reported_total, Some(1000));
        assert_eq!(run.retrieved_count, 100);
        assert_eq!(run.checkpoint.as_deref(), Some("next"));
        apply_page(&mut run, &mut records, Ok(make())).unwrap();
        assert_eq!(records.len(), 100);
        assert_eq!(run.raw_pages.len(), 2);
    }
}
