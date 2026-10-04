import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../models/farm_model.dart';

class OperationsState {
  final List<FarmOperationModel> operations;
  final bool isLoading;
  final String? error;

  OperationsState({
    this.operations = const [],
    this.isLoading = false,
    this.error,
  });

  OperationsState copyWith({
    List<FarmOperationModel>? operations,
    bool? isLoading,
    String? error,
  }) {
    return OperationsState(
      operations: operations ?? this.operations,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class OperationsNotifier extends StateNotifier<OperationsState> {
  final String farmId;
  final String cropId;

  OperationsNotifier(this.farmId, this.cropId) : super(OperationsState()) {
    fetchOperations();
  }

  Future<void> fetchOperations() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await ApiClient().dio.get('/farms/$farmId/crops/$cropId/operations');
      if (response.statusCode == 200) {
        final rawData = response.data;
        final List<dynamic> dataList = rawData is List ? rawData : rawData['data'] ?? rawData['operations'] ?? [];
        final ops = dataList.map((e) => FarmOperationModel.fromJson(e)).toList();
        state = state.copyWith(operations: ops, isLoading: false);
      } else {
        state = state.copyWith(error: 'Failed to load operations', isLoading: false);
      }
    } catch (e) {
      state = state.copyWith(error: 'Error: $e', isLoading: false);
    }
  }

  Future<bool> completeTask(String operationId, String taskId) async {
    try {
      final response = await ApiClient().dio.post('/farms/$farmId/crops/$cropId/operations/$operationId/tasks/$taskId/complete');
      if (response.statusCode == 200) {
        // Refresh operations to get updated statuses
        await fetchOperations();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }
}

final operationsProvider = StateNotifierProvider.family<OperationsNotifier, OperationsState, Map<String, String>>((ref, params) {
  final farmId = params['farmId']!;
  final cropId = params['cropId']!;
  return OperationsNotifier(farmId, cropId);
});
