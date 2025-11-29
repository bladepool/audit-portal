# PowerShell helper to call deployed /api/debug/gemini-test
param(
  [string]$baseUrl = $env:DEPLOY_URL,
  [string]$adminToken = $env:ADMIN_TOKEN
)

if (-not $baseUrl -or -not $adminToken) {
  Write-Host 'Usage: set DEPLOY_URL and ADMIN_TOKEN env vars, or pass them as args.' -ForegroundColor Yellow
  Write-Host 'Example:'
  Write-Host "`$env:DEPLOY_URL='https://your-app.up.railway.app'; `$env:ADMIN_TOKEN='token'; .\run-deployed-gemini-test.ps1"
  exit 2
}

$uri = "$($baseUrl.TrimEnd('/'))/api/debug/gemini-test"
$headers = @{ 'x-admin-token' = $adminToken }
$body = @{ prompt = 'Short test: reply with a friendly greeting and signature' } | ConvertTo-Json

try {
  $res = Invoke-RestMethod -Method Post -Uri $uri -Headers $headers -Body $body -ContentType 'application/json' -ErrorAction Stop
  $outFile = Join-Path -Path '..\logs' -ChildPath 'deployed-gemini-response.json'
  New-Item -ItemType Directory -Path (Split-Path $outFile) -Force | Out-Null
  $res | ConvertTo-Json -Depth 10 | Out-File -FilePath $outFile -Encoding UTF8
  Write-Host "Saved response to $outFile"
  $summary = @{ ai = if ($res.ai) { $res.ai.Substring(0,[Math]::Min($res.ai.Length,500)) } else { $null }; logsCount = ($res.logs).Count }
  $summary | ConvertTo-Json -Depth 4 | Write-Host
} catch {
  Write-Host 'Request failed:' $_.Exception.Message -ForegroundColor Red
  if ($_.Exception.Response) {
    try { $_.Exception.Response | Select-Object -ExpandProperty StatusCode | Write-Host } catch {}
  }
  exit 3
}
