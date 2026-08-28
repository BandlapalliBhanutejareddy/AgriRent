import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../auth/providers/auth_provider.dart';

final feedbackProvider = StateNotifierProvider<FeedbackNotifier, AsyncValue<List<dynamic>>>((ref) {
  final authState = ref.watch(authProvider);
  return FeedbackNotifier(ref, authState.user?.role);
});

class FeedbackNotifier extends StateNotifier<AsyncValue<List<dynamic>>> {
  final Ref _ref;
  final String? _activeRole;
  final ApiClient _apiClient = ApiClient();

  FeedbackNotifier(this._ref, this._activeRole) : super(const AsyncValue.loading()) {
    loadMyFeedback();
  }

  Future<void> loadMyFeedback() async {
    try {
      state = const AsyncValue.loading();
      final response = await _apiClient.get('/feedback/my');
      
      if (response.statusCode == 200) {
        state = AsyncValue.data(List<dynamic>.from(response.data['data'] ?? []));
      } else {
        state = AsyncValue.error('Failed to load feedback', StackTrace.current);
      }
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<bool> submitFeedback({
    required int rating,
    required String category,
    required String subject,
    required String message,
  }) async {
    try {
      final response = await _apiClient.post('/feedback', data: {
        'rating': rating,
        'category': category,
        'subject': subject,
        'message': message,
        'activeRole': _activeRole,
      });

      if (response.statusCode == 201) {
        await loadMyFeedback();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }
}
