const fs = require('fs');
const path = require('path');

// 1. Update chat.ts
const chatPath = path.join(__dirname, '../src/routes/chat.ts');
let chatContent = fs.readFileSync(chatPath, 'utf8').replace(/\r\n/g, '\n');

const oldChatNotif = `    await prisma.notification.create({
      data: {
        userId: receiverId,
        title: 'New Message 💬',
        message: \`\${req.prismaUser.name}: "\${String(text).trim().slice(0, 50)}\${text.length > 50 ? '...' : ''}"\`,
        type: 'CHAT_MESSAGE',
        relatedId: bookingId
      }
    });

    emitToUser(receiverId, 'new_message', chatMessage);`;

const newChatNotif = `    const createdNotif = await prisma.notification.create({
      data: {
        userId: receiverId,
        title: 'New Message 💬',
        message: \`\${req.prismaUser.name}: "\${String(text).trim().slice(0, 50)}\${text.length > 50 ? '...' : ''}"\`,
        type: 'CHAT_MESSAGE',
        relatedId: bookingId
      }
    });

    emitToUser(receiverId, 'new_message', chatMessage);
    emitToUser(receiverId, 'notification', createdNotif);`;

if (chatContent.includes(oldChatNotif)) {
  chatContent = chatContent.replace(oldChatNotif, newChatNotif);
  fs.writeFileSync(chatPath, chatContent.replace(/\n/g, '\r\n'), 'utf8');
  console.log('1. Updated chat.ts with real-time notification emission.');
} else {
  console.log('1. Warning: oldChatNotif not found.');
}

// 2. Update bookings.ts
const bookingsPath = path.join(__dirname, '../src/routes/bookings.ts');
let bookingsContent = fs.readFileSync(bookingsPath, 'utf8').replace(/\r\n/g, '\n');

// Add emitToUser import
if (!bookingsContent.includes("import { emitToUser }")) {
  bookingsContent = bookingsContent.replace(
    "import { prisma } from '../lib/prisma';",
    "import { prisma } from '../lib/prisma';\nimport { emitToUser } from '../lib/socket';"
  );
  console.log('2. Added emitToUser import in bookings.ts.');
}

// Add emitToUser for new booking request notification
const oldBookingNotif = `    // Notify Owner
    await prisma.notification.create({
      data: {
        userId: equipment.ownerId,
        title: 'New Booking Request',
        message: \`\${req.prismaUser.name} requested to rent \${equipment.title} (\${days} days, ₹\${totalPrice}). Approval required.\`,
        type: 'BOOKING_REQUEST',
        relatedId: result.id
      }
    });`;

const newBookingNotif = `    // Notify Owner
    const ownerNotif = await prisma.notification.create({
      data: {
        userId: equipment.ownerId,
        title: 'New Booking Request',
        message: \`\${req.prismaUser.name} requested to rent \${equipment.title} (\${days} days, ₹\${totalPrice}). Approval required.\`,
        type: 'BOOKING_REQUEST',
        relatedId: result.id
      }
    });
    emitToUser(equipment.ownerId, 'notification', ownerNotif);`;

if (bookingsContent.includes(oldBookingNotif)) {
  bookingsContent = bookingsContent.replace(oldBookingNotif, newBookingNotif);
  console.log('3. Added owner notification emit in bookings.ts.');
}

// Add emitToUser for booking status update notification
const oldStatusNotif = `    await prisma.notification.create({
      data: {
        userId: recipientId,
        title: notifTitle,
        message: notifMessage,
        type: 'BOOKING_UPDATE',
        relatedId: booking.id
      }
    });`;

const newStatusNotif = `    const statusNotif = await prisma.notification.create({
      data: {
        userId: recipientId,
        title: notifTitle,
        message: notifMessage,
        type: 'BOOKING_UPDATE',
        relatedId: booking.id
      }
    });
    emitToUser(recipientId, 'notification', statusNotif);`;

if (bookingsContent.includes(oldStatusNotif)) {
  bookingsContent = bookingsContent.replace(oldStatusNotif, newStatusNotif);
  console.log('4. Added status update notification emit in bookings.ts.');
}

fs.writeFileSync(bookingsPath, bookingsContent.replace(/\n/g, '\r\n'), 'utf8');
console.log('Successfully written to bookings.ts.');
