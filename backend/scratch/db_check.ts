import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting AgroRent AI End-to-End Database Validation Check...');

  // 1. Connection check
  try {
    const userCount = await prisma.user.count();
    console.log(`✅ Connection stable! Current registered users in system: ${userCount}`);
  } catch (err: any) {
    console.error('❌ Failed to connect to PostgreSQL database:', err.message);
    process.exit(1);
  }

  // Find a mock Owner and Farmer user for test relations
  const owner = await prisma.user.findFirst({ where: { role: 'OWNER' } });
  const farmer = await prisma.user.findFirst({ where: { role: 'FARMER' } });

  if (!owner || !farmer) {
    console.log('⚠️ Demo database requires at least one registered OWNER and FARMER to validate transaction flows. Skipping CRUD integration test.');
    return;
  }

  console.log(`ℹ️ Utilizing demo users: Owner=${owner.email}, Farmer=${farmer.email}`);

  // 2. Equipment CRUD Verification
  console.log('\n📦 Step 2: Testing Equipment Listing Transactions...');
  
  const testTitle = `Test Tractor - ${Date.now()}`;
  let equipment = await prisma.equipment.create({
    data: {
      title: testTitle,
      description: 'Validation testing unit equipped with high-tech sensors.',
      category: 'TRACTOR',
      pricePerDay: 1500,
      imageUrl: 'https://images.unsplash.com/photo-1530267981375-f0de937f5f13',
      location: 'Kurnool, AP',
      ownerId: owner.id
    }
  });
  console.log(`✅ Created test equipment successfully: ID=${equipment.id}, Title="${equipment.title}"`);

  // Edit Unit
  equipment = await prisma.equipment.update({
    where: { id: equipment.id },
    data: { pricePerDay: 1750 }
  });
  console.log(`✅ Edited equipment successfully: New Price = ₹${equipment.pricePerDay}/day`);

  // 3. Booking Transactions Verification
  console.log('\n📅 Step 3: Testing Booking Rental escalation...');
  
  let booking = await prisma.booking.create({
    data: {
      farmerId: farmer.id,
      equipmentId: equipment.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000 * 3), // 3 days
      status: 'PENDING',
      totalPrice: 1750 * 3
    }
  });
  console.log(`✅ Created booking rental request successfully: ID=${booking.id}, Total=₹${booking.totalPrice}`);

  // Approve booking
  booking = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: 'ACCEPTED' }
  });
  console.log(`✅ Approved booking successfully: Status escalated to "${booking.status}"`);

  // 4. Notifications Verification
  console.log('\n🔔 Step 4: Testing Notifications stream operations...');
  
  let notification = await prisma.notification.create({
    data: {
      userId: farmer.id,
      title: 'Rental Booking Approved!',
      message: `Your booking request for ${equipment.title} has been accepted by the owner.`,
      type: 'BOOKING',
      relatedId: booking.id
    }
  });
  console.log(`✅ Created notification successfully: ID=${notification.id}`);

  // Mark read
  notification = await prisma.notification.update({
    where: { id: notification.id },
    data: { read: true }
  });
  console.log(`✅ Updated notification read state: read=${notification.read}`);

  // Delete notification
  await prisma.notification.delete({ where: { id: notification.id } });
  console.log('✅ Deleted notification successfully.');

  // 5. Cleanup Temporary Entities
  console.log('\n🧹 Step 5: Rolling back temporary test entities...');
  await prisma.booking.delete({ where: { id: booking.id } });
  console.log('✅ Temporary Booking deleted.');
  
  await prisma.equipment.delete({ where: { id: equipment.id } });
  console.log('✅ Temporary Equipment deleted.');

  console.log('\n🎉 End-to-End Database Persistence Validation PASSED successfully! 100% stable.');
}

main()
  .catch((e) => {
    console.error('❌ Validation check failed with error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
