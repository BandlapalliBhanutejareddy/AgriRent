import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../models/financial_model.dart';
import '../../auth/providers/auth_provider.dart';

class FinancialState {
  final Map<String, FarmFinancialAnalysis> analyses;
  final bool isLoading;
  final String? error;

  FinancialState({
    this.analyses = const {},
    this.isLoading = false,
    this.error,
  });

  FinancialState copyWith({
    Map<String, FarmFinancialAnalysis>? analyses,
    bool? isLoading,
    String? error,
  }) {
    return FinancialState(
      analyses: analyses ?? this.analyses,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class FinancialNotifier extends StateNotifier<FinancialState> {
  final Ref _ref;

  FinancialNotifier(this._ref) : super(FinancialState()) {
    _ref.listen<AuthState>(authProvider, (previous, next) {
      if (next.user == null || (next.activeRole != 'FARMER' && next.user?.role != 'FARMER')) {
        // Clear data when user logs out or switches role
        state = FinancialState();
      }
    });
  }

  Future<void> fetchFinancialAnalysis(String farmId, String lang) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await ApiClient().dio.get('/farms/$farmId/financials?lang=$lang');
      if (response.statusCode == 200) {
        final analysis = FarmFinancialAnalysis.fromJson(response.data);
        final newAnalyses = Map<String, FarmFinancialAnalysis>.from(state.analyses);
        newAnalyses[farmId] = analysis;
        state = state.copyWith(analyses: newAnalyses, isLoading: false);
      } else {
        state = state.copyWith(error: 'Failed to load financials', isLoading: false);
      }
    } catch (e) {
      state = state.copyWith(error: 'Error: $e', isLoading: false);
    }
  }
}

final financialProvider = StateNotifierProvider<FinancialNotifier, FinancialState>((ref) {
  return FinancialNotifier(ref);
});
