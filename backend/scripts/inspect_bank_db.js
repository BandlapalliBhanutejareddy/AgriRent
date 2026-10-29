const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function check() {
  const log = await p.auditLog.findFirst({ where: { resource: 'OWNER_BANK_DETAILS' }, orderBy: { createdAt: 'desc' } });
  console.log('Metadata stored in DB:', log.metadata);
  await p.$disconnect();
}
check();

