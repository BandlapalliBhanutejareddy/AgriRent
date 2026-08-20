import '../../../core/api/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/errors/api_error_handler.dart';
import '../../../models/equipment.dart';

class MarketplaceRepository {
  final ApiClient _apiClient = ApiClient();

  Future<Map<String, dynamic>> fetchEquipment({
    int page = 1,
    int limit = 20,
    String? category,
    String? search,
    double? minPrice,
    double? maxPrice,
    String? sort,
  }) async {
    try {
      final queryParams = {
        'page': page,
        'limit': limit,
        'available': 'true',
        if (category != null && category.isNotEmpty) 'category': category,
        if (search != null && search.isNotEmpty) 'search': search,
        if (minPrice != null) 'minPrice': minPrice,
        if (maxPrice != null) 'maxPrice': maxPrice,
        if (sort != null) 'sort': sort,
      };

      final response = await _apiClient.dio.get(
        ApiConstants.equipment,
        queryParameters: queryParams,
      );

      final List<dynamic> rawData = response.data['data'] ?? [];
      final List<Equipment> equipment = rawData.map((e) => Equipment.fromJson(e)).toList();
      final pagination = response.data['pagination'] ?? {};

      return {
        'equipment': equipment,
        'pagination': pagination,
      };
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }
}
