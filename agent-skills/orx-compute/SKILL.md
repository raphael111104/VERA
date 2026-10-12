---
name: orx-compute
description: "Launch and monitor experiment runs and route guidance for Hugging Face, Modal, Kubernetes, SSH, Slurm, Ray, Tinker, and local backends. Covers the fixed run contract, sizing, cancellation, and wait versus wake. Use before any launch or relaunch, when authoring a k8s manifest, choosing or switching compute, or handling an OOM, stall, or timeout; then read one backend reference."
---

VERA keeps projects, experiment trees, runs, logs, and artifacts in the local
workspace. A run uses the commit recorded on its experiment branch. Remote
backends receive a snapshot of that commit.

    orx exp status <expId>
    orx exp run <expId>
    orx exp cancel <expId>
    orx exp wait <expId>
    orx exp wake <expId>

## Configure before launching

Select and configure backends in VERA Settings. Credentials and environment
values are saved locally; do not print them, place them in commands, or commit
them. A saved credential does not prove that a backend is ready. Read the
backend status and existing project run command before launching.

The available backends are local machine, Hugging Face Jobs, Modal, Kubernetes,
SSH, Slurm, Ray Jobs, and Tinker. Read only the reference for the backend the
user selected or the project default:

- Hugging Face Jobs: references/hf.md
- Modal: references/modal.md
- Kubernetes: references/k8s.md
- SSH: references/ssh.md
- Slurm: references/slurm.md
- Ray Jobs: references/ray.md
- Tinker: references/tinker.md
- Local machine: references/local.md
- General settings and environment: references/configuration.md

## Run contract

- VERA records an immutable source snapshot from the commit on the experiment
  branch. The selected backend receives that snapshot.
- Launch experiments with orx exp run. Do not call a provider CLI, scheduler,
  raw SSH, or the training command directly.
- Keep the project's run command stable. Change code or configuration on child
  experiment branches instead of changing the command for each run.
- Commit the intended changes before launching. Uncommitted files are excluded
  from the recorded source snapshot.
- A run is queued before it starts. Inspect it with orx runs and orx logs, then
  wait or wake only when the user's workflow requires it.
- Use --force only when the user requests a deliberate concurrent run.
- A disconnected monitor does not prove the scheduler stopped a job. Reconnect
  and inspect the existing run before considering a retry.

## Waiting and wake-up

Wake-up is opt-in. After a run finishes, use `orx exp wake <expId>` only when
an agent should resume from that result. Otherwise, inspect status and logs
without waking an agent.

## Environment

Use VERA Settings to manage local environment values. Existing installs may
still read the compatible ~/.openresearch/env file. Never echo secrets or add
them to project files, custom instructions, or logs. Use a committed project
setup script for repeatable non-secret environment preparation.
