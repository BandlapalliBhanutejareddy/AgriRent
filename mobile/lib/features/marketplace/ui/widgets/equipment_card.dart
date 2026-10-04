import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/localization/app_localizations.dart';
import '../../../../models/equipment.dart';
import '../../../../shared/theme/app_theme.dart';
import '../../providers/saved_equipment_provider.dart';
import '../equipment_details_screen.dart';

class EquipmentCard extends ConsumerWidget {
  final Equipment equipment;
  final VoidCallback? onSaveToggled;

  const EquipmentCard({
    super.key,
    required this.equipment,
    this.onSaveToggled,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(languageProvider);
    final isSaved = ref.watch(savedEquipmentProvider.select((s) => s.savedIds.contains(equipment.id)));
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final hasPrice = equipment.pricePerDay != null && equipment.pricePerDay! > 0;
    final priceString = hasPrice
        ? '₹${equipment.pricePerDay!.toStringAsFixed(equipment.pricePerDay! % 1 == 0 ? 0 : 2)}'
        : 'not_available'.tr(lang);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(AppTheme.cardRadius),
        border: Border.all(
          color: isDark ? Colors.white.withValues(alpha: 0.08) : Colors.black.withValues(alpha: 0.06),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(AppTheme.cardRadius),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => EquipmentDetailsScreen(equipment: equipment),
              ),
            );
          },
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Image Header Stack
              Stack(
                children: [
                  Container(
                    height: 170,
                    width: double.infinity,
                    color: isDark ? Colors.black26 : Colors.grey.shade100,
                    child: equipment.imageUrl.trim().isNotEmpty
                        ? Image.network(
                            equipment.imageUrl,
                            fit: BoxFit.cover,
                            loadingBuilder: (context, child, loadingProgress) {
                              if (loadingProgress == null) return child;
                              return Center(
                                child: SizedBox(
                                  width: 24,
                                  height: 24,
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
                            errorBuilder: (context, error, stackTrace) => _buildPlaceholder(isDark),
                          )
                        : _buildPlaceholder(isDark),
                  ),

                  // Top gradient overlay for contrast
                  Positioned.fill(
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.center,
                          colors: [
                            Colors.black.withValues(alpha: 0.35),
                            Colors.transparent,
                          ],
                        ),
                      ),
                    ),
                  ),

                  // Category Badge (Top Left)
                  if (equipment.category.isNotEmpty)
                    Positioned(
                      top: 12,
                      left: 12,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.65),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
                        ),
                        child: Text(
                          equipment.category.toUpperCase(),
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                            fontSize: 10,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ),

                  // Save / Favorite Heart Button (Top Right)
                  Positioned(
                    top: 10,
                    right: 10,
                    child: Material(
                      color: Colors.transparent,
                      child: InkWell(
                        onTap: () async {
                          try {
                            final savedNow = await ref.read(savedEquipmentProvider.notifier).toggleSave(equipment);
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
                            onSaveToggled?.call();
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
                        borderRadius: BorderRadius.circular(20),
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: isDark ? Colors.black54 : Colors.white.withValues(alpha: 0.9),
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.15),
                                blurRadius: 4,
                              ),
                            ],
                          ),
                          child: Icon(
                            isSaved ? Icons.favorite : Icons.favorite_border,
                            size: 18,
                            color: isSaved ? const Color(0xFFE53935) : (isDark ? Colors.white70 : Colors.black87),
                          ),
                        ),
                      ),
                    ),
                  ),

                  // Availability Badge (Bottom Right over Image)
                  Positioned(
                    bottom: 10,
                    right: 10,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: equipment.available
                            ? const Color(0xFF2E7D32).withValues(alpha: 0.9)
                            : const Color(0xFFC62828).withValues(alpha: 0.9),
                        borderRadius: BorderRadius.circular(8),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.2),
                            blurRadius: 4,
                          ),
                        ],
                      ),
                      child: Text(
                        equipment.available
                            ? 'available'.tr(lang).toUpperCase()
                            : 'unavailable'.tr(lang).toUpperCase(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 9,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ),
                ],
              ),

              // Card Content Area
              Padding(
                padding: const EdgeInsets.all(14.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title & Price Row
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Text(
                            equipment.title.isNotEmpty ? equipment.title : 'Equipment',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: isDark ? Colors.white : AppTheme.textDarkNavy,
                              height: 1.25,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              priceString,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w900,
                                color: AppTheme.primaryGreen,
                              ),
                            ),
                            if (hasPrice)
                              Text(
                                '/${'per_day'.tr(lang)}',
                                style: TextStyle(
                                  fontSize: 10,
                                  color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                          ],
                        ),
                      ],
                    ),

                    const SizedBox(height: 10),

                    // Owner / Location / Rating Row
                    Row(
                      children: [
                        if (equipment.owner?.name != null && equipment.owner!.name.isNotEmpty) ...[
                          Icon(
                            Icons.person_outline,
                            size: 14,
                            color: isDark ? Colors.white60 : AppTheme.textMutedGray,
                          ),
                          const SizedBox(width: 4),
                          Flexible(
                            child: Text(
                              equipment.owner!.name,
                              style: TextStyle(
                                fontSize: 12,
                                color: isDark ? Colors.white70 : AppTheme.textMutedGray,
                                fontWeight: FontWeight.w500,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 8),
                        ],
                        if (equipment.location != null && equipment.location!.isNotEmpty) ...[
                          Icon(
                            Icons.location_on_outlined,
                            size: 14,
                            color: isDark ? Colors.white60 : AppTheme.textMutedGray,
                          ),
                          const SizedBox(width: 4),
                          Flexible(
                            child: Text(
                              equipment.location!,
                              style: TextStyle(
                                fontSize: 12,
                                color: isDark ? Colors.white70 : AppTheme.textMutedGray,
                                fontWeight: FontWeight.w500,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                        if (equipment.rating != null && equipment.rating! > 0) ...[
                          const Spacer(),
                          const Icon(Icons.star, size: 14, color: Color(0xFFFFA000)),
                          const SizedBox(width: 2),
                          Text(
                            equipment.rating!.toStringAsFixed(1),
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: isDark ? Colors.white : AppTheme.textDarkNavy,
                            ),
                          ),
                        ],
                      ],
                    ),

                    const SizedBox(height: 12),
                    Divider(
                      height: 1,
                      color: isDark ? Colors.white12 : Colors.black.withValues(alpha: 0.06),
                    ),
                    const SizedBox(height: 10),

                    // View Details action button
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'view_details'.tr(lang),
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.primaryGreen,
                          ),
                        ),
                        const Icon(
                          Icons.arrow_forward,
                          size: 16,
                          color: AppTheme.primaryGreen,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPlaceholder(bool isDark) {
    return Container(
      color: isDark ? const Color(0xFF1E2620) : const Color(0xFFF1F5F2),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.agriculture_rounded,
            size: 48,
            color: isDark ? Colors.white24 : Colors.grey.shade400,
          ),
          const SizedBox(height: 4),
          Text(
            'AgroRent AI',
            style: TextStyle(
              color: isDark ? Colors.white38 : Colors.grey.shade500,
              fontWeight: FontWeight.w600,
              fontSize: 11,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}
