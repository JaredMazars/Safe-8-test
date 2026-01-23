# Quick Start: Testing Welcome Email & Password Reset

## Prerequisites
- ✅ Server running: `cd server && node index.js`
- ✅ Database migration completed: `node server/run_migration.js`
- ✅ SMTP configured in `.env`

## Test Welcome Email

```bash
# PowerShell command to create account
$data = @{
    contactName = "Test User"
    email = "test@example.com"
    companyName = "Test Corp"
    password = "Test123!"
    jobTitle = "Tester"
    phoneNumber = "+27123456789"
    companySize = "50-200"
    country = "South Africa"
    industry = "Technology"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/lead/create" `
    -Method POST `
    -Body $data `
    -ContentType "application/json"
```

**Expected:** Welcome email sent to test@example.com

## Test Password Reset

### 1. Request Reset
```bash
$reset = @{ email = "test@example.com" } | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/lead/forgot-password" `
    -Method POST `
    -Body $reset `
    -ContentType "application/json"
```

**Expected:** Reset email sent with link

### 2. Check Email
- Open email inbox
- Find "Reset Your SAFE-8 Password" email
- Copy token from URL: `?token=abc123...`

### 3. Reset Password
```bash
$newPass = @{
    token = "PASTE_TOKEN_HERE"
    newPassword = "NewPassword123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/lead/reset-password" `
    -Method POST `
    -Body $newPass `
    -ContentType "application/json"
```

### 4. Login with New Password
```bash
$login = @{
    email = "test@example.com"
    password = "NewPassword123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/lead/login" `
    -Method POST `
    -Body $login `
    -ContentType "application/json"
```

## Email Branding Checklist

### Welcome Email
- [ ] Forvis Mazars logo displays
- [ ] Blue header (#00539F)
- [ ] User name is personalized
- [ ] Company name appears
- [ ] Support contact visible
- [ ] Footer has copyright notice

### Reset Email
- [ ] Forvis Mazars logo displays
- [ ] Red security banner (#E31B23)
- [ ] Reset button is prominent
- [ ] Expiration notice visible (1 hour)
- [ ] Security warning present
- [ ] Contact info for suspicious activity

## Troubleshooting

### Email Not Received
1. Check SMTP settings in `.env`
2. Check server logs for email errors
3. Check spam/junk folder
4. Verify email service status: Look for "✅ Email service ready"

### Token Invalid/Expired
- Tokens expire after 1 hour
- Request new reset email
- Check token was copied completely

### Server Not Running
```bash
# Check if running
Get-Process -Name node

# Start server
cd server
node index.js
```

## Quick Commands

```powershell
# Run migration
cd server && node run_migration.js

# Start server
cd server && node index.js

# Run full test suite
.\test_email_features.ps1
```

## Support
See `IMPLEMENTATION_SUMMARY_EMAILS.md` for complete documentation.
