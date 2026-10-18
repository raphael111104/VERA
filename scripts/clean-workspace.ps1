#requires -Version 7.2
[CmdletBinding()]
param(
    [switch]$Apply,
    [switch]$BuildArtifacts,
    [switch]$WebViewCache,
    [switch]$RollbackPackages
)

$ErrorActionPreference = 'Stop'
$workspace = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
if (-not (Test-Path -LiteralPath (Join-Path $workspace 'Cargo.toml')) -or
    -not (Test-Path -LiteralPath (Join-Path $workspace 'AGENTS.md'))) {
    throw 'Run this script from an intact VERA checkout.'
}
$appRoot = if ($env:LOCALAPPDATA) { [IO.Path]::GetFullPath((Join-Path $env:LOCALAPPDATA 'VERA')) } else { $null }
$candidates = [Collections.Generic.List[object]]::new()
$skippedLinks = [Collections.Generic.List[string]]::new()
function Add-Candidate([string]$Root, [string]$Relative) {
    $path = [IO.Path]::GetFullPath((Join-Path $Root $Relative))
    if (-not $path.StartsWith($Root + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
        throw "Cleanup target escapes its root: $path"
    }
    if (-not (Test-Path -LiteralPath $path)) { return }
    # Check every ancestor, including the allowed root, before descending.
    $ancestor = Get-Item -LiteralPath $path -Force
    while ($null -ne $ancestor) {
        if ($ancestor.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw "Reparse point rejected: $($ancestor.FullName)" }
        $ancestor = if ($ancestor.PSIsContainer) { $ancestor.Parent } else { $ancestor.Directory }
    }
    $items = @(Get-Item -LiteralPath $path -Force)
    if ($items[0].PSIsContainer) { $items += @(Get-ChildItem -LiteralPath $path -Recurse -Force) }
    if ($items | Where-Object { $_.Attributes -band [IO.FileAttributes]::ReparsePoint }) {
        throw "Cleanup target contains a reparse point: $path"
    }
    if ($Root -eq $workspace) {
        $tracked = @(& git -C $workspace ls-files -- $Relative)
        if ($LASTEXITCODE -ne 0) { throw 'Could not check tracked files; cleanup cancelled.' }
        if ($tracked.Count) { throw "Cleanup target contains tracked source: $path" }
    }
    $files = @($items | Where-Object { -not $_.PSIsContainer })
    $bytes = ($files | Measure-Object Length -Sum).Sum
    $candidates.Add([pscustomobject]@{ Path = $path; Files = $files.Count; Bytes = [long]$bytes })
}

# Browser smoke fixtures can contain Windows-created junctions. Never remove
# those links or descend through them: plan only their ordinary siblings.
function Add-BuildArtifacts([string]$Relative) {
    $path = [IO.Path]::GetFullPath((Join-Path $workspace $Relative))
    if (-not $path.StartsWith($workspace + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
        throw "Build target escapes the workspace: $path"
    }
    if (-not (Test-Path -LiteralPath $path)) { return }
    $item = Get-Item -LiteralPath $path -Force
    if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) { $skippedLinks.Add($path); return }
    $links = if ($item.PSIsContainer) { @(Get-ChildItem -LiteralPath $path -Recurse -Force -Attributes ReparsePoint) } else { @() }
    if ($links.Count) {
        foreach ($child in Get-ChildItem -LiteralPath $path -Force) {
            Add-BuildArtifacts ($child.FullName.Substring($workspace.Length + 1))
        }
    } else { Add-Candidate $workspace $Relative }
}

foreach ($relative in @('ui/.tanstack', 'ui/.vite', 'ui/.vite-temp', 'ui/tsconfig.tsbuildinfo',
    'ui/node_modules/.vite', 'ui/node_modules/.vite-temp', 'ui/node_modules/.cache',
    'ui/coverage', 'ui/playwright-report', 'ui/test-results', 'scripts/__pycache__')) {
    Add-Candidate $workspace $relative
}
if ($BuildArtifacts) {
    foreach ($relative in @('target', 'windows/launcher/target')) { Add-BuildArtifacts $relative }
}
if ($RollbackPackages) { Add-Candidate $workspace 'dist/backups' }
if ($WebViewCache -and $appRoot) {
    $profile = 'single-file/orx.exe.WebView2/EBWebView'
    foreach ($relative in @('ShaderCache', 'GrShaderCache', 'GraphiteDawnCache', 'GPUPersistentCache',
        'Default/Cache', 'Default/Code Cache', 'Default/GPUCache', 'Default/DawnGraphiteCache',
        'Default/DawnWebGPUCache', 'Default/Shared Dictionary/cache')) {
        Add-Candidate $appRoot "$profile/$relative"
    }
}

if ($Apply -and $candidates.Count) {
    if ($IsWindows) {
        $active = @(Get-CimInstance Win32_Process | Where-Object {
            ($BuildArtifacts -and $_.Name -in @('cargo.exe', 'rustc.exe')) -or
            ($_.Name -in @('VERA.exe', 'orx.exe', 'node.exe', 'msedgewebview2.exe') -and
                (($_.ExecutablePath -and $_.ExecutablePath.StartsWith($workspace + '\', [StringComparison]::OrdinalIgnoreCase)) -or
                 ($_.CommandLine -and $_.CommandLine.Contains($workspace)) -or
                 ($WebViewCache -and $appRoot -and $_.CommandLine -and $_.CommandLine.Contains($appRoot))))
        })
        if ($active.Count) { throw ('Stop VERA/build processes before cleanup: ' + (($active | ForEach-Object { "$($_.Name):$($_.ProcessId)" }) -join ', ')) }
    }
    foreach ($candidate in $candidates) { Remove-Item -LiteralPath $candidate.Path -Recurse -Force }
}
[pscustomobject]@{
    Applied = [bool]$Apply
    Files = [long](($candidates | Measure-Object Files -Sum).Sum)
    Bytes = [long](($candidates | Measure-Object Bytes -Sum).Sum)
    Targets = $candidates.ToArray()
    SkippedLinks = $skippedLinks.ToArray()
} | ConvertTo-Json -Depth 4
