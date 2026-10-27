import '../../../core/api/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/errors/api_error_handler.dart';

class OwnerAnalyticsRepository {
  final ApiClient _apiClient = ApiClient();

  Future<Map<String, dynamic>> fetchAnalytics({
    String? period,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (period != null && period.isNotEmpty) {
        queryParams['period'] = period;
      }
      if (startDate != null) {
        queryParams['startDate'] = startDate.toIso8601String().split('T').first;
      }
      if (endDate != null) {
        queryParams['endDate'] = endDate.toIso8601String().split('T').first;
      }

      final response = await _apiClient.dio.get(
        '${ApiConstants.analytics}/owner',
        queryParameters: queryParams.isNotEmpty ? queryParams : null,
      );
      final dynamic raw = response.data;
      if (raw is Map) {
        return raw['data'] is Map
            ? Map<String, dynamic>.from(raw['data'] as Map)
            : Map<String, dynamic>.from(raw);
      }
      return {};
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }

  Future<List<Map<String, dynamic>>> fetchPerformanceMetrics({
    String? sortBy,
    String? order,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (sortBy != null && sortBy.isNotEmpty) queryParams['sortBy'] = sortBy;
      if (order != null && order.isNotEmpty) queryParams['order'] = order;

      final response = await _apiClient.dio.get(
        '${ApiConstants.analytics}/owner/performance',
        queryParameters: queryParams.isNotEmpty ? queryParams : null,
      );
      final dynamic raw = response.data;
      if (raw is Map && raw['data'] is List) {
        return (raw['data'] as List)
            .whereType<Map>()
            .map((e) => Map<String, dynamic>.from(e))
            .toList();
      }
      return [];
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }
}
