; VERA-Setup.exe: a per-user install of the Windows desktop app
; with a Start menu entry, private tools and an offline WebView2 prerequisite.
;
;   powershell -File windows/build-installer.ps1 -ApplicationPath <VERA.exe>
;
; See docs/windows.md.

#ifndef AppVersion
  #error Pass /DAppVersion=<version>
#endif
#ifndef SourceDir
  #error Pass /DSourceDir=<directory holding VERA.exe and orx.exe>
#endif
#ifndef OutputDir
  #define OutputDir "."
#endif
#if !FileExists(SourceDir + "\prerequisites\MicrosoftEdgeWebView2RuntimeInstallerX64.exe")
  #error Build with windows/build-installer.ps1: the offline WebView2 installer is required.
#endif
#if !FileExists(SourceDir + "\runtime\git\cmd\git.exe") || !FileExists(SourceDir + "\runtime\opencode\opencode.exe")
  #error The installer must contain its private Git and OpenCode runtimes.
#endif

; Must match set_taskbar_identity in src/commands/app.rs.
#define AppUserModelID "alphaXiv.OpenResearch"

[Setup]
; Never change: Windows tells installs of the same app apart by this id.
AppId={{E9099BE3-5087-4A2A-9296-4DC836929049}
AppName=VERA
AppVersion={#AppVersion}
AppPublisher=VERA
; Per-user and writable, so orx.exe can update itself in place without admin.
; Existing installs keep their folder through the stable AppId and UsePreviousAppDir.
DefaultDirName={localappdata}\Programs\VERA
UsePreviousAppDir=yes
DisableDirPage=no
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
MinVersion=10.0
OutputDir={#OutputDir}
OutputBaseFilename=VERA-Setup
SetupIconFile=VERA.ico
UninstallDisplayIcon={app}\VERA.exe
UninstallDisplayName=VERA
; The app's single-instance mutex (src/commands/app.rs): replacing files under a
; running app would kill it without its quit path, which stops the agents.
AppMutex=Local\OpenResearchApp
Compression=lzma2
SolidCompression=yes
CompressionThreads=2
WizardStyle=modern

[Tasks]
Name: desktopicon; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "{#SourceDir}\VERA.exe"; DestDir: "{app}"; Flags: ignoreversion
#if FileExists(SourceDir + "\orx.exe")
Source: "{#SourceDir}\orx.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "{#SourceDir}\WebView2Loader.dll"; DestDir: "{app}"; Flags: ignoreversion
#endif
Source: "{#SourceDir}\runtime\*"; DestDir: "{app}\runtime"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "{#SourceDir}\licenses\*"; DestDir: "{app}\licenses"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "{#SourceDir}\package-manifest.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "{#SourceDir}\MULAI-DI-SINI.txt"; DestDir: "{app}"; Flags: ignoreversion
Source: "{#SourceDir}\prerequisites\MicrosoftEdgeWebView2RuntimeInstallerX64.exe"; Flags: dontcopy

[Icons]
Name: "{autoprograms}\VERA"; Filename: "{app}\VERA.exe"; AppUserModelID: "{#AppUserModelID}"
Name: "{autodesktop}\VERA"; Filename: "{app}\VERA.exe"; AppUserModelID: "{#AppUserModelID}"; Tasks: desktopicon

[Run]
Filename: "{app}\VERA.exe"; Description: "{cm:LaunchProgram,VERA}"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
; WebView2's profile, and what orx.exe's self-update leaves beside itself.
Type: filesandordirs; Name: "{app}\orx.exe.WebView2"
Type: files; Name: "{app}\orx.exe.*.old"
Type: filesandordirs; Name: "{app}\.orx-update-*"

[Code]
const
  WebView2ClientKey = 'Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}';

function HasWebView2Version(RootKey: Integer; SubKey: String): Boolean;
var
  Version: String;
begin
  Result := RegQueryStringValue(RootKey, SubKey, 'pv', Version)
    and (Version <> '') and (Version <> '0.0.0.0');
end;

// Microsoft's documented check: a machine-wide or a per-user runtime.
function WebView2Installed: Boolean;
begin
  Result := HasWebView2Version(HKLM, 'SOFTWARE\WOW6432Node\' + WebView2ClientKey)
    or HasWebView2Version(HKCU, 'Software\' + WebView2ClientKey);
end;

function PrepareToInstall(var NeedsRestart: Boolean): String;
var
  ResultCode: Integer;
begin
  Result := '';
  if WebView2Installed then
    Exit;
  // The complete, Microsoft-signed installer is inside this package. No network
  // download and no separate dependency installation is required by the user.
  WizardForm.StatusLabel.Caption := 'Menyiapkan komponen tampilan VERA...';
  try
    ExtractTemporaryFile('MicrosoftEdgeWebView2RuntimeInstallerX64.exe');
    if not Exec(ExpandConstant('{tmp}\MicrosoftEdgeWebView2RuntimeInstallerX64.exe'),
      '/silent /install', '', SW_HIDE, ewWaitUntilTerminated, ResultCode) then
      Result := 'Komponen tampilan tidak dapat dijalankan. Tutup aplikasi lain lalu ulangi pemasangan.'
    else if not WebView2Installed then
      Result := 'Komponen tampilan belum siap (kode ' + IntToStr(ResultCode) +
        '). Mulai ulang Windows lalu jalankan installer VERA kembali.';
  except
    Result := 'Komponen tampilan tidak dapat disiapkan. Jalankan kembali installer VERA.';
  end;
end;
