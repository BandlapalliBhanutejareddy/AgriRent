const fs = require('fs');
const path = require('path');

function search(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === '.next' || file === 'test-results') continue;
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      search(full);
    } else {
      try {
        const text = fs.readFileSync(full, 'utf8');
        if (text.toLowerCase().includes('mismatch')) {
          console.log('FOUND IN:', full);
        }
      } catch (e) {}
    }
  }
}
search(path.join(__dirname, 'web'));
search(path.join(__dirname, 'backend'));
