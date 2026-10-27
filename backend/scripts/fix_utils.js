const fs = require('fs');
let c = fs.readFileSync('backend/tests/utils.js', 'utf8');
const oldCode = `  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });`;

const newCode = `  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });`;

// Normalize CRLF to LF for matching
const cNormalized = c.replace(/\r\n/g, '\n');
const oldNormalized = oldCode.replace(/\r\n/g, '\n');

if (cNormalized.includes(oldNormalized)) {
  const result = cNormalized.replace(oldNormalized, newCode.replace(/\r\n/g, '\n'));
  fs.writeFileSync('backend/tests/utils.js', result);
  console.log('Successfully fixed utils.js fetch headers!');
} else {
  console.error('Failed to locate target block in utils.js');
}
