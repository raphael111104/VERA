/// Resource 1 is the icon Explorer, the Start menu, and the taskbar show.
fn main() {
    println!("cargo:rerun-if-changed=../VERA.ico");
    println!("cargo:rerun-if-changed=../../Cargo.toml");
    configure_embedded_payload();
    if std::env::var("CARGO_CFG_TARGET_OS").as_deref() != Ok("windows") {
        return;
    }
    let manifest_dir = std::path::PathBuf::from(std::env::var("CARGO_MANIFEST_DIR").unwrap());
    let icon = manifest_dir.join("..").join("VERA.ico");
    // An absolute path, so it doesn't matter which directory rc.exe resolves against.
    let rc = std::path::PathBuf::from(std::env::var("OUT_DIR").unwrap()).join("icon.rc");
    let escaped = icon.display().to_string().replace('\\', "\\\\");
    let version = cli_version();
    let resource_version = format!(
        "{},0",
        version.split(['-', '+']).next().unwrap().replace('.', ",")
    );
    let metadata = format!(
        r#"
1 VERSIONINFO
FILEVERSION {resource_version}
PRODUCTVERSION {resource_version}
FILETYPE 1
BEGIN
  BLOCK "StringFileInfo"
  BEGIN
    BLOCK "040904B0"
    BEGIN
      VALUE "FileDescription", "VERA - Veritas Evidence & Research Agent\0"
      VALUE "FileVersion", "{version}\0"
      VALUE "ProductName", "VERA\0"
      VALUE "InternalName", "VERA\0"
      VALUE "OriginalFilename", "VERA.exe\0"
      VALUE "ProductVersion", "{version}\0"
    END
  END
  BLOCK "VarFileInfo"
  BEGIN
    VALUE "Translation", 0x409, 1200
  END
END
"#
    );
    std::fs::write(&rc, format!("1 ICON \"{escaped}\"\n{metadata}")).unwrap();
    embed_resource::compile(&rc, embed_resource::NONE)
        .manifest_required()
        .unwrap();
}

/// A standalone launcher may embed the application binary and any adjacent
/// loader DLL. The regular two-file Windows installer leaves these variables
/// unset and keeps its existing sibling-executable behavior.
fn configure_embedded_payload() {
    println!("cargo:rerun-if-env-changed=ORX_BINARY_PATH");
    println!("cargo:rerun-if-env-changed=WEBVIEW2_LOADER_PATH");
    println!("cargo:rustc-check-cfg=cfg(embedded_orx)");
    println!("cargo:rustc-check-cfg=cfg(embedded_webview2_loader)");

    let Some(orx) = std::env::var_os("ORX_BINARY_PATH").map(std::path::PathBuf::from) else {
        if std::env::var_os("WEBVIEW2_LOADER_PATH").is_some() {
            panic!("WEBVIEW2_LOADER_PATH requires ORX_BINARY_PATH");
        }
        return;
    };
    if !orx.is_file() {
        panic!("ORX_BINARY_PATH is not a file: {}", orx.display());
    }
    println!("cargo:rustc-cfg=embedded_orx");
    println!("cargo:rustc-env=ORX_BINARY_PATH={}", orx.display());
    println!("cargo:rerun-if-changed={}", orx.display());

    let version = cli_version();
    println!("cargo:rustc-env=ORX_EMBEDDED_VERSION={version}");

    if let Some(loader) = std::env::var_os("WEBVIEW2_LOADER_PATH").map(std::path::PathBuf::from) {
        if !loader.is_file() {
            panic!("WEBVIEW2_LOADER_PATH is not a file: {}", loader.display());
        }
        println!("cargo:rustc-cfg=embedded_webview2_loader");
        println!("cargo:rustc-env=WEBVIEW2_LOADER_PATH={}", loader.display());
        println!("cargo:rerun-if-changed={}", loader.display());
    }
}

/// Read the CLI package version from the root Cargo manifest without adding a
/// build dependency to this small launcher crate.
fn cli_version() -> String {
    let manifest_dir = std::path::PathBuf::from(std::env::var("CARGO_MANIFEST_DIR").unwrap());
    let manifest = std::fs::read_to_string(manifest_dir.join("..").join("..").join("Cargo.toml"))
        .expect("read the root Cargo.toml for the embedded CLI version");
    let mut in_package = false;
    for line in manifest.lines() {
        let line = line.trim();
        if line.starts_with('[') {
            in_package = line == "[package]";
        } else if in_package {
            if let Some(version) = line
                .strip_prefix("version = \"")
                .and_then(|s| s.strip_suffix('"'))
            {
                return version.to_owned();
            }
        }
    }
    panic!("could not find [package].version in the root Cargo.toml");
}
