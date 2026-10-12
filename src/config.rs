//! Local settings, environment files, and XDG paths.

use std::path::PathBuf;

use crate::error::Result;
use serde::{Deserialize, Serialize};

/// Base URL for the alphaXiv JSON API (full-text literature search). These
/// endpoints are public and token-free. Override with `ALPHAXIV_API_URL`.
pub fn alphaxiv_api_url() -> String {
    std::env::var("ALPHAXIV_API_URL").unwrap_or_else(|_| "https://api.alphaxiv.org".to_string())
}

/// Base URL for the alphaXiv web app, which serves the per-paper `.md` routes
/// (`/overview/<id>.md` report, `/abs/<id>.md` full text). Default is the `www.`
/// host so we skip the apex→www 301. Override with `ALPHAXIV_WEB_URL`.
pub fn alphaxiv_web_url() -> String {
    std::env::var("ALPHAXIV_WEB_URL").unwrap_or_else(|_| "https://www.alphaxiv.org".to_string())
}

/// Base URL for the OpenAlex REST API (scholarly works search). Public, no
/// token. Backs OpenAlex and bioRxiv discovery. Override with `OPENALEX_API_URL`.
pub fn openalex_api_url() -> String {
    std::env::var("OPENALEX_API_URL").unwrap_or_else(|_| "https://api.openalex.org".to_string())
}

/// Base URL for the bioRxiv API (per-DOI preprint details). Public, no token.
/// Backs `orx paper <biorxiv-doi>`. Override with `BIORXIV_API_URL`.
pub fn biorxiv_api_url() -> String {
    std::env::var("BIORXIV_API_URL").unwrap_or_else(|_| "https://api.biorxiv.org".to_string())
}

/// Base URL for NCBI E-utilities (PubMed search and records). Public, no
/// token. Backs PubMed discovery and `orx paper <pmid>`. Override with
/// `PUBMED_API_URL`.
pub fn pubmed_api_url() -> String {
    std::env::var("PUBMED_API_URL")
        .unwrap_or_else(|_| "https://eutils.ncbi.nlm.nih.gov/entrez/eutils".to_string())
}

/// Contact address sent to NCBI as `email=` alongside `tool=orx`, which NCBI
/// asks E-utilities clients to include. Override with `NCBI_EMAIL`.
pub fn ncbi_email() -> String {
    std::env::var("NCBI_EMAIL").unwrap_or_else(|_| "orx@alphaxiv.org".to_string())
}

/// Contact address sent to OpenAlex as `mailto=` to enter its faster "polite
/// pool". OpenAlex asks API users to identify themselves this way. Override with
/// `OPENALEX_MAILTO`.
pub fn openalex_mailto() -> String {
    std::env::var("OPENALEX_MAILTO").unwrap_or_else(|_| "orx@alphaxiv.org".to_string())
}

pub(crate) fn config_dir() -> PathBuf {
    // The VERA launcher gives the desktop app its own install state. Child
    // CLI/agent processes inherit this variable and resolve the same store.
    // Explicit XDG choices keep their existing precedence.
    if crate::local::shell_env::var("XDG_CONFIG_HOME").is_none() {
        if let Some(home) = vera_app_home() {
            return home.join("config");
        }
    }
    let base = crate::local::shell_env::var("XDG_CONFIG_HOME")
        .map(PathBuf::from)
        .unwrap_or_else(|| {
            dirs::home_dir()
                .unwrap_or_else(|| PathBuf::from("."))
                .join(".config")
        });
    // Keep the legacy directory name so existing settings and local databases
    // remain available without a disruptive data migration.
    base.join("openresearch")
}

pub(crate) fn vera_app_home() -> Option<PathBuf> {
    crate::local::shell_env::var("VERA_APP_HOME")
        .filter(|path| !path.is_empty())
        .map(PathBuf::from)
        .filter(|path| path.is_absolute())
}

/// Where the Overleaf Git authentication token and session cookie live. Deliberately *not*
/// `~/.openresearch/env`: `list_synced_env` fans that file out to every compute
/// backend and into the agent's environment, and nothing off this machine
/// pushes to Overleaf.
fn overleaf_credentials_path() -> PathBuf {
    config_dir().join("overleaf.json")
}

#[derive(Default, Serialize, Deserialize)]
struct OverleafCredentials {
    #[serde(default)]
    token: String,
    /// The browser session cookie the live editor channel authenticates with,
    /// as `name=value`. Separate from the token: the git bridge is a paid
    /// feature and the cookie is not, so either can be present alone.
    #[serde(default)]
    session: String,
    /// The Overleaf host the cookie belongs to; it is sent nowhere else.
    #[serde(default)]
    session_host: String,
}

fn overleaf_credentials() -> OverleafCredentials {
    std::fs::read_to_string(overleaf_credentials_path())
        .ok()
        .and_then(|raw| serde_json::from_str(&raw).ok())
        .unwrap_or_default()
}

/// Writes owner-only, like `save_credentials` beside it. An empty file goes
/// away rather than lingering with nothing in it.
fn save_overleaf_credentials(credentials: &OverleafCredentials) -> Result<()> {
    let path = overleaf_credentials_path();
    if credentials.token.is_empty() && credentials.session.is_empty() {
        return match std::fs::remove_file(&path) {
            Ok(()) => Ok(()),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(()),
            Err(e) => Err(e.into()),
        };
    }
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    let body = serde_json::to_string_pretty(credentials)?;
    std::fs::write(&path, format!("{body}\n"))?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        std::fs::set_permissions(&path, std::fs::Permissions::from_mode(0o600))?;
    }
    Ok(())
}

fn non_empty(value: String) -> Option<String> {
    let value = value.trim().to_string();
    (!value.is_empty()).then_some(value)
}

pub fn overleaf_token() -> Option<String> {
    non_empty(overleaf_credentials().token)
}

pub fn set_overleaf_token(token: &str) -> Result<()> {
    let mut credentials = overleaf_credentials();
    credentials.token = token.to_string();
    save_overleaf_credentials(&credentials)
}

pub fn clear_overleaf_token() -> Result<()> {
    let mut credentials = overleaf_credentials();
    credentials.token.clear();
    save_overleaf_credentials(&credentials)
}

/// The session cookie and the host it was issued by.
pub fn overleaf_session() -> Option<(String, String)> {
    let credentials = overleaf_credentials();
    let session = non_empty(credentials.session)?;
    let host = non_empty(credentials.session_host)?;
    Some((host, session))
}

pub fn set_overleaf_session(host: &str, session: &str) -> Result<()> {
    let mut credentials = overleaf_credentials();
    credentials.session = session.to_string();
    credentials.session_host = host.to_string();
    save_overleaf_credentials(&credentials)
}

pub fn clear_overleaf_session() -> Result<()> {
    let mut credentials = overleaf_credentials();
    credentials.session.clear();
    credentials.session_host.clear();
    save_overleaf_credentials(&credentials)
}

/// The user-chosen data dir, if one is persisted and non-empty. Consumed by
/// `store::data_dir()` between the `$ORX_DATA_DIR` override and the XDG default.
///
/// `settings.json` (in `config_dir()`, deliberately *outside* the data dir so it
/// can point *at* it without a chicken-and-egg) is owned by `crate::telemetry`,
/// which already guards it with an in-process mutex + cross-process flock +
/// atomic temp-and-rename RMW. We delegate rather than add a second writer — a
/// naive whole-object write here would clobber `installId`/`telemetryDisabled`
/// (and vice-versa). Sync because `store::data_dir()` calls it on every open.
pub fn settings_data_dir() -> Option<PathBuf> {
    crate::telemetry::persisted_data_dir().map(PathBuf::from)
}

pub fn settings_cache_dir() -> Option<PathBuf> {
    crate::telemetry::persisted_cache_dir().map(PathBuf::from)
}

/// Set or clear the persisted data dir, preserving every other settings field.
/// Delegates to `telemetry::set_persisted_data_dir` (the locked, atomic RMW).
/// `None` clears it (revert to the env/XDG/default chain).
pub fn set_settings_data_dir(data_dir: Option<String>) -> Result<()> {
    crate::telemetry::set_persisted_data_dir(data_dir)?;
    Ok(())
}

/// The persisted default compute target for local-mode launches, if any:
/// `(backend, flavor)`. Lives in the telemetry-owned `settings.json` for the
/// same single-writer reason as the data dir above.
pub fn compute_default() -> Option<(String, Option<String>)> {
    crate::telemetry::compute_default()
}

/// Set or clear the default compute target, preserving every other settings
/// field. Delegates to `telemetry::set_compute_default` (the locked, atomic
/// RMW). `None` backend clears both backend and flavor.
pub fn set_compute_default(backend: Option<String>, flavor: Option<String>) -> Result<()> {
    crate::telemetry::set_compute_default(backend, flavor)?;
    Ok(())
}

/// Literature sources the user disabled in Settings (their `LitSource::as_str()`
/// names). Lives in the telemetry-owned `settings.json`; enforced by discovery,
/// `orx discover`, and `orx paper`. Empty = all enabled.
pub fn disabled_lit_sources() -> Vec<String> {
    crate::telemetry::disabled_lit_sources()
}

pub fn github_for_new_projects() -> bool {
    crate::telemetry::github_for_new_projects()
}

pub fn set_github_for_new_projects(enabled: bool) -> Result<()> {
    crate::telemetry::set_github_for_new_projects(enabled)?;
    Ok(())
}

/// Whether orx may install updates on its own (Settings → Updates). Lives in
/// the telemetry-owned `settings.json` for the same single-writer reason as the
/// data dir above. Read by `updates::auto_update_eligible`.
pub fn auto_update_enabled() -> bool {
    crate::telemetry::auto_update_enabled()
}

pub fn set_auto_update_enabled(enabled: bool) -> Result<()> {
    crate::telemetry::set_auto_update_enabled(enabled)?;
    Ok(())
}

pub fn github_default_prompt_seen() -> bool {
    crate::telemetry::github_default_prompt_seen()
}

pub fn set_github_default_prompt_seen(seen: bool) -> Result<()> {
    crate::telemetry::set_github_default_prompt_seen(seen)?;
    Ok(())
}

/// Look up a var from the box's synced env file (`~/.openresearch/env`, written
/// by the api's env sync). Needed because non-interactive shells never source
/// it via .bashrc (Ubuntu's interactive guard returns first), so an agent's
/// `orx` can't rely on the process environment alone. Parses only the exact
/// format the api writes: `export KEY='value'` with `\` doubled and `'`
/// written as `'\''`.
pub fn synced_env_var(key: &str) -> Option<String> {
    let path = dirs::home_dir()?.join(".openresearch").join("env");
    let content = std::fs::read_to_string(path).ok()?;
    let prefix = format!("export {key}='");
    for line in content.lines() {
        let Some(rest) = line.strip_prefix(&prefix) else {
            continue;
        };
        let Some(escaped) = rest.strip_suffix('\'') else {
            continue;
        };
        // Invert buildEnvFile's escaping (quotes first, then backslashes).
        let value = escaped.replace(r"'\''", "'").replace(r"\\", r"\");
        if !value.is_empty() {
            return Some(value);
        }
    }
    None
}

/// All vars in the synced env file, in file order (same format as
/// `synced_env_var`). Malformed lines are skipped.
pub fn list_synced_env() -> Vec<(String, String)> {
    let Some(path) = dirs::home_dir().map(|h| h.join(".openresearch").join("env")) else {
        return Vec::new();
    };
    let Ok(content) = std::fs::read_to_string(path) else {
        return Vec::new();
    };
    let mut out = Vec::new();
    for line in content.lines() {
        let Some(rest) = line.strip_prefix("export ") else {
            continue;
        };
        let Some((key, quoted)) = rest.split_once('=') else {
            continue;
        };
        let Some(escaped) = quoted.strip_prefix('\'').and_then(|v| v.strip_suffix('\'')) else {
            continue;
        };
        let value = escaped.replace(r"'\''", "'").replace(r"\\", r"\");
        if !key.is_empty() && !value.is_empty() {
            out.push((key.to_string(), value));
        }
    }
    out
}

/// Drop `key`'s line from the synced env file. Missing file/key is a no-op.
pub fn remove_synced_env_var(key: &str) -> Result<()> {
    let Some(path) = dirs::home_dir().map(|h| h.join(".openresearch").join("env")) else {
        return Ok(());
    };
    let Ok(existing) = std::fs::read_to_string(&path) else {
        return Ok(());
    };
    let prefix = format!("export {key}=");
    let lines: Vec<&str> = existing
        .lines()
        .filter(|l| !l.starts_with(&prefix))
        .collect();
    let body = if lines.is_empty() {
        String::new()
    } else {
        format!("{}\n", lines.join("\n"))
    };
    std::fs::write(&path, body)?;
    Ok(())
}

/// Write `export KEY='value'` into `~/.openresearch/env` (the exact format
/// `synced_env_var` parses), replacing an existing line for `key` and keeping
/// every other line. File is owner-only (0600) on create and rewrite.
pub fn write_synced_env_var(key: &str, value: &str) -> Result<()> {
    write_synced_env_vars(&[(key, value)])
}

pub fn write_synced_env_vars(values: &[(&str, &str)]) -> Result<()> {
    use anyhow::anyhow;
    let dir = dirs::home_dir()
        .ok_or_else(|| anyhow!("no home directory"))?
        .join(".openresearch");
    std::fs::create_dir_all(&dir)?;
    let path = dir.join("env");
    let existing = std::fs::read_to_string(&path).unwrap_or_default();
    let mut lines: Vec<String> = existing.lines().map(str::to_string).collect();
    for (key, value) in values {
        // Inverse of synced_env_var's unescaping: backslashes first, then quotes.
        let escaped = value.replace('\\', r"\\").replace('\'', r"'\''");
        let new_line = format!("export {key}='{escaped}'");
        let prefix = format!("export {key}=");
        let mut replaced = false;
        lines.retain_mut(|line| {
            if !line.starts_with(&prefix) {
                return true;
            }
            if replaced {
                return false;
            }
            *line = new_line.clone();
            replaced = true;
            true
        });
        if !replaced {
            lines.push(new_line);
        }
    }
    let body = format!("{}\n", lines.join("\n"));
    {
        use std::io::Write;
        let mut opts = std::fs::OpenOptions::new();
        opts.write(true).create(true).truncate(true);
        #[cfg(unix)]
        {
            use std::os::unix::fs::OpenOptionsExt;
            opts.mode(0o600); // applies on create only
        }
        opts.open(&path)?.write_all(body.as_bytes())?;
    }
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        std::fs::set_permissions(&path, std::fs::Permissions::from_mode(0o600))?;
    }
    Ok(())
}

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SshHostSettings {
    pub container: Option<String>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SshSettings {
    pub default_host: Option<String>,
    #[serde(default)]
    pub hosts: std::collections::BTreeMap<String, SshHostSettings>,
}

pub fn ssh_settings() -> Result<SshSettings> {
    crate::telemetry::ssh_settings()
}

pub fn set_ssh_host(host: String, options: SshHostSettings) -> Result<()> {
    crate::jobs::ssh::validate_host_options(&options)?;
    crate::telemetry::set_ssh_host(host, options)?;
    Ok(())
}

pub fn set_ssh_default(host: Option<String>) -> Result<()> {
    crate::telemetry::set_ssh_default(host)?;
    Ok(())
}
