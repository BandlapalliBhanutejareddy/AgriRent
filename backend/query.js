const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const users = await prisma.user.findMany({
        select: { role: true, email: true },
        where: { email: { contains: 'test' } }
    });
    console.log(users);
}
main().finally(() => prisma.$disconnect());
