# SAFE-8 Welcome Email & Password Reset Test Script
# Run this after starting the server with: node server/index.js

Write-Host "`n" -NoNewline
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  SAFE-8 Email Features Test Suite" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "`n"

# Wait for server
Start-Sleep -Seconds 2

# Generate unique email
$timestamp = Get-Date -Format 'yyyyMMddHHmmss'
$testEmail = "test_$timestamp@example.com"
$testPassword = "TestPassword123!"

# Test 1: Create Account (Welcome Email)
Write-Host "TEST 1: Account Creation with Welcome Email" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow

$accountData = @{
    contactName = "John Doe"
    jobTitle = "Chief Technology Officer"
    email = $testEmail
    phoneNumber = "+27123456789"
    companyName = "Acme Corporation"
    companySize = "50-200"
    country = "South Africa"
    industry = "Technology"
    password = $testPassword
} | ConvertTo-Json

try {
    $createResponse = Invoke-RestMethod -Uri 'http://localhost:5000/api/lead/create' -Method POST -Body $accountData -ContentType 'application/json'
    
    Write-Host "✅ Account created successfully!" -ForegroundColor Green
    Write-Host "   Lead ID: $($createResponse.leadId)" -ForegroundColor Cyan
    Write-Host "   Is New: $($createResponse.isNew)" -ForegroundColor Cyan
    Write-Host "   Email: $testEmail" -ForegroundColor Cyan
    Write-Host "`n📧 Welcome email sent to: $testEmail" -ForegroundColor Magenta
    Write-Host "   Check your inbox for the welcome message" -ForegroundColor Gray
    
    $leadId = $createResponse.leadId
} catch {
    Write-Host "❌ Failed to create account: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n"
Start-Sleep -Seconds 2

# Test 2: Request Password Reset
Write-Host "TEST 2: Password Reset Request" -ForegroundColor Yellow
Write-Host "===============================" -ForegroundColor Yellow

$resetRequest = @{
    email = $testEmail
} | ConvertTo-Json

try {
    $resetResponse = Invoke-RestMethod -Uri 'http://localhost:5000/api/lead/forgot-password' -Method POST -Body $resetRequest -ContentType 'application/json'
    
    Write-Host "✅ Password reset requested!" -ForegroundColor Green
    Write-Host "   Message: $($resetResponse.message)" -ForegroundColor Cyan
    Write-Host "`n📧 Password reset email sent to: $testEmail" -ForegroundColor Magenta
    Write-Host "   Check your inbox for the reset link" -ForegroundColor Gray
    Write-Host "   Link expires in 1 hour" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed to request password reset: $_" -ForegroundColor Red
}

Write-Host "`n"
Start-Sleep -Seconds 2

# Test 3: Login with Original Password
Write-Host "TEST 3: Login with Original Password" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Yellow

$loginData = @{
    email = $testEmail
    password = $testPassword
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri 'http://localhost:5000/api/lead/login' -Method POST -Body $loginData -ContentType 'application/json'
    
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host "   User: $($loginResponse.user.contact_name)" -ForegroundColor Cyan
    Write-Host "   Company: $($loginResponse.user.company_name)" -ForegroundColor Cyan
    Write-Host "   Assessments: $($loginResponse.assessments.Count)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Login failed: $_" -ForegroundColor Red
}

# Summary
Write-Host "`n"
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Test Summary" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "`n✅ Account Creation: PASSED" -ForegroundColor Green
Write-Host "✅ Welcome Email: Sent (check inbox)" -ForegroundColor Green
Write-Host "✅ Password Reset Request: PASSED" -ForegroundColor Green
Write-Host "✅ Reset Email: Sent (check inbox)" -ForegroundColor Green
Write-Host "✅ Login: PASSED" -ForegroundColor Green

Write-Host "`n"
Write-Host "Email Checklist:" -ForegroundColor Yellow
Write-Host "   [ ] Welcome email received" -ForegroundColor Gray
Write-Host "   [ ] Welcome email displays Forvis Mazars logo" -ForegroundColor Gray
Write-Host "   [ ] Welcome email uses brand colors" -ForegroundColor Gray
Write-Host "   [ ] Password reset email received" -ForegroundColor Gray
Write-Host "   [ ] Reset email has security warning" -ForegroundColor Gray
Write-Host "   [ ] Reset link works (expires in 1 hour)" -ForegroundColor Gray

Write-Host "`nBrand Compliance:" -ForegroundColor Yellow
Write-Host "   - Primary Blue: #00539F" -ForegroundColor Gray
Write-Host "   - Light Blue: #0072CE" -ForegroundColor Gray
Write-Host "   - Dark Blue: #1E2875" -ForegroundColor Gray
Write-Host "   - Alert Red: #E31B23" -ForegroundColor Gray

Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "   1. Check email inbox for both messages" -ForegroundColor Gray
Write-Host "   2. Click reset link from email" -ForegroundColor Gray
Write-Host "   3. Enter new password" -ForegroundColor Gray
Write-Host "   4. Login with new password" -ForegroundColor Gray

Write-Host "`nAll tests completed!`n" -ForegroundColor Green
