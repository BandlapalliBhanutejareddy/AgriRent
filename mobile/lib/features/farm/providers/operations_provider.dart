import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../models/farm_model.dart';
import 'schedule_provider.dart';
import 'expenses_provider.dart';

class FarmTaskWithOp {
  final FarmTaskModel task;
  final FarmOperationModel operation;

  const FarmTaskWithOp({
    required this.task,
    required this.operation,
  });

  String get id => task.id;
  String get operationId => operation.id;
  String get title => task.title;
  String? get description => task.description;
  String get status => task.status;
  String get priority => task.priority;
  DateTime? get dueDate => task.dueDate;
  DateTime? get completedAt => task.completedAt;
  String get operationName => operation.name;
  bool get isCompleted => task.status == 'COMPLETED';
}

class OperationsState {
  final List<FarmOperationModel> operations;
  final bool isLoading;
  final String? error;
  final Set<String> completingTaskIds;

  OperationsState({
    this.operations = const [],
    this.isLoading = false,
    this.error,
    this.completingTaskIds = const {},
  });

  OperationsState copyWith({
    List<FarmOperationModel>? operations,
    bool? isLoading,
    String? error,
    Set<String>? completingTaskIds,
  }) {
    return OperationsState(
      operations: operations ?? this.operations,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      completingTaskIds: completingTaskIds ?? this.completingTaskIds,
    );
  }

  static bool isSameDay(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }

  static bool isToday(DateTime dt) {
    return isSameDay(dt, DateTime.now());
  }

  List<FarmTaskWithOp> get allTasks {
    final list = <FarmTaskWithOp>[];
    for (final op in operations) {
      for (final t in op.tasks) {
        list.add(FarmTaskWithOp(task: t, operation: op));
      }
    }
    return list;
  }

  /// Tasks strictly scheduled for today (dueDate != null && isToday).
  /// Undated tasks are NEVER classified as today per project rules.
  List<FarmTaskWithOp> get todayTasks {
    return allTasks.where((item) {
      if (item.isCompleted) return false;
      if (item.dueDate == null) return false;
      return isToday(item.dueDate!);
    }).toList();
  }

  /// Future scheduled tasks or undated pending tasks.
  List<FarmTaskWithOp> get upcomingTasks {
    return allTasks.where((item) {
      if (item.isCompleted) return false;
      if (item.dueDate == null) return true; // Undated tasks go here
      return !isToday(item.dueDate!); // Future or non-today pending
    }).toList();
  }

  /// Confirmed completed tasks
  List<FarmTaskWithOp> get completedTasks {
    return allTasks.where((item) => item.isCompleted).toList();
  }

  int get totalTasksCount => allTasks.length;
  int get completedTasksCount => completedTasks.length;
  int get progressPercent =>
      totalTasksCount > 0 ? ((completedTasksCount / totalTasksCount) * 100).round() : 0;
}

class OperationsNotifier extends StateNotifier<OperationsState> {
  final String farmId;
  final String cropId;
  final Ref? _ref;

  OperationsNotifier(this.farmId, this.cropId, [this._ref]) : super(OperationsState()) {
    fetchOperations();
  }

  Future<void> fetchOperations() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await ApiClient().dio.get('farms/$farmId/crops/$cropId/operations');
      if (response.statusCode == 200) {
        final rawData = response.data;
        final List<dynamic> dataList = rawData is List
            ? rawData
            : (rawData is Map && rawData['data'] is List
                ? rawData['data']
                : (rawData is Map && rawData['operations'] is List
                    ? rawData['operations']
                    : []));
        final ops = dataList.map((e) => FarmOperationModel.fromJson(e)).toList();
        state = state.copyWith(operations: ops, isLoading: false);
      } else {
        state = state.copyWith(error: 'Failed to load operations', isLoading: false);
      }
    } catch (e) {
      state = state.copyWith(error: 'Error: $e', isLoading: false);
    }
  }

  /// Marks a task completed via backend API.
  /// Prevents rapid duplicate submissions and does NOT alter crop lifecycle stage.
  Future<bool> completeTask(String operationId, String taskId) async {
    if (state.completingTaskIds.contains(taskId)) {
      return false; // Prevent rapid duplicate submission
    }

    // Mark as in-flight
    state = state.copyWith(
      completingTaskIds: {...state.completingTaskIds, taskId},
    );

    try {
      final response = await ApiClient().dio.post('farms/$farmId/crops/$cropId/operations/$operationId/tasks/$taskId/complete',
        data: {},
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        // Authoritative refresh of operations to fetch updated task status
        await fetchOperations();

        // Synchronize schedule and budget if ref available
        if (_ref != null) {
          try {
            _ref.read(scheduleProvider(ScheduleParams(farmId: farmId, lang: 'en')).notifier).fetchSchedule();
            _ref.read(expensesProvider.notifier).fetchExpenses(farmId);
          } catch (_) {}
        }
        return true;
      }
      return false;
    } catch (e) {
      return false;
    } finally {
      // Remove from in-flight
      final updated = Set<String>.from(state.completingTaskIds)..remove(taskId);
      state = state.copyWith(completingTaskIds: updated);
    }
  }
}

class OperationsParams {
  final String farmId;
  final String cropId;

  const OperationsParams({required this.farmId, required this.cropId});

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is OperationsParams &&
          runtimeType == other.runtimeType &&
          farmId == other.farmId &&
          cropId == other.cropId;

  @override
  int get hashCode => farmId.hashCode ^ cropId.hashCode;
}

final operationsProvider = StateNotifierProvider.family<OperationsNotifier, OperationsState, OperationsParams>((ref, params) {
  return OperationsNotifier(params.farmId, params.cropId, ref);
});
