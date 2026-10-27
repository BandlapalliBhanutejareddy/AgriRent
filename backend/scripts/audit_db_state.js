const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const farmCrops = await prisma.farmCrop.findMany({
    include: {
      farm: {
        include: {
          owner: { select: { id: true, name: true, email: true, role: true } }
        }
      },
      operations: {
        include: { tasks: true }
      }
    }
  });
  console.log('FARM CROPS IN DB (' + farmCrops.length + '):');
  farmCrops.forEach(fc => {
    console.log(`- ID: ${fc.id} | Crop: ${fc.cropName} | Stage: ${fc.stage} | Farm: ${fc.farm?.name} | Owner: ${fc.farm?.owner?.name} (${fc.farm?.owner?.email})`);
    console.log(`  Operations (${fc.operations.length}):`, fc.operations.map(o => o.name));
  });

  const farmingGuides = await prisma.farmingGuide.findMany();
  console.log('\nFARMING GUIDES IN DB (' + farmingGuides.length + '):');
  farmingGuides.forEach(g => {
    console.log(`- Crop: ${g.cropName} | Step: ${g.stepOrder} - ${g.stepTitle} | Recom: ${g.recommendedEquipment}`);
  });

  const equipment = await prisma.equipment.findMany({
    include: { owner: { select: { id: true, name: true, email: true } } }
  });
  console.log('\nEQUIPMENT IN DB (' + equipment.length + '):');
  equipment.forEach(e => {
    console.log(`- ID: ${e.id} | Name: ${e.title} | Cat: ${e.category} | Avail: ${e.available} | Price: ${e.pricePerDay} | Owner: ${e.owner?.name}`);
  });

  const bookings = await prisma.booking.findMany({
    include: {
      equipment: { select: { id: true, title: true, ownerId: true, owner: { select: { id: true, name: true, email: true } } } },
      farmer: { select: { id: true, name: true, email: true } },
      payments: true
    }
  });
  console.log('\nBOOKINGS IN DB (' + bookings.length + '):');
  bookings.forEach(b => {
    console.log(`- Booking ID: ${b.id} | Eq: ${b.equipment?.title} | Farmer: ${b.farmer?.name} | Owner: ${b.equipment?.owner?.name} | Status: ${b.status} | PayStatus: ${b.paymentStatus} | Total: ${b.totalPrice} | Paid: ${b.amountPaid}`);
    console.log(`  Payments (${b.payments?.length || 0}):`, b.payments);
  });

  const ptx = await prisma.paymentTransaction.findMany();
  console.log('\nALL PAYMENT TRANSACTIONS IN DB (' + ptx.length + '):');
  ptx.forEach(p => {
    console.log(`- TX ID: ${p.id} | Ref: ${p.transactionRef} | BookingId: ${p.bookingId} | Amount: ${p.amount} | Status: ${p.status} | FarmerId: ${p.farmerId} | OwnerId: ${p.ownerId} | Method: ${p.paymentMethod}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
