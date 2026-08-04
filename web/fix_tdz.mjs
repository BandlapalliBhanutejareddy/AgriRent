import fs from 'fs';
import path from 'path';

const files = [
  'src/app/dashboard/admin/page.tsx',
  'src/app/dashboard/equipment/page.tsx',
  'src/app/dashboard/farmer/page.tsx',
  'src/app/dashboard/guides/[crop]/page.tsx',
  'src/app/dashboard/guides/page.tsx',
  'src/app/dashboard/marketplace/page.tsx',
  'src/app/dashboard/notifications/page.tsx',
  'src/app/dashboard/page.tsx',
  'src/app/login/page.tsx',
  'src/components/AuthProvider.tsx'
];

for (const file of files) {
  const p = path.join(process.cwd(), file);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    
    // Replace const func = async (...) => { ... } with async function func(...) { ... }
    content = content.replace(/const\s+([a-zA-Z0-9_]+)\s*=\s*async\s*\(([^)]*)\)\s*=>\s*\{/g, 'async function $1($2) {');
    // For non-async const func = (...) => {
    content = content.replace(/const\s+([a-zA-Z0-9_]+)\s*=\s*\(([^)]*)\)\s*=>\s*\{/g, 'function $1($2) {');
    
    fs.writeFileSync(p, content, 'utf8');
    console.log(`Fixed ${file}`);
  }
}
