$ErrorActionPreference = 'Stop'
$projectPath = $PSScriptRoot
$siteUrl = 'http://localhost:8000'
try { $ready = (Invoke-WebRequest -Uri $siteUrl -UseBasicParsing -TimeoutSec 2).StatusCode -eq 200 } catch { $ready = $false }
if (-not $ready) {
    Start-Process -FilePath 'node' -ArgumentList 'scripts/serve.mjs' -WorkingDirectory $projectPath -WindowStyle Hidden
    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        Start-Sleep -Milliseconds 250
        try { $ready = (Invoke-WebRequest -Uri $siteUrl -UseBasicParsing -TimeoutSec 1).StatusCode -eq 200 } catch { $ready = $false }
        if ($ready) { break }
    }
}
if ($ready) { Start-Process $siteUrl } else { Write-Error 'Could not start Hayat. Install Node.js, then run: npm start' }
