import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/operations_provider.dart';
import 'package:intl/intl.dart';

class FarmOperationsList extends ConsumerWidget {
  final String farmId;
  final String cropId;

  const FarmOperationsList({
    super.key,
    required this.farmId,
    required this.cropId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final providerParams = {'farmId': farmId, 'cropId': cropId};
    final operationsState = ref.watch(operationsProvider(providerParams));

    if (operationsState.isLoading) {
      return const Padding(
        padding: EdgeInsets.all(20.0),
        child: Center(child: CircularProgressIndicator()),
      );
    }

    if (operationsState.error != null) {
      return Padding(
        padding: const EdgeInsets.all(20.0),
        child: Text(operationsState.error!, style: const TextStyle(color: Colors.red)),
      );
    }

    if (operationsState.operations.isEmpty) {
      return Padding(
        padding: const EdgeInsets.all(20.0),
        child: Center(
          child: Text('No ongoing operations found.', style: TextStyle(color: Colors.grey.shade600)),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12),
          child: Text(
            'Ongoing Tasks & Operations',
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFF0F172A)),
          ),
        ),
        ...operationsState.operations.map((op) {
          return Container(
            margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border.all(color: Colors.grey.shade200),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Theme(
              data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
              child: ExpansionTile(
                initiallyExpanded: op.status != 'COMPLETED',
                title: Text(op.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                subtitle: Text(
                  op.status == 'COMPLETED' ? 'Completed' : '${op.tasks.where((t) => t.status == 'COMPLETED').length}/${op.tasks.length} Tasks Done',
                  style: TextStyle(
                    color: op.status == 'COMPLETED' ? Colors.green : Colors.grey.shade600,
                    fontSize: 13
                  )
                ),
                children: op.tasks.isEmpty
                    ? [const Padding(padding: EdgeInsets.all(16.0), child: Text('No sub-tasks planned for this operation.'))]
                    : op.tasks.map((task) {
                        final isCompleted = task.status == 'COMPLETED';
                        return CheckboxListTile(
                          value: isCompleted,
                          activeColor: AppTheme.primaryGreen,
                          onChanged: isCompleted ? null : (val) async {
                            if (val == true) {
                              final scaffold = ScaffoldMessenger.of(context);
                              final success = await ref.read(operationsProvider(providerParams).notifier).completeTask(op.id, task.id);
                              if (success) {
                                scaffold.showSnackBar(
                                  const SnackBar(content: Text('Task marked as completed!'), backgroundColor: Colors.green),
                                );
                              } else {
                                scaffold.showSnackBar(
                                  const SnackBar(content: Text('Failed to complete task'), backgroundColor: Colors.red),
                                );
                              }
                            }
                          },
                          title: Text(
                            task.title,
                            style: TextStyle(
                              decoration: isCompleted ? TextDecoration.lineThrough : null,
                              color: isCompleted ? Colors.grey : Colors.black87,
                            ),
                          ),
                          subtitle: task.dueDate != null 
                            ? Text('Due: ${DateFormat.yMMMd().format(task.dueDate!)}', style: const TextStyle(fontSize: 12)) 
                            : null,
                          controlAffinity: ListTileControlAffinity.leading,
                        );
                      }).toList(),
              ),
            ),
          );
        }),
      ],
    );
  }
}
