import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../shared/theme/app_theme.dart';
import '../providers/farm_provider.dart';

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

  @override
  void initState() {
    super.initState();
    _opData = Map<String, dynamic>.from(widget.operation);
    _tasks = List<dynamic>.from(_opData['tasks'] ?? []);
    
    // If tasks are empty, provide standard agronomic checklist based on operation title
    if (_tasks.isEmpty) {
      final title = (_opData['name'] ?? _opData['title'] ?? _opData['operationTitle'] ?? 'Operation').toString().toLowerCase();
      if (title.contains('irrigat')) {
        _tasks = [
          {'id': 't1', 'title': 'Check soil moisture level', 'isCompleted': false},
          {'id': 't2', 'title': 'Inspect irrigation pump and lines', 'isCompleted': false},
          {'id': 't3', 'title': 'Irrigate root zone evenly', 'isCompleted': false},
          {'id': 't4', 'title': 'Record irrigation duration', 'isCompleted': false},
        ];
      } else if (title.contains('fertiliz')) {
        _tasks = [
          {'id': 't1', 'title': 'Calculate dosage per acre', 'isCompleted': false},
          {'id': 't2', 'title': 'Inspect soil moisture before application', 'isCompleted': false},
          {'id': 't3', 'title': 'Apply basal/foliar nutrients', 'isCompleted': false},
          {'id': 't4', 'title': 'Light irrigation post-application', 'isCompleted': false},
        ];
      } else if (title.contains('pest')) {
        _tasks = [
          {'id': 't1', 'title': 'Scout lower leaf surfaces', 'isCompleted': false},
          {'id': 't2', 'title': 'Identify pest threshold', 'isCompleted': false},
          {'id': 't3', 'title': 'Deploy organic/chemical spray', 'isCompleted': false},
          {'id': 't4', 'title': 'Log monitoring observations', 'isCompleted': false},
        ];
      } else {
        _tasks = [
          {'id': 't1', 'title': 'Prepare required machinery & tools', 'isCompleted': false},
          {'id': 't2', 'title': 'Execute field operation', 'isCompleted': false},
          {'id': 't3', 'title': 'Inspect field quality post-operation', 'isCompleted': false},
          {'id': 't4', 'title': 'Log completion details in twin', 'isCompleted': false},
        ];
      }
    }
  }

  Future<void> _toggleTask(int index, String taskId, bool currentVal) async {
    setState(() {
      _tasks[index]['isCompleted'] = !currentVal;
      _tasks[index]['completed'] = !currentVal;
      _tasks[index]['status'] = (!currentVal) ? 'COMPLETED' : 'PENDING';
    });

    final opId = _opData['id'] ?? _opData['_id'] ?? 'op_1';
    try {
      await ApiClient().dio.post(
        'farms/${widget.farmId}/crops/${widget.cropId}/operations/$opId/tasks/$taskId/complete',
      );
    } catch (_) {
      // Optimistic update retained
    }
  }

  Future<void> _showAddTaskDialog() async {
    final titleController = TextEditingController();
    final res = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Add Operation Task'),
        content: TextField(
          controller: titleController,
          decoration: const InputDecoration(
            hintText: 'Enter task description (e.g. Inspect soil moisture)',
            border: OutlineInputBorder(),
          ),
          autofocus: true,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              final text = titleController.text.trim();
              if (text.isNotEmpty) Navigator.pop(ctx, text);
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryGreen),
            child: const Text('Add Task', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (res != null && res.isNotEmpty) {
      final opId = _opData['id'] ?? _opData['_id'] ?? 'op_1';
      try {
        final apiRes = await ApiClient().dio.post(
          'farms/${widget.farmId}/crops/${widget.cropId}/operations/$opId/tasks',
          data: {'title': res, 'description': res},
        );
        final newTask = apiRes.data;
        if (mounted) {
          setState(() {
            _tasks.add(newTask);
          });
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Task added successfully!'), backgroundColor: AppTheme.primaryGreen),
          );
        }
      } catch (e) {
        if (mounted) {
          setState(() {
            _tasks.add({'id': 'custom_${DateTime.now().millisecondsSinceEpoch}', 'title': res, 'isCompleted': false});
          });
        }
      }
    }
  }

  Future<void> _showEditTaskDialog(int index, Map<String, dynamic> task) async {
    final titleController = TextEditingController(text: task['title'] ?? task['name'] ?? '');
    final descController = TextEditingController(text: task['description'] ?? '');
    final taskId = task['id']?.toString() ?? '';
    final opId = _opData['id'] ?? _opData['_id'] ?? 'op_1';

    final isDark = Theme.of(context).brightness == Brightness.dark;

    await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        title: const Text('Edit Task', style: TextStyle(fontWeight: FontWeight.bold)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Task Title', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              TextField(controller: titleController, decoration: const InputDecoration(border: OutlineInputBorder())),
              const SizedBox(height: 12),
              const Text('Description', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              TextField(controller: descController, maxLines: 2, decoration: const InputDecoration(border: OutlineInputBorder())),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              final newTitle = titleController.text.trim();
              if (newTitle.isEmpty) return;
              Navigator.pop(ctx);
              setState(() {
                _tasks[index]['title'] = newTitle;
                _tasks[index]['description'] = descController.text.trim();
              });
              try {
                await ApiClient().dio.put(
                  'farms/${widget.farmId}/crops/${widget.cropId}/operations/$opId/tasks/$taskId',
                  data: {'title': newTitle, 'description': descController.text.trim()},
                );
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Task updated successfully!'), backgroundColor: AppTheme.primaryGreen),
                  );
                }
              } catch (_) {}
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryGreen, foregroundColor: Colors.white),
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  Future<void> _showEditOperationDialog() async {
    final titleController = TextEditingController(text: _opData['name'] ?? _opData['title'] ?? _opData['operationTitle'] ?? '');
    final descController = TextEditingController(text: _opData['description'] ?? '');
    final opId = _opData['id'] ?? _opData['_id'] ?? 'op_1';

    final isDark = Theme.of(context).brightness == Brightness.dark;

    await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        title: const Text('Edit Operation', style: TextStyle(fontWeight: FontWeight.bold)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Operation Name', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              TextField(controller: titleController, decoration: const InputDecoration(border: OutlineInputBorder())),
              const SizedBox(height: 12),
              const Text('Description', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              TextField(controller: descController, maxLines: 3, decoration: const InputDecoration(border: OutlineInputBorder())),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              final newName = titleController.text.trim();
              if (newName.isEmpty) return;
              Navigator.pop(ctx);
              setState(() {
                _opData['name'] = newName;
                _opData['title'] = newName;
                _opData['description'] = descController.text.trim();
              });
              try {
                await ApiClient().dio.put(
                  'farms/${widget.farmId}/crops/${widget.cropId}/operations/$opId',
                  data: {'name': newName, 'description': descController.text.trim()},
                );
                await ref.read(farmProvider.notifier).fetchFarms();
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Operation updated successfully!'), backgroundColor: AppTheme.primaryGreen),
                  );
                }
              } catch (_) {}
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryGreen, foregroundColor: Colors.white),
            child: const Text('Save Changes'),
          ),
        ],
      ),
    );
  }

  Future<void> _markOperationComplete() async {
    setState(() => _isMarkingComplete = true);
    final opId = _opData['id'] ?? _opData['_id'] ?? 'op_1';

    try {
      await ApiClient().dio.post(
        'farms/${widget.farmId}/crops/${widget.cropId}/operations/$opId/complete',
        data: {'feedback': 'COMPLETED', 'notes': 'Completed from Mobile App'},
      );

      await ref.read(farmProvider.notifier).fetchFarms();

      if (mounted) {
        setState(() {
          _opData['status'] = 'COMPLETED';
          for (var t in _tasks) {
            t['isCompleted'] = true;
            t['completed'] = true;
            t['status'] = 'COMPLETED';
          }
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Operation marked as completed!'),
            backgroundColor: AppTheme.primaryGreen,
          ),
        );
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _opData['status'] = 'COMPLETED';
          for (var t in _tasks) {
            t['isCompleted'] = true;
            t['completed'] = true;
          }
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Operation updated!'), backgroundColor: AppTheme.primaryGreen),
        );
      }
    } finally {
      if (mounted) setState(() => _isMarkingComplete = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final title = _opData['name'] ?? _opData['title'] ?? _opData['operationTitle'] ?? 'Irrigation';
    final dueDate = _opData['dueDate'] ?? _opData['scheduledDate'] ?? 'Due Soon';
    final description = _opData['description'] ?? 'Provide optimal irrigation and agronomic care for healthy crop growth.';
    final status = (_opData['status'] ?? 'PENDING').toString().toUpperCase();
    final isCompleted = status == 'COMPLETED';

    final completedTasksCount = _tasks.where((t) => t['isCompleted'] == true || t['completed'] == true || (t['status'] ?? '').toString().toUpperCase() == 'COMPLETED').length;
    final totalTasksCount = _tasks.length;
    final progressPercent = totalTasksCount > 0 ? (completedTasksCount / totalTasksCount * 100).toInt() : 0;

    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Operation Detail', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 19)),
        backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        foregroundColor: isDark ? Colors.white : AppTheme.textDarkNavy,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            tooltip: 'Edit Operation',
            onPressed: _showEditOperationDialog,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Hero Photo / Icon Banner
            Container(
              height: 140,
              width: double.infinity,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: isCompleted
                      ? [const Color(0xFF047857), const Color(0xFF065F46)]
                      : [const Color(0xFF0284C7), const Color(0xFF0369A1)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.1),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Stack(
                children: [
                  Positioned(
                    right: 20,
                    bottom: 10,
                    child: Icon(
                      Icons.agriculture_rounded,
                      size: 90,
                      color: Colors.white.withValues(alpha: 0.15),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(20.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.25),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            isCompleted ? 'COMPLETED' : 'IN PROGRESS',
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          title,
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Due: $dueDate',
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.white.withValues(alpha: 0.9),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Description Card
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
                      Text(
                        'Description',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: isDark ? Colors.grey.shade300 : AppTheme.textDarkNavy,
                        ),
                      ),
                      InkWell(
                        onTap: _showEditOperationDialog,
                        child: const Row(
                          children: [
                            Icon(Icons.edit, size: 14, color: AppTheme.primaryGreen),
                            SizedBox(width: 4),
                            Text('Edit', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.primaryGreen)),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    description,
                    style: TextStyle(
                      fontSize: 13,
                      height: 1.4,
                      color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Tasks Checklist Section
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Tasks Checklist',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                    color: isDark ? Colors.white : AppTheme.textDarkNavy,
                  ),
                ),
                Row(
                  children: [
                    OutlinedButton.icon(
                      onPressed: _showAddTaskDialog,
                      icon: const Icon(Icons.add, size: 16),
                      label: const Text('Add Task', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppTheme.primaryGreen,
                        side: const BorderSide(color: AppTheme.primaryGreen),
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryGreen.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        '$progressPercent% ($completedTasksCount/$totalTasksCount)',
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.primaryGreen),
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Progress Bar
            ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: LinearProgressIndicator(
                value: totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) : 0,
                minHeight: 8,
                backgroundColor: isDark ? Colors.white10 : Colors.grey.shade200,
                valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primaryGreen),
              ),
            ),
            const SizedBox(height: 16),

            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _tasks.length,
              separatorBuilder: (_, _) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final task = Map<String, dynamic>.from(_tasks[index] as Map);
                final taskTitle = task['title'] ?? task['name'] ?? 'Task ${index + 1}';
                final isTaskDone = task['isCompleted'] == true || task['completed'] == true || (task['status'] ?? '').toString().toUpperCase() == 'COMPLETED';
                final taskId = (task['id'] ?? 't_${index + 1}').toString();

                return Container(
                  decoration: BoxDecoration(
                    color: isDark ? AppTheme.darkCard : Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isTaskDone
                          ? AppTheme.primaryGreen.withValues(alpha: 0.4)
                          : (isDark ? Colors.white10 : Colors.grey.shade200),
                    ),
                  ),
                  child: Row(
                    children: [
                      IconButton(
                        icon: Icon(
                          isTaskDone ? Icons.check_box_rounded : Icons.check_box_outline_blank_rounded,
                          color: isTaskDone ? AppTheme.primaryGreen : (isDark ? Colors.grey.shade500 : Colors.grey.shade400),
                          size: 24,
                        ),
                        onPressed: () => _toggleTask(index, taskId, isTaskDone),
                        tooltip: isTaskDone ? 'Completed' : 'Mark Complete',
                      ),
                      Expanded(
                        child: InkWell(
                          onTap: () => _showEditTaskDialog(index, task),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 14.0),
                            child: Text(
                              taskTitle,
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: isTaskDone ? FontWeight.bold : FontWeight.w600,
                                color: isTaskDone
                                    ? (isDark ? Colors.grey.shade400 : Colors.grey.shade600)
                                    : (isDark ? Colors.white : AppTheme.textDarkNavy),
                                decoration: isTaskDone ? TextDecoration.lineThrough : null,
                              ),
                            ),
                          ),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.edit_outlined, size: 18),
                        color: Colors.grey,
                        onPressed: () => _showEditTaskDialog(index, task),
                        tooltip: 'Edit Task',
                      ),
                    ],
                  ),
                );
              },
            ),
            const SizedBox(height: 32),

            // Action Buttons: Edit Operation & Mark Complete
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _showEditOperationDialog,
                    icon: const Icon(Icons.edit_outlined),
                    label: const Text('Edit Operation', style: TextStyle(fontWeight: FontWeight.bold)),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppTheme.primaryGreen,
                      side: const BorderSide(color: AppTheme.primaryGreen, width: 1.5),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                  ),
                ),
                if (!isCompleted) ...[
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton.icon(
                      onPressed: _isMarkingComplete ? null : _markOperationComplete,
                      icon: _isMarkingComplete
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                            )
                          : const Icon(Icons.check_circle_outline),
                      label: const Text(
                        'Mark Complete',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryGreen,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        elevation: 2,
                      ),
                    ),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}
