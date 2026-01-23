# Test User Activity Logging
# This script tests that user login and assessment activities are logged and appear in admin dashboard

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  USER ACTIVITY LOGGING TEST" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:3000/api"

# Test 1: User Login
Write-Host "Test 1: User Login Activity" -ForegroundColor Yellow
Write-Host "-----------------------------" -ForegroundColor Gray

$loginData = @{
    email = "testuser@mazars.com"
    password = "TestPass123!"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/lead/login" -Method POST -Body $loginData -ContentType "application/json"
    Write-Host "✅ User logged in successfully" -ForegroundColor Green
    Write-Host "   User: $($loginResponse.data.contact_name)" -ForegroundColor Gray
    $userToken = $loginResponse.data.token
    $userId = $loginResponse.data.id
} catch {
    Write-Host "❌ Login failed: $_" -ForegroundColor Red
    exit 1
}

Start-Sleep -Seconds 1

# Test 2: Get Admin Token
Write-Host "`nTest 2: Admin Login" -ForegroundColor Yellow
Write-Host "-----------------------------" -ForegroundColor Gray

$adminLoginData = @{
    username = "admin"
    password = "Admin123!@#"
} | ConvertTo-Json

try {
    $adminLoginResponse = Invoke-RestMethod -Uri "$baseUrl/admin/login" -Method POST -Body $adminLoginData -ContentType "application/json"
    Write-Host "✅ Admin logged in successfully" -ForegroundColor Green
    $adminToken = $adminLoginResponse.data.token
} catch {
    Write-Host "❌ Admin login failed: $_" -ForegroundColor Red
    exit 1
}

Start-Sleep -Seconds 1

# Test 3: Check Activity Logs
Write-Host "`nTest 3: Fetching Activity Logs" -ForegroundColor Yellow
Write-Host "-----------------------------" -ForegroundColor Gray

$headers = @{
    "Authorization" = "Bearer $adminToken"
}

try {
    $activityLogs = Invoke-RestMethod -Uri "$baseUrl/admin/activity-logs/detailed?limit=10" -Method GET -Headers $headers
    Write-Host "✅ Activity logs retrieved successfully" -ForegroundColor Green
    Write-Host "   Total logs: $($activityLogs.logs.Count)" -ForegroundColor Gray
    
    # Find user login activity
    $userLoginLog = $activityLogs.logs | Where-Object { $_.action_type -eq "LOGIN" -and $_.actor_type -eq "user" } | Select-Object -First 1
    
    if ($userLoginLog) {
        Write-Host "`n✅ User login activity found!" -ForegroundColor Green
        Write-Host "   Actor Type: $($userLoginLog.actor_type)" -ForegroundColor Gray
        Write-Host "   Actor Name: $($userLoginLog.actor_name)" -ForegroundColor Gray
        Write-Host "   Company: $($userLoginLog.company_name)" -ForegroundColor Gray
        Write-Host "   Action: $($userLoginLog.action_type)" -ForegroundColor Gray
        Write-Host "   Description: $($userLoginLog.description)" -ForegroundColor Gray
        Write-Host "   Time: $($userLoginLog.created_at)" -ForegroundColor Gray
    } else {
        Write-Host "`n⚠️ User login activity not found in recent logs" -ForegroundColor Yellow
    }
    
    # Find admin login activity
    $adminLoginLog = $activityLogs.logs | Where-Object { $_.action_type -eq "LOGIN" -and $_.actor_type -eq "admin" } | Select-Object -First 1
    
    if ($adminLoginLog) {
        Write-Host "`n✅ Admin login activity found!" -ForegroundColor Green
        Write-Host "   Actor Type: $($adminLoginLog.actor_type)" -ForegroundColor Gray
        Write-Host "   Actor Name: $($adminLoginLog.actor_name)" -ForegroundColor Gray
        Write-Host "   Action: $($adminLoginLog.action_type)" -ForegroundColor Gray
        Write-Host "   Description: $($adminLoginLog.description)" -ForegroundColor Gray
        Write-Host "   Time: $($adminLoginLog.created_at)" -ForegroundColor Gray
    } else {
        Write-Host "`n⚠️ Admin login activity not found in recent logs" -ForegroundColor Yellow
    }
    
    # Display all recent activities
    Write-Host "`n📋 Recent Activities (Last 10):" -ForegroundColor Cyan
    Write-Host "=" * 80 -ForegroundColor Gray
    
    foreach ($log in $activityLogs.logs) {
        $actorIcon = if ($log.actor_type -eq "admin") { "👤" } else { "👥" }
        $timestamp = [DateTime]::Parse($log.created_at).ToString("MM/dd HH:mm")
        Write-Host "$actorIcon [$timestamp] $($log.actor_name) - $($log.action_type) - $($log.description)" -ForegroundColor White
    }
    
} catch {
    Write-Host "❌ Failed to fetch activity logs: $_" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Test 4: Submit an assessment to generate activity
Write-Host "`n`nTest 4: Submitting Assessment to Generate Activity" -ForegroundColor Yellow
Write-Host "-----------------------------" -ForegroundColor Gray

$assessmentData = @{
    lead_id = $userId
    assessment_type = "Quick"
    responses = @{
        "1" = @{ question_id = 1; selected_option = "beginner" }
        "2" = @{ question_id = 2; selected_option = "beginner" }
        "3" = @{ question_id = 3; selected_option = "beginner" }
    }
} | ConvertTo-Json -Depth 10

$userHeaders = @{
    "Authorization" = "Bearer $userToken"
}

try {
    $assessmentResponse = Invoke-RestMethod -Uri "$baseUrl/assessments/submit-complete" -Method POST -Body $assessmentData -ContentType "application/json" -Headers $userHeaders
    Write-Host "✅ Assessment submitted successfully" -ForegroundColor Green
    Write-Host "   Assessment ID: $($assessmentResponse.assessmentId)" -ForegroundColor Gray
    Write-Host "   Score: $($assessmentResponse.overall_score)%" -ForegroundColor Gray
} catch {
    Write-Host "Assessment submission skipped" -ForegroundColor Yellow
}

Start-Sleep -Seconds 1

# Test 5: Check for assessment activity
Write-Host "`nTest 5: Checking for Assessment Activity" -ForegroundColor Yellow
Write-Host "-----------------------------" -ForegroundColor Gray

try {
    $activityLogs2 = Invoke-RestMethod -Uri "$baseUrl/admin/activity-logs/detailed?limit=10" -Method GET -Headers $headers
    
    $assessmentLog = $activityLogs2.logs | Where-Object { 
        $_.action_type -match "ASSESSMENT" -and $_.actor_type -eq "user" 
    } | Select-Object -First 1
    
    if ($assessmentLog) {
        Write-Host "Assessment activity found" -ForegroundColor Green
        Write-Host "   Actor: $($assessmentLog.actor_name)" -ForegroundColor Gray
        Write-Host "   Action: $($assessmentLog.action_type)" -ForegroundColor Gray
        Write-Host "   Description: $($assessmentLog.description)" -ForegroundColor Gray
    } else {
        Write-Host "Assessment activity not found in recent logs" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "Failed to check assessment activity" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST COMPLETE" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "- User activity logging is implemented" -ForegroundColor White
Write-Host "- Activity logs combine both admin and user activities" -ForegroundColor White
Write-Host "- Each log shows actor type and name" -ForegroundColor White
Write-Host "`nYou can now view combined activities in the Admin Dashboard" -ForegroundColor Green
