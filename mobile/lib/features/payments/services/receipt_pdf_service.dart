import 'dart:io';
import 'package:intl/intl.dart';
import 'package:path_provider/path_provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../models/payment_record.dart';

class ReceiptPdfService {
  static Future<File> generateAndSaveReceiptPdf(PaymentRecord payment) async {
    if (payment.paymentStatus != 'PAID' && payment.paymentStatus != 'SUCCESS') {
      throw Exception('Tax invoices and receipts are strictly restricted to paid and verified transactions.');
    }
    final pdf = pw.Document();

    final dateFormat = DateFormat('dd MMM yyyy, hh:mm a');
    final rangeFormat = DateFormat('dd MMM yyyy');

    final paymentDateStr = dateFormat.format(payment.paymentDate);
    final periodStr = '${rangeFormat.format(payment.startDate)} – ${rangeFormat.format(payment.endDate)}';
    final amountFormatted = 'INR ${payment.amount.toStringAsFixed(2)}';
    final totalFormatted = 'INR ${payment.totalPrice.toStringAsFixed(2)}';

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(36),
        build: (pw.Context context) {
          return pw.Container(
            padding: const pw.EdgeInsets.all(24),
            decoration: pw.BoxDecoration(
              border: pw.Border.all(color: PdfColors.grey400, width: 1.5),
              borderRadius: const pw.BorderRadius.all(pw.Radius.circular(12)),
            ),
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                // HEADER
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.start,
                      children: [
                        pw.Text(
                          'AGRORENT AI',
                          style: pw.TextStyle(
                            fontSize: 22,
                            fontWeight: pw.FontWeight.bold,
                            color: PdfColor.fromHex('#1B5E20'),
                          ),
                        ),
                        pw.SizedBox(height: 2),
                        pw.Text(
                          'Agricultural Equipment Rental Platform',
                          style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey700),
                        ),
                      ],
                    ),
                    pw.Container(
                      padding: const pw.EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                      decoration: pw.BoxDecoration(
                        color: payment.paymentStatus == 'PAID' || payment.paymentStatus == 'SUCCESS'
                            ? PdfColor.fromHex('#E8F5E9')
                            : PdfColor.fromHex('#FFF8E1'),
                        borderRadius: const pw.BorderRadius.all(pw.Radius.circular(8)),
                        border: pw.Border.all(
                          color: payment.paymentStatus == 'PAID' || payment.paymentStatus == 'SUCCESS'
                              ? PdfColor.fromHex('#2E7D32')
                              : PdfColor.fromHex('#FFA000'),
                        ),
                      ),
                      child: pw.Text(
                        payment.paymentStatus == 'PAID' || payment.paymentStatus == 'SUCCESS'
                            ? 'PAYMENT SUCCESSFUL'
                            : 'PAYMENT PENDING',
                        style: pw.TextStyle(
                          fontSize: 10,
                          fontWeight: pw.FontWeight.bold,
                          color: payment.paymentStatus == 'PAID' || payment.paymentStatus == 'SUCCESS'
                              ? PdfColor.fromHex('#1B5E20')
                              : PdfColor.fromHex('#E65100'),
                        ),
                      ),
                    ),
                  ],
                ),
                pw.SizedBox(height: 12),
                pw.Divider(color: PdfColors.grey300),
                pw.SizedBox(height: 12),

                // RECEIPT TITLE
                pw.Center(
                  child: pw.Text(
                    'OFFICIAL PAYMENT RECEIPT',
                    style: pw.TextStyle(
                      fontSize: 15,
                      fontWeight: pw.FontWeight.bold,
                      letterSpacing: 1.2,
                      color: PdfColors.blueGrey900,
                    ),
                  ),
                ),
                pw.SizedBox(height: 18),

                // TRANSACTION & BOOKING DETAILS TABLE
                _buildInfoRow('Receipt / Ref No:', payment.transactionRef),
                _buildInfoRow('Booking ID:', payment.bookingId),
                _buildInfoRow('Payment Date:', paymentDateStr),
                _buildInfoRow('Payment Method:', payment.paymentMethod),
                _buildInfoRow('Equipment Name:', payment.equipmentTitle),
                _buildInfoRow('Equipment Category:', payment.equipmentCategory),
                _buildInfoRow('PAID TO (Owner):', payment.ownerName),
                _buildInfoRow('RECEIVED FROM (Farmer):', payment.farmerName),
                _buildInfoRow('Rental Period:', periodStr),
                pw.SizedBox(height: 16),
                pw.Divider(color: PdfColors.grey300),
                pw.SizedBox(height: 14),

                // AMOUNT SUMMARY
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text('Booking Total Estimated Amount:', style: const pw.TextStyle(fontSize: 12, color: PdfColors.grey800)),
                    pw.Text(totalFormatted, style: pw.TextStyle(fontSize: 12, fontWeight: pw.FontWeight.bold)),
                  ],
                ),
                pw.SizedBox(height: 8),
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text(
                      'Total Amount Paid:',
                      style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold, color: PdfColor.fromHex('#1B5E20')),
                    ),
                    pw.Text(
                      amountFormatted,
                      style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold, color: PdfColor.fromHex('#1B5E20')),
                    ),
                  ],
                ),
                pw.SizedBox(height: 24),
                pw.Spacer(),

                // FOOTER / NOTICE
                pw.Container(
                  padding: const pw.EdgeInsets.all(12),
                  decoration: const pw.BoxDecoration(
                    color: PdfColors.grey100,
                    borderRadius: pw.BorderRadius.all(pw.Radius.circular(8)),
                  ),
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text(
                        'Terms & Verification:',
                        style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold, color: PdfColors.grey800),
                      ),
                      pw.SizedBox(height: 3),
                      pw.Text(
                        'This document is a computer-generated receipt from AgroRent AI platform. It confirms the registered payment details between Farmer and Equipment Owner. For any discrepancy, contact support@agrorent.ai with Booking Ref #${payment.bookingId}.',
                        style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey700),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );

    final bytes = await pdf.save();
    final dir = await getApplicationDocumentsDirectory();
    final file = File('${dir.path}/receipt_${payment.bookingId}.pdf');
    await file.writeAsBytes(bytes);
    return file;
  }

  static pw.Widget _buildInfoRow(String label, String value) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(vertical: 4),
      child: pw.Row(
        children: [
          pw.SizedBox(
            width: 140,
            child: pw.Text(
              label,
              style: pw.TextStyle(fontSize: 10.5, color: PdfColors.grey700, fontWeight: pw.FontWeight.bold),
            ),
          ),
          pw.Expanded(
            child: pw.Text(
              value,
              style: const pw.TextStyle(fontSize: 11, color: PdfColors.black),
            ),
          ),
        ],
      ),
    );
  }

  static Future<void> printOrShareReceipt(PaymentRecord payment) async {
    final pdf = pw.Document();
    final dateFormat = DateFormat('dd MMM yyyy, hh:mm a');
    final rangeFormat = DateFormat('dd MMM yyyy');

    final paymentDateStr = dateFormat.format(payment.paymentDate);
    final periodStr = '${rangeFormat.format(payment.startDate)} – ${rangeFormat.format(payment.endDate)}';
    final amountFormatted = 'INR ${payment.amount.toStringAsFixed(2)}';
    final totalFormatted = 'INR ${payment.totalPrice.toStringAsFixed(2)}';

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(36),
        build: (pw.Context context) {
          return pw.Container(
            padding: const pw.EdgeInsets.all(24),
            decoration: pw.BoxDecoration(
              border: pw.Border.all(color: PdfColors.grey400, width: 1.5),
              borderRadius: const pw.BorderRadius.all(pw.Radius.circular(12)),
            ),
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.start,
                      children: [
                        pw.Text(
                          'AGRORENT AI',
                          style: pw.TextStyle(
                            fontSize: 22,
                            fontWeight: pw.FontWeight.bold,
                            color: PdfColor.fromHex('#1B5E20'),
                          ),
                        ),
                        pw.SizedBox(height: 2),
                        pw.Text(
                          'Agricultural Equipment Rental Platform',
                          style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey700),
                        ),
                      ],
                    ),
                    pw.Container(
                      padding: const pw.EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                      decoration: pw.BoxDecoration(
                        color: payment.paymentStatus == 'PAID' || payment.paymentStatus == 'SUCCESS'
                            ? PdfColor.fromHex('#E8F5E9')
                            : PdfColor.fromHex('#FFF8E1'),
                        borderRadius: const pw.BorderRadius.all(pw.Radius.circular(8)),
                        border: pw.Border.all(
                          color: payment.paymentStatus == 'PAID' || payment.paymentStatus == 'SUCCESS'
                              ? PdfColor.fromHex('#2E7D32')
                              : PdfColor.fromHex('#FFA000'),
                        ),
                      ),
                      child: pw.Text(
                        payment.paymentStatus == 'PAID' || payment.paymentStatus == 'SUCCESS'
                            ? 'PAYMENT SUCCESSFUL'
                            : 'PAYMENT PENDING',
                        style: pw.TextStyle(
                          fontSize: 10,
                          fontWeight: pw.FontWeight.bold,
                          color: payment.paymentStatus == 'PAID' || payment.paymentStatus == 'SUCCESS'
                              ? PdfColor.fromHex('#1B5E20')
                              : PdfColor.fromHex('#E65100'),
                        ),
                      ),
                    ),
                  ],
                ),
                pw.SizedBox(height: 12),
                pw.Divider(color: PdfColors.grey300),
                pw.SizedBox(height: 12),
                pw.Center(
                  child: pw.Text(
                    'OFFICIAL PAYMENT RECEIPT',
                    style: pw.TextStyle(
                      fontSize: 15,
                      fontWeight: pw.FontWeight.bold,
                      letterSpacing: 1.2,
                      color: PdfColors.blueGrey900,
                    ),
                  ),
                ),
                pw.SizedBox(height: 18),
                _buildInfoRow('Receipt / Ref No:', payment.transactionRef),
                _buildInfoRow('Booking ID:', payment.bookingId),
                _buildInfoRow('Payment Date:', paymentDateStr),
                _buildInfoRow('Payment Method:', payment.paymentMethod),
                _buildInfoRow('Equipment Name:', payment.equipmentTitle),
                _buildInfoRow('Equipment Category:', payment.equipmentCategory),
                _buildInfoRow('Renter (Farmer):', payment.farmerName),
                _buildInfoRow('Owner / Provider:', payment.ownerName),
                _buildInfoRow('Rental Period:', periodStr),
                pw.SizedBox(height: 16),
                pw.Divider(color: PdfColors.grey300),
                pw.SizedBox(height: 14),
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text('Booking Total Estimated Amount:', style: const pw.TextStyle(fontSize: 12, color: PdfColors.grey800)),
                    pw.Text(totalFormatted, style: pw.TextStyle(fontSize: 12, fontWeight: pw.FontWeight.bold)),
                  ],
                ),
                pw.SizedBox(height: 8),
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text(
                      'Total Amount Paid:',
                      style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold, color: PdfColor.fromHex('#1B5E20')),
                    ),
                    pw.Text(
                      amountFormatted,
                      style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold, color: PdfColor.fromHex('#1B5E20')),
                    ),
                  ],
                ),
                pw.SizedBox(height: 24),
                pw.Spacer(),
                pw.Container(
                  padding: const pw.EdgeInsets.all(12),
                  decoration: const pw.BoxDecoration(
                    color: PdfColors.grey100,
                    borderRadius: pw.BorderRadius.all(pw.Radius.circular(8)),
                  ),
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text(
                        'Terms & Verification:',
                        style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold, color: PdfColors.grey800),
                      ),
                      pw.SizedBox(height: 3),
                      pw.Text(
                        'This document is a computer-generated receipt from AgroRent AI platform. It confirms the registered payment details between Farmer and Equipment Owner. For any discrepancy, contact support@agrorent.ai with Booking Ref #${payment.bookingId}.',
                        style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey700),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );

    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => pdf.save(),
      name: 'receipt_${payment.bookingId}.pdf',
    );
  }
}
