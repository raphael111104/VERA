# Reset VERA to a new installation without deleting the previous state.
# Close VERA first. This script archives only VERA's own LocalAppData folder;
# research in the legacy OpenResearch store stays at its original location.
$ErrorActionPreference = 'Stop'
if (-not $env:LOCALAPPDATA) { throw 'LOCALAPPDATA is not set.' }
if ($env:VERA_APP_HOME -or $env:ORX_DATA_DIR -or $env:XDG_CONFIG_HOME -or $env:XDG_DATA_HOME) {
    throw 'A custom storage override is active. Reset its explicit location separately.'
}

$appRoot = [IO.Path]::GetFullPath((Join-Path $env:LOCALAPPDATA 'VERA'))
$backupRoot = [IO.Path]::GetFullPath((Join-Path $env:LOCALAPPDATA 'VERA-backups'))
$localRoot = [IO.Path]::GetFullPath($env:LOCALAPPDATA).TrimEnd('\') + '\'
if ($appRoot -ne ($localRoot + 'VERA') -or $backupRoot -ne ($localRoot + 'VERA-backups')) {
    throw 'The resolved reset paths are outside the VERA application folders.'
}
if (-not (Test-Path -LiteralPath $appRoot)) {
    Write-Output 'VERA already has no saved application state.'
    return
}

$running = Get-CimInstance Win32_Process | Where-Object {
    ($_.ExecutablePath -and $_.ExecutablePath.StartsWith($appRoot + '\', [StringComparison]::OrdinalIgnoreCase)) -or
    ($_.Name -eq 'msedgewebview2.exe' -and $_.CommandLine -and $_.CommandLine.Contains($appRoot + '\'))
}
if ($running) { throw "Close VERA and its running jobs before resetting (PID: $($running.ProcessId -join ', '))." }

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$destination = Join-Path $backupRoot $stamp
if (Test-Path -LiteralPath $destination) { throw 'The backup destination already exists.' }
New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null
Move-Item -LiteralPath $appRoot -Destination $destination
Write-Output "VERA reset complete. Previous state: $destination"
Write-Output 'Open VERA.exe to extract the current app and begin first-run setup.'
