import '../../../core/api/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/errors/api_error_handler.dart';

class AnalyticsRepository {
  final ApiClient _apiClient = ApiClient();

  Future<Map<String, dynamic>> fetchAnalytics(String role) async {
    try {
      final endpoint = role == 'OWNER' ? '${ApiConstants.analytics}/owner' : '${ApiConstants.analytics}/farmer';
      final response = await _apiClient.dio.get(endpoint);
      return response.data;
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }
}
