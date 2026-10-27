import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../models/expense_model.dart';
import '../../auth/providers/auth_provider.dart';

class ExpensesState {
  final Map<String, FarmExpensesData> farmExpenses;
  final bool isLoading;
  final bool isSubmitting;
  final String? error;

  ExpensesState({
    this.farmExpenses = const {},
    this.isLoading = false,
    this.isSubmitting = false,
    this.error,
  });

  ExpensesState copyWith({
    Map<String, FarmExpensesData>? farmExpenses,
    bool? isLoading,
    bool? isSubmitting,
    String? error,
  }) {
    return ExpensesState(
      farmExpenses: farmExpenses ?? this.farmExpenses,
      isLoading: isLoading ?? this.isLoading,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      error: error,
    );
  }
}

class ExpensesNotifier extends StateNotifier<ExpensesState> {
  final Ref _ref;
  String? _currentUserId;

  ExpensesNotifier(this._ref) : super(ExpensesState()) {
    // Farm and account isolation: Reset state when logged out or when user changes
    _ref.listen<AuthState>(authProvider, (previous, next) {
      final nextUserId = next.user?.id;
      if (next.user == null || (previous?.user != null && _currentUserId != nextUserId)) {
        state = ExpensesState();
        _currentUserId = nextUserId;
      } else if (next.user != null) {
        _currentUserId = nextUserId;
      }
    });
  }

  /// Clears all cached financial state (useful during logout/session reset)
  void reset() {
    state = ExpensesState();
  }

  /// Fetches authoritative budget and distinct expense records for [farmId].
  Future<void> fetchExpenses(String farmId) async {
    if (farmId.trim().isEmpty) return;

    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await ApiClient().dio.get('farms/$farmId/financials/expenses');
      if (response.statusCode == 200) {
        final dynamic raw = response.data;
        final dynamic dataMap = (raw is Map && raw['data'] != null)
            ? raw['data']
            : raw;

        if (dataMap is Map) {
          final data = FarmExpensesData.fromJson(Map<String, dynamic>.from(dataMap));
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

  /// Configures or updates the farm budget on the backend.
  /// Validates that totalBudget is finite and >= 0.
  Future<bool> setFarmBudget({
    required String farmId,
    required double totalBudget,
  }) async {
    if (farmId.trim().isEmpty || totalBudget < 0 || totalBudget.isNaN || totalBudget.isInfinite) {
      return false;
    }

    if (state.isSubmitting) return false;

    state = state.copyWith(isSubmitting: true, error: null);
    try {
      final response = await ApiClient().dio.post(
        'farms/$farmId/financials/budget',
        data: {'totalBudget': totalBudget},
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        await fetchExpenses(farmId);
        state = state.copyWith(isSubmitting: false);
        return true;
      }
      state = state.copyWith(isSubmitting: false, error: 'Failed to set budget');
      return false;
    } catch (e) {
      state = state.copyWith(isSubmitting: false, error: 'Error setting budget: $e');
      return false;
    }
  }

  /// Records an expense against the farm.
  /// Validates that amount > 0, title is non-empty, and avoids double-submit.
  Future<bool> addExpense({
    required String farmId,
    required String title,
    required double amount,
    String? category,
    String? description,
    DateTime? date,
    String? cropId,
  }) async {
    final cleanTitle = title.trim();
    if (cleanTitle.isEmpty || amount <= 0 || amount.isNaN || amount.isInfinite) {
      return false; // Validation failure
    }

    if (state.isSubmitting) {
      return false; // Prevent duplicate concurrent submission
    }

    state = state.copyWith(isSubmitting: true, error: null);
    try {
      final response = await ApiClient().dio.post(
        'farms/$farmId/financials/expense',
        data: {
          'title': cleanTitle,
          'amount': amount,
          'category': category ?? 'General Expense',
          'description': description?.trim() ?? '',
          'date': (date ?? DateTime.now()).toIso8601String(),
          if (cropId != null && cropId.isNotEmpty) 'cropId': cropId,
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        await fetchExpenses(farmId);
        state = state.copyWith(isSubmitting: false);
        return true;
      }
      state = state.copyWith(isSubmitting: false, error: 'Failed to record expense');
      return false;
    } catch (e) {
      state = state.copyWith(isSubmitting: false, error: 'Error recording expense: $e');
      return false;
    }
  }
}

final expensesProvider =
    StateNotifierProvider<ExpensesNotifier, ExpensesState>((ref) {
  return ExpensesNotifier(ref);
});
