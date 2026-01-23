## Gmail App Password Setup Guide

### Step 1: Generate New App Password
1. Visit: https://myaccount.google.com/apppasswords
2. If you see "App passwords unavailable", enable 2-Step Verification first
3. Select App: "Mail"
4. Select Device: "Other" and type "SAFE-8"
5. Click "Generate"
6. You'll see a 16-character password like: `abcd efgh ijkl mnop`

### Step 2: Update .env File
Remove ALL spaces from the password and update:

```env
SMTP_PASS=abcdefghijklmnop
```

(Replace `abcdefghijklmnop` with your actual 16-character password, no spaces)

### Step 3: Test Email Service
Run: `node test_email.js`

You should see: ✅ Test email sent successfully!

---

### Current Configuration
- SMTP Host: smtp.gmail.com
- SMTP Port: 587
- Email: jaredmoodley1212@gmail.com
- Password: Currently invalid (needs to be regenerated)

### Troubleshooting
If still failing:
- Make sure 2-Step Verification is enabled
- Try generating a fresh app password
- Check that you're copying the entire 16-character password
- Remove any spaces or special characters
