# SDLC quick checks for Audit Portal
# Run this script from repository root (PowerShell)
# Generates reports in ./sdlc-reports

Param()

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$reportsDir = Join-Path $root 'sdlc-reports'
if (-Not (Test-Path $reportsDir)) { New-Item -ItemType Directory -Path $reportsDir | Out-Null }

Write-Host "Running SDLC quick checks... Reports -> $reportsDir"

# 1) npm audit for backend
if (Test-Path "backend/package.json") {
  Write-Host "Running npm audit for backend..."
  Push-Location backend
  npm install --no-audit --no-fund > $null 2>&1
  npm audit --json > "$reportsDir/backend-audit.json" 2> "$reportsDir/backend-audit.err"  || Write-Host "npm audit exited with non-zero code; see report"
  Pop-Location
}

# 2) npm audit for frontend
if (Test-Path "frontend/package.json") {
  Write-Host "Running npm audit for frontend..."
  Push-Location frontend
  npm install --no-audit --no-fund > $null 2>&1
  npm audit --json > "$reportsDir/frontend-audit.json" 2> "$reportsDir/frontend-audit.err" || Write-Host "npm audit exited with non-zero code; see report"
  Pop-Location
}

# 3) Run frontend lint if available
if (Test-Path "frontend/package.json") {
  $pkg = Get-Content frontend/package.json | Out-String | ConvertFrom-Json
  if ($pkg.scripts.lint) {
    Write-Host "Running frontend lint..."
    Push-Location frontend
    npm run lint --silent > "$reportsDir/frontend-lint.txt" 2>&1 || Write-Host "Lint completed with issues; see report"
    Pop-Location
  }
}

# 4) Basic insecure-pattern scan (grep-like)
Write-Host "Scanning source for risky patterns..."
$patterns = @('eval\(', 'new Function\(', 'exec\(', 'execSync\(', 'child_process', 'dangerouslySetInnerHTML', "innerHTML", "document.write")
$scanReport = Join-Path $reportsDir 'pattern-scan.txt'
Get-ChildItem -Recurse -Include *.js,*.ts,*.tsx -Path . | ForEach-Object {
  $path = $_.FullName
  foreach ($p in $patterns) {
    Select-String -Path $path -Pattern $p -SimpleMatch -Quiet | Out-Null
    if ($?) {
      Select-String -Path $path -Pattern $p | Out-File -Append $scanReport
    }
  }
}

Write-Host "SDLC quick checks completed. Inspect $reportsDir for details."

*** End Patch