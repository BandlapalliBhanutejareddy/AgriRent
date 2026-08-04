const fs = require('fs');
const path = require('path');

const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
const buffer = Buffer.from(base64Data, 'base64');

const outputPath = path.join('d:', 'AgriRent_AI', 'dummy_tractor.png');
fs.writeFileSync(outputPath, buffer);
console.log(`[SUCCESS] Dummy PNG image created at: ${outputPath}`);
