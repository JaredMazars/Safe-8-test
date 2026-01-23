// Direct test of account creation - bypassing all middleware
import Lead from './server/models/Lead.js';

async function testAccountCreation() {
  console.log('\n🧪 ========================================');
  console.log('🧪 TESTING DIRECT ACCOUNT CREATION');
  console.log('🧪 ========================================\n');

  const testData = {
    contactName: 'Test User',
    jobTitle: 'IT Manager',
    email: `test_${Date.now()}@example.com`,
    phoneNumber: '+1-555-0123',
    companyName: 'Test Company Inc',
    companySize: '50-200',
    country: 'United States',
    industry: 'Technology',
    password: 'Password123'
  };

  console.log('📝 Test Data:');
  console.log('   Email:', testData.email);
  console.log('   Name:', testData.contactName);
  console.log('   Company:', testData.companyName);
  console.log('   Password:', testData.password);
  console.log('');

  try {
    console.log('🔄 Calling Lead.updateOrCreate...\n');
    const result = await Lead.updateOrCreate(testData);
    
    console.log('\n📊 Result:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ ========================================');
      console.log('✅ SUCCESS! Account created!');
      console.log('✅ ========================================');
      console.log('\n📧 Login Credentials:');
      console.log('   Email:', testData.email);
      console.log('   Password:', testData.password);
      console.log('   Lead ID:', result.leadId);
      console.log('   Is New:', result.isNew);
      console.log('\n🌐 You can now use these credentials at http://localhost:5173/\n');
      process.exit(0);
    } else {
      console.error('\n❌ ========================================');
      console.error('❌ FAILED!');
      console.error('❌ ========================================');
      console.error('Error:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ ========================================');
    console.error('❌ EXCEPTION!');
    console.error('❌ ========================================');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testAccountCreation();
