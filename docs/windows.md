# Windows

VERA runs as a local desktop app or through its command-line interface. The app keeps
research projects, runs, logs, artifacts, and settings on the local machine.

## Install on a new computer

Distribute `dist/VERA-Setup.exe` for Windows 10/11 x64. The per-user installer
includes VERA, a private PortableGit/Bash distribution, the native OpenCode
agent, and Microsoft's signed WebView2 Evergreen standalone installer. If the
runtime is missing, setup installs it from the bundled file before installing
VERA. It stops with a retry message if that prerequisite fails. There is no
dependency download during installation and no system PATH change.

Users do not need Node.js, Python, Rust, Git, WSL, or Microsoft Word for the
research workspace and its DOCX/CSV output previews. Online academic search,
journal websites, and AI services need internet access; paid/restricted providers
still need the user's own credentials. Specialized experiments may require
their own tools. The installer contains no developer profile or credentials.

Run `VERA-Setup.exe`, complete setup, then open VERA from Start. Research data
is stored separately under the user's local application data and survives
uninstallation. Existing historical configuration locations remain supported.
The bare `dist/VERA.exe` embeds the dashboard/server, but does not include the
installer's private tools or WebView2 prerequisite. Share the setup executable
with new users.

The dashboard embeds a self-contained synthetic research demo. The first visit
to the research project list prepares it in the current local owner's store,
including example sources/PDFs, screening, charting, synthesis, draft sections,
learning reflection, and a DOCX/CSV export. It needs no academic/AI credentials
or internet. All example material is marked as simulation. Reopening a completed
demo preserves edits; deleting it does not cause automatic recreation. An
interrupted preparation can be resumed with the demo button. No development
database, owner capability, personal projects, or credentials are distributed.

## Build the desktop executable

From the repository root, run the packaging script with a working Rust Windows
toolchain:

    powershell -ExecutionPolicy Bypass -File windows/build-single-file.ps1

The script builds the dashboard, embeds it in the Rust server, builds the native
launcher, and writes dist/VERA.exe. Use a separate OutputPath when preparing a
candidate for validation.

If MSVC is unavailable, use the installed GNU host toolchain explicitly:

    powershell -ExecutionPolicy Bypass -File windows/build-single-file.ps1 -Target x86_64-pc-windows-gnu -OutputPath target/installer-candidate/VERA.exe

Then build the complete installer with Inno Setup 6 installed on the build PC:

    powershell -ExecutionPolicy Bypass -File windows/build-installer.ps1 -ApplicationPath target/installer-candidate/VERA.exe

Use `-CompilerPath` for an Inno compiler outside its default installation.
The script pins and checks Git/OpenCode release SHA-256 digests, checks the
Microsoft runtime's Authenticode signature, retains third-party licenses, and
writes a package manifest. Downloads are cached under `target/installer-downloads`.
Each build uses a new staging folder; no project databases, API keys, environment
files, or user configuration are copied. Candidate output defaults to
`target/installer-candidate`; validate it before copying to `dist/`.
Run `windows/test-package.ps1` against an installed candidate to check isolated
startup, bundled tools, and every served UI asset against `ui/dist`. This is
separate from a full interaction test or a clean Windows VM test.

## Run the CLI

From the repository root, run `cargo run -- up` to start the VERA dashboard in
a browser. The desktop package opens the same dashboard in a native window.
Use scripts/dev-slot.mjs for isolated development instances.

## Existing data and providers

VERA preserves historical OpenResearch-named configuration and data paths so
existing environment values, databases, and SSH settings remain available.
Local execution providers and academic-source connections are configured
separately. Product accounts, managed product compute, and upstream feedback
are not part of this application.
