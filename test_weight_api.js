import axios from 'axios';

async function testWeightAPIs() {
  console.log('🧪 Testing Pillar Weight APIs\n');

  try {
    // Test 1: Get pillar weights for ADVANCED
    console.log('1️⃣ Testing GET /api/admin/config/pillar-weights/ADVANCED');
    const response1 = await axios.get('http://localhost:5000/api/admin/config/pillar-weights/ADVANCED', {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    console.log('✅ Response:', JSON.stringify(response1.data, null, 2));
    console.log('📊 Number of pillars:', response1.data.weights?.length);
    console.log('📊 Total weight:', response1.data.totalWeight);
    console.log();

    // Test 2: Get weight profiles
    console.log('2️⃣ Testing GET /api/admin/config/weight-profiles');
    const response2 = await axios.get('http://localhost:5000/api/admin/config/weight-profiles');
    console.log('✅ Response:', JSON.stringify(response2.data, null, 2));
    console.log('📋 Number of profiles:', response2.data.profiles?.length);
    console.log();

    // Test 3: Get pillar weights for FRONTIER
    console.log('3️⃣ Testing GET /api/admin/config/pillar-weights/FRONTIER');
    const response3 = await axios.get('http://localhost:5000/api/admin/config/pillar-weights/FRONTIER');
    console.log('✅ Response:', JSON.stringify(response3.data, null, 2));
    console.log('📊 Number of pillars:', response3.data.weights?.length);
    console.log('📊 Total weight:', response3.data.totalWeight);

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testWeightAPIs();
