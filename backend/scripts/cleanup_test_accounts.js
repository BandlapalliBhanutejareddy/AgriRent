const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('=== STARTING SAFE ACCOUNT CLEANUP ===');

  const preservedEmails = new Set([
    'farmer11@gmail.com',
    'owner11@gmail.com',
    'bandlapalliteja369@gmail.com',
    'admin@agrorent.ai',
    'admin@demo.com',
    'admin.live@agrorent.ai',
    'admin-test@agrorent.ai',
    'admin.demo@agrorent.ai'
  ]);

  const allUsers = await prisma.user.findMany({
    include: {
      bookings: true,
      equipments: true,
      notifications: true,
      messages: true,
      savedEquipment: true,
      sessions: true,
      feedbacks: true,
      communityMessages: true
    }
  });

  console.log(`Current total users in database: ${allUsers.length}`);

  const candidatesToDelete = allUsers.filter(u => {
    if (preservedEmails.has(u.email)) return false;
    if (u.role === 'ADMIN') return false;
    if (u.bookings.length > 0) return false;
    if (u.equipments.length > 0) return false;
    return true;
  });

  console.log(`Identified ${candidatesToDelete.length} automated test/disposable accounts for safe cleanup.`);

  const candidateIds = candidatesToDelete.map(u => u.id);

  // Write inventory of users to be deleted
  const inventoryPath = path.join(__dirname, '../../reports/deleted_users_inventory.json');
  fs.writeFileSync(
    inventoryPath,
    JSON.stringify(
      candidatesToDelete.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        createdAt: u.createdAt,
        bookingsCount: u.bookings.length,
        equipmentsCount: u.equipments.length
      })),
      null,
      2
    )
  );
  console.log(`Saved inventory of deleted accounts to: ${inventoryPath}`);

  // Delete candidate users
  const deleteResult = await prisma.user.deleteMany({
    where: { id: { in: candidateIds } }
  });

  console.log(`Successfully deleted ${deleteResult.count} unwanted test accounts.`);

  // Verify remaining state
  const remainingUsers = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true }
  });
  console.log(`Remaining users count: ${remainingUsers.length}`);

  const rolesBreakdown = remainingUsers.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});
  console.log('Remaining users roles breakdown:', rolesBreakdown);

  // Verify farmer11
  const farmer11 = await prisma.user.findUnique({
    where: { email: 'farmer11@gmail.com' },
    include: { bookings: true }
  });
  console.log('farmer11 verification:', {
    exists: !!farmer11,
    role: farmer11?.role,
    name: farmer11?.name,
    bookingsCount: farmer11?.bookings.length
  });

  // Verify owner11
  const owner11 = await prisma.user.findUnique({
    where: { email: 'owner11@gmail.com' },
    include: { equipments: true }
  });
  console.log('owner11 verification:', {
    exists: !!owner11,
    role: owner11?.role,
    name: owner11?.name,
    equipmentsCount: owner11?.equipments.length
  });

  // Verify Admin accounts
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { email: true, name: true }
  });
  console.log('Preserved Admin accounts:', admins);

  // Verify total equipment and bookings
  const totalEquip = await prisma.equipment.count();
  const totalBookings = await prisma.booking.count();
  console.log(`Platform integrity: ${totalEquip} equipment listings and ${totalBookings} bookings preserved intact.`);

  console.log('=== SAFE ACCOUNT CLEANUP COMPLETED ===');
}

main()
  .catch(err => {
    console.error('Cleanup execution error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
