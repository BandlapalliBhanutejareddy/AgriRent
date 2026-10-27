const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function run() {
  console.log('--- TESTING BANK DETAILS & MAINTENANCE APIS ---');

  // 1. Login as owner (using known seed credentials or token)
  const loginRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    phone: '9876543210',
    email: 'owner11@gmail.com',
    password: 'Password123!',
    role: 'OWNER'
  });

  if (loginRes.status !== 200 || !(loginRes.data?.data?.token || loginRes.data?.token)) {
    console.error('Owner login failed:', loginRes);
    process.exit(1);
  }

  const token = loginRes.data.data?.token || loginRes.data.token;
  const user = loginRes.data.data?.user || loginRes.data.user;
  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  console.log('✓ Owner login successful. Actor ID:', user.id);

  // 2. Test Invalid IFSC Code Validation
  const invalidIfscRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/owner/bank-details',
    method: 'POST',
    headers: authHeaders
  }, {
    accountHolderName: 'Ramesh Patel',
    bankName: 'State Bank of India',
    accountNumber: '123456789012',
    confirmAccountNumber: '123456789012',
    ifscCode: 'INVALID123' // Invalid
  });

  if (invalidIfscRes.status === 400) {
    console.log('✓ Invalid IFSC correctly rejected with 400:', invalidIfscRes.data.message);
  } else {
    console.error('❌ Expected 400 for invalid IFSC, got:', invalidIfscRes);
    process.exit(1);
  }

  // 3. Test Valid Bank Details Save
  const saveBankRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/owner/bank-details',
    method: 'POST',
    headers: authHeaders
  }, {
    accountHolderName: 'Ramesh Patel',
    bankName: 'State Bank of India',
    accountNumber: '50100432987654',
    confirmAccountNumber: '50100432987654',
    ifscCode: 'SBIN0001234'
  });

  if (saveBankRes.status === 200 && saveBankRes.data?.success) {
    console.log('✓ Bank details saved successfully. Masked:', saveBankRes.data.data.accountNumberMasked);
    if (!saveBankRes.data.data.accountNumberMasked.includes('7654')) {
      console.error('❌ Masked account number missing last 4 digits:', saveBankRes.data.data);
      process.exit(1);
    }
  } else {
    console.error('❌ Failed to save bank details:', saveBankRes);
    process.exit(1);
  }

  // 4. Test Fetch Bank Details
  const getBankRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/owner/bank-details',
    method: 'GET',
    headers: authHeaders
  });

  if (getBankRes.status === 200 && getBankRes.data?.data?.ifscCode === 'SBIN0001234') {
    console.log('✓ Fetched bank details successfully:', getBankRes.data.data);
  } else {
    console.error('❌ Failed to retrieve bank details:', getBankRes);
    process.exit(1);
  }

  // 5. Fetch Owner's Equipment
  const myEqRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/equipment/my',
    method: 'GET',
    headers: authHeaders
  });

  const eqList = myEqRes.data?.data?.equipment || myEqRes.data?.data || [];
  if (!eqList || eqList.length === 0) {
    console.error('❌ No equipment found for owner to test maintenance');
    process.exit(1);
  }

  const targetEquipment = eqList[0];
  console.log(`✓ Testing maintenance on equipment: ${targetEquipment.title} (${targetEquipment.id})`);

  // 6. Post Maintenance Record
  const logMaintRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: `/api/equipment/${targetEquipment.id}/maintenance`,
    method: 'POST',
    headers: authHeaders
  }, {
    serviceType: 'Engine Oil & Filter Service',
    serviceDate: new Date().toISOString(),
    cost: 3200,
    providerName: 'Mahindra Authorized Service Center',
    notes: 'Replaced 15W-40 engine oil, fuel filters and cleaned air intake pre-cleaner.',
    nextServiceDue: new Date(Date.now() + 90 * 86400000).toISOString()
  });

  if (logMaintRes.status === 200 && logMaintRes.data?.success) {
    console.log('✓ Maintenance record logged successfully:', logMaintRes.data.data);
  } else {
    console.error('❌ Failed to log maintenance:', logMaintRes);
    process.exit(1);
  }

  // 7. Get Maintenance History
  const getMaintRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: `/api/equipment/${targetEquipment.id}/maintenance`,
    method: 'GET',
    headers: authHeaders
  });

  if (getMaintRes.status === 200 && Array.isArray(getMaintRes.data?.data)) {
    const list = getMaintRes.data.data;
    console.log(`✓ Retrieved ${list.length} maintenance record(s) for equipment!`);
    const found = list.find(r => r.serviceType === 'Engine Oil & Filter Service');
    if (!found) {
      console.error('❌ Did not find logged record in history list');
      process.exit(1);
    }
    console.log('✓ Found verified record:', found.serviceType, 'Cost:', found.cost, 'Provider:', found.providerName);
  } else {
    console.error('❌ Failed to retrieve maintenance history:', getMaintRes);
    process.exit(1);
  }

  console.log('\n>>> ALL BANK DETAILS & MAINTENANCE VERIFICATION TESTS PASSED! <<<');
}

run().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
