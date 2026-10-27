const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '../src/middlewares/authMiddleware.ts');
let content = fs.readFileSync(target, 'utf8');

const oldBlock = `    const userRole = req.prismaUser.role;
    const hasRequiredRole =
      userRole === 'ADMIN' ||
      userRole === role ||
      userRole === 'BOTH' ||
      (typeof userRole === 'string' && userRole.split(',').map((r: string) => r.trim()).includes(role));

    if (!hasRequiredRole) {
      res.status(403).json({ error: \`Forbidden: Requires \${role} role\` });
      return;
    }`;

const newBlock = `    const userRole = String(req.prismaUser.role || '').toUpperCase();
    const isOwnerRole = role === 'OWNER' && (userRole === 'EQUIPMENT_OWNER' || userRole === 'OWNER' || userRole === 'BOTH' || userRole.includes('OWNER'));
    const isFarmerRole = role === 'FARMER' && (userRole === 'FARMER' || userRole === 'BOTH' || userRole.includes('FARMER'));

    const hasRequiredRole =
      userRole === 'ADMIN' ||
      userRole === role ||
      userRole === 'BOTH' ||
      isOwnerRole ||
      isFarmerRole ||
      (typeof userRole === 'string' && userRole.split(',').map((r: string) => r.trim()).includes(role));

    if (!hasRequiredRole) {
      res.status(403).json({ error: \`Forbidden: Requires \${role} role\` });
      return;
    }`;

const normalizedContent = content.replace(/\r\n/g, '\n');
const normalizedOld = oldBlock.replace(/\r\n/g, '\n');

if (normalizedContent.includes(normalizedOld)) {
  const updated = normalizedContent.replace(normalizedOld, newBlock.replace(/\r\n/g, '\n'));
  fs.writeFileSync(target, updated, 'utf8');
  console.log('✅ authMiddleware.ts updated successfully with normalized CRLF.');
} else {
  console.error('❌ Could not locate oldBlock in authMiddleware.ts');
}
