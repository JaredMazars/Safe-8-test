/**
 * Test Dashboard Endpoint
 */

import axios from 'axios';

const API_URL = 'http://localhost:5000';
const TEST_USER_ID = 61; // From create_test_lead.js

async function testDashboard() {
  console.log('🧪 Testing Dashboard Endpoint...\n');
  
  try {
    // Test 1: Get dashboard summary
    console.log('1️⃣ Testing GET /api/user-engagement/dashboard/:userId');
    console.log(`   URL: ${API_URL}/api/user-engagement/dashboard/${TEST_USER_ID}`);
    
    const dashboardResponse = await axios.get(
      `${API_URL}/api/user-engagement/dashboard/${TEST_USER_ID}`
    );
    
    console.log('✅ Dashboard endpoint successful!');
    console.log('\nResponse:');
    console.log('- Success:', dashboardResponse.data.success);
    console.log('- Data:', JSON.stringify(dashboardResponse.data.data, null, 2));
    
    // Test 2: Get assessment history
    console.log('\n2️⃣ Testing GET /api/assessments/user/:userId/history');
    
    const historyResponse = await axios.get(
      `${API_URL}/api/assessments/user/${TEST_USER_ID}/history?page=1&limit=10`
    );
    
    console.log('✅ History endpoint successful!');
    console.log('\nHistory Response:');
    console.log('- Assessments count:', historyResponse.data.assessments?.length || 0);
    if (historyResponse.data.assessments && historyResponse.data.assessments.length > 0) {
      console.log('- Latest assessment:');
      const latest = historyResponse.data.assessments[0];
      console.log('  * ID:', latest.id);
      console.log('  * Type:', latest.assessment_type);
      console.log('  * Score:', latest.overall_score);
      console.log('  * Date:', latest.completed_at);
    }
    
    console.log('\n✅ All dashboard tests passed!\n');
    
  } catch (error) {
    console.error('\n❌ Dashboard test failed!');
    console.error('\nError details:');
    console.error('- Status:', error.response?.status);
    console.error('- Message:', error.response?.data?.message);
    console.error('- Error:', error.response?.data?.error);
    console.error('- Full response:', JSON.stringify(error.response?.data, null, 2));
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  Backend server is not running!');
    }
    
    process.exit(1);
  }
}

testDashboard();
