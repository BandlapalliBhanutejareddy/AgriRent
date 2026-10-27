const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Ensuring CommunityMessage table exists in database...');
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CommunityMessage" (
        "id" TEXT NOT NULL,
        "senderId" TEXT NOT NULL,
        "text" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "CommunityMessage_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "CommunityMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "CommunityMessage_senderId_idx" ON "CommunityMessage"("senderId");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "CommunityMessage_createdAt_idx" ON "CommunityMessage"("createdAt");
    `);

    const count = await prisma.communityMessage.count();
    console.log('SUCCESS! CommunityMessage table is ready. Current message count:', count);
  } catch (err) {
    console.error('Error creating CommunityMessage table:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
