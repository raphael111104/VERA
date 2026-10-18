param(
    [Parameter(Mandatory = $true)][string]$ApplicationPath,
    [string]$ServerPath = "",
    [string]$CompilerPath = "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe",
    [string]$OutputDirectory = "target\installer-candidate",
    [string]$CacheDirectory = "target\installer-downloads"
)

$ErrorActionPreference = "Stop"
$workspace = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
function AbsolutePath([string]$Path) {
    if ([IO.Path]::IsPathRooted($Path)) { return [IO.Path]::GetFullPath($Path) }
    return [IO.Path]::GetFullPath((Join-Path $workspace $Path))
}
$ApplicationPath = AbsolutePath $ApplicationPath
$OutputDirectory = AbsolutePath $OutputDirectory
$CacheDirectory = AbsolutePath $CacheDirectory
if (-not (Test-Path -LiteralPath $ApplicationPath -PathType Leaf)) { throw "Application not found: $ApplicationPath" }
if (-not (Test-Path -LiteralPath $CompilerPath -PathType Leaf)) { throw "Inno Setup compiler not found: $CompilerPath" }
New-Item -ItemType Directory -Path $OutputDirectory,$CacheDirectory -Force | Out-Null
# Use a new staging directory per build; never copy a user's data/configuration.
$stage = Join-Path $OutputDirectory ("staging-" + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $stage,(Join-Path $stage 'prerequisites'),(Join-Path $stage 'licenses'),(Join-Path $stage 'runtime\opencode') -Force | Out-Null

function Download([string]$Url, [string]$Name, [string]$Sha256 = "") {
    $path = Join-Path $CacheDirectory $Name
    if (-not (Test-Path -LiteralPath $path) -or ($Sha256 -and (Get-FileHash -LiteralPath $path).Hash -ne $Sha256)) {
        & curl.exe --fail --location --connect-timeout 20 --max-time 900 --retry 3 $Url --output $path
        if ($LASTEXITCODE -ne 0) { throw "Download failed: $Url" }
    }
    if ($Sha256 -and (Get-FileHash -LiteralPath $path).Hash -ne $Sha256) { throw "SHA-256 mismatch: $Name" }
    return $path
}
function VerifiedPublisher([string]$Path, [string]$Publisher) {
    $signature = Get-AuthenticodeSignature -LiteralPath $Path
    if ($signature.Status -ne 'Valid' -or $signature.SignerCertificate.Subject -notlike "*$Publisher*") {
        throw "Invalid publisher signature: $Path"
    }
}

$gitVersion = '2.56.0.2'
$gitUrl = "https://github.com/git-for-windows/git/releases/download/v2.56.0.windows.2/PortableGit-$gitVersion-64-bit.7z.exe"
$git = Download $gitUrl "PortableGit-$gitVersion-64-bit.7z.exe" '075e158ef8e1f0ab80b347e245405d3eca735c2dc88fd8e032e137d0ca61f61b'
$agentVersion = '1.19.0'
$agentUrl = "https://github.com/anomalyco/opencode/releases/download/v$agentVersion/opencode-windows-x64-baseline.zip"
$agent = Download $agentUrl 'opencode-windows-x64-baseline.zip' '2759ca3449fe946d82da3be43d2e85332127399686aafceaff153b90c3079c56'
$webviewUrl = 'https://go.microsoft.com/fwlink/?linkid=2124701'
$webview = Download $webviewUrl 'MicrosoftEdgeWebView2RuntimeInstallerX64.exe'
VerifiedPublisher $webview 'O=Microsoft Corporation'
Copy-Item -LiteralPath $webview -Destination (Join-Path $stage 'prerequisites')
Copy-Item -LiteralPath $ApplicationPath -Destination (Join-Path $stage 'VERA.exe')
if ($ServerPath) { Copy-Item -LiteralPath (AbsolutePath $ServerPath) -Destination (Join-Path $stage 'orx.exe') }
if ($ServerPath) {
    $loaderPath = Join-Path (Split-Path -Parent (AbsolutePath $ServerPath)) 'WebView2Loader.dll'
    if (-not (Test-Path -LiteralPath $loaderPath)) {
        $cargoHome = if ($env:CARGO_HOME) { $env:CARGO_HOME } else { Join-Path $env:USERPROFILE '.cargo' }
        $loader = Get-ChildItem -Path (Join-Path $cargoHome 'registry\src\*\webview2-com-sys-*\x64\WebView2Loader.dll') -File | Select-Object -First 1
        if (-not $loader) { throw 'WebView2Loader.dll is missing for the sibling server package' }
        $loaderPath = $loader.FullName
    }
    Copy-Item -LiteralPath $loaderPath -Destination (Join-Path $stage 'WebView2Loader.dll')
}
$gitDirectory = Join-Path $stage 'runtime\git'
$extractor = Start-Process -FilePath $git -ArgumentList @('-y', ('-o"' + $gitDirectory + '"')) -WindowStyle Hidden -PassThru -Wait
if ($extractor.ExitCode -ne 0) { throw "PortableGit extraction failed: $($extractor.ExitCode)" }
Expand-Archive -LiteralPath $agent -DestinationPath (Join-Path $stage 'runtime\opencode')
if (-not (Test-Path -LiteralPath (Join-Path $gitDirectory 'bin\bash.exe'))) { throw 'Bundled Bash is missing' }
& (Join-Path $gitDirectory 'cmd\git.exe') --version
if ($LASTEXITCODE -ne 0) { throw 'Bundled Git failed' }
& (Join-Path $stage 'runtime\opencode\opencode.exe') --version
if ($LASTEXITCODE -ne 0) { throw 'Bundled OpenCode failed' }
# Git's own license/source-offer files stay intact in runtime/git.
$agentLicense = Download "https://raw.githubusercontent.com/anomalyco/opencode/v$agentVersion/LICENSE" "opencode-$agentVersion-LICENSE.txt"
Copy-Item -LiteralPath $agentLicense -Destination (Join-Path $stage 'licenses\OpenCode-LICENSE.txt')
Copy-Item -LiteralPath (Join-Path $workspace 'LICENSE') -Destination (Join-Path $stage 'licenses\VERA-LICENSE.txt')
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'MULAI-DI-SINI.txt') -Destination $stage
@"
VERA includes Git for Windows $gitVersion (GPLv2, with licenses for bundled components retained in runtime/git) and OpenCode $agentVersion (MIT).
Exact corresponding Git for Windows source: https://github.com/git-for-windows/git/releases/tag/v2.56.0.windows.2
Build scripts and source for bundled Git components: https://github.com/git-for-windows/build-extra
OpenCode source: https://github.com/anomalyco/opencode/tree/v$agentVersion
Microsoft Edge WebView2 Runtime is distributed under Microsoft's runtime terms: https://developer.microsoft.com/microsoft-edge/webview2/
These tools run privately for VERA; installation does not add them to the system PATH.
"@ | Set-Content -LiteralPath (Join-Path $stage 'licenses\THIRD-PARTY-NOTICES.txt') -Encoding UTF8

$version = (Select-String -LiteralPath (Join-Path $workspace 'Cargo.toml') -Pattern '^version = "([^"]+)"' | Select-Object -First 1).Matches[0].Groups[1].Value
$files = @(Get-ChildItem -LiteralPath $stage -Recurse -File | ForEach-Object {
    [ordered]@{ path = $_.FullName.Substring($stage.Length + 1).Replace('\','/'); bytes = $_.Length; sha256 = (Get-FileHash -LiteralPath $_.FullName).Hash.ToLowerInvariant() }
})
[ordered]@{
    product = 'VERA'; version = $version; architecture = 'windows-x64'; builtAt = (Get-Date).ToUniversalTime().ToString('o')
    dependencies = @(
        @{ name = 'Git for Windows'; version = $gitVersion; source = $gitUrl; sha256 = (Get-FileHash $git).Hash.ToLowerInvariant() },
        @{ name = 'OpenCode'; version = $agentVersion; source = $agentUrl; sha256 = (Get-FileHash $agent).Hash.ToLowerInvariant() },
        @{ name = 'WebView2 Evergreen Standalone'; version = (Get-Item $webview).VersionInfo.ProductVersion; source = $webviewUrl; sha256 = (Get-FileHash $webview).Hash.ToLowerInvariant() }
    ); files = $files
} | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $stage 'package-manifest.json') -Encoding UTF8
& $CompilerPath "/DAppVersion=$version" "/DSourceDir=$stage" "/DOutputDir=$OutputDirectory" (Join-Path $PSScriptRoot 'VERA.iss')
if ($LASTEXITCODE -ne 0) { throw 'Installer compilation failed' }
Copy-Item -LiteralPath (Join-Path $stage 'package-manifest.json') -Destination $OutputDirectory -Force
Write-Output "Installer created: $(Join-Path $OutputDirectory 'VERA-Setup.exe')"
Write-Output "Staging: $stage"
