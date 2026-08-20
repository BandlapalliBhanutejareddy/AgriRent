const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
    const admin = await prisma.user.upsert({
        where: { email: 'admin-test@agrorent.ai' },
        update: { role: 'ADMIN', isVerified: true },
        create: {
            email: 'admin-test@agrorent.ai',
            password: await bcrypt.hash('password123', 10),
            name: 'Admin Test',
            role: 'ADMIN',
            isVerified: true
        }
    });
    console.log("Admin seeded:", admin.email);
}
main().finally(() => prisma.$disconnect());
