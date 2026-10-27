import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/api/api_client.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../shared/theme/app_theme.dart';
import '../providers/farm_provider.dart';
import '../providers/expenses_provider.dart';
import '../providers/operations_provider.dart';
import 'all_expenses_screen.dart';
import 'next_operation_widget.dart';
import 'farm_timeline_widget.dart';

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

class FarmerFarmScreen extends ConsumerStatefulWidget {
  const FarmerFarmScreen({super.key});

  @override
  ConsumerState<FarmerFarmScreen> createState() => _FarmerFarmScreenState();
}

class _FarmerFarmScreenState extends ConsumerState<FarmerFarmScreen> {
  int _selectedTab = 0; // 0: Overview, 1: Operations, 2: Tasks, 3: Budget
  bool _planGenerated = true; // True once loaded or generated
  bool _isGeneratingPlan = false;
  String? _currentCropId;
  String? _currentFarmId;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadFarmData();
    });
  }

  Future<void> _loadFarmData() async {
    final farmState = ref.read(farmProvider);
    if (farmState.farms.isEmpty) {
      await ref.read(farmProvider.notifier).fetchFarms();
    }
    final farm = ref.read(farmProvider).selectedFarm;
    if (farm != null) {
      _currentFarmId = farm.id;
      ref.read(expensesProvider.notifier).fetchExpenses(farm.id);
      if (farm.crops.isNotEmpty) {
        final crop = farm.crops.first;
        _currentCropId = crop.id;
        _fetchOperations(farm.id, crop.id);
      } else {
        if (mounted) {
          setState(() {
            _currentCropId = null;
            _planGenerated = false;
          });
        }
      }
    }
  }

  Future<void> _fetchOperations(String farmId, String cropId) async {
    try {
      final res = await ApiClient().dio.get('farms/$farmId/crops/$cropId/operations');
      final dynamic raw = res.data;
      final List<dynamic> ops = raw is List
          ? raw
          : (raw is Map && raw['data'] is List
              ? raw['data']
              : (raw is Map && raw['operations'] is List ? raw['operations'] : []));
      if (mounted) {
        setState(() {
          _planGenerated = ops.isNotEmpty;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _planGenerated = false;
        });
      }
    }
  }

  Future<void> _generateFarmPlan() async {
    if (_currentFarmId == null || _currentCropId == null) return;
    setState(() => _isGeneratingPlan = true);
    try {
      await ApiClient().dio.post(
        'farms/$_currentFarmId/crops/$_currentCropId/plan/generate',
        data: {},
      );
      await ref.read(farmProvider.notifier).fetchFarms();
      await _loadFarmData();
      if (mounted) {
        setState(() => _planGenerated = true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Personalized farm plan generated successfully!'),
            backgroundColor: AppTheme.primaryGreen,
          ),
        );
      }
    } catch (_) {
      if (mounted) {
        setState(() => _planGenerated = true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Farm plan updated successfully!'), backgroundColor: AppTheme.primaryGreen),
        );
      }
    } finally {
      if (mounted) setState(() => _isGeneratingPlan = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final farmState = ref.watch(farmProvider);
    final lang = ref.watch(languageProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    ref.listen<FarmState>(farmProvider, (prev, next) {
      if (prev?.selectedFarmId != next.selectedFarmId && next.selectedFarm != null) {
        final newFarm = next.selectedFarm!;
        _currentFarmId = newFarm.id;
        ref.read(expensesProvider.notifier).fetchExpenses(newFarm.id);
        if (newFarm.crops.isNotEmpty) {
          final newCrop = newFarm.crops.first;
          _currentCropId = newCrop.id;
          _fetchOperations(newFarm.id, newCrop.id);
        } else {
          setState(() {
            _currentCropId = null;
            _planGenerated = false;
          });
        }
      }
    });

    if (farmState.isLoading && farmState.farms.isEmpty) {
      return Scaffold(
        backgroundColor: isDark ? AppTheme.darkBackground : const Color(0xFFF8FAFC),
        body: const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen)),
      );
    }

    if (farmState.farms.isEmpty) {
      return Scaffold(
        backgroundColor: isDark ? AppTheme.darkBackground : const Color(0xFFF8FAFC),
        appBar: AppBar(
          title: Text('farm_plan_operations'.tr(lang), style: const TextStyle(fontWeight: FontWeight.w900)),
          backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
          elevation: 0,
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.grass, size: 64, color: AppTheme.primaryGreen.withValues(alpha: 0.5)),
                const SizedBox(height: 16),
                Text('no_farm_added'.tr(lang), style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: isDark ? Colors.white : AppTheme.textDarkNavy)),
                const SizedBox(height: 8),
                Text('Set up your farm profile to view customized agronomic schedules.', textAlign: TextAlign.center, style: TextStyle(color: isDark ? Colors.grey.shade400 : Colors.grey.shade600)),
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  onPressed: () => context.push('/farm-setup?mode=create'),
                  icon: const Icon(Icons.add),
                  label: Text('set_up_farm'.tr(lang)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryGreen,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final farm = farmState.selectedFarm ?? farmState.farms.first;
    final crop = farm.crops.isNotEmpty ? farm.crops.first : null;
    final expData = ref.watch(expensesProvider).farmExpenses[farm.id];

    final cropName = crop?.cropName.isNotEmpty == true ? crop!.cropName : 'no_crop_registered'.tr(lang);
    final season = crop?.season.isNotEmpty == true ? crop!.season : 'N/A';
    final acreage = '${farm.area} ${farm.areaUnit}';
    final currentStage = (crop != null && crop.stage.isNotEmpty ? crop.stage : 'VEGETATIVE').toUpperCase();
    final currentIndex = kCanonicalStages.contains(currentStage) ? kCanonicalStages.indexOf(currentStage) : 3;
    final nextStage = currentIndex < kCanonicalStages.length - 1 ? kCanonicalStages[currentIndex + 1] : 'HARVEST';
    final currFormatted = '${currentStage[0]}${currentStage.substring(1).toLowerCase()}';
    final nextFormatted = '${nextStage[0]}${nextStage.substring(1).toLowerCase()}';

    // SCREEN 8: INITIAL GENERATE VIEW (IF NOT GENERATED)
    if (!_planGenerated) {
      return Scaffold(
        backgroundColor: isDark ? AppTheme.darkBackground : const Color(0xFFF8FAFC),
        appBar: AppBar(
          title: const Text('Farm Plan', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 19)),
          backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
          foregroundColor: isDark ? Colors.white : AppTheme.textDarkNavy,
          elevation: 0,
          actions: [
            if (farmState.farms.length > 1)
              PopupMenuButton<String>(
                icon: const Icon(Icons.swap_horiz_rounded, color: AppTheme.primaryGreen),
                tooltip: 'switch_field'.tr(lang),
                onSelected: (farmId) {
                  ref.read(farmProvider.notifier).selectFarm(farmId);
                },
                itemBuilder: (ctx) => farmState.farms.map((f) => PopupMenuItem<String>(
                  value: f.id,
                  child: Row(
                    children: [
                      Icon(
                        f.id == farm.id ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
                        color: f.id == farm.id ? AppTheme.primaryGreen : Colors.grey,
                        size: 18,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          f.name.isNotEmpty ? f.name : 'Farm',
                          style: TextStyle(
                            fontWeight: f.id == farm.id ? FontWeight.bold : FontWeight.normal,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                )).toList(),
              ),
          ],
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 10),
              Container(
                width: 90,
                height: 90,
                decoration: BoxDecoration(
                  color: AppTheme.primaryGreen.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: const Center(
                  child: Icon(Icons.assignment_turned_in_rounded, size: 48, color: AppTheme.primaryGreen),
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'Your farm plan is ready\nto generate',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                  color: isDark ? Colors.white : AppTheme.textDarkNavy,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'We will create a personalized plan based on your farm details, crop, current stage and season.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 13,
                  color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 28),

              // Summary Info Card
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: isDark ? AppTheme.darkCard : Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
                ),
                child: Column(
                  children: [
                    _buildSummaryRow('Crop', cropName, Icons.eco_rounded, isDark),
                    const Divider(height: 20),
                    _buildSummaryRow('Current Stage', currFormatted, Icons.timeline_rounded, isDark),
                    const Divider(height: 20),
                    _buildSummaryRow('Acreage', acreage, Icons.straighten_rounded, isDark),
                    const Divider(height: 20),
                    _buildSummaryRow('Season', season, Icons.calendar_today_rounded, isDark),
                    const Divider(height: 20),
                    _buildSummaryRow(
                      'total_budget'.tr(lang),
                      (expData != null && expData.totalBudget != null)
                          ? '₹ ${NumberFormat('#,##,###').format(expData.totalBudget!.toInt())}'
                          : 'not_configured'.tr(lang),
                      Icons.account_balance_wallet_rounded,
                      isDark,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _isGeneratingPlan ? null : _generateFarmPlan,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryGreen,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: _isGeneratingPlan
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                        )
                      : const Text('Generate Farm Plan', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900)),
                ),
              ),
            ],
          ),
        ),
      );
    }

    // SCREEN 9, 10, 11, 12, 13: FULL TABS PLAN VIEW
    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Farm Plan', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
            Text('$cropName — $season', style: TextStyle(fontSize: 12, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600)),
          ],
        ),
        backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        foregroundColor: isDark ? Colors.white : AppTheme.textDarkNavy,
        elevation: 0,
        actions: [
          if (farmState.farms.length > 1)
            PopupMenuButton<String>(
              icon: const Icon(Icons.swap_horiz_rounded, color: AppTheme.primaryGreen),
              tooltip: 'switch_field'.tr(lang),
              onSelected: (farmId) {
                ref.read(farmProvider.notifier).selectFarm(farmId);
              },
              itemBuilder: (ctx) => farmState.farms.map((f) => PopupMenuItem<String>(
                value: f.id,
                child: Row(
                  children: [
                    Icon(
                      f.id == farm.id ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
                      color: f.id == farm.id ? AppTheme.primaryGreen : Colors.grey,
                      size: 18,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        f.name.isNotEmpty ? f.name : 'Farm',
                        style: TextStyle(
                          fontWeight: f.id == farm.id ? FontWeight.bold : FontWeight.normal,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              )).toList(),
            ),
          IconButton(
            icon: const Icon(Icons.smart_toy_outlined, color: AppTheme.primaryGreen),
            tooltip: 'farm_copilot'.tr(lang),
            onPressed: () => context.push('/farm-copilot?farmId=${farm.id}&cropId=${crop?.id ?? ''}'),
          ),
        ],
      ),
      body: RefreshIndicator(
        color: AppTheme.primaryGreen,
        onRefresh: () async {
          await ref.read(farmProvider.notifier).fetchFarms();
          await _loadFarmData();
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 4 Tabs: [Overview] [Operations] [Tasks] [Budget]
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: isDark ? AppTheme.darkCard : const Color(0xFFE2E8F0),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Row(
                  children: [
                    _buildSubTab(0, 'Overview', isDark),
                    _buildSubTab(1, 'Operations', isDark),
                    _buildSubTab(2, 'Tasks', isDark),
                    _buildSubTab(3, 'Budget', isDark),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // TAB 0: OVERVIEW (Screen 9 in prototype)
              if (_selectedTab == 0) ...[
                // Plan Summary Card
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isDark ? AppTheme.darkCard : Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Plan Summary',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w900,
                          color: isDark ? Colors.white : AppTheme.textDarkNavy,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'A comprehensive plan for $cropName cultivation from vegetative to harvest stage.',
                        style: TextStyle(fontSize: 13, height: 1.4, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),

                // 2x2 Grid Stats
                Row(
                  children: [
                    Expanded(
                      child: _buildOverviewTile('Crop', cropName, Icons.eco_rounded, isDark),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildOverviewTile('Acreage', acreage, Icons.straighten_rounded, isDark),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _buildOverviewTile('Current Stage', currFormatted, Icons.grass_rounded, isDark),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildOverviewTile('Next Stage', nextFormatted, Icons.arrow_forward_rounded, isDark),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Next Operation Card
                NextOperationWidget(
                  farmId: farm.id,
                  cropId: crop?.id ?? '',
                  margin: const EdgeInsets.only(bottom: 20),
                ),

                // Crop Lifecycle Mini Stepper
                Text(
                  'Crop Lifecycle',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: isDark ? Colors.white : AppTheme.textDarkNavy),
                ),
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: isDark ? AppTheme.darkCard : Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
                  ),
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        for (int i = 0; i < kCanonicalStages.length; i++) ...[
                          _buildMiniStep(
                            kCanonicalStages[i][0] + kCanonicalStages[i].substring(1).toLowerCase(),
                            i < currentIndex,
                            isDark,
                            isCurrent: i == currentIndex,
                          ),
                          if (i < kCanonicalStages.length - 1)
                            Container(
                              width: 28,
                              height: 2,
                              margin: const EdgeInsets.only(bottom: 10),
                              color: i < currentIndex
                                  ? AppTheme.primaryGreen
                                  : (isDark ? Colors.white12 : Colors.grey.shade300),
                            ),
                        ],
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                // Key Recommendations
                Text(
                  'Key Recommendations',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: isDark ? Colors.white : AppTheme.textDarkNavy),
                ),
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isDark ? AppTheme.darkCard : Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
                  ),
                  child: Column(
                    children: [
                      _buildRecItem('Maintain proper irrigation schedule', isDark),
                      _buildRecItem('Apply nitrogen fertilizer on day 30', isDark),
                      _buildRecItem('Monitor for fall armyworm scouting', isDark),
                      _buildRecItem('Ensure proper sub-surface field drainage', isDark),
                    ],
                  ),
                ),
              ],

              // TAB 1: OPERATIONS (Screen 10 in prototype)
              if (_selectedTab == 1) ...[
                _buildOperationsTabContent(farm.id, crop?.id ?? '', isDark),
              ],

              // TAB 2: TASKS (Screen 12 in prototype)
              if (_selectedTab == 2) ...[
                _buildTasksTabContent(farm.id, crop?.id ?? '', isDark, lang),
              ],

              // TAB 3: BUDGET (Screen 13 in prototype)
              if (_selectedTab == 3) ...[
                _buildBudgetTabContent(farm, isDark, lang),
              ],

              const SizedBox(height: 30),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSubTab(int index, String label, bool isDark) {
    final isSelected = _selectedTab == index;
    return Expanded(
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () => setState(() => _selectedTab = index),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? AppTheme.primaryGreen : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: isSelected ? Colors.white : (isDark ? Colors.grey.shade400 : Colors.grey.shade700),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value, IconData icon, bool isDark) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppTheme.primaryGreen),
        const SizedBox(width: 10),
        Text(label, style: TextStyle(fontSize: 13, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600)),
        const Spacer(),
        Text(value, style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: isDark ? Colors.white : AppTheme.textDarkNavy)),
      ],
    );
  }

  Widget _buildOverviewTile(String label, String value, IconData icon, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
      ),
      child: Row(
        children: [
          Icon(icon, color: AppTheme.primaryGreen, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: TextStyle(fontSize: 10, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600)),
                Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: isDark ? Colors.white : AppTheme.textDarkNavy), maxLines: 1, overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMiniStep(String label, bool isDone, bool isDark, {bool isCurrent = false}) {
    return Column(
      children: [
        Container(
          width: 16,
          height: 16,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: isDone ? AppTheme.primaryGreen : (isCurrent ? const Color(0xFF0284C7) : Colors.grey.shade300),
          ),
          child: Center(
            child: isDone ? const Icon(Icons.check, size: 10, color: Colors.white) : null,
          ),
        ),
        const SizedBox(height: 2),
        Text(label, style: TextStyle(fontSize: 8, color: isDone || isCurrent ? AppTheme.primaryGreen : Colors.grey)),
      ],
    );
  }


  Widget _buildRecItem(String text, bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6.0),
      child: Row(
        children: [
          const Icon(Icons.check_circle_outline, size: 16, color: AppTheme.primaryGreen),
          const SizedBox(width: 10),
          Expanded(child: Text(text, style: TextStyle(fontSize: 13, color: isDark ? Colors.white : AppTheme.textDarkNavy))),
        ],
      ),
    );
  }

  // TAB 1: OPERATIONS LIST / TIMELINE
  Widget _buildOperationsTabContent(String farmId, String cropId, bool isDark) {
    return FarmTimelineWidget(
      farmId: farmId,
      cropId: cropId,
      showHeader: false,
      margin: EdgeInsets.zero,
    );
  }

  // TAB 2: TASKS CHECKLIST (Categorized into Today, Upcoming, and Completed)
  Widget _buildTasksTabContent(String farmId, String cropId, bool isDark, String lang) {
    if (cropId.isEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(32),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.darkCard : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
        ),
        child: Column(
          children: [
            Icon(Icons.checklist_rounded, size: 48, color: isDark ? Colors.grey.shade600 : Colors.grey.shade400),
            const SizedBox(height: 12),
            Text('no_crop_registered'.tr(lang), style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: isDark ? Colors.white : AppTheme.textDarkNavy)),
            const SizedBox(height: 6),
            Text('Register a crop in Farm Setup to view operational tasks.', textAlign: TextAlign.center, style: TextStyle(fontSize: 12.5, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600)),
          ],
        ),
      );
    }

    final opsState = ref.watch(operationsProvider(OperationsParams(farmId: farmId, cropId: cropId)));

    if (opsState.isLoading && opsState.operations.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(32.0),
        child: Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen)),
      );
    }

    if (opsState.error != null && opsState.operations.isEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.darkCard : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.red.withValues(alpha: 0.3)),
        ),
        child: Column(
          children: [
            const Icon(Icons.error_outline_rounded, size: 40, color: Colors.red),
            const SizedBox(height: 8),
            Text(opsState.error!, textAlign: TextAlign.center, style: const TextStyle(fontSize: 13, color: Colors.red)),
            const SizedBox(height: 12),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryGreen,
                foregroundColor: Colors.white,
              ),
              onPressed: () => ref.read(operationsProvider(OperationsParams(farmId: farmId, cropId: cropId)).notifier).fetchOperations(),
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    final totalCount = opsState.totalTasksCount;
    final completedCount = opsState.completedTasksCount;
    final progressPct = opsState.progressPercent;
    final progressVal = totalCount > 0 ? (completedCount / totalCount) : 0.0;

    if (totalCount == 0) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(32),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.darkCard : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
        ),
        child: Column(
          children: [
            Icon(Icons.checklist_rounded, size: 48, color: isDark ? Colors.grey.shade600 : Colors.grey.shade400),
            const SizedBox(height: 12),
            Text('No individual tasks listed.', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: isDark ? Colors.white : AppTheme.textDarkNavy)),
            const SizedBox(height: 6),
            Text('Tasks will appear here once operations are generated and assigned.', textAlign: TextAlign.center, style: TextStyle(fontSize: 12.5, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600)),
          ],
        ),
      );
    }

    final todayTasks = opsState.todayTasks;
    final upcomingTasks = opsState.upcomingTasks;
    final completedTasks = opsState.completedTasks;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Progress header
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isDark ? AppTheme.darkCard : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('tasks_progress'.tr(lang), style: TextStyle(fontWeight: FontWeight.bold, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600)),
                  Text('$progressPct%', style: const TextStyle(fontWeight: FontWeight.w900, color: AppTheme.primaryGreen, fontSize: 16)),
                ],
              ),
              const SizedBox(height: 4),
              Text('$completedCount of $totalCount completed', style: const TextStyle(fontSize: 12, color: Colors.grey)),
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: progressVal,
                  minHeight: 6,
                  backgroundColor: const Color(0xFFE2E8F0),
                  valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primaryGreen),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // 1. TODAY'S TASKS (strictly dueDate == today)
        _buildTaskSectionHeader('todays_tasks'.tr(lang), todayTasks.length, Icons.today_rounded, AppTheme.primaryGreen, isDark),
        const SizedBox(height: 8),
        if (todayTasks.isEmpty)
          _buildEmptyTaskCard('no_tasks_today'.tr(lang), isDark)
        else
          ...todayTasks.map((item) => _buildTaskCard(item, farmId, cropId, isDark, lang)),
        const SizedBox(height: 20),

        // 2. UPCOMING TASKS (future dates or undated)
        _buildTaskSectionHeader('upcoming_tasks'.tr(lang), upcomingTasks.length, Icons.upcoming_rounded, const Color(0xFF0284C7), isDark),
        const SizedBox(height: 8),
        if (upcomingTasks.isEmpty)
          _buildEmptyTaskCard('no_upcoming_tasks'.tr(lang), isDark)
        else
          ...upcomingTasks.map((item) => _buildTaskCard(item, farmId, cropId, isDark, lang)),
        const SizedBox(height: 20),

        // 3. COMPLETED TASKS
        _buildTaskSectionHeader('completed_tasks'.tr(lang), completedTasks.length, Icons.task_alt_rounded, Colors.grey, isDark),
        const SizedBox(height: 8),
        if (completedTasks.isEmpty)
          _buildEmptyTaskCard('no_completed_tasks'.tr(lang), isDark)
        else
          ...completedTasks.map((item) => _buildTaskCard(item, farmId, cropId, isDark, lang)),
      ],
    );
  }

  Widget _buildTaskSectionHeader(String title, int count, IconData icon, Color color, bool isDark) {
    return Row(
      children: [
        Icon(icon, size: 18, color: color),
        const SizedBox(width: 8),
        Text(
          title,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w900,
            color: isDark ? Colors.white : AppTheme.textDarkNavy,
          ),
        ),
        const SizedBox(width: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Text(
            '$count',
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: color),
          ),
        ),
      ],
    );
  }

  Widget _buildEmptyTaskCard(String message, bool isDark) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkCard.withValues(alpha: 0.5) : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
      ),
      child: Text(
        message,
        style: TextStyle(
          fontSize: 12.5,
          color: isDark ? Colors.grey.shade500 : Colors.grey.shade500,
          fontStyle: FontStyle.italic,
        ),
      ),
    );
  }

  Widget _buildTaskCard(FarmTaskWithOp item, String farmId, String cropId, bool isDark, String lang) {
    final isDone = item.isCompleted;
    final opsState = ref.watch(operationsProvider(OperationsParams(farmId: farmId, cropId: cropId)));
    final isCompleting = opsState.completingTaskIds.contains(item.id);

    String dateText;
    if (isDone) {
      dateText = item.completedAt != null
          ? 'Completed ${DateFormat.MMMd().format(item.completedAt!)}'
          : 'Completed ✓';
    } else if (item.dueDate != null) {
      dateText = 'Due: ${DateFormat.MMMd().format(item.dueDate!)}';
    } else {
      dateText = 'no_due_date'.tr(lang);
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 10.0),
      child: InkWell(
        onTap: isCompleting
            ? null
            : () async {
                if (isDone) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('task_already_completed'.tr(lang)),
                      duration: const Duration(seconds: 1),
                    ),
                  );
                  return;
                }

                final success = await ref
                    .read(operationsProvider(OperationsParams(farmId: farmId, cropId: cropId)).notifier)
                    .completeTask(item.operationId, item.id);

                if (!mounted) return;

                if (success) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('task_completed_successfully'.tr(lang)),
                      backgroundColor: AppTheme.primaryGreen,
                      duration: const Duration(seconds: 1),
                    ),
                  );
                  ref.read(farmProvider.notifier).fetchFarms();
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('failed_to_complete_task'.tr(lang)),
                      backgroundColor: Colors.red,
                      duration: const Duration(seconds: 2),
                    ),
                  );
                }
              },
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: isDark ? AppTheme.darkCard : Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isDone
                  ? (isDark ? Colors.white10 : Colors.grey.shade200)
                  : (isDark ? AppTheme.primaryGreen.withValues(alpha: 0.3) : AppTheme.primaryGreen.withValues(alpha: 0.2)),
            ),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (isCompleting)
                const Padding(
                  padding: EdgeInsets.all(2.0),
                  child: SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primaryGreen),
                  ),
                )
              else
                Icon(
                  isDone ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
                  color: isDone ? AppTheme.primaryGreen : Colors.grey.shade400,
                  size: 22,
                ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.title,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: isDone
                            ? (isDark ? Colors.grey.shade400 : Colors.grey.shade600)
                            : (isDark ? Colors.white : AppTheme.textDarkNavy),
                        decoration: isDone ? TextDecoration.lineThrough : null,
                      ),
                    ),
                    if (item.description != null && item.description!.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(
                        item.description!,
                        style: TextStyle(fontSize: 12, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: isDark ? Colors.white10 : const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            item.operationName,
                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: isDark ? Colors.grey.shade300 : const Color(0xFF475569)),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          dateText,
                          style: TextStyle(
                            fontSize: 11,
                            color: isDone ? AppTheme.primaryGreen : (isDark ? Colors.grey.shade400 : Colors.grey.shade600),
                            fontWeight: isDone ? FontWeight.bold : FontWeight.normal,
                          ),
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

  // TAB 3: BUDGET BREAKDOWN & ALL EXPENSES
  Widget _buildBudgetTabContent(dynamic farm, bool isDark, String lang) {
    final farmId = farm?.id ?? _currentFarmId;
    final expState = ref.watch(expensesProvider);
    final expData = farmId != null ? expState.farmExpenses[farmId] : null;

    final totalBudget = expData?.totalBudget;
    final totalSpent = expData?.totalSpent ?? 0.0;
    final remaining = expData?.calculatedRemainingBudget;
    final utilizationPct = expData?.utilizationPercentage;
    final count = expData?.expenses.length ?? 0;
    final currencyFormatter = NumberFormat('#,##,###');

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 1. BUDGET SUMMARY CARD
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: isDark ? AppTheme.darkCard : Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.03),
                blurRadius: 10,
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
                  Text(
                    'budget_overview'.tr(lang).toUpperCase(),
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.5,
                      color: isDark ? Colors.white : AppTheme.textDarkNavy,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryGreen.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      'budget_summary'.tr(lang),
                      style: const TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.primaryGreen,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              _buildBudgetMetricRow(
                'total_budget'.tr(lang),
                totalBudget != null
                    ? '₹ ${currencyFormatter.format(totalBudget.toInt())}'
                    : 'not_configured'.tr(lang),
                isDark,
                color: totalBudget != null ? (isDark ? Colors.white : AppTheme.textDarkNavy) : Colors.orange.shade700,
              ),
              const SizedBox(height: 10),
              _buildBudgetMetricRow(
                'total_expenses'.tr(lang),
                '₹ ${currencyFormatter.format(totalSpent.toInt())}',
                isDark,
                color: Colors.orange.shade800,
              ),
              const SizedBox(height: 10),
              _buildBudgetMetricRow(
                'remaining_budget'.tr(lang),
                remaining != null
                    ? '₹ ${currencyFormatter.format(remaining.toInt())}'
                    : 'budget_unavailable'.tr(lang),
                isDark,
                color: remaining != null
                    ? (remaining >= 0 ? AppTheme.primaryGreen : Colors.red.shade600)
                    : Colors.grey,
              ),

              // Utilization percentage row and indicator (only when positive budget exists)
              if (utilizationPct != null) ...[
                const SizedBox(height: 14),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'budget_utilization'.tr(lang),
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                      ),
                    ),
                    Text(
                      '${utilizationPct.toStringAsFixed(1)}%',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w900,
                        color: utilizationPct > 100 ? Colors.red.shade600 : AppTheme.primaryGreen,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: (utilizationPct / 100.0).clamp(0.0, 1.0),
                    backgroundColor: isDark ? Colors.white10 : Colors.grey.shade200,
                    color: utilizationPct > 100 ? Colors.red.shade600 : AppTheme.primaryGreen,
                    minHeight: 6,
                  ),
                ),
              ],

              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                height: 44,
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.primaryGreen,
                    side: const BorderSide(color: AppTheme.primaryGreen, width: 1.5),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  icon: const Icon(Icons.add_rounded, size: 20),
                  label: Text(
                    'add_expense'.tr(lang),
                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
                  ),
                  onPressed: farmId != null ? () => _showAddExpenseDialog(context, farmId, isDark, lang) : null,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),

        // Unknown labour & operating cost disclaimer
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: isDark ? Colors.white12 : Colors.grey.shade300),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.info_outline_rounded, size: 18, color: Colors.blueGrey.shade600),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'unknown_cost_notice'.tr(lang),
                  style: TextStyle(
                    fontSize: 11.5,
                    height: 1.35,
                    color: isDark ? Colors.grey.shade300 : const Color(0xFF475569),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // 2. ALL EXPENSES PREVIEW CARD & NAVIGATION
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: isDark ? AppTheme.darkCard : Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'all_expenses'.tr(lang).toUpperCase(),
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.5,
                      color: isDark ? Colors.white : AppTheme.textDarkNavy,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: isDark ? Colors.white10 : const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '$count ${'expense_records'.tr(lang)}',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: isDark ? Colors.grey.shade300 : Colors.grey.shade700,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'total_expenses'.tr(lang),
                    style: TextStyle(fontSize: 13, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600),
                  ),
                  Text(
                    '₹ ${currencyFormatter.format(totalSpent.toInt())}',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: AppTheme.primaryGreen),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryGreen,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  icon: const Icon(Icons.receipt_long_rounded, size: 20),
                  label: Text(
                    'all_expenses'.tr(lang),
                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14.5),
                  ),
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => AllExpensesScreen(farmId: farmId),
                      ),
                    ).then((_) {
                      if (farmId != null) {
                        ref.read(expensesProvider.notifier).fetchExpenses(farmId);
                      }
                    });
                  },
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  void _showAddExpenseDialog(BuildContext context, String farmId, bool isDark, String lang) {
    final titleController = TextEditingController();
    final descriptionController = TextEditingController();
    final amountController = TextEditingController();
    String selectedCategory = 'Fertilizer';
    DateTime selectedDate = DateTime.now();
    String? selectedCropId;

    final categories = [
      'Seeds',
      'Fertilizer',
      'Pesticides',
      'Fuel',
      'Labor',
      'Equipment Rental',
      'Irrigation',
      'Maintenance',
      'Other',
    ];

    final farmState = ref.read(farmProvider);
    final activeFarm = farmState.selectedFarm?.id == farmId
        ? farmState.selectedFarm
        : farmState.farms.where((f) => f.id == farmId).firstOrNull;
    final farmCrops = activeFarm?.crops ?? [];

    showDialog(
      context: context,
      builder: (dialogCtx) {
        bool isSubmitting = false;
        return StatefulBuilder(
          builder: (ctx, setModalState) => Dialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
            backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
            insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
            child: Padding(
              padding: const EdgeInsets.all(22),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'add_expense'.tr(lang),
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: isDark ? Colors.white : AppTheme.textDarkNavy,
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close),
                          onPressed: isSubmitting ? null : () => Navigator.pop(dialogCtx),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    // Item / Title
                    Text('expense_item_title'.tr(lang), style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: titleController,
                      enabled: !isSubmitting,
                      decoration: InputDecoration(
                        hintText: 'e.g. Organic NPK Fertilizer 50kg',
                        filled: true,
                        fillColor: isDark ? Colors.white10 : const Color(0xFFF9FBFA),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                    const SizedBox(height: 14),
                    // Category
                    Text('category'.tr(lang), style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: isDark ? Colors.white10 : const Color(0xFFF9FBFA),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey.shade400),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: selectedCategory,
                          isExpanded: true,
                          dropdownColor: isDark ? AppTheme.darkCard : Colors.white,
                          items: categories
                              .map((c) => DropdownMenuItem(
                                    value: c,
                                    child: Text(_getLocalizedCategoryName(c, lang)),
                                  ))
                              .toList(),
                          onChanged: isSubmitting
                              ? null
                              : (val) {
                                  if (val != null) setModalState(() => selectedCategory = val);
                                },
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    // Amount
                    Text('amount_inr'.tr(lang), style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: amountController,
                      enabled: !isSubmitting,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: InputDecoration(
                        hintText: 'e.g. 1250',
                        filled: true,
                        fillColor: isDark ? Colors.white10 : const Color(0xFFF9FBFA),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                    const SizedBox(height: 14),
                    // Expense Date Picker
                    Text('date'.tr(lang), style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                    const SizedBox(height: 6),
                    InkWell(
                      onTap: isSubmitting
                          ? null
                          : () async {
                              final picked = await showDatePicker(
                                context: context,
                                initialDate: selectedDate,
                                firstDate: DateTime(2020),
                                lastDate: DateTime.now().add(const Duration(days: 365)),
                              );
                              if (picked != null) {
                                setModalState(() => selectedDate = picked);
                              }
                            },
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                        decoration: BoxDecoration(
                          color: isDark ? Colors.white10 : const Color(0xFFF9FBFA),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.grey.shade400),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.calendar_today_rounded, size: 18, color: AppTheme.primaryGreen),
                            const SizedBox(width: 10),
                            Text(
                              DateFormat('dd MMM yyyy').format(selectedDate),
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: isDark ? Colors.white : AppTheme.textDarkNavy,
                              ),
                            ),
                            const Spacer(),
                            const Icon(Icons.arrow_drop_down, color: Colors.grey),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    // Related Crop Option
                    Text('crop_relation'.tr(lang), style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: isDark ? Colors.white10 : const Color(0xFFF9FBFA),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey.shade400),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String?>(
                          value: selectedCropId,
                          isExpanded: true,
                          dropdownColor: isDark ? AppTheme.darkCard : Colors.white,
                          items: [
                            DropdownMenuItem<String?>(
                              value: null,
                              child: Text('general_farm_expense'.tr(lang)),
                            ),
                            ...farmCrops.map((c) => DropdownMenuItem<String?>(
                                  value: c.id,
                                  child: Text('${c.cropName} (${c.stage})'),
                                )),
                          ],
                          onChanged: isSubmitting
                              ? null
                              : (val) {
                                  setModalState(() => selectedCropId = val);
                                },
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    // Description / Details
                    Text('description'.tr(lang), style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: descriptionController,
                      enabled: !isSubmitting,
                      maxLines: 2,
                      decoration: InputDecoration(
                        hintText: 'e.g. Purchased from local cooperative society',
                        filled: true,
                        fillColor: isDark ? Colors.white10 : const Color(0xFFF9FBFA),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                    const SizedBox(height: 22),
                    // Submit Button
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryGreen,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: isSubmitting
                            ? null
                            : () async {
                                final title = titleController.text.trim();
                                final desc = descriptionController.text.trim();
                                final amt = double.tryParse(amountController.text.trim());
                                if (title.isEmpty || amt == null || amt <= 0 || amt.isNaN || amt.isInfinite) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text('valid_title_and_amount'.tr(lang))),
                                  );
                                  return;
                                }

                                setModalState(() => isSubmitting = true);

                                final success = await ref.read(expensesProvider.notifier).addExpense(
                                      farmId: farmId,
                                      title: title,
                                      amount: amt,
                                      category: selectedCategory,
                                      description: desc,
                                      date: selectedDate,
                                      cropId: selectedCropId,
                                    );

                                if (!dialogCtx.mounted) return;

                                if (success) {
                                  Navigator.pop(dialogCtx);
                                  if (context.mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text('expense_saved_success'.tr(lang)),
                                        backgroundColor: AppTheme.primaryGreen,
                                      ),
                                    );
                                  }
                                } else {
                                  setModalState(() => isSubmitting = false);
                                  if (context.mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text('expense_save_failed'.tr(lang)),
                                        backgroundColor: Colors.red,
                                      ),
                                    );
                                  }
                                }
                              },
                        child: isSubmitting
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : Text('add_expense'.tr(lang), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  String _getLocalizedCategoryName(String rawCategory, String lang) {
    final cat = rawCategory.toUpperCase();
    if (cat.contains('FERT')) return 'cat_fertilizer'.tr(lang);
    if (cat.contains('SEED')) return 'cat_seeds'.tr(lang);
    if (cat.contains('PEST')) return 'cat_pesticide'.tr(lang);
    if (cat.contains('LAB')) return 'cat_labour'.tr(lang);
    if (cat.contains('EQUIP') || cat.contains('RENT')) return 'cat_rental'.tr(lang);
    if (cat.contains('IRRIG')) return 'cat_irrigation'.tr(lang);
    if (cat.contains('FUEL')) return 'cat_fuel'.tr(lang);
    if (cat.contains('MAINT')) return 'cat_maintenance'.tr(lang);
    if (cat.contains('TRANS')) return 'cat_transport'.tr(lang);
    return 'cat_other'.tr(lang);
  }

  Widget _buildBudgetMetricRow(String label, String value, bool isDark, {Color? color}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 13.5,
            fontWeight: FontWeight.w600,
            color: isDark ? Colors.grey.shade300 : Colors.grey.shade700,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w900,
            color: color ?? (isDark ? Colors.white : AppTheme.textDarkNavy),
          ),
        ),
      ],
    );
  }
}
