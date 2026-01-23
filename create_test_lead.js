/**
 * Create Test Lead for Assessment Testing
 */

import axios from 'axios';

const API_URL = 'http://localhost:5000';

const testLead = {
  contactName: 'Test User',
  companyName: 'Test Company',
  email: 'test@example.com',
  phoneNumber: '+1234567890',
  industry: 'Financial Services',
  password: 'test123'
};

async function createTestLead() {
  console.log('🧪 Creating test lead...\n');
  
  try {
    const response = await axios.post(
      `${API_URL}/api/lead/create`,
      testLead,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      console.log('✅ Test lead created successfully!');
      console.log('\nLead details:');
      console.log('- ID:', response.data.leadId || response.data.id);
      console.log('- Email:', testLead.email);
      console.log('- Company:', testLead.companyName);
      console.log('\n📝 Use this lead_id in test_submission.js:', response.data.leadId || response.data.id);
      console.log('\nFull response:', JSON.stringify(response.data, null, 2));
    } else {
      console.log('⚠️  Lead creation returned success: false');
      console.log('Response:', response.data);
    }
    
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('⚠️  Lead already exists. Attempting to login...');
      
      try {
        const loginResponse = await axios.post(
          `${API_URL}/api/lead/login`,
          {
            email: testLead.email,
            password: testLead.password
          }
        );
        
        if (loginResponse.data.success) {
          console.log('✅ Logged in successfully!');
          console.log('\nLead details:');
          console.log('- ID:', loginResponse.data.user.id);
          console.log('- Name:', loginResponse.data.user.contact_name);
          console.log('- Email:', loginResponse.data.user.email);
          console.log('- Company:', loginResponse.data.user.company_name);
          console.log('\n📝 Use this lead_id in test_submission.js:', loginResponse.data.user.id);
        }
      } catch (loginError) {
        console.error('❌ Failed to login:', loginError.response?.data || loginError.message);
      }
    } else {
      console.error('❌ Failed to create test lead');
      console.error('- Status:', error.response?.status);
      console.error('- Message:', error.response?.data?.message || error.message);
      console.error('- Error:', error.response?.data?.error);
    }
  }
}

createTestLead();
