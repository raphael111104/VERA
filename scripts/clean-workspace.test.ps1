#requires -Version 7.2
$ErrorActionPreference = 'Stop'
$fixtureRoot = Join-Path ([IO.Path]::GetTempPath()) ('vera-cleanup-test-' + [guid]::NewGuid().ToString('N'))
$previousLocalAppData = $env:LOCALAPPDATA
function Assert([bool]$Condition, [string]$Message) {
    if (-not $Condition) { throw $Message }
}
function Write-Fixture([string]$Relative) {
    $path = Join-Path $fixtureRoot $Relative
    New-Item -ItemType Directory -Path (Split-Path -Parent $path) -Force | Out-Null
    [IO.File]::WriteAllText($path, 'fixture')
}
try {
    foreach ($relative in @('Cargo.toml', 'AGENTS.md', 'target/old-test.log',
        'ui/dist/index.html', 'ui/src/main.tsx', 'ui/node_modules/vite/package.json',
        'ui/node_modules/.vite/deps/cache.json', 'ui/tsconfig.tsbuildinfo',
        'dist/VERA.exe', 'dist/backups/old.exe',
        'appdata/VERA/data/research.sqlite', 'appdata/VERA/config/settings.json',
        'appdata/OpenResearch/compatibility.txt',
        'appdata/VERA/single-file/orx.exe.WebView2/EBWebView/Default/Cache/cache.bin',
        'appdata/VERA/single-file/orx.exe.WebView2/EBWebView/Default/Local Storage/keep.txt',
        'appdata/VERA/single-file/orx.exe.WebView2/EBWebView/Default/IndexedDB/keep.txt',
        'appdata/VERA/single-file/orx.exe.WebView2/EBWebView/Default/Cookies')) { Write-Fixture $relative }
    New-Item -ItemType Directory -Path (Join-Path $fixtureRoot 'scripts') -Force | Out-Null
    $script = Join-Path $fixtureRoot 'scripts/clean-workspace.ps1'
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'clean-workspace.ps1') -Destination $script
    & git -C $fixtureRoot init --quiet
    if ($LASTEXITCODE) { throw 'Fixture git init failed' }
    $env:LOCALAPPDATA = Join-Path $fixtureRoot 'appdata'
    $preview = & $script -BuildArtifacts -WebViewCache -RollbackPackages | ConvertFrom-Json
    Assert (-not $preview.Applied -and $preview.Files -ge 5) 'Preview did not inventory the requested targets'
    Assert (Test-Path -LiteralPath (Join-Path $fixtureRoot 'target/old-test.log')) 'Preview deleted a file'

    $applied = & $script -BuildArtifacts -WebViewCache -RollbackPackages -Apply | ConvertFrom-Json
    Assert $applied.Applied 'Apply was not recorded'
    foreach ($relative in @('target', 'dist/backups', 'ui/node_modules/.vite', 'ui/tsconfig.tsbuildinfo',
        'appdata/VERA/single-file/orx.exe.WebView2/EBWebView/Default/Cache')) {
        Assert (-not (Test-Path -LiteralPath (Join-Path $fixtureRoot $relative))) "Disposable target survived: $relative"
    }
    foreach ($relative in @('ui/dist/index.html', 'ui/src/main.tsx', 'ui/node_modules/vite/package.json',
        'dist/VERA.exe', 'appdata/VERA/data/research.sqlite', 'appdata/VERA/config/settings.json',
        'appdata/OpenResearch/compatibility.txt',
        'appdata/VERA/single-file/orx.exe.WebView2/EBWebView/Default/Local Storage/keep.txt',
        'appdata/VERA/single-file/orx.exe.WebView2/EBWebView/Default/IndexedDB/keep.txt',
        'appdata/VERA/single-file/orx.exe.WebView2/EBWebView/Default/Cookies')) {
        Assert (Test-Path -LiteralPath (Join-Path $fixtureRoot $relative)) "Protected file deleted: $relative"
    }

    Write-Fixture 'ui/tsconfig.tsbuildinfo'
    & git -C $fixtureRoot add -- ui/tsconfig.tsbuildinfo
    if ($LASTEXITCODE) { throw 'Fixture git add failed' }
    $rejected = $false
    try { & $script -Apply | Out-Null } catch { $rejected = $_.Exception.Message.Contains('tracked source') }
    Assert $rejected 'Tracked-file guard did not reject deletion'
    Assert (Test-Path -LiteralPath (Join-Path $fixtureRoot 'ui/tsconfig.tsbuildinfo')) 'Tracked file was removed'
    & git -C $fixtureRoot rm --cached --quiet -- ui/tsconfig.tsbuildinfo
    Remove-Item -LiteralPath (Join-Path $fixtureRoot 'ui/tsconfig.tsbuildinfo')

    # A junction/symlink must not redirect deletion into data outside a cache.
    $link = Join-Path $fixtureRoot 'ui/.tanstack'
    $protected = Join-Path $fixtureRoot 'appdata/VERA/data'
    $linkType = if ($IsWindows) { 'Junction' } else { 'SymbolicLink' }
    New-Item -ItemType $linkType -Path $link -Target $protected | Out-Null
    $rejected = $false
    try { & $script -Apply | Out-Null } catch { $rejected = $_.Exception.Message.Contains('Reparse point') }
    Assert $rejected 'Reparse-point guard did not reject redirected deletion'
    Assert (Test-Path -LiteralPath (Join-Path $protected 'research.sqlite')) 'Redirected target was modified'
    Remove-Item -LiteralPath $link -Force
    Write-Fixture 'target/cache/ordinary.tmp'
    New-Item -ItemType $linkType -Path (Join-Path $fixtureRoot 'target/keep-link') -Target $protected | Out-Null
    $partial = & $script -BuildArtifacts -Apply | ConvertFrom-Json
    Assert ($partial.SkippedLinks.Count -eq 1) 'Build fixture junction was not reported'
    Assert (-not (Test-Path -LiteralPath (Join-Path $fixtureRoot 'target/cache'))) 'Ordinary sibling was not cleaned'
    Assert (Test-Path -LiteralPath (Join-Path $protected 'research.sqlite')) 'Build fixture link target was modified'
    Remove-Item -LiteralPath (Join-Path $fixtureRoot 'target/keep-link') -Force
    Write-Output 'Cleanup safety checks passed: preview, allowlist, data preservation, tracked files, and reparse points.'
} finally {
    $env:LOCALAPPDATA = $previousLocalAppData
    $resolved = [IO.Path]::GetFullPath($fixtureRoot)
    $temporaryRoot = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar)
    if (-not $resolved.StartsWith($temporaryRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase) -or
        [IO.Path]::GetFileName($resolved) -notlike 'vera-cleanup-test-*') { throw 'Invalid fixture cleanup path' }
    # Remove a failed-test junction before removing the fixture tree.
    $link = Join-Path $fixtureRoot 'ui/.tanstack'
    if ((Test-Path -LiteralPath $link) -and ((Get-Item -LiteralPath $link -Force).Attributes -band [IO.FileAttributes]::ReparsePoint)) {
        Remove-Item -LiteralPath $link -Force
    }
    $link = Join-Path $fixtureRoot 'target/keep-link'
    if ((Test-Path -LiteralPath $link) -and ((Get-Item -LiteralPath $link -Force).Attributes -band [IO.FileAttributes]::ReparsePoint)) {
        Remove-Item -LiteralPath $link -Force
    }
    if (Test-Path -LiteralPath $resolved) { Remove-Item -LiteralPath $resolved -Recurse -Force }
}
