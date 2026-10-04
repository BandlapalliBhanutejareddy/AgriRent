import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../models/booking.dart';
import '../../../shared/theme/app_theme.dart';
import '../../bookings/repository/booking_repository.dart';
import 'chat_screen.dart';
import 'my_rentals_screen.dart';

class ReceiptScreen extends ConsumerStatefulWidget {
  final Booking booking;

  const ReceiptScreen({super.key, required this.booking});

  @override
  ConsumerState<ReceiptScreen> createState() => _ReceiptScreenState();
}

class _ReceiptScreenState extends ConsumerState<ReceiptScreen> {
  late Booking _currentBooking;
  bool _isLoading = false;
  bool _isFetching = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _currentBooking = widget.booking;
    _refreshBookingDetails();
  }

  Future<void> _refreshBookingDetails() async {
    setState(() => _isFetching = true);
    try {
      final fresh = await BookingRepository().fetchBookingById(_currentBooking.id);
      if (mounted) {
        setState(() {
          _currentBooking = fresh;
          _isFetching = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => _isFetching = false);
      }
    }
  }

  Future<void> _updateStatus(String status, String lang) async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final updated = await BookingRepository().updateBookingStatus(_currentBooking.id, status);
      ref.invalidate(myRentalsProvider);

      if (mounted) {
        setState(() {
          _currentBooking = updated;
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(status == 'CANCELLED'
                ? 'Booking cancelled successfully'
                : 'Return requested successfully'),
            backgroundColor: AppTheme.primaryGreen,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = e.toString().replaceFirst('Exception: ', '');
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_errorMessage ?? 'Failed to update status'),
            backgroundColor: const Color(0xFFC62828),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  void _confirmAction(String targetStatus, String title, String message, String lang) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppTheme.cardRadius)),
        title: Text(
          title,
          style: TextStyle(
            fontWeight: FontWeight.w800,
            color: isDark ? Colors.white : AppTheme.textDarkNavy,
          ),
        ),
        content: Text(
          message,
          style: TextStyle(color: isDark ? Colors.white70 : AppTheme.textDarkNavy),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(
              'cancel'.tr(lang),
              style: TextStyle(color: isDark ? Colors.white54 : AppTheme.textMutedGray),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              _updateStatus(targetStatus, lang);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: targetStatus == 'CANCELLED' ? const Color(0xFFC62828) : AppTheme.primaryGreen,
              foregroundColor: Colors.white,
            ),
            child: Text(targetStatus == 'CANCELLED' ? 'cancel_booking'.tr(lang) : 'request_return'.tr(lang)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(languageProvider);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final booking = _currentBooking;
    final equipment = booking.equipment;
    final startStr = DateFormat('MMM d, yyyy').format(booking.startDate);
    final endStr = DateFormat('MMM d, yyyy').format(booking.endDate);
    final durationDays = booking.endDate.difference(booking.startDate).inDays + 1;

    final isCancellable = booking.status == 'PENDING' || booking.status == 'ACCEPTED';
    final isReturnable = booking.status == 'ACTIVE' || booking.status == 'DELIVERED';

    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : AppTheme.lightBackground,
      appBar: AppBar(
        title: Text(
          'booking_details'.tr(lang),
          style: TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 20,
            color: isDark ? Colors.white : AppTheme.textDarkNavy,
          ),
        ),
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: isDark ? Colors.white : AppTheme.textDarkNavy),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          if (_isFetching)
            const Padding(
              padding: EdgeInsets.only(right: 16.0),
              child: Center(
                child: SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primaryGreen),
                ),
              ),
            )
          else
            IconButton(
              icon: Icon(Icons.refresh, color: isDark ? Colors.white70 : AppTheme.textDarkNavy),
              onPressed: _refreshBookingDetails,
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Status & Booking ID Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? AppTheme.darkCard : Colors.white,
                borderRadius: BorderRadius.circular(AppTheme.cardRadius),
                border: Border.all(
                  color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.03),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'booking_id'.tr(lang),
                            style: TextStyle(
                              fontSize: 11,
                              color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            booking.id.isNotEmpty
                                ? (booking.id.length > 12 ? '#${booking.id.substring(0, 12)}...' : '#${booking.id}')
                                : 'not_available'.tr(lang),
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                              color: isDark ? Colors.white : AppTheme.textDarkNavy,
                              fontFamily: 'monospace',
                            ),
                          ),
                        ],
                      ),
                      _buildStatusChip(booking.status, lang),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Divider(
                    height: 1,
                    color: isDark ? Colors.white12 : Colors.black.withValues(alpha: 0.06),
                  ),
                  const SizedBox(height: 14),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'total_estimate'.tr(lang),
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                        ),
                      ),
                      Text(
                        booking.totalPrice != null
                            ? 'Ã¢â€šÂ¹${booking.totalPrice!.toStringAsFixed(booking.totalPrice! % 1 == 0 ? 0 : 2)}'
                            : 'not_available'.tr(lang),
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                          color: AppTheme.primaryGreen,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Equipment Info Card
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: isDark ? AppTheme.darkCard : Colors.white,
                borderRadius: BorderRadius.circular(AppTheme.cardRadius),
                border: Border.all(
                  color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06),
                ),
              ),
              child: Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: Container(
                      width: 70,
                      height: 70,
                      color: isDark ? Colors.black26 : Colors.grey.shade100,
                      child: equipment?.imageUrl != null && equipment!.imageUrl.trim().isNotEmpty
                          ? Image.network(
                              equipment.imageUrl,
                              fit: BoxFit.cover,
                              errorBuilder: (c, e, s) => _buildPlaceholderIcon(isDark),
                            )
                          : _buildPlaceholderIcon(isDark),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (equipment?.category != null && equipment!.category.isNotEmpty)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            margin: const EdgeInsets.only(bottom: 4),
                            decoration: BoxDecoration(
                              color: AppTheme.primaryGreen.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              equipment.category.toUpperCase(),
                              style: const TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.w800,
                                color: AppTheme.primaryGreen,
                              ),
                            ),
                          ),
                        Text(
                          equipment?.title ?? 'Equipment',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: isDark ? Colors.white : AppTheme.textDarkNavy,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (equipment?.pricePerDay != null)
                          Text(
                            'Ã¢â€šÂ¹${equipment!.pricePerDay!.toStringAsFixed(0)} / ${'per_day'.tr(lang)}',
                            style: TextStyle(
                              fontSize: 12,
                              color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Rental Dates & Breakdown Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? AppTheme.darkCard : Colors.white,
                borderRadius: BorderRadius.circular(AppTheme.cardRadius),
                border: Border.all(
                  color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'rental_dates'.tr(lang),
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      color: isDark ? Colors.white : AppTheme.textDarkNavy,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _buildDateBox('start_date'.tr(lang), startStr, isDark),
                      ),
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 8),
                        child: Icon(Icons.arrow_forward, size: 16, color: AppTheme.primaryGreen),
                      ),
                      Expanded(
                        child: _buildDateBox('end_date'.tr(lang), endStr, isDark),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: isDark ? Colors.white.withValues(alpha: 0.04) : Colors.grey.shade50,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'duration'.tr(lang),
                          style: TextStyle(
                            fontSize: 12,
                            color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                          ),
                        ),
                        Text(
                          '$durationDays ${'days'.tr(lang)}',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: isDark ? Colors.white : AppTheme.textDarkNavy,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Payment & Financial Information Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? AppTheme.darkCard : Colors.white,
                borderRadius: BorderRadius.circular(AppTheme.cardRadius),
                border: Border.all(
                  color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'payment_status'.tr(lang),
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      color: isDark ? Colors.white : AppTheme.textDarkNavy,
                    ),
                  ),
                  const SizedBox(height: 12),
                  _buildPaymentRow(
                    'payment_status'.tr(lang),
                    booking.paymentStatus,
                    isHighlight: false,
                    isDark: isDark,
                  ),
                  const SizedBox(height: 8),
                  _buildPaymentRow(
                    'amount_paid'.tr(lang),
                    booking.amountPaid != null
                        ? 'Ã¢â€šÂ¹${booking.amountPaid!.toStringAsFixed(booking.amountPaid! % 1 == 0 ? 0 : 2)}'
                        : 'Ã¢â€šÂ¹0',
                    isHighlight: true,
                    isDark: isDark,
                  ),
                  if (booking.securityDeposit != null && booking.securityDeposit! > 0) ...[
                    const SizedBox(height: 8),
                    _buildPaymentRow(
                      'security_deposit'.tr(lang),
                      'Ã¢â€šÂ¹${booking.securityDeposit!.toStringAsFixed(0)}',
                      isHighlight: false,
                      isDark: isDark,
                    ),
                  ],
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Chat with Owner Button (Required Physical Device fix)
            ElevatedButton.icon(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => ChatScreen(booking: booking),
                  ),
                );
              },
              icon: const Icon(Icons.chat_bubble_outline, size: 18),
              label: Text('chat_with_owner'.tr(lang)),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryGreen,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppTheme.buttonRadius),
                ),
              ),
            ),

            if (isCancellable || isReturnable) ...[
              const SizedBox(height: 12),
              if (isCancellable)
                OutlinedButton.icon(
                  onPressed: _isLoading
                      ? null
                      : () => _confirmAction(
                            'CANCELLED',
                            'cancel_booking'.tr(lang),
                            'Are you sure you want to cancel this booking request?',
                            lang,
                          ),
                  icon: const Icon(Icons.cancel_outlined, size: 18),
                  label: Text('cancel_booking'.tr(lang)),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFFC62828),
                    side: const BorderSide(color: Color(0xFFC62828)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppTheme.buttonRadius),
                    ),
                  ),
                ),
              if (isReturnable)
                ElevatedButton.icon(
                  onPressed: _isLoading
                      ? null
                      : () => _confirmAction(
                            'RETURN_PENDING',
                            'request_return'.tr(lang),
                            'Request machinery return to owner?',
                            lang,
                          ),
                  icon: const Icon(Icons.assignment_return_outlined, size: 18),
                  label: Text('request_return'.tr(lang)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0288D1),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppTheme.buttonRadius),
                    ),
                  ),
                ),
            ],

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildDateBox(String label, String value, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withValues(alpha: 0.04) : Colors.grey.shade50,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              color: isDark ? Colors.white54 : AppTheme.textMutedGray,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: isDark ? Colors.white : AppTheme.textDarkNavy,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentRow(String label, String value, {required bool isHighlight, required bool isDark}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            color: isDark ? Colors.white60 : AppTheme.textMutedGray,
            fontWeight: FontWeight.w500,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: isHighlight ? 15 : 13,
            fontWeight: isHighlight ? FontWeight.w800 : FontWeight.w600,
            color: isHighlight
                ? AppTheme.primaryGreen
                : (isDark ? Colors.white : AppTheme.textDarkNavy),
          ),
        ),
      ],
    );
  }

  Widget _buildStatusChip(String status, String lang) {
    Color bg;
    Color fg;

    switch (status.toUpperCase()) {
      case 'PENDING':
        bg = const Color(0xFFFFF8E1);
        fg = const Color(0xFFF57F17);
        break;
      case 'ACCEPTED':
      case 'CONFIRMED':
        bg = const Color(0xFFE3F2FD);
        fg = const Color(0xFF1976D2);
        break;
      case 'ACTIVE':
      case 'DELIVERED':
        bg = const Color(0xFFE8F5E9);
        fg = const Color(0xFF2E7D32);
        break;
      case 'COMPLETED':
      case 'RETURNED':
        bg = const Color(0xFFEDE7F6);
        fg = const Color(0xFF512DA8);
        break;
      case 'CANCELLED':
      case 'REJECTED':
        bg = const Color(0xFFFFEBEE);
        fg = const Color(0xFFC62828);
        break;
      case 'RETURN_PENDING':
        bg = const Color(0xFFE0F7FA);
        fg = const Color(0xFF00838F);
        break;
      default:
        bg = Colors.grey.shade100;
        fg = Colors.grey.shade800;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(
          color: fg,
          fontSize: 10,
          fontWeight: FontWeight.w900,
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  Widget _buildPlaceholderIcon(bool isDark) {
    return Center(
      child: Icon(
        Icons.agriculture_rounded,
        size: 32,
        color: isDark ? Colors.white24 : Colors.grey.shade400,
      ),
    );
  }
}
