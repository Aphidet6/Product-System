@echo off
REM Wrapper to run the PowerShell launcher from Explorer
SET ScriptPath=%~dp0run-site.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File "%ScriptPath%"