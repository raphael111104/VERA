fn main() {
    println!("cargo:rerun-if-env-changed=VERA_OFFICIAL_RELEASE_BUILD");
    println!("cargo:rerun-if-env-changed=VERA_RELEASE_REPOSITORY");
    println!("cargo:rerun-if-env-changed=VERA_SKIP_WINDOWS_ICON");
    println!("cargo:rerun-if-env-changed=GITHUB_ACTIONS");
    println!("cargo:rerun-if-env-changed=GITHUB_REPOSITORY");

    let repository = std::env::var("GITHUB_REPOSITORY").unwrap_or_default();
    let release_repository = std::env::var("VERA_RELEASE_REPOSITORY").unwrap_or_default();
    let expected_release_repository = format!("https://github.com/{repository}");
    let official_release = std::env::var("VERA_OFFICIAL_RELEASE_BUILD").as_deref() == Ok("1")
        && std::env::var("GITHUB_ACTIONS").as_deref() == Ok("true")
        && !repository.is_empty()
        && release_repository.trim_end_matches('/') == expected_release_repository;
    let channel = if official_release {
        println!("cargo:rustc-env=VERA_RELEASE_REPOSITORY={release_repository}");
        "production"
    } else {
        "development"
    };
    println!("cargo:rustc-env=ORX_BUILD_CHANNEL={channel}");

    // `desktop_app`: this build includes the windowed app (src/commands/app.rs).
    println!("cargo:rustc-check-cfg=cfg(desktop_app)");
    let os = std::env::var("CARGO_CFG_TARGET_OS").unwrap_or_default();
    let linux_desktop = os == "linux" && std::env::var_os("CARGO_FEATURE_DESKTOP").is_some();
    if os == "macos" || os == "windows" || linux_desktop {
        println!("cargo:rustc-cfg=desktop_app");
    }

    embed_windows_icon();
}

/// Resource 1 is the icon Explorer shows for orx.exe and the app window loads.
fn embed_windows_icon() {
    println!("cargo:rerun-if-changed=windows/VERA.ico");
    if std::env::var("CARGO_CFG_TARGET_OS").as_deref() != Ok("windows") {
        return;
    }
    // The source-based localhost server does not display the executable icon.
    // Skipping this resource step keeps its development build working from
    // workspace paths with spaces when only the GNU Windows toolchain exists.
    if std::env::var("VERA_SKIP_WINDOWS_ICON").as_deref() == Ok("1") {
        return;
    }
    let manifest_dir = std::path::PathBuf::from(std::env::var("CARGO_MANIFEST_DIR").unwrap());
    let icon = manifest_dir.join("windows").join("VERA.ico");
    // An absolute path, so it doesn't matter which directory rc.exe resolves against.
    let rc = std::path::PathBuf::from(std::env::var("OUT_DIR").unwrap()).join("icon.rc");
    let escaped = icon.display().to_string().replace('\\', "\\\\");
    std::fs::write(&rc, format!("1 ICON \"{escaped}\"\n")).unwrap();
    embed_resource::compile(&rc, embed_resource::NONE)
        .manifest_required()
        .unwrap();
}
