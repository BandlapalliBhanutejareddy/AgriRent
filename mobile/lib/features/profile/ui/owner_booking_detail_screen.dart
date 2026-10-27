import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../core/services/call_relay_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/booking.dart';
import '../../bookings/repository/booking_repository.dart';
import '../../marketplace/ui/chat_screen.dart';
import '../providers/owner_provider.dart';

class OwnerBookingDetailScreen extends ConsumerStatefulWidget {
  final Booking? booking;
  final String? bookingId;

  const OwnerBookingDetailScreen({
    super.key,
    this.booking,
    this.bookingId,
  });

  @override
  ConsumerState<OwnerBookingDetailScreen> createState() => _OwnerBookingDetailScreenState();
}

class _OwnerBookingDetailScreenState extends ConsumerState<OwnerBookingDetailScreen> {
  Booking? _currentBooking;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _currentBooking = widget.booking;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadAuthoritativeBooking();
    });
  }

  Future<void> _loadAuthoritativeBooking() async {
    final targetId = _currentBooking?.id ?? widget.bookingId;
    if (targetId == null || targetId.isEmpty) return;

    // Check in existing provider list first
    final ownerBookings = ref.read(ownerProvider).bookings;
    final match = ownerBookings.where((b) => b.id == targetId).firstOrNull;
    if (match != null && mounted) {
      setState(() => _currentBooking = match);
    }

    setState(() => _isLoading = true);
    try {
      final fresh = await BookingRepository().fetchBookingById(targetId);
      if (mounted) {
        setState(() {
          _currentBooking = fresh;
          _isLoading = false;
          _errorMessage = null;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          if (_currentBooking == null) {
            _errorMessage = e.toString().replaceFirst('Exception: ', '');
          }
        });
      }
    }
  }

  Future<void> _handleStatusUpdate(String targetStatus, String lang, {String? note}) async {
    if (_currentBooking == null) return;
    final id = _currentBooking!.id;
    final success = await ref.read(ownerProvider.notifier).updateBookingStatus(
      id,
      targetStatus,
      note: note,
    );

    if (!mounted) return;
    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            targetStatus == 'ACCEPTED'
                ? 'booking_accepted_success'.tr(lang)
                : targetStatus == 'REJECTED'
                    ? 'booking_rejected_success'.tr(lang)
                    : targetStatus == 'DISPATCHED'
                        ? 'equipment_dispatched_success'.tr(lang)
                        : targetStatus == 'ACTIVE'
                            ? 'booking_activated_success'.tr(lang)
                            : targetStatus == 'COMPLETED'
                                ? 'rental_completed_success'.tr(lang)
                                : 'status_updated_success'.tr(lang),
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
          backgroundColor: targetStatus == 'REJECTED'
              ? const Color(0xFFD32F2F)
              : AppTheme.primaryGreen,
          behavior: SnackBarBehavior.floating,
        ),
      );
      _loadAuthoritativeBooking();
    } else {
      final err = ref.read(ownerProvider).error ?? 'Action failed';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(err),
          backgroundColor: const Color(0xFFD32F2F),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  void _confirmActionDialog({
    required String title,
    required String message,
    required VoidCallback onConfirm,
    required String lang,
    bool isDestructive = false,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
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
              if (ctx.mounted) Navigator.of(ctx).pop();
              onConfirm();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: isDestructive ? const Color(0xFFD32F2F) : AppTheme.primaryGreen,
              foregroundColor: Colors.white,
            ),
            child: Text(title),
          ),
        ],
      ),
    );
  }

  void _openReturnInspectionDialog(String lang) {
    if (_currentBooking == null) return;
    final booking = _currentBooking!;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    String selectedCondition = 'GOOD';
    final deductionController = TextEditingController(text: '0');
    final notesController = TextEditingController();
    bool isSubmitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) {
          return Padding(
            padding: EdgeInsets.only(
              left: 20,
              right: 20,
              top: 20,
              bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'complete_return_inspection'.tr(lang),
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: isDark ? Colors.white : AppTheme.textDarkNavy,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close_rounded),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '${booking.equipment?.title ?? 'Equipment'} • ${booking.farmer?.name ?? 'Farmer'}',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: isDark ? Colors.white60 : AppTheme.textMutedGray,
                    ),
                  ),
                  const SizedBox(height: 18),

                  // Condition Picker
                  Text(
                    'equipment_condition'.tr(lang),
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: [
                      ('EXCELLENT', 'condition_excellent'.tr(lang)),
                      ('GOOD', 'condition_good'.tr(lang)),
                      ('FAIR', 'condition_fair'.tr(lang)),
                      ('DAMAGED', 'condition_damaged'.tr(lang)),
                    ].map((tuple) {
                      final isSelected = selectedCondition == tuple.$1;
                      return ChoiceChip(
                        label: Text(tuple.$2),
                        selected: isSelected,
                        selectedColor: tuple.$1 == 'DAMAGED'
                            ? const Color(0xFFD32F2F)
                            : AppTheme.primaryGreen,
                        labelStyle: TextStyle(
                          color: isSelected
                              ? Colors.white
                              : (isDark ? Colors.white70 : AppTheme.textDarkNavy),
                          fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                        ),
                        backgroundColor: isDark ? AppTheme.darkBackground : const Color(0xFFF1F5F2),
                        onSelected: (val) {
                          if (val) setModalState(() => selectedCondition = tuple.$1);
                        },
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 18),

                  // Deduction Amount
                  Text(
                    'deduction_amount'.tr(lang),
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                    ),
                  ),
                  const SizedBox(height: 6),
                  TextField(
                    controller: deductionController,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: InputDecoration(
                      prefixText: '₹ ',
                      hintText: 'deduction_hint'.tr(lang),
                      helperText: booking.securityDeposit != null
                          ? '${'security_deposit'.tr(lang)}: ₹${booking.securityDeposit!.toStringAsFixed(0)}'
                          : null,
                      filled: true,
                      fillColor: isDark ? AppTheme.darkBackground : const Color(0xFFF8FAF9),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(
                          color: isDark ? Colors.white12 : Colors.grey.shade300,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Inspection Notes
                  Text(
                    'inspection_notes'.tr(lang),
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                    ),
                  ),
                  const SizedBox(height: 6),
                  TextField(
                    controller: notesController,
                    maxLines: 3,
                    decoration: InputDecoration(
                      hintText: 'inspection_notes_hint'.tr(lang),
                      filled: true,
                      fillColor: isDark ? AppTheme.darkBackground : const Color(0xFFF8FAF9),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(
                          color: isDark ? Colors.white12 : Colors.grey.shade300,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 22),

                  // Submit Button
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: isSubmitting
                          ? null
                          : () async {
                              if (!booking.isOwnerReturnInspectable) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('invalid_inspection_status'.tr(lang)),
                                    backgroundColor: const Color(0xFFD32F2F),
                                  ),
                                );
                                return;
                              }
                              final deductionVal = double.tryParse(deductionController.text.trim()) ?? 0.0;
                              if (deductionVal < 0) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('deduction_negative'.tr(lang)),
                                    backgroundColor: const Color(0xFFD32F2F),
                                  ),
                                );
                                return;
                              }
                              final maxDeposit = booking.securityDeposit ?? 0.0;
                              if (maxDeposit > 0 && deductionVal > maxDeposit) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('${'deduction_exceeds_deposit'.tr(lang)} (₹${maxDeposit.toStringAsFixed(0)})'),
                                    backgroundColor: const Color(0xFFD32F2F),
                                  ),
                                );
                                return;
                              }

                              setModalState(() => isSubmitting = true);
                              final success = await ref.read(ownerProvider.notifier).completeInspection(
                                booking.id,
                                {
                                  'condition': selectedCondition,
                                  'deductionAmount': deductionVal,
                                  'notes': notesController.text.trim(),
                                },
                              );

                              if (!mounted) return;
                              if (success) {
                                if (ctx.mounted) {
                                  Navigator.of(ctx).pop();
                                }
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('inspection_completed_success'.tr(lang)),
                                    backgroundColor: AppTheme.primaryGreen,
                                    behavior: SnackBarBehavior.floating,
                                  ),
                                );
                                _loadAuthoritativeBooking();
                              } else {
                                setModalState(() => isSubmitting = false);
                                final err = ref.read(ownerProvider).error ?? 'failed_to_complete_inspection'.tr(lang);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(err),
                                    backgroundColor: const Color(0xFFD32F2F),
                                    behavior: SnackBarBehavior.floating,
                                  ),
                                );
                              }
                            },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryGreen,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: isSubmitting
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.2),
                            )
                          : Text(
                              'submit_inspection'.tr(lang),
                              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                            ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(languageProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (_currentBooking == null && _isLoading) {
      return Scaffold(
        backgroundColor: isDark ? AppTheme.darkBackground : AppTheme.lightBackground,
        appBar: AppBar(
          title: Text('owner_booking_details'.tr(lang)),
          backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        ),
        body: const Center(
          child: CircularProgressIndicator(color: AppTheme.primaryGreen),
        ),
      );
    }

    if (_currentBooking == null) {
      return Scaffold(
        backgroundColor: isDark ? AppTheme.darkBackground : AppTheme.lightBackground,
        appBar: AppBar(
          title: Text('owner_booking_details'.tr(lang)),
          backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline_rounded, size: 48, color: Color(0xFFD32F2F)),
                const SizedBox(height: 12),
                Text(
                  _errorMessage ?? 'Booking not found',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                  ),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: _loadAuthoritativeBooking,
                  style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryGreen),
                  child: Text('retry'.tr(lang)),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final booking = _currentBooking!;
    final ownerState = ref.watch(ownerProvider);
    final isActionPending = ownerState.isBookingActionPending(booking.id);

    final startDateStr = DateFormat('dd MMM yyyy').format(booking.startDate);
    final endDateStr = DateFormat('dd MMM yyyy').format(booking.endDate);
    final durationDays = booking.endDate.difference(booking.startDate).inDays.clamp(1, 365);

    Color statusColor;
    if (booking.status == 'PENDING') {
      statusColor = const Color(0xFFF57C00);
    } else if (booking.status == 'ACCEPTED' || booking.status == 'ACTIVE' || booking.status == 'CONFIRMED') {
      statusColor = const Color(0xFF2E7D32);
    } else if (booking.status == 'COMPLETED') {
      statusColor = const Color(0xFF00897B);
    } else if (booking.status == 'REJECTED' || booking.status == 'CANCELLED') {
      statusColor = const Color(0xFFD32F2F);
    } else {
      statusColor = const Color(0xFF1976D2);
    }

    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : AppTheme.lightBackground,
      appBar: AppBar(
        title: Text(
          '#${booking.id.length > 8 ? booking.id.substring(0, 8) : booking.id}',
          style: TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 17,
            color: isDark ? Colors.white : AppTheme.textDarkNavy,
          ),
        ),
        backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: isActionPending ? null : _loadAuthoritativeBooking,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 100),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status & Duration Header Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? AppTheme.darkCard : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.05),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: statusColor.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          AppLocalizations.localizedBookingStatus(booking.status, lang),
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                            color: statusColor,
                          ),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        '$durationDays ${'rental_duration_days'.tr(lang)}',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                        ),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: booking.isPaid
                          ? AppTheme.primaryGreen.withValues(alpha: 0.1)
                          : const Color(0xFFF57C00).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      AppLocalizations.localizedPaymentStatus(booking.paymentStatus, lang),
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: booking.isPaid ? AppTheme.primaryGreen : const Color(0xFFF57C00),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // Equipment Summary Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? AppTheme.darkCard : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.05),
                ),
              ),
              child: Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      width: 64,
                      height: 64,
                      color: isDark ? AppTheme.darkBackground : const Color(0xFFF1F5F2),
                      child: booking.equipment?.imageUrl != null &&
                              booking.equipment!.imageUrl.isNotEmpty
                          ? Image.network(
                              booking.equipment!.imageUrl,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) => const Icon(
                                Icons.agriculture_rounded,
                                color: AppTheme.primaryGreen,
                                size: 32,
                              ),
                            )
                          : const Icon(
                              Icons.agriculture_rounded,
                              color: AppTheme.primaryGreen,
                              size: 32,
                            ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          booking.equipment?.title ?? 'Equipment',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: isDark ? Colors.white : AppTheme.textDarkNavy,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          AppLocalizations.localizedEquipmentCategory(
                            booking.equipment?.category ?? 'OTHER',
                            lang,
                          ),
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.primaryGreen,
                          ),
                        ),
                        const SizedBox(height: 4),
                        if (booking.equipment?.pricePerDay != null)
                          Text(
                            '₹${booking.equipment!.pricePerDay!.toStringAsFixed(0)} / ${'day'.tr(lang)}',
                            style: TextStyle(
                              fontSize: 12,
                              color: isDark ? Colors.white60 : AppTheme.textMutedGray,
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // Farmer Contact Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? AppTheme.darkCard : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.05),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'farmer_details'.tr(lang),
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      color: isDark ? Colors.white : AppTheme.textDarkNavy,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 20,
                        backgroundColor: AppTheme.primaryGreen.withValues(alpha: 0.15),
                        child: Text(
                          (booking.farmer?.name.isNotEmpty == true)
                              ? booking.farmer!.name[0].toUpperCase()
                              : 'F',
                          style: const TextStyle(
                            fontWeight: FontWeight.w800,
                            color: AppTheme.primaryGreen,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              booking.farmer?.name ?? 'Farmer',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: isDark ? Colors.white : AppTheme.textDarkNavy,
                              ),
                            ),
                            if (booking.farmer?.email != null)
                              Text(
                                booking.farmer!.email,
                                style: TextStyle(
                                  fontSize: 12,
                                  color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (ctx) => ChatScreen(booking: booking),
                              ),
                            );
                          },
                          icon: const Icon(Icons.chat_bubble_outline_rounded, size: 16),
                          label: Text('chat'.tr(lang)),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppTheme.primaryGreen,
                            side: const BorderSide(color: AppTheme.primaryGreen),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () {
                            CallRelayService.initiatePrivateCall(
                              bookingId: booking.id,
                              context: context,
                              lang: lang,
                              isDark: isDark,
                            );
                          },
                          icon: const Icon(Icons.phone_in_talk_outlined, size: 16),
                          label: Text('call_farmer'.tr(lang)),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: const Color(0xFF16A34A),
                            side: const BorderSide(color: Color(0xFF16A34A)),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // Rental Dates Schedule Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? AppTheme.darkCard : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.05),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.date_range_rounded, size: 18, color: AppTheme.primaryGreen),
                      const SizedBox(width: 8),
                      Text(
                        'choose_rental_period'.tr(lang),
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          color: isDark ? Colors.white : AppTheme.textDarkNavy,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Start Date',
                            style: TextStyle(
                              fontSize: 11,
                              color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            startDateStr,
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: isDark ? Colors.white : AppTheme.textDarkNavy,
                            ),
                          ),
                        ],
                      ),
                      const Icon(Icons.arrow_forward_rounded, size: 16, color: Colors.grey),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            'End Date',
                            style: TextStyle(
                              fontSize: 11,
                              color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            endDateStr,
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: isDark ? Colors.white : AppTheme.textDarkNavy,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // Financial Summary Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? AppTheme.darkCard : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.05),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'total_amount'.tr(lang),
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      color: isDark ? Colors.white : AppTheme.textDarkNavy,
                    ),
                  ),
                  const SizedBox(height: 10),
                  _buildFinancialRow(
                    'total_amount'.tr(lang),
                    '₹${(booking.totalPrice ?? 0.0).toStringAsFixed(0)}',
                    isDark,
                    isBold: true,
                  ),
                  if (booking.securityDeposit != null)
                    _buildFinancialRow(
                      'security_deposit'.tr(lang),
                      '₹${booking.securityDeposit!.toStringAsFixed(0)}',
                      isDark,
                    ),
                  _buildFinancialRow(
                    'Amount Paid',
                    '₹${(booking.amountPaid ?? 0.0).toStringAsFixed(0)}',
                    isDark,
                  ),
                  _buildFinancialRow(
                    'outstanding_balance'.tr(lang),
                    '₹${booking.outstandingBalance.toStringAsFixed(0)}',
                    isDark,
                    color: booking.outstandingBalance > 0
                        ? const Color(0xFFF57C00)
                        : AppTheme.primaryGreen,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // Return Inspection Record (if available)
            if (booking.returnInspection != null) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? AppTheme.darkCard : Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFF00897B).withValues(alpha: 0.4)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'inspection_record'.tr(lang),
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w800,
                            color: isDark ? Colors.white : AppTheme.textDarkNavy,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFF00897B).withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            booking.returnInspection!.condition,
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF00897B),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    _buildFinancialRow(
                      'deduction'.tr(lang),
                      '₹${booking.returnInspection!.deductionAmount.toStringAsFixed(0)}',
                      isDark,
                    ),
                    if (booking.returnInspection!.notes?.isNotEmpty == true) ...[
                      const SizedBox(height: 6),
                      Text(
                        booking.returnInspection!.notes!,
                        style: TextStyle(
                          fontSize: 12.5,
                          fontStyle: FontStyle.italic,
                          color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 14),
            ],

            // Status Timeline Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? AppTheme.darkCard : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.05),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'status_history'.tr(lang),
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      color: isDark ? Colors.white : AppTheme.textDarkNavy,
                    ),
                  ),
                  const SizedBox(height: 12),
                  if (booking.statusHistory.isEmpty)
                    Text(
                      'No status transitions recorded yet.',
                      style: TextStyle(
                        fontSize: 12.5,
                        color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                      ),
                    )
                  else
                    ...booking.statusHistory.map((step) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Padding(
                              padding: EdgeInsets.only(top: 2),
                              child: Icon(
                                Icons.check_circle_rounded,
                                size: 16,
                                color: AppTheme.primaryGreen,
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Expanded(
                                        child: Text(
                                          step.title.isNotEmpty
                                              ? step.title
                                              : step.status,
                                          style: TextStyle(
                                            fontSize: 13,
                                            fontWeight: FontWeight.w700,
                                            color: isDark ? Colors.white : AppTheme.textDarkNavy,
                                          ),
                                        ),
                                      ),
                                      Text(
                                        DateFormat('dd MMM, hh:mm a').format(step.createdAt),
                                        style: TextStyle(
                                          fontSize: 10.5,
                                          color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                                        ),
                                      ),
                                    ],
                                  ),
                                  if (step.note?.isNotEmpty == true) ...[
                                    const SizedBox(height: 2),
                                    Text(
                                      step.note!,
                                      style: TextStyle(
                                        fontSize: 11.5,
                                        color: isDark ? Colors.white60 : AppTheme.textMutedGray,
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    }),
                ],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.darkCard : Colors.white,
          border: Border(
            top: BorderSide(
              color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06),
            ),
          ),
        ),
        child: SafeArea(
          child: _buildActionButtons(booking, isDark, lang, isActionPending),
        ),
      ),
    );
  }

  Widget _buildActionButtons(Booking booking, bool isDark, String lang, bool isActionPending) {
    if (isActionPending) {
      return const SizedBox(
        height: 46,
        child: Center(
          child: CircularProgressIndicator(color: AppTheme.primaryGreen, strokeWidth: 2.5),
        ),
      );
    }

    if (booking.isOwnerAcceptable || booking.isOwnerRejectable) {
      return Row(
        children: [
          Expanded(
            child: OutlinedButton(
              onPressed: () {
                _confirmActionDialog(
                  title: 'reject'.tr(lang),
                  message: 'reject_booking_confirm'.tr(lang),
                  lang: lang,
                  isDestructive: true,
                  onConfirm: () => _handleStatusUpdate('REJECTED', lang),
                );
              },
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFFD32F2F),
                side: const BorderSide(color: Color(0xFFD32F2F)),
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: Text(
                'reject'.tr(lang),
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: ElevatedButton(
              onPressed: () {
                _confirmActionDialog(
                  title: 'accept'.tr(lang),
                  message: 'accept_booking_confirm'.tr(lang),
                  lang: lang,
                  onConfirm: () => _handleStatusUpdate('ACCEPTED', lang),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryGreen,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: Text(
                'accept'.tr(lang),
                style: const TextStyle(fontWeight: FontWeight.w800),
              ),
            ),
          ),
        ],
      );
    }

    if (booking.isOwnerDispatchable) {
      return Row(
        children: [
          Expanded(
            child: OutlinedButton(
              onPressed: () {
                _confirmActionDialog(
                  title: 'dispatch_equipment'.tr(lang),
                  message: 'dispatch_confirm'.tr(lang),
                  lang: lang,
                  onConfirm: () => _handleStatusUpdate('DISPATCHED', lang),
                );
              },
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFF1976D2),
                side: const BorderSide(color: Color(0xFF1976D2)),
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: Text(
                'dispatch_equipment'.tr(lang),
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: ElevatedButton(
              onPressed: () {
                _confirmActionDialog(
                  title: 'mark_active'.tr(lang),
                  message: 'activate_booking_confirm'.tr(lang),
                  lang: lang,
                  onConfirm: () => _handleStatusUpdate('ACTIVE', lang),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryGreen,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: Text(
                'mark_active'.tr(lang),
                style: const TextStyle(fontWeight: FontWeight.w800),
              ),
            ),
          ),
        ],
      );
    }

    if (booking.status == 'DISPATCHED' || booking.status == 'OUT_FOR_DELIVERY' || booking.status == 'IN_TRANSIT') {
      return SizedBox(
        width: double.infinity,
        child: ElevatedButton(
          onPressed: () {
            _confirmActionDialog(
              title: 'mark_active'.tr(lang),
              message: 'activate_booking_confirm'.tr(lang),
              lang: lang,
              onConfirm: () => _handleStatusUpdate('ACTIVE', lang),
            );
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.primaryGreen,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 12),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
          child: Text(
            'mark_active'.tr(lang),
            style: const TextStyle(fontWeight: FontWeight.w800),
          ),
        ),
      );
    }

    if (booking.isOwnerReturnInspectable) {
      return Row(
        children: [
          Expanded(
            child: ElevatedButton.icon(
              onPressed: () => _openReturnInspectionDialog(lang),
              icon: const Icon(Icons.assignment_turned_in_outlined, size: 18),
              label: Text(
                'complete_return_inspection'.tr(lang),
                style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF00897B),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ),
          const SizedBox(width: 10),
          OutlinedButton(
            onPressed: () {
              _confirmActionDialog(
                title: 'accept_return_complete'.tr(lang),
                message: 'complete_booking_confirm'.tr(lang),
                lang: lang,
                onConfirm: () => _handleStatusUpdate('COMPLETED', lang),
              );
            },
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: Text('complete'.tr(lang)),
          ),
        ],
      );
    }

    if (booking.isTerminal) {
      return Container(
        height: 44,
        alignment: Alignment.center,
        child: Text(
          booking.status == 'COMPLETED'
              ? 'rental_completed_success'.tr(lang)
              : 'Booking Finalized',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: isDark ? Colors.white60 : AppTheme.textMutedGray,
          ),
        ),
      );
    }

    return Container(
      height: 44,
      alignment: Alignment.center,
      child: Text(
        'Rental Active',
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w700,
          color: AppTheme.primaryGreen,
        ),
      ),
    );
  }

  Widget _buildFinancialRow(String title, String value, bool isDark, {bool isBold = false, Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: TextStyle(
              fontSize: 12.5,
              fontWeight: isBold ? FontWeight.w700 : FontWeight.w500,
              color: isDark ? Colors.white60 : AppTheme.textMutedGray,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 13,
              fontWeight: isBold ? FontWeight.w800 : FontWeight.w700,
              color: color ?? (isDark ? Colors.white : AppTheme.textDarkNavy),
            ),
          ),
        ],
      ),
    );
  }
}
