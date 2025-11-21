# Scans package.json dependencies/devDependencies and looks for their literal names in source files
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\check-unused-deps.ps1

Set-StrictMode -Version Latest

if ($PSScriptRoot) {
    $repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
} else {
    $repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
}
Set-Location $repoRoot

$pkgJsonPath = Join-Path $repoRoot 'package.json'
if (-not (Test-Path $pkgJsonPath)) {
    Write-Error "package.json not found at $pkgJsonPath"
    exit 2
}

$pkg = Get-Content $pkgJsonPath -Raw | ConvertFrom-Json
$deps = @()
if ($pkg.dependencies) { $deps += $pkg.dependencies.PSObject.Properties.Name }
if ($pkg.devDependencies) { $deps += $pkg.devDependencies.PSObject.Properties.Name }
$deps = $deps | Sort-Object -Unique

# File types to search
$include = '*.ts','*.tsx','*.js','*.jsx','*.mjs','*.cjs','*.md','*.mdx','*.html','*.css'
# Paths to exclude
$excludeDirs = @('node_modules','dist','.next','.git','.vercel')

function Get-SearchFiles {
    Get-ChildItem -Recurse -File -Include $include -ErrorAction SilentlyContinue |
    Where-Object { 
        foreach ($d in $excludeDirs) { if ($_.FullName -like "*\\$d\\*") { return $false } }
        return $true
    }
}

$files = Get-SearchFiles
if (-not $files) { Write-Error "No source files found to search."; exit 3 }

$used = @()
$unused = @()

Write-Host "Scanning $($deps.Count) packages across $($files.Count) files...`n"

foreach ($dep in $deps) {
    # Search for common import/require patterns and occurrences of the package name
    $pattern1 = "from '" + $dep + "'"
    $pattern2 = 'from "' + $dep + '"'
    $pattern3 = "require('" + $dep + "')"
    $pattern4 = 'require("' + $dep + '")'
    $pattern5 = $dep

    $found = $false
    foreach ($f in $files) {
        try {
            $content = Get-Content $f.FullName -Raw -ErrorAction Stop
        } catch {
            continue
        }
        if ($content -match [regex]::Escape($pattern1) -or $content -match [regex]::Escape($pattern2) -or $content -match [regex]::Escape($pattern3) -or $content -match [regex]::Escape($pattern4)) {
            $found = $true; break
        }
        # Some packages are referenced without from/require (e.g., used in dynamic import or in config). Fallback to simple word match with boundaries
        if ($content -match ("\b" + [regex]::Escape($pattern5) + "\b")) { $found = $true; break }
    }
    if ($found) { $used += $dep } else { $unused += $dep }
}

Write-Host "Done.`n"
Write-Host "Likely USED packages ($($used.Count)):`n" -ForegroundColor Green
$used | ForEach-Object { Write-Host " - $_" }

Write-Host "`nLikely UNUSED packages ($($unused.Count)):`n" -ForegroundColor Yellow
$unused | ForEach-Object { Write-Host " - $_" }

# Save results
$report = @{ used = $used; unused = $unused }
$report | ConvertTo-Json -Depth 4 | Out-File -FilePath (Join-Path $repoRoot 'scripts' 'unused-deps-report.json') -Encoding utf8

Write-Host "
Report saved to scripts\unused-deps-report.json"
