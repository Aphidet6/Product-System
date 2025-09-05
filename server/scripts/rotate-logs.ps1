<#
rotate-logs.ps1

Rotates and gzips logs in the server/logs folder.

Usage:
  # run now with defaults (keep 7 archives)
  .\rotate-logs.ps1

  # run for a specific logs folder and keep 14 archives
  .\rotate-logs.ps1 -LogsDir "C:\path\to\project\server\logs" -Keep 14

This script will:
- compress current actions.jsonl and actions.log into timestamped .gz files
- truncate the original files (create empty files)
- keep the most recent N archive files and delete older ones

#>

param(
  [string]$LogsDir = (Join-Path $PSScriptRoot '..\logs'),
  [int]$Keep = 7
)

function Write-Log($m){ Write-Host "[rotate-logs] $m" }

if (-not (Test-Path $LogsDir)){
  Write-Log "Logs directory does not exist: $LogsDir"
  exit 1
}

Set-Location $LogsDir

function Compress-Gzip([string]$src, [string]$dest){
  try{
    $buffer = 8192
    $srcStream = [System.IO.File]::OpenRead($src)
    $destStream = [System.IO.File]::Create($dest)
    $gzipStream = New-Object System.IO.Compression.GZipStream($destStream, [System.IO.Compression.CompressionLevel]::Optimal)
    $bytes = New-Object byte[] $buffer
    while(($read = $srcStream.Read($bytes, 0, $buffer)) -gt 0){ $gzipStream.Write($bytes,0,$read) }
    $gzipStream.Close(); $srcStream.Close(); $destStream.Close();
    return $true
  } catch { Write-Log "Compress failed: $_"; return $false }
}

$timestamp = (Get-Date).ToString('yyyyMMdd-HHmmss')

$pairs = @(
  @{ file='actions.jsonl'; pattern='actions-*.jsonl.gz' },
  @{ file='actions.log'; pattern='actions-*.log.gz' }
)

foreach ($p in $pairs){
  $f = $p.file
  if (Test-Path $f -PathType Leaf){
    $size = (Get-Item $f).Length
    if ($size -gt 0){
      $dest = "$($f.Replace('.','-'))-$timestamp.gz"
      # normalize dest name: actions.jsonl -> actions-jsonl-<ts>.gz => then rename to .jsonl.gz
      $dest = $f -replace '\.','-' -replace '^actions-','actions-'
      $dest = "$($f -replace '\.','-')-$timestamp.gz"
      # better dest using base name
      $base = [System.IO.Path]::GetFileNameWithoutExtension($f)
      $ext = [System.IO.Path]::GetExtension($f)
      $dest = "${base}-${timestamp}${ext}.gz"
      Write-Log "Compressing $f -> $dest"
      $ok = Compress-Gzip $f $dest
      if ($ok){
        # truncate original
        try{ Set-Content -Path $f -Value $null -Encoding UTF8; Write-Log ("Truncated " + $f) } catch { Write-Log ("Failed to truncate " + $f + ": " + $_.ToString()) }
      }
    } else { Write-Log "Skipping $f (empty)" }
  } else { Write-Log "Not found: $f" }
}

# cleanup older archives
Write-Log "Cleaning up older archives, keeping last $Keep files"
Get-ChildItem -Path $LogsDir -Filter 'actions-*.jsonl.gz' -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -Skip $Keep | ForEach-Object { Write-Log ("Deleting " + $_.Name); Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue }
Get-ChildItem -Path $LogsDir -Filter 'actions-*.log.gz' -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -Skip $Keep | ForEach-Object { Write-Log ("Deleting " + $_.Name); Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue }

Write-Log "Rotate completed"
