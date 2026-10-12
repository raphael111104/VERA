# Windows

VERA runs as a local desktop app or as the orx command-line tool. The app keeps
research projects, runs, logs, artifacts, and settings on the local machine.

## Prerequisites

Install Git for Windows and a supported coding agent. VERA uses Git Bash and
coreutils to run local research workflows. If Git is not installed, onboarding
can install PortableGit without changing the user PATH. Existing installations
keep using their historical PortableGit directory; new installs use the VERA
data directory.

WebView2 is required for the native window. The Windows installer can install
the Microsoft runtime; a standalone executable needs it to be present already.

## Build the desktop executable

From the repository root, run the packaging script with a working Rust Windows
toolchain:

    powershell -ExecutionPolicy Bypass -File windows/build-single-file.ps1

The script builds the dashboard, embeds it in the Rust server, builds the native
launcher, and writes dist/VERA.exe. Use a separate OutputPath when preparing a
candidate for validation.

## Run the CLI

Build with cargo build --locked, then run orx up to start the local dashboard
in a browser. The desktop package opens the same dashboard in a native window.
Use scripts/dev-slot.mjs for isolated development instances.

## Existing data and providers

VERA preserves historical OpenResearch-named configuration and data paths so
existing environment values, databases, and SSH settings remain available.
Local execution providers and academic-source connections are configured
separately. Product accounts, managed product compute, and upstream feedback
are not part of this application.