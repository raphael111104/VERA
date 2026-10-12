//! Job backends — external compute that orx launches and supervises itself.
//!
//! Orx submits natively (HF Jobs, Modal, Kubernetes, SSH, Slurm, Ray, Tinker
//! through a local controller, or this machine) and a detached
//! `orx supervise` watches the job beside it. The run's `backend_json` descriptor
//! is the serialized handle a later supervisor uses to reattach.

pub mod huggingface;
pub mod kubernetes;
pub mod localbox;
mod managed_env;
pub mod modal;
pub mod ray;
pub mod slurm;
pub mod ssh;
pub mod tinker;

use std::collections::HashMap;

use serde::{Deserialize, Serialize};

use crate::error::{anyhow, Result};

/// CPython env var that forces stdout/stderr unbuffered. Every backend streams a
/// job's output by tailing a pipe or a redirected `log` file, so a block-buffered
/// job would make its logs appear frozen until the buffer fills. We default it on
/// so prints stream live; it's inert for non-Python jobs and inherited by child
/// processes (unlike the `-u` flag).
pub const PYTHONUNBUFFERED: &str = "PYTHONUNBUFFERED";

/// Redirected CPython output uses Windows' ANSI codepage (often cp1252), so other
/// characters crash a run.
pub const PYTHONIOENCODING: &str = "PYTHONIOENCODING";

/// Default CPython's streaming and encoding unless the caller set them; kubernetes
/// open-codes it because its env is a JSON array.
pub fn default_python_env(env: &HashMap<String, String>) -> HashMap<String, String> {
    let mut env = env.clone();
    env.entry(PYTHONUNBUFFERED.to_string())
        .or_insert_with(|| "1".to_string());
    env.entry(PYTHONIOENCODING.to_string())
        .or_insert_with(|| "utf-8".to_string());
    env
}

/// Backend descriptor stored on the local run.
/// `kind` discriminates. This is a fixed field list — a key absent here does
/// NOT survive a parse → to_json round-trip, so anything a backend must keep
/// needs its own (optional) field.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BackendDescriptor {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ssh_container: Option<ssh::ContainerRun>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub monitoring_error: Option<String>,
    #[serde(default, skip_serializing_if = "std::ops::Not::not")]
    pub cancellation_accepted: bool,
    pub kind: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub namespace: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub job_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub flavor: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
    /// kubeconfig context (k8s_job only); `None` = kubectl current-context.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub context: Option<String>,
    /// Repo-relative manifest path the run was launched from (k8s_job only).
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub manifest: Option<String>,
    /// Everything the manifest created, as `kind/name` handles in creation
    /// order (k8s_job only) — cancel deletes exactly this list.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub resources: Option<Vec<String>>,
    /// A remote SSH endpoint, recorded by the supervisor once the job is
    /// reachable — `None` before then.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ssh_host: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ssh_port: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ssh_user: Option<String>,
    /// Requested execution limit for Slurm jobs.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub timeout_secs: Option<u64>,
    /// Immutable local source archive used for this run. These fields make a
    /// delayed or restarted supervisor independent of the working tree.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source_digest: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source_path: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source_size: Option<u64>,
}

impl BackendDescriptor {
    pub fn parse(json: &str) -> Result<Self> {
        serde_json::from_str(json).map_err(|e| anyhow!("Unreadable backend descriptor: {}", e))
    }

    pub fn to_json(&self) -> String {
        serde_json::to_string(self).unwrap_or_else(|_| "{}".to_string())
    }

    /// The HF (namespace, jobId) handle, or an error naming what's missing.
    pub fn hf_ref(&self) -> Result<(&str, &str)> {
        if self.kind != "hf_job" {
            return Err(anyhow!("Unsupported backend kind: {}", self.kind));
        }
        match (self.namespace.as_deref(), self.job_id.as_deref()) {
            (Some(ns), Some(id)) => Ok((ns, id)),
            _ => Err(anyhow!(
                "Backend descriptor is missing namespace/jobId — was the job submitted?"
            )),
        }
    }

    /// The k8s (namespace, job name) handle; context rides on `self.context`.
    pub fn k8s_ref(&self) -> Result<(&str, &str)> {
        if self.kind != "k8s_job" {
            return Err(anyhow!("Unsupported backend kind: {}", self.kind));
        }
        match (self.namespace.as_deref(), self.job_id.as_deref()) {
            (Some(ns), Some(id)) => Ok((ns, id)),
            _ => Err(anyhow!(
                "Backend descriptor is missing namespace/jobName — was the job submitted?"
            )),
        }
    }

    /// The Modal sandbox id (the reattach handle); `namespace` holds the app.
    pub fn modal_ref(&self) -> Result<&str> {
        if self.kind != "modal_job" {
            return Err(anyhow!("Unsupported backend kind: {}", self.kind));
        }
        self.job_id.as_deref().ok_or_else(|| {
            anyhow!("Backend descriptor is missing the Modal sandbox id — was the job submitted?")
        })
    }

    /// The Slurm (host, job id) handle; the login-node host rides on
    /// `namespace`, and the run dir derives from the run id.
    pub fn slurm_ref(&self) -> Result<(&str, &str)> {
        if self.kind != "slurm_job" {
            return Err(anyhow!("Unsupported backend kind: {}", self.kind));
        }
        match (self.namespace.as_deref(), self.job_id.as_deref()) {
            (Some(host), Some(id)) => Ok((host, id)),
            _ => Err(anyhow!(
                "Backend descriptor is missing the slurm host/job id — was the job submitted?"
            )),
        }
    }

    /// The local run dir (the reattach handle) for a local controller.
    pub fn local_ref(&self) -> Result<&str> {
        if !matches!(self.kind.as_str(), "local_job" | "tinker_job") {
            return Err(anyhow!("Unsupported backend kind: {}", self.kind));
        }
        self.job_id.as_deref().ok_or_else(|| {
            anyhow!("Backend descriptor is missing the run dir — was the job submitted?")
        })
    }

    /// The Ray Jobs (address, submission id) handle; address rides on
    /// `namespace`, dashboard link on `url`.
    pub fn ray_ref(&self) -> Result<(&str, &str)> {
        if self.kind != "ray_job" {
            return Err(anyhow!("Unsupported backend kind: {}", self.kind));
        }
        match (self.namespace.as_deref(), self.job_id.as_deref()) {
            (Some(addr), Some(id)) => Ok((addr, id)),
            _ => Err(anyhow!(
                "Backend descriptor is missing the Ray address/submission id — was the job submitted?"
            )),
        }
    }

    /// The SSH (host, remote run dir) handle; host rides on `namespace`.
    pub fn ssh_ref(&self) -> Result<(&str, &str)> {
        if self.kind != "ssh_job" {
            return Err(anyhow!("Unsupported backend kind: {}", self.kind));
        }
        match (self.namespace.as_deref(), self.job_id.as_deref()) {
            (Some(host), Some(dir)) => Ok((host, dir)),
            _ => Err(anyhow!(
                "Backend descriptor is missing the ssh host/dir — was the job submitted?"
            )),
        }
    }
}

/// Map an HF job stage onto the local run-status vocabulary. `UPDATING` appears
/// in the wild as a live state (see huggingface_hub).
pub fn stage_to_run_status(stage: &str) -> crate::store::RunStatus {
    use crate::store::RunStatus;
    match stage {
        "SCHEDULING" => RunStatus::Starting,
        "RUNNING" | "UPDATING" => RunStatus::Running,
        "COMPLETED" => RunStatus::Done,
        "ERROR" => RunStatus::Failed,
        "CANCELED" | "DELETED" => RunStatus::Cancelled,
        _ => RunStatus::Running,
    }
}

pub fn is_terminal_stage(stage: &str) -> bool {
    matches!(stage, "COMPLETED" | "CANCELED" | "ERROR" | "DELETED")
}

/// A run log's lines. An unterminated last line may still be mid-flush, so it
/// only counts once the writer has exited (`drain`).
pub fn log_lines(text: &str, drain: bool) -> impl Iterator<Item = &str> {
    text.split_inclusive('\n')
        .filter_map(move |line| match line.strip_suffix('\n') {
            Some(line) => Some(line.strip_suffix('\r').unwrap_or(line)),
            None => drain.then_some(line),
        })
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Descriptors written before the ssh/timeout fields existed still parse.
    #[test]
    fn older_descriptors_without_new_fields_still_parse() {
        let d = BackendDescriptor::parse(
            r#"{"kind":"ssh_job","namespace":"mybox","jobId":".orx/runs/r1"}"#,
        )
        .unwrap();
        assert_eq!(d.ssh_ref().unwrap(), ("mybox", ".orx/runs/r1"));
        assert_eq!(d.ssh_host, None);
        assert_eq!(d.timeout_secs, None);
        assert_eq!(d.ssh_container, None);
        let mut d = d;
        d.ssh_container = Some(ssh::ContainerRun {
            reference: "research".into(),
            id: "immutable-id".into(),
            started_at: "2026-09-21T00:00:00Z".into(),
            run_dir: "/home/user/.orx/runs/r1".into(),
        });
        let json = d.to_json();
        assert!(json.contains("sshContainer"));
        assert_eq!(
            BackendDescriptor::parse(&json).unwrap().ssh_container,
            d.ssh_container
        );
    }

    #[test]
    fn tinker_descriptor_round_trips_as_a_local_handle() {
        let json = r#"{"kind":"tinker_job","jobId":"/tmp/run"}"#;
        let descriptor = BackendDescriptor::parse(json).unwrap();
        assert_eq!(descriptor.local_ref().unwrap(), "/tmp/run");
        assert_eq!(
            BackendDescriptor::parse(&descriptor.to_json())
                .unwrap()
                .kind,
            "tinker_job"
        );
    }

    #[test]
    fn default_python_env_injects_when_absent_and_lets_author_win() {
        // Injected when the caller didn't set them.
        let got = default_python_env(&HashMap::new());
        assert_eq!(got.get(PYTHONUNBUFFERED).map(String::as_str), Some("1"));
        assert_eq!(got.get(PYTHONIOENCODING).map(String::as_str), Some("utf-8"));

        // Explicit values are preserved — even falsy ones — never overwritten.
        let author = HashMap::from([
            (PYTHONUNBUFFERED.to_string(), "0".to_string()),
            (PYTHONIOENCODING.to_string(), "cp1252".to_string()),
        ]);
        let got = default_python_env(&author);
        assert_eq!(got.get(PYTHONUNBUFFERED).map(String::as_str), Some("0"));
        assert_eq!(
            got.get(PYTHONIOENCODING).map(String::as_str),
            Some("cp1252")
        );
    }

    #[test]
    fn log_lines_hold_back_a_partial_last_line_until_drained() {
        let text = "a\r\nb\n{\"partial\": ";
        assert_eq!(log_lines(text, false).collect::<Vec<_>>(), ["a", "b"]);
        assert_eq!(
            log_lines(text, true).collect::<Vec<_>>(),
            ["a", "b", "{\"partial\": "]
        );
        assert_eq!(log_lines("", true).count(), 0);
    }
}
