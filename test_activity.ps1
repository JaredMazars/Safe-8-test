# Simple User Activity Test
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  USER ACTIVITY LOGGING TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$baseUrl = "http://localhost:3000/api"

# Test 1: User Login
Write-Host "`nTest 1: User Login" -ForegroundColor Yellow
$loginData = @{
    email = "testuser@mazars.com"
    password = "TestPass123!"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/lead/login" -Method POST -Body $loginData -ContentType "application/json"
    Write-Host "User logged in: $($loginResponse.data.contact_name)" -ForegroundColor Green
    $userToken = $loginResponse.data.token
} catch {
    Write-Host "Login failed: $_" -ForegroundColor Red
    exit 1
}

# Test 2: Admin Login
Write-Host "`nTest 2: Admin Login" -ForegroundColor Yellow
$adminLoginData = @{
    username = "admin"
    password = "Admin123!@#"
} | ConvertTo-Json

try {
    $adminLoginResponse = Invoke-RestMethod -Uri "$baseUrl/admin/login" -Method POST -Body $adminLoginData -ContentType "application/json"
    Write-Host "Admin logged in successfully" -ForegroundColor Green
    $adminToken = $adminLoginResponse.data.token
} catch {
    Write-Host "Admin login failed: $_" -ForegroundColor Red
    exit 1
}

# Test 3: Check Activity Logs
Write-Host "`nTest 3: Fetching Activity Logs" -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $adminToken"
}

try {
    $activityLogs = Invoke-RestMethod -Uri "$baseUrl/admin/activity-logs/detailed?limit=15" -Method GET -Headers $headers
    Write-Host "Activity logs retrieved: $($activityLogs.logs.Count) logs" -ForegroundColor Green
    
    # Find user login
    $userLoginLog = $activityLogs.logs | Where-Object { $_.action_type -eq "LOGIN" -and $_.actor_type -eq "user" } | Select-Object -First 1
    
    if ($userLoginLog) {
        Write-Host "`nUser login activity found:" -ForegroundColor Green
        Write-Host "  Actor Type: $($userLoginLog.actor_type)" -ForegroundColor Gray
        Write-Host "  Actor Name: $($userLoginLog.actor_name)" -ForegroundColor Gray
        Write-Host "  Company: $($userLoginLog.company_name)" -ForegroundColor Gray
        Write-Host "  Description: $($userLoginLog.description)" -ForegroundColor Gray
    } else {
        Write-Host "User login activity not found" -ForegroundColor Yellow
    }
    
    # Find admin login
    $adminLoginLog = $activityLogs.logs | Where-Object { $_.action_type -eq "LOGIN" -and $_.actor_type -eq "admin" } | Select-Object -First 1
    
    if ($adminLoginLog) {
        Write-Host "`nAdmin login activity found:" -ForegroundColor Green
        Write-Host "  Actor Name: $($adminLoginLog.actor_name)" -ForegroundColor Gray
        Write-Host "  Description: $($adminLoginLog.description)" -ForegroundColor Gray
    }
    
    # Display recent activities
    Write-Host "`nRecent Activities:" -ForegroundColor Cyan
    Write-Host ("=" * 80) -ForegroundColor Gray
    
    foreach ($log in $activityLogs.logs) {
        $actorIcon = if ($log.actor_type -eq "admin") { "ADMIN" } else { "USER" }
        $timestamp = [DateTime]::Parse($log.created_at).ToString("MM/dd HH:mm")
        Write-Host "[$actorIcon] [$timestamp] $($log.actor_name) - $($log.action_type) - $($log.description)" -ForegroundColor White
    }
    
} catch {
    Write-Host "Failed to fetch activity logs: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
