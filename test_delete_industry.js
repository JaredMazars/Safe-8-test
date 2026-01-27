// Test deleting an industry to verify the fix
const BASE_URL = 'http://localhost:5000';

async function testDeleteIndustry() {
  console.log('\n🧪 Testing Industry Deletion Fix...\n');

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
    console.log('✅ Logged in successfully\n');

    // Step 2: Get list of industries to find Agriculture
    console.log('2️⃣ Fetching industries list...');
    const listResponse = await fetch(`${BASE_URL}/api/admin/config/industries`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const listData = await listResponse.json();
    
    if (!listData.success) {
      console.error('❌ Failed to get industries:', listData.message);
      return;
    }

    console.log('📊 Found industries:', listData.industries.map(i => `${i.name} (ID: ${i.id})`).join(', '));
    
    const agriculture = listData.industries.find(ind => ind.name === 'Agriculture');
    
    if (!agriculture) {
      console.log('\n⚠️ Agriculture not found in list. Available industries:');
      listData.industries.forEach(ind => {
        console.log(`   - ${ind.name} (ID: ${ind.id})`);
      });
      return;
    }

    console.log(`\n✅ Found Agriculture with ID: ${agriculture.id}\n`);

    // Step 3: Delete Agriculture
    console.log(`3️⃣ Deleting industry: "${agriculture.name}" (ID: ${agriculture.id})...`);
    
    const deleteResponse = await fetch(`${BASE_URL}/api/admin/config/industries/${agriculture.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const deleteData = await deleteResponse.json();
    console.log('\n📊 Delete Response:', JSON.stringify(deleteData, null, 2));

    if (deleteData.success) {
      console.log('\n✅ SUCCESS! Industry deleted without errors!');
      console.log('   Message:', deleteData.message);
    } else {
      console.log('\n❌ FAILED:', deleteData.message);
      console.log('   Response code:', deleteResponse.status);
    }

    // Step 4: Verify it's removed from the list
    console.log('\n4️⃣ Verifying deletion...');
    const verifyResponse = await fetch(`${BASE_URL}/api/admin/config/industries`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const verifyData = await verifyResponse.json();
    
    if (verifyData.success) {
      const stillExists = verifyData.industries.find(ind => ind.name === 'Agriculture');
      if (stillExists) {
        console.log('⚠️ Agriculture still in list (not deleted properly)');
      } else {
        console.log('✅ Agriculture successfully removed from list!');
      }
      console.log('\n📋 Current industries:', verifyData.industries.map(i => i.name).join(', '));
    }

    console.log('\n✅ Test completed!\n');

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    console.error(error.stack);
  }
}

testDeleteIndustry();
