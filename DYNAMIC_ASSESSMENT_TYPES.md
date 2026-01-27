# Dynamic Assessment Type Configuration

## Overview

This feature allows administrators to create new assessment types through the Admin Dashboard that automatically appear as cards on the home screen with complete configuration (title, description, icon, features, audience, etc.).

## What Changed

### 1. Database Schema
- **New Table:** `assessment_types_config`
  - Stores complete metadata for each assessment type
  - Fields: `assessment_type`, `title`, `description`, `duration`, `icon`, `features` (JSON), `audience`, `audience_color`, `is_active`, `display_order`
  
### 2. Backend Changes

#### `server/routes/admin.js`
- **Updated:** `POST /api/admin/config/assessment-types`
  - Now accepts full card configuration: title, description, duration, icon, features, audience, audience_color
  - Creates entry in both `assessment_types_config` and `assessment_questions` tables
  
- **Updated:** `GET /api/admin/config/assessment-types`
  - Returns both simple list and full configurations for admin use

#### `server/routes/response.js`
- **New Endpoint:** `GET /api/questions/assessment-types-config` (PUBLIC)
  - Returns assessment type configurations for home screen display
  - No authentication required

### 3. Frontend Changes

#### `src/components/AdminDashboard.jsx`
- **Enhanced Form:** Create Assessment Type section now includes:
  - Type Code (e.g., EXPERT)
  - Display Title
  - Description
  - Duration (e.g., "30 questions • ~8 minutes")
  - Icon (FontAwesome class)
  - Features (comma-separated list)
  - Target Audience
  - Audience Badge Color (dropdown)

#### `src/components/WelcomeScreen.jsx`
- **Dynamic Cards:** Assessment cards are now fetched from API on component mount
- Fallback to hardcoded cards if API fails or returns no data
- Loading state while fetching

## How to Use

### Step 1: Run Migration (One-time)

```bash
cd server
node migrate_assessment_types.js
```

This creates the `assessment_types_config` table and populates it with existing assessment types (CORE, ADVANCED, FRONTIER, TEST).

### Step 2: Create New Assessment Type

1. Login to Admin Dashboard
2. Go to **Configuration** tab
3. Scroll to **Assessment Types** section
4. Fill out the "Create New Assessment Type" form:
   - **Type Code:** EXPERT (uppercase)
   - **Display Title:** Expert Assessment
   - **Description:** Advanced evaluation for AI experts
   - **Duration:** 50 questions • ~12 minutes
   - **Icon:** fas fa-trophy
   - **Features:** Deep technical analysis, Advanced metrics, Expert recommendations
   - **Target Audience:** AI Specialists
   - **Audience Badge Color:** purple
5. Click "Create Assessment Type Card"

### Step 3: Verify

1. Go to home screen (`/`)
2. You should see the new assessment card appear with all your configured details
3. The card will be clickable and work just like the default cards

### Step 4: Add Questions

1. Go back to Admin Dashboard
2. Navigate to **Questions** tab
3. Click "Create Question"
4. Select your new assessment type from the dropdown
5. Add questions as needed

## API Reference

### Public Endpoints

#### Get Assessment Type Configurations
```
GET /api/questions/assessment-types-config
```

**Response:**
```json
{
  "success": true,
  "configs": [
    {
      "type": "expert",
      "title": "Expert Assessment",
      "description": "Advanced evaluation for AI experts",
      "duration": "50 questions • ~12 minutes",
      "icon": "fas fa-trophy",
      "features": ["Deep technical analysis", "Advanced metrics", "Expert recommendations"],
      "audience": "AI Specialists",
      "audienceColor": "purple"
    }
  ]
}
```

### Admin Endpoints

#### Create Assessment Type
```
POST /api/admin/config/assessment-types
Authorization: Required (Admin)
```

**Request Body:**
```json
{
  "assessment_type": "EXPERT",
  "title": "Expert Assessment",
  "description": "Advanced evaluation for AI experts",
  "duration": "50 questions • ~12 minutes",
  "icon": "fas fa-trophy",
  "features": ["Deep technical analysis", "Advanced metrics", "Expert recommendations"],
  "audience": "AI Specialists",
  "audience_color": "purple"
}
```

## Database Schema

```sql
CREATE TABLE assessment_types_config (
  id INT PRIMARY KEY IDENTITY(1,1),
  assessment_type NVARCHAR(50) NOT NULL UNIQUE,
  title NVARCHAR(100) NOT NULL,
  description NVARCHAR(MAX),
  duration NVARCHAR(50),
  icon NVARCHAR(50),          -- FontAwesome class
  features NVARCHAR(MAX),      -- JSON array
  audience NVARCHAR(100),
  audience_color NVARCHAR(20), -- green, blue, purple, orange, red, teal
  is_active BIT DEFAULT 1,
  display_order INT DEFAULT 0,
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  created_by INT
);
```

## Icon Reference

Common FontAwesome icons you can use:
- `fas fa-rocket` - Rocket
- `fas fa-cogs` - Gears
- `fas fa-brain` - Brain
- `fas fa-flask` - Flask
- `fas fa-trophy` - Trophy
- `fas fa-chart-line` - Chart
- `fas fa-graduation-cap` - Graduation Cap
- `fas fa-shield-alt` - Shield
- `fas fa-star` - Star
- `fas fa-crown` - Crown

## Badge Colors

Available audience badge colors:
- `blue` - Professional blue
- `green` - Success green
- `purple` - Premium purple
- `orange` - Energetic orange
- `red` - Alert red
- `teal` - Modern teal

## Files Modified

- `server/routes/admin.js` - Enhanced create endpoint
- `server/routes/response.js` - Added public config endpoint
- `src/components/AdminDashboard.jsx` - Enhanced form with all fields
- `src/components/WelcomeScreen.jsx` - Dynamic card rendering
- `server/migrations/create_assessment_types_table.sql` - Database schema
- `server/migrate_assessment_types.js` - Migration script

## Troubleshooting

### Cards not appearing on home screen
1. Check browser console for API errors
2. Verify migration was run: `node migrate_assessment_types.js`
3. Check database: `SELECT * FROM assessment_types_config`
4. Ensure `is_active = 1` for the assessment type

### New assessment type not in dropdown
1. Refresh the admin dashboard
2. Check that questions exist for this type
3. Verify in Questions tab that the type appears in the filter

### Features not displaying
- Ensure features are comma-separated in the form
- Check database that features column contains valid JSON array
- Example: `["Feature 1", "Feature 2", "Feature 3"]`

## Best Practices

1. **Naming Convention:** Use uppercase for type codes (EXPERT, BASIC)
2. **Duration Format:** "X questions • ~Y minutes"
3. **Features:** Keep to 3-4 items for clean card display
4. **Icons:** Test icon renders before saving (use FontAwesome 5)
5. **Display Order:** Lower numbers appear first on home screen

## Future Enhancements

- [ ] Drag-and-drop card reordering
- [ ] Preview card before saving
- [ ] Bulk import assessment types from CSV
- [ ] Card templates for quick setup
- [ ] A/B testing different card designs
- [ ] Analytics on which cards get clicked most
