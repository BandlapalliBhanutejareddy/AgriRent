const fs = require('fs');
const path = require('path');

function cleanFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  // Replace known mojibake patterns
  content = content.replace(/Ã°Å¸â€™Â¬/g, '💬');
  content = content.replace(/Ã°Å¸Å½â€°/g, '🎉');
  content = content.replace(/Ã¢Å“â€¦/g, '✅');
  content = content.replace(/Ã¢â€šÂ¹/g, '₹');
  content = content.replace(/Ã¢Å¡Â Ã¯Â¸Â /g, '⚠️');
  content = content.replace(/Ã¢â‚¬â„¢/g, "'");
  content = content.replace(/Ã¢â‚¬â€œ/g, "—");
  content = content.replace(/Ã¢â‚¬â€/g, "—");
  content = content.replace(/Ã¢â‚¬/g, "—");

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Cleaned mojibake in:', filePath);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== 'node_modules' && f !== '.git') walk(full);
    } else if (f.endsWith('.ts') || f.endsWith('.js') || f.endsWith('.json') || f.endsWith('.prisma')) {
      cleanFile(full);
    }
  }
}

walk('d:/AgriRent_AI/backend/src');
walk('d:/AgriRent_AI/backend/prisma');
console.log('Finished mojibake cleanup.');
