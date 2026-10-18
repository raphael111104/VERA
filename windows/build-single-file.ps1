param(
    [string]$Target = "x86_64-pc-windows-msvc",
    [string]$OutputPath = "",
    [string]$Toolchain = "",
    [switch]$SkipUiBuild
)

$ErrorActionPreference = "Stop"
$workspace = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$usedDrives = @(Get-PSDrive -PSProvider FileSystem | ForEach-Object Name)
$driveLetter = @("Z", "Y", "X", "W", "V", "U") |
    Where-Object { $_ -notin $usedDrives } |
    Select-Object -First 1
if (-not $driveLetter) {
    throw "Could not find an unused drive letter for a path without spaces."
}

$substDrive = $driveLetter + ":"
$workspaceAlias = $driveLetter + ":\"
$previousTargetDir = $env:CARGO_TARGET_DIR
$previousOrxPath = $env:ORX_BINARY_PATH
$previousLoaderPath = $env:WEBVIEW2_LOADER_PATH
$previousToolchain = $env:RUSTUP_TOOLCHAIN
$mapped = $false

try {
    subst $substDrive $workspace
    if ($LASTEXITCODE -ne 0) {
        throw "Could not map $workspace to $workspaceAlias."
    }
    $mapped = $true

    Push-Location $workspaceAlias
    try {
        if ($Toolchain) {
            $env:RUSTUP_TOOLCHAIN = $Toolchain
        } elseif ($Target -eq "x86_64-pc-windows-gnu") {
            $env:RUSTUP_TOOLCHAIN = "stable-x86_64-pc-windows-gnu"
        }
        if (-not $SkipUiBuild) {
            pnpm --dir ui build
            if ($LASTEXITCODE -ne 0) {
                throw "The VERA UI build failed."
            }
        } elseif (-not (Test-Path -LiteralPath "ui\dist\index.html")) {
            throw "SkipUiBuild requires an existing, validated ui/dist."
        }

        $env:CARGO_TARGET_DIR = Join-Path $workspaceAlias "target"
        cargo build --release --locked --target $Target
        if ($LASTEXITCODE -ne 0) {
            throw "The VERA CLI and server build failed."
        }

        $releaseDir = Join-Path $env:CARGO_TARGET_DIR (Join-Path $Target "release")
        $orxPath = Join-Path $releaseDir "orx.exe"
        if (-not (Test-Path -LiteralPath $orxPath -PathType Leaf)) {
            throw "The CLI binary was not produced at $orxPath."
        }
        $env:ORX_BINARY_PATH = $orxPath

        $cargoHome = if ($env:CARGO_HOME) { $env:CARGO_HOME } else { Join-Path $env:USERPROFILE ".cargo" }
        $loaderPattern = Join-Path $cargoHome "registry\src\*\webview2-com-sys-*\x64\WebView2Loader.dll"
        $loader = Get-ChildItem -Path $loaderPattern -File -ErrorAction SilentlyContinue |
            Select-Object -First 1
        if ($loader) {
            $env:WEBVIEW2_LOADER_PATH = $loader.FullName
            Copy-Item -LiteralPath $loader.FullName -Destination (Join-Path $releaseDir 'WebView2Loader.dll') -Force
        } else {
            Remove-Item Env:WEBVIEW2_LOADER_PATH -ErrorAction SilentlyContinue
        }

        cargo build --release --locked --target $Target --manifest-path (Join-Path $workspaceAlias "windows\launcher\Cargo.toml")
        if ($LASTEXITCODE -ne 0) {
            throw "The single-file VERA launcher build failed."
        }

        $launcherPath = Join-Path $releaseDir "VERA.exe"
        if (-not (Test-Path -LiteralPath $launcherPath -PathType Leaf)) {
            throw "The single-file launcher was not produced at $launcherPath."
        }

        if (-not $OutputPath) {
            $OutputPath = Join-Path $workspace "dist\VERA.exe"
        } elseif (-not [System.IO.Path]::IsPathRooted($OutputPath)) {
            $OutputPath = Join-Path $workspace $OutputPath
        }
        $outputDir = Split-Path -Parent $OutputPath
        New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
        Copy-Item -LiteralPath $launcherPath -Destination $OutputPath -Force
        Write-Output "Created $OutputPath"
    } finally {
        Pop-Location
    }
} finally {
    if ($null -eq $previousToolchain) {
        Remove-Item Env:RUSTUP_TOOLCHAIN -ErrorAction SilentlyContinue
    } else {
        $env:RUSTUP_TOOLCHAIN = $previousToolchain
    }
    if ($mapped) {
        subst $substDrive /d
    }
    if ($null -eq $previousTargetDir) {
        Remove-Item Env:CARGO_TARGET_DIR -ErrorAction SilentlyContinue
    } else {
        $env:CARGO_TARGET_DIR = $previousTargetDir
    }
    if ($null -eq $previousOrxPath) {
        Remove-Item Env:ORX_BINARY_PATH -ErrorAction SilentlyContinue
    } else {
        $env:ORX_BINARY_PATH = $previousOrxPath
    }
    if ($null -eq $previousLoaderPath) {
        Remove-Item Env:WEBVIEW2_LOADER_PATH -ErrorAction SilentlyContinue
    } else {
        $env:WEBVIEW2_LOADER_PATH = $previousLoaderPath
    }
}
