import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../models/expense_model.dart';
import '../../auth/providers/auth_provider.dart';

class ExpensesState {
  final Map<String, FarmExpensesData> farmExpenses;
  final bool isLoading;
  final String? error;

  ExpensesState({
    this.farmExpenses = const {},
    this.isLoading = false,
    this.error,
  });

  ExpensesState copyWith({
    Map<String, FarmExpensesData>? farmExpenses,
    bool? isLoading,
    String? error,
  }) {
    return ExpensesState(
      farmExpenses: farmExpenses ?? this.farmExpenses,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class ExpensesNotifier extends StateNotifier<ExpensesState> {
  final Ref _ref;

  ExpensesNotifier(this._ref) : super(ExpensesState()) {
    _ref.listen<AuthState>(authProvider, (previous, next) {
      if (next.user == null) {
        state = ExpensesState();
      }
    });
  }

  Future<void> fetchExpenses(String farmId) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await ApiClient().dio.get('farms/$farmId/financials/expenses');
      if (response.statusCode == 200) {
        final dynamic raw = response.data;
        final dynamic dataMap = (raw is Map<String, dynamic> && raw['data'] != null)
            ? raw['data']
            : raw;

        if (dataMap is Map<String, dynamic>) {
          final data = FarmExpensesData.fromJson(dataMap);
          final updated = Map<String, FarmExpensesData>.from(state.farmExpenses);
          updated[farmId] = data;
          state = state.copyWith(farmExpenses: updated, isLoading: false);
          return;
        }
      }
      state = state.copyWith(isLoading: false, error: 'Failed to load expenses');
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Error loading expenses: $e');
    }
  }

  Future<bool> addExpense({
    required String farmId,
    required String title,
    required double amount,
    String? category,
  }) async {
    try {
      final response = await ApiClient().dio.post(
        'farms/$farmId/financials/expense',
        data: {
          'title': title,
          'amount': amount,
          'category': category ?? 'General Expense',
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        await fetchExpenses(farmId);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }
}

final expensesProvider =
    StateNotifierProvider<ExpensesNotifier, ExpensesState>((ref) {
  return ExpensesNotifier(ref);
});
