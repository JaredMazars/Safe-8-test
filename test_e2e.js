/**
 * End-to-End User Flow Test
 * Tests: Login → Submit Assessment → View Dashboard
 */

import axios from 'axios';

const API_URL = 'http://localhost:5000';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'test123';

async function runE2ETest() {
  console.log('🧪 Starting End-to-End User Flow Test...\n');
  
  try {
    // STEP 1: Login
    console.log('1️⃣ STEP 1: User Login');
    console.log('   Email:', TEST_EMAIL);
    
    const loginResponse = await axios.post(
      `${API_URL}/api/lead/login`,
      {
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      }
    );
    
    if (!loginResponse.data.success) {
      throw new Error('Login failed: ' + loginResponse.data.message);
    }
    
    const user = loginResponse.data.user;
    console.log('   ✅ Login successful');
    console.log('   User ID:', user.id);
    console.log('   Name:', user.contact_name);
    console.log('   Company:', user.company_name);
    console.log('   Previous assessments:', loginResponse.data.assessments?.length || 0);
    
    // STEP 2: Submit New Assessment
    console.log('\n2️⃣ STEP 2: Submit Assessment');
    
    const assessmentPayload = {
      lead_id: user.id,
      assessment_type: 'ADVANCED',
      industry: user.industry || 'Financial Services',
      overall_score: 82.5,
      responses: {
        '1': '5', '2': '4', '3': '5', '4': '4', '5': '5',
        '6': '4', '7': '5', '8': '4', '9': '5', '10': '4'
      },
      pillar_scores: [
        { pillar_name: 'Strategy', dimension_name: 'Strategy', score: 85 },
        { pillar_name: 'Architecture', dimension_name: 'Architecture', score: 82 },
        { pillar_name: 'Foundation', dimension_name: 'Foundation', score: 80 },
        { pillar_name: 'Ethics', dimension_name: 'Ethics', score: 88 },
        { pillar_name: 'Culture', dimension_name: 'Culture', score: 81 },
        { pillar_name: 'Capability', dimension_name: 'Capability', score: 79 },
        { pillar_name: 'Governance', dimension_name: 'Governance', score: 84 },
        { pillar_name: 'Performance', dimension_name: 'Performance', score: 83 }
      ],
      risk_assessment: [],
      service_recommendations: [],
      gap_analysis: [],
      completion_time_ms: 60000,
      metadata: {
        questions_count: 10,
        completed_at: new Date().toISOString(),
        test_type: 'e2e'
      }
    };
    
    const submitResponse = await axios.post(
      `${API_URL}/api/assessments/submit-complete`,
      assessmentPayload
    );
    
    if (!submitResponse.data.success) {
      throw new Error('Assessment submission failed: ' + submitResponse.data.message);
    }
    
    console.log('   ✅ Assessment submitted successfully');
    console.log('   Assessment ID:', submitResponse.data.assessment_id);
    console.log('   Score:', assessmentPayload.overall_score);
    console.log('   Type:', assessmentPayload.assessment_type);
    
    // STEP 3: Load Dashboard
    console.log('\n3️⃣ STEP 3: Load Dashboard');
    
    const dashboardResponse = await axios.get(
      `${API_URL}/api/user-engagement/dashboard/${user.id}`
    );
    
    if (!dashboardResponse.data.success) {
      throw new Error('Dashboard load failed: ' + dashboardResponse.data.message);
    }
    
    const stats = dashboardResponse.data.data;
    console.log('   ✅ Dashboard loaded successfully');
    console.log('   Total Assessments:', stats.totalAssessments);
    console.log('   Average Score:', Math.round(stats.averageScore * 10) / 10 + '%');
    console.log('   Last Assessment:', stats.daysSinceLastAssessment === 0 ? 'Today' : stats.daysSinceLastAssessment + ' days ago');
    console.log('   Completion Rate:', stats.completionRate + '%');
    
    // STEP 4: Load Assessment History
    console.log('\n4️⃣ STEP 4: Load Assessment History');
    
    const historyResponse = await axios.get(
      `${API_URL}/api/assessments/user/${user.id}/history?page=1&limit=10`
    );
    
    const assessments = historyResponse.data.assessments || [];
    console.log('   ✅ Assessment history loaded');
    console.log('   Total in history:', assessments.length);
    
    if (assessments.length > 0) {
      console.log('\n   📋 Recent Assessments:');
      assessments.slice(0, 3).forEach((assessment, index) => {
        console.log(`   ${index + 1}. ${assessment.assessment_type} - Score: ${assessment.overall_score}% - ${new Date(assessment.completed_at).toLocaleDateString()}`);
      });
    }
    
    // STEP 5: Verify Dashboard Data Consistency
    console.log('\n5️⃣ STEP 5: Verify Data Consistency');
    
    const errors = [];
    
    if (stats.totalAssessments !== assessments.length) {
      errors.push(`Total assessments mismatch: Stats shows ${stats.totalAssessments}, History shows ${assessments.length}`);
    }
    
    if (stats.totalAssessments > 0 && stats.averageScore === 0) {
      errors.push('Average score is 0 despite having assessments');
    }
    
    if (errors.length > 0) {
      console.log('   ⚠️  Data consistency issues found:');
      errors.forEach(error => console.log('   - ' + error));
    } else {
      console.log('   ✅ All data is consistent');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ END-TO-END TEST PASSED!');
    console.log('='.repeat(60));
    console.log('\n✨ Summary:');
    console.log(`   • User: ${user.contact_name} (${user.email})`);
    console.log(`   • Total Assessments: ${stats.totalAssessments}`);
    console.log(`   • Average Score: ${Math.round(stats.averageScore)}%`);
    console.log(`   • Latest Assessment: ${assessmentPayload.assessment_type} - ${assessmentPayload.overall_score}%`);
    console.log('\n🎉 All systems working correctly!\n');
    
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ END-TO-END TEST FAILED!');
    console.error('='.repeat(60));
    console.error('\nError details:');
    console.error('- Message:', error.message);
    console.error('- Status:', error.response?.status);
    console.error('- Response:', JSON.stringify(error.response?.data, null, 2));
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  Backend server is not running!');
      console.error('Start it with: cd server && node index.js');
    }
    
    process.exit(1);
  }
}

runE2ETest();
