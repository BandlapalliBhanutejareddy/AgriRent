import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/farm_provider.dart';
import '../providers/schedule_provider.dart';
import '../providers/expenses_provider.dart';

class OperationDetailScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic> operation;
  final String farmId;
  final String cropId;

  const OperationDetailScreen({
    super.key,
    required this.operation,
    required this.farmId,
    required this.cropId,
  });

  @override
  ConsumerState<OperationDetailScreen> createState() => _OperationDetailScreenState();
}

class _OperationDetailScreenState extends ConsumerState<OperationDetailScreen> {
  late Map<String, dynamic> _opData;
  late List<dynamic> _tasks;
  bool _isMarkingComplete = false;
  final Set<String> _completingTaskIds = {};

  @override
  void initState() {
    super.initState();
    _opData = Map<String, dynamic>.from(widget.operation);
    _tasks = List<dynamic>.from(_opData['tasks'] ?? []);
  }

  bool _isTaskCompleted(dynamic task) {
    if (task == null) return false;
    final status = (task['status'] ?? '').toString().toUpperCase();
    return status == 'COMPLETED' || task['isCompleted'] == true || task['completed'] == true;
  }

  int get _completedCount => _tasks.where(_isTaskCompleted).length;
  int get _totalCount => _tasks.length;
  int get _progressPercent => _totalCount > 0 ? ((_completedCount / _totalCount) * 100).round() : 0;

  Future<void> _handleTaskToggle(int index, dynamic task, String lang) async {
    final taskId = task['id']?.toString() ?? task['_id']?.toString();
    if (taskId == null || taskId.isEmpty) return;

    if (_isTaskCompleted(task)) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Task is already completed.'.tr(lang)),
          duration: const Duration(seconds: 1),
        ),
      );
      return;
    }

    setState(() => _completingTaskIds.add(taskId));

    final opId = _opData['id'] ?? _opData['_id'] ?? '';
    try {
      final response = await ApiClient().dio.post(
        'farms/${widget.farmId}/crops/${widget.cropId}/operations/$opId/tasks/$taskId/complete',
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        if (mounted) {
          setState(() {
            _tasks[index]['status'] = 'COMPLETED';
            _tasks[index]['isCompleted'] = true;
            _tasks[index]['completed'] = true;
          });

          // If all tasks are now complete, update operation status locally
          if (_completedCount == _totalCount) {
            _opData['status'] = 'COMPLETED';
          }

          // Refetch farm state in background to synchronize other screens
          ref.read(farmProvider.notifier).fetchFarms();
          try {
            ref.read(scheduleProvider(ScheduleParams(farmId: widget.farmId, lang: lang)).notifier).fetchSchedule();
            ref.read(expensesProvider.notifier).fetchExpenses(widget.farmId);
          } catch (_) {}

          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Task completed successfully!'.tr(lang)),
              backgroundColor: AppTheme.primaryGreen,
              duration: const Duration(seconds: 1),
            ),
          );
        }
      } else {
        throw Exception('Failed to complete task');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update task. Please try again.'.tr(lang)),
            backgroundColor: Colors.red.shade700,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _completingTaskIds.remove(taskId));
      }
    }
  }

  Future<void> _markOperationComplete(String lang) async {
    setState(() => _isMarkingComplete = true);
    final opId = _opData['id'] ?? _opData['_id'] ?? '';

    try {
      final response = await ApiClient().dio.post(
        'farms/${widget.farmId}/crops/${widget.cropId}/operations/$opId/complete',
        data: {
          'feedback': 'COMPLETED',
          'notes': 'Completed from AgroRent Mobile',
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        if (mounted) {
          setState(() {
            _opData['status'] = 'COMPLETED';
            for (var t in _tasks) {
              t['status'] = 'COMPLETED';
              t['isCompleted'] = true;
              t['completed'] = true;
            }
          });

          await ref.read(farmProvider.notifier).fetchFarms();
          try {
            ref.read(scheduleProvider(ScheduleParams(farmId: widget.farmId, lang: lang)).notifier).fetchSchedule();
            ref.read(expensesProvider.notifier).fetchExpenses(widget.farmId);
          } catch (_) {}

          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Operation marked as completed!'.tr(lang)),
                backgroundColor: AppTheme.primaryGreen,
              ),
            );
          }
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to complete operation.'.tr(lang)),
            backgroundColor: Colors.red.shade700,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isMarkingComplete = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(languageProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final title = _opData['name'] ?? _opData['title'] ?? _opData['operationTitle'] ?? 'Farm Operation';
    final description = _opData['description'] ?? 'Perform essential field activity for healthy crop progression.';
    final rawStatus = (_opData['status'] ?? 'PENDING').toString().toUpperCase();
    final isOpCompleted = rawStatus == 'COMPLETED' || _progressPercent == 100;
    final statusLabel = isOpCompleted ? 'completed_status'.tr(lang) : (rawStatus == 'IN_PROGRESS' ? 'in_progress'.tr(lang) : 'pending_status'.tr(lang));

    final labourersNeeded = _opData['labourersNeeded'];
    final estCost = _opData['estimatedLabourCost'];
    final labourText = labourersNeeded != null ? '$labourersNeeded workers' : 'not_available'.tr(lang);
    final costText = estCost != null ? '₹ $estCost' : 'not_available'.tr(lang);

    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          'view_operation'.tr(lang),
          style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18),
        ),
        backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        foregroundColor: isDark ? Colors.white : AppTheme.textDarkNavy,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. OPERATION HEADER CARD
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: isDark ? AppTheme.darkCard : Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
                    blurRadius: 10,
                    offset: const Offset(0, 3),
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
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                            color: isDark ? Colors.white : AppTheme.textDarkNavy,
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: isOpCompleted
                              ? Colors.green.withValues(alpha: 0.15)
                              : (rawStatus == 'IN_PROGRESS' ? Colors.orange.withValues(alpha: 0.15) : (isDark ? Colors.white10 : Colors.grey.shade100)),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          statusLabel,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: isOpCompleted
                                ? Colors.green
                                : (rawStatus == 'IN_PROGRESS' ? Colors.orange.shade800 : (isDark ? Colors.grey.shade400 : Colors.grey.shade700)),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'purpose'.tr(lang),
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    description,
                    style: TextStyle(
                      fontSize: 14,
                      height: 1.4,
                      color: isDark ? Colors.grey.shade200 : AppTheme.textDarkNavy,
                    ),
                  ),
                  const SizedBox(height: 18),

                  // Progress Row & Bar
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'progress'.tr(lang),
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600),
                      ),
                      Text(
                        '$_completedCount of $_totalCount ${'tasks_completed'.tr(lang)} ($_progressPercent%)',
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: AppTheme.primaryGreen),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: LinearProgressIndicator(
                      value: _totalCount > 0 ? (_completedCount / _totalCount) : 0.0,
                      minHeight: 8,
                      backgroundColor: isDark ? Colors.white10 : Colors.grey.shade200,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        isOpCompleted ? Colors.green : AppTheme.primaryGreen,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // 2. TASK CHECKLIST
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'task_checklist'.tr(lang),
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                    color: isDark ? Colors.white : AppTheme.textDarkNavy,
                  ),
                ),
                Text(
                  '$_completedCount/$_totalCount',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600),
                ),
              ],
            ),
            const SizedBox(height: 10),

            if (_tasks.isEmpty)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: isDark ? AppTheme.darkCard : Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
                ),
                child: Center(
                  child: Text(
                    'No individual tasks required for this operation.',
                    style: TextStyle(color: isDark ? Colors.grey.shade400 : Colors.grey.shade600),
                  ),
                ),
              )
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _tasks.length,
                separatorBuilder: (_, _) => const SizedBox(height: 8),
                itemBuilder: (context, index) {
                  final task = _tasks[index];
                  final taskTitle = task['title'] ?? task['name'] ?? 'Task ${index + 1}';
                  final isDone = _isTaskCompleted(task);
                  final taskId = task['id']?.toString() ?? task['_id']?.toString() ?? '';
                  final isUpdating = _completingTaskIds.contains(taskId);

                  return Container(
                    decoration: BoxDecoration(
                      color: isDark ? AppTheme.darkCard : Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: isDone ? Colors.green.withValues(alpha: 0.3) : (isDark ? Colors.white10 : Colors.grey.shade200),
                      ),
                    ),
                    child: ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
                      leading: isUpdating
                          ? const SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primaryGreen),
                            )
                          : Checkbox(
                              value: isDone,
                              activeColor: AppTheme.primaryGreen,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                              onChanged: isDone ? null : (_) => _handleTaskToggle(index, task, lang),
                            ),
                      title: Text(
                        taskTitle,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: isDone ? FontWeight.w600 : FontWeight.w700,
                          color: isDone
                              ? (isDark ? Colors.grey.shade500 : Colors.grey.shade400)
                              : (isDark ? Colors.white : AppTheme.textDarkNavy),
                          decoration: isDone ? TextDecoration.lineThrough : null,
                        ),
                      ),
                      trailing: isDone
                          ? const Icon(Icons.check_circle, color: Colors.green, size: 20)
                          : const Icon(Icons.radio_button_unchecked, color: Colors.grey, size: 20),
                      onTap: isDone ? null : () => _handleTaskToggle(index, task, lang),
                    ),
                  );
                },
              ),
            const SizedBox(height: 20),

            // 3. LABOUR & ESTIMATED COST
            Text(
              'labour_info_title'.tr(lang),
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w900,
                color: isDark ? Colors.white : AppTheme.textDarkNavy,
              ),
            ),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? AppTheme.darkCard : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Labour Requirement', style: TextStyle(fontSize: 11.5, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600)),
                        const SizedBox(height: 2),
                        Text(labourText, style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: isDark ? Colors.white : AppTheme.textDarkNavy)),
                      ],
                    ),
                  ),
                  Container(width: 1, height: 36, color: isDark ? Colors.white10 : Colors.grey.shade200),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Estimated Labour Cost', style: TextStyle(fontSize: 11.5, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600)),
                        const SizedBox(height: 2),
                        Text(costText, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.primaryGreen)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // 4. WHY THIS MATTERS & PRECAUTIONS
            Text(
              'why_this_matters'.tr(lang),
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w900,
                color: isDark ? Colors.white : AppTheme.textDarkNavy,
              ),
            ),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? AppTheme.darkCard : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.lightbulb_outline_rounded, color: Colors.amber, size: 22),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Timely execution of this operation ensures strong root development, reduces pest vulnerabilities, and optimizes nutrient uptake for maximum harvest potential.',
                      style: TextStyle(
                        fontSize: 13,
                        height: 1.4,
                        color: isDark ? Colors.grey.shade300 : Colors.grey.shade800,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 30),

            // 5. PRIMARY ACTION BUTTON
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton.icon(
                onPressed: (isOpCompleted || _isMarkingComplete)
                    ? null
                    : () => _markOperationComplete(lang),
                icon: isOpCompleted ? const Icon(Icons.check_circle_outline) : const Icon(Icons.task_alt_rounded),
                label: _isMarkingComplete
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    : Text(
                        isOpCompleted ? 'operation_completed'.tr(lang) : 'complete_operation'.tr(lang),
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900),
                      ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: isOpCompleted ? Colors.grey.shade600 : AppTheme.primaryGreen,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  elevation: 0,
                ),
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}
