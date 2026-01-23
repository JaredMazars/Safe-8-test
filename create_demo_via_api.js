// Automated demo account creation via API
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/lead/create';

async function createDemoAccount() {
  console.log('\n🎯 ========================================');
  console.log('🎯 CREATING DEMO ACCOUNT VIA API');
  console.log('🎯 ========================================\n');

  // Generate unique email
  const timestamp = Date.now();
  const demoAccount = {
    contactName: 'Demo User',
    jobTitle: 'System Administrator',
    email: `demo_${timestamp}@example.com`,
    phoneNumber: '+1-555-0100',
    companyName: 'Demo Company LLC',
    companySize: '50-200',
    country: 'United States',
    industry: 'Technology',
    password: 'Demo123!',
    leadSource: 'Web Assessment'
  };

  console.log('📝 Creating account with:');
  console.log('   Name:', demoAccount.contactName);
  console.log('   Email:', demoAccount.email);
  console.log('   Company:', demoAccount.companyName);
  console.log('   Password:', demoAccount.password);
  console.log('\n⏳ Sending request to:', API_URL);
  console.log('');

  try {
    const response = await axios.post(API_URL, demoAccount, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    if (response.data.success) {
      console.log('\n✅ ========================================');
      console.log('✅ DEMO ACCOUNT CREATED SUCCESSFULLY!');
      console.log('✅ ========================================\n');
      console.log('📧 LOGIN CREDENTIALS:');
      console.log('   Email:    ' + demoAccount.email);
      console.log('   Password: ' + demoAccount.password);
      console.log('   Lead ID:  ' + response.data.leadId);
      console.log('   Is New:   ' + response.data.isNew);
      console.log('\n🌐 OPEN APP: http://localhost:5173/');
      console.log('\n💡 TIP: Copy the email and password above to login!\n');
      
      // Write credentials to file
      const fs = await import('fs');
      const credentialsFile = 'DEMO_CREDENTIALS.txt';
      const credentials = `
DEMO ACCOUNT CREDENTIALS
Created: ${new Date().toLocaleString()}
========================================

Email:    ${demoAccount.email}
Password: ${demoAccount.password}
Lead ID:  ${response.data.leadId}

Login at: http://localhost:5173/

========================================
`;
      fs.writeFileSync(credentialsFile, credentials);
      console.log('💾 Credentials saved to: ' + credentialsFile + '\n');
      
      process.exit(0);
    } else {
      console.error('\n❌ Failed to create account');
      console.error('Response:', response.data);
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ ========================================');
    console.error('❌ ERROR CREATING DEMO ACCOUNT');
    console.error('❌ ========================================\n');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received from server');
      console.error('Is the backend running on port 5000?');
    } else {
      console.error('Error:', error.message);
    }
    
    console.error('\n💡 TROUBLESHOOTING:');
    console.error('   1. Make sure backend server is running: cd server && node index.js');
    console.error('   2. Make sure database is connected');
    console.error('   3. Check server console for errors\n');
    
    process.exit(1);
  }
}

// Check if servers are running first
async function checkServers() {
  console.log('🔍 Checking if servers are running...\n');
  
  try {
    const healthCheck = await axios.get('http://localhost:5000/health', { timeout: 3000 });
    console.log('✅ Backend server is running');
    return true;
  } catch (error) {
    console.error('❌ Backend server is NOT running!');
    console.error('\n📋 To start the backend server:');
    console.error('   cd server');
    console.error('   node index.js\n');
    return false;
  }
}

// Main execution
(async () => {
  const serversReady = await checkServers();
  if (serversReady) {
    console.log('');
    await createDemoAccount();
  } else {
    console.error('❌ Please start the servers first!\n');
    process.exit(1);
  }
})();
