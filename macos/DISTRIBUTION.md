# macOS distribution

The macOS workflow can build a universal desktop app, sign and notarize it, and
attach a disk image to a GitHub release. Publishing requires this repository to
configure the release workflow, signing identity, and notarization profile.

## Build locally

Run these commands on macOS with the universal Rust targets installed:

    bash scripts/build-macos-app.sh

The command builds the native orx executable and assembles the application
bundle. The bundle keeps its historical OpenResearch.app filename for update
compatibility; its display name is VERA. To package a disk image:

    bash scripts/package-macos-app.sh

Set MACOS_SIGN_IDENTITY and MACOS_NOTARY_PROFILE to sign and notarize the
release package. Without those values, the script creates an unsigned local
package for development.

## Runtime notes

Finder starts the application without the user's shell environment. VERA reads
the interactive login-shell environment so installed coding agents and tools
remain available to the local workspace.

The desktop app and the orx CLI share the local settings and SQLite database.
The app uses a separate loopback port from orx up; both modes can be used on
the same project as long as only one process owns an active run.