# Pillar Weighting System - Implementation Summary

## Overview
Implemented configurable pillar weighting system for AI maturity assessments with backward compatibility to equal-weight scoring.

---

## Implementation Status

### ✅ Completed Files

1. **server/add_pillar_weights_system.js** - Database migration script
2. **server/config/weightProfiles.js** - Weight profiles configuration
3. **server/routes/admin.js** - 5 new API endpoints for weight management
4. **server/models/Assessment.js** - Enhanced with weighted scoring methods
5. **server/routes/assessments.js** - Updated submission to use weighted scores

### ⏳ Pending Actions

- Run database migration: `node server/add_pillar_weights_system.js`
- Update Admin UI (AdminDashboard.jsx) with weight configuration interface
- Test weighted scoring with sample assessments

---

## Architecture

### Database Schema

**New Table: `pillar_weights`**
```sql
CREATE TABLE pillar_weights (
  id INT IDENTITY(1,1) PRIMARY KEY,
  assessment_type VARCHAR(50) NOT NULL,
  pillar_name NVARCHAR(255) NOT NULL,
  pillar_short_name VARCHAR(50) NOT NULL,
  weight_percentage DECIMAL(5,2) NOT NULL,
  is_default BIT DEFAULT 0,
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT UQ_pillar_weights UNIQUE (assessment_type, pillar_short_name),
  CONSTRAINT CK_weight_range CHECK (weight_percentage >= 0 AND weight_percentage <= 50)
);
```

**Modified Table: `pillars`**
```sql
ALTER TABLE pillars
ADD default_weight DECIMAL(5,2) DEFAULT 12.50;
```

### Default Weight Distributions

**CORE Assessment** (Total: 100%)
- Strategy: 20%
- Governance: 18%
- Data: 15%
- Technology: 12%
- Ethics: 12%
- Talent: 10%
- Process: 8%
- Performance: 5%

**ADVANCED Assessment** (Total: 100%)
- Architecture: 20%
- Data: 18%
- Technology: 15%
- Strategy: 15%
- Ethics: 12%
- Governance: 10%
- Talent: 5%
- Performance: 5%

**FRONTIER Assessment** (Total: 100%)
- Innovation: 25%
- Research: 20%
- Technology: 15%
- Data: 12%
- Strategy: 10%
- Architecture: 8%
- Ethics: 6%
- Governance: 4%

---

## API Endpoints

### 1. Get Pillar Weights
```http
GET /api/admin/config/pillar-weights/:assessmentType
```
Returns current weights (custom or defaults) for specified assessment type.

**Response:**
```json
{
  "success": true,
  "assessmentType": "CORE",
  "weights": [
    {
      "pillarId": 1,
      "pillarName": "Strategic Foundation",
      "pillarShortName": "STRATEGY",
      "weight": 20.00,
      "isDefault": false
    }
  ],
  "totalWeight": 100.00
}
```

### 2. Update Pillar Weights
```http
PUT /api/admin/config/pillar-weights/:assessmentType
Content-Type: application/json

{
  "weights": [
    { "pillarShortName": "STRATEGY", "weight": 25.0 },
    { "pillarShortName": "GOVERNANCE", "weight": 20.0 }
  ]
}
```

**Validation:**
- Total weight must equal 100% (±0.01% tolerance)
- Individual weights: 0-50%
- All pillars must be included

### 3. Reset to Defaults
```http
POST /api/admin/config/pillar-weights/reset/:assessmentType
```
Deletes custom weights, reverts to default distribution.

### 4. Get Weight Profiles
```http
GET /api/admin/config/weight-profiles?assessmentType=CORE
```
Returns available preset profiles for assessment type.

**Response:**
```json
{
  "success": true,
  "profiles": [
    {
      "name": "balanced",
      "description": "Equal weight across all pillars",
      "applicableTo": ["ALL"]
    },
    {
      "name": "strategyFirst",
      "description": "Emphasizes strategic planning and governance",
      "applicableTo": ["CORE", "ADVANCED"]
    }
  ]
}
```

### 5. Apply Weight Profile
```http
POST /api/admin/config/pillar-weights/apply-profile
Content-Type: application/json

{
  "assessmentType": "CORE",
  "profileName": "healthcare"
}
```

---

## Assessment Model Changes

### New Methods

#### `calculateWeightedScore(lead_user_id, assessment_type)`
Calculates overall score using weighted formula:
```javascript
overall_score = Σ(pillar_score × pillar_weight / 100)
```

**Returns:**
```javascript
{
  overall_score: 72,
  dimension_scores: [
    {
      pillar_name: "Strategic Foundation",
      pillar_short_name: "STRATEGY",
      score: 65,
      weight: 20,
      weighted_contribution: 13
    }
  ],
  weights_applied: true
}
```

#### `getPillarWeights(assessment_type)`
Fetches weights from database or returns defaults.

**Fallback Logic:**
1. Check `pillar_weights` table for custom weights
2. If none, use `default_weight` from `pillars` table
3. If still none, use equal 12.5%

#### `generateInsights(overall_score, dimension_scores, assessment_type)`
Enhanced insights with weighted prioritization:

**New Insight Fields:**
- `weighted_priorities` - Top 3 improvement areas by impact score
- `critical_impact_areas` - Areas with impact score > 15
- Impact score formula: `(100 - pillar_score) × (weight / 100)`

**Example:**
```javascript
{
  overall_assessment: "Good AI maturity with opportunities...",
  strengths: [...],
  weighted_priorities: [
    {
      area: "Strategic Foundation",
      score: 55,
      weight: 20,
      impact_score: 9.0,
      priority: "High",
      description: "Strategic Foundation (20% weight) has 45% improvement potential"
    }
  ],
  critical_impact_areas: [...],
  improvement_areas: [...],
  recommendations: [...]
}
```

### Legacy Methods (Backup)

Original methods preserved with `_LEGACY` suffix:
- `calculateDimensionScores_LEGACY()` - Equal weight calculation
- `generateInsights_LEGACY()` - Binary threshold insights

**To revert to old system:**
```javascript
// In assessments.js, change:
const result = await Assessment.calculateWeightedScore(lead_id, type);
// To:
const dimensionScores = await Assessment.calculateDimensionScores_LEGACY(lead_id, type);
const overall_score = dimensionScores.reduce((sum, d) => sum + d.score, 0) / dimensionScores.length;
const insights = Assessment.generateInsights_LEGACY(overall_score, dimensionScores);
```

---

## Weight Profiles

### Preset Configurations

#### 1. Balanced
Equal distribution (12.5% each) - applicable to all assessment types.

#### 2. Strategy-First
```javascript
{
  STRATEGY: 25%, GOVERNANCE: 20%, DATA: 15%, 
  TECHNOLOGY: 12%, ETHICS: 10%, others distributed
}
```
For organizations prioritizing strategic alignment.

#### 3. Compliance-Focused
```javascript
{
  ETHICS: 25%, GOVERNANCE: 25%, SECURITY: 20%, 
  DATA: 15%, others distributed
}
```
For regulated industries (Healthcare, Finance).

#### 4. Innovation-Driven
```javascript
{
  STRATEGY: 20%, TECHNOLOGY: 20%, INNOVATION: 18%, 
  ARCHITECTURE: 15%, others distributed
}
```
For tech startups and R&D organizations.

#### 5. Healthcare
```javascript
{
  ETHICS: 22%, GOVERNANCE: 20%, DATA: 18%, 
  SECURITY: 15%, others distributed
}
```

#### 6. Financial Services
```javascript
{
  GOVERNANCE: 25%, DATA: 20%, ETHICS: 15%, 
  SECURITY: 15%, others distributed
}
```

#### 7. Technology
```javascript
{
  TECHNOLOGY: 22%, ARCHITECTURE: 20%, INNOVATION: 18%, 
  DATA: 15%, others distributed
}
```

#### 8. Manufacturing
```javascript
{
  PROCESS: 22%, TECHNOLOGY: 20%, PERFORMANCE: 15%, 
  DATA: 13%, others distributed
}
```

### Profile Functions

**`validateWeights(weights)`**
- Checks total = 100% (±0.01% tolerance)
- Returns `{ valid: boolean, total: number, error?: string }`

**`normalizeWeights(weights)`**
- Adjusts weights to exactly 100%
- Maintains relative proportions

**`applyProfileToPillars(profileName, pillarNames)`**
- Maps profile weights to actual pillar names
- Distributes remaining weight equally if pillars don't match

---

## Assessment Submission Flow

### New Weighted Flow

```javascript
// 1. Calculate weighted scores
const weightedResult = await Assessment.calculateWeightedScore(lead_id, assessment_type);
const { overall_score, dimension_scores, weights_applied } = weightedResult;

// 2. Generate weighted insights
const insights = Assessment.generateInsights(overall_score, dimension_scores, assessment_type);

// 3. Save assessment with weighted data
const assessmentData = {
  lead_id,
  assessment_type,
  overall_score,
  dimension_scores, // Includes weight field
  insights: {
    ...insights, // Includes weighted_priorities
    weights_applied,
    score_category: overall_score >= 80 ? 'AI Leader' : ...
  }
};
```

### Legacy Flow (Commented)
```javascript
/* LEGACY SUBMISSION LOGIC (BACKUP):
const assessmentData = {
  overall_score: parseFloat(overall_score),
  dimension_scores: pillar_scores || [],
  insights: {
    score_category: overall_score >= 80 ? 'AI Leader' : ...
  }
};
*/
```

---

## Migration Guide

### Step 1: Run Database Migration
```powershell
node server/add_pillar_weights_system.js
```

**Expected Output:**
```
✅ pillar_weights table created
✅ default_weight column added to pillars table
✅ Seeded CORE weights (100% total)
✅ Seeded ADVANCED weights (100% total)
✅ Seeded FRONTIER weights (100% total)
✅ Migration completed successfully
```

### Step 2: Verify Database
```sql
-- Check table created
SELECT * FROM pillar_weights WHERE assessment_type = 'CORE';

-- Check default weights
SELECT pillar_short_name, default_weight FROM pillars WHERE assessment_type = 'CORE';

-- Verify totals
SELECT assessment_type, SUM(weight_percentage) as total_weight
FROM pillar_weights
GROUP BY assessment_type;
```

### Step 3: Test API Endpoints
```powershell
# Get weights (should return defaults)
curl http://localhost:3001/api/admin/config/pillar-weights/CORE

# Apply a profile
curl -X POST http://localhost:3001/api/admin/config/pillar-weights/apply-profile `
  -H "Content-Type: application/json" `
  -d '{"assessmentType":"CORE","profileName":"healthcare"}'

# Verify weights updated
curl http://localhost:3001/api/admin/config/pillar-weights/CORE
```

### Step 4: Configure Production Weights

**Via Admin UI (after implementing AdminDashboard.jsx):**
1. Login as Super Admin
2. Navigate to Configuration → Pillar Weights
3. Select assessment type (CORE/ADVANCED/FRONTIER)
4. Choose preset profile OR manually adjust sliders
5. Verify total = 100%
6. Click "Save Weights"

**Via API:**
```javascript
fetch('/api/admin/config/pillar-weights/CORE', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    weights: [
      { pillarShortName: 'STRATEGY', weight: 25 },
      { pillarShortName: 'GOVERNANCE', weight: 20 },
      { pillarShortName: 'DATA', weight: 15 },
      // ... must total 100%
    ]
  })
});
```

---

## Backward Compatibility

### Fallback Mechanisms

1. **No Custom Weights:** Falls back to `default_weight` from `pillars` table
2. **Missing Defaults:** Uses equal 12.5% distribution
3. **Database Error:** Catches exception, uses equal weights
4. **Legacy Methods:** Preserved as `*_LEGACY()` for manual reversion

### Reversion Strategy

**To completely revert to old system:**

1. **Restore Assessment Submission:**
```javascript
// In server/routes/assessments.js, uncomment LEGACY block
const assessmentData = {
  overall_score: parseFloat(overall_score), // Use provided score
  dimension_scores: pillar_scores || [],
  insights: {
    score_category: overall_score >= 80 ? 'AI Leader' : ...
    // No weighted_priorities
  }
};
```

2. **Use Legacy Methods:**
```javascript
// Replace calculateWeightedScore with:
const dimensionScores = await Assessment.calculateDimensionScores_LEGACY(lead_id, type);
const overall_score = dimensionScores.reduce((sum, d) => sum + d.score, 0) / dimensionScores.length;
const insights = Assessment.generateInsights_LEGACY(overall_score, dimensionScores);
```

3. **Remove Weight UI:** Comment out weight configuration section in AdminDashboard.jsx

---

## Testing

### Unit Tests

**Test 1: Equal Weight Fallback**
```javascript
// No custom weights configured
const result = await Assessment.calculateWeightedScore(lead_id, 'CORE');
// Should use default 12.5% each
expect(result.weights_applied).toBe(false);
```

**Test 2: Custom Weights Applied**
```javascript
// Configure custom weights via API
await fetch('/api/admin/config/pillar-weights/CORE', {
  method: 'PUT',
  body: JSON.stringify({ weights: customWeights })
});

const result = await Assessment.calculateWeightedScore(lead_id, 'CORE');
expect(result.weights_applied).toBe(true);
expect(result.dimension_scores[0].weight).toBe(25); // Strategy
```

**Test 3: Weight Validation**
```javascript
// Total != 100%
const response = await fetch('/api/admin/config/pillar-weights/CORE', {
  method: 'PUT',
  body: JSON.stringify({ weights: weightsTotal95 })
});
expect(response.status).toBe(400);
expect(response.message).toContain('must equal 100%');
```

**Test 4: Impact Score Calculation**
```javascript
const insights = Assessment.generateInsights(60, dimensionScores, 'CORE');
// Strategy: score=50, weight=20% → impact=(100-50)×0.20=10
const strategyPriority = insights.weighted_priorities.find(p => p.area.includes('Strategy'));
expect(strategyPriority.impact_score).toBe(10.0);
```

### Integration Tests

**Test 5: Full Assessment Flow**
```javascript
// 1. Configure weights
// 2. Submit assessment
// 3. Verify weighted score in database
// 4. Check insights include weighted_priorities
// 5. Reset to defaults
// 6. Verify fallback to equal weights
```

---

## Admin UI Requirements (Pending)

### UI Components Needed in AdminDashboard.jsx

1. **Assessment Type Selector**
   - Dropdown: CORE, ADVANCED, FRONTIER, TEST

2. **Profile Selector**
   - Dropdown with preset profiles
   - "Apply Profile" button
   - Shows profile description

3. **Weight Configuration Grid**
   - One slider per pillar (0-50%, 0.5% steps)
   - Number input for precision
   - Visual impact indicator (percentage bar)
   - Real-time total display

4. **Total Validator**
   - Green: Exactly 100%
   - Orange: 99-101%
   - Red: Outside range
   - Disables save button unless green

5. **Action Buttons**
   - "Save Weights" (validates 100% total)
   - "Reset to Defaults" (with confirmation)
   - "Load Current Weights"

### State Management
```javascript
const [selectedWeightType, setSelectedWeightType] = useState('CORE');
const [pillarWeights, setPillarWeights] = useState([]);
const [weightsLoading, setWeightsLoading] = useState(false);
const [weightTotal, setWeightTotal] = useState(0);
const [weightProfiles, setWeightProfiles] = useState([]);
const [selectedProfile, setSelectedProfile] = useState('');
```

---

## Benefits

### 1. Strategic Accuracy
- Reflects true business priorities
- Strategy/Governance weighted higher than operational details
- Industry-specific calibration

### 2. Actionable Insights
- Impact-based prioritization
- "Which improvements matter most?" answered by `weighted_priorities`
- Critical areas identified automatically

### 3. Flexibility
- Per-assessment-type configuration
- Preset profiles for quick setup
- Custom weights for unique industries

### 4. Backward Compatibility
- No breaking changes to existing data
- Falls back to equal weights gracefully
- Legacy methods preserved for reversion

### 5. Audit Trail
- All weight changes logged to `user_activities`
- Timestamp tracking in `pillar_weights`
- Historical assessment scores unchanged

---

## Future Enhancements

### Phase 2 (Planned)
- **Question-level weighting:** Not all questions equal within a pillar
- **Dynamic thresholds:** Maturity bands adjusted by weight (80% threshold for 5% pillar vs 20% pillar)
- **Weight recommendations:** AI suggests optimal weights based on industry/company profile
- **Temporal weighting:** Adjust weights over time as strategic priorities shift

### Phase 3 (Planned)
- **Multi-dimensional scoring:** Industry benchmark × strategic importance × maturity level
- **Comparative analysis:** Compare weight configurations across similar organizations
- **Scenario modeling:** "What if we prioritize Ethics at 30%?" impact simulation

---

## Troubleshooting

### Issue: Total weight validation fails
**Cause:** Floating-point arithmetic errors
**Solution:** Uses 0.01% tolerance in validation
```javascript
if (Math.abs(totalWeight - 100) > 0.01) { ... }
```

### Issue: Weights not applying to assessments
**Cause:** Database migration not run
**Solution:** Execute `node server/add_pillar_weights_system.js`

### Issue: Missing pillars in weight configuration
**Cause:** Profile doesn't map to all actual pillars
**Solution:** `applyProfileToPillars()` distributes remaining weight equally

### Issue: Want to revert to old scoring
**Solution:** See "Reversion Strategy" section above

---

## Contact & Support

**Implementation Date:** 2025
**Version:** 1.0.0
**Backward Compatible:** Yes (with `_LEGACY` methods)

For questions about pillar weighting configuration, see:
- API documentation: `/api/admin/config/pillar-weights/*`
- Weight profiles: `server/config/weightProfiles.js`
- Assessment model: `server/models/Assessment.js` (lines 200-500)
