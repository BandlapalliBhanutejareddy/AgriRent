import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api/api_client.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/farm_provider.dart';

class StageOperationsScreen extends ConsumerStatefulWidget {
  const StageOperationsScreen({super.key});

  @override
  ConsumerState<StageOperationsScreen> createState() => _StageOperationsScreenState();
}

class _StageOperationsScreenState extends ConsumerState<StageOperationsScreen> {
  int _filterIndex = 0; // 0: All, 1: Pending, 2: Completed
  List<dynamic> _operations = [];
  bool _isLoading = false;
  String? _farmId;
  String? _cropId;
  String _cropName = 'Crop';
  String _currentStage = 'VEGETATIVE';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  Future<void> _loadData() async {
    final farmState = ref.read(farmProvider);
    if (farmState.farms.isEmpty) {
      await ref.read(farmProvider.notifier).fetchFarms();
    }
    final farms = ref.read(farmProvider).farms;
    if (farms.isNotEmpty) {
      final farm = farms.first;
      _farmId = farm.id;
      if (farm.crops.isNotEmpty) {
        final crop = farm.crops.first;
        _cropId = crop.id;
        _cropName = crop.cropName;
        _currentStage = crop.stage.toUpperCase();
        _fetchOperations(farm.id, crop.id);
      }
    }
  }

  Future<void> _fetchOperations(String farmId, String cropId) async {
    setState(() => _isLoading = true);
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
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  bool _isTaskDone(dynamic task) {
    if (task == null) return false;
    final status = (task['status'] ?? '').toString().toUpperCase();
    return status == 'COMPLETED' || task['isCompleted'] == true || task['completed'] == true;
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(languageProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final stageFormatted = _currentStage.isNotEmpty
        ? (_currentStage[0] + _currentStage.substring(1).toLowerCase())
        : 'Current';

    final filteredList = _operations.where((op) {
      final status = (op['status'] ?? 'PENDING').toString().toUpperCase();
      final tasks = List<dynamic>.from(op['tasks'] ?? []);
      final allDone = tasks.isNotEmpty && tasks.every(_isTaskDone);
      final isCompleted = status == 'COMPLETED' || allDone;

      if (_filterIndex == 1) return !isCompleted;
      if (_filterIndex == 2) return isCompleted;
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('operations'.tr(lang), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
            Text('$_cropName — $stageFormatted Stage', style: TextStyle(fontSize: 12, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600)),
          ],
        ),
        backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        foregroundColor: isDark ? Colors.white : AppTheme.textDarkNavy,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              if (_farmId != null && _cropId != null) {
                _fetchOperations(_farmId!, _cropId!);
              }
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter Tabs (All / Pending / Completed)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            color: isDark ? AppTheme.darkCard : Colors.white,
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: isDark ? Colors.white10 : const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                children: [
                  _buildFilterTab(0, 'All', isDark),
                  _buildFilterTab(1, 'pending_status'.tr(lang), isDark),
                  _buildFilterTab(2, 'completed_status'.tr(lang), isDark),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),

          // Operations List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen))
                : filteredList.isEmpty
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24.0),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.assignment_outlined, size: 48, color: Colors.grey.shade400),
                              const SizedBox(height: 12),
                              Text(
                                'no_operations_for_stage'.tr(lang),
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.all(18),
                        itemCount: filteredList.length,
                        separatorBuilder: (_, _) => const SizedBox(height: 12),
                        itemBuilder: (context, index) {
                          final item = filteredList[index];
                          final title = item['name'] ?? item['title'] ?? item['operationTitle'] ?? 'Farm Operation';
                          final description = item['description'] ?? 'Field operation for optimal crop yield.';
                          final status = (item['status'] ?? 'PENDING').toString().toUpperCase();
                          final tasks = List<dynamic>.from(item['tasks'] ?? []);
                          final completedTasks = tasks.where(_isTaskDone).length;
                          final totalTasks = tasks.length;
                          final progressPct = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).round() : 0;
                          final isCompleted = status == 'COMPLETED' || (totalTasks > 0 && completedTasks == totalTasks);
                          final statusLabel = isCompleted
                              ? 'completed_status'.tr(lang)
                              : (status == 'IN_PROGRESS' ? 'in_progress'.tr(lang) : 'pending_status'.tr(lang));

                          return Container(
                            padding: const EdgeInsets.all(18),
                            decoration: BoxDecoration(
                              color: isDark ? AppTheme.darkCard : Colors.white,
                              borderRadius: BorderRadius.circular(18),
                              border: Border.all(
                                color: isCompleted
                                    ? Colors.green.withValues(alpha: 0.3)
                                    : (isDark ? Colors.white10 : Colors.grey.shade200),
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
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
                                    Expanded(
                                      child: Text(
                                        title,
                                        style: TextStyle(
                                          fontSize: 16.5,
                                          fontWeight: FontWeight.w800,
                                          color: isDark ? Colors.white : AppTheme.textDarkNavy,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: isCompleted
                                            ? Colors.green.withValues(alpha: 0.15)
                                            : (status == 'IN_PROGRESS' ? Colors.orange.withValues(alpha: 0.15) : (isDark ? Colors.white10 : Colors.grey.shade100)),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Text(
                                        statusLabel,
                                        style: TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.bold,
                                          color: isCompleted
                                              ? Colors.green
                                              : (status == 'IN_PROGRESS' ? Colors.orange.shade800 : (isDark ? Colors.grey.shade400 : Colors.grey.shade700)),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  description,
                                  style: TextStyle(
                                    fontSize: 13,
                                    height: 1.35,
                                    color: isDark ? Colors.grey.shade300 : Colors.grey.shade700,
                                  ),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 14),

                                // Progress Section
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      '$completedTasks / $totalTasks ${'tasks_completed'.tr(lang)}',
                                      style: TextStyle(
                                        fontSize: 12.5,
                                        fontWeight: FontWeight.w700,
                                        color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                                      ),
                                    ),
                                    Text(
                                      '$progressPct%',
                                      style: const TextStyle(
                                        fontSize: 12.5,
                                        fontWeight: FontWeight.w900,
                                        color: AppTheme.primaryGreen,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(4),
                                  child: LinearProgressIndicator(
                                    value: totalTasks > 0 ? (completedTasks / totalTasks) : 0.0,
                                    minHeight: 6,
                                    backgroundColor: isDark ? Colors.white10 : Colors.grey.shade200,
                                    valueColor: AlwaysStoppedAnimation<Color>(
                                      isCompleted ? Colors.green : AppTheme.primaryGreen,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 14),

                                // Single Clear Primary Action
                                SizedBox(
                                  width: double.infinity,
                                  height: 42,
                                  child: ElevatedButton(
                                    onPressed: () async {
                                      await context.push('/operation-detail', extra: {
                                        'operation': item,
                                        'farmId': _farmId ?? '',
                                        'cropId': _cropId ?? '',
                                      });
                                      if (mounted && _farmId != null && _cropId != null) {
                                        _fetchOperations(_farmId!, _cropId!);
                                        ref.read(farmProvider.notifier).fetchFarms();
                                      }
                                    },
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: isCompleted ? (isDark ? Colors.white12 : Colors.grey.shade200) : AppTheme.primaryGreen,
                                      foregroundColor: isCompleted ? (isDark ? Colors.white : AppTheme.textDarkNavy) : Colors.white,
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                      elevation: 0,
                                    ),
                                    child: Text(
                                      'view_operation'.tr(lang),
                                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13.5),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterTab(int index, String label, bool isDark) {
    final isSelected = _filterIndex == index;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _filterIndex = index),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected
                ? (isDark ? AppTheme.primaryGreen.withValues(alpha: 0.3) : Colors.white)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
            boxShadow: isSelected && !isDark
                ? [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 4, offset: const Offset(0, 1))]
                : null,
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13,
              fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
              color: isSelected
                  ? (isDark ? Colors.white : AppTheme.textDarkNavy)
                  : (isDark ? Colors.grey.shade400 : Colors.grey.shade600),
            ),
          ),
        ),
      ),
    );
  }
}
