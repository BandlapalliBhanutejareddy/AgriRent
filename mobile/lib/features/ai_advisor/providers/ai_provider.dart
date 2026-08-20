import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../repository/ai_repository.dart';

final aiRepositoryProvider = Provider((ref) => AiRepository());

class AiState {
  final String response;
  final bool isLoading;
  final String? error;

  AiState({this.response = '', this.isLoading = false, this.error});

  AiState copyWith({String? response, bool? isLoading, String? error, bool clearError = false}) {
    return AiState(
      response: response ?? this.response,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class AiNotifier extends StateNotifier<AiState> {
  final AiRepository _repository;

  AiNotifier(this._repository) : super(AiState());

  Future<void> askQuestion(String prompt) async {
    if (prompt.trim().isEmpty) return;
    
    state = state.copyWith(isLoading: true, clearError: true, response: '');
    try {
      final advice = await _repository.getAdvice(prompt);
      state = state.copyWith(isLoading: false, response: advice);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }
}

final aiProvider = StateNotifierProvider<AiNotifier, AiState>((ref) {
  final repo = ref.watch(aiRepositoryProvider);
  return AiNotifier(repo);
});
