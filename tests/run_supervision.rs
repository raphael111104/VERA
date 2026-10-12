#[cfg(unix)]
use serde_json::json;
use serde_json::Value;
use std::path::PathBuf;
use std::process::{Command, Output};

struct Sandbox(PathBuf);
impl Sandbox {
    fn new() -> Self {
        let root =
            std::env::temp_dir().join(format!("vera-run-supervision-{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(root.join(".ssh")).unwrap();
        Self(root)
    }
    fn command(&self) -> Command {
        let mut cmd = Command::new(env!("CARGO_BIN_EXE_orx"));
        cmd.env("HOME", &self.0)
            .env("USERPROFILE", &self.0)
            .env("XDG_CONFIG_HOME", self.0.join("config"))
            .env("ORX_DATA_DIR", self.0.join("data"))
            .env("ORX_NO_UPDATE_CHECK", "1")
            .env_remove("HF_TOKEN")
            .env_remove("TINKER_API_KEY")
            .env_remove("MODAL_TOKEN_ID")
            .env_remove("MODAL_TOKEN_SECRET")
            .arg("--no-telemetry");
        cmd
    }
    fn run(&self, args: &[&str]) -> Output {
        self.command().args(args).output().unwrap()
    }
    fn json(&self, args: &[&str]) -> Value {
        let output = self.run(args);
        assert!(
            output.status.success(),
            "{}",
            String::from_utf8_lossy(&output.stderr)
        );
        serde_json::from_slice(&output.stdout).unwrap()
    }
}
impl Drop for Sandbox {
    fn drop(&mut self) {
        let _ = std::fs::remove_dir_all(&self.0);
    }
}
#[cfg(unix)]
#[test]
fn slurm_supervisor_survives_connection_and_accounting_loss() {
    supervisor_recovers_monitoring_and_logs(false);
}

#[cfg(unix)]
#[test]
fn ssh_supervisor_survives_proxy_output_without_skipping_logs() {
    supervisor_recovers_monitoring_and_logs(true);
}

#[cfg(unix)]
fn supervisor_recovers_monitoring_and_logs(ssh_backend: bool) {
    use std::os::unix::fs::PermissionsExt;
    use std::time::{Duration, Instant};
    let sandbox = Sandbox::new();
    sandbox.json(&["projects", "--json"]);
    let db = rusqlite::Connection::open(sandbox.0.join("data/orx.db")).unwrap();
    db.execute("INSERT INTO local_experiments (id, project_id, slug, branch_name, run_command, created_at, updated_at) VALUES ('exp','project','exp','main','true',0,0)", []).unwrap();
    let backend = if ssh_backend {
        json!({"kind":"ssh_job", "namespace":"lab", "jobId":".orx/runs/run"})
    } else {
        json!({"kind":"slurm_job", "namespace":"lab", "jobId":"42", "timeoutSecs":86400})
    };
    db.execute("INSERT INTO runs (id, experiment_id, project_id, status, backend_json, created_at, updated_at) VALUES ('run','exp','project','running',?1,0,0)", [backend.to_string()]).unwrap();
    let bin = sandbox.0.join("bin");
    std::fs::create_dir(&bin).unwrap();
    let ssh = bin.join("ssh");
    std::fs::write(
        &ssh,
        r#"#!/bin/sh
if [ "$1" = -G ]; then exec /usr/bin/ssh -F /dev/null "$@"; fi
printf '%s\n' "$*" >> "$HOME/calls"
case "$*" in
  *sbatch*|*scancel*) exit 99;;
  *exit_code*)
    phase=$(cat "$HOME/phase")
    case "$phase" in
      outage) echo 'Permission denied (MFA expired)' >&2; exit 255;;
      missing) if [ "$SSH_BACKEND" = 1 ]; then echo 'cannot assign requested address'; else echo GONE; fi;;
      running|log_failure) if [ "$SSH_BACKEND" = 1 ]; then echo RUNNING; else echo 'SQ RUNNING'; fi;;
      done) if [ "$SSH_BACKEND" = 1 ]; then echo 'EXIT 0'; else echo 'SA COMPLETED'; fi;;
    esac;;
  *tail*)
    case "$(cat "$HOME/phase")" in
      missing|outage|log_failure) echo 'proxy dial error';;
      *) printf '__ORX_LOG_START__\n'; case "$*" in *'tail -n +1 '*) printf 'first\nsecond\n';; esac;;
    esac;;
  *) exit 0;;
esac
"#,
    )
    .unwrap();
    std::fs::set_permissions(&ssh, std::fs::Permissions::from_mode(0o755)).unwrap();
    let phase = sandbox.0.join("phase");
    std::fs::write(&phase, "missing").unwrap();
    struct ChildGuard(std::process::Child);
    impl Drop for ChildGuard {
        fn drop(&mut self) {
            let _ = self.0.kill();
            let _ = self.0.wait();
        }
    }
    let mut child = ChildGuard(
        sandbox
            .command()
            .env("SSH_BACKEND", if ssh_backend { "1" } else { "0" })
            .env("PATH", format!("{}:/usr/bin:/bin", bin.display()))
            .args(["supervise", "run"])
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .spawn()
            .unwrap(),
    );
    let metadata = || -> Value {
        let raw: String = db
            .query_row("SELECT backend_json FROM runs WHERE id='run'", [], |r| {
                r.get(0)
            })
            .unwrap();
        serde_json::from_str(&raw).unwrap()
    };
    let wait_for = |timeout: Duration, condition: &dyn Fn() -> bool| {
        let deadline = Instant::now() + timeout;
        while !condition() {
            assert!(
                Instant::now() < deadline,
                "supervisor did not reach expected state"
            );
            std::thread::sleep(Duration::from_millis(100));
        }
    };
    let wait = |condition: &dyn Fn() -> bool| wait_for(Duration::from_secs(15), condition);
    // A missing scheduler record is reported only after about a minute, without failing the run.
    wait(&|| {
        std::fs::read_to_string(sandbox.0.join("calls")).is_ok_and(|c| c.contains("exit_code"))
    });
    std::thread::sleep(Duration::from_secs(10));
    assert!(metadata()["monitoringError"].is_null());
    wait_for(Duration::from_secs(75), &|| {
        metadata()["monitoringError"].as_str().is_some_and(|s| {
            s.contains(if ssh_backend {
                "unexpected inspect output"
            } else {
                "scheduler record"
            })
        })
    });
    std::fs::write(&phase, "outage").unwrap();
    wait(&|| {
        metadata()["monitoringError"]
            .as_str()
            .is_some_and(|s| s.contains("Reconnect"))
    });
    let status: String = db
        .query_row("SELECT status FROM runs WHERE id='run'", [], |r| r.get(0))
        .unwrap();
    assert_eq!(status, "running");
    assert_eq!(
        metadata()["jobId"],
        if ssh_backend { ".orx/runs/run" } else { "42" }
    );
    if ssh_backend {
        std::fs::write(&phase, "log_failure").unwrap();
        wait(&|| {
            metadata()["monitoringError"]
                .as_str()
                .is_some_and(|s| s.contains("unexpected SSH log output"))
        });
    }
    std::fs::write(&phase, "running").unwrap();
    wait(&|| metadata()["monitoringError"].is_null());
    std::fs::write(&phase, "done").unwrap();
    wait(&|| {
        db.query_row("SELECT status FROM runs WHERE id='run'", [], |r| {
            r.get::<_, String>(0)
        })
        .unwrap()
            == "done"
    });
    let deadline = Instant::now() + Duration::from_secs(25);
    while child.0.try_wait().unwrap().is_none() {
        assert!(Instant::now() < deadline);
        std::thread::sleep(Duration::from_millis(100));
    }
    let calls = std::fs::read_to_string(sandbox.0.join("calls")).unwrap();
    assert!(!calls.contains("sbatch") && !calls.contains("scancel"));
    assert_eq!(
        std::fs::read_to_string(sandbox.0.join("data/run-logs/run.log")).unwrap(),
        "first\nsecond\n"
    );
}

#[test]
fn slurm_status_preserves_submission_failure_without_job_handle() {
    let sandbox = Sandbox::new();
    sandbox.json(&["projects", "--json"]);
    let db = rusqlite::Connection::open(sandbox.0.join("data/orx.db")).unwrap();
    db.execute("INSERT INTO local_experiments (id, project_id, slug, branch_name, run_command, created_at, updated_at) VALUES ('exp','project','exp','main','true',0,0)", []).unwrap();
    db.execute("INSERT INTO runs (id, experiment_id, project_id, status, backend_json, result_markdown, created_at, updated_at) VALUES ('run','exp','project','failed','{\"kind\":\"slurm_job\"}','Submission failed: invalid partition',0,0)", []).unwrap();
    for args in [
        vec!["exp", "status", "exp"],
        vec!["exp", "status", "exp", "--scheduler"],
    ] {
        let output = sandbox.run(&args);
        assert!(
            output.status.success(),
            "{}",
            String::from_utf8_lossy(&output.stderr)
        );
        assert!(String::from_utf8_lossy(&output.stdout).contains("invalid partition"));
    }
}

#[cfg(unix)]
#[test]
fn slurm_cancel_requires_acknowledgement_and_survives_restart_without_accounting() {
    use std::os::unix::fs::PermissionsExt;
    use std::time::{Duration, Instant};
    let sandbox = Sandbox::new();
    sandbox.json(&["projects", "--json"]);
    let db = rusqlite::Connection::open(sandbox.0.join("data/orx.db")).unwrap();
    db.execute("INSERT INTO local_experiments (id, project_id, slug, branch_name, run_command, created_at, updated_at) VALUES ('exp','project','exp','main','true',0,0)", []).unwrap();
    db.execute("INSERT INTO runs (id, experiment_id, project_id, status, backend_json, cancel_requested, created_at, updated_at) VALUES ('run','exp','project','starting','{\"kind\":\"slurm_job\",\"namespace\":\"lab\",\"jobId\":\"42\"}',1,0,0)", []).unwrap();
    let bin = sandbox.0.join("bin");
    std::fs::create_dir(&bin).unwrap();
    for (name, script) in [
        (
            "ssh",
            r#"#!/bin/sh
if [ "$1" = -G ]; then exec /usr/bin/ssh -F /dev/null "$@"; fi
for cmd do :; done
case "$cmd" in
  *scancel*|*exit_code*) exec /bin/sh -c "$cmd";;
  *__ORX_LOG_START__*) echo __ORX_LOG_START__;;
  *) exit 0;;
esac
"#,
        ),
        (
            "scancel",
            r#"#!/bin/sh
echo called >> "$HOME/cancel-calls"
if test -f "$HOME/accept"; then exit 0; fi
echo 'Invalid job id specified' >&2
exit 1
"#,
        ),
        (
            "squeue",
            r#"#!/bin/sh
case "$(cat "$HOME/phase")" in
  unavailable) exit 1;;
  hidden) case "$*" in
    *--jobs=*) exit 1;;
    *--all*--states=all*) echo '42 SUSPENDED';;
  esac;;
  gone) case "$*" in *--jobs=*) echo 'slurm_load_jobs error: Invalid job id specified' >&2; exit 1;; esac;;
esac
"#,
        ),
        ("sacct", "#!/bin/sh\nexit 1\n"),
    ] {
        let path = bin.join(name);
        std::fs::write(&path, script).unwrap();
        std::fs::set_permissions(&path, std::fs::Permissions::from_mode(0o755)).unwrap();
    }
    std::fs::write(sandbox.0.join("phase"), "hidden").unwrap();
    struct Child(std::process::Child);
    impl Drop for Child {
        fn drop(&mut self) {
            let _ = self.0.kill();
            let _ = self.0.wait();
        }
    }
    let spawn = || {
        Child(
            sandbox
                .command()
                .env("PATH", format!("{}:/usr/bin:/bin", bin.display()))
                .args(["supervise", "run"])
                .stdout(std::process::Stdio::null())
                .stderr(std::process::Stdio::null())
                .spawn()
                .unwrap(),
        )
    };
    let metadata = || -> Value {
        serde_json::from_str(
            &db.query_row("SELECT backend_json FROM runs WHERE id='run'", [], |r| {
                r.get::<_, String>(0)
            })
            .unwrap(),
        )
        .unwrap()
    };
    let status = || {
        db.query_row("SELECT status FROM runs WHERE id='run'", [], |r| {
            r.get::<_, String>(0)
        })
        .unwrap()
    };
    let wait = |condition: &dyn Fn() -> bool| {
        let deadline = Instant::now() + Duration::from_secs(15);
        while !condition() {
            assert!(Instant::now() < deadline);
            std::thread::sleep(Duration::from_millis(100));
        }
    };
    let child = spawn();
    wait(&|| status() == "running");
    assert!(sandbox.0.join("cancel-calls").exists());
    assert_ne!(metadata()["cancellationAccepted"], true);
    assert_eq!(status(), "running");
    std::fs::write(sandbox.0.join("phase"), "unavailable").unwrap();
    std::fs::write(sandbox.0.join("accept"), "").unwrap();
    wait(&|| metadata()["cancellationAccepted"] == true);
    assert_eq!(status(), "running");
    drop(child);
    std::fs::remove_file(sandbox.0.join("accept")).unwrap();
    std::fs::write(sandbox.0.join("phase"), "gone").unwrap();
    let restarted = spawn();
    wait(&|| status() == "cancelled");
    drop(restarted);
    // Cancelling after the scheduler has already forgotten the job also finishes.
    db.execute("UPDATE runs SET status='running', ended_at=NULL, backend_json='{\"kind\":\"slurm_job\",\"namespace\":\"lab\",\"jobId\":\"42\"}' WHERE id='run'", []).unwrap();
    let _already_gone = spawn();
    wait(&|| status() == "cancelled");
}
