import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../models/equipment.dart';
import '../../../shared/theme/app_theme.dart';
import '../../marketplace/providers/marketplace_provider.dart';
import '../services/crop_stage_intelligence.dart';

class StageDetailsScreen extends ConsumerStatefulWidget {
  final String cropName;
  final String stage;
  final String? farmId;
  final String? cropId;

  const StageDetailsScreen({
    super.key,
    required this.cropName,
    required this.stage,
    this.farmId,
    this.cropId,
  });

  @override
  ConsumerState<StageDetailsScreen> createState() => _StageDetailsScreenState();
}

class _StageDetailsScreenState extends ConsumerState<StageDetailsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(marketplaceProvider.notifier).fetchInitial();
    });
  }

  Future<void> _launchVideoUrl(String url) async {
    try {
      final uri = Uri.parse(url);
      bool launched = false;
      try {
        launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
      } catch (_) {}
      if (!launched) {
        try {
          launched = await launchUrl(uri, mode: LaunchMode.platformDefault);
        } catch (_) {}
      }
      if (!launched && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Unable to open video. Please try again.'),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Unable to open video. Please try again.'),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(languageProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final intel = CropStageIntelligenceService.getStageDetails(widget.cropName, widget.stage);
    final localizedStageName = AppLocalizations.localizedCropStage(widget.stage, lang);
    final localizedNextStageName = AppLocalizations.localizedCropStage(intel.nextStage, lang);

    final mktState = ref.watch(marketplaceProvider);
    final allEquip = mktState.equipment;

    // Filter real DB equipment genuinely related to this stage
    final relatedEquip = allEquip.where((eq) {
      final cat = eq.category.toUpperCase().trim();
      final title = eq.title.toUpperCase().trim();

      // Check if equipment category matches any required category
      final matchesCat = intel.relatedEquipmentCategories.any((reqCat) {
        final rc = reqCat.toUpperCase();
        return cat.contains(rc) || rc.contains(cat);
      });

      // Also check specific keyword matches
      final matchesKeyword = intel.relatedOperations.any((op) {
        final opUpper = op.toUpperCase();
        if (opUpper.contains('HARVEST') && (cat.contains('HARVEST') || title.contains('HARVEST'))) return true;
        if (opUpper.contains('SOW') && (title.contains('SEED') || title.contains('PLANTER') || cat.contains('TRACTOR'))) return true;
        if (opUpper.contains('WEED') && (title.contains('WEED') || cat.contains('POWER_TILLER'))) return true;
        if (opUpper.contains('SPRAY') && (title.contains('SPRAY') || cat.contains('IMPLEMENT'))) return true;
        if (opUpper.contains('PUDDL') && (title.contains('ROTAVATOR') || cat.contains('TRACTOR'))) return true;
        return false;
      });

      return matchesCat || matchesKeyword;
    }).toList();

    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${widget.cropName} — $localizedStageName',
              style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 17),
            ),
            Text(
              'Stage Intelligence & Operations',
              style: TextStyle(
                fontSize: 11,
                color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
              ),
            ),
          ],
        ),
        backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        foregroundColor: isDark ? Colors.white : AppTheme.textDarkNavy,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. HERO HEADER CARD
            _buildHeroCard(intel, localizedStageName, isDark, lang),
            const SizedBox(height: 18),

            // 2. STAGE PURPOSE
            _buildSectionHeader(Icons.info_outline_rounded, 'Stage Overview', isDark),
            const SizedBox(height: 8),
            _buildCard(
              isDark: isDark,
              child: Text(
                intel.stagePurpose,
                style: TextStyle(
                  fontSize: 14,
                  height: 1.5,
                  color: isDark ? Colors.grey.shade300 : const Color(0xFF334155),
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            const SizedBox(height: 20),

            // 3. WHAT YOU SHOULD DO NOW (PRIORITIZED PRACTICAL STEPS)
            _buildSectionHeader(Icons.check_circle_outline_rounded, 'What You Should Do Now', isDark),
            const SizedBox(height: 8),
            _buildCard(
              isDark: isDark,
              child: Column(
                children: List.generate(intel.whatToDoNow.length, (idx) {
                  final step = intel.whatToDoNow[idx];
                  return Padding(
                    padding: EdgeInsets.only(bottom: idx == intel.whatToDoNow.length - 1 ? 0 : 12),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 26,
                          height: 26,
                          decoration: BoxDecoration(
                            color: AppTheme.primaryGreen.withValues(alpha: 0.12),
                            shape: BoxShape.circle,
                          ),
                          child: Center(
                            child: Text(
                              '${idx + 1}',
                              style: const TextStyle(
                                color: AppTheme.primaryGreen,
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            step,
                            style: TextStyle(
                              fontSize: 13.5,
                              height: 1.4,
                              color: isDark ? Colors.white : AppTheme.textDarkNavy,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }),
              ),
            ),
            const SizedBox(height: 20),

            // 4. IMPORTANT CHECKS
            _buildSectionHeader(Icons.fact_check_outlined, 'Important Checks', isDark),
            const SizedBox(height: 8),
            _buildCard(
              isDark: isDark,
              child: Column(
                children: intel.importantChecks.map((check) {
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.check_box_rounded, color: Color(0xFF0284C7), size: 20),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            check,
                            style: TextStyle(
                              fontSize: 13.5,
                              height: 1.35,
                              color: isDark ? Colors.grey.shade300 : const Color(0xFF1E293B),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 20),

            // 5. COMMON PROBLEMS AT THIS STAGE
            _buildSectionHeader(Icons.warning_amber_rounded, 'Common Problems at This Stage', isDark, iconColor: const Color(0xFFE11D48)),
            const SizedBox(height: 8),
            _buildCard(
              isDark: isDark,
              borderColor: const Color(0xFFFECDD3),
              bgColor: isDark ? const Color(0xFF2A1215) : const Color(0xFFFFF1F2),
              child: Column(
                children: intel.commonProblems.map((prob) {
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.error_outline_rounded, color: Color(0xFFE11D48), size: 20),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            prob,
                            style: TextStyle(
                              fontSize: 13.5,
                              height: 1.35,
                              color: isDark ? const Color(0xFFFFE4E6) : const Color(0xFF9F1239),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 20),

            // 6. PRECAUTIONS
            _buildSectionHeader(Icons.shield_outlined, 'Precautions & Guidelines', isDark, iconColor: const Color(0xFFD97706)),
            const SizedBox(height: 8),
            _buildCard(
              isDark: isDark,
              borderColor: const Color(0xFFFDE68A),
              bgColor: isDark ? const Color(0xFF2C200B) : const Color(0xFFFFFBEB),
              child: Column(
                children: intel.precautions.map((prec) {
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.info_outline_rounded, color: Color(0xFFD97706), size: 20),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            prec,
                            style: TextStyle(
                              fontSize: 13.5,
                              height: 1.35,
                              color: isDark ? const Color(0xFFFEF3C7) : const Color(0xFF92400E),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 20),

            // 7. EXPECTED NEXT STAGE
            _buildSectionHeader(Icons.next_plan_outlined, 'Expected Next Stage', isDark),
            const SizedBox(height: 8),
            _buildCard(
              isDark: isDark,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE2E8F0),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          localizedStageName,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF475569)),
                        ),
                      ),
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 8),
                        child: Icon(Icons.arrow_forward_rounded, color: AppTheme.primaryGreen, size: 20),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryGreen.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          localizedNextStageName,
                          style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: AppTheme.primaryGreen),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    intel.nextStageRequirements,
                    style: TextStyle(
                      fontSize: 13,
                      height: 1.4,
                      color: isDark ? Colors.grey.shade300 : const Color(0xFF475569),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // 8. RELATED OPERATIONS
            _buildSectionHeader(Icons.engineering_outlined, 'Related Operations (${intel.relatedOperations.length})', isDark),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: intel.relatedOperations.map((op) {
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: isDark ? AppTheme.darkCard : Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.primaryGreen.withValues(alpha: 0.3)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.02),
                        blurRadius: 4,
                        offset: const Offset(0, 1),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.handyman_outlined, color: AppTheme.primaryGreen, size: 16),
                      const SizedBox(width: 8),
                      Text(
                        op,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: isDark ? Colors.white : AppTheme.textDarkNavy,
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 24),

            // 9. RELATED EQUIPMENT (CRITICAL FILTERING & EXPLANATION)
            _buildSectionHeader(Icons.agriculture_rounded, 'Related Equipment (${relatedEquip.length})', isDark),
            const SizedBox(height: 4),
            Text(
              'Showing machines required for ${widget.cropName} $localizedStageName operations:',
              style: TextStyle(fontSize: 12, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600),
            ),
            const SizedBox(height: 10),
            if (mktState.isLoading && allEquip.isEmpty)
              const Center(child: Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator(color: AppTheme.primaryGreen)))
            else if (relatedEquip.isEmpty)
              _buildCard(
                isDark: isDark,
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    child: Column(
                      children: [
                        Icon(Icons.inventory_2_outlined, size: 40, color: Colors.grey.shade400),
                        const SizedBox(height: 8),
                        const Text(
                          'No related equipment is currently available for this crop stage.',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Colors.grey, fontWeight: FontWeight.w600, fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                ),
              )
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: relatedEquip.length,
                separatorBuilder: (_, _) => const SizedBox(height: 10),
                itemBuilder: (context, idx) {
                  final eq = relatedEquip[idx];
                  final reason = _getEquipmentReason(eq, intel);
                  return _buildEquipmentCard(eq, reason, isDark, lang);
                },
              ),
            const SizedBox(height: 24),

            // 10. LEARNING VIDEOS (CROP + STAGE SPECIFIC)
            _buildSectionHeader(Icons.play_circle_fill_rounded, 'Learning Videos (${intel.learningVideos.length})', isDark, iconColor: const Color(0xFFEF4444)),
            const SizedBox(height: 4),
            Text(
              'Authoritative extension guides for ${widget.cropName} $localizedStageName:',
              style: TextStyle(fontSize: 12, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600),
            ),
            const SizedBox(height: 10),
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: intel.learningVideos.length,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (context, idx) {
                final video = intel.learningVideos[idx];
                return _buildVideoCard(video, isDark, lang);
              },
            ),
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }

  String _getEquipmentReason(Equipment eq, StageIntelligence intel) {
    final cat = eq.category.toUpperCase().trim();
    for (final entry in intel.equipmentReasons.entries) {
      if (cat.contains(entry.key.toUpperCase()) || entry.key.toUpperCase().contains(cat)) {
        return entry.value;
      }
    }
    return 'Recommended for ${intel.cropName} ${intel.stage.toLowerCase()} field operations';
  }

  Widget _buildHeroCard(StageIntelligence intel, String localizedStageName, bool isDark, String lang) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isDark
              ? [const Color(0xFF0F3E22), const Color(0xFF1E5B33)]
              : [const Color(0xFF1B5E20), const Color(0xFF2E7D32)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.green.withValues(alpha: 0.25),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  widget.cropName.toUpperCase(),
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 1),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF38BDF8),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.eco_rounded, size: 14, color: Colors.white),
                    const SizedBox(width: 4),
                    Text(
                      'active'.tr(lang),
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            localizedStageName,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w900,
              fontSize: 26,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Agricultural Stage Intelligence & Recommendations',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.85),
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(IconData icon, String title, bool isDark, {Color? iconColor}) {
    return Row(
      children: [
        Icon(icon, color: iconColor ?? AppTheme.primaryGreen, size: 22),
        const SizedBox(width: 8),
        Text(
          title,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w900,
            color: isDark ? Colors.white : AppTheme.textDarkNavy,
          ),
        ),
      ],
    );
  }

  Widget _buildCard({
    required Widget child,
    required bool isDark,
    Color? borderColor,
    Color? bgColor,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: bgColor ?? (isDark ? AppTheme.darkCard : Colors.white),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: borderColor ?? (isDark ? Colors.white12 : const Color(0xFFE2E8F0)),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: child,
    );
  }

  Widget _buildEquipmentCard(Equipment eq, String reason, bool isDark, String lang) {
    final priceStr = eq.pricePerDay != null ? AppFormatters.currency(eq.pricePerDay, lang: lang) : 'Contact for price';
    final localizedCat = AppLocalizations.localizedEquipmentCategory(eq.category, lang);

    return InkWell(
      onTap: () => context.push('/equipment-detail', extra: eq),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.darkCard : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: isDark ? Colors.white10 : const Color(0xFFE2E8F0)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: Image.network(
                    eq.imageUrl,
                    width: 60,
                    height: 60,
                    fit: BoxFit.cover,
                    errorBuilder: (_, _, _) => Container(
                      width: 60,
                      height: 60,
                      color: AppTheme.primaryGreen.withValues(alpha: 0.1),
                      child: const Icon(Icons.agriculture_rounded, color: AppTheme.primaryGreen),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        eq.title,
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          color: isDark ? Colors.white : AppTheme.textDarkNavy,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryGreen.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          localizedCat,
                          style: const TextStyle(color: AppTheme.primaryGreen, fontWeight: FontWeight.bold, fontSize: 11),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '$priceStr / day',
                        style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: AppTheme.primaryGreen),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right, color: Colors.grey),
              ],
            ),
            const SizedBox(height: 10),
            // Relevance Reason Badge
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFBBF7D0)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.verified_outlined, color: Color(0xFF16A34A), size: 16),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      'Why relevant: $reason',
                      style: const TextStyle(
                        fontSize: 11.5,
                        color: Color(0xFF15803D),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVideoCard(LearningVideo video, bool isDark, String lang) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isDark ? Colors.white10 : const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: const Color(0xFFFEE2E2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Center(
                  child: Icon(Icons.play_circle_fill_rounded, color: Color(0xFFEF4444), size: 28),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      video.title,
                      style: TextStyle(
                        fontSize: 14.5,
                        fontWeight: FontWeight.w800,
                        color: isDark ? Colors.white : AppTheme.textDarkNavy,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${video.channel} • ${video.duration}',
                      style: const TextStyle(fontSize: 11.5, color: Colors.grey, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            video.relevance,
            style: TextStyle(
              fontSize: 12.5,
              height: 1.35,
              color: isDark ? Colors.grey.shade300 : const Color(0xFF475569),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            height: 38,
            child: ElevatedButton.icon(
              onPressed: () => _launchVideoUrl(video.effectiveUrl),
              icon: const Icon(Icons.smart_display_rounded, size: 18),
              label: const Text('Watch on YouTube', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFEF4444),
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
