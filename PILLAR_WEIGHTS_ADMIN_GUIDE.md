# Admin Guide: Pillar Weights Configuration

## Overview
The pillar weights system allows you to configure how much each assessment pillar contributes to the overall AI maturity score. This ensures strategic priorities are properly reflected in assessment results.

---

## Accessing the Configuration

1. **Login as Admin** at `/admin/login`
2. Navigate to **Configuration Tab**
3. Scroll down to **"Pillar Weights Configuration"** section

---

## Understanding Weights

### What Are Pillar Weights?
- Each pillar has a weight (0-50%) that determines its impact on overall score
- Total weights across all pillars must equal exactly 100%
- Higher weight = more important for maturity score

### Example Impact:
If Strategy has 25% weight and Performance has 5% weight:
- Strategy pillar is **5× more important** in calculating overall score
- A 10-point improvement in Strategy adds 2.5 points to overall score
- A 10-point improvement in Performance adds only 0.5 points to overall score

---

## Step-by-Step Configuration

### Method 1: Quick Apply Preset Profile

1. **Select Assessment Type**
   - Choose: CORE, ADVANCED, FRONTIER, or TEST
   
2. **Choose a Preset Profile**
   - **Balanced**: Equal weight across all pillars (12.5% each)
   - **Strategy-First**: Emphasizes strategic planning and governance
   - **Compliance-Focused**: Prioritizes ethics and governance (for regulated industries)
   - **Innovation-Driven**: Focuses on technology and innovation
   - **Healthcare**: Optimized for healthcare industry (Ethics 22%, Governance 20%)
   - **Financial Services**: Banking/finance focus (Governance 25%, Data 20%)
   - **Technology**: Tech company focus (Technology 22%, Architecture 20%)
   - **Manufacturing**: Operations focus (Process 22%, Technology 20%)

3. **Click "Apply Profile"**
   - Weights will automatically adjust
   - Total will be exactly 100%

4. **Click "Save Weights"** to apply changes

### Method 2: Manual Configuration

1. **Select Assessment Type**
   - Choose: CORE, ADVANCED, FRONTIER, or TEST

2. **Adjust Individual Pillar Weights**
   - Use sliders (0-50%) OR type exact numbers
   - Watch the **Total** display at top (must be 100%)
   - Color indicators:
     - 🟢 Green (100.00%): Ready to save
     - 🟠 Orange (99-101%): Close but not exact
     - 🔴 Red (<99% or >101%): Cannot save

3. **Fine-Tune with Number Inputs**
   - Use decimal precision (e.g., 12.3%)
   - Adjust until total = 100.00%

4. **Click "Save Weights"** when total is green

### Method 3: Reset to Defaults

1. **Click "Reset to Defaults"**
2. Confirm the action
3. System restores original weight distribution for that assessment type

---

## Default Weight Distributions

### CORE Assessment (Foundational Maturity)
```
Strategy         20% - Strategic planning and vision
Governance       18% - Policies and oversight
Data             15% - Data management and quality
Technology       12% - Technical infrastructure
Ethics           12% - Responsible AI practices
Talent           10% - Team capabilities
Process           8% - Operational procedures
Performance       5% - Metrics and outcomes
─────────────────────
Total:          100%
```

### ADVANCED Assessment (Operational Excellence)
```
Architecture     20% - System design and integration
Data             18% - Advanced data capabilities
Technology       15% - Technical implementation
Strategy         15% - Strategic execution
Ethics           12% - Ethical frameworks
Governance       10% - Advanced governance
Talent            5% - Specialized skills
Performance       5% - KPIs and monitoring
─────────────────────
Total:          100%
```

### FRONTIER Assessment (Innovation & Research)
```
Innovation       25% - Cutting-edge capabilities
Research         20% - R&D and experimentation
Technology       15% - Advanced tech adoption
Data             12% - Data science maturity
Strategy         10% - Innovation strategy
Architecture      8% - Advanced architecture
Ethics            6% - Emerging ethical concerns
Governance        4% - Experimental governance
─────────────────────
Total:          100%
```

---

## Best Practices

### ✅ Do This:

1. **Align with Business Strategy**
   - If compliance is critical (Healthcare, Finance), increase Ethics/Governance weights
   - If innovation is key (Tech startups), increase Strategy/Technology weights

2. **Consider Industry Standards**
   - Use preset industry profiles as starting point
   - Customize based on your specific requirements

3. **Test Before Deploying**
   - Apply weights to TEST assessment type first
   - Run sample assessments to verify results
   - Adjust if needed before applying to CORE/ADVANCED/FRONTIER

4. **Document Your Decisions**
   - Keep notes on why specific weights were chosen
   - Helps with future adjustments and stakeholder communication

5. **Review Periodically**
   - Reassess weights quarterly or when strategic priorities change
   - Adjust based on assessment feedback and business needs

### ❌ Avoid This:

1. **Don't Over-Weight Single Pillars**
   - Maximum 50% per pillar (enforced by system)
   - Over-weighting reduces assessment balance

2. **Don't Change Weights Mid-Assessment**
   - Configure weights BEFORE launching assessments
   - Changing weights doesn't retroactively update old assessments

3. **Don't Ignore the Total**
   - Must be exactly 100% to save
   - Use "Apply Profile" or "Reset to Defaults" if stuck

4. **Don't Use Same Weights for All Types**
   - CORE vs ADVANCED vs FRONTIER serve different purposes
   - Customize each based on assessment focus

---

## Understanding Impact Scores

After configuring weights, assessments will show **Impact Scores** in insights:

### Impact Score Formula
```
Impact Score = (100 - Pillar Score) × (Pillar Weight / 100)
```

### Example Calculation
```
Strategy Pillar:
- Current Score: 60%
- Weight: 25%
- Gap: 100 - 60 = 40%
- Impact Score: 40 × 0.25 = 10.0

This means improving Strategy from 60% to 100% would add 10 points to overall score.
```

### Priority Classification
- **Critical** (Impact > 15): Immediate action required
- **High** (Impact 8-15): Important improvement area
- **Medium** (Impact 4-8): Moderate priority
- **Low** (Impact < 4): Lower priority

---

## Troubleshooting

### Problem: "Total weight must equal 100%"
**Solution:**
1. Check current total at top of page
2. Adjust pillars up or down to reach exactly 100.00%
3. Use number inputs for precision (sliders round to 0.5%)
4. OR click "Apply Profile" for guaranteed 100%

### Problem: "Individual weights must be between 0% and 50%"
**Solution:**
- No single pillar can exceed 50%
- Distribute weight more evenly
- Consider if one pillar is truly 50%+ of maturity

### Problem: Weights not saving
**Solution:**
1. Ensure total = 100.00% (green indicator)
2. Check for any red error messages
3. Verify you're logged in as admin
4. Try "Reset to Defaults" then reconfigure

### Problem: Old assessments showing different scores
**Explanation:**
- Weight changes only affect NEW assessments
- Historical assessment scores remain unchanged
- This preserves data integrity and audit trail

---

## API Reference (Advanced)

### Get Current Weights
```http
GET /api/admin/config/pillar-weights/CORE
```

### Update Weights
```http
PUT /api/admin/config/pillar-weights/CORE
Content-Type: application/json

{
  "weights": [
    { "pillarShortName": "STRATEGY", "weight": 25.0 },
    { "pillarShortName": "GOVERNANCE", "weight": 20.0 },
    { "pillarShortName": "DATA", "weight": 15.0 },
    { "pillarShortName": "TECHNOLOGY", "weight": 12.0 },
    { "pillarShortName": "ETHICS", "weight": 12.0 },
    { "pillarShortName": "TALENT", "weight": 10.0 },
    { "pillarShortName": "PROCESS", "weight": 4.0 },
    { "pillarShortName": "PERFORMANCE", "weight": 2.0 }
  ]
}
```

### Apply Preset Profile
```http
POST /api/admin/config/pillar-weights/apply-profile
Content-Type: application/json

{
  "assessmentType": "CORE",
  "profileName": "healthcare"
}
```

### Reset to Defaults
```http
POST /api/admin/config/pillar-weights/reset/CORE
```

---

## Example Scenarios

### Scenario 1: Healthcare Organization
**Goal:** Emphasize compliance and patient safety

**Configuration:**
1. Select: CORE assessment
2. Apply Profile: "Healthcare"
3. Verify weights:
   - Ethics: 22% (patient safety, privacy)
   - Governance: 20% (regulatory compliance)
   - Data: 18% (PHI protection)
   - Security: 15% (HIPAA requirements)
4. Save weights
5. Launch assessment

**Result:** Assessment heavily weighs ethical and governance practices

---

### Scenario 2: Tech Startup
**Goal:** Focus on innovation and technical capabilities

**Configuration:**
1. Select: FRONTIER assessment
2. Apply Profile: "Innovation-Driven"
3. Fine-tune:
   - Innovation: 28% (increase from default 25%)
   - Technology: 20%
   - Research: 18% (decrease from 20%)
   - Architecture: 15%
   - Others: Distribute remaining 19%
4. Save weights
5. Test with sample assessment

**Result:** Heavily rewards cutting-edge AI capabilities

---

### Scenario 3: Financial Institution
**Goal:** Prioritize governance and risk management

**Configuration:**
1. Select: ADVANCED assessment
2. Apply Profile: "Financial Services"
3. Verify compliance:
   - Governance: 25% (risk oversight)
   - Data: 20% (data governance)
   - Ethics: 15% (fairness, transparency)
   - Security: 15% (fraud prevention)
4. Save weights
5. Document configuration for audit

**Result:** Assessment aligns with regulatory expectations

---

## Maintenance & Updates

### Quarterly Review Checklist
- [ ] Review business strategic priorities
- [ ] Check if any pillars need weight adjustments
- [ ] Gather feedback from assessment participants
- [ ] Compare results to industry benchmarks
- [ ] Update weights if priorities shifted
- [ ] Document changes in configuration log

### When to Update Weights
✅ **Update If:**
- Business strategy changes
- New regulatory requirements
- Industry focus shifts
- Assessment feedback indicates misalignment
- Mergers/acquisitions change priorities

❌ **Don't Update If:**
- Mid-assessment cycle
- Based on single assessment result
- Just to achieve higher scores
- Without stakeholder discussion

---

## Support & Questions

For assistance with pillar weight configuration:
1. Review this guide
2. Check PILLAR_WEIGHTING_IMPLEMENTATION.md for technical details
3. Test changes on TEST assessment type first
4. Document your configuration decisions

**Remember:** Pillar weights are a strategic tool to align AI maturity assessments with your organization's unique priorities and industry context.
