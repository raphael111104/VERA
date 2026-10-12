//! Command modules.
//!
//! Convention (every command author MUST follow this):
//!
//!   pub async fn run(args: crate::<Args>) -> crate::error::Result<()>
//!
//! - The arg struct is the clap-derive `Args` type defined in `main.rs` for that
//!   command (e.g. `crate::ProjectsArgs`). It is moved in by value.
//! - Research commands read the local store directly. Academic source clients
//!   are public read-only APIs; execution backends use locally configured access.
//! - Return `Ok(())` on success; propagate errors with `?`. `main` prints the
//!   error and exits 1.
//! - For early-exit "usage" errors that the TS prints to stderr + exit(1),
//!   return `Err(anyhow!(...))` (clap already enforces required positionals, so
//!   most of those usage guards are unnecessary in the Rust port).

pub mod agent;
pub mod app;
pub mod create_experiment;
pub mod delete;
pub mod discover;
pub mod exp;
mod file_serve;
pub mod install_cli;
pub mod install_skills;
pub mod invocation_gate;
pub mod library;
pub mod logs;
pub mod mcp_gate;
pub mod paper;
pub mod plan_gate;
pub mod project;
pub mod projects;
pub mod remote_host;
pub mod runs;
pub mod serve;
pub mod skill;
pub mod supervise;
pub mod telemetry;
pub mod up;
pub mod up_remote;
pub mod update;
pub mod version;
