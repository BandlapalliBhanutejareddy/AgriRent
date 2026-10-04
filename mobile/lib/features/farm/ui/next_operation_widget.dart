import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/localization/app_localizations.dart';
import '../providers/schedule_provider.dart';
import '../providers/operations_provider.dart';

class NextOperationWidget extends ConsumerWidget {
  final String farmId;
  final String cropId;

  const NextOperationWidget({
    super.key,
    required this.farmId,
    required this.cropId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(languageProvider);
    final scheduleParams = {'farmId': farmId, 'lang': lang};
    final scheduleState = ref.watch(scheduleProvider(scheduleParams));

    final opsParams = {'farmId': farmId, 'cropId': cropId};
    final operationsState = ref.watch(operationsProvider(opsParams));

    if (scheduleState.isLoading || operationsState.isLoading) {
      return const Padding(
        padding: EdgeInsets.all(20.0),
        child: Center(child: CircularProgressIndicator()),
      );
    }

    if (scheduleState.error != null) {
      return const SizedBox.shrink(); // Hide if error
    }

    final timelineOperations = scheduleState.schedule?.operations ?? [];
    if (timelineOperations.isEmpty) return const SizedBox.shrink();

    // Logic similar to Web:
    final currentScheduledOp = timelineOperations.firstWhere(
      (o) => o.status != 'COMPLETED',
      orElse: () => timelineOperations.first,
    );

    final nextScheduledOp = timelineOperations.firstWhere(
      (o) => o.operationId != currentScheduledOp.operationId && o.status != 'COMPLETED',
      orElse: () => currentScheduledOp,
    );

    if (nextScheduledOp == currentScheduledOp) {
      return const SizedBox.shrink(); // No next operation
    }

    final opNameTrans = 'operations.${nextScheduledOp.name.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '_').toUpperCase()}'.tr(lang);
    final opName = opNameTrans != 'operations.${nextScheduledOp.name.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '_').toUpperCase()}' ? opNameTrans : nextScheduledOp.name;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFF6366F1).withValues(alpha: 0.2)),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 20, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 4,
                height: 16,
                decoration: BoxDecoration(color: const Color(0xFF6366F1), borderRadius: BorderRadius.circular(2)),
              ),
              const SizedBox(width: 8),
              Text(
                'NEXT OPERATION',
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF6366F1), letterSpacing: 1),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(opName, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF0F172A))),
          const SizedBox(height: 8),
          Text(nextScheduledOp.reason.isNotEmpty ? nextScheduledOp.reason : 'Upcoming operation.', style: const TextStyle(fontSize: 14, color: Color(0xFF64748B), height: 1.5)),
          const SizedBox(height: 16),
          Row(
            children: [
              const Icon(Icons.calendar_today, size: 14, color: Color(0xFF64748B)),
              const SizedBox(width: 6),
              Text(
                'Planned: ${nextScheduledOp.plannedStartDate}',
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF64748B)),
              ),
            ],
          ),
          if (nextScheduledOp.equipment != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(12)),
              child: Row(
                children: [
                  const Icon(Icons.precision_manufacturing, size: 16, color: Color(0xFF475569)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      nextScheduledOp.equipment!.name,
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF334155)),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
