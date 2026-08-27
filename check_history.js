const { execSync } = require('child_process');

const secrets = [
    'GEMINI_API_KEY',
    'RAZORPAY_KEY_SECRET',
    'SUPABASE_SERVICE_ROLE_KEY',
    'service_role',
    'DATABASE_URL',
    'JWT_SECRET',
    'AIzaSy',
    'rzp_test_',
    'rzp_live_'
];

let found = false;

for (const s of secrets) {
    try {
        const out = execSync(`git log -S"${s}" --oneline`, { encoding: 'utf8' }).trim();
        if (out) {
            console.log('FOUND: ' + s);
            found = true;
        }
    } catch (e) {
        // Ignore
    }
}

if (!found) {
    console.log('NOT FOUND');
}
