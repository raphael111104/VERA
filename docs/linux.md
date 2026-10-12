# Linux

VERA has a native desktop build and a browser-based dashboard. The desktop package
uses WebKitGTK and runs the local dashboard in its own window.

## Build locally

Build on Ubuntu 22.04 or newer with Rust, Node.js, pnpm, and the desktop build
dependencies installed:

    sudo apt-get install libwebkit2gtk-4.1-dev libgtk-3-dev librsvg2-dev file patchelf
    cargo build --release --features desktop
    scripts/build-linux-appimage.sh target/release/orx dist

The release workflow builds and smoke-checks the x86_64 and ARM64 AppImages.
A published build requires this repository to enable the Linux app workflow and
configure its own release settings.

## Run the AppImage

Make the generated AppImage executable and launch it. It adds a desktop entry
when it starts; the entry displays VERA and points to the current AppImage.
The desktop-entry filename remains openresearch.desktop so an existing shortcut
is updated in place.

The AppImage bundles WebKitGTK and requires glibc 2.35 or newer. When FUSE is
unavailable, use the AppImage extraction mode supported by the package.

## Use the CLI

Build the command-line app with Cargo. The dashboard command runs the local API
and serves the bundled dashboard in a browser. Research projects, runs, logs,
and artifacts stay in the local data store.