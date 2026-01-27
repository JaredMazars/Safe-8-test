// Quick manual test - copy and paste into browser console on admin dashboard

(async () => {
  try {
    console.log('='.repeat(60));
    console.log('MANUAL API TEST');
    console.log('='.repeat(60));

    // Get CSRF token
    const csrfRes = await fetch('/api/csrf-token', { credentials: 'include' });
    const csrfData = await csrfRes.json();
    console.log('\n1. CSRF Token:', csrfData);

    if (!csrfData.csrfToken) {
      console.error('❌ No csrfToken!');
      return;
    }

    const csrf = csrfData.csrfToken;
    const token = localStorage.getItem('adminToken');

    if (!token) {
      console.error('❌ No admin token! Please login first.');
      return;
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'x-csrf-token': csrf
    };

    // Test GET endpoints
    console.log('\n2. Testing GET endpoints...');
    
    const typesRes = await fetch('/api/admin/config/assessment-types', { headers, credentials: 'include' });
    const typesData = await typesRes.json();
    console.log('Assessment Types:', typesData);

    const industriesRes = await fetch('/api/admin/config/industries', { headers, credentials: 'include' });
    const industriesData = await industriesRes.json();
    console.log('Industries:', industriesData);

    const pillarsRes = await fetch('/api/admin/config/pillars', { headers, credentials: 'include' });
    const pillarsData = await pillarsRes.json();
    console.log('Pillars:', pillarsData);

    // Test CREATE industry
    console.log('\n3. Testing CREATE industry...');
    const createRes = await fetch('/api/admin/config/industries', {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ name: 'Browser Test Industry' })
    });
    const createData = await createRes.json();
    console.log('Create result:', createData);

    // Verify
    console.log('\n4. Verifying...');
    const verifyRes = await fetch('/api/admin/config/industries', { headers, credentials: 'include' });
    const verifyData = await verifyRes.json();
    console.log('Industries after create:', verifyData);

    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST COMPLETE');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
