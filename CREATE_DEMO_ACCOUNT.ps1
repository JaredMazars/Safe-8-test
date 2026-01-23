# PowerShell Script to Create Demo Account
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "   SAFE-8 DEMO ACCOUNT CREATOR" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# Stop any running node processes
Write-Host "🛠️  Stopping any running node processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "✅ Processes stopped`n" -ForegroundColor Green

# Start backend server in new window
Write-Host "🚀 Starting backend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList '-NoExit','-Command',`
"cd '$PSScriptRoot\server' ; `
Write-Host '========================================' -ForegroundColor Green ; `
Write-Host 'BACKEND SERVER - Port 5000' -ForegroundColor Green ; `
Write-Host '========================================' -ForegroundColor Green ; `
node index.js"

Write-Host "⏳ Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
Write-Host "✅ Backend ready`n" -ForegroundColor Green

# Start frontend server in new window
Write-Host "🚀 Starting frontend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList '-NoExit','-Command',`
"cd '$PSScriptRoot' ; `
Write-Host '========================================' -ForegroundColor Cyan ; `
Write-Host 'FRONTEND SERVER - Port 5173' -ForegroundColor Cyan ; `
Write-Host '========================================' -ForegroundColor Cyan ; `
npm run dev"

Write-Host "⏳ Waiting for frontend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
Write-Host "✅ Frontend ready`n" -ForegroundColor Green

# Run the API test script
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "   Creating demo account via API..." -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

node "$PSScriptRoot\create_demo_via_api.js"

# If account was created successfully, open the browser
if ($LASTEXITCODE -eq 0) {
    Write-Host "`n🌐 Opening browser..." -ForegroundColor Green
    Start-Sleep -Seconds 2
    Start-Process "http://localhost:5173/"
    
    Write-Host "`n✨ The app is now open in your browser!" -ForegroundColor Green
    Write-Host "📧 Use the credentials shown above to login.`n" -ForegroundColor Yellow
}

Write-Host "`n============================================`n" -ForegroundColor Cyan
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
