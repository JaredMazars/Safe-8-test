# FINAL TESTING INSTRUCTIONS

## Server Status
✅ Server is running on port 5000
✅ CSRF middleware fixed (renamed generateToken to avoid conflict)
✅ Database has test data (4 assessment types, 1 industry, 1 pillar)
✅ Frontend rebuilt with latest code

## What Was Fixed

### 1. CSRF Token Issue ✅
**Problem:** `generateToken is not a function`
**Root Cause:** Variable name conflict - destructuring `generateToken` from `doubleCsrf` then trying to export function with same name
**Solution:** Renamed to `csrfGenerateToken` internally, export as `generateToken`

### 2. Database Active Flags ✅
**Problem:** All questions had `is_active = NULL`
**Solution:** Updated all 137 questions to `is_active = 1`

### 3. API Response Format ✅
**Problem:** Frontend expected `{ csrfToken }`, server returned `{ token }`
**Solution:** Changed `res.json({ token })` to `res.json({ csrfToken: token })`

## Expected Data in Configuration Tab

### Assessment Types (4 items):
- advanced
- core
- frontier
- TEST

### Industries (11 items):
- Financial Services
- Technology
- Healthcare
- Manufacturing
- Retail & E-commerce
- Energy & Utilities
- Government
- Education
- Professional Services
- Other
- Test Industry Direct

### Pillars (9 items):
- Culture & Change (Culture)
- Data Readiness (Data)
- Governance & Ethics (Governance)
- Security & Compliance (Security)
- Skills & Talent (Skills)
- Strategy & Leadership (Strategy)
- Technology & Infrastructure (Technology)
- Value & ROI (Value)
- Test Pillar Direct (TestDirect)

## STEP-BY-STEP TEST PROCEDURE

### Step 1: Clear Browser Cache
1. Press `Ctrl+Shift+Delete`
2. Select "Cached images and files"
3. Click "Clear data"
4. **OR** Open browser in Incognito/Private mode

### Step 2: Login
1. Go to http://localhost:5000
2. Login as admin@safe8.com / admin123
3. Click "Configuration" tab

### Step 3: Verify Data Loads
Open browser DevTools (F12) → Console tab

**You should see:**
```
🔄 Loading configuration...
📊 Raw API Responses:
  Types: { "success": true, "assessmentTypes": ["advanced", "core", "frontier", "TEST"] }
  Industries: { "success": true, "industries": [...11 items...] }
  Pillars: { "success": true, "pillars": [...9 items...] }
✅ Setting assessment types: (4) ['advanced', 'core', 'frontier', 'TEST']
✅ Setting industries: (11) [...]
✅ Setting pillars: (9) [...]
```

**You should NOT see:**
```
⚠️ Assessment types not set
⚠️ Industries not set
⚠️ Pillars not set
```

### Step 4: Test CREATE Industry
1. In Configuration tab, find Industries section
2. Click "Add Industry" button
3. Enter name: "Agriculture"
4. Click "Save"

**Expected:**
- ✅ Success message appears
- ✅ "Agriculture" appears in the list
- ✅ No CSRF errors

**If it fails:**
1. Open DevTools → Network tab
2. Find the POST request to `/api/admin/config/industries`
3. Check Request Headers - should include:
   - `Authorization: Bearer <token>`
   - `x-csrf-token: <token>`
4. Check Response - if 403, CSRF token is invalid

### Step 5: Test CREATE Pillar
1. Click "Add Pillar"
2. Name: "Innovation"
3. Short Name: "Innov"
4. Click "Save"

**Expected:**
- ✅ Success message
- ✅ "Innovation (Innov)" appears in list

### Step 6: Manual Browser Console Test (If UI fails)

Open browser console (F12) and run:

\`\`\`javascript
// Test API directly
(async () => {
  const csrfRes = await fetch('/api/csrf-token', { credentials: 'include' });
  const { csrfToken } = await csrfRes.json();
  console.log('CSRF Token:', csrfToken);

  const token = localStorage.getItem('adminToken');
  console.log('Admin Token:', token?.substring(0, 20) + '...');

  const headers = {
    'Authorization': \`Bearer \${token}\`,
    'Content-Type': 'application/json',
    'x-csrf-token': csrfToken
  };

  // Test GET
  const getRes = await fetch('/api/admin/config/industries', { headers, credentials: 'include' });
  const getData = await getRes.json();
  console.log('GET Industries:', getData);

  // Test POST
  const postRes = await fetch('/api/admin/config/industries', {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({ name: 'Console Test Industry' })
  });
  const postData = await postRes.json();
  console.log('POST Result:', postData);
})();
\`\`\`

## Troubleshooting

### If industries/pillars don't show:
1. Check browser console for `📊 Raw API Responses`
2. If response shows empty arrays: Database problem
3. If response shows data but state not set: Frontend logic problem
4. If no response at all: Network/authentication problem

### If "No authentication token provided":
1. Check localStorage.getItem('adminToken') in console
2. If null, login again
3. Check api.js interceptor is adding Authorization header

### If CSRF errors persist:
1. Check `/api/csrf-token` response has `csrfToken` (not `token`)
2. Check cookie is set: DevTools → Application → Cookies
3. Check request has `x-csrf-token` header
4. Verify csrf.js exports `generateToken` properly

### If server errors:
1. Check server terminal for error messages
2. Look for database connection errors
3. Verify CSRF_SECRET environment variable is set

## Success Criteria

✅ Configuration tab shows 4 assessment types
✅ Configuration tab shows 11 industries
✅ Configuration tab shows 9 pillars
✅ Can create new industry without CSRF errors
✅ Can create new pillar without CSRF errors
✅ Console shows "✅ Setting..." messages, not "⚠️ not set"

## Current File Versions

- `server/middleware/csrf.js` - CSRF token generation fixed
- `server/index.js` - Returns `{ csrfToken }` not `{ token }`
- `src/components/AdminDashboard.jsx` - Enhanced logging
- `dist/` - Latest build includes all fixes

## Quick Verification Commands

Run these in a separate terminal (not in the server terminal):

\`\`\`powershell
# Check server is running
Get-Process -Name node

# Check database has test data
node server/check_config_data.js

# Verify build is latest
Get-ChildItem dist/assets/*.js | Select-Object Name, LastWriteTime
\`\`\`

---

**If all else fails:** 
1. Copy the content of `BROWSER_TEST.js` 
2. Paste into browser console while on admin dashboard
3. This will bypass the UI and test the API directly
4. Share the console output with me

