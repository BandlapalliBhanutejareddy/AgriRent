import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../shared/theme/app_theme.dart';
import '../providers/farm_provider.dart';

class CompletedTasksScreen extends ConsumerStatefulWidget {
  final String? farmId;
  final String? cropId;

  const CompletedTasksScreen({super.key, this.farmId, this.cropId});

  @override
  ConsumerState<CompletedTasksScreen> createState() => _CompletedTasksScreenState();
}

class _CompletedTasksScreenState extends ConsumerState<CompletedTasksScreen> {
  bool _isLoading = true;
  String? _error;
  List<Map<String, dynamic>> _completedTasks = [];
  String _cropName = '';
  String _farmName = '';

  @override
  void initState() {
    super.initState();
    _fetchCompletedTasks();
  }

  Future<void> _fetchCompletedTasks() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final farmState = ref.read(farmProvider);
      final farm = farmState.farms.isNotEmpty
          ? (widget.farmId != null
              ? farmState.farms.firstWhere((f) => f.id == widget.farmId, orElse: () => farmState.farms.first)
              : farmState.farms.first)
          : null;

      final fId = widget.farmId ?? farm?.id;
      final cId = widget.cropId ?? (farm?.crops.isNotEmpty == true ? farm!.crops.first.id : '');

      _farmName = farm?.name ?? 'My Farm';
      _cropName = farm?.crops.isNotEmpty == true ? farm!.crops.first.cropName : 'Active Crop';

      if (fId == null || fId.isEmpty) {
        setState(() {
          _isLoading = false;
          _completedTasks = [];
        });
        return;
      }

      final res = await ApiClient().dio.get('/farms/$fId/crops/$cId/tasks/completed');
      final dynamic body = res.data;
      final List<dynamic> list = (body is Map && body['data'] is Map && body['data']['tasks'] is List)
          ? body['data']['tasks']
          : (body is Map && body['tasks'] is List ? body['tasks'] : []);

      setState(() {
        _completedTasks = list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
        _isLoading = false;
      });
    } catch (e) {
      // Fallback to fetch operations and collect completed tasks
      try {
        final farmState = ref.read(farmProvider);
        final farm = farmState.farms.isNotEmpty ? farmState.farms.first : null;
        final fId = widget.farmId ?? farm?.id;
        final cId = widget.cropId ?? (farm?.crops.isNotEmpty == true ? farm!.crops.first.id : '');

        if (fId != null && fId.isNotEmpty) {
          final res = await ApiClient().dio.get('/farms/$fId/crops/$cId/operations');
          final dynamic raw = res.data;
          final List<dynamic> ops = raw is List
              ? raw
              : (raw is Map && raw['data'] is List
                  ? raw['data']
                  : (raw is Map && raw['operations'] is List ? raw['operations'] : []));

          final List<Map<String, dynamic>> doneTasks = [];
          for (final op in ops) {
            final tList = op['tasks'] as List?;
            if (tList != null) {
              for (final t in tList) {
                if (t is Map && (t['status'] ?? '').toString().toUpperCase() == 'COMPLETED') {
                  doneTasks.add({
                    ...Map<String, dynamic>.from(t),
                    'operationName': op['name'] ?? 'Farm Operation',
                    'cropName': _cropName,
                    'farmName': _farmName,
                  });
                }
              }
            }
          }

          setState(() {
            _completedTasks = doneTasks;
            _isLoading = false;
          });
          return;
        }
      } catch (_) {}

      setState(() {
        _isLoading = false;
        _error = 'Unable to load completed tasks. Please retry.';
      });
    }
  }

  String _formatDate(dynamic dateStr) {
    if (dateStr == null) return 'Recently';
    try {
      final dt = DateTime.parse(dateStr.toString()).toLocal();
      final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      final hour = dt.hour % 12 == 0 ? 12 : dt.hour % 12;
      final ampm = dt.hour >= 12 ? 'PM' : 'AM';
      final min = dt.minute.toString().padLeft(2, '0');
      return '${dt.day.toString().padLeft(2, '0')} ${months[dt.month - 1]} ${dt.year}, $hour:$min $ampm';
    } catch (_) {
      return dateStr.toString();
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final count = _completedTasks.length;

    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Completed Tasks', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 19)),
        backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        foregroundColor: isDark ? Colors.white : AppTheme.textDarkNavy,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _fetchCompletedTasks,
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: _buildBody(isDark, count),
    );
  }

  Widget _buildBody(bool isDark, int count) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen));
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline_rounded, size: 48, color: Colors.red.shade400),
              const SizedBox(height: 14),
              Text(_error!, textAlign: TextAlign.center, style: TextStyle(color: isDark ? Colors.white : AppTheme.textDarkNavy)),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: _fetchCompletedTasks,
                icon: const Icon(Icons.refresh),
                label: const Text('Retry'),
                style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryGreen, foregroundColor: Colors.white),
              ),
            ],
          ),
        ),
      );
    }

    if (_completedTasks.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppTheme.primaryGreen.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.task_alt_rounded, size: 54, color: AppTheme.primaryGreen),
              ),
              const SizedBox(height: 20),
              Text(
                'NO COMPLETED TASKS YET',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w900,
                  color: isDark ? Colors.white : AppTheme.textDarkNavy,
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Tasks completed during farm operations will automatically be archived and tracked here.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 13,
                  color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                  height: 1.4,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      color: AppTheme.primaryGreen,
      onRefresh: _fetchCompletedTasks,
      child: ListView(
        padding: const EdgeInsets.all(18),
        children: [
          // Header Card
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: isDark ? AppTheme.darkCard : Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
                  blurRadius: 10,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryGreen.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Icon(Icons.check_circle_rounded, color: AppTheme.primaryGreen, size: 28),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Total Completed Tasks',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '$count Tasks',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                          color: isDark ? Colors.white : AppTheme.textDarkNavy,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryGreen.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    _cropName.isNotEmpty ? _cropName : 'All Crops',
                    style: const TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.primaryGreen,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),

          Text(
            'RECORDED COMPLETIONS',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w900,
              letterSpacing: 0.8,
              color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
            ),
          ),
          const SizedBox(height: 10),

          ..._completedTasks.map((t) {
            final title = t['title'] ?? 'Farm Task';
            final opName = t['operationName'] ?? t['operation'] ?? 'General Operation';
            final desc = t['description'] as String?;
            final completedAt = t['completedAt'] ?? t['updatedAt'] ?? t['dueDate'];
            final formattedDate = _formatDate(completedAt);

            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? AppTheme.darkCard : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: isDark ? 0.15 : 0.02),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    margin: const EdgeInsets.only(top: 2),
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryGreen.withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.check, size: 16, color: AppTheme.primaryGreen),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: isDark ? Colors.white : AppTheme.textDarkNavy,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                              decoration: BoxDecoration(
                                color: isDark ? Colors.white10 : const Color(0xFFF1F5F9),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                opName,
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: isDark ? Colors.grey.shade300 : const Color(0xFF475569),
                                ),
                              ),
                            ),
                          ],
                        ),
                        if (desc != null && desc.trim().isNotEmpty) ...[
                          const SizedBox(height: 6),
                          Text(
                            desc,
                            style: TextStyle(
                              fontSize: 12,
                              color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                            ),
                          ),
                        ],
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Icon(Icons.access_time_rounded, size: 13, color: Colors.grey.shade500),
                            const SizedBox(width: 4),
                            Text(
                              'Completed: $formattedDate',
                              style: TextStyle(
                                fontSize: 11.5,
                                fontWeight: FontWeight.w600,
                                color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}
