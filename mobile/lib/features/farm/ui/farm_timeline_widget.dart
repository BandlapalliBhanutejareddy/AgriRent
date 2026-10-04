import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/localization/app_localizations.dart';
import '../providers/schedule_provider.dart';
import '../providers/operations_provider.dart';

class FarmTimelineWidget extends ConsumerWidget {
  final String farmId;
  final String cropId;

  const FarmTimelineWidget({
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
      return const SizedBox.shrink();
    }

    if (scheduleState.error != null) {
      return const SizedBox.shrink();
    }

    final timelineOperations = scheduleState.schedule?.operations ?? [];
    if (timelineOperations.isEmpty) return const SizedBox.shrink();

    final currentScheduledOp = timelineOperations.firstWhere(
      (o) => o.status != 'COMPLETED',
      orElse: () => timelineOperations.first,
    );

    final nextScheduledOp = timelineOperations.firstWhere(
      (o) => o.operationId != currentScheduledOp.operationId && o.status != 'COMPLETED',
      orElse: () => currentScheduledOp,
    );

    final actualCurrentOp = operationsState.operations.where((o) => o.status != 'COMPLETED').firstOrNull;
    final completedOps = operationsState.operations.where((o) => o.status == 'COMPLETED').toList();

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFF1F5F9)),
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
                decoration: BoxDecoration(color: const Color(0xFF94A3B8), borderRadius: BorderRadius.circular(2)),
              ),
              const SizedBox(width: 8),
              Text(
                'FARM TIMELINE',
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF64748B), letterSpacing: 1),
              ),
            ],
          ),
          const SizedBox(height: 24),
          
          // Completed
          ...completedOps.map((op) {
            return _buildTimelineItem(
              title: _getOpName(op.name, lang),
              subtitle: 'Completed',
              icon: Icons.check_circle,
              color: const Color(0xFF10B981),
              isLast: false,
              isCrossed: true,
            );
          }),
          
          // Current
          if (actualCurrentOp != null || currentScheduledOp.status != 'COMPLETED')
            _buildTimelineItem(
              title: _getOpName(actualCurrentOp?.name ?? currentScheduledOp.name, lang),
              subtitle: 'YOU ARE HERE',
              icon: Icons.play_circle_filled,
              color: const Color(0xFF10B981),
              isLast: nextScheduledOp == currentScheduledOp,
              isActive: true,
            ),
          
          // Next
          if (nextScheduledOp != currentScheduledOp)
            _buildTimelineItem(
              title: _getOpName(nextScheduledOp.name, lang),
              subtitle: 'Next Scheduled',
              icon: Icons.access_time_filled,
              color: const Color(0xFF94A3B8),
              isLast: true,
            ),
        ],
      ),
    );
  }

  String _getOpName(String name, String lang) {
    final key = name.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '_').toUpperCase();
    final trans = 'operations.$key'.tr(lang);
    return trans != 'operations.$key' ? trans : name;
  }

  Widget _buildTimelineItem({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required bool isLast,
    bool isCrossed = false,
    bool isActive = false,
  }) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Column(
            children: [
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: isActive ? color.withValues(alpha: 0.1) : Colors.transparent,
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, size: 20, color: color),
              ),
              if (!isLast) Expanded(child: Container(width: 2, color: const Color(0xFFE2E8F0), margin: const EdgeInsets.symmetric(vertical: 4))),
            ],
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 24.0, top: 2),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      color: isCrossed ? const Color(0xFF94A3B8) : const Color(0xFF0F172A),
                      decoration: isCrossed ? TextDecoration.lineThrough : null,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: isActive ? color.withValues(alpha: 0.1) : Colors.transparent,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      subtitle.toUpperCase(),
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        color: isActive ? color : const Color(0xFF94A3B8),
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
