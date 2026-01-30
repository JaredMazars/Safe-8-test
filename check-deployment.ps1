# Quick Azure Deployment Check
Write-Host "=== SAFE-8 Deployment Readiness Check ===" -ForegroundColor Cyan

# 1. Fix line endings in startup.sh
Write-Host "`nFixing startup.sh line endings..." -ForegroundColor Yellow
$content = Get-Content "startup.sh" -Raw
$content = $content -replace "`r`n", "`n"
[System.IO.File]::WriteAllText((Resolve-Path "startup.sh").Path, $content, (New-Object System.Text.UTF8Encoding $false))
Write-Host "[OK] startup.sh now has Unix (LF) line endings" -ForegroundColor Green

# 2. Verify server files
Write-Host "`nVerifying project structure..." -ForegroundColor Yellow
$requiredFiles = @(
    "server\package.json",
    "server\index.js",
    "server\.env",
    "startup.sh",
    ".deployment"
)

$allGood = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  [OK] $file" -ForegroundColor Green
    } else {
        Write-Host "  [MISSING] $file" -ForegroundColor Red
        $allGood = $false
    }
}

if ($allGood) {
    Write-Host "`n[SUCCESS] All required files present" -ForegroundColor Green
    Write-Host "`n=== Ready for Azure Deployment! ===" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "1. git add ." -ForegroundColor White
    Write-Host "2. git commit -m 'Fixed Azure deployment'" -ForegroundColor White
    Write-Host "3. git push" -ForegroundColor White
    Write-Host "`n4. In Azure Portal, set Startup Command to: bash startup.sh" -ForegroundColor Yellow
    Write-Host "5. Configure all environment variables from AZURE_DEPLOYMENT_GUIDE.md" -ForegroundColor Yellow
} else {
    Write-Host "`n[ERROR] Some files are missing - check errors above" -ForegroundColor Red
}
