import '../../../core/api/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/errors/api_error_handler.dart';

class AiRepository {
  final ApiClient _apiClient = ApiClient();

  Future<String> getAdvice(String prompt) async {
    try {
      final response = await _apiClient.dio.post(ApiConstants.aiAdvisor, data: {
        'prompt': prompt,
      });
      return response.data['advice'] ?? 'No advice received.';
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }
}
