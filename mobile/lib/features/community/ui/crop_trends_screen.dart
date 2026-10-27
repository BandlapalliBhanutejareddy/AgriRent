import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../shared/theme/app_theme.dart';
import '../models/community_models.dart';
import '../providers/community_provider.dart';

class CropTrendsScreen extends ConsumerStatefulWidget {
  const CropTrendsScreen({super.key});

  @override
  ConsumerState<CropTrendsScreen> createState() => _CropTrendsScreenState();
}

class _CropTrendsScreenState extends ConsumerState<CropTrendsScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(communityProvider.notifier).loadCropTrends());
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(communityProvider);
    final lang = ref.watch(languageProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final trends = state.cropTrends;

    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : const Color(0xFFF8FAF9),
      appBar: AppBar(
        backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        elevation: 0.5,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded,
              color: isDark ? Colors.white : AppTheme.textDarkNavy, size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'crop_trends_intelligence'.tr(lang),
          style: TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 18,
            color: isDark ? Colors.white : AppTheme.textDarkNavy,
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh_rounded, color: isDark ? Colors.white70 : AppTheme.textDarkNavy),
            onPressed: () => ref.read(communityProvider.notifier).loadCropTrends(),
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: state.isLoadingCropTrends && trends == null
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen))
          : trends == null
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.analytics_outlined, size: 48, color: Colors.grey),
                      const SizedBox(height: 12),
                      const Text('Failed to load crop statistics.'),
                      const SizedBox(height: 12),
                      ElevatedButton(
                        onPressed: () => ref.read(communityProvider.notifier).loadCropTrends(),
                        child: Text('retry'.tr(lang)),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: () => ref.read(communityProvider.notifier).loadCropTrends(),
                  color: AppTheme.primaryGreen,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Summary Metrics Row
                        _buildSummaryMetrics(context, trends, isDark, lang),
                        const SizedBox(height: 16),

                        // Ollama Intelligence Banner
                        _buildOllamaIntelligenceCard(context, trends, isDark, lang),
                        const SizedBox(height: 20),

                        // Section Title: Registered Cultivations
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'registered_crop_popularity'.tr(lang).toUpperCase(),
                              style: const TextStyle(
                                fontSize: 12,
                                letterSpacing: 1.0,
                                fontWeight: FontWeight.w800,
                                color: AppTheme.primaryGreen,
                              ),
                            ),
                            Text(
                              '${trends.cropTrends.length} Crops Tracked',
                              style: TextStyle(
                                fontSize: 12,
                                color: isDark ? Colors.white60 : Colors.grey.shade600,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),

                        // Crop List Cards
                        if (trends.cropTrends.isEmpty)
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(24),
                            decoration: BoxDecoration(
                              color: isDark ? AppTheme.darkCard : Colors.white,
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: const Center(
                              child: Text('No active crop cultivations registered yet.'),
                            ),
                          )
                        else
                          ...trends.cropTrends.map((c) => _buildCropCard(context, c, isDark, lang)),

                        const SizedBox(height: 20),

                        // Transparency & Responsible Pricing Notice
                        _buildPricingDisclaimer(context, trends.marketPriceDisclaimer, isDark, lang),
                        const SizedBox(height: 32),
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _buildSummaryMetrics(BuildContext context, CropTrendsResponse trends, bool isDark, String lang) {
    return Row(
      children: [
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? AppTheme.darkCard : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.primaryGreen.withValues(alpha: 0.2)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.grass_rounded, color: AppTheme.primaryGreen, size: 20),
                    const SizedBox(width: 6),
                    Text('active_crops'.tr(lang), style: const TextStyle(fontSize: 12, color: Colors.grey)),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  '${trends.totalCropsTracked}',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    color: isDark ? Colors.white : AppTheme.textDarkNavy,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? AppTheme.darkCard : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.accentGreen.withValues(alpha: 0.2)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.people_outline_rounded, color: AppTheme.accentGreen, size: 20),
                    const SizedBox(width: 6),
                    Text('total_cultivations'.tr(lang), style: const TextStyle(fontSize: 12, color: Colors.grey)),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  '${trends.totalActiveCultivations}',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    color: isDark ? Colors.white : AppTheme.textDarkNavy,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildOllamaIntelligenceCard(BuildContext context, CropTrendsResponse trends, bool isDark, String lang) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isDark
              ? [const Color(0xFF1B3B2B), const Color(0xFF142E21)]
              : [const Color(0xFFE8F5E9), const Color(0xFFC8E6C9)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.primaryGreen.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: AppTheme.primaryGreen,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.psychology_rounded, color: Colors.white, size: 20),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'ai_crop_intelligence'.tr(lang),
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF1B5E20),
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.8),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Text(
                  'Grounded AI',
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF1B5E20)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            trends.aiExplanation,
            style: TextStyle(
              fontSize: 13,
              height: 1.45,
              fontWeight: FontWeight.w500,
              color: isDark ? Colors.white : const Color(0xFF1B5E20),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCropCard(BuildContext context, CropTrendItem crop, bool isDark, String lang) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
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
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: AppTheme.primaryGreen.withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.eco_rounded, color: AppTheme.primaryGreen, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    crop.cropName,
                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w800,
                      color: isDark ? Colors.white : AppTheme.textDarkNavy,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppTheme.primaryGreen.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${crop.activeFarmerCount} Cultivating',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.primaryGreen,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Divider(height: 1),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildStatChip(Icons.domain_verification_rounded, '${crop.activeFieldCount} active fields', isDark),
              _buildStatChip(Icons.schedule_rounded, '${crop.plannedFarmerCount} planning next', isDark),
            ],
          ),
          if (crop.topRegions.isNotEmpty) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.location_on_outlined, size: 14, color: Colors.grey),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    'Top regions: ${crop.topRegions.map((r) => r['region'] ?? '').join(', ')}',
                    style: TextStyle(fontSize: 12, color: isDark ? Colors.white60 : Colors.grey.shade600),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ],
          const SizedBox(height: 10),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton.icon(
              onPressed: () => context.push('/knowledge-base?crop=${Uri.encodeComponent(crop.cropName)}'),
              icon: const Icon(Icons.menu_book_rounded, size: 14, color: AppTheme.primaryGreen),
              label: Text(
                '${'view_crop_guide'.tr(lang)} (${crop.cropName})',
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.primaryGreen),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatChip(IconData icon, String label, bool isDark) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: AppTheme.primaryGreen),
        const SizedBox(width: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: isDark ? Colors.white70 : Colors.black87,
          ),
        ),
      ],
    );
  }

  Widget _buildPricingDisclaimer(BuildContext context, String disclaimer, bool isDark, String lang) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withValues(alpha: 0.04) : const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.withValues(alpha: 0.2)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.info_outline_rounded, size: 18, color: Colors.amber),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'market_price_integrity'.tr(lang),
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text(
                  disclaimer.isNotEmpty
                      ? disclaimer
                      : 'market_price_unavailable_notice'.tr(lang),
                  style: TextStyle(
                    fontSize: 11,
                    height: 1.35,
                    color: isDark ? Colors.white60 : Colors.grey.shade700,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
