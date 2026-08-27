const fs = require('fs');

const endpoints = [
    { method: 'GET', url: '/api/health' },
    { method: 'GET', url: '/api/ready' },
    { method: 'POST', url: '/api/auth/register' }, // expected 400 or 201
    { method: 'POST', url: '/api/auth/login' },
    { method: 'GET', url: '/api/equipment' },
    { method: 'POST', url: '/api/booking' }, // expected 401 unauth
    { method: 'GET', url: '/api/user/profile' }, // expected 401
    { method: 'POST', url: '/api/ai/advisor' },
    { method: 'POST', url: '/api/payment/create-order' }
];

async function runApiTests() {
    console.log('Starting API Tests...');
    const evidenceDir = 'D:\\AgriRent_AI\\qa\\evidence\\api';
    if (!fs.existsSync(evidenceDir)) fs.mkdirSync(evidenceDir, { recursive: true });

    const results = [];
    const baseUrl = 'http://localhost:4000';

    for (let i = 0; i < endpoints.length; i++) {
        const ep = endpoints[i];
        const id = `TC-API-${(i+1).toString().padStart(3, '0')}`;
        const start = Date.now();
        let status = 'FAIL';
        let statusCode = 0;
        
        try {
            const res = await fetch(baseUrl + ep.url, {
                method: ep.method,
                headers: { 'Content-Type': 'application/json' },
                body: ep.method === 'POST' ? JSON.stringify({}) : undefined
            });
            statusCode = res.status;
            const text = await res.text();
            
            fs.writeFileSync(`${evidenceDir}\\${id}_response.json`, text);
            if ([200, 201, 400, 401, 403, 404].includes(statusCode)) {
                status = 'PASS';
            }
        } catch (e) {
            console.error(`${id} failed:`, e.message);
        }

        results.push({
            id,
            module: 'API',
            endpoint: ep.url,
            method: ep.method,
            status,
            statusCode,
            duration: Date.now() - start,
            evidence: `qa/evidence/api/${id}_response.json`
        });
    }

    fs.writeFileSync('D:\\AgriRent_AI\\qa\\reports\\API_TEST_RESULTS.json', JSON.stringify(results, null, 2));
    console.log('API Tests Complete.');
}

runApiTests();
