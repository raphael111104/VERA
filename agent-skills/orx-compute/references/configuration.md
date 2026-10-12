# Compute and environment settings

Compute defaults and provider credentials are machine-local settings. Configure
them in VERA Settings before launching an experiment. The CLI starts and monitors
runs; it does not expose account sign-in, managed compute catalogs, or provider
credential-management subcommands.

## Select a backend

Available backends are local machine, Hugging Face Jobs, Modal, Kubernetes,
SSH, Slurm, Ray Jobs, and Tinker. Use the selected default unless the user
specifies another backend. Do not infer a backend from credentials that happen
to exist on the machine.

Before a launch:

1. Read the project and experiment tree.
2. Check the selected backend settings and its readiness details in VERA.
3. Read the reference for that backend.
4. Confirm the experiment has a stable run command and the intended changes
   are committed.
5. Launch with orx exp run.

## Credentials and environment values

Use VERA Settings to add, update, or remove locally stored environment values.
Keep provider keys out of shell arguments, custom instructions, project files,
and logs. Existing installations may still read values from ~/.openresearch/env;
that compatibility file is not migrated or deleted.

Some providers also use their own local CLI credential store, such as the
Hugging Face CLI or Modal CLI. Do not replace or clear provider-owned settings
without an explicit request. Credential presence is not proof that a token is
valid.

## SSH and Slurm

Add hosts and connection details in VERA Settings. Existing SSH configurations
that include openresearch_config remain supported for compatibility. Read the
SSH or Slurm reference before changing a route, container, partition, account,
or time limit. Do not overwrite a user's ~/.ssh/config.

## Project-specific instructions

Keep repeatable setup in committed project scripts. Do not store secrets or
ordinary backend settings in custom agent instructions. If a backend requires
stable, verified machine-specific guidance, document only the commands,
environment activation, paths, and constraints needed by that backend.
