<#
Simple launcher for the Product-System app.
- Builds the client (production) so the server can serve the SPA
- Starts the server (npm run dev) in a new PowerShell window
- Opens the default browser to http://localhost:4000

Double-click the `run-site.bat` wrapper to run this script from Explorer.
#>

$ErrorActionPreference = 'Stop'

function Write-Log($msg){ Write-Host "[run-site] $msg" }

$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
Write-Log "Workspace root: $root"

# Build client
$clientDir = Join-Path $root 'client'
if (Test-Path $clientDir) {
  Write-Log "Building client... (this may take a few seconds)"
  Push-Location $clientDir
  try {
    & npm run build
  } catch {
    Write-Log "Client build failed: $_"
    Pop-Location
    exit 1
  }
  Pop-Location
} else {
  Write-Log "Client folder not found: $clientDir"
}

# Start server in a new PowerShell window so it keeps running
$serverDir = Join-Path $root 'server'
if (-not (Test-Path $serverDir)){
  Write-Log "Server folder not found: $serverDir"
  exit 1
}

Write-Log "Starting server (npm run dev) in a new terminal window..."
# Use Start-Process to open a new PowerShell window and run npm run dev in the server dir
Start-Process -FilePath powershell -ArgumentList "-NoExit","-Command","Set-Location -Path '$serverDir'; npm run dev" -WorkingDirectory $serverDir

# Give server a moment to start, then open the app in the default browser (localhost)
Start-Sleep -Seconds 1
Write-Log "Opening http://localhost:4000 in the default browser..."
Start-Process 'http://localhost:4000'

Write-Log "Done. Check the newly opened terminal for server logs."
