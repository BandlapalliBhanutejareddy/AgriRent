import '../../../core/api/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/errors/api_error_handler.dart';

class AnalyticsRepository {
  final ApiClient _apiClient = ApiClient();

  Future<Map<String, dynamic>> fetchAnalytics(String role) async {
    try {
      final normalizedRole = role.toUpperCase().trim();
      final endpoint = normalizedRole == 'OWNER' ? '${ApiConstants.analytics}/owner' : '${ApiConstants.analytics}/farmer';
      final response = await _apiClient.dio.get(endpoint);
      final dynamic raw = response.data;
      if (raw is Map<String, dynamic>) {
        if (raw.containsKey('data') && raw['data'] is Map<String, dynamic>) {
          return raw['data'] as Map<String, dynamic>;
        }
        return raw;
      }
      return {};
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }
}
