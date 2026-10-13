@echo off
setlocal
set "VERA_LOCALHOST_LAUNCHER=%~f0"
set "VERA_LOCALHOST_NO_BROWSER="
if /i "%~1"=="--no-browser" set "VERA_LOCALHOST_NO_BROWSER=1"
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -Command "$parts = [IO.File]::ReadAllText($env:VERA_LOCALHOST_LAUNCHER) -split '\r?\n# VERA_POWERSHELL\r?\n', 2; & ([scriptblock]::Create($parts[1])) -LauncherPath $env:VERA_LOCALHOST_LAUNCHER -NoBrowser:($env:VERA_LOCALHOST_NO_BROWSER -eq '1')"
set "VERA_START_EXIT=%ERRORLEVEL%"
if not "%VERA_START_EXIT%"=="0" pause
exit /b %VERA_START_EXIT%

# VERA_POWERSHELL
param(
    [Parameter(Mandatory = $true)][string]$LauncherPath,
    [ValidateSet('start', 'backend', 'ui')][string]$Mode = 'start',
    [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $LauncherPath
$uiDirectory = Join-Path $root 'ui'
$localAppData = [Environment]::GetFolderPath('LocalApplicationData')
if ([string]::IsNullOrWhiteSpace($localAppData)) {
    throw 'Folder LocalAppData Windows tidak tersedia.'
}
$hasher = [Security.Cryptography.SHA256]::Create()
try { $workspaceKey = ([BitConverter]::ToString($hasher.ComputeHash([Text.Encoding]::UTF8.GetBytes($root.ToLowerInvariant())))).Replace('-', '').Substring(0, 16) }
finally { $hasher.Dispose() }
$devDirectory = Join-Path (Join-Path $localAppData 'VERA\dev-slots') $workspaceKey
$backendErrorPath = Join-Path $devDirectory 'backend-startup-error.txt'
$uiErrorPath = Join-Path $devDirectory 'ui-startup-error.txt'
$vitePath = Join-Path $uiDirectory 'node_modules\vite\bin\vite.js'
$backendUrl = 'http://127.0.0.1:4901'
$uiUrl = 'http://127.0.0.1:5201'

function Get-Listener([int]$Port) {
    Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue |
        Where-Object { $_.LocalAddress -in @('127.0.0.1', '0.0.0.0', '::', '::1') } |
        Select-Object -First 1
}

function Get-ServerProcess([int]$Port) {
    $listener = Get-Listener $Port
    if ($listener) {
        Get-CimInstance Win32_Process -Filter ('ProcessId = ' + $listener.OwningProcess)
    }
}

function Get-WebJson([string]$Url) {
    try { Invoke-RestMethod -Uri $Url -TimeoutSec 2 -ErrorAction Stop } catch { $null }
}

function Test-UiReady {
    try {
        $page = Invoke-WebRequest -Uri ($uiUrl + '/') -UseBasicParsing -TimeoutSec 2
        $page.StatusCode -eq 200 -and $page.Content -match '<title>VERA'
    } catch { $false }
}

function Get-BackendBuildProfile {
    $backendExecutable = Join-Path $root 'target\debug\orx.exe'
    $cargoPrefix = @()
    if (-not (Get-Command 'link.exe' -ErrorAction SilentlyContinue)) {
        $rustup = Get-Command 'rustup.exe' -ErrorAction SilentlyContinue
        if (-not $rustup) {
            throw 'MSVC link.exe tidak ditemukan, dan rustup tidak tersedia untuk memakai toolchain GNU Windows.'
        }
        $toolchain = 'stable-x86_64-pc-windows-gnu'
        $target = 'x86_64-pc-windows-gnu'
        $installedTargets = & $rustup.Source target list --installed --toolchain $toolchain 2>$null
        if ($LASTEXITCODE -ne 0 -or $installedTargets -notcontains $target) {
            throw ('MSVC link.exe tidak ditemukan. Pasang toolchain GNU dengan: rustup toolchain install ' + $toolchain + ' --target ' + $target)
        }
        if (-not (Get-Command 'x86_64-w64-mingw32-gcc.exe' -ErrorAction SilentlyContinue)) {
            throw 'Toolchain GNU Rust tersedia, tetapi x86_64-w64-mingw32-gcc.exe tidak ada di PATH.'
        }
        $cargoPrefix = @('+' + $toolchain)
        $backendExecutable = Join-Path $root ('target\' + $target + '\debug\orx.exe')
    }
    $target = if ($cargoPrefix.Count -gt 0) { 'x86_64-pc-windows-gnu' } else { $null }
    [pscustomobject]@{ CargoPrefix = $cargoPrefix; Target = $target; ExecutablePath = $backendExecutable }
}

function Start-ServerTerminal([string]$ServerMode) {
    $bootstrap = @"
`$parts = [IO.File]::ReadAllText(`$env:VERA_LOCALHOST_LAUNCHER) -split '\r?\n# VERA_POWERSHELL\r?\n', 2
& ([scriptblock]::Create(`$parts[1])) -LauncherPath `$env:VERA_LOCALHOST_LAUNCHER -Mode '$ServerMode'
"@
    $encoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($bootstrap))
    Start-Process -FilePath 'powershell.exe' -WorkingDirectory $root -WindowStyle Normal -PassThru `
        -ArgumentList @('-NoLogo', '-NoProfile', '-NoExit', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', $encoded)
}

if ($Mode -eq 'backend') {
    $Host.UI.RawUI.WindowTitle = 'VERA - Backend localhost - 4901'
    Set-Location -LiteralPath $root
    foreach ($directory in @($devDirectory, (Join-Path $devDirectory 'data'), (Join-Path $devDirectory 'cache'), (Join-Path $devDirectory 'config'))) {
        New-Item -ItemType Directory -Path $directory -Force | Out-Null
    }
    try {
        $profile = Get-BackendBuildProfile
        $env:ORX_DATA_DIR = Join-Path $devDirectory 'data'
        $env:ORX_CACHE_DIR = Join-Path $devDirectory 'cache'
        $env:XDG_CONFIG_HOME = Join-Path $devDirectory 'config'
        $env:ORX_UI_DEV_ORIGIN = $uiUrl
        $env:CARGO_TARGET_DIR = Join-Path $root 'target'
        $env:VERA_SKIP_WINDOWS_ICON = '1'
        $cargoArguments = @($profile.CargoPrefix) + @('run', '--locked')
        if ($profile.Target) { $cargoArguments += @('--target', $profile.Target) }
        $cargoArguments += @('--manifest-path', (Join-Path $root 'Cargo.toml'), '--', 'up', '--port', '4901', '--no-browser', '--no-telemetry')
        Write-Host ('Backend VERA: ' + $backendUrl) -ForegroundColor Cyan
        Write-Host 'Backend dibangun dari source saat diperlukan. Tekan Ctrl+C untuk mematikannya.'
        & cargo.exe @cargoArguments
        if ($LASTEXITCODE -ne 0) {
            throw ('Backend VERA berhenti dengan kode ' + $LASTEXITCODE + '.')
        }
    } catch {
        try { [IO.File]::WriteAllText($backendErrorPath, $_.Exception.ToString()) } catch {}
        throw
    }
    return
}

if ($Mode -eq 'ui') {
    $Host.UI.RawUI.WindowTitle = 'VERA - Web localhost - 5201'
    Set-Location -LiteralPath $uiDirectory
    $env:ORX_BACKEND = $backendUrl
    Write-Host ('Web VERA: ' + $uiUrl + '/') -ForegroundColor Cyan
    Write-Host 'Biarkan terminal ini terbuka. Tekan Ctrl+C untuk mematikan web.'
    try {
        & 'node.exe' $vitePath --mode ui --host 127.0.0.1 --port 5201 --strictPort
        if ($LASTEXITCODE -ne 0) { throw ('Dashboard Vite berhenti dengan kode ' + $LASTEXITCODE + '.') }
    } catch {
        try { [IO.File]::WriteAllText($uiErrorPath, $_.Exception.ToString()) } catch {}
        throw
    }
    return
}

$mutex = $null
$ownsMutex = $false
try {
    $Host.UI.RawUI.WindowTitle = 'VERA - Menjalankan localhost'
    Set-Location -LiteralPath $root
    Write-Host 'Menyiapkan localhost VERA...' -ForegroundColor Cyan
    foreach ($requiredPath in @((Join-Path $root 'Cargo.toml'), (Join-Path $uiDirectory 'src\paraglide\runtime.js'))) {
        if (-not (Test-Path -LiteralPath $requiredPath -PathType Leaf)) {
            throw ('File yang diperlukan tidak ditemukan: ' + $requiredPath)
        }
    }
    if (-not (Get-Command 'node.exe' -ErrorAction SilentlyContinue)) {
        throw 'Node.js belum tersedia di PATH. Pasang Node.js, lalu buka launcher kembali.'
    }
    if (-not (Get-Command 'cargo.exe' -ErrorAction SilentlyContinue)) {
        throw 'Cargo belum tersedia di PATH. Pasang Rust stable, lalu buka launcher kembali.'
    }
    $backendProfile = Get-BackendBuildProfile
    $backendPath = $backendProfile.ExecutablePath
    if (-not (Test-Path -LiteralPath $vitePath -PathType Leaf)) {
        if (-not (Get-Command 'pnpm' -ErrorAction SilentlyContinue)) {
            throw 'Dependensi dashboard belum tersedia dan pnpm tidak ditemukan. Pasang pnpm, lalu jalankan pnpm install --frozen-lockfile dari folder ui.'
        }
        Write-Host 'Memasang dependensi dashboard...' -ForegroundColor Cyan
        Push-Location -LiteralPath $uiDirectory
        try {
            & pnpm install --frozen-lockfile
            if ($LASTEXITCODE -ne 0) { throw ('pnpm install gagal dengan kode ' + $LASTEXITCODE + '.') }
        } finally {
            Pop-Location
        }
        if (-not (Test-Path -LiteralPath $vitePath -PathType Leaf)) {
            throw 'Dependensi dashboard selesai dipasang, tetapi Vite tidak ditemukan.'
        }
    }

    $mutex = New-Object Threading.Mutex($false, ('Local\VERA-Localhost-' + $workspaceKey))
    try { $ownsMutex = $mutex.WaitOne(0) } catch [Threading.AbandonedMutexException] { $ownsMutex = $true }
    if (-not $ownsMutex) {
        Write-Host 'Launcher VERA lainnya sedang menyiapkan server. Tunggu sampai browser terbuka.'
        exit 0
    }

    $backend = Get-ServerProcess 4901
    $ui = Get-ServerProcess 5201
    if ($backend -and ($backend.Name -ne 'orx.exe' -or $backend.ExecutablePath -ne $backendPath)) {
        throw 'Port 4901 digunakan aplikasi lain. Tutup aplikasi tersebut atau bebaskan port 4901.'
    }
    if ($ui -and ($ui.Name -ne 'node.exe' -or $ui.CommandLine -notmatch 'vite' -or $ui.CommandLine -notmatch '--port\s+5201(?:\s|$)' -or -not (Test-UiReady))) {
        throw 'Port 5201 digunakan aplikasi lain. Tutup aplikasi tersebut atau bebaskan port 5201.'
    }

    $backendTerminal = $null
    $uiTerminal = $null
    foreach ($directory in @($devDirectory, (Join-Path $devDirectory 'data'), (Join-Path $devDirectory 'cache'), (Join-Path $devDirectory 'config'))) {
        New-Item -ItemType Directory -Path $directory -Force | Out-Null
    }
    Remove-Item -LiteralPath $backendErrorPath,$uiErrorPath -Force -ErrorAction SilentlyContinue
    if (-not $backend) { $backendTerminal = Start-ServerTerminal 'backend' }
    else { Write-Host 'Backend sudah berjalan; memakai server yang ada.' }
    if (-not $ui) { $uiTerminal = Start-ServerTerminal 'ui' }
    else { Write-Host 'Web sudah berjalan; memakai server yang ada.' }

    Write-Host 'Menunggu backend dan web siap...'
    $deadline = [DateTime]::UtcNow.AddMinutes(10)
    $ready = $false
    while ([DateTime]::UtcNow -lt $deadline) {
        if (Test-Path -LiteralPath $backendErrorPath -PathType Leaf) {
            throw ('Backend gagal dijalankan: ' + [IO.File]::ReadAllText($backendErrorPath))
        }
        if (Test-Path -LiteralPath $uiErrorPath -PathType Leaf) {
            throw ('Dashboard gagal dijalankan: ' + [IO.File]::ReadAllText($uiErrorPath))
        }
        $health = Get-WebJson ($backendUrl + '/api/health')
        if ($health -and $health.ok -eq $true -and (Test-UiReady)) { $ready = $true; break }
        foreach ($terminal in @($backendTerminal, $uiTerminal)) {
            if ($terminal -and $terminal.HasExited) { throw 'Terminal server telah ditutup sebelum localhost siap.' }
        }
        Start-Sleep -Milliseconds 750
    }
    if (-not $ready) { throw 'Server belum siap setelah 10 menit. Periksa pesan pada terminal Backend dan Web.' }

    $data = Get-WebJson ($backendUrl + '/api/settings/data-dir')
    $expectedData = [IO.Path]::GetFullPath((Join-Path $devDirectory 'data')).TrimEnd('\')
    if (-not $data -or [IO.Path]::GetFullPath($data.current).TrimEnd('\') -ne $expectedData) {
        throw 'Backend memakai folder data yang berbeda. Periksa terminal dan konfigurasi localhost.'
    }

    if ($backendTerminal -or $uiTerminal) {
        $session = [ordered]@{
            backendPid = (Get-ServerProcess 4901).ProcessId
            uiPid = (Get-ServerProcess 5201).ProcessId
            backendTerminalPid = $(if ($backendTerminal) { $backendTerminal.Id } else { $null })
            uiTerminalPid = $(if ($uiTerminal) { $uiTerminal.Id } else { $null })
            backendUrl = $backendUrl
            uiUrl = $uiUrl
            dataDir = $expectedData
            mode = 'ui'
            launcher = $LauncherPath
            startedAt = [DateTime]::Now.ToString('o')
        }
        $session | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $devDirectory 'session.json') -Encoding UTF8
    }
    Write-Host ('Siap: ' + $uiUrl + '/') -ForegroundColor Green
    Write-Host 'Untuk mematikan: tekan Ctrl+C pada kedua terminal server, lalu tutup terminalnya.'
    if (-not $NoBrowser) { Start-Process ($uiUrl + '/') }
} catch {
    Write-Host ('Gagal menjalankan localhost: ' + $_.Exception.Message) -ForegroundColor Red
    exit 1
} finally {
    if ($ownsMutex) { $mutex.ReleaseMutex() }
    if ($mutex) { $mutex.Dispose() }
}
