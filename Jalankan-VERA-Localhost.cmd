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
$devDirectory = Join-Path $root 'target\vera-ui-dev'
$backendPath = Join-Path $devDirectory 'bin\orx.exe'
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
    $env:ORX_DATA_DIR = Join-Path $devDirectory 'data'
    $env:ORX_CACHE_DIR = Join-Path $devDirectory 'cache'
    $env:XDG_CONFIG_HOME = Join-Path $devDirectory 'config'
    $env:ORX_UI_DEV_ORIGIN = $uiUrl
    Write-Host 'Backend VERA: http://127.0.0.1:4901' -ForegroundColor Cyan
    Write-Host 'Biarkan terminal ini terbuka. Tekan Ctrl+C untuk mematikan backend.'
    & $backendPath up --port 4901 --no-browser --no-telemetry
    return
}

if ($Mode -eq 'ui') {
    $Host.UI.RawUI.WindowTitle = 'VERA - Web localhost - 5201'
    Set-Location -LiteralPath $uiDirectory
    $env:ORX_BACKEND = $backendUrl
    Write-Host ('Web VERA: ' + $uiUrl + '/') -ForegroundColor Cyan
    Write-Host 'Biarkan terminal ini terbuka. Tekan Ctrl+C untuk mematikan web.'
    & 'node.exe' $vitePath --mode ui --host 127.0.0.1 --port 5201 --strictPort
    return
}

$mutex = $null
$ownsMutex = $false
try {
    $Host.UI.RawUI.WindowTitle = 'VERA - Menjalankan localhost'
    Set-Location -LiteralPath $root
    Write-Host 'Menyiapkan localhost VERA...' -ForegroundColor Cyan
    foreach ($requiredPath in @($backendPath, $vitePath, (Join-Path $uiDirectory 'src\paraglide\runtime.js'))) {
        if (-not (Test-Path -LiteralPath $requiredPath -PathType Leaf)) {
            throw ('File yang diperlukan tidak ditemukan: ' + $requiredPath)
        }
    }
    if (-not (Get-Command 'node.exe' -ErrorAction SilentlyContinue)) {
        throw 'Node.js belum tersedia di PATH. Pasang Node.js, lalu buka launcher kembali.'
    }

    $hasher = [Security.Cryptography.SHA256]::Create()
    try { $key = ([BitConverter]::ToString($hasher.ComputeHash([Text.Encoding]::UTF8.GetBytes($root.ToLowerInvariant())))).Replace('-', '').Substring(0, 16) }
    finally { $hasher.Dispose() }
    $mutex = New-Object Threading.Mutex($false, ('Local\VERA-Localhost-' + $key))
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
    if (-not $backend) { $backendTerminal = Start-ServerTerminal 'backend' }
    else { Write-Host 'Backend sudah berjalan; memakai server yang ada.' }
    if (-not $ui) { $uiTerminal = Start-ServerTerminal 'ui' }
    else { Write-Host 'Web sudah berjalan; memakai server yang ada.' }

    Write-Host 'Menunggu backend dan web siap...'
    $deadline = [DateTime]::UtcNow.AddSeconds(90)
    $ready = $false
    while ([DateTime]::UtcNow -lt $deadline) {
        $health = Get-WebJson ($backendUrl + '/api/health')
        if ($health -and $health.ok -eq $true -and (Test-UiReady)) { $ready = $true; break }
        foreach ($terminal in @($backendTerminal, $uiTerminal)) {
            if ($terminal -and $terminal.HasExited) { throw 'Terminal server telah ditutup sebelum localhost siap.' }
        }
        Start-Sleep -Milliseconds 750
    }
    if (-not $ready) { throw 'Server belum siap setelah 90 detik. Periksa pesan pada terminal Backend dan Web.' }

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
