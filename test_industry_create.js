// Test industry creation to verify the fix

const BASE_URL = 'http://localhost:5000';

async function testIndustryCreation() {
  console.log('\n🧪 Testing Industry Creation Fix...\n');

  try {
    // Step 1: Login as admin
    console.log('1️⃣ Logging in as admin...');
    const loginResponse = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'Admin123!'
      })
    });

    const loginData = await loginResponse.json();
    
    if (!loginData.success) {
      console.error('❌ Login failed:', loginData.message);
      return;
    }

    const token = loginData.token;
    console.log('✅ Logged in successfully');

    // Step 2: Create a new industry
    const industryName = `TestIndustry_${Date.now()}`;
    console.log(`\n2️⃣ Creating industry: "${industryName}"...`);
    
    const createResponse = await fetch(`${BASE_URL}/api/admin/config/industries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: industryName
      })
    });

    const createData = await createResponse.json();
    console.log('\n📊 Create Response:', JSON.stringify(createData, null, 2));

    if (createData.success) {
      console.log('\n✅ SUCCESS! Industry created successfully!');
      console.log('   Name:', createData.industry?.name || industryName);
      console.log('   ID:', createData.industry?.id || 'N/A');
      console.log('   Active:', createData.industry?.is_active ?? true);
    } else {
      console.log('\n❌ FAILED:', createData.message);
    }

    // Step 3: Verify it appears in the list
    console.log('\n3️⃣ Fetching industries list...');
    const listResponse = await fetch(`${BASE_URL}/api/admin/config/industries`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const listData = await listResponse.json();
    
    if (listData.success) {
      const found = listData.industries.find(ind => ind.name === industryName);
      if (found) {
        console.log('✅ Industry found in list!');
        console.log('   Full data:', JSON.stringify(found, null, 2));
      } else {
        console.log('⚠️ Industry not found in list');
        console.log('   Available industries:', listData.industries.map(i => i.name).join(', '));
      }
    }

    console.log('\n✅ Test completed!\n');

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    console.error(error.stack);
  }
}

testIndustryCreation();
