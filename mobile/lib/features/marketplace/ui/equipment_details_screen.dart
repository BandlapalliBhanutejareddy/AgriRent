import 'package:go_router/go_router.dart';
import '../../../core/services/call_relay_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../models/equipment.dart';
import '../../../shared/theme/app_theme.dart';
import '../../auth/providers/auth_provider.dart';
import '../../bookings/ui/booking_form_screen.dart';
import '../providers/saved_equipment_provider.dart';
import '../../profile/ui/owner_maintenance_dialog.dart';
import '../../profile/providers/owner_provider.dart';
import '../../../models/booking.dart';
import 'equipment_map_screen.dart';

class EquipmentDetailsScreen extends ConsumerStatefulWidget {
  final Equipment equipment;
  const EquipmentDetailsScreen({super.key, required this.equipment});

  @override
  ConsumerState<EquipmentDetailsScreen> createState() => _EquipmentDetailsScreenState();
}

class _EquipmentDetailsScreenState extends ConsumerState<EquipmentDetailsScreen> {
  DateTime? _startDate;
  DateTime? _endDate;

  Future<void> _selectDateRange(bool isDark) async {
    final DateTimeRange? picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: AppTheme.primaryGreen,
              onPrimary: Colors.white,
              surface: isDark ? AppTheme.darkCard : Colors.white,
              onSurface: isDark ? Colors.white : AppTheme.textDarkNavy,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        _startDate = picked.start;
        _endDate = picked.end;
      });
    }
  }

  void _continueToBooking(String lang) {
    if (!widget.equipment.available) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('equipment_unavailable'.tr(lang)),
          backgroundColor: const Color(0xFFC62828),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    if (_startDate == null || _endDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('choose_rental_period'.tr(lang)),
          backgroundColor: const Color(0xFFC62828),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    if (_endDate!.isBefore(_startDate!)) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('end_date_cannot_be_before_start_date'.tr(lang)),
          backgroundColor: const Color(0xFFC62828),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => BookingFormScreen(
          equipment: widget.equipment,
          startDate: _startDate!,
          endDate: _endDate!,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final eq = widget.equipment;
    final lang = ref.watch(languageProvider);
    final isSaved = ref.watch(savedEquipmentProvider.select((s) => s.savedIds.contains(eq.id)));
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final hasPrice = eq.pricePerDay != null && eq.pricePerDay! > 0;
    final currentUser = ref.watch(authProvider).user;
    final isMyEquipment = currentUser != null && (currentUser.id == eq.ownerId || (eq.owner != null && currentUser.id == eq.owner!.id));
    final priceDisplay = hasPrice
        ? '₹${eq.pricePerDay!.toStringAsFixed(eq.pricePerDay! % 1 == 0 ? 0 : 2)}'
        : 'not_available'.tr(lang);

    int rentalDays = 0;
    double totalEstimate = 0;

    if (_startDate != null && _endDate != null) {
      rentalDays = _endDate!.difference(_startDate!).inDays + 1;
      if (hasPrice) {
        totalEstimate = rentalDays * eq.pricePerDay!;
      }
    }

    final hasLocation = eq.location != null && eq.location!.trim().isNotEmpty;
    final hasOwner = eq.owner != null && eq.owner!.name.trim().isNotEmpty;
    final hasRating = eq.rating != null && eq.rating! > 0;
    final hasDescription = eq.description.trim().isNotEmpty;

    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : AppTheme.lightBackground,
      body: CustomScrollView(
        slivers: [
          // Hero Image Header AppBar
          SliverAppBar(
            expandedHeight: 280.0,
            pinned: true,
            backgroundColor: isDark ? AppTheme.darkBackground : AppTheme.primaryGreen,
            leading: IconButton(
              icon: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.45),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.arrow_back, color: Colors.white, size: 20),
              ),
              onPressed: () => Navigator.pop(context),
            ),
            actions: [
              IconButton(
                icon: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.45),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    isSaved ? Icons.favorite : Icons.favorite_border,
                    color: isSaved ? const Color(0xFFE53935) : Colors.white,
                    size: 20,
                  ),
                ),
                onPressed: () async {
                  final user = ref.read(authProvider).user;
                  if (user == null) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('please_login_to_save'.tr(lang)),
                          duration: const Duration(seconds: 2),
                          behavior: SnackBarBehavior.floating,
                        ),
                      );
                    }
                    return;
                  }
                  try {
                    final savedNow = await ref.read(savedEquipmentProvider.notifier).toggleSave(eq);
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(
                            savedNow ? 'saved_to_favorites'.tr(lang) : 'removed_from_favorites'.tr(lang),
                          ),
                          duration: const Duration(seconds: 2),
                          behavior: SnackBarBehavior.floating,
                        ),
                      );
                    }
                  } catch (e) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('failed_to_update_favorite'.tr(lang)),
                          duration: const Duration(seconds: 2),
                          behavior: SnackBarBehavior.floating,
                        ),
                      );
                    }
                  }
                },
              ),
              const SizedBox(width: 8),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  eq.imageUrl.trim().isNotEmpty
                      ? Image.network(
                          eq.imageUrl,
                          fit: BoxFit.cover,
                          loadingBuilder: (context, child, loadingProgress) {
                            if (loadingProgress == null) return child;
                            return Center(
                              child: SizedBox(
                                width: 28,
                                height: 28,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  value: loadingProgress.expectedTotalBytes != null
                                      ? loadingProgress.cumulativeBytesLoaded /
                                          loadingProgress.expectedTotalBytes!
                                      : null,
                                  color: AppTheme.primaryGreen,
                                ),
                              ),
                            );
                          },
                          errorBuilder: (c, e, s) => _buildImagePlaceholder(isDark),
                        )
                      : _buildImagePlaceholder(isDark),

                  // Gradient scrim
                  DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.black.withValues(alpha: 0.4),
                          Colors.transparent,
                          Colors.black.withValues(alpha: 0.6),
                        ],
                      ),
                    ),
                  ),

                  // Status badge at bottom-right of image
                  Positioned(
                    bottom: 24,
                    right: 16,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: eq.available
                            ? const Color(0xFF2E7D32).withValues(alpha: 0.95)
                            : const Color(0xFFC62828).withValues(alpha: 0.95),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.3),
                            blurRadius: 6,
                          ),
                        ],
                      ),
                      child: Text(
                        eq.available ? 'available'.tr(lang).toUpperCase() : 'unavailable'.tr(lang).toUpperCase(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                          fontSize: 10,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Details Body Content
          SliverToBoxAdapter(
            child: Container(
              decoration: BoxDecoration(
                color: isDark ? AppTheme.darkBackground : AppTheme.lightBackground,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Category & Title
                    if (eq.category.isNotEmpty) ...[
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryGreen.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          AppLocalizations.localizedEquipmentCategory(eq.category, lang),
                          style: const TextStyle(
                            color: AppTheme.primaryGreen,
                            fontWeight: FontWeight.w800,
                            fontSize: 11,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                    ],

                    Text(
                      eq.title.isNotEmpty ? eq.title : 'Equipment Details',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w900,
                        color: isDark ? Colors.white : AppTheme.textDarkNavy,
                        height: 1.2,
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Price Card Block
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: isDark ? AppTheme.darkCard : Colors.white,
                        borderRadius: BorderRadius.circular(AppTheme.cardRadius),
                        border: Border.all(
                          color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06),
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'price'.tr(lang),
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.baseline,
                                  textBaseline: TextBaseline.alphabetic,
                                  children: [
                                    Flexible(
                                      child: Text(
                                        priceDisplay,
                                        style: const TextStyle(
                                          fontSize: 24,
                                          fontWeight: FontWeight.w900,
                                          color: AppTheme.primaryGreen,
                                        ),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    if (hasPrice) ...[
                                      const SizedBox(width: 4),
                                      Text(
                                        '/${'per_day'.tr(lang)}',
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ],
                            ),
                          ),
                          if (eq.securityDeposit != null && eq.securityDeposit! > 0)
                            Flexible(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    'security_deposit'.tr(lang),
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    AppFormatters.currency(eq.securityDeposit, lang: lang),
                                    style: TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w700,
                                      color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Quick Specs & Location Row
                    Row(
                      children: [
                        if (hasRating) ...[
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            decoration: BoxDecoration(
                              color: isDark ? AppTheme.darkCard : Colors.white,
                              borderRadius: BorderRadius.circular(AppTheme.cardRadius),
                              border: Border.all(
                                color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06),
                              ),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.star, color: Color(0xFFFFA000), size: 16),
                                const SizedBox(width: 4),
                                Text(
                                  eq.rating!.toStringAsFixed(1),
                                  style: TextStyle(
                                    fontWeight: FontWeight.w800,
                                    fontSize: 13,
                                    color: isDark ? Colors.white : AppTheme.textDarkNavy,
                                  ),
                                ),
                                if (eq.reviewCount != null && eq.reviewCount! > 0) ...[
                                  const SizedBox(width: 4),
                                  Text(
                                    '(${eq.reviewCount})',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                        ],
                        if (hasLocation)
                          Expanded(
                            child: InkWell(
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => EquipmentMapScreen(equipment: eq),
                                  ),
                                );
                              },
                              borderRadius: BorderRadius.circular(AppTheme.cardRadius),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                decoration: BoxDecoration(
                                  color: isDark ? AppTheme.darkCard : Colors.white,
                                  borderRadius: BorderRadius.circular(AppTheme.cardRadius),
                                  border: Border.all(
                                    color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06),
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(Icons.location_on_outlined, size: 16, color: AppTheme.primaryGreen),
                                    const SizedBox(width: 6),
                                    Expanded(
                                      child: Text(
                                        eq.location!,
                                        style: const TextStyle(
                                          color: AppTheme.primaryGreen,
                                          fontWeight: FontWeight.w700,
                                          fontSize: 13,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    const Icon(Icons.chevron_right, size: 16, color: AppTheme.primaryGreen),
                                  ],
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),

                    const SizedBox(height: 20),

                    // Owner Section (if available)
                    if (hasOwner) ...[
                      Text(
                        'equipment_owner'.tr(lang),
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: isDark ? Colors.white : AppTheme.textDarkNavy,
                        ),
                      ),
                      const SizedBox(height: 10),
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
                            CircleAvatar(
                              radius: 20,
                              backgroundColor: AppTheme.primaryGreen.withValues(alpha: 0.15),
                              child: Text(
                                eq.owner!.name.isNotEmpty ? eq.owner!.name[0].toUpperCase() : 'O',
                                style: const TextStyle(
                                  color: AppTheme.primaryGreen,
                                  fontWeight: FontWeight.w800,
                                  fontSize: 16,
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    eq.owner!.name,
                                    style: TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w700,
                                      color: isDark ? Colors.white : AppTheme.textDarkNavy,
                                    ),
                                  ),
                                  Text(
                                    'verified_owner'.tr(lang),
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                IconButton(
                                  tooltip: 'chat'.tr(lang),
                                  icon: Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: AppTheme.primaryGreen.withValues(alpha: 0.12),
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(
                                      Icons.chat_bubble_outline,
                                      color: AppTheme.primaryGreen,
                                      size: 18,
                                    ),
                                  ),
                                  onPressed: () => context.push('/chat'),
                                ),
                                IconButton(
                                  tooltip: 'call_owner'.tr(lang),
                                  icon: Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF16A34A).withValues(alpha: 0.12),
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(
                                      Icons.phone_in_talk_outlined,
                                      color: Color(0xFF16A34A),
                                      size: 18,
                                    ),
                                  ),
                                  onPressed: () {
                                    CallRelayService.initiatePrivateCall(
                                      equipmentId: eq.id,
                                      recipientName: eq.owner!.name,
                                      context: context,
                                      lang: lang,
                                      isDark: isDark,
                                    );
                                  },
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),
                    ],

                    // Description Section
                    Text(
                      'description'.tr(lang),
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: isDark ? Colors.white : AppTheme.textDarkNavy,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: isDark ? AppTheme.darkCard : Colors.white,
                        borderRadius: BorderRadius.circular(AppTheme.cardRadius),
                        border: Border.all(
                          color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06),
                        ),
                      ),
                      child: Text(
                        hasDescription ? eq.description : 'no_description_available'.tr(lang),
                        style: TextStyle(
                          fontSize: 14,
                          color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                          height: 1.5,
                        ),
                      ),
                    ),

                    const SizedBox(height: 20),

                    if (isMyEquipment) ...[
                      // OWNER VIEW: Management Controls & Real Equipment-Level Tracking
                      _buildOwnerManagementAndTracking(eq, ref.watch(ownerProvider), isDark, lang),
                    ] else ...[
                      // FARMER VIEW: Rental Period Booking Selector
                      Text(
                        'select_dates'.tr(lang),
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: isDark ? Colors.white : AppTheme.textDarkNavy,
                        ),
                      ),
                      const SizedBox(height: 10),
                      InkWell(
                        onTap: () => _selectDateRange(isDark),
                        borderRadius: BorderRadius.circular(AppTheme.cardRadius),
                        child: Container(
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
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: AppTheme.primaryGreen.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Icon(
                                  Icons.calendar_month_outlined,
                                  color: AppTheme.primaryGreen,
                                  size: 20,
                                ),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      _startDate != null && _endDate != null
                                          ? '${DateFormat('MMM d, y').format(_startDate!)}  →  ${DateFormat('MMM d, y').format(_endDate!)}'
                                          : 'choose_rental_period'.tr(lang),
                                      style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w700,
                                        color: isDark ? Colors.white : AppTheme.textDarkNavy,
                                      ),
                                    ),
                                    if (_startDate != null && _endDate != null) ...[
                                      const SizedBox(height: 2),
                                      Text(
                                        '$rentalDays ${'days'.tr(lang)} ${'total'.tr(lang)}',
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                              Icon(
                                Icons.edit_calendar,
                                size: 18,
                                color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                              ),
                            ],
                          ),
                        ),
                      ),

                      if (_startDate != null && _endDate != null && hasPrice) ...[
                        const SizedBox(height: 14),
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppTheme.primaryGreen.withValues(alpha: isDark ? 0.12 : 0.06),
                            borderRadius: BorderRadius.circular(AppTheme.cardRadius),
                            border: Border.all(
                              color: AppTheme.primaryGreen.withValues(alpha: 0.2),
                            ),
                          ),
                          child: Column(
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Text(
                                      '${AppFormatters.currency(eq.pricePerDay, lang: lang)} × $rentalDays ${'days'.tr(lang)}',
                                      style: TextStyle(
                                        color: isDark ? Colors.white70 : AppTheme.textMutedGray,
                                        fontSize: 13,
                                      ),
                                    ),
                                  ),
                                  Text(
                                    AppFormatters.currency(totalEstimate, lang: lang),
                                    style: TextStyle(
                                      color: isDark ? Colors.white : AppTheme.textDarkNavy,
                                      fontWeight: FontWeight.w700,
                                      fontSize: 14,
                                    ),
                                  ),
                                ],
                              ),
                              const Padding(
                                padding: EdgeInsets.symmetric(vertical: 8),
                                child: Divider(height: 1),
                              ),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Text(
                                      'total_estimate'.tr(lang),
                                      style: TextStyle(
                                        color: isDark ? Colors.white : AppTheme.textDarkNavy,
                                        fontWeight: FontWeight.w800,
                                        fontSize: 15,
                                      ),
                                    ),
                                  ),
                                  Text(
                                    AppFormatters.currency(totalEstimate, lang: lang),
                                    style: const TextStyle(
                                      color: AppTheme.primaryGreen,
                                      fontWeight: FontWeight.w900,
                                      fontSize: 20,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 10),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(
                              Icons.info_outline_rounded,
                              size: 15,
                              color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                            ),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                'booking_dates_availability_note'.tr(lang),
                                style: TextStyle(
                                  fontSize: 12,
                                  color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                                  height: 1.3,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],

                      const SizedBox(height: 28),

                      // Primary Action Button (Rent / Book)
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: eq.available ? () => _continueToBooking(lang) : null,
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            backgroundColor: AppTheme.primaryGreen,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(AppTheme.buttonRadius),
                            ),
                          ),
                          child: Text(
                            eq.available ? 'rent_book'.tr(lang) : 'unavailable'.tr(lang),
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                      ),
                    ],

                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOwnerManagementAndTracking(Equipment eq, OwnerState ownerState, bool isDark, String lang) {
    final cardBg = isDark ? AppTheme.darkCard : Colors.white;
    final borderColor = isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06);
    final isTogglingAvailability = ownerState.isEquipmentActionPending(eq.id);

    // Find all bookings for this equipment
    final equipmentBookings = ownerState.bookings.where((b) => b.equipmentId == eq.id || b.equipment?.id == eq.id).toList();

    // Sort: active/pending first, then by start date descending
    equipmentBookings.sort((a, b) {
      final aActive = (a.status == 'PENDING' || a.status == 'ACCEPTED' || a.status == 'DISPATCHED' || a.status == 'ACTIVE' || a.status == 'RETURN_PENDING' || a.status == 'INSPECTION_PENDING') ? 1 : 0;
      final bActive = (b.status == 'PENDING' || b.status == 'ACCEPTED' || b.status == 'DISPATCHED' || b.status == 'ACTIVE' || b.status == 'RETURN_PENDING' || b.status == 'INSPECTION_PENDING') ? 1 : 0;
      if (aActive != bActive) return bActive.compareTo(aActive);
      return b.startDate.compareTo(a.startDate);
    });

    final activeOrLatestBooking = equipmentBookings.isNotEmpty ? equipmentBookings.first : null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 1. OWNER MANAGEMENT & AVAILABILITY CONTROLS
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: cardBg,
            borderRadius: BorderRadius.circular(AppTheme.cardRadius),
            border: Border.all(color: borderColor),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryGreen.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.tune_rounded, color: AppTheme.primaryGreen, size: 20),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        'Owner Controls',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: isDark ? Colors.white : AppTheme.textDarkNavy,
                        ),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: eq.available
                          ? const Color(0xFF16A34A).withValues(alpha: 0.12)
                          : const Color(0xFFDC2626).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      eq.available ? 'AVAILABLE' : 'UNAVAILABLE',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: eq.available ? const Color(0xFF16A34A) : const Color(0xFFDC2626),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // Availability Toggle Row
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: isDark ? Colors.white.withValues(alpha: 0.04) : Colors.black.withValues(alpha: 0.02),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Listing Status for Farmers',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: isDark ? Colors.white : AppTheme.textDarkNavy,
                            ),
                          ),
                          Text(
                            eq.available ? 'Visible & bookable in catalog' : 'Hidden from farmer search',
                            style: TextStyle(
                              fontSize: 11,
                              color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (isTogglingAvailability)
                      const SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primaryGreen),
                      )
                    else
                      Switch(
                        value: eq.available,
                        activeThumbColor: AppTheme.primaryGreen,
                        onChanged: (val) async {
                          final success = await ref
                              .read(ownerProvider.notifier)
                              .updateEquipmentAvailability(eq.id, val);
                          if (!mounted) return;
                          if (!success) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(ownerState.error ?? 'Failed to update availability'),
                                backgroundColor: const Color(0xFFDC2626),
                              ),
                            );
                          }
                        },
                      ),
                  ],
                ),
              ),

              const SizedBox(height: 12),

              // Action Buttons Row: Edit Listing & Maintenance Record
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.edit_outlined, size: 16),
                      label: const Text('Edit Listing', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        foregroundColor: AppTheme.primaryGreen,
                        side: BorderSide(color: AppTheme.primaryGreen.withValues(alpha: 0.4)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: () {
                        context.push('/edit-equipment', extra: eq);
                      },
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.build_circle_outlined, size: 16),
                      label: const Text('Maintenance', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        foregroundColor: const Color(0xFF2563EB),
                        side: BorderSide(color: const Color(0xFF2563EB).withValues(alpha: 0.4)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: () {
                        OwnerMaintenanceDialog.show(context, equipmentId: eq.id);
                      },
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        const SizedBox(height: 24),

        // 2. OPERATIONAL EQUIPMENT-LEVEL TRACKING SECTION
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Equipment Tracking & Rentals',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: isDark ? Colors.white : AppTheme.textDarkNavy,
              ),
            ),
            if (equipmentBookings.isNotEmpty)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppTheme.primaryGreen.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${equipmentBookings.length} ${equipmentBookings.length == 1 ? 'Booking' : 'Bookings'}',
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.primaryGreen),
                ),
              ),
          ],
        ),
        const SizedBox(height: 10),

        if (activeOrLatestBooking == null)
          // EMPTY STATE: No real rental tracking available yet
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 20),
            decoration: BoxDecoration(
              color: cardBg,
              borderRadius: BorderRadius.circular(AppTheme.cardRadius),
              border: Border.all(color: borderColor),
            ),
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.04),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.history_toggle_off_rounded,
                    size: 36,
                    color: isDark ? Colors.white38 : AppTheme.textMutedGray,
                  ),
                ),
                const SizedBox(height: 14),
                Text(
                  'No rental tracking available yet',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: isDark ? Colors.white : AppTheme.textDarkNavy,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'When a farmer books this equipment, its operational lifecycle, dispatch milestones, real timestamps, and return inspection will be tracked here.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          )
        else
          // REAL BOOKING TRACKING CARD
          _buildBookingTrackingCard(activeOrLatestBooking, ownerState, isDark, lang, cardBg, borderColor),

        // Previous historical rentals if any
        if (equipmentBookings.length > 1) ...[
          const SizedBox(height: 16),
          ExpansionTile(
            title: Text(
              'Past Bookings (${equipmentBookings.length - 1})',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: isDark ? Colors.white : AppTheme.textDarkNavy,
              ),
            ),
            children: equipmentBookings.sublist(1).map((histBooking) {
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: cardBg,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: borderColor),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '#${histBooking.id.substring(0, histBooking.id.length >= 8 ? 8 : histBooking.id.length).toUpperCase()}',
                          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                        ),
                        Text(
                          '${DateFormat('dd MMM yyyy').format(histBooking.startDate)} - ${DateFormat('dd MMM yyyy').format(histBooking.endDate)}',
                          style: TextStyle(fontSize: 11, color: isDark ? Colors.white54 : AppTheme.textMutedGray),
                        ),
                      ],
                    ),
                    Row(
                      children: [
                        Text(
                          AppFormatters.currency(histBooking.totalPrice, lang: lang),
                          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
                        ),
                        const SizedBox(width: 8),
                        IconButton(
                          icon: const Icon(Icons.arrow_forward_ios, size: 14),
                          onPressed: () => context.push('/owner-booking-detail', extra: histBooking),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ],

        const SizedBox(height: 28),
      ],
    );
  }

  Widget _buildBookingTrackingCard(
    Booking booking,
    OwnerState ownerState,
    bool isDark,
    String lang,
    Color cardBg,
    Color borderColor,
  ) {
    final status = booking.status.toUpperCase();
    final isActionPending = ownerState.isBookingActionPending(booking.id);

    Color statusColor;
    switch (status) {
      case 'PENDING':
        statusColor = const Color(0xFFF59E0B);
        break;
      case 'ACCEPTED':
      case 'CONFIRMED':
        statusColor = const Color(0xFF2563EB);
        break;
      case 'DISPATCHED':
      case 'OUT_FOR_DELIVERY':
      case 'IN_TRANSIT':
        statusColor = const Color(0xFF8B5CF6);
        break;
      case 'ACTIVE':
      case 'DELIVERED':
        statusColor = const Color(0xFF16A34A);
        break;
      case 'RETURN_PENDING':
      case 'RETURN_IN_PROGRESS':
      case 'RETURNED':
      case 'INSPECTION_PENDING':
        statusColor = const Color(0xFFEA580C);
        break;
      case 'COMPLETED':
        statusColor = const Color(0xFF059669);
        break;
      case 'REJECTED':
      case 'CANCELLED':
      default:
        statusColor = const Color(0xFFDC2626);
        break;
    }

    // Determine the next permitted action for the owner
    Widget? nextActionWidget;
    if (isActionPending) {
      nextActionWidget = const Center(
        child: Padding(
          padding: EdgeInsets.symmetric(vertical: 12),
          child: CircularProgressIndicator(color: AppTheme.primaryGreen, strokeWidth: 2),
        ),
      );
    } else if (status == 'PENDING') {
      nextActionWidget = Row(
        children: [
          Expanded(
            child: OutlinedButton(
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFFDC2626),
                side: const BorderSide(color: Color(0xFFDC2626)),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
              onPressed: () async {
                final success = await ref
                    .read(ownerProvider.notifier)
                    .updateBookingStatus(booking.id, 'REJECTED', note: 'Declined by owner');
                if (!mounted) return;
                if (success) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Booking request declined')),
                  );
                }
              },
              child: const Text('Decline', style: TextStyle(fontWeight: FontWeight.w700)),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryGreen,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
              onPressed: () async {
                final success = await ref
                    .read(ownerProvider.notifier)
                    .updateBookingStatus(booking.id, 'ACCEPTED', note: 'Accepted by owner');
                if (!mounted) return;
                if (success) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Booking request approved 🎉')),
                  );
                }
              },
              child: const Text('Accept Booking', style: TextStyle(fontWeight: FontWeight.w800)),
            ),
          ),
        ],
      );
    } else if (status == 'ACCEPTED' || status == 'CONFIRMED') {
      nextActionWidget = SizedBox(
        width: double.infinity,
        child: ElevatedButton.icon(
          icon: const Icon(Icons.local_shipping_outlined, size: 18),
          label: const Text('Dispatch / Ready for Collection', style: TextStyle(fontWeight: FontWeight.w800)),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.primaryGreen,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            padding: const EdgeInsets.symmetric(vertical: 14),
          ),
          onPressed: () async {
            final success = await ref
                .read(ownerProvider.notifier)
                .updateBookingStatus(booking.id, 'DISPATCHED', note: 'Equipment dispatched by owner');
            if (!mounted) return;
            if (success) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Equipment marked as dispatched')),
              );
            }
          },
        ),
      );
    } else if (status == 'DISPATCHED' || status == 'OUT_FOR_DELIVERY') {
      nextActionWidget = SizedBox(
        width: double.infinity,
        child: ElevatedButton.icon(
          icon: const Icon(Icons.handshake_outlined, size: 18),
          label: const Text('Confirm Handover (Start Rental)', style: TextStyle(fontWeight: FontWeight.w800)),
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF16A34A),
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            padding: const EdgeInsets.symmetric(vertical: 14),
          ),
          onPressed: () async {
            final success = await ref
                .read(ownerProvider.notifier)
                .updateBookingStatus(booking.id, 'ACTIVE', note: 'Equipment handed over, rental active');
            if (!mounted) return;
            if (success) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Handover confirmed — Rental is now Active!')),
              );
            }
          },
        ),
      );
    } else if (status == 'ACTIVE') {
      nextActionWidget = Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFF16A34A).withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: const Color(0xFF16A34A).withValues(alpha: 0.2)),
        ),
        child: Row(
          children: [
            const Icon(Icons.sync_rounded, color: Color(0xFF16A34A), size: 18),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'Rental is currently in progress with the farmer. When returned, conduct return inspection.',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                ),
              ),
            ),
          ],
        ),
      );
    } else if (status == 'RETURN_PENDING' || status == 'RETURNED' || status == 'INSPECTION_PENDING') {
      nextActionWidget = SizedBox(
        width: double.infinity,
        child: ElevatedButton.icon(
          icon: const Icon(Icons.fact_check_outlined, size: 18),
          label: const Text('Conduct Return Inspection', style: TextStyle(fontWeight: FontWeight.w800)),
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFFEA580C),
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            padding: const EdgeInsets.symmetric(vertical: 14),
          ),
          onPressed: () => _showInspectionDialog(booking, isDark, lang),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(AppTheme.cardRadius),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: Reference & Status Badge
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Booking #${booking.id.substring(0, booking.id.length >= 8 ? 8 : booking.id.length).toUpperCase()}',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      color: isDark ? Colors.white : AppTheme.textDarkNavy,
                    ),
                  ),
                  if (booking.farmer != null)
                    Text(
                      'Farmer: ${booking.farmer!.name}',
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: statusColor.withValues(alpha: 0.3)),
                ),
                child: Text(
                  status.replaceAll('_', ' '),
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: statusColor,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 14),

          // Rental Period & Financials Row
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isDark ? Colors.white.withValues(alpha: 0.04) : Colors.black.withValues(alpha: 0.02),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Rental Period',
                      style: TextStyle(fontSize: 11, color: isDark ? Colors.white54 : AppTheme.textMutedGray),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${DateFormat('dd MMM').format(booking.startDate)} - ${DateFormat('dd MMM yyyy').format(booking.endDate)}',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: isDark ? Colors.white : AppTheme.textDarkNavy,
                      ),
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      'Total / Paid',
                      style: TextStyle(fontSize: 11, color: isDark ? Colors.white54 : AppTheme.textMutedGray),
                    ),
                    const SizedBox(height: 2),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          AppFormatters.currency(booking.totalPrice, lang: lang),
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w800,
                            color: isDark ? Colors.white : AppTheme.textDarkNavy,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                          decoration: BoxDecoration(
                            color: booking.paymentStatus == 'PAID'
                                ? const Color(0xFF16A34A).withValues(alpha: 0.12)
                                : const Color(0xFFF59E0B).withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            booking.paymentStatus,
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: booking.paymentStatus == 'PAID'
                                  ? const Color(0xFF16A34A)
                                  : const Color(0xFFF59E0B),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Operational Status History Timeline
          Text(
            'Operational Tracking Timeline',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: isDark ? Colors.white : AppTheme.textDarkNavy,
            ),
          ),
          const SizedBox(height: 8),

          if (booking.statusHistory.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Text(
                'Initial booking request recorded.',
                style: TextStyle(fontSize: 12, color: isDark ? Colors.white54 : AppTheme.textMutedGray),
              ),
            )
          else
            Column(
              children: booking.statusHistory.map((h) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        margin: const EdgeInsets.only(top: 3),
                        width: 10,
                        height: 10,
                        decoration: BoxDecoration(
                          color: AppTheme.primaryGreen,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2),
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
                                Text(
                                  h.title.isNotEmpty ? h.title : h.status.replaceAll('_', ' '),
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: isDark ? Colors.white : AppTheme.textDarkNavy,
                                  ),
                                ),
                                Text(
                                  DateFormat('dd MMM, hh:mm a').format(h.createdAt),
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: isDark ? Colors.white38 : AppTheme.textMutedGray,
                                  ),
                                ),
                              ],
                            ),
                            if (h.note != null && h.note!.isNotEmpty)
                              Padding(
                                padding: const EdgeInsets.only(top: 2),
                                child: Text(
                                  h.note!,
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),

          const SizedBox(height: 12),

          // Next Permitted Action Section
          if (nextActionWidget != null) ...[
            const Divider(height: 24),
            Text(
              'Next Permitted Action:',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: isDark ? Colors.white70 : AppTheme.textMutedGray,
              ),
            ),
            const SizedBox(height: 8),
            nextActionWidget,
          ],

          const SizedBox(height: 10),

          // Deep dive into full booking details
          Align(
            alignment: Alignment.centerRight,
            child: TextButton.icon(
              icon: const Icon(Icons.open_in_new, size: 14),
              label: const Text('View Full Booking Screen', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
              style: TextButton.styleFrom(foregroundColor: AppTheme.primaryGreen),
              onPressed: () => context.push('/owner-booking-detail', extra: booking),
            ),
          ),
        ],
      ),
    );
  }

  void _showInspectionDialog(Booking booking, bool isDark, String lang) {
    String selectedCondition = 'GOOD';
    final deductionController = TextEditingController(text: '0');
    final notesController = TextEditingController();
    bool isSubmitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (modalCtx, setModalState) {
            return Container(
              padding: EdgeInsets.only(
                top: 20,
                left: 20,
                right: 20,
                bottom: MediaQuery.of(modalCtx).viewInsets.bottom + 20,
              ),
              decoration: BoxDecoration(
                color: isDark ? AppTheme.darkCard : Colors.white,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Return Inspection',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: isDark ? Colors.white : AppTheme.textDarkNavy,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.pop(modalCtx),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const Text('Equipment Condition on Return:', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    initialValue: selectedCondition,
                    decoration: InputDecoration(
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    ),
                    items: const [
                      DropdownMenuItem(value: 'EXCELLENT', child: Text('EXCELLENT - No wear or damage')),
                      DropdownMenuItem(value: 'GOOD', child: Text('GOOD - Normal working wear')),
                      DropdownMenuItem(value: 'FAIR', child: Text('FAIR - Minor wear, needs cleaning')),
                      DropdownMenuItem(value: 'DAMAGED', child: Text('DAMAGED - Repair required')),
                    ],
                    onChanged: (val) {
                      if (val != null) setModalState(() => selectedCondition = val);
                    },
                  ),
                  const SizedBox(height: 14),
                  const Text('Deduction from Deposit (₹):', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 6),
                  TextField(
                    controller: deductionController,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      hintText: '0',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    ),
                  ),
                  const SizedBox(height: 14),
                  const Text('Inspection Notes:', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 6),
                  TextField(
                    controller: notesController,
                    maxLines: 2,
                    decoration: InputDecoration(
                      hintText: 'Describe physical condition, fuel level, and hours run',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    ),
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryGreen,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: isSubmitting
                          ? null
                          : () async {
                              final deduction = double.tryParse(deductionController.text.trim()) ?? 0.0;
                              setModalState(() => isSubmitting = true);
                              final ok = await ref.read(ownerProvider.notifier).completeInspection(
                                booking.id,
                                {
                                  'condition': selectedCondition,
                                  'deductionAmount': deduction,
                                  'notes': notesController.text.trim(),
                                },
                              );
                              if (ctx.mounted) Navigator.pop(ctx);
                              if (!mounted) return;
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(ok ? 'Return inspection completed and persisted!' : 'Failed to record inspection'),
                                  backgroundColor: ok ? AppTheme.primaryGreen : const Color(0xFFDC2626),
                                ),
                              );
                            },
                      child: isSubmitting
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : const Text('Complete Inspection & Finish Rental', style: TextStyle(fontWeight: FontWeight.w800)),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildImagePlaceholder(bool isDark) {
    return Container(
      color: isDark ? const Color(0xFF1E2620) : const Color(0xFFE8EFE9),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.agriculture_rounded,
              size: 64,
              color: isDark ? Colors.white24 : Colors.grey.shade400,
            ),
            const SizedBox(height: 6),
            Text(
              'AgroRent AI',
              style: TextStyle(
                color: isDark ? Colors.white38 : Colors.grey.shade500,
                fontWeight: FontWeight.w600,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

