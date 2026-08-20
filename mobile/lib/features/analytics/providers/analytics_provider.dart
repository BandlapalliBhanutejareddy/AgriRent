import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../repository/analytics_repository.dart';

final analyticsRepositoryProvider = Provider((ref) => AnalyticsRepository());

class AnalyticsState {
  final Map<String, dynamic>? data;
  final bool isLoading;
  final String? error;

  AnalyticsState({this.data, this.isLoading = false, this.error});

  AnalyticsState copyWith({Map<String, dynamic>? data, bool? isLoading, String? error, bool clearError = false}) {
    return AnalyticsState(
      data: data ?? this.data,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class AnalyticsNotifier extends StateNotifier<AnalyticsState> {
  final AnalyticsRepository _repository;

  AnalyticsNotifier(this._repository) : super(AnalyticsState());

  Future<void> loadAnalytics(String role) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final data = await _repository.fetchAnalytics(role);
      state = state.copyWith(isLoading: false, data: data);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }
}

final analyticsProvider = StateNotifierProvider<AnalyticsNotifier, AnalyticsState>((ref) {
  final repo = ref.watch(analyticsRepositoryProvider);
  return AnalyticsNotifier(repo);
});
