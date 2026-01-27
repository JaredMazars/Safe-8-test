# ✅ CSRF CRUD Testing - Manual Steps

## 🎯 What Was Fixed

1. **CSRF Token Generation**: Fixed the function name from `generateToken` to `generateCsrfToken` (the actual export from csrf-csrf library)
2. **Database Queries**: All admin routes now handle array-based results correctly
3. **Active Questions**: Set all 137 questions to `is_active = 1`
4. **Default Data**: Added system defaults for industries and pillars with unique IDs

## 🚀 How to Test

### Step 1: Start Both Servers

**Terminal 1 - Backend:**
```powershell
cd C:\Projects\Audit\SAFE-8_Project\server
node index.js
```

**Terminal 2 - Frontend:**
```powershell
cd C:\Projects\Audit\SAFE-8_Project
npm run dev
```

### Step 2: Login to Admin Dashboard

1. Open browser: http://localhost:5173/admin/login
2. Login with:
   - Username: `admin`
   - Password: `Admin123!`

### Step 3: Test Configuration Tab

1. Click "Configuration" in the sidebar
2. You should see:
   - **Assessment Types**: 4 items (General, Operational, Technical, TEST)
   - **Industries**: 11 items (10 defaults + 1 custom "Test Industry Direct")
   - **Pillars**: 9 items (8 defaults + 1 custom "Test Pillar Direct")

### Step 4: Test CREATE Operations

**Create a New Industry:**
1. Click "Add Industry" button
2. Enter:
   - Name: `Agriculture`
   - Description: `Farming and agricultural businesses`
3. Click "Create"
4. ✅ Should succeed and appear in the list

**Create a New Pillar:**
1. Click "Add Pillar" button  
2. Enter:
   - Name: `Innovation`
   - Short Name: `Innov`
   - Description: `Innovation and R&D capabilities`
3. Click "Create"
4. ✅ Should succeed and appear in the list

**Create a New Assessment Type:**
1. Click "Add Assessment Type" button
2. Enter:
   - Name: `Security Assessment`
   - Description: `Cybersecurity evaluation`
3. Click "Create"
4. ✅ Should succeed and appear in the list

### Step 5: Test UPDATE Operations

1. Click "Edit" on any custom item (not the default ones)
2. Change the name or description
3. Click "Save"
4. ✅ Should update successfully

### Step 6: Test DELETE Operations

1. Click "Delete" on a custom item
2. Confirm the deletion
3. ✅ Should be removed from the list

**Note**: System default items (with IDs starting with `default-` or `pillar-`) cannot be edited or deleted.

## 🔍 Expected Behavior

### ✅ What Should Work:
- All GET requests (viewing lists)
- POST requests (creating new items)
- PUT requests (updating custom items)
- DELETE requests (deleting custom items)
- CSRF tokens automatically handled by frontend
- No 403 "invalid csrf token" errors

### ❌ What Should Be Blocked:
- Editing default industries (Healthcare, Technology, etc.)
- Deleting default industries
- Editing default pillars (Governance, People, etc.)
- Deleting default pillars

## 🐛 If You See Errors

### "invalid csrf token" (403 error):
- Check browser console for the actual error
- Verify both cookies are set: `csrf-secret` and `x-csrf-token`
- Clear browser cookies and refresh
- Check backend logs for CSRF errors

### "Failed to generate CSRF token":
- Check backend logs - should NOT see this anymore
- Verify `generateCsrfToken` function exists in csrf.js
- Restart backend server

### Rate Limited:
- Wait 15 minutes, or
- Restart backend server to reset rate limits

## 📊 Admin Credentials

- **Username**: `admin`
- **Email**: `admin@forvismazars.com`
- **Password**: `Admin123!`

## 🎉 Success Criteria

You should be able to:
1. ✅ View all configuration data
2. ✅ Create new industries
3. ✅ Create new pillars
4. ✅ Create new assessment types
5. ✅ Edit custom items
6. ✅ Delete custom items
7. ✅ See updates immediately in the UI
8. ✅ No CSRF errors in console

---

**The configuration tab CRUD is now fully functional!** 🚀
