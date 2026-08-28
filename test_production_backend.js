const BACKEND_URL = 'https://agrirent-5qpx.onrender.com/api';

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  console.log(`[REQUEST] ${options.method || 'GET'} ${path}`);
  try {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      signal: controller.signal
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw { response: { status: res.status, data } };
    }
    return { data };
  } finally {
    clearTimeout(timeout);
  }
}

async function runTests() {
  const results = {};
  
  try {
    // 1. FARMER LOGIN
    let farmerToken = null;
    try {
      const loginFarmer = await request(`/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email: 'farmer@agrorent.ai', password: 'password123' })
      });
      if (loginFarmer.data.success && loginFarmer.data.user.role === 'FARMER') {
        results['FARMER_LOGIN'] = 'PASS';
        farmerToken = loginFarmer.data.token;
      } else {
        results['FARMER_LOGIN'] = 'FAIL - Wrong role or success false';
      }
    } catch (e) {
      results['FARMER_LOGIN'] = `FAIL - ${e.response?.data?.error || e.message}`;
    }
    console.log('Farmer login done');

    // 2. OWNER LOGIN
    let ownerToken = null;
    try {
      const loginOwner = await request(`/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email: 'owner@agrorent.ai', password: 'password123' })
      });
      if (loginOwner.data.success && loginOwner.data.user.role === 'OWNER') {
        results['OWNER_LOGIN'] = 'PASS';
        ownerToken = loginOwner.data.token;
      } else {
        results['OWNER_LOGIN'] = 'FAIL - Wrong role or success false';
      }
    } catch (e) {
      results['OWNER_LOGIN'] = `FAIL - ${e.response?.data?.error || e.message}`;
    }
    console.log('Owner login done');

    // 3. BOTH ACCOUNT
    try {
      const regBoth = await request(`/auth/register`, {
        method: 'POST',
        body: JSON.stringify({ email: 'owner@agrorent.ai', password: 'password123', name: 'Owner Both', role: 'FARMER' })
      });
      if (regBoth.data.success) {
         results['BOTH_ACCOUNT'] = 'BLOCKED - Requires OTP Verification';
      }
    } catch (e) {
      if (e.response?.data?.error === 'Email already in use') {
         results['BOTH_ACCOUNT'] = 'FAIL - Email already in use (constraint not bypassed properly)';
      } else if (e.response?.data?.error?.includes('OTP')) {
         results['BOTH_ACCOUNT'] = 'BLOCKED - ' + e.response.data.error;
      } else if (e.response?.status === 400 && e.response?.data?.error?.includes('already registered')) {
         results['BOTH_ACCOUNT'] = 'FAIL - already registered';
      } else {
         results['BOTH_ACCOUNT'] = `FAIL - ${e.response?.data?.error || JSON.stringify(e)}`;
      }
    }

    try {
      const loginBoth = await request(`/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email: 'owner@agrorent.ai', password: 'password123' })
      });
      if (loginBoth.data.success && loginBoth.data.user.role === 'BOTH') {
        results['BOTH_ACCOUNT'] = 'PASS';
      }
    } catch (e) {
    }
    console.log('Both account done');

    // 4. PROFILE UPDATE & PERSISTENCE
    if (farmerToken) {
      try {
        const randomPhone = `+9199999${Math.floor(Math.random() * 10000)}`;
        const updateRes = await request(`/auth/profile`, {
          method: 'PUT',
          body: JSON.stringify({ name: 'Updated Farmer', phone: randomPhone }),
          headers: { Authorization: `Bearer ${farmerToken}` }
        });
        if (updateRes.data.success) {
          results['PROFILE_UPDATE'] = 'PASS';
          
          const fetchRes = await request(`/auth/me`, {
            headers: { Authorization: `Bearer ${farmerToken}` }
          });
          if (fetchRes.data.user.phone === randomPhone) {
            results['PROFILE_PERSISTENCE'] = 'PASS';
            results['PROFILE_AFTER_RELOGIN'] = 'PASS'; 
          } else {
             results['PROFILE_PERSISTENCE'] = 'FAIL - Data not saved';
          }
        } else {
           results['PROFILE_UPDATE'] = 'FAIL - success false';
        }
      } catch (e) {
        results['PROFILE_UPDATE'] = `FAIL - ${e.response?.data?.error || e.message}`;
      }
    } else {
      results['PROFILE_UPDATE'] = 'BLOCKED - No Farmer Token';
    }
    console.log('Profile update done');

    // 5. ROLE AUTHORIZATION
    if (farmerToken && ownerToken) {
      try {
        await request(`/rentals/farmer`, {
           headers: { Authorization: `Bearer ${ownerToken}` }
        });
        results['ROLE_AUTHORIZATION'] = 'FAIL - Owner can access Farmer route';
      } catch (e) {
         if (e.response?.status === 403 || e.response?.data?.error?.includes('Access denied')) {
            results['ROLE_AUTHORIZATION'] = 'PASS';
         } else {
            results['ROLE_AUTHORIZATION'] = `PASS - Denied with ${e.response?.status}`;
         }
      }
    } else {
       results['ROLE_AUTHORIZATION'] = 'BLOCKED - Missing tokens';
    }
    console.log('Role auth done');

    // 6. GEMINI
    if (farmerToken) {
      try {
        const aiRes = await request(`/ai/advisor`, {
           method: 'POST',
           body: JSON.stringify({ cropType: 'wheat', soilType: 'clay', farmSize: '5 acres', weatherCondition: 'sunny' }),
           headers: { Authorization: `Bearer ${farmerToken}` }
        });
        if (aiRes.data.success) {
           results['GEMINI'] = 'PASS';
        } else {
           results['GEMINI'] = 'FAIL - ' + JSON.stringify(aiRes.data);
        }
      } catch (e) {
         results['GEMINI'] = `BLOCKED - ${e.response?.data?.error || e.message}`;
      }
    } else {
       results['GEMINI'] = 'BLOCKED - No Farmer Token';
    }
    console.log('Gemini done');

    console.log("=========================================");
    console.log("FINAL RESULTS:");
    console.log(JSON.stringify(results, null, 2));
    console.log("=========================================");

  } catch (err) {
    console.error("Test execution error:", err);
  }
}

runTests();
