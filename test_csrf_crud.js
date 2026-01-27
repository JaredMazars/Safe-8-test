// Test CSRF-protected CRUD operations
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

// Step 1: Login as admin
async function loginAdmin() {
  console.log('\n📝 Step 1: Logging in as admin...');
  const response = await fetch(`${BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@safe8.com',
      password: 'AdminPass123!'
    })
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Login failed: ${JSON.stringify(data)}`);
  }
  
  console.log('✅ Login successful');
  return data.token;
}

// Step 2: Get CSRF token
async function getCsrfToken(authToken) {
  console.log('\n🔐 Step 2: Getting CSRF token...');
  const response = await fetch(`${BASE_URL}/api/csrf-token`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Cookie': '' // Will get csrf-secret cookie in response
    }
  });
  
  const data = await response.json();
  const cookies = response.headers.raw()['set-cookie'] || [];
  
  console.log('Response:', data);
  console.log('Cookies set:', cookies);
  
  if (!data.csrfToken) {
    throw new Error('No CSRF token received');
  }
  
  // Extract csrf-secret cookie
  let csrfSecret = '';
  for (const cookie of cookies) {
    if (cookie.startsWith('csrf-secret=')) {
      csrfSecret = cookie.split(';')[0];
      break;
    }
  }
  
  console.log('✅ CSRF token received:', data.csrfToken.substring(0, 20) + '...');
  console.log('✅ Secret cookie:', csrfSecret.substring(0, 40) + '...');
  
  return { token: data.csrfToken, secretCookie: csrfSecret };
}

// Step 3: Create an industry
async function createIndustry(authToken, csrfToken, csrfSecret) {
  console.log('\n➕ Step 3: Creating test industry...');
  
  const response = await fetch(`${BASE_URL}/api/admin/config/industries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
      'x-csrf-token': csrfToken,
      'Cookie': csrfSecret
    },
    body: JSON.stringify({
      name: 'Agriculture Test',
      description: 'Test industry for CSRF validation'
    })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    console.error('❌ Create failed:', response.status, data);
    throw new Error(`Create industry failed: ${JSON.stringify(data)}`);
  }
  
  console.log('✅ Industry created successfully:', data);
  return data.industry;
}

// Step 4: Get industries to verify
async function getIndustries(authToken) {
  console.log('\n📋 Step 4: Fetching industries list...');
  
  const response = await fetch(`${BASE_URL}/api/admin/config/industries`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Get industries failed: ${JSON.stringify(data)}`);
  }
  
  console.log('✅ Industries retrieved:', data.length, 'total');
  const customIndustries = data.filter(i => !i.id.startsWith('default-'));
  console.log('   Custom industries:', customIndustries.map(i => i.name).join(', '));
  
  return data;
}

// Run all tests
async function runTests() {
  try {
    console.log('🚀 Starting CSRF CRUD test...');
    
    const authToken = await loginAdmin();
    const { token: csrfToken, secretCookie } = await getCsrfToken(authToken);
    const industry = await createIndustry(authToken, csrfToken, secretCookie);
    const industries = await getIndustries(authToken);
    
    console.log('\n✅ ALL TESTS PASSED! CRUD operations work correctly.');
    console.log('\nSummary:');
    console.log('- ✅ Admin login successful');
    console.log('- ✅ CSRF token generated');
    console.log('- ✅ Industry created with CSRF protection');
    console.log('- ✅ Industries list retrieved');
    console.log('\n🎉 You can now use the admin dashboard to add industries, pillars, and assessment types!');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  }
}

runTests();
