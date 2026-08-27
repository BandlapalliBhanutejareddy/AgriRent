import '../../../core/api/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/errors/api_error_handler.dart';

class AiRepository {
  final ApiClient _apiClient = ApiClient();

  Future<String> getAdvice(String prompt, {String language = 'English'}) async {
    try {
      final response = await _apiClient.dio.post(ApiConstants.aiAdvisor, data: {
        'prompt': prompt,
        'language': language,
      });
      final responseData = response.data['data'] ?? response.data;
      return responseData['reply'] ?? 'No response received.';
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }
}
