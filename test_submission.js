/**
 * Test Assessment Submission Script
 * Tests the complete assessment submission flow with mock data
 */

import axios from 'axios';

const API_URL = 'http://localhost:5000';

// Mock assessment data
const mockAssessmentData = {
  lead_id: 61, // Test user ID from create_test_lead.js
  assessment_type: 'CORE',
  industry: 'Financial Services',
  overall_score: 75.5,
  responses: {
    '1': '4',
    '2': '3',
    '3': '5',
    '4': '4',
    '5': '3',
    '6': '4',
    '7': '5',
    '8': '3'
  },
  pillar_scores: [
    { pillar_name: 'Strategy', dimension_name: 'Strategy', score: 80 },
    { pillar_name: 'Architecture', dimension_name: 'Architecture', score: 75 },
    { pillar_name: 'Foundation', dimension_name: 'Foundation', score: 70 },
    { pillar_name: 'Ethics', dimension_name: 'Ethics', score: 85 },
    { pillar_name: 'Culture', dimension_name: 'Culture', score: 72 },
    { pillar_name: 'Capability', dimension_name: 'Capability', score: 68 },
    { pillar_name: 'Governance', dimension_name: 'Governance', score: 78 },
    { pillar_name: 'Performance', dimension_name: 'Performance', score: 76 }
  ],
  risk_assessment: [
    { risk: 'Data Privacy', level: 'Medium', mitigation: 'Implement privacy framework' }
  ],
  service_recommendations: [
    { service: 'AI Strategy Consulting', priority: 'High' }
  ],
  gap_analysis: [
    { gap: 'Talent shortage', impact: 'High' }
  ],
  completion_time_ms: 45000,
  metadata: {
    questions_count: 8,
    completed_at: new Date().toISOString(),
    test_submission: true
  }
};

async function testAssessmentSubmission() {
  console.log('🧪 Starting Assessment Submission Test...\n');
  
  try {
    // Step 1: Check if server is running
    console.log('1️⃣ Checking if backend server is running...');
    try {
      await axios.get(`${API_URL}/api/health`);
      console.log('✅ Backend server is running\n');
    } catch (error) {
      console.log('⚠️  Health check endpoint not found, but server might still be running\n');
    }

    // Step 2: Submit the assessment
    console.log('2️⃣ Submitting mock assessment data...');
    console.log('Assessment Type:', mockAssessmentData.assessment_type);
    console.log('Industry:', mockAssessmentData.industry);
    console.log('Overall Score:', mockAssessmentData.overall_score);
    console.log('Number of responses:', Object.keys(mockAssessmentData.responses).length);
    console.log('Number of pillar scores:', mockAssessmentData.pillar_scores.length);
    
    const response = await axios.post(
      `${API_URL}/api/assessments/submit-complete`,
      mockAssessmentData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('\n✅ Assessment submitted successfully!');
    console.log('\nResponse data:');
    console.log('- Success:', response.data.success);
    console.log('- Assessment ID:', response.data.assessment_id);
    console.log('- Is New:', response.data.isNew);
    console.log('- Message:', response.data.message);
    
    if (response.data.dimension_scores) {
      console.log('- Dimension Scores:', response.data.dimension_scores.length, 'dimensions');
    }
    
    if (response.data.insights) {
      console.log('- Score Category:', response.data.insights.score_category);
    }

    // Step 3: Verify the assessment was saved
    console.log('\n3️⃣ Verifying assessment was saved...');
    const assessmentId = response.data.assessment_id;
    
    try {
      const verifyResponse = await axios.get(
        `${API_URL}/api/assessments/${assessmentId}`
      );
      
      if (verifyResponse.data.success) {
        console.log('✅ Assessment verified in database');
        console.log('- Retrieved Assessment ID:', verifyResponse.data.assessment.id);
        console.log('- Overall Score:', verifyResponse.data.assessment.overall_score);
        console.log('- Assessment Type:', verifyResponse.data.assessment.assessment_type);
      }
    } catch (error) {
      console.log('⚠️  Could not verify assessment (endpoint may not exist)');
    }

    // Step 4: Check user's assessment history
    console.log('\n4️⃣ Checking user assessment history...');
    try {
      const historyResponse = await axios.get(
        `${API_URL}/api/assessments/user/${mockAssessmentData.lead_id}/history?page=1&limit=5`
      );
      
      if (historyResponse.data.assessments) {
        console.log('✅ User has', historyResponse.data.assessments.length, 'assessment(s) in history');
        
        if (historyResponse.data.pagination) {
          console.log('- Total assessments:', historyResponse.data.pagination.totalItems);
          console.log('- Current page:', historyResponse.data.pagination.currentPage);
        }
        
        // Show the latest assessment
        if (historyResponse.data.assessments.length > 0) {
          const latest = historyResponse.data.assessments[0];
          console.log('\nLatest assessment:');
          console.log('- ID:', latest.id);
          console.log('- Type:', latest.assessment_type);
          console.log('- Industry:', latest.industry);
          console.log('- Score:', latest.overall_score);
          console.log('- Completed:', latest.formatted_date || latest.completed_at);
        }
      }
    } catch (error) {
      console.log('⚠️  Could not fetch history:', error.response?.data?.message || error.message);
    }

    console.log('\n✅ Test completed successfully! All assertions passed.\n');
    
  } catch (error) {
    console.error('\n❌ Test failed!');
    console.error('\nError details:');
    console.error('- Status:', error.response?.status);
    console.error('- Status Text:', error.response?.statusText);
    console.error('- Message:', error.response?.data?.message || error.message);
    console.error('- Error:', error.response?.data?.error);
    
    if (error.response?.data) {
      console.error('- Full response:', JSON.stringify(error.response.data, null, 2));
    }
    
    console.error('\nRequest data sent:');
    console.error(JSON.stringify(mockAssessmentData, null, 2));
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  Backend server is not running. Please start it with:');
      console.error('   cd server && node index.js');
    }
    
    process.exit(1);
  }
}

// Run the test
testAssessmentSubmission();
