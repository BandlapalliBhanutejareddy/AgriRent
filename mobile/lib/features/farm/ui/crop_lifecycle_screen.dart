import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../shared/theme/app_theme.dart';
import '../providers/farm_provider.dart';

const List<String> kCanonicalStages = [
  'SOWING',
  'GERMINATION',
  'SEEDLING',
  'VEGETATIVE',
  'FLOWERING',
  'FRUITING',
  'MATURITY',
  'HARVEST'
];

final Map<String, String> kStageDurations = {
  'SOWING': '1-3 days',
  'GERMINATION': '4-7 days',
  'SEEDLING': '7-14 days',
  'VEGETATIVE': '25-35 days',
  'FLOWERING': '15-20 days',
  'FRUITING': '20-30 days',
  'MATURITY': '10-15 days',
  'HARVEST': '5-10 days',
};

class CropLifecycleScreen extends ConsumerStatefulWidget {
  const CropLifecycleScreen({super.key});

  @override
  ConsumerState<CropLifecycleScreen> createState() => _CropLifecycleScreenState();
}

class _CropLifecycleScreenState extends ConsumerState<CropLifecycleScreen> {
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(farmProvider.notifier).fetchFarms();
    });
  }

  Future<void> _updateStage(String farmId, String cropId, String newStage, {String reason = 'Manual update via Crop Lifecycle'}) async {
    setState(() => _isLoading = true);
    try {
      await ApiClient().dio.put('farms/$farmId', data: {
        'stage': newStage.toUpperCase(),
      });

      try {
        await ApiClient().dio.post(
          'farms/$farmId/crops/$cropId/lifecycle/set-stage',
          data: {
            'requestedStage': newStage.toUpperCase(),
            'reason': reason,
          },
        );
      } catch (_) {}

      await ref.read(farmProvider.notifier).fetchFarms();

      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Stage updated to ${newStage[0]}${newStage.substring(1).toLowerCase()} successfully!'),
            backgroundColor: AppTheme.primaryGreen,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update stage: $e')),
        );
      }
    }
  }

  // SCREEN 6: UPDATE STAGE BOTTOM SHEET
  void _showUpdateStageSheet(String farmId, String cropId, String cropName, String currentStage) {
    String selectedStage = currentStage.toUpperCase();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 24,
                right: 24,
                top: 20,
                bottom: MediaQuery.of(context).viewInsets.bottom + 24,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Update Crop Stage',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                              color: isDark ? Colors.white : AppTheme.textDarkNavy,
                            ),
                          ),
                          Text(
                            cropName,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.primaryGreen,
                            ),
                          ),
                        ],
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  // Current Stage Badge
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryGreen.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppTheme.primaryGreen.withValues(alpha: 0.25)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Current Stage',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                          ),
                        ),
                        Text(
                          currentStage[0] + currentStage.substring(1).toLowerCase(),
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w900,
                            color: AppTheme.primaryGreen,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  Text(
                    'Select New Stage',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      color: isDark ? Colors.white : AppTheme.textDarkNavy,
                    ),
                  ),
                  const SizedBox(height: 8),

                  // List of all 8 stages with radio buttons (Screen 6)
                  SizedBox(
                    height: 240,
                    child: ListView.separated(
                      shrinkWrap: true,
                      itemCount: kCanonicalStages.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 4),
                      itemBuilder: (context, index) {
                        final st = kCanonicalStages[index];
                        final isSelected = selectedStage == st;
                        final isCurrent = currentStage.toUpperCase() == st;
                        final label = '${st[0]}${st.substring(1).toLowerCase()}${isCurrent ? ' (Current)' : ''}';

                        return InkWell(
                          onTap: () {
                            setSheetState(() => selectedStage = st);
                          },
                          borderRadius: BorderRadius.circular(12),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? AppTheme.primaryGreen.withValues(alpha: 0.1)
                                  : Colors.transparent,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  isSelected ? Icons.radio_button_checked : Icons.radio_button_off,
                                  color: isSelected ? AppTheme.primaryGreen : Colors.grey,
                                  size: 20,
                                ),
                                const SizedBox(width: 12),
                                Text(
                                  label,
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: isSelected || isCurrent ? FontWeight.bold : FontWeight.w500,
                                    color: isSelected
                                        ? AppTheme.primaryGreen
                                        : (isDark ? Colors.white : AppTheme.textDarkNavy),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 18),

                  // Action Buttons
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => Navigator.pop(ctx),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          child: const Text('Cancel'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () {
                            Navigator.pop(ctx);
                            _updateStage(farmId, cropId, selectedStage);
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primaryGreen,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          child: const Text('Update Stage', style: TextStyle(fontWeight: FontWeight.bold)),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  // SCREEN 7: MARK STAGE COMPLETE CONFIRMATION DIALOG
  void _showMarkStageCompleteDialog(String farmId, String cropId, String currentStage) {
    final currentIndex = kCanonicalStages.contains(currentStage.toUpperCase())
        ? kCanonicalStages.indexOf(currentStage.toUpperCase())
        : 3;
    final nextStage = currentIndex < kCanonicalStages.length - 1
        ? kCanonicalStages[currentIndex + 1]
        : 'HARVEST';

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final currFormatted = '${currentStage[0]}${currentStage.substring(1).toLowerCase()}';
    final nextFormatted = '${nextStage[0]}${nextStage.substring(1).toLowerCase()}';

    showModalBottomSheet(
      context: context,
      backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) {
        return Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Big plant illustration (Screen 7 in prototype)
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: AppTheme.primaryGreen.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: const Center(
                  child: Icon(Icons.eco_rounded, color: AppTheme.primaryGreen, size: 40),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Complete $currFormatted Stage?',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  color: isDark ? Colors.white : AppTheme.textDarkNavy,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'This will mark $currFormatted stage as completed and move the crop to $nextFormatted stage.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 13,
                  color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 20),

              // Transition Diagram: Current -> Next
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: isDark ? Colors.white10 : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    Column(
                      children: [
                        const Text('Current Stage', style: TextStyle(fontSize: 11, color: Colors.grey)),
                        const SizedBox(height: 2),
                        Text(currFormatted, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                        const SizedBox(height: 6),
                        const Icon(Icons.grass, color: AppTheme.primaryGreen, size: 24),
                      ],
                    ),
                    const Icon(Icons.arrow_forward_rounded, color: AppTheme.primaryGreen, size: 28),
                    Column(
                      children: [
                        const Text('Next Stage', style: TextStyle(fontSize: 11, color: Colors.grey)),
                        const SizedBox(height: 2),
                        Text(nextFormatted, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: AppTheme.primaryGreen)),
                        const SizedBox(height: 6),
                        const Icon(Icons.eco_rounded, color: AppTheme.primaryGreen, size: 24),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(ctx),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Cancel'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(ctx);
                        _updateStage(farmId, cropId, nextStage, reason: 'Marked $currentStage as completed');
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryGreen,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Mark as Completed', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final farmState = ref.watch(farmProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final farm = farmState.farms.isNotEmpty ? farmState.farms.first : null;
    final crop = farm?.crops.isNotEmpty == true ? farm!.crops.first : null;

    final cropName = crop?.cropName.isNotEmpty == true ? crop!.cropName : 'Maize';
    final currentStage = (crop?.stage.isNotEmpty == true ? crop!.stage : 'VEGETATIVE').toUpperCase();
    final currentIndex = kCanonicalStages.contains(currentStage)
        ? kCanonicalStages.indexOf(currentStage)
        : 3;

    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Crop Lifecycle', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
            Text(cropName, style: TextStyle(fontSize: 12, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600)),
          ],
        ),
        backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        foregroundColor: isDark ? Colors.white : AppTheme.textDarkNavy,
        elevation: 0,
        actions: [
          TextButton.icon(
            onPressed: () {
              if (farm != null && crop != null) {
                _showMarkStageCompleteDialog(farm.id, crop.id, currentStage);
              }
            },
            icon: const Icon(Icons.check_circle_outline, size: 18, color: AppTheme.primaryGreen),
            label: const Text('Mark Complete', style: TextStyle(color: AppTheme.primaryGreen, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen))
          : RefreshIndicator(
              color: AppTheme.primaryGreen,
              onRefresh: () async {
                await ref.read(farmProvider.notifier).fetchFarms();
              },
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
                itemCount: kCanonicalStages.length,
                itemBuilder: (context, index) {
                  final stage = kCanonicalStages[index];
                  final isCompleted = index < currentIndex;
                  final isCurrent = index == currentIndex;
                  final isUpcoming = index > currentIndex;
                  final isLast = index == kCanonicalStages.length - 1;

                  return _buildTimelineItem(
                    stage: stage,
                    index: index,
                    isCompleted: isCompleted,
                    isCurrent: isCurrent,
                    isUpcoming: isUpcoming,
                    isLast: isLast,
                    isDark: isDark,
                    farmId: farm?.id ?? '',
                    cropId: crop?.id ?? '',
                    cropName: cropName,
                    currentStage: currentStage,
                  );
                },
              ),
            ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.darkCard : Colors.white,
          border: Border(top: BorderSide(color: isDark ? Colors.white10 : Colors.grey.shade200)),
        ),
        child: SizedBox(
          width: double.infinity,
          height: 50,
          child: ElevatedButton.icon(
            onPressed: () {
              if (farm != null && crop != null) {
                _showUpdateStageSheet(farm.id, crop.id, cropName, currentStage);
              }
            },
            icon: const Icon(Icons.swap_horiz_rounded),
            label: const Text('Update Stage', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryGreen,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              elevation: 2,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTimelineItem({
    required String stage,
    required int index,
    required bool isCompleted,
    required bool isCurrent,
    required bool isUpcoming,
    required bool isLast,
    required bool isDark,
    required String farmId,
    required String cropId,
    required String cropName,
    required String currentStage,
  }) {
    final stageName = '${stage[0]}${stage.substring(1).toLowerCase()}';
    final duration = kStageDurations[stage] ?? '10-15 days';

    final dates = [
      'Completed • 15 Jun 2024',
      'Completed • 18 Jun 2024',
      'Completed • 22 Jun 2024',
      'Current Stage • Day 28',
      'Upcoming • Estimated 15-20 days',
      'Upcoming • Estimated 20-30 days',
      'Upcoming • Estimated 10-15 days',
      'Upcoming • Estimated 5-10 days',
    ];
    final dateLabel = dates[index];

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Step Circle & Connecting Line (Screen 5)
          Column(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isCompleted
                      ? AppTheme.primaryGreen
                      : (isCurrent
                          ? const Color(0xFF0284C7)
                          : (isDark ? Colors.white12 : const Color(0xFFE2E8F0))),
                  border: isCurrent
                      ? Border.all(color: const Color(0xFF38BDF8), width: 2)
                      : null,
                ),
                child: Center(
                  child: isCompleted
                      ? const Icon(Icons.check, color: Colors.white, size: 20)
                      : (isCurrent
                          ? const Icon(Icons.anchor_rounded, color: Colors.white, size: 20)
                          : Text(
                              '${index + 1}',
                              style: TextStyle(
                                color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            )),
                ),
              ),
              if (!isLast)
                Expanded(
                  child: Container(
                    width: 2,
                    color: isCompleted
                        ? AppTheme.primaryGreen
                        : (isDark ? Colors.white12 : Colors.grey.shade300),
                  ),
                ),
            ],
          ),
          const SizedBox(width: 16),

          // Stage Details Card
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 20.0),
              child: InkWell(
                onTap: () {
                  if (farmId.isNotEmpty && cropId.isNotEmpty) {
                    if (isCurrent) {
                      _showMarkStageCompleteDialog(farmId, cropId, currentStage);
                    } else {
                      _showUpdateStageSheet(farmId, cropId, cropName, currentStage);
                    }
                  }
                },
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isCurrent
                        ? (isDark ? const Color(0xFF0C4A6E) : const Color(0xFFE0F2FE))
                        : (isDark ? AppTheme.darkCard : Colors.white),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isCurrent
                          ? const Color(0xFF38BDF8)
                          : (isDark ? Colors.white10 : Colors.grey.shade200),
                      width: isCurrent ? 1.5 : 1,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              stageName,
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: isCurrent ? FontWeight.w900 : FontWeight.w800,
                                color: isCurrent
                                    ? (isDark ? Colors.white : const Color(0xFF0369A1))
                                    : (isCompleted
                                        ? (isDark ? Colors.white : AppTheme.textDarkNavy)
                                        : (isDark ? Colors.grey.shade400 : Colors.grey.shade600)),
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              isCompleted
                                  ? dateLabel
                                  : (isCurrent ? 'Current Stage • $duration' : 'Upcoming • $duration'),
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: isCurrent
                                    ? (isDark ? const Color(0xFFBAE6FD) : const Color(0xFF0284C7))
                                    : (isCompleted
                                        ? Colors.green
                                        : (isDark ? Colors.grey.shade400 : Colors.grey.shade500)),
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (isCurrent)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFF0284C7),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Text(
                            'Active',
                            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
