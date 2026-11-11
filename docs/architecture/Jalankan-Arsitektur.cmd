@echo off
setlocal
if not exist "%~dp0index.html" (
  echo Berkas index.html tidak ditemukan di folder arsitektur ini.
  pause
  exit /b 1
)
start "" "%~dp0index.html"
exit /b %errorlevel%
