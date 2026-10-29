const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectUsers() {
  try {
    const totalUsers = await prisma.user.count();
    console.log(`Total users in DB: ${totalUsers}`);

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isVerified: true,
        isSuspended: true,
        _count: {
          select: {
            equipments: true,
            bookings: true,
            farms: true,
            communityPosts: true,
            communityComments: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    console.log('\n--- KEY USERS ---');
    const operationalEmails = ['farmer11@gmail.com', 'owner11@gmail.com', 'admin@agrorent.com', 'admin@gmail.com'];
    users.filter(u => operationalEmails.includes(u.email) || u.role === 'ADMIN').forEach(u => {
      console.log(`[${u.role}] ${u.email} (${u.name}) - ID: ${u.id}, Equip: ${u._count.equipments}, Bookings: ${u._count.bookings}, Farms: ${u._count.farms}`);
    });

    console.log('\n--- ROLE BREAKDOWN ---');
    const roleCounts = {};
    users.forEach(u => {
      roleCounts[u.role] = (roleCounts[u.role] || 0) + 1;
    });
    console.log(roleCounts);

    console.log('\n--- USERS WITH EQUIPMENT OR BOOKINGS ---');
    const activeDataUsers = users.filter(u => u._count.equipments > 0 || u._count.bookings > 0 || u._count.farms > 0);
    console.log(`Users with active relations (equipment/bookings/farms): ${activeDataUsers.length}`);

    const inactiveUsers = users.filter(u => 
      u._count.equipments === 0 && 
      u._count.bookings === 0 && 
      u._count.farms === 0 && 
      u._count.communityPosts === 0 && 
      u._count.communityComments === 0 &&
      !operationalEmails.includes(u.email) &&
      u.role !== 'ADMIN'
    );
    console.log(`Unlinked / demo users eligible for cleanup: ${inactiveUsers.length}`);
    if (inactiveUsers.length > 0) {
      console.log('Sample inactive users:', inactiveUsers.slice(0, 10).map(u => `${u.email} (${u.role})`));
    }
  } catch (err) {
    console.error('Error inspecting users:', err);
  } finally {
    await prisma.$disconnect();
  }
}

inspectUsers();
