import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api/api_client.dart';
import '../../../shared/theme/app_theme.dart';
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
  String _cropName = 'Maize';
  String _currentStage = 'FLOWERING';

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

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final stageFormatted = _currentStage[0] + _currentStage.substring(1).toLowerCase();

    final defaultStageOps = [
      {'id': 'op_1', 'title': 'Irrigation', 'stage': _currentStage, 'dueDate': 'Due: 12 Aug 2024', 'status': 'PENDING', 'icon': Icons.water_drop_outlined, 'color': Colors.blue},
      {'id': 'op_2', 'title': 'Fertilization', 'stage': _currentStage, 'dueDate': 'Due: 15 Aug 2024', 'status': 'PENDING', 'icon': Icons.science_outlined, 'color': Colors.orange},
      {'id': 'op_3', 'title': 'Pest Monitoring', 'stage': _currentStage, 'dueDate': 'Due: 18 Aug 2024', 'status': 'PENDING', 'icon': Icons.bug_report_outlined, 'color': Colors.amber},
      {'id': 'op_4', 'title': 'Weeding', 'stage': _currentStage, 'dueDate': 'Due: 20 Aug 2024', 'status': 'PENDING', 'icon': Icons.grass_outlined, 'color': Colors.green},
    ];

    final displayList = _operations.isNotEmpty ? _operations : defaultStageOps;

    final filteredList = displayList.where((op) {
      final status = (op['status'] ?? 'PENDING').toString().toUpperCase();
      if (_filterIndex == 1) return status == 'PENDING' || status == 'IN_PROGRESS';
      if (_filterIndex == 2) return status == 'COMPLETED';
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Operations', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 19)),
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
                  _buildFilterTab(1, 'Pending', isDark),
                  _buildFilterTab(2, 'Completed', isDark),
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
                        child: Text(
                          'No ${_filterIndex == 1 ? 'pending' : (_filterIndex == 2 ? 'completed' : '')} operations found.',
                          style: TextStyle(color: isDark ? Colors.grey.shade400 : Colors.grey.shade600),
                        ),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.all(20),
                        itemCount: filteredList.length,
                        separatorBuilder: (_, _) => const SizedBox(height: 12),
                        itemBuilder: (context, index) {
                          final item = filteredList[index];
                          final title = item['title'] ?? item['operationTitle'] ?? 'Farm Operation';
                          final dueDate = item['dueDate'] ?? 'Due: Soon';
                          final status = (item['status'] ?? 'PENDING').toString().toUpperCase();
                          final isCompleted = status == 'COMPLETED';

                          return InkWell(
                            onTap: () {
                              context.push('/operation-detail', extra: {
                                'operation': item,
                                'farmId': _farmId ?? '',
                                'cropId': _cropId ?? '',
                              });
                            },
                            borderRadius: BorderRadius.circular(18),
                            child: Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: isDark ? AppTheme.darkCard : Colors.white,
                                borderRadius: BorderRadius.circular(18),
                                border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
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
                                  Container(
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: isCompleted
                                          ? Colors.green.withValues(alpha: 0.15)
                                          : AppTheme.primaryGreen.withValues(alpha: 0.1),
                                      borderRadius: BorderRadius.circular(14),
                                    ),
                                    child: Icon(
                                      isCompleted ? Icons.check_circle : Icons.water_drop,
                                      color: isCompleted ? Colors.green : AppTheme.primaryGreen,
                                      size: 24,
                                    ),
                                  ),
                                  const SizedBox(width: 14),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          title,
                                          style: TextStyle(
                                            fontSize: 16,
                                            fontWeight: FontWeight.w800,
                                            color: isDark ? Colors.white : AppTheme.textDarkNavy,
                                            decoration: isCompleted ? TextDecoration.lineThrough : null,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          dueDate,
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  SizedBox(
                                    height: 38,
                                    child: isCompleted
                                        ? Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                            decoration: BoxDecoration(
                                              color: Colors.green.withValues(alpha: 0.1),
                                              borderRadius: BorderRadius.circular(10),
                                            ),
                                            child: const Text('Done', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 12)),
                                          )
                                        : ElevatedButton(
                                            onPressed: () {
                                              context.push('/operation-detail', extra: {
                                                'operation': item,
                                                'farmId': _farmId ?? '',
                                                'cropId': _cropId ?? '',
                                              });
                                            },
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: AppTheme.primaryGreen,
                                              foregroundColor: Colors.white,
                                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                              padding: const EdgeInsets.symmetric(horizontal: 16),
                                              elevation: 0,
                                            ),
                                            child: const Text('Start', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                          ),
                                  ),
                                ],
                              ),
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
            color: isSelected ? (isDark ? AppTheme.primaryGreen : Colors.white) : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
            boxShadow: isSelected && !isDark
                ? [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.05),
                      blurRadius: 4,
                      offset: const Offset(0, 1),
                    ),
                  ]
                : [],
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.bold,
              color: isSelected
                  ? (isDark ? Colors.white : AppTheme.primaryGreen)
                  : (isDark ? Colors.grey.shade400 : Colors.grey.shade600),
            ),
          ),
        ),
      ),
    );
  }
}
