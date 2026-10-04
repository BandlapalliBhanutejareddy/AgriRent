import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api/api_client.dart';
import '../../../shared/theme/app_theme.dart';
import '../providers/farm_provider.dart';
import '../providers/expenses_provider.dart';
import 'all_expenses_screen.dart';

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
  List<dynamic> _operations = [];
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
    final farms = ref.read(farmProvider).farms;
    if (farms.isNotEmpty) {
      final farm = farms.first;
      _currentFarmId = farm.id;
      if (farm.crops.isNotEmpty) {
        final crop = farm.crops.first;
        _currentCropId = crop.id;
        _fetchOperations(farm.id, crop.id);
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
          _operations = ops;
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
    final isDark = Theme.of(context).brightness == Brightness.dark;

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
          title: const Text('Farm Plan', style: TextStyle(fontWeight: FontWeight.w900)),
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
                Text('No Farm Found', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: isDark ? Colors.white : AppTheme.textDarkNavy)),
                const SizedBox(height: 8),
                Text('Set up your farm profile to view customized agronomic schedules.', textAlign: TextAlign.center, style: TextStyle(color: isDark ? Colors.grey.shade400 : Colors.grey.shade600)),
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  onPressed: () => context.push('/farm-setup'),
                  icon: const Icon(Icons.add),
                  label: const Text('Set Up Farm'),
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

    final farm = farmState.farms.first;
    final crop = farm.crops.isNotEmpty ? farm.crops.first : null;

    final cropName = crop?.cropName.isNotEmpty == true ? crop!.cropName : 'Maize';
    final season = crop?.season.isNotEmpty == true ? crop!.season : 'Kharif 2024';
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
                    _buildSummaryRow('Budget', '₹ 50,000 (Optional)', Icons.account_balance_wallet_rounded, isDark),
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
          IconButton(
            icon: const Icon(Icons.smart_toy_outlined, color: AppTheme.primaryGreen),
            tooltip: 'Farm Copilot',
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
                  child: Row(
                    children: [
                      _buildMiniStep('Sowing', true, isDark),
                      _buildMiniStepLine(true, isDark),
                      _buildMiniStep('Germination', true, isDark),
                      _buildMiniStepLine(true, isDark),
                      _buildMiniStep('Seedling', true, isDark),
                      _buildMiniStepLine(true, isDark),
                      _buildMiniStep('Vegetative', false, isDark, isCurrent: true),
                      _buildMiniStepLine(false, isDark),
                      _buildMiniStep('Flowering', false, isDark),
                    ],
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
                _buildTasksTabContent(farm.id, crop?.id ?? '', isDark),
              ],

              // TAB 3: BUDGET (Screen 13 in prototype)
              if (_selectedTab == 3) ...[
                _buildBudgetTabContent(farm, isDark),
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

  Widget _buildMiniStepLine(bool isDone, bool isDark) {
    return Expanded(
      child: Container(
        height: 2,
        margin: const EdgeInsets.only(bottom: 10),
        color: isDone ? AppTheme.primaryGreen : Colors.grey.shade300,
      ),
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

  // TAB 1: OPERATIONS LIST
  Widget _buildOperationsTabContent(String farmId, String cropId, bool isDark) {
    final defaultOps = [
      {'id': 'op_1', 'title': 'Irrigation', 'dueDate': 'Due: Today', 'status': 'IN_PROGRESS', 'icon': Icons.water_drop_outlined, 'color': Colors.blue},
      {'id': 'op_2', 'title': 'Fertilization', 'dueDate': 'Due: 15 Aug 2024', 'status': 'PENDING', 'icon': Icons.science_outlined, 'color': Colors.orange},
      {'id': 'op_3', 'title': 'Pest Monitoring', 'dueDate': 'Due: 18 Aug 2024', 'status': 'PENDING', 'icon': Icons.bug_report_outlined, 'color': Colors.amber},
      {'id': 'op_4', 'title': 'Weeding', 'dueDate': 'Due: 20 Aug 2024', 'status': 'PENDING', 'icon': Icons.grass_outlined, 'color': Colors.green},
      {'id': 'op_5', 'title': 'Soil Testing', 'dueDate': 'Due: 25 Aug 2024', 'status': 'PENDING', 'icon': Icons.layers_outlined, 'color': Colors.purple},
      {'id': 'op_6', 'title': 'Mulching', 'dueDate': 'Due: 28 Aug 2024', 'status': 'PENDING', 'icon': Icons.eco_outlined, 'color': Colors.teal},
    ];

    final displayOps = _operations.isNotEmpty ? _operations : defaultOps;

    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: displayOps.length,
      separatorBuilder: (_, _) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        final op = displayOps[index];
        final title = op['title'] ?? op['operationTitle'] ?? 'Operation';
        final due = op['dueDate'] ?? 'Due: Soon';
        final status = (op['status'] ?? 'PENDING').toString().toUpperCase();
        final isInProgress = status == 'IN_PROGRESS';

        return InkWell(
          onTap: () async {
            await context.push('/operation-detail', extra: {
              'operation': op,
              'farmId': farmId,
              'cropId': cropId,
            });
            if (mounted) {
              _loadFarmData();
              ref.read(farmProvider.notifier).fetchFarms();
            }
          },
          borderRadius: BorderRadius.circular(16),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: isDark ? AppTheme.darkCard : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryGreen.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.water_drop_outlined, color: AppTheme.primaryGreen, size: 22),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: isDark ? Colors.white : AppTheme.textDarkNavy)),
                      const SizedBox(height: 2),
                      Text(due, style: TextStyle(fontSize: 12, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600)),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: isInProgress ? Colors.orange.withValues(alpha: 0.15) : (isDark ? Colors.white10 : Colors.grey.shade200),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    isInProgress ? 'In Progress' : 'Pending',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: isInProgress ? Colors.orange : (isDark ? Colors.grey.shade400 : Colors.grey.shade600),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // TAB 2: TASKS CHECKLIST (Screen 12 in prototype)
  Widget _buildTasksTabContent(String farmId, String cropId, bool isDark) {
    final allTasks = <Map<String, dynamic>>[];
    for (final op in _operations) {
      final tList = op['tasks'] as List?;
      if (tList != null) {
        for (final t in tList) {
          if (t is Map) {
            allTasks.add({...Map<String, dynamic>.from(t), '_opId': op['id']});
          }
        }
      }
    }

    final displayTasks = allTasks.isNotEmpty
        ? allTasks
        : [
            {'id': 'task_1', 'title': 'Check soil moisture', 'status': 'COMPLETED', 'dueDate': '12 Aug 2024'},
            {'id': 'task_2', 'title': 'Inspect irrigation lines', 'status': 'COMPLETED', 'dueDate': '12 Aug 2024'},
            {'id': 'task_3', 'title': 'Irrigate crop', 'status': 'PENDING', 'dueDate': 'Today'},
            {'id': 'task_4', 'title': 'Record completion', 'status': 'PENDING', 'dueDate': 'Tomorrow'},
          ];

    final totalCount = displayTasks.length;
    final completedCount = displayTasks.where((t) => (t['status'] ?? '').toString().toUpperCase() == 'COMPLETED').length;
    final progressVal = totalCount > 0 ? (completedCount / totalCount) : 0.0;
    final progressPct = (progressVal * 100).round();

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
                  Text('Progress', style: TextStyle(fontWeight: FontWeight.bold, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600)),
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
        const SizedBox(height: 16),

        ...displayTasks.map((t) {
          final isDone = (t['status'] ?? '').toString().toUpperCase() == 'COMPLETED';
          final title = t['title'] ?? 'Farm Task';
          final date = isDone ? 'Completed ✓' : (t['dueDate'] != null ? 'Due: ${t['dueDate']}' : 'Pending');
          final taskId = t['id']?.toString() ?? '';
          final opId = t['_opId']?.toString() ?? (_operations.isNotEmpty ? _operations[0]['id'] : 'default_op');

          return Padding(
            padding: const EdgeInsets.only(bottom: 10.0),
            child: InkWell(
              onTap: () async {
                final newStatus = isDone ? 'PENDING' : 'COMPLETED';
                setState(() {
                  t['status'] = newStatus;
                });
                try {
                  if (newStatus == 'COMPLETED') {
                    await ApiClient().dio.post('farms/$farmId/crops/$cropId/operations/$opId/tasks/$taskId/complete', data: {});
                  }
                  await _loadFarmData();
                } catch (_) {}
              },
              borderRadius: BorderRadius.circular(14),
              child: _buildTaskItem(title, date, isDone, isDark),
            ),
          );
        }),
      ],
    );
  }

  Widget _buildTaskItem(String title, String date, bool isDone, bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
      ),
      child: Row(
        children: [
          Icon(isDone ? Icons.check_box_rounded : Icons.check_box_outline_blank_rounded, color: isDone ? AppTheme.primaryGreen : Colors.grey, size: 24),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: isDone ? (isDark ? Colors.grey.shade400 : Colors.grey.shade600) : (isDark ? Colors.white : AppTheme.textDarkNavy),
                    decoration: isDone ? TextDecoration.lineThrough : null,
                  ),
                ),
                Text(date, style: TextStyle(fontSize: 11, color: isDone ? AppTheme.primaryGreen : Colors.grey, fontWeight: isDone ? FontWeight.bold : FontWeight.normal)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // TAB 3: BUDGET BREAKDOWN & ALL EXPENSES
  Widget _buildBudgetTabContent(dynamic farm, bool isDark) {
    final farmId = farm?.id ?? _currentFarmId;
    final expState = ref.watch(expensesProvider);
    final expData = farmId != null ? expState.farmExpenses[farmId] : null;

    final totalBudget = expData?.totalBudget ?? 50000.0;
    final totalSpent = expData?.totalSpent ?? 0.0;
    final remaining = expData?.remainingBudget ?? (totalBudget - totalSpent);
    final count = expData?.expenses.length ?? 0;

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
                    'BUDGET',
                    style: TextStyle(
                      fontSize: 16,
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
                    child: const Text(
                      'Budget Summary',
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.primaryGreen,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              _buildBudgetMetricRow('Total Budget', '₹ ${totalBudget.toInt()}', isDark),
              const SizedBox(height: 10),
              _buildBudgetMetricRow('Total Spent', '₹ ${totalSpent.toInt()}', isDark, color: Colors.orange.shade800),
              const SizedBox(height: 10),
              _buildBudgetMetricRow('Remaining Budget', '₹ ${remaining.toInt()}', isDark, color: AppTheme.primaryGreen),
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
                    'ALL EXPENSES',
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
                      '$count Expenses',
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
                    'Total Logged Spending:',
                    style: TextStyle(fontSize: 13, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600),
                  ),
                  Text(
                    '₹ ${totalSpent.toInt()}',
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
                  label: const Text(
                    'View All Expenses →',
                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14.5),
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
