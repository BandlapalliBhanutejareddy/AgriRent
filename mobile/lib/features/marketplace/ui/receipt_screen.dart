import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../models/booking.dart';
import '../../../core/theme/app_theme.dart';

class ReceiptScreen extends StatelessWidget {
  final Booking booking;

  const ReceiptScreen({super.key, required this.booking});

  @override
  Widget build(BuildContext context) {
    final start = DateFormat('MMM d, yyyy').format(booking.startDate);
    final end = DateFormat('MMM d, yyyy').format(booking.endDate);
    final equipment = booking.equipment;
    final transaction = (booking.payments != null && booking.payments!.isNotEmpty) ? booking.payments!.first : null;

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Transaction Receipt', style: TextStyle(fontWeight: FontWeight.w900, color: AppTheme.textDark)),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppTheme.textDark),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 4)),
                ],
              ),
              child: Column(
                children: [
                  const Icon(Icons.check_circle, color: AppTheme.primaryGreen, size: 64),
                  const SizedBox(height: 16),
                  const Text('Payment Successful', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
                  const SizedBox(height: 8),
                  Text('₹${booking.totalPrice ?? 0}', style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: AppTheme.primaryGreen)),
                  const SizedBox(height: 24),
                  const Divider(),
                  const SizedBox(height: 24),
                  _buildRow('Booking ID', booking.id),
                  _buildRow('Equipment', equipment?.title ?? 'N/A'),
                  _buildRow('Rental Period', '$start - $end'),
                  _buildRow('Status', booking.status),
                  _buildRow('Payment Status', booking.paymentStatus),
                  if (transaction != null) _buildRow('Transaction ID', transaction['razorpayPaymentId'] ?? transaction['id'] ?? 'N/A'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppTheme.textLight, fontSize: 14)),
          Expanded(
            child: Text(
              value, 
              textAlign: TextAlign.right,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }
}
