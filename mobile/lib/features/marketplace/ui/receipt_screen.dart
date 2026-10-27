import '../../../core/services/call_relay_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../models/booking.dart';
import '../../../shared/theme/app_theme.dart';
import '../../auth/providers/auth_provider.dart';
import '../../bookings/repository/booking_repository.dart';
import '../../profile/providers/owner_provider.dart';
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

  Future<void> _updateStatus(String status, String lang, {String? successMessage}) async {
    if (_isLoading) return;
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final updated = await BookingRepository().updateBookingStatus(_currentBooking.id, status);
      ref.invalidate(myRentalsProvider);
      ref.read(ownerProvider.notifier).fetchDashboardData();

      if (mounted) {
        setState(() {
          _currentBooking = updated;
          _isLoading = false;
        });

        final msg = successMessage ?? _getDefaultSuccessMessage(status, lang);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(msg),
            backgroundColor: (status == 'CANCELLED' || status == 'REJECTED')
                ? const Color(0xFFC62828)
                : AppTheme.primaryGreen,
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

  String _getDefaultSuccessMessage(String status, String lang) {
    switch (status.toUpperCase()) {
      case 'CANCELLED':
        return 'booking_cancelled_success'.tr(lang);
      case 'RETURN_PENDING':
        return 'return_requested_success'.tr(lang);
      case 'ACCEPTED':
        return 'booking_accepted_success'.tr(lang);
      case 'REJECTED':
        return 'booking_rejected_success'.tr(lang);
      case 'ACTIVE':
        return 'booking_activated_success'.tr(lang);
      case 'COMPLETED':
        return 'rental_completed_success'.tr(lang);
      default:
        return 'status_updated_success'.tr(lang);
    }
  }

  void _confirmAction({
    required String targetStatus,
    required String title,
    required String message,
    required String lang,
    bool isDestructive = false,
  }) {
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
              backgroundColor: isDestructive ? const Color(0xFFC62828) : AppTheme.primaryGreen,
              foregroundColor: Colors.white,
            ),
            child: Text(title),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(languageProvider);
    final authState = ref.watch(authProvider);
    final currentUserId = authState.user?.id;
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final booking = _currentBooking;
    final equipment = booking.equipment;
    final startStr = DateFormat('MMM d, yyyy').format(booking.startDate);
    final endStr = DateFormat('MMM d, yyyy').format(booking.endDate);
    final durationDays = booking.endDate.difference(booking.startDate).inDays + 1;

    final isOwner = (equipment?.ownerId != null && equipment!.ownerId == currentUserId) ||
        (authState.activeRole == 'OWNER' || authState.activeRole == 'EQUIPMENT_OWNER');

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
                            ? '₹${booking.totalPrice!.toStringAsFixed(booking.totalPrice! % 1 == 0 ? 0 : 2)}'
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
                              AppLocalizations.localizedEquipmentCategory(equipment.category, lang),
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
                            '₹${equipment!.pricePerDay!.toStringAsFixed(0)} / ${'per_day'.tr(lang)}',
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

            // Rental Dates & Breakdown Card (Clearly Distinguished from Event History)
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
                    'rental_dates_heading'.tr(lang),
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

            // Supported Lifecycle Timeline Card
            _buildTimelineCard(booking, isDark, lang),

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
                    AppLocalizations.localizedPaymentStatus(booking.paymentStatus, lang),
                    isHighlight: false,
                    isDark: isDark,
                  ),
                  const SizedBox(height: 8),
                  _buildPaymentRow(
                    'total_estimate'.tr(lang),
                    booking.totalPrice != null
                        ? '₹${booking.totalPrice!.toStringAsFixed(booking.totalPrice! % 1 == 0 ? 0 : 2)}'
                        : 'not_available'.tr(lang),
                    isHighlight: false,
                    isDark: isDark,
                  ),
                  const SizedBox(height: 8),
                  _buildPaymentRow(
                    'amount_paid'.tr(lang),
                    booking.amountPaid != null
                        ? '₹${booking.amountPaid!.toStringAsFixed(booking.amountPaid! % 1 == 0 ? 0 : 2)}'
                        : '₹0',
                    isHighlight: false,
                    isDark: isDark,
                  ),
                  const SizedBox(height: 8),
                  _buildPaymentRow(
                    'outstanding_balance'.tr(lang),
                    '₹${booking.outstandingBalance.toStringAsFixed(booking.outstandingBalance % 1 == 0 ? 0 : 2)}',
                    isHighlight: booking.outstandingBalance > 0,
                    isDark: isDark,
                  ),
                  if (booking.securityDeposit != null && booking.securityDeposit! > 0) ...[
                    const SizedBox(height: 8),
                    _buildPaymentRow(
                      'security_deposit'.tr(lang),
                      '₹${booking.securityDeposit!.toStringAsFixed(0)}',
                      isHighlight: false,
                      isDark: isDark,
                    ),
                  ],
                  const SizedBox(height: 12),
                  // Informational Safeguard: Unpaid Warning vs Paid Settlement
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    decoration: BoxDecoration(
                      color: booking.isPaid
                          ? const Color(0xFF2E7D32).withValues(alpha: 0.08)
                          : const Color(0xFFF57F17).withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: booking.isPaid
                            ? const Color(0xFF2E7D32).withValues(alpha: 0.2)
                            : const Color(0xFFF57F17).withValues(alpha: 0.2),
                      ),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(
                          booking.isPaid ? Icons.check_circle_outline : Icons.info_outline,
                          size: 16,
                          color: booking.isPaid ? const Color(0xFF2E7D32) : const Color(0xFFF57F17),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            booking.isPaid
                                ? 'paid_status_note'.tr(lang)
                                : 'unpaid_booking_receipt_warning'.tr(lang),
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                              color: booking.isPaid
                                  ? (isDark ? Colors.green.shade300 : const Color(0xFF2E7D32))
                                  : (isDark ? Colors.amber.shade300 : const Color(0xFFE65100)),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Chat / Call Action Buttons
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
              label: Text(isOwner ? 'chat_with_farmer'.tr(lang) : 'chat_with_owner'.tr(lang)),
            ),
            const SizedBox(height: 10),
            OutlinedButton.icon(
              onPressed: () {
                CallRelayService.initiatePrivateCall(
                  bookingId: booking.id,
                  context: context,
                  lang: lang,
                  isDark: isDark,
                );
              },
              icon: const Icon(Icons.phone_in_talk_outlined, size: 18),
              label: Text(isOwner ? 'call_farmer'.tr(lang) : 'call_owner'.tr(lang)),
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFF16A34A),
                side: const BorderSide(color: Color(0xFF16A34A)),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppTheme.buttonRadius),
                ),
              ),
            ),

            // Role-Aware Action Buttons
            if (isOwner) ...[
              // Owner Lifecycle Controls
              if (booking.isOwnerAcceptable || booking.isOwnerRejectable) ...[
                const SizedBox(height: 12),
                Row(
                  children: [
                    if (booking.isOwnerRejectable)
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: _isLoading
                              ? null
                              : () => _confirmAction(
                                    targetStatus: 'REJECTED',
                                    title: 'reject'.tr(lang),
                                    message: 'reject_booking_confirm'.tr(lang),
                                    lang: lang,
                                    isDestructive: true,
                                  ),
                          icon: const Icon(Icons.close_rounded, size: 18),
                          label: Text('reject'.tr(lang)),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: const Color(0xFFC62828),
                            side: const BorderSide(color: Color(0xFFC62828)),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(AppTheme.buttonRadius),
                            ),
                          ),
                        ),
                      ),
                    if (booking.isOwnerAcceptable && booking.isOwnerRejectable)
                      const SizedBox(width: 10),
                    if (booking.isOwnerAcceptable)
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: _isLoading
                              ? null
                              : () => _confirmAction(
                                    targetStatus: 'ACCEPTED',
                                    title: 'accept'.tr(lang),
                                    message: 'accept_booking_confirm'.tr(lang),
                                    lang: lang,
                                  ),
                          icon: const Icon(Icons.check_rounded, size: 18),
                          label: Text('accept'.tr(lang)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primaryGreen,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(AppTheme.buttonRadius),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ],
              if (booking.isOwnerActivable) ...[
                const SizedBox(height: 12),
                ElevatedButton.icon(
                  onPressed: _isLoading
                      ? null
                      : () => _confirmAction(
                            targetStatus: 'ACTIVE',
                            title: 'mark_active'.tr(lang),
                            message: 'activate_booking_confirm'.tr(lang),
                            lang: lang,
                          ),
                  icon: const Icon(Icons.play_arrow_rounded, size: 18),
                  label: Text('mark_active'.tr(lang)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1976D2),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppTheme.buttonRadius),
                    ),
                  ),
                ),
              ],
              if (booking.isOwnerCompletable) ...[
                const SizedBox(height: 12),
                ElevatedButton.icon(
                  onPressed: _isLoading
                      ? null
                      : () => _confirmAction(
                            targetStatus: 'COMPLETED',
                            title: 'accept_return_complete'.tr(lang),
                            message: 'complete_booking_confirm'.tr(lang),
                            lang: lang,
                          ),
                  icon: const Icon(Icons.done_all_rounded, size: 18),
                  label: Text('accept_return_complete'.tr(lang)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF00897B),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppTheme.buttonRadius),
                    ),
                  ),
                ),
              ],
            ] else ...[
              // Farmer Lifecycle Controls
              if (booking.isFarmerCancellable || booking.isFarmerReturnable) ...[
                const SizedBox(height: 12),
                if (booking.isFarmerCancellable)
                  OutlinedButton.icon(
                    onPressed: _isLoading
                        ? null
                        : () => _confirmAction(
                              targetStatus: 'CANCELLED',
                              title: 'cancel_booking'.tr(lang),
                              message: 'cancel_booking_confirm'.tr(lang),
                              lang: lang,
                              isDestructive: true,
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
                if (booking.isFarmerReturnable)
                  ElevatedButton.icon(
                    onPressed: _isLoading
                        ? null
                        : () => _confirmAction(
                              targetStatus: 'RETURN_PENDING',
                              title: 'request_return'.tr(lang),
                              message: 'request_return_confirm_msg'.tr(lang),
                              lang: lang,
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
            ],

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildTimelineCard(Booking booking, bool isDark, String lang) {
    return Container(
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
          Row(
            children: [
              Icon(Icons.timeline_rounded, size: 18, color: isDark ? Colors.white70 : AppTheme.textDarkNavy),
              const SizedBox(width: 8),
              Text(
                'status_timeline'.tr(lang),
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  color: isDark ? Colors.white : AppTheme.textDarkNavy,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          if (booking.statusHistory.isNotEmpty)
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: booking.statusHistory.length,
              separatorBuilder: (context, index) => Container(
                margin: const EdgeInsets.only(left: 11),
                height: 18,
                width: 2,
                color: isDark ? Colors.white12 : Colors.grey.shade300,
              ),
              itemBuilder: (context, index) {
                final item = booking.statusHistory[index];
                final timeStr = DateFormat('MMM d, yyyy • hh:mm a').format(item.createdAt);
                final isLast = index == booking.statusHistory.length - 1;
                final color = _getStatusColor(item.status);

                return Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      margin: const EdgeInsets.only(top: 2),
                      width: 24,
                      height: 24,
                      decoration: BoxDecoration(
                        color: color.withValues(alpha: 0.15),
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: color,
                          width: isLast ? 2 : 1,
                        ),
                      ),
                      child: Center(
                        child: Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            color: color,
                            shape: BoxShape.circle,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                AppLocalizations.localizedBookingStatus(item.status, lang),
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w800,
                                  color: isDark ? Colors.white : AppTheme.textDarkNavy,
                                ),
                              ),
                              Text(
                                timeStr,
                                style: TextStyle(
                                  fontSize: 10.5,
                                  fontWeight: FontWeight.w500,
                                  color: isDark ? Colors.white38 : AppTheme.textMutedGray,
                                ),
                              ),
                            ],
                          ),
                          if (item.title.isNotEmpty && item.title != item.status) ...[
                            const SizedBox(height: 2),
                            Text(
                              item.title,
                              style: TextStyle(
                                fontSize: 11.5,
                                fontWeight: FontWeight.w600,
                                color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                              ),
                            ),
                          ],
                          if (item.note != null && item.note!.trim().isNotEmpty) ...[
                            const SizedBox(height: 2),
                            Text(
                              item.note!,
                              style: TextStyle(
                                fontSize: 11,
                                color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                );
              },
            )
          else ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isDark ? Colors.white.withValues(alpha: 0.03) : Colors.grey.shade50,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(Icons.info_outline, size: 16, color: isDark ? Colors.white38 : AppTheme.textMutedGray),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'no_status_history'.tr(lang),
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
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
        AppLocalizations.localizedBookingStatus(status, lang),
        style: TextStyle(
          color: fg,
          fontSize: 10,
          fontWeight: FontWeight.w900,
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return const Color(0xFFF57F17);
      case 'ACCEPTED':
      case 'CONFIRMED':
        return const Color(0xFF1976D2);
      case 'ACTIVE':
      case 'DELIVERED':
        return const Color(0xFF2E7D32);
      case 'COMPLETED':
      case 'RETURNED':
        return const Color(0xFF512DA8);
      case 'CANCELLED':
      case 'REJECTED':
        return const Color(0xFFC62828);
      case 'RETURN_PENDING':
        return const Color(0xFF00838F);
      default:
        return Colors.grey.shade600;
    }
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
