const fs = require('fs');
const path = require('path');

const dirs = ['D:/AgriRent_AI/web/src', 'D:/AgriRent_AI/backend/src'];
const mojibakeFiles = [];

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else if (/\.(ts|tsx|js|json)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('Ã') || content.includes('Â')) {
        const lines = content.split('\n');
        const matches = [];
        lines.forEach((line, idx) => {
          if (line.includes('Ã') || (line.includes('Â') && !line.includes('<!--') && !/&\w+;/.test(line))) {
            matches.push({ line: idx + 1, content: line.trim() });
          }
        });
        if (matches.length > 0) {
          mojibakeFiles.push({ file: fullPath, count: matches.length, matches });
        }
      }
    }
  }
}

dirs.forEach(d => scanDir(d));

console.log(`Found ${mojibakeFiles.length} files with potential mojibake:`);
mojibakeFiles.forEach(f => {
  console.log(`\nFile: ${f.file} (${f.count} matches)`);
  f.matches.slice(0, 5).forEach(m => console.log(`  Line ${m.line}: ${m.content}`));
  if (f.matches.length > 5) {
    console.log(`  ... and ${f.matches.length - 5} more`);
  }
});
