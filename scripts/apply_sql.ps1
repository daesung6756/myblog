<#
  apply_sql.ps1

  사용법:
    # 환경변수에 DATABASE_URL이 설정되어 있으면 파일 목록만 전달
    .\scripts\apply_sql.ps1 -Files @("prisma/policies/disable_public_comment_delete.sql", "prisma/policies/delete_comment_with_password.sql")

    # 또는 명시적으로 URL 전달
    .\scripts\apply_sql.ps1 -DatabaseUrl "postgresql://postgres:...@db.example.supabase.co:5432/postgres" -Files @("prisma/blog_schema.sql")

  설명:
    - 지정한 SQL 파일들을 순서대로 psql로 실행합니다.
    - psql이 설치되어 있어야 합니다. (Postgres client 또는 Supabase CLI로 연결 가능)
    - Supabase의 IPv6 전용 엔드포인트에서 네트워크 연결 문제가 있으면 에러가 발생합니다.
#>

param(
  [string]$DatabaseUrl = $env:DATABASE_URL,
  [string[]]$Files = @(
    "prisma/policies/disable_public_comment_delete.sql",
    "prisma/policies/delete_comment_with_password.sql"
  ),
  [switch]$VerboseOutput
)

function ExitWithError($msg) {
  Write-Host "ERROR: $msg" -ForegroundColor Red
  exit 1
}

if (-not $DatabaseUrl) {
  $DatabaseUrl = Read-Host "DATABASE_URL not set. Paste the full postgres connection string"
  if (-not $DatabaseUrl) { ExitWithError "No DATABASE_URL provided." }
}

# Ensure psql is available
$psql = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psql) {
  Write-Host "psql not found in PATH. Please install PostgreSQL client tools or use Supabase CLI." -ForegroundColor Yellow
  ExitWithError "psql is required to run this script." 
}

Write-Host "Using DATABASE_URL: (hidden for safety)" -ForegroundColor Cyan

# Quick connectivity test
Write-Host "Testing DB connection..." -ForegroundColor Cyan
try {
  $test = & psql "$DatabaseUrl" -c "SELECT 1;" 2>&1
  if ($LASTEXITCODE -ne 0) {
    Write-Host $test
    ExitWithError "Unable to connect to the database. Check network/credentials. If your Supabase project has IPv6-only address, ensure your machine has IPv6 egress." 
  }
} catch {
  ExitWithError $_.Exception.Message
}

Write-Host "Connection OK. Executing SQL files:" -ForegroundColor Green

foreach ($file in $Files) {
  $full = Join-Path (Get-Location) $file
  if (-not (Test-Path $full)) {
    Write-Host "- Skipping missing file: $file" -ForegroundColor Yellow
    continue
  }

  Write-Host "- Running $file" -ForegroundColor Cyan
  try {
    $out = & psql "$DatabaseUrl" -f $full 2>&1
    if ($LASTEXITCODE -ne 0) {
      Write-Host $out
      ExitWithError "psql returned exit code $LASTEXITCODE while applying $file"
    } else {
      if ($VerboseOutput) { Write-Host $out }
      Write-Host "  Applied: $file" -ForegroundColor Green
    }
  } catch {
    ExitWithError $_.Exception.Message
  }
}

Write-Host "All done." -ForegroundColor Green
