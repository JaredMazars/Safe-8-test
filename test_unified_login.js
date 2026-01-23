/**
 * Test script for unified login functionality
 * Tests both admin and user login through the same endpoint
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

// Test credentials
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'Admin123!@#'
};

const USER_CREDENTIALS = {
  email: 'test@example.com',
  password: 'Test123!@#'
};

async function testAdminLogin() {
  console.log('\n🔐 Testing Admin Login...');
  try {
    const response = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: ADMIN_CREDENTIALS.username,
        password: ADMIN_CREDENTIALS.password
      })
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Admin login successful');
      console.log(`   Session Token: ${data.sessionToken.substring(0, 20)}...`);
      console.log(`   Admin: ${data.admin.username} (${data.admin.email})`);
      return { success: true, token: data.sessionToken };
    } else {
      console.log('❌ Admin login failed:', data.message || response.statusText);
      return { success: false };
    }
  } catch (error) {
    console.log('❌ Admin login error:', error.message);
    return { success: false };
  }
}

async function testUserLogin() {
  console.log('\n👤 Testing User Login...');
  try {
    const response = await fetch(`${BASE_URL}/api/lead/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: USER_CREDENTIALS.email,
        password: USER_CREDENTIALS.password
      })
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ User login successful');
      console.log(`   User: ${data.contactName || data.contact_name}`);
      console.log(`   Company: ${data.companyName || data.company_name}`);
      return { success: true, data };
    } else {
      console.log('❌ User login failed:', data.message || response.statusText);
      return { success: false };
    }
  } catch (error) {
    console.log('❌ User login error:', error.message);
    return { success: false };
  }
}

async function testInvalidCredentials() {
  console.log('\n🚫 Testing Invalid Credentials...');
  try {
    const response = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'invalid',
        password: 'wrong'
      })
    });

    const data = await response.json();
    
    if (response.status === 401) {
      console.log('✅ Invalid credentials properly rejected (401)');
      return { success: true };
    } else {
      console.log('❌ Unexpected response:', response.status);
      return { success: false };
    }
  } catch (error) {
    console.log('❌ Test error:', error.message);
    return { success: false };
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════');
  console.log('🧪 UNIFIED LOGIN TEST SUITE');
  console.log('═══════════════════════════════════════════════════');

  const results = {
    admin: await testAdminLogin(),
    user: await testUserLogin(),
    invalid: await testInvalidCredentials()
  };

  console.log('\n═══════════════════════════════════════════════════');
  console.log('📊 TEST RESULTS');
  console.log('═══════════════════════════════════════════════════');
  console.log(`Admin Login:    ${results.admin.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`User Login:     ${results.user.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Invalid Creds:  ${results.invalid.success ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = results.admin.success && results.user.success && results.invalid.success;
  console.log('\n' + (allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'));
  console.log('═══════════════════════════════════════════════════\n');
}

runTests().catch(console.error);
