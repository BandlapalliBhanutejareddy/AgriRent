import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../shared/theme/app_theme.dart';
import '../models/payment_record.dart';
import '../services/receipt_pdf_service.dart';

class PaymentDetailScreen extends ConsumerStatefulWidget {
  final PaymentRecord payment;
  final bool isOwnerView;

  const PaymentDetailScreen({
    super.key,
    required this.payment,
    this.isOwnerView = false,
  });

  @override
  ConsumerState<PaymentDetailScreen> createState() => _PaymentDetailScreenState();
}

class _PaymentDetailScreenState extends ConsumerState<PaymentDetailScreen> {
  bool _isGeneratingPdf = false;

  Future<void> _handleDownloadReceipt() async {
    setState(() => _isGeneratingPdf = true);
    try {
      await ReceiptPdfService.printOrShareReceipt(widget.payment);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to generate receipt: $e'),
            backgroundColor: const Color(0xFFC62828),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isGeneratingPdf = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(languageProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final p = widget.payment;
    final isPaid = p.paymentStatus == 'PAID' || p.paymentStatus == 'SUCCESS';
    final localizedPaymentStatus = AppLocalizations.localizedPaymentStatus(p.paymentStatus, lang);
    final localizedCategory = AppLocalizations.localizedEquipmentCategory(p.equipmentCategory, lang);

    final dateFormat = DateFormat('dd MMM yyyy, hh:mm a');
    final periodFormat = DateFormat('dd MMM yyyy');

    final paymentDateStr = dateFormat.format(p.paymentDate);
    final periodStr = '${periodFormat.format(p.startDate)} – ${periodFormat.format(p.endDate)}';
    final amountStr = AppFormatters.currency(p.amount, lang: lang);
    final totalStr = AppFormatters.currency(p.totalPrice, lang: lang);

    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          widget.isOwnerView ? 'Payment Received Details' : 'Payment Details',
          style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18),
        ),
        backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        foregroundColor: isDark ? Colors.white : AppTheme.textDarkNavy,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // STATUS BADGE CARD
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: isPaid
                    ? (isDark ? const Color(0xFF0F3E22) : const Color(0xFFF0FDF4))
                    : (isDark ? const Color(0xFF2C200B) : const Color(0xFFFFFBEB)),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isPaid ? const Color(0xFFBBF7D0) : const Color(0xFFFDE68A),
                ),
              ),
              child: Column(
                children: [
                  Container(
                    width: 52,
                    height: 52,
                    decoration: BoxDecoration(
                      color: isPaid ? AppTheme.primaryGreen : const Color(0xFFD97706),
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Icon(
                        isPaid ? Icons.check_circle_outline_rounded : Icons.pending_actions_rounded,
                        color: Colors.white,
                        size: 30,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    amountStr,
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w900,
                      color: isPaid
                          ? (isDark ? Colors.white : const Color(0xFF15803D))
                          : (isDark ? Colors.white : const Color(0xFFB45309)),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: isPaid
                          ? const Color(0xFF22C55E).withValues(alpha: 0.2)
                          : const Color(0xFFF59E0B).withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      localizedPaymentStatus,
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                        color: isPaid ? const Color(0xFF15803D) : const Color(0xFFB45309),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // TRANSACTION SUMMARY DETAILS
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: isDark ? AppTheme.darkCard : Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: isDark ? Colors.white12 : const Color(0xFFE2E8F0)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                children: [
                  _buildDetailRow('Transaction Ref', p.transactionRef, isDark),
                  _buildDivider(isDark),
                  _buildDetailRow('Booking ID', p.bookingId, isDark),
                  _buildDivider(isDark),
                  _buildDetailRow('Equipment', p.equipmentTitle, isDark),
                  _buildDivider(isDark),
                  _buildDetailRow('Category', localizedCategory, isDark),
                  _buildDivider(isDark),
                  _buildDetailRow(
                    widget.isOwnerView ? 'RECEIVED FROM' : 'PAID TO',
                    widget.isOwnerView ? p.farmerName : p.ownerName,
                    isDark,
                  ),
                  _buildDivider(isDark),
                  _buildDetailRow('Booking Period', periodStr, isDark),
                  _buildDivider(isDark),
                  _buildDetailRow('Payment Date', paymentDateStr, isDark),
                  _buildDivider(isDark),
                  _buildDetailRow('Payment Method', p.paymentMethod, isDark),
                  _buildDivider(isDark),
                  _buildDetailRow('Booking Estimated Total', totalStr, isDark),
                ],
              ),
            ),
            const SizedBox(height: 28),

            // ACTION BUTTON OR STATUS NOTICE (STRICT RESTRICTION: NO PAID RECEIPT FOR PENDING/UNPAID)
            if (isPaid)
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton.icon(
                  onPressed: _isGeneratingPdf ? null : _handleDownloadReceipt,
                  icon: _isGeneratingPdf
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : const Icon(Icons.receipt_long_rounded),
                  label: Text(
                    _isGeneratingPdf ? 'Generating Receipt...' : 'Download / View Paid Invoice',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryGreen,
                    foregroundColor: Colors.white,
                    elevation: 2,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                ),
              )
            else
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF2C200B) : const Color(0xFFFFFBEB),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: const Color(0xFFF59E0B).withValues(alpha: 0.4),
                  ),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(
                      Icons.info_outline_rounded,
                      color: Color(0xFFD97706),
                      size: 22,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            p.paymentStatus == 'PENDING'
                                ? 'Payment Pending Verification'
                                : p.paymentStatus == 'FAILED'
                                    ? 'Payment Failed'
                                    : 'Payment ${p.paymentStatus}',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                              color: isDark ? Colors.white : const Color(0xFF92400E),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            p.paymentStatus == 'PENDING'
                                ? 'Official paid tax invoice and receipt download will be unlocked as soon as this payment is completed and verified.'
                                : p.paymentStatus == 'FAILED'
                                    ? 'This payment was not completed. Invoices are strictly restricted to verified transactions.'
                                    : 'Official receipt is not available for this transaction status.',
                            style: TextStyle(
                              fontSize: 12,
                              color: isDark ? Colors.white70 : const Color(0xFF78350F),
                              height: 1.35,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.end,
              style: TextStyle(
                fontSize: 13.5,
                fontWeight: FontWeight.w800,
                color: isDark ? Colors.white : AppTheme.textDarkNavy,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDivider(bool isDark) {
    return Divider(height: 1, color: isDark ? Colors.white10 : const Color(0xFFF1F5F9));
  }
}
