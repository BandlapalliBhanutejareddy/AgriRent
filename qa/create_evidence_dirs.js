const fs = require('fs');
const path = require('path');

const tests = [
  'TC-AUTH-001', 'TC-AUTH-002', 'TC-AUTH-003', 'TC-AUTH-004', 'TC-AUTH-005', 'TC-AUTH-006', 'TC-AUTH-007',
  'TC-FRM-001', 'TC-FRM-002', 'TC-MKT-001', 'TC-BKG-001', 'TC-MAP-001', 'TC-NOT-001', 'TC-PRF-001', 'TC-SET-001', 'TC-NET-001', 'TC-SEC-001', 'TC-UIX-001', 'TC-OWN-001', 'TC-OWN-002', 'TC-PAY-001', 'TC-GEM-001', 'TC-GEM-002'
];

tests.forEach(test => {
  const dir = path.join(__dirname, 'evidence', 'android', test);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});
console.log('Directories created.');
