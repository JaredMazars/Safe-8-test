import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

async function createDummyAccount() {
  console.log('🧪 Testing account creation...\n');

  const dummyData = {
    contactName: 'John Doe',
    jobTitle: 'IT Manager',
    email: `test${Date.now()}@example.com`, // Unique email each time
    phoneNumber: '+1-555-0123',
    companyName: 'Test Company Inc',
    companySize: '50-200',
    country: 'United States',
    industry: 'Technology',
    password: 'Password123',
    leadSource: 'Web Assessment'
  };

  console.log('📝 Creating account with data:');
  console.log('  Email:', dummyData.email);
  console.log('  Name:', dummyData.contactName);
  console.log('  Company:', dummyData.companyName);
  console.log('  Password:', dummyData.password);
  console.log('');

  try {
    const response = await axios.post(`${API_BASE_URL}/api/lead/create`, dummyData, {
      timeout: 10000 // 10 second timeout
    });

    if (response.data.success) {
      console.log('✅ Account created successfully!');
      console.log('   Lead ID:', response.data.leadId);
      console.log('   Is New:', response.data.isNew);
      console.log('');
      console.log('🔐 Login credentials:');
      console.log('   Email:', dummyData.email);
      console.log('   Password:', dummyData.password);
      console.log('');
      console.log('✨ You can now use these credentials to log in to the app!');
      return response.data;
    } else {
      console.error('❌ Account creation failed:', response.data);
      return null;
    }
  } catch (error) {
    console.error('❌ Error creating account:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    } else if (error.request) {
      console.error('   No response received from server');
      console.error('   Make sure the backend server is running on port 5000');
    } else {
      console.error('   Error:', error.message);
    }
    throw error;
  }
}

// Run the test
createDummyAccount()
  .then(() => {
    console.log('\n✅ Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed!');
    process.exit(1);
  });
