# SAFE-8 Azure Deployment Script
# Run this from PowerShell in the project root directory

Write-Host "=== SAFE-8 Azure Deployment Helper ===" -ForegroundColor Cyan

# Check if we're in the right directory
if (-not (Test-Path "server\package.json")) {
    Write-Host "Error: Must run from project root directory" -ForegroundColor Red
    exit 1
}

Write-Host "`n1. Checking startup.sh line endings..." -ForegroundColor Yellow

# Convert startup.sh to Unix line endings (LF)
$startupPath = "startup.sh"
if (Test-Path $startupPath) {
    $content = Get-Content $startupPath -Raw
    $content = $content -replace "`r`n", "`n"
    [System.IO.File]::WriteAllText($startupPath, $content)
    Write-Host "   ✓ Converted startup.sh to LF line endings" -ForegroundColor Green
}

Write-Host "`n2. Checking server dependencies..." -ForegroundColor Yellow
Push-Location server
if (-not (Test-Path "node_modules")) {
    Write-Host "   Installing dependencies..." -ForegroundColor Yellow
    npm install
} else {
    Write-Host "   ✓ Dependencies already installed" -ForegroundColor Green
}
Pop-Location

Write-Host "`n3. Testing local server..." -ForegroundColor Yellow
Push-Location server

# Start server in background
$job = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    node index.js
}

Start-Sleep -Seconds 5

# Check if server started
$running = Get-Process -Name node -ErrorAction SilentlyContinue
if ($running) {
    Write-Host "   ✓ Server started successfully" -ForegroundColor Green
    
    # Test health endpoint
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/health" -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "   ✓ Health check passed" -ForegroundColor Green
        }
    } catch {
        Write-Host "   ⚠ Health check failed (server may still be starting)" -ForegroundColor Yellow
    }
    
    # Stop the test server
    Stop-Job $job
    Remove-Job $job
    Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
} else {
    Write-Host "   ✗ Server failed to start" -ForegroundColor Red
    Receive-Job $job
    Remove-Job $job
}

Pop-Location

Write-Host "`n=== Next Steps for Azure Deployment ===" -ForegroundColor Cyan
Write-Host "1. Commit and push your changes to GitHub" -ForegroundColor White
Write-Host "   git add ." -ForegroundColor Gray
Write-Host "   git commit -m 'Fixed Azure deployment configuration'" -ForegroundColor Gray
Write-Host "   git push" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Configure Azure App Service Application Settings:" -ForegroundColor White
Write-Host "   - Go to Azure Portal > Your App Service > Configuration" -ForegroundColor Gray
Write-Host "   - Add all environment variables from AZURE_DEPLOYMENT_GUIDE.md" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Set Startup Command in Azure:" -ForegroundColor White
Write-Host "   - Go to Configuration > General Settings" -ForegroundColor Gray
Write-Host "   - Startup Command: bash startup.sh" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Monitor deployment:" -ForegroundColor White
Write-Host "   - Go to Deployment Center > Logs" -ForegroundColor Gray
Write-Host ""
Write-Host "See AZURE_DEPLOYMENT_GUIDE.md for detailed instructions" -ForegroundColor Cyan
