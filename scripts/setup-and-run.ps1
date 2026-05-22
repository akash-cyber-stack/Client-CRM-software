# Sales Lead CRM - Setup and Run
# Usage: .\scripts\setup-and-run.ps1 -PostgresPassword "your_password"

param(
    [Parameter(Mandatory = $true)]
    [string]$PostgresPassword
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"

$dbUrl = "postgresql://postgres:${PostgresPassword}@localhost:5432/sales_lead_crm?schema=public"
$envContent = @"
PORT=5000
NODE_ENV=development
DATABASE_URL="$dbUrl"
JWT_SECRET=dev-secret-sales-lead-crm-2026
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
GOOGLE_WEBHOOK_SECRET=google-secret-demo
META_WEBHOOK_VERIFY_TOKEN=meta-verify-token-demo
META_WEBHOOK_SECRET=meta-secret-demo
IVR_WEBHOOK_SECRET=ivr-secret-demo
ADMIN_EMAIL=admin@salesleadcrm.com
ADMIN_PASSWORD=Admin@123
"@

Set-Content -Path (Join-Path $backend ".env") -Value $envContent

$psql = "D:\Program Files\PostgreSQL\18\bin\psql.exe"
if (Test-Path $psql) {
    $env:PGPASSWORD = $PostgresPassword
    & $psql -U postgres -h localhost -c "CREATE DATABASE sales_lead_crm;" 2>$null
}

Push-Location $backend
npx prisma generate
npx prisma db push
npm run db:seed
Pop-Location

Write-Host "`nStarting backend on http://localhost:5000 ..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backend'; npm run dev"

Write-Host "Starting frontend on http://localhost:5173 ..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontend'; npm run dev"

Write-Host "`nDone! Open http://localhost:5173"
Write-Host "Login: admin@salesleadcrm.com / Admin@123"
