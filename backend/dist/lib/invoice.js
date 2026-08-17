"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateInvoicePdf = generateInvoicePdf;
const pdf_lib_1 = require("pdf-lib");
const prisma_1 = require("./prisma");
function generateInvoicePdf(bookingId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        const booking = yield prisma_1.prisma.booking.findUnique({
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
        const pdfDoc = yield pdf_lib_1.PDFDocument.create();
        const page = pdfDoc.addPage([600, 800]);
        const helveticaFont = yield pdfDoc.embedFont(pdf_lib_1.StandardFonts.Helvetica);
        const helveticaBold = yield pdfDoc.embedFont(pdf_lib_1.StandardFonts.HelveticaBold);
        const { width, height } = page.getSize();
        // Header
        page.drawText('AGRORENT AI', {
            x: 50,
            y: height - 50,
            size: 24,
            font: helveticaBold,
            color: (0, pdf_lib_1.rgb)(0.06, 0.46, 0.2), // Emerald 600
        });
        page.drawText('TAX INVOICE / RENTAL RECEIPT', {
            x: 50,
            y: height - 75,
            size: 12,
            font: helveticaBold,
            color: (0, pdf_lib_1.rgb)(0.4, 0.4, 0.4),
        });
        // Invoice Details
        page.drawText(`Invoice No: INV-${payment.id || booking.id.slice(-6).toUpperCase()}`, { x: width - 250, y: height - 50, size: 10, font: helveticaBold });
        page.drawText(`Date: ${new Date().toLocaleDateString()}`, { x: width - 250, y: height - 65, size: 10, font: helveticaFont });
        page.drawText(`Order ID: ${payment.razorpayOrderId || 'N/A'}`, { x: width - 250, y: height - 80, size: 10, font: helveticaFont });
        page.drawText(`Payment ID: ${payment.razorpayPaymentId || 'N/A'}`, { x: width - 250, y: height - 95, size: 10, font: helveticaFont });
        // Divider
        page.drawLine({ start: { x: 50, y: height - 110 }, end: { x: width - 50, y: height - 110 }, thickness: 1, color: (0, pdf_lib_1.rgb)(0.8, 0.8, 0.8) });
        // Parties
        let startY = height - 140;
        // Billed To (Farmer)
        page.drawText('BILLED TO (FARMER):', { x: 50, y: startY, size: 10, font: helveticaBold });
        page.drawText(booking.farmer.name || 'Unknown', { x: 50, y: startY - 15, size: 10, font: helveticaFont });
        page.drawText(booking.farmer.phone || 'N/A', { x: 50, y: startY - 30, size: 10, font: helveticaFont });
        // Billed By (Owner)
        page.drawText('EQUIPMENT OWNER:', { x: 300, y: startY, size: 10, font: helveticaBold });
        page.drawText(((_a = booking.equipment.owner) === null || _a === void 0 ? void 0 : _a.name) || 'Unknown', { x: 300, y: startY - 15, size: 10, font: helveticaFont });
        page.drawText(((_b = booking.equipment.owner) === null || _b === void 0 ? void 0 : _b.phone) || 'N/A', { x: 300, y: startY - 30, size: 10, font: helveticaFont });
        // Divider
        startY -= 60;
        page.drawLine({ start: { x: 50, y: startY }, end: { x: width - 50, y: startY }, thickness: 1, color: (0, pdf_lib_1.rgb)(0.8, 0.8, 0.8) });
        // Equipment Details
        startY -= 30;
        page.drawText('DESCRIPTION', { x: 50, y: startY, size: 10, font: helveticaBold });
        page.drawText('AMOUNT (INR)', { x: width - 150, y: startY, size: 10, font: helveticaBold });
        startY -= 20;
        page.drawText(`${booking.equipment.title} (${booking.equipment.category})`, { x: 50, y: startY, size: 10, font: helveticaFont });
        page.drawText(`INR ${(_c = booking.totalPrice) === null || _c === void 0 ? void 0 : _c.toFixed(2)}`, { x: width - 150, y: startY, size: 10, font: helveticaFont });
        startY -= 15;
        page.drawText(`Dates: ${new Date(booking.startDate).toLocaleDateString()} to ${new Date(booking.endDate).toLocaleDateString()}`, { x: 50, y: startY, size: 9, font: helveticaFont, color: (0, pdf_lib_1.rgb)(0.4, 0.4, 0.4) });
        // Total
        startY -= 50;
        page.drawLine({ start: { x: width - 200, y: startY + 15 }, end: { x: width - 50, y: startY + 15 }, thickness: 1, color: (0, pdf_lib_1.rgb)(0.8, 0.8, 0.8) });
        page.drawText('TOTAL AMOUNT:', { x: width - 250, y: startY, size: 12, font: helveticaBold });
        page.drawText(`INR ${(_d = booking.totalPrice) === null || _d === void 0 ? void 0 : _d.toFixed(2)}`, { x: width - 150, y: startY, size: 12, font: helveticaBold, color: (0, pdf_lib_1.rgb)(0.06, 0.46, 0.2) });
        // Payment Status
        startY -= 30;
        const statusStr = booking.paymentStatus === 'PAID' ? 'PAID' : booking.paymentStatus;
        page.drawText(`PAYMENT STATUS: ${statusStr}`, { x: 50, y: startY, size: 10, font: helveticaBold, color: booking.paymentStatus === 'PAID' ? (0, pdf_lib_1.rgb)(0.06, 0.46, 0.2) : (0, pdf_lib_1.rgb)(0.8, 0.2, 0.2) });
        // Footer
        page.drawText('Thank you for choosing AgroRent AI.', { x: 50, y: 50, size: 10, font: helveticaFont, color: (0, pdf_lib_1.rgb)(0.5, 0.5, 0.5) });
        page.drawText('For support, contact support@agrorent.ai', { x: 50, y: 35, size: 10, font: helveticaFont, color: (0, pdf_lib_1.rgb)(0.5, 0.5, 0.5) });
        return yield pdfDoc.save();
    });
}
