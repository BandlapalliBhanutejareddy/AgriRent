const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({ where: { role: 'FARMER' } });
  console.log('Testing farmer:', user?.id, user?.name);
  if (!user) return;
  const msg = await prisma.communityMessage.create({
    data: {
      senderId: user.id,
      text: 'Direct test message'
    },
    select: {
      id: true,
      senderId: true,
      text: true,
      createdAt: true,
      sender: {
        select: {
          id: true,
          name: true,
          profileImage: true
        }
      }
    }
  });
  console.log('SUCCESS! Created msg:', msg);
  await prisma.communityMessage.delete({ where: { id: msg.id } });
  console.log('Deleted successfully.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
