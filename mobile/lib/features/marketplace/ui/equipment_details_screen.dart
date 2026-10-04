import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../models/equipment.dart';
import '../../../shared/theme/app_theme.dart';
import '../../bookings/ui/booking_form_screen.dart';
import '../providers/saved_equipment_provider.dart';
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
    final priceDisplay = hasPrice
        ? 'Ã¢â€šÂ¹${eq.pricePerDay!.toStringAsFixed(eq.pricePerDay! % 1 == 0 ? 0 : 2)}'
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
                        const SnackBar(
                          content: Text('Failed to update favorite status'),
                          duration: Duration(seconds: 2),
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
                          eq.category.toUpperCase(),
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
                          Column(
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
                                  Text(
                                    priceDisplay,
                                    style: const TextStyle(
                                      fontSize: 24,
                                      fontWeight: FontWeight.w900,
                                      color: AppTheme.primaryGreen,
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
                          if (eq.securityDeposit != null && eq.securityDeposit! > 0)
                            Column(
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
                                  'Ã¢â€šÂ¹${eq.securityDeposit!.toStringAsFixed(0)}',
                                  style: TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w700,
                                    color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                                  ),
                                ),
                              ],
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
                            IconButton(
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
                              onPressed: () {
                                final phone = eq.owner?.phone;
                                showDialog(
                                  context: context,
                                  builder: (ctx) => AlertDialog(
                                    backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(AppTheme.cardRadius),
                                    ),
                                    title: Text(
                                      'contact_owner'.tr(lang),
                                      style: TextStyle(
                                        color: isDark ? Colors.white : AppTheme.textDarkNavy,
                                        fontWeight: FontWeight.w800,
                                      ),
                                    ),
                                    content: Text(
                                      phone != null && phone.trim().isNotEmpty
                                          ? '${eq.owner!.name}: $phone'
                                          : 'phone_not_provided'.tr(lang),
                                      style: TextStyle(
                                        color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                                      ),
                                    ),
                                    actions: [
                                      TextButton(
                                        onPressed: () => Navigator.pop(ctx),
                                        child: const Text('OK', style: TextStyle(color: AppTheme.primaryGreen, fontWeight: FontWeight.bold)),
                                      ),
                                    ],
                                  ),
                                );
                              },
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

                    // Rental Period Booking Selector
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
                                        ? '${DateFormat('MMM d, y').format(_startDate!)}  Ã¢â€ â€™  ${DateFormat('MMM d, y').format(_endDate!)}'
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
                                Text(
                                  'Ã¢â€šÂ¹${eq.pricePerDay!.toStringAsFixed(0)} Ãƒâ€” $rentalDays ${'days'.tr(lang)}',
                                  style: TextStyle(
                                    color: isDark ? Colors.white70 : AppTheme.textMutedGray,
                                    fontSize: 13,
                                  ),
                                ),
                                Text(
                                  'Ã¢â€šÂ¹${totalEstimate.toStringAsFixed(0)}',
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
                                Text(
                                  'total_estimate'.tr(lang),
                                  style: TextStyle(
                                    color: isDark ? Colors.white : AppTheme.textDarkNavy,
                                    fontWeight: FontWeight.w800,
                                    fontSize: 15,
                                  ),
                                ),
                                Text(
                                  'Ã¢â€šÂ¹${totalEstimate.toStringAsFixed(0)}',
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
