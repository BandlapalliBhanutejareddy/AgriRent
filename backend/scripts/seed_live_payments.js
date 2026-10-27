const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  try {
    const farmer = await prisma.user.findFirst({ where: { email: 'farmer.live@agrorent.ai' } });
    const owner = await prisma.user.findFirst({ where: { email: 'owner.live@agrorent.ai' } });

    if (!farmer || !owner) {
      console.error('Farmer or Owner user not found');
      return;
    }

    let equipment = await prisma.equipment.findFirst({ where: { ownerId: owner.id } });
    if (!equipment) {
      equipment = await prisma.equipment.create({
        data: {
          title: 'Mahindra 575 DI Tractor',
          description: 'High performance 45 HP agricultural tractor with rotavator attachment.',
          category: 'TRACTOR',
          pricePerDay: 2200,
          location: 'Kurnool, Andhra Pradesh',
          available: true,
          ownerId: owner.id,
          imageUrl: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=800'
        }
      });
    }

    // Create 1 completed & paid booking with PaymentTransaction
    const booking1 = await prisma.booking.create({
      data: {
        farmerId: farmer.id,
        equipmentId: equipment.id,
        startDate: new Date(Date.now() - 5 * 86400000),
        endDate: new Date(Date.now() - 3 * 86400000),
        totalPrice: 4400,
        amountPaid: 4400,
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        paymentId: 'PAY-AGRI-882910',
        securityDeposit: 1000
      }
    });

    await prisma.paymentTransaction.create({
      data: {
        bookingId: booking1.id,
        farmerId: farmer.id,
        ownerId: owner.id,
        amount: 4400,
        currency: 'INR',
        paymentMethod: 'UPI_RAZORPAY',
        status: 'SUCCESS',
        transactionRef: 'TXN-984210948'
      }
    });

    // Create 1 active confirmed booking
    const booking2 = await prisma.booking.create({
      data: {
        farmerId: farmer.id,
        equipmentId: equipment.id,
        startDate: new Date(Date.now() - 1 * 86400000),
        endDate: new Date(Date.now() + 2 * 86400000),
        totalPrice: 6600,
        amountPaid: 6600,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        paymentId: 'PAY-AGRI-773120',
        securityDeposit: 1500
      }
    });

    await prisma.paymentTransaction.create({
      data: {
        bookingId: booking2.id,
        farmerId: farmer.id,
        ownerId: owner.id,
        amount: 6600,
        currency: 'INR',
        paymentMethod: 'CARD',
        status: 'SUCCESS',
        transactionRef: 'TXN-773120456'
      }
    });

    console.log('Successfully seeded real payment records and bookings!');
  } catch (err) {
    console.error('Seed Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
