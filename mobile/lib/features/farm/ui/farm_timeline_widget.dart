import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../shared/theme/app_theme.dart';
import '../models/farm_model.dart';
import '../models/schedule_model.dart';
import '../providers/operations_provider.dart';
import '../providers/schedule_provider.dart';

class _TimelineEntry {
  final String id;
  final String name;
  final String stage;
  final String status;
  final DateTime? date;
  final String dateDisplay;
  final int completedTasks;
  final int totalTasks;
  final String? equipmentName;
  final bool isCompleted;
  final bool isInProgress;
  final bool isOverdue;
  final FarmOperationModel? rawOp;

  _TimelineEntry({
    required this.id,
    required this.name,
    required this.stage,
    required this.status,
    required this.date,
    required this.dateDisplay,
    required this.completedTasks,
    required this.totalTasks,
    this.equipmentName,
    required this.isCompleted,
    required this.isInProgress,
    required this.isOverdue,
    this.rawOp,
  });
}

class FarmTimelineWidget extends ConsumerWidget {
  final String farmId;
  final String cropId;
  final bool showHeader;
  final EdgeInsetsGeometry? margin;

  const FarmTimelineWidget({
    super.key,
    required this.farmId,
    required this.cropId,
    this.showHeader = true,
    this.margin,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(languageProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final effectiveMargin = margin ?? const EdgeInsets.symmetric(horizontal: 16, vertical: 8);

    final scheduleState = ref.watch(scheduleProvider(ScheduleParams(farmId: farmId, lang: lang)));
    final opsState = cropId.isNotEmpty
        ? ref.watch(operationsProvider(OperationsParams(farmId: farmId, cropId: cropId)))
        : null;

    final hasData = scheduleState.schedule != null || (opsState?.operations.isNotEmpty ?? false);

    // Loading State - only show loading box if we have NO cached operations or schedule yet
    if (!hasData && (scheduleState.isLoading || (opsState?.isLoading ?? false))) {
      return Container(
        margin: effectiveMargin,
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.darkCard : Colors.white,
          borderRadius: BorderRadius.circular(AppTheme.cardRadius),
          border: Border.all(color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06)),
        ),
        child: const Center(
          child: SizedBox(
            width: 24,
            height: 24,
            child: CircularProgressIndicator(strokeWidth: 2.5, color: AppTheme.primaryGreen),
          ),
        ),
      );
    }

    // Error State
    if (scheduleState.error != null && (opsState?.operations.isEmpty ?? true)) {
      return Container(
        margin: effectiveMargin,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.darkCard : Colors.white,
          borderRadius: BorderRadius.circular(AppTheme.cardRadius),
          border: Border.all(color: Colors.red.withValues(alpha: 0.3)),
        ),
        child: Row(
          children: [
            const Icon(Icons.error_outline, color: Colors.red, size: 20),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                scheduleState.error!.replaceFirst('Exception: ', '').replaceFirst('Error: ', ''),
                style: TextStyle(fontSize: 12, color: isDark ? Colors.red.shade300 : Colors.red.shade700),
              ),
            ),
            TextButton(
              onPressed: () {
                ref.read(scheduleProvider(ScheduleParams(farmId: farmId, lang: lang)).notifier).fetchSchedule();
                if (cropId.isNotEmpty) {
                  ref.read(operationsProvider(OperationsParams(farmId: farmId, cropId: cropId)).notifier).fetchOperations();
                }
              },
              child: Text('try_again'.tr(lang), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      );
    }

    // Build timeline entries by merging operations and master schedule
    final entries = _buildTimelineEntries(
      opsState?.operations ?? [],
      scheduleState.schedule?.operations ?? [],
      lang,
    );

    // Empty State
    if (entries.isEmpty) {
      return Container(
        margin: effectiveMargin,
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.darkCard : Colors.white,
          borderRadius: BorderRadius.circular(AppTheme.cardRadius),
          border: Border.all(color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06)),
        ),
        child: Column(
          children: [
            Icon(Icons.timeline_rounded, size: 40, color: isDark ? Colors.white24 : Colors.grey.shade400),
            const SizedBox(height: 10),
            Text(
              'timeline_empty_message'.tr(lang),
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: isDark ? Colors.white70 : AppTheme.textMutedGray,
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      margin: effectiveMargin,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(AppTheme.cardRadius),
        border: Border.all(color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (showHeader) ...[
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryGreen.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.timeline_rounded, size: 16, color: AppTheme.primaryGreen),
                ),
                const SizedBox(width: 8),
                Text(
                  'farm_timeline'.tr(lang),
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: isDark ? Colors.white : AppTheme.textDarkNavy,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),
          ],

          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: entries.length,
            itemBuilder: (context, index) {
              final item = entries[index];
              final isLast = index == entries.length - 1;
              return _buildTimelineRow(context, item, isLast, isDark, lang);
            },
          ),
        ],
      ),
    );
  }

  List<_TimelineEntry> _buildTimelineEntries(
    List<FarmOperationModel> farmOps,
    List<ScheduledOperationModel> scheduledOps,
    String lang,
  ) {
    final Map<String, _TimelineEntry> map = {};

    // 1. Process farmOps (authoritative DB records)
    for (final op in farmOps) {
      final date = op.completedAt ?? op.plannedStartDate;
      final dateStr = date != null
          ? DateFormat('MMM d, yyyy').format(date)
          : 'no_date_scheduled'.tr(lang);

      final isCompleted = op.isCompleted;
      final isInProgress = op.isInProgress;
      final isOverdue = op.isOverdue;

      String statusKey;
      if (isCompleted) {
        statusKey = 'timeline_completed'.tr(lang);
      } else if (isInProgress) {
        statusKey = 'in_progress'.tr(lang);
      } else if (isOverdue) {
        statusKey = 'overdue'.tr(lang);
      } else {
        statusKey = 'timeline_scheduled'.tr(lang);
      }

      map[op.id] = _TimelineEntry(
        id: op.id,
        name: op.name,
        stage: op.stage ?? '',
        status: statusKey,
        date: date,
        dateDisplay: dateStr,
        completedTasks: op.completedTasksCount,
        totalTasks: op.totalTasksCount,
        isCompleted: isCompleted,
        isInProgress: isInProgress,
        isOverdue: isOverdue,
        rawOp: op,
      );
    }

    // 2. Process scheduledOps (from master scheduler)
    for (final s in scheduledOps) {
      final key = s.operationId.isNotEmpty ? s.operationId : s.name;
      if (!map.containsKey(key)) {
        final date = s.parsedStartDate;
        final dateStr = date != null
            ? DateFormat('MMM d, yyyy').format(date)
            : (s.plannedStartDate.isNotEmpty ? s.plannedStartDate : 'no_date_scheduled'.tr(lang));

        final isCompleted = s.isCompleted;
        final isInProgress = s.isInProgress;
        final isOverdue = s.isOverdue;

        String statusKey;
        if (isCompleted) {
          statusKey = 'timeline_completed'.tr(lang);
        } else if (isInProgress) {
          statusKey = 'in_progress'.tr(lang);
        } else if (isOverdue) {
          statusKey = 'overdue'.tr(lang);
        } else {
          statusKey = 'timeline_scheduled'.tr(lang);
        }

        map[key] = _TimelineEntry(
          id: s.operationId,
          name: s.name,
          stage: s.stage,
          status: statusKey,
          date: date,
          dateDisplay: dateStr,
          completedTasks: 0,
          totalTasks: 0,
          equipmentName: s.equipment?.name,
          isCompleted: isCompleted,
          isInProgress: isInProgress,
          isOverdue: isOverdue,
        );
      }
    }

    final list = map.values.toList();

    // Chronological Sort:
    // Items with real dates are sorted in ascending order (earliest date first).
    // Undated items are placed safely at the end.
    list.sort((a, b) {
      if (a.date != null && b.date != null) {
        return a.date!.compareTo(b.date!);
      }
      if (a.date != null && b.date == null) return -1;
      if (a.date == null && b.date != null) return 1;
      return 0;
    });

    return list;
  }

  Widget _buildTimelineRow(
    BuildContext context,
    _TimelineEntry item,
    bool isLast,
    bool isDark,
    String lang,
  ) {
    Color nodeColor;
    IconData nodeIcon;

    if (item.isCompleted) {
      nodeColor = AppTheme.primaryGreen;
      nodeIcon = Icons.check_circle_rounded;
    } else if (item.isInProgress) {
      nodeColor = const Color(0xFFF59E0B);
      nodeIcon = Icons.play_circle_fill_rounded;
    } else if (item.isOverdue) {
      nodeColor = const Color(0xFFEF4444);
      nodeIcon = Icons.error_rounded;
    } else {
      nodeColor = isDark ? Colors.white38 : Colors.grey.shade400;
      nodeIcon = Icons.radio_button_checked_rounded;
    }

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Left Node & Vertical Connector Line
          Column(
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: nodeColor.withValues(alpha: item.isInProgress ? 0.2 : 0.12),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Icon(nodeIcon, size: 18, color: nodeColor),
                ),
              ),
              if (!isLast)
                Expanded(
                  child: Container(
                    width: 2,
                    margin: const EdgeInsets.symmetric(vertical: 4),
                    color: item.isCompleted
                        ? AppTheme.primaryGreen.withValues(alpha: 0.4)
                        : (isDark ? Colors.white12 : Colors.grey.shade200),
                  ),
                ),
            ],
          ),

          const SizedBox(width: 14),

          // Right Card Body
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: isLast ? 0 : 20.0),
              child: InkWell(
                borderRadius: BorderRadius.circular(12),
                onTap: () {
                  final raw = item.rawOp;
                  final opData = raw != null
                      ? {
                          'id': raw.id,
                          'name': raw.name,
                          'status': raw.status,
                          'description': raw.description,
                          'dueDate': item.dateDisplay,
                          'tasks': raw.tasks.map((t) => {
                            'id': t.id,
                            'title': t.title,
                            'status': t.status,
                            'priority': t.priority,
                            'dueDate': t.dueDate?.toIso8601String(),
                          }).toList(),
                        }
                      : {
                          'id': item.id,
                          'name': item.name,
                          'status': item.status,
                          'description': item.equipmentName != null ? 'Requires: ${item.equipmentName}' : '',
                          'dueDate': item.dateDisplay,
                          'stage': item.stage,
                          'tasks': <Map<String, dynamic>>[],
                        };
                  context.push('/operation-detail', extra: {
                    'operation': opData,
                    'farmId': farmId,
                    'cropId': cropId,
                  });
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white.withValues(alpha: 0.03) : const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: item.isInProgress
                          ? const Color(0xFFF59E0B).withValues(alpha: 0.4)
                          : (item.isOverdue
                              ? const Color(0xFFEF4444).withValues(alpha: 0.3)
                              : (isDark ? Colors.white10 : Colors.grey.shade200)),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              item.name,
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w800,
                                color: item.isCompleted
                                    ? (isDark ? Colors.white54 : Colors.grey.shade600)
                                    : (isDark ? Colors.white : AppTheme.textDarkNavy),
                                decoration: item.isCompleted ? TextDecoration.lineThrough : null,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: nodeColor.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              item.status.toUpperCase(),
                              style: TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.w800,
                                color: nodeColor,
                              ),
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 6),

                      Row(
                        children: [
                          Icon(
                            Icons.calendar_today_outlined,
                            size: 12,
                            color: item.isOverdue
                                ? const Color(0xFFDC2626)
                                : (isDark ? Colors.white54 : AppTheme.textMutedGray),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            item.dateDisplay,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                              color: item.isOverdue
                                  ? const Color(0xFFDC2626)
                                  : (isDark ? Colors.white60 : AppTheme.textMutedGray),
                            ),
                          ),
                          if (item.stage.isNotEmpty) ...[
                            Text(
                              ' • ',
                              style: TextStyle(fontSize: 11, color: isDark ? Colors.white38 : Colors.grey.shade400),
                            ),
                            Text(
                              item.stage.replaceAll('_', ' '),
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: isDark ? Colors.white60 : AppTheme.textMutedGray,
                              ),
                            ),
                          ],
                        ],
                      ),

                      if (item.totalTasks > 0) ...[
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(3),
                                child: LinearProgressIndicator(
                                  value: item.totalTasks > 0 ? (item.completedTasks / item.totalTasks) : 0,
                                  backgroundColor: isDark ? Colors.white12 : Colors.grey.shade200,
                                  valueColor: AlwaysStoppedAnimation<Color>(nodeColor),
                                  minHeight: 4,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              '${item.completedTasks}/${item.totalTasks}',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
