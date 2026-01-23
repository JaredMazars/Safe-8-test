# Activity Log Display Reference

## Activity Log Tab - Visual Layout

```
╔════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                    ACTIVITY LOG                                                 ║
╠════════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                                 ║
║  Filters:                                                                                       ║
║  ┌─────────────────────┐  ┌──────────────────────┐                                            ║
║  │ All Actions      ▼  │  │ All Entities      ▼  │                                            ║
║  └─────────────────────┘  └──────────────────────┘                                            ║
║                                                                                                 ║
╠══════════════════╦═══════════════════════╦══════════╦═══════════════╦══════════╦══════════════╣
║ Timestamp        ║ User/Admin            ║ Type     ║ Action        ║ Entity   ║ Description  ║
╠══════════════════╬═══════════════════════╬══════════╬═══════════════╬══════════╬══════════════╣
║ Jan 10, 2:45 PM  ║ John Doe             ║ 👥 User  ║ LOGIN         ║ user     ║ John Doe     ║
║                  ║ Acme Corp            ║          ║               ║          ║ logged in    ║
╠──────────────────╬───────────────────────╬──────────╬───────────────╬──────────╬──────────────╣
║ Jan 10, 2:43 PM  ║ admin                ║ 👤 Admin ║ CREATE        ║ question ║ Created      ║
║                  ║                      ║          ║               ║          ║ question...  ║
╠──────────────────╬───────────────────────╬──────────╬───────────────╬──────────╬──────────────╣
║ Jan 10, 2:40 PM  ║ Jane Smith           ║ 👥 User  ║ ASSESSMENT    ║ assess.  ║ Completed    ║
║                  ║ TechStart Inc        ║          ║ _COMPLETE     ║          ║ Quick ass... ║
╠──────────────────╬───────────────────────╬──────────╬───────────────╬──────────╬──────────────╣
║ Jan 10, 2:38 PM  ║ admin                ║ 👤 Admin ║ UPDATE        ║ user     ║ Updated user ║
║                  ║                      ║          ║               ║          ║ John Doe     ║
╠──────────────────╬───────────────────────╬──────────╬───────────────╬──────────╬──────────────╣
║ Jan 10, 2:35 PM  ║ Bob Johnson          ║ 👥 User  ║ LOGIN         ║ user     ║ Bob Johnson  ║
║                  ║ Global Industries    ║          ║               ║          ║ logged in    ║
╚══════════════════╩═══════════════════════╩══════════╩═══════════════╩══════════╩══════════════╝

                           ◀ Previous    Page 1 of 5    Next ▶
```

## Badge Legend

### Actor Type Badges
- **👤 Admin** - Blue gradient badge (admin actions)
- **👥 User** - Green gradient badge (user actions)

### Action Type Badges (Color-Coded)
- **LOGIN** - Purple background (#e9d5ff)
- **CREATE** - Green background (#e8f5e9)
- **UPDATE** - Blue background (#dbeafe)
- **DELETE** - Red background (#fee2e2)
- **VIEW** - Yellow background (#fef3c7)
- **ASSESSMENT_COMPLETE** - Teal background (#d1fae5)
- **ASSESSMENT_UPDATE** - Teal background (#d1fae5)

## Example Activities

### User Activities
1. **User Login**
   ```
   Timestamp: Jan 10, 2024 2:45 PM
   User: John Doe (Acme Corp)
   Type: 👥 User
   Action: LOGIN
   Description: John Doe logged in
   IP: 192.168.1.100
   ```

2. **Assessment Completion**
   ```
   Timestamp: Jan 10, 2024 2:40 PM
   User: Jane Smith (TechStart Inc)
   Type: 👥 User
   Action: ASSESSMENT_COMPLETE
   Description: Completed Quick assessment with score 85.5%
   IP: 192.168.1.105
   ```

3. **Assessment Update**
   ```
   Timestamp: Jan 10, 2024 2:30 PM
   User: Bob Johnson (Global Industries)
   Type: 👥 User
   Action: ASSESSMENT_UPDATE
   Description: Completed Comprehensive assessment with score 72.3%
   IP: 192.168.1.110
   ```

### Admin Activities
1. **Admin Login**
   ```
   Timestamp: Jan 10, 2024 2:50 PM
   Admin: admin
   Type: 👤 Admin
   Action: LOGIN
   Description: Admin login successful
   IP: 192.168.1.50
   ```

2. **Create Question**
   ```
   Timestamp: Jan 10, 2024 2:43 PM
   Admin: admin
   Type: 👤 Admin
   Action: CREATE
   Description: Created question 'What is your AI strategy maturity?'
   IP: 192.168.1.50
   ```

3. **Update User**
   ```
   Timestamp: Jan 10, 2024 2:38 PM
   Admin: admin
   Type: 👤 Admin
   Action: UPDATE
   Description: Updated user John Doe
   IP: 192.168.1.50
   ```

4. **Delete Assessment**
   ```
   Timestamp: Jan 10, 2024 2:25 PM
   Admin: admin
   Type: 👤 Admin
   Action: DELETE
   Description: Deleted assessment ID: 123
   IP: 192.168.1.50
   ```

## Filtering Examples

### Filter by Action Type
- **All Actions** - Shows all activities
- **LOGIN** - Shows only login activities (admin + user)
- **CREATE** - Shows only creation activities (admin)
- **ASSESSMENT_COMPLETE** - Shows only completed assessments (user)

### Filter by Entity Type
- **All Entities** - Shows all entity types
- **user** - Shows only user-related activities
- **assessment** - Shows only assessment activities
- **question** - Shows only question activities

### Combined Filters
Example: Action = "LOGIN" + Entity = "user"
Result: Shows all user login activities (excludes admin logins)

## Data Displayed

### For User Activities
- **Actor Name**: User's contact name (e.g., "John Doe")
- **Company**: User's company name (e.g., "Acme Corp")
- **Type**: 👥 User (green badge)
- **Action**: LOGIN, ASSESSMENT_COMPLETE, ASSESSMENT_UPDATE
- **IP Address**: User's IP address
- **Description**: Detailed activity description

### For Admin Activities
- **Actor Name**: Admin username (e.g., "admin")
- **Company**: (empty - admins don't have companies)
- **Type**: 👤 Admin (blue badge)
- **Action**: LOGIN, CREATE, UPDATE, DELETE, VIEW
- **IP Address**: Admin's IP address
- **Description**: Detailed activity description

## Use Cases

### 1. Monitor User Engagement
Filter by `actor_type = user` to see:
- How many users are logging in
- Which assessments are being completed
- User activity patterns over time

### 2. Audit Admin Actions
Filter by `actor_type = admin` to see:
- All administrative changes
- Who created/updated/deleted what
- Security-related activities

### 3. Track Specific User
Search for user name in the table to see:
- All activities by that user
- Login history
- Assessment completion history

### 4. Compliance Reporting
Export activity logs showing:
- Complete audit trail
- Timestamp of all actions
- IP addresses for security
- Detailed descriptions

## Quick Reference Table

| Column        | Shows                                          | Example                    |
|---------------|------------------------------------------------|----------------------------|
| Timestamp     | When the action occurred                       | Jan 10, 2024 2:45 PM      |
| User/Admin    | Name (and company for users)                   | John Doe / Acme Corp      |
| Type          | Whether admin or user performed the action     | 👥 User or 👤 Admin       |
| Action        | Type of action taken                           | LOGIN, CREATE, UPDATE     |
| Entity        | What was affected                              | user, assessment, question|
| Description   | Human-readable description of the action       | "John Doe logged in"      |
| IP Address    | IP address of the actor                        | 192.168.1.100             |

## Notes

- ✅ Activities are sorted by timestamp (newest first)
- ✅ Both admin and user activities appear in the same unified view
- ✅ User names and companies are prominently displayed
- ✅ Color-coded badges make it easy to identify action types at a glance
- ✅ IP addresses are tracked for security and compliance
- ✅ Pagination available for large datasets (50 per page)
- ✅ Real-time updates (refresh page to see latest activities)
