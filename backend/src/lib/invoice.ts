import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { prisma } from './prisma';

export async function generateInvoicePdf(bookingId: string): Promise<Uint8Array> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      equipment: { include: { owner: true } },
      farmer: true,
      payments: true
    }
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  const payment = booking.payments[0] || {};
  
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);
  
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const { width, height } = page.getSize();
  
  // Header
  page.drawText('AGRORENT AI', {
    x: 50,
    y: height - 50,
    size: 24,
    font: helveticaBold,
    color: rgb(0.06, 0.46, 0.2), // Emerald 600
  });

  page.drawText('TAX INVOICE / RENTAL RECEIPT', {
    x: 50,
    y: height - 75,
    size: 12,
    font: helveticaBold,
    color: rgb(0.4, 0.4, 0.4),
  });

  // Invoice Details
  page.drawText(`Invoice No: INV-${payment.id || booking.id.slice(-6).toUpperCase()}`, { x: width - 250, y: height - 50, size: 10, font: helveticaBold });
  page.drawText(`Date: ${new Date().toLocaleDateString()}`, { x: width - 250, y: height - 65, size: 10, font: helveticaFont });
  page.drawText(`Order ID: ${payment.razorpayOrderId || 'N/A'}`, { x: width - 250, y: height - 80, size: 10, font: helveticaFont });
  page.drawText(`Payment ID: ${payment.razorpayPaymentId || 'N/A'}`, { x: width - 250, y: height - 95, size: 10, font: helveticaFont });

  // Divider
  page.drawLine({ start: { x: 50, y: height - 110 }, end: { x: width - 50, y: height - 110 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });

  // Parties
  let startY = height - 140;
  
  // Billed To (Farmer)
  page.drawText('BILLED TO (FARMER):', { x: 50, y: startY, size: 10, font: helveticaBold });
  page.drawText(booking.farmer.name || 'Unknown', { x: 50, y: startY - 15, size: 10, font: helveticaFont });
  page.drawText(booking.farmer.phone || 'N/A', { x: 50, y: startY - 30, size: 10, font: helveticaFont });

  // Billed By (Owner)
  page.drawText('EQUIPMENT OWNER:', { x: 300, y: startY, size: 10, font: helveticaBold });
  page.drawText(booking.equipment.owner?.name || 'Unknown', { x: 300, y: startY - 15, size: 10, font: helveticaFont });
  page.drawText(booking.equipment.owner?.phone || 'N/A', { x: 300, y: startY - 30, size: 10, font: helveticaFont });

  // Divider
  startY -= 60;
  page.drawLine({ start: { x: 50, y: startY }, end: { x: width - 50, y: startY }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });

  // Equipment Details
  startY -= 30;
  page.drawText('DESCRIPTION', { x: 50, y: startY, size: 10, font: helveticaBold });
  page.drawText('AMOUNT (INR)', { x: width - 150, y: startY, size: 10, font: helveticaBold });
  
  startY -= 20;
  page.drawText(`${booking.equipment.title} (${booking.equipment.category})`, { x: 50, y: startY, size: 10, font: helveticaFont });
  page.drawText(`INR ${booking.totalPrice?.toFixed(2)}`, { x: width - 150, y: startY, size: 10, font: helveticaFont });

  startY -= 15;
  page.drawText(`Dates: ${new Date(booking.startDate).toLocaleDateString()} to ${new Date(booking.endDate).toLocaleDateString()}`, { x: 50, y: startY, size: 9, font: helveticaFont, color: rgb(0.4, 0.4, 0.4) });

  // Total
  startY -= 50;
  page.drawLine({ start: { x: width - 200, y: startY + 15 }, end: { x: width - 50, y: startY + 15 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
  
  page.drawText('TOTAL AMOUNT:', { x: width - 250, y: startY, size: 12, font: helveticaBold });
  page.drawText(`INR ${booking.totalPrice?.toFixed(2)}`, { x: width - 150, y: startY, size: 12, font: helveticaBold, color: rgb(0.06, 0.46, 0.2) });

  // Payment Status
  startY -= 30;
  const statusStr = booking.paymentStatus === 'PAID' ? 'PAID' : booking.paymentStatus;
  page.drawText(`PAYMENT STATUS: ${statusStr}`, { x: 50, y: startY, size: 10, font: helveticaBold, color: booking.paymentStatus === 'PAID' ? rgb(0.06, 0.46, 0.2) : rgb(0.8, 0.2, 0.2) });

  // Footer
  page.drawText('Thank you for choosing AgroRent AI.', { x: 50, y: 50, size: 10, font: helveticaFont, color: rgb(0.5, 0.5, 0.5) });
  page.drawText('For support, contact support@agrorent.ai', { x: 50, y: 35, size: 10, font: helveticaFont, color: rgb(0.5, 0.5, 0.5) });

  return await pdfDoc.save();
}
