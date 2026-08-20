const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const eq = await prisma.equipment.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    console.log(JSON.stringify(eq, null, 2));
}
main().finally(() => prisma.$disconnect());
