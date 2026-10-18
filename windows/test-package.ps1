#requires -Version 7.2
param(
    [Parameter(Mandatory = $true)][string]$InstallDirectory,
    [int]$Port = 4793,
    [switch]$VerifyInstalledFiles,
    [switch]$KeepRunning
)
$ErrorActionPreference = 'Stop'
$workspace = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$InstallDirectory = (Resolve-Path -LiteralPath $InstallDirectory).Path
$launcher = Join-Path $InstallDirectory 'VERA.exe'
$verifiedFiles = 0
if ($VerifyInstalledFiles) {
    $manifest = Get-Content -LiteralPath (Join-Path $InstallDirectory 'package-manifest.json') -Raw | ConvertFrom-Json
    foreach ($entry in $manifest.files) {
        # Prerequisites are installer-only (dontcopy), not installed app files.
        if ($entry.path.StartsWith('prerequisites/')) { continue }
        $path = [IO.Path]::GetFullPath((Join-Path $InstallDirectory $entry.path))
        if (-not $path.StartsWith($InstallDirectory + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Invalid manifest path' }
        if (-not (Test-Path -LiteralPath $path -PathType Leaf) -or (Get-FileHash -LiteralPath $path).Hash -ne $entry.sha256) {
            throw "Installed file mismatch: $($entry.path)"
        }
        $verifiedFiles++
    }
}
$profile = Join-Path $workspace ('target\package-smoke-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $profile -Force | Out-Null
$root = "http://127.0.0.1:$Port"
try {
    $probe = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, $Port)
    $probe.Start(); $probe.Stop()
} catch { throw "Smoke port $Port is already occupied; existing services are preserved." }
$psi = [Diagnostics.ProcessStartInfo]::new($launcher)
$psi.UseShellExecute = $false
$psi.WorkingDirectory = $profile
# Process-local environment only. Never use the developer's data/AI credentials.
foreach ($key in @($psi.Environment.Keys)) {
    if ($key -match '(?i)(API_KEY|TOKEN|PASSWORD|SECRET|^AWS_|^AZURE_|^GOOGLE_|^ANTHROPIC_|^OPENAI_|^OPENROUTER_|^ORX_|^VERA_|^OPENCODE_)') {
        $psi.Environment.Remove($key) | Out-Null
    }
}
$psi.Environment['LOCALAPPDATA'] = Join-Path $profile 'local'
$psi.Environment['APPDATA'] = Join-Path $profile 'roaming'
$psi.Environment['USERPROFILE'] = Join-Path $profile 'user'
$psi.Environment['HOME'] = Join-Path $profile 'user'
$psi.Environment['VERA_APP_HOME'] = Join-Path $profile 'vera'
$psi.Environment['ORX_DATA_DIR'] = Join-Path $profile 'data'
$psi.Environment['ORX_CACHE_DIR'] = Join-Path $profile 'cache'
$psi.Environment['XDG_DATA_HOME'] = Join-Path $profile 'xdg-data'
$psi.Environment['XDG_CONFIG_HOME'] = Join-Path $profile 'xdg-config'
$psi.Environment['XDG_CACHE_HOME'] = Join-Path $profile 'xdg-cache'
$psi.Environment['ORX_APP_RELAUNCH_PORT'] = "$Port"
$psi.Environment['PATH'] = "$env:SystemRoot\System32;$env:SystemRoot"
foreach ($key in @('LOCALAPPDATA','APPDATA','USERPROFILE','VERA_APP_HOME','ORX_DATA_DIR','ORX_CACHE_DIR','XDG_DATA_HOME','XDG_CONFIG_HOME','XDG_CACHE_HOME')) {
    New-Item -ItemType Directory -Path $psi.Environment[$key] -Force | Out-Null
}
$backendId = $null
$started = [Diagnostics.Process]::Start($psi)
$client = [Net.Http.HttpClient]::new()
$client.Timeout = [TimeSpan]::FromSeconds(5)
try {
    $healthy = $false
    for ($attempt=0; $attempt -lt 90; $attempt++) {
        try {
            $response = $client.GetAsync("$root/api/health").GetAwaiter().GetResult()
            if ($response.IsSuccessStatusCode) { $healthy = $true; break }
        } catch { }
        Start-Sleep -Seconds 1
    }
    if (-not $healthy) { throw 'Packaged app did not start within 90 seconds' }
    $listener = Get-NetTCPConnection -State Listen -LocalPort $Port
    $backendId = $listener.OwningProcess
    $backend = Get-Process -Id $backendId
    if (-not $backend.Path.StartsWith($profile, [StringComparison]::OrdinalIgnoreCase) -and
        -not $backend.Path.StartsWith($InstallDirectory, [StringComparison]::OrdinalIgnoreCase)) {
        throw 'The responding server does not belong to this candidate'
    }
    $assetCount = 0
    foreach ($file in Get-ChildItem -LiteralPath (Join-Path $workspace 'ui\dist') -Recurse -File) {
        $relative = $file.FullName.Substring((Join-Path $workspace 'ui\dist').Length + 1).Replace('\','/')
        $bytes = $client.GetByteArrayAsync("$root/$relative").GetAwaiter().GetResult()
        $sha = [Security.Cryptography.SHA256]::Create()
        try { $actual = [BitConverter]::ToString($sha.ComputeHash($bytes)).Replace('-','') } finally { $sha.Dispose() }
        if ($actual -ne (Get-FileHash -LiteralPath $file.FullName).Hash) { throw "UI asset mismatch: $relative" }
        $assetCount++
    }
    $toolVersions = @{}
    foreach ($tool in @(@('git','runtime\git\cmd\git.exe'), @('opencode','runtime\opencode\opencode.exe'))) {
        $toolInfo = [Diagnostics.ProcessStartInfo]::new((Join-Path $InstallDirectory $tool[1]))
        $toolInfo.UseShellExecute = $false
        $toolInfo.CreateNoWindow = $true
        $toolInfo.RedirectStandardOutput = $true
        foreach ($key in $psi.Environment.Keys) { $toolInfo.Environment[$key] = $psi.Environment[$key] }
        $toolInfo.ArgumentList.Add('--version')
        $process = [Diagnostics.Process]::Start($toolInfo)
        $output = $process.StandardOutput.ReadToEnd()
        if (-not $process.WaitForExit(30000) -or $process.ExitCode -ne 0) { throw "Bundled $($tool[0]) failed" }
        $toolVersions[$tool[0]] = $output.Trim()
    }
    $bashInfo = [Diagnostics.ProcessStartInfo]::new((Join-Path $InstallDirectory 'runtime\git\bin\bash.exe'))
    $bashInfo.UseShellExecute = $false
    $bashInfo.CreateNoWindow = $true
    $bashInfo.RedirectStandardOutput = $true
    foreach ($key in $psi.Environment.Keys) { $bashInfo.Environment[$key] = $psi.Environment[$key] }
    $bashInfo.Environment['PATH'] = "$(Join-Path $InstallDirectory 'runtime\git\usr\bin');$(Join-Path $InstallDirectory 'runtime\git\ucrt64\bin');$(Join-Path $InstallDirectory 'runtime\git\cmd');$($psi.Environment['PATH'])"
    foreach ($argument in @('--noprofile','--norc','-c','git --version && curl --version | head -1 && printf VERA_BASH_OK')) { $bashInfo.ArgumentList.Add($argument) }
    $bashProcess = [Diagnostics.Process]::Start($bashInfo)
    $bashOutput = $bashProcess.StandardOutput.ReadToEnd()
    if (-not $bashProcess.WaitForExit(30000) -or $bashProcess.ExitCode -ne 0 -or -not $bashOutput.Contains('VERA_BASH_OK')) { throw 'Bundled Bash/coreutils failed' }
    $toolVersions['bash'] = $bashOutput.Trim()
    $report = [ordered]@{
        healthy = $healthy; assetCount = $assetCount; assetsMatch = $true; verifiedInstalledFiles = $verifiedFiles
        profile = $profile; origin = $root; backendId = $backendId; backendPath = $backend.Path
        nativeWindowHandle = "$($backend.MainWindowHandle)"; nativeWindowTitle = $backend.MainWindowTitle
        tools = $toolVersions; launcherSha256 = (Get-FileHash $launcher).Hash.ToLowerInvariant()
    }
    $report | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $profile 'report.json') -Encoding UTF8
    $report | ConvertTo-Json -Depth 5
} finally {
    $client.Dispose()
    if (-not $KeepRunning -and $backendId) { Stop-Process -Id $backendId -ErrorAction SilentlyContinue }
}
