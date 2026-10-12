//! `VERA.exe`, the Windows app's entry point. A GUI program gets no
//! console, and every console program it started would open a window of its
//! own. So it starts the `orx.exe` beside it as `orx app` in a console no one
//! sees, which `orx` and the git, shell, and agent processes it runs all share.
//! For a portable single-file build, `ORX_BINARY_PATH` embeds the executable
//! (and optionally `WEBVIEW2_LOADER_PATH`) and extracts it into local app data.

#![cfg_attr(windows, windows_subsystem = "windows")]

#[cfg(windows)]
fn main() {
    let started = start_orx();
    match started {
        // Explorer lets the program it started take the foreground; pass that on,
        // so orx's window, or the running one it wakes, comes to the front.
        // SAFETY: a plain syscall on the child's process id.
        Ok(child) => unsafe {
            use windows_sys::Win32::UI::WindowsAndMessaging::AllowSetForegroundWindow;
            AllowSetForegroundWindow(child.id());
        },
        Err(error) => show_error(&format!("Could not start VERA: {error}")),
    }
}

#[cfg(windows)]
fn start_orx() -> std::io::Result<std::process::Child> {
    use std::os::windows::process::CommandExt;
    use windows_sys::Win32::System::Threading::CREATE_NO_WINDOW;

    #[cfg(embedded_orx)]
    let executable = prepare_embedded_orx()?;
    #[cfg(not(embedded_orx))]
    let executable = std::env::current_exe()?.with_file_name("orx.exe");

    let mut command = std::process::Command::new(executable);
    if std::env::var_os("VERA_APP_HOME").is_none_or(|path| path.is_empty()) {
        let app_data = std::env::var_os("LOCALAPPDATA").ok_or_else(|| {
            std::io::Error::new(std::io::ErrorKind::NotFound, "LOCALAPPDATA is not set")
        })?;
        command.env(
            "VERA_APP_HOME",
            std::path::PathBuf::from(app_data).join("VERA"),
        );
    }
    command
        // APP_ARG in src/commands/app.rs.
        .arg("app")
        .creation_flags(CREATE_NO_WINDOW)
        .spawn()
}

#[cfg(all(windows, embedded_orx))]
const EMBEDDED_ORX: &[u8] = include_bytes!(env!("ORX_BINARY_PATH"));

#[cfg(all(windows, embedded_webview2_loader))]
const EMBEDDED_WEBVIEW2_LOADER: &[u8] = include_bytes!(env!("WEBVIEW2_LOADER_PATH"));

/// Install the embedded app under LocalAppData. Keeping the extracted `orx.exe`
/// stable lets its updater replace it in place; a newer self-updated CLI is
/// retained when this launcher runs again.
#[cfg(all(windows, embedded_orx))]
fn prepare_embedded_orx() -> std::io::Result<std::path::PathBuf> {
    use std::fs;
    use std::path::PathBuf;

    let local_app_data = std::env::var_os("LOCALAPPDATA").ok_or_else(|| {
        std::io::Error::new(
            std::io::ErrorKind::NotFound,
            "the LOCALAPPDATA environment variable is not set",
        )
    })?;
    let install_dir = PathBuf::from(local_app_data)
        .join("VERA")
        .join("single-file");
    fs::create_dir_all(&install_dir)?;

    let executable = install_dir.join("orx.exe");
    let marker = install_dir.join("orx.bundle-id");
    let fingerprint = embedded_fingerprint(EMBEDDED_ORX);
    let app_running = openresearch_app_is_running();
    let should_install = if app_running && executable.is_file() {
        false
    } else {
        embedded_binary_is_newer(&executable, &marker, &fingerprint)
    };

    #[cfg(embedded_webview2_loader)]
    let loader = install_dir.join("WebView2Loader.dll");

    if should_install {
        #[cfg(embedded_webview2_loader)]
        write_atomic(&loader, EMBEDDED_WEBVIEW2_LOADER)?;
        write_atomic(&executable, EMBEDDED_ORX)?;
        // A missing marker only repeats extraction on the next launch; it must
        // not prevent the application from opening.
        let _ = fs::write(&marker, fingerprint.as_bytes());
    } else {
        #[cfg(embedded_webview2_loader)]
        if !loader.is_file() {
            write_atomic(&loader, EMBEDDED_WEBVIEW2_LOADER)?;
        }
    }

    if !executable.is_file() {
        return Err(std::io::Error::new(
            std::io::ErrorKind::NotFound,
            "the embedded orx.exe could not be installed",
        ));
    }
    Ok(executable)
}

#[cfg(all(windows, embedded_orx))]
fn embedded_binary_is_newer(
    executable: &std::path::Path,
    marker: &std::path::Path,
    fingerprint: &str,
) -> bool {
    let embedded = parse_version(env!("ORX_EMBEDDED_VERSION"))
        .expect("the embedded CLI version must have three numeric components");
    match executable_version(executable) {
        Some(installed) if installed > embedded => false,
        Some(installed) if installed == embedded => {
            std::fs::read_to_string(marker).map_or(true, |value| value.trim() != fingerprint)
        }
        _ => true,
    }
}

#[cfg(all(windows, embedded_orx))]
fn executable_version(executable: &std::path::Path) -> Option<(u64, u64, u64)> {
    use std::os::windows::process::CommandExt;
    use windows_sys::Win32::System::Threading::CREATE_NO_WINDOW;

    let output = std::process::Command::new(executable)
        .arg("--version")
        .stdin(std::process::Stdio::null())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::null())
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .ok()?;
    if !output.status.success() {
        return None;
    }
    parse_version(&String::from_utf8_lossy(&output.stdout))
}

#[cfg(all(windows, embedded_orx))]
fn parse_version(text: &str) -> Option<(u64, u64, u64)> {
    for token in text.split_whitespace() {
        let Some(start) = token.find(|character: char| character.is_ascii_digit()) else {
            continue;
        };
        let core = token[start..].split(['-', '+']).next()?;
        let mut parts = core.split('.');
        let version = (
            parts.next()?.parse().ok()?,
            parts.next()?.parse().ok()?,
            parts.next()?.parse().ok()?,
        );
        if parts.next().is_none() {
            return Some(version);
        }
    }
    None
}

/// This fingerprint only detects whether the same bundle has already been
/// unpacked. It is not used as a security or signature check.
#[cfg(all(windows, embedded_orx))]
fn embedded_fingerprint(bytes: &[u8]) -> String {
    let hash = bytes.iter().fold(0xcbf29ce484222325u64, |hash, byte| {
        (hash ^ u64::from(*byte)).wrapping_mul(0x100000001b3)
    });
    format!("{hash:016x}")
}

#[cfg(all(windows, embedded_orx))]
fn write_atomic(path: &std::path::Path, contents: &[u8]) -> std::io::Result<()> {
    let file_name = path.file_name().unwrap_or_default().to_string_lossy();
    let temporary = path.with_file_name(format!("{file_name}.{}.tmp", std::process::id()));
    std::fs::write(&temporary, contents)?;
    match std::fs::rename(&temporary, path) {
        Ok(()) => Ok(()),
        Err(error) => {
            let _ = std::fs::remove_file(temporary);
            Err(error)
        }
    }
}

#[cfg(all(windows, embedded_orx))]
fn openresearch_app_is_running() -> bool {
    use windows_sys::Win32::Foundation::CloseHandle;
    use windows_sys::Win32::System::Threading::{OpenMutexW, SYNCHRONIZATION_SYNCHRONIZE};

    let name: Vec<u16> = "Local\\OpenResearchApp"
        .encode_utf16()
        .chain(Some(0))
        .collect();
    // SAFETY: the name is NUL-terminated and the returned handle is closed below.
    let mutex = unsafe { OpenMutexW(SYNCHRONIZATION_SYNCHRONIZE, 0, name.as_ptr()) };
    if mutex.is_null() {
        false
    } else {
        // SAFETY: OpenMutexW returned a valid handle.
        unsafe { CloseHandle(mutex) };
        true
    }
}

#[cfg(windows)]
fn show_error(message: &str) {
    use windows_sys::Win32::UI::WindowsAndMessaging::{MessageBoxW, MB_ICONERROR, MB_OK};

    let wide = |text: &str| text.encode_utf16().chain(Some(0)).collect::<Vec<u16>>();
    let (body, title) = (wide(message), wide("VERA could not start"));
    // SAFETY: both strings are NUL-terminated and outlive the call.
    unsafe {
        MessageBoxW(
            std::ptr::null_mut(),
            body.as_ptr(),
            title.as_ptr(),
            MB_OK | MB_ICONERROR,
        )
    };
}

#[cfg(not(windows))]
fn main() {
    eprintln!("VERA.exe is the Windows app's launcher");
    std::process::exit(1);
}
