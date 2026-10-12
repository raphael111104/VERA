---
name: vera-local-workspace
description: Use VERA's local research CLI to manage projects, experiment runs, evidence, academic literature retrieval, and reusable research assets.
---

# VERA local research workspace

`orx` is the local CLI for the VERA desktop workspace. Projects, experiment
trees, runs, logs, environment values, and artifacts stay in the user's local
workspace. Use the dashboard (`orx up`) for settings and project navigation.

## Local project workflow

```sh
orx up
orx projects --json
orx project view <project-id>
orx create-experiment <project-id> --title "<title>"
orx exp run <experiment-id>
orx runs <project-id>
orx logs <run-id>
```

An experiment run uses the project's configured run command and a committed
snapshot. Inspect the project, experiment tree, and run record before editing
or launching work. Follow the frozen-node and parent/child workflow in the
`orx-experiment-tree`, `orx-create`, `orx-compute`, and `orx-git` skills.

## Compute

Available execution backends are local machine, Hugging Face Jobs, Modal,
Kubernetes, SSH, Slurm, Ray, and Tinker. Configure credentials and environment
values from VERA Settings; the UI stores them in the user's local environment
file. The environment file remains compatible with existing local installs.
Read `orx-compute` and the selected backend reference before running a remote
job. Do not assume a configured credential means the backend is ready.

## Literature and papers

Use `orx discover` for alphaXiv, OpenAlex, bioRxiv, and PubMed search. Use
`orx paper` to fetch an alphaXiv report/full text or scholarly metadata and
abstracts. These public academic sources do not require a VERA account. Consult
`orx-lit-review` for source selection, retrieval limits, and evidence handling.

## Reusable materials

Use `orx skills add <path>` and `orx templates add <path>` to save reusable
skills and LaTeX templates in the local workspace. Use `orx skill <name>` to
read a bundled workflow guide. Use `orx install-skills --help` to install the
available VERA guidance into a local coding agent.

## Boundaries

- Keep project data, environment values, logs, and artifacts local.
- Use only the backend the user selected or the configured default.
- Do not print or commit secrets from the Environment settings.
- Academic database access and provider integrations can be configured locally;
  no organization sign-in, managed VERA compute provisioning, or upstream
  product-feedback command is part of this build.
