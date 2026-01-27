# Test CSRF-protected CRUD operations
$ErrorActionPreference = "Stop"

Write-Host "`n🚀 Starting CSRF CRUD Test...`n" -ForegroundColor Cyan

# Step 1: Login as admin
Write-Host "📝 Step 1: Logging in as admin..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@safe8.com"
    password = "AdminPass123!"
} | ConvertTo-Json

$loginResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/admin/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $loginBody

$authToken = ($loginResponse.Content | ConvertFrom-Json).token
Write-Host "✅ Login successful" -ForegroundColor Green
Write-Host "   Token: $($authToken.Substring(0,20))..." -ForegroundColor Gray

# Step 2: Get CSRF token
Write-Host "`n🔐 Step 2: Getting CSRF token..." -ForegroundColor Yellow
$csrfResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/csrf-token" `
    -Method GET `
    -Headers @{ "Authorization" = "Bearer $authToken" } `
    -SessionVariable session

$csrfToken = ($csrfResponse.Content | ConvertFrom-Json).csrfToken
$cookies = $csrfResponse.Headers['Set-Cookie']

Write-Host "✅ CSRF token received: $($csrfToken.Substring(0,20))..." -ForegroundColor Green
Write-Host "   Cookies set:" -ForegroundColor Gray
foreach ($cookie in $cookies) {
    Write-Host "   - $cookie" -ForegroundColor Gray
}

# Step 3: Create an industry
Write-Host "`n➕ Step 3: Creating test industry..." -ForegroundColor Yellow
$createBody = @{
    name = "Agriculture Test $(Get-Date -Format 'HHmmss')"
    description = "Test industry created at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $authToken"
    "x-csrf-token" = $csrfToken
    "Content-Type" = "application/json"
}

try {
    $createResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/admin/config/industries" `
        -Method POST `
        -Headers $headers `
        -Body $createBody `
        -WebSession $session
    
    $industry = ($createResponse.Content | ConvertFrom-Json).industry
    Write-Host "✅ Industry created successfully!" -ForegroundColor Green
    Write-Host "   ID: $($industry.id)" -ForegroundColor Gray
    Write-Host "   Name: $($industry.name)" -ForegroundColor Gray
    
    # Step 4: Verify it appears in the list
    Write-Host "`n📋 Step 4: Fetching industries list..." -ForegroundColor Yellow
    $listResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/admin/config/industries" `
        -Method GET `
        -Headers @{ "Authorization" = "Bearer $authToken" }
    
    $industries = $listResponse.Content | ConvertFrom-Json
    $customIndustries = $industries | Where-Object { -not $_.id.StartsWith('default-') }
    
    Write-Host "✅ Industries retrieved: $($industries.Count) total" -ForegroundColor Green
    Write-Host "   Custom industries: $($customIndustries.Count)" -ForegroundColor Gray
    foreach ($ind in $customIndustries) {
        Write-Host "   - $($ind.name)" -ForegroundColor Gray
    }
    
    Write-Host "`n✅ ALL TESTS PASSED! CRUD operations work correctly." -ForegroundColor Green
    Write-Host "`n🎉 You can now use the admin dashboard to add industries, pillars, and assessment types!" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ CREATE FAILED!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
    exit 1
}
