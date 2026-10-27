import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../shared/theme/app_theme.dart';
import '../models/farm_model.dart';
import '../models/schedule_model.dart';
import '../providers/farm_provider.dart';
import '../providers/operations_provider.dart';
import '../providers/schedule_provider.dart';

class NextOperationWidget extends ConsumerWidget {
  final String farmId;
  final String cropId;
  final VoidCallback? onOpen;
  final EdgeInsetsGeometry? margin;

  const NextOperationWidget({
    super.key,
    required this.farmId,
    required this.cropId,
    this.onOpen,
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

    final farmState = ref.watch(farmProvider);
    final activeFarm = farmState.selectedFarm;
    final activeCrop = activeFarm?.crops.where((c) => c.id == cropId).firstOrNull ??
        (activeFarm?.crops.isNotEmpty == true ? activeFarm!.crops.first : null);

    final hasData = scheduleState.schedule != null || (opsState?.operations.isNotEmpty ?? false);

    // Loading State - only show loading box if we have NO cached operations or schedule yet
    if (!hasData && (scheduleState.isLoading || (opsState?.isLoading ?? false))) {
      return Container(
        margin: effectiveMargin,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.darkCard : Colors.white,
          borderRadius: BorderRadius.circular(AppTheme.cardRadius),
          border: Border.all(color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06)),
        ),
        child: const Center(
          child: Padding(
            padding: EdgeInsets.symmetric(vertical: 16),
            child: SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(strokeWidth: 2.5, color: AppTheme.primaryGreen),
            ),
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

    // Selection Logic: Find immediate active (IN_PROGRESS) or earliest pending operation
    final operations = opsState?.operations ?? [];
    final scheduledOps = scheduleState.schedule?.operations ?? [];

    FarmOperationModel? targetFarmOp;
    ScheduledOperationModel? targetScheduledOp;

    // 1. Check for active IN_PROGRESS
    targetFarmOp = operations.where((o) => o.isInProgress).firstOrNull;
    if (targetFarmOp == null) {
      targetScheduledOp = scheduledOps.where((o) => o.isInProgress).firstOrNull;
    }

    // 2. Fallback to earliest non-completed operation
    if (targetFarmOp == null && targetScheduledOp == null) {
      targetFarmOp = operations.where((o) => !o.isCompleted).firstOrNull;
      if (targetFarmOp == null) {
        targetScheduledOp = scheduledOps.where((o) => !o.isCompleted).firstOrNull;
      }
    }

    // Correlate corresponding farm op if target was from schedule
    if (targetFarmOp == null && targetScheduledOp != null) {
      targetFarmOp = operations
          .where((o) => o.id == targetScheduledOp!.operationId || o.name == targetScheduledOp.name)
          .firstOrNull;
    }

    // Empty State: All completed or no operations
    if (targetFarmOp == null && targetScheduledOp == null) {
      final hasCompleted = operations.any((o) => o.isCompleted) || scheduledOps.any((o) => o.isCompleted);
      final emptyMessage = hasCompleted ? 'all_operations_completed'.tr(lang) : 'no_upcoming_operations'.tr(lang);

      return Container(
        margin: effectiveMargin,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.darkCard : Colors.white,
          borderRadius: BorderRadius.circular(AppTheme.cardRadius),
          border: Border.all(color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppTheme.primaryGreen.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.check_circle_outline, color: AppTheme.primaryGreen, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                emptyMessage,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                ),
              ),
            ),
          ],
        ),
      );
    }

    // Extract Display Fields from Authoritative Record
    final title = targetFarmOp?.name ?? targetScheduledOp?.name ?? 'Operation';
    final stage = targetScheduledOp?.stage.isNotEmpty == true
        ? targetScheduledOp!.stage
        : (targetFarmOp?.stage?.isNotEmpty == true
            ? targetFarmOp!.stage!
            : (activeCrop?.stage.isNotEmpty == true ? activeCrop!.stage : ''));

    final isOverdue = (targetFarmOp?.isOverdue ?? false) || (targetScheduledOp?.isOverdue ?? false);
    final isInProgress = (targetFarmOp?.isInProgress ?? false) || (targetScheduledOp?.isInProgress ?? false);

    // Format Date: strictly if present, never infer or fabricate
    String dateDisplay = 'no_date_scheduled'.tr(lang);
    if (targetFarmOp?.plannedStartDate != null) {
      dateDisplay = DateFormat('MMM d, yyyy').format(targetFarmOp!.plannedStartDate!);
    } else if (targetScheduledOp?.parsedStartDate != null) {
      dateDisplay = DateFormat('MMM d, yyyy').format(targetScheduledOp!.parsedStartDate!);
    } else if (targetScheduledOp?.plannedStartDate.isNotEmpty == true) {
      dateDisplay = targetScheduledOp!.plannedStartDate;
    }

    // Equipment (when returned from authoritative scheduler)
    final equipment = targetScheduledOp?.equipment;

    // Task count and progress
    final totalTasks = targetFarmOp?.totalTasksCount ?? 0;
    final completedTasks = targetFarmOp?.completedTasksCount ?? 0;
    final progressRatio = targetFarmOp?.progressRatio ?? 0.0;

    return Container(
      margin: effectiveMargin,
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(AppTheme.cardRadius),
        border: Border.all(
          color: isOverdue
              ? const Color(0xFFEF4444).withValues(alpha: 0.4)
              : (isInProgress
                  ? const Color(0xFFF59E0B).withValues(alpha: 0.5)
                  : (isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06))),
          width: (isOverdue || isInProgress) ? 1.5 : 1.0,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(AppTheme.cardRadius),
          onTap: () {
            if (onOpen != null) {
              onOpen!();
            } else if (targetFarmOp != null) {
              context.push('/operation-detail', extra: {
                'operation': {
                  'id': targetFarmOp.id,
                  'name': targetFarmOp.name,
                  'status': targetFarmOp.status,
                  'description': targetFarmOp.description,
                  'dueDate': dateDisplay,
                  'tasks': targetFarmOp.tasks.map((t) => {
                    'id': t.id,
                    'title': t.title,
                    'status': t.status,
                    'priority': t.priority,
                    'dueDate': t.dueDate?.toIso8601String(),
                  }).toList(),
                },
                'farmId': farmId,
                'cropId': cropId,
              });
            } else {
              context.push('/farm-plan');
            }
          },
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Header Row: Badge & Status Tag
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: isOverdue
                                ? const Color(0xFFEF4444).withValues(alpha: 0.15)
                                : (isInProgress
                                    ? const Color(0xFFF59E0B).withValues(alpha: 0.15)
                                    : AppTheme.primaryGreen.withValues(alpha: 0.12)),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(
                            isOverdue
                                ? Icons.warning_amber_rounded
                                : (isInProgress ? Icons.play_arrow_rounded : Icons.next_plan_outlined),
                            size: 16,
                            color: isOverdue
                                ? const Color(0xFFDC2626)
                                : (isInProgress ? const Color(0xFFD97706) : AppTheme.primaryGreen),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'next_operation'.tr(lang),
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 0.8,
                            color: isOverdue
                                ? const Color(0xFFDC2626)
                                : (isInProgress ? const Color(0xFFD97706) : AppTheme.primaryGreen),
                          ),
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: isOverdue
                            ? const Color(0xFFFEE2E2)
                            : (isInProgress ? const Color(0xFFFEF3C7) : const Color(0xFFE0F2FE)),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        isOverdue
                            ? 'overdue'.tr(lang).toUpperCase()
                            : (isInProgress ? 'in_progress'.tr(lang).toUpperCase() : 'planned'.tr(lang).toUpperCase()),
                        style: TextStyle(
                          fontSize: 9.5,
                          fontWeight: FontWeight.w800,
                          color: isOverdue
                              ? const Color(0xFFB91C1C)
                              : (isInProgress ? const Color(0xFFB45309) : const Color(0xFF0369A1)),
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 12),

                // Operation Name & Crop / Stage Info
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: isDark ? Colors.white : AppTheme.textDarkNavy,
                  ),
                ),

                const SizedBox(height: 4),

                Row(
                  children: [
                    if (activeCrop != null && activeCrop.cropName.isNotEmpty) ...[
                      Text(
                        activeCrop.cropName,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: isDark ? Colors.white70 : AppTheme.textMutedGray,
                        ),
                      ),
                      if (stage.isNotEmpty)
                        Text(
                          ' • ',
                          style: TextStyle(
                            fontSize: 12,
                            color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                          ),
                        ),
                    ],
                    if (stage.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: isDark ? Colors.white12 : Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          stage.replaceAll('_', ' '),
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                          ),
                        ),
                      ),
                  ],
                ),

                const SizedBox(height: 12),

                // Scheduled Date Row
                Row(
                  children: [
                    Icon(
                      Icons.calendar_today_outlined,
                      size: 14,
                      color: isOverdue ? const Color(0xFFDC2626) : (isDark ? Colors.white54 : AppTheme.textMutedGray),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      '${'scheduled_for'.tr(lang)}: $dateDisplay',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: isOverdue
                            ? const Color(0xFFDC2626)
                            : (isDark ? Colors.white70 : AppTheme.textDarkNavy),
                      ),
                    ),
                  ],
                ),

                // Equipment Info (when present)
                if (equipment != null && equipment.name.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: isDark ? Colors.white.withValues(alpha: 0.05) : const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.precision_manufacturing_outlined, size: 14, color: AppTheme.primaryGreen),
                        const SizedBox(width: 6),
                        Text(
                          '${'equipment_needed'.tr(lang)}: ${equipment.name}',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                // Task Progress Bar (when tasks exist)
                if (totalTasks > 0) ...[
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'tasks_progress'.tr(lang),
                        style: TextStyle(
                          fontSize: 11,
                          color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        '$completedTasks / $totalTasks',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: isDark ? Colors.white : AppTheme.textDarkNavy,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: progressRatio,
                      backgroundColor: isDark ? Colors.white12 : Colors.grey.shade200,
                      valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primaryGreen),
                      minHeight: 5,
                    ),
                  ),
                ],

                const SizedBox(height: 12),
                const Divider(height: 1),
                const SizedBox(height: 8),

                // Open Action Row
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Text(
                      'open_operation'.tr(lang),
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.primaryGreen,
                      ),
                    ),
                    const SizedBox(width: 4),
                    const Icon(Icons.arrow_forward_rounded, size: 14, color: AppTheme.primaryGreen),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
