# User Activity Logging Implementation Summary

## Overview
The admin dashboard now displays a unified activity log showing **both admin and user activities**, allowing complete audit trail visibility of all system actions.

## What Was Implemented

### 1. Database Table - `user_activity_log`
Created a new table to track all user activities:
- `lead_id` - Links to the user (leads table)
- `action_type` - Type of action (LOGIN, ASSESSMENT_COMPLETE, ASSESSMENT_UPDATE)
- `entity_type` - What was affected (user, assessment)
- `entity_id` - ID of the affected entity
- `description` - Human-readable description
- `ip_address` - User's IP address
- `user_agent` - Browser/client information
- `created_at` - Timestamp

### 2. UserActivity Model (`server/models/UserActivity.js`)
Provides methods for logging and retrieving user activities:
- `UserActivity.log()` - Creates new activity log entries
- `UserActivity.getByLeadId()` - Gets activities for a specific user
- `UserActivity.getAll()` - Gets all user activities with pagination/filtering

### 3. Activity Logging Integration
Added automatic activity logging to user-facing endpoints:

#### Login Endpoint (`server/routes/lead.js`)
```javascript
await UserActivity.log(
  user.id, 
  'LOGIN', 
  'user', 
  user.id,
  `${user.contact_name} logged in`,
  req.ip, 
  req.headers['user-agent']
);
```

#### Assessment Submission (`server/routes/assessments.js`)
```javascript
await UserActivity.log(
  parseInt(lead_id),
  result.isNew ? 'ASSESSMENT_COMPLETE' : 'ASSESSMENT_UPDATE',
  'assessment', 
  result.assessmentId,
  `Completed ${assessment_type} assessment with score ${overall_score.toFixed(1)}%`,
  req.ip, 
  req.headers['user-agent']
);
```

### 4. Combined Activity Log Endpoint
Updated `GET /api/admin/activity-logs/detailed` to combine both admin and user activities:

```sql
SELECT 
  'admin' as actor_type,
  au.username as actor_name,
  au.full_name as actor_full_name,
  NULL as company_name,
  aal.action_type,
  aal.description,
  ...
FROM admin_activity_log aal
LEFT JOIN admin_users au ON aal.admin_id = au.id

UNION ALL

SELECT 
  'user' as actor_type,
  l.contact_name as actor_name,
  l.contact_name as actor_full_name,
  l.company_name,
  ual.action_type,
  ual.description,
  ...
FROM user_activity_log ual
INNER JOIN leads l ON ual.lead_id = l.id

ORDER BY created_at DESC
```

### 5. Frontend Updates

#### Activity Log Table (`src/components/AdminDashboard.jsx`)
- Added **"Type" column** showing actor type (Admin/User) with icons
- Updated **"User/Admin" column** to show:
  - Actor name
  - Company name (for users)
- Added filtering for new action types:
  - ASSESSMENT_COMPLETE
  - ASSESSMENT_UPDATE

#### Styling (`src/App.css`)
New CSS classes for actor type badges:
```css
.actor-type-badge {
  display: inline-block;
  padding: 0.375rem 0.875rem;
  border-radius: 6px;
  font-weight: 600;
}

.actor-admin {
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
  color: white;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.actor-user {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
}
```

## Activity Types Tracked

### Admin Activities
- **LOGIN** - Admin login
- **CREATE** - Created user/question/assessment
- **UPDATE** - Updated user/question/assessment
- **DELETE** - Deleted user/question/assessment
- **VIEW** - Viewed user/question/assessment details

### User Activities
- **LOGIN** - User login
- **ASSESSMENT_COMPLETE** - Completed new assessment
- **ASSESSMENT_UPDATE** - Re-took/updated existing assessment

## How It Works

1. **User Actions**
   - User logs in → `UserActivity.log()` creates LOGIN entry
   - User submits assessment → `UserActivity.log()` creates ASSESSMENT_COMPLETE entry
   - All entries include user name, company, IP, timestamp

2. **Admin Dashboard**
   - Admin views Activity tab
   - Frontend calls `GET /api/admin/activity-logs/detailed`
   - Backend runs UNION query combining both tables
   - Results sorted by timestamp (newest first)
   - Each row shows:
     - Timestamp
     - Actor name and company (if user)
     - Actor type badge (👤 Admin / 👥 User)
     - Action type (color-coded badge)
     - Entity affected
     - Description
     - IP address

3. **Filtering**
   - Filter by action type (LOGIN, CREATE, UPDATE, DELETE, VIEW, ASSESSMENT_COMPLETE, ASSESSMENT_UPDATE)
   - Filter by entity type (admin, user, question, assessment)
   - Pagination (default 50 per page)

## Files Modified

### Backend
- ✅ `server/migrations/create_user_activity_log.sql` - Database schema
- ✅ `server/models/UserActivity.js` - Activity logging model
- ✅ `server/routes/admin.js` - Combined activity log endpoint
- ✅ `server/routes/lead.js` - User login logging
- ✅ `server/routes/assessments.js` - Assessment submission logging

### Frontend
- ✅ `src/components/AdminDashboard.jsx` - Updated activity table
- ✅ `src/App.css` - Added actor type badge styles

## Testing

### Test Script: `test_activity.ps1`
```powershell
.\test_activity.ps1
```

This script:
1. Logs in as a user (generates user LOGIN activity)
2. Logs in as admin
3. Fetches activity logs
4. Displays combined admin + user activities

### Expected Output
```
[USER] [01/10 14:32] John Doe - LOGIN - John Doe logged in
[ADMIN] [01/10 14:30] admin - CREATE - Created question "AI Strategy"
[USER] [01/10 14:25] Jane Smith - ASSESSMENT_COMPLETE - Completed Quick assessment with score 75.0%
[ADMIN] [01/10 14:20] admin - DELETE - Deleted user ID: 42
```

## Benefits

1. **Complete Audit Trail**
   - See all system activities in one place
   - Both admin and user actions tracked
   - Searchable and filterable

2. **User Identification**
   - User names prominently displayed
   - Company names shown for users
   - Easy to distinguish admin vs user actions

3. **Compliance**
   - Full activity history with timestamps
   - IP address tracking
   - Action descriptions for context

4. **Monitoring**
   - Track user engagement (logins, assessments)
   - Monitor admin actions (CRUD operations)
   - Identify patterns and anomalies

## Next Steps

1. **Start the server**
   ```powershell
   cd server
   node index.js
   ```

2. **Open the app**
   - Navigate to http://localhost:3000
   - Login as admin (username: admin, password: Admin123!@#)

3. **View Activity Log**
   - Click "Activity Log" tab
   - See both admin and user activities
   - Use filters to narrow down results

4. **Test User Activity**
   - Open incognito window
   - Login as user (testuser@mazars.com / TestPass123!)
   - Complete an assessment
   - Return to admin dashboard
   - See user's login and assessment activities in the log

## Technical Notes

- Non-blocking logging (errors don't affect user actions)
- Efficient UNION query with proper indexing
- Pagination for large datasets
- SQL Server compatible (uses 1/0 for booleans)
- Timezone-aware timestamps

## Security Considerations

- Activity logs cannot be deleted through the UI
- Only admins can view activity logs
- IP addresses tracked for security analysis
- User agent strings stored for client identification
- All database queries use parameterized inputs
