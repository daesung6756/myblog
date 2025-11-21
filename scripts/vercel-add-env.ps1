<#
vercel-add-env.ps1

Reads key=value lines from .env.local and adds them to Vercel using the Vercel CLI.
Usage:
  - Run from the project root where .env.local exists.
  - Requires `vercel` CLI installed and `vercel login` already performed.
  - By default adds each variable for production, preview and development environments.

Security warning:
  This script will send values from your .env.local to Vercel. Do NOT commit .env.local to git. Review the file before running.
#>

param(
    [string]$EnvTargets = "production,preview,development",
    [switch]$DryRun
)

$envs = $EnvTargets -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ }
$envFile = Join-Path (Get-Location) '.env.local'

if (-not (Test-Path $envFile)) {
    Write-Host ".env.local not found in the current directory. Create it or run this from project root." -ForegroundColor Yellow
    exit 1
}

if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "Vercel CLI not found. Install with: npm i -g vercel" -ForegroundColor Yellow
    exit 1
}

# Parse .env.local
$lines = Get-Content $envFile | ForEach-Object { $_.Trim() } | Where-Object { $_ -and -not ($_ -like '#*') }
$vars = @{}
foreach ($line in $lines) {
    if ($line -match '^(?<k>[^=]+)=(?<v>.*)$') {
        $k = $matches['k'].Trim()
        $v = $matches['v'].Trim()
        # Remove surrounding quotes if present
        if ($v.StartsWith('"') -and $v.EndsWith('"')) { $v = $v.Substring(1, $v.Length - 2) }
        if ($v.StartsWith("'") -and $v.EndsWith("'")) { $v = $v.Substring(1, $v.Length - 2) }
        $vars[$k] = $v
    }
}

if ($vars.Count -eq 0) {
    Write-Host "No variables found in .env.local" -ForegroundColor Yellow
    exit 0
}

Write-Host "Found the following variables in .env.local:" -ForegroundColor Cyan
$vars.Keys | ForEach-Object { Write-Host " - $_" }
Write-Host "Target Vercel environments: $($envs -join ', ')" -ForegroundColor Cyan

$confirm = Read-Host "Proceed to add these variables to Vercel? (y/n)"
if ($confirm -ne 'y') {
    Write-Host "Aborted by user." -ForegroundColor Yellow
    exit 0
}

foreach ($envName in $envs) {
    foreach ($k in $vars.Keys) {
        $v = $vars[$k]
        Write-Host "Adding $k to Vercel env '$envName'..."
        if ($DryRun) {
            Write-Host "Dry run: would run -> echo [value-hidden] | vercel env add $k $envName" -ForegroundColor Gray
            continue
        }

        # Use cmd.exe echo to pipe the value to vercel env add. This works in many environments.
        # For very large values or special characters you may need to add manually via `vercel env add`.
        $escapedValue = $v -replace '"', '"' # keep as-is; cmd echo will include newline
        $cmd = "cmd /c echo $escapedValue | vercel env add $k $envName"
        try {
            $proc = Start-Process -FilePath cmd -ArgumentList "/c echo $escapedValue | vercel env add $k $envName" -NoNewWindow -Wait -PassThru -RedirectStandardOutput "vercel_add_${k}_${envName}.log" -RedirectStandardError "vercel_add_${k}_${envName}.err"
            # Show a short message and keep logs for debugging
            Write-Host "  -> launched, logs: vercel_add_${k}_${envName}.log" -ForegroundColor Green
        } catch {
            Write-Host "  -> failed to run vercel command for $k ($envName): $_" -ForegroundColor Red
        }
    }
}

Write-Host "Done. Check the Vercel dashboard or the created log files for results." -ForegroundColor Green
