# Push env vars from scripts/vercel-env.local to Vercel project ar-crm-iota
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$envFile = Join-Path $root "scripts\vercel-env.local"

if (-not (Test-Path $envFile)) {
  Write-Host "Create scripts/vercel-env.local from scripts/vercel-env.example" -ForegroundColor Yellow
  Write-Host "Paste your Neon DATABASE_URL (Pooled) from https://console.neon.tech" -ForegroundColor Yellow
  exit 1
}

Set-Location $root
$lines = Get-Content $envFile | Where-Object { $_ -match '^\s*[A-Z_]+\s*=' -and $_ -notmatch '^\s*#' }

foreach ($line in $lines) {
  if ($line -match '^\s*([A-Z_]+)\s*=\s*(.*)$') {
    $key = $matches[1]
    $value = $matches[2].Trim().Trim('"').Trim("'")
    if (-not $value) { continue }
    Write-Host "Adding $key ..."
    $value | npx vercel env add $key production --force 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
      $value | npx vercel env add $key production 2>&1
    }
  }
}

Write-Host "Done. Redeploy: npx vercel deploy --prod" -ForegroundColor Green
