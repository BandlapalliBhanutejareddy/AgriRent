const fs = require('fs');
const path = require('path');

const locContent = fs.readFileSync('mobile/lib/core/localization/app_localizations.dart', 'utf8');

const enStart = locContent.indexOf("'en': {");
const enEnd = locContent.indexOf("'te': {");
const enSection = locContent.substring(enStart, enEnd);
const enKeys = new Set();
const keyRegex = /'([a-zA-Z0-9_]+)':\s*'/g;
let m;
while ((m = keyRegex.exec(enSection)) !== null) {
  enKeys.add(m[1]);
}
console.log('Total English keys:', enKeys.size);

function getFiles(dir, files = []) {
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) getFiles(full, files);
    else if (full.endsWith('.dart')) files.push(full);
  });
  return files;
}

const dartFiles = getFiles('mobile/lib');
const missingKeys = new Set();
const trRegex = /'([a-zA-Z0-9_]+)'\.tr\(/g;

for (const file of dartFiles) {
  const content = fs.readFileSync(file, 'utf8');
  while ((m = trRegex.exec(content)) !== null) {
    if (!enKeys.has(m[1])) {
      missingKeys.add(m[1]);
    }
  }
}

console.log('Missing keys in English count:', missingKeys.size);
console.log('Missing keys list:', Array.from(missingKeys).sort());
