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
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
        'available': 'true',
      };
      if (category != null && category.isNotEmpty) queryParams['category'] = category;
      if (search != null && search.isNotEmpty) queryParams['search'] = search;
      if (minPrice != null) queryParams['minPrice'] = minPrice;
      if (maxPrice != null) queryParams['maxPrice'] = maxPrice;
      if (sort != null && sort.isNotEmpty) queryParams['sort'] = sort;

      final response = await _apiClient.dio.get(
        ApiConstants.equipment,
        queryParameters: queryParams,
      );

      final dynamic resData = response.data;
      final List<dynamic> rawList = (resData is Map && resData['data'] is List)
          ? resData['data']
          : (resData is List
              ? resData
              : (resData is Map && resData['data'] is Map && resData['data']['data'] is List
                  ? resData['data']['data']
                  : (resData is Map && resData['equipment'] is List ? resData['equipment'] : [])));

      final List<Equipment> equipment = rawList
          .whereType<Map>()
          .map((e) => Equipment.fromJson(Map<String, dynamic>.from(e)))
          .toList();

      final Map<String, dynamic> pagination = (resData is Map && resData['pagination'] is Map)
          ? Map<String, dynamic>.from(resData['pagination'] as Map)
          : ((resData is Map && resData['data'] is Map && resData['data']['pagination'] is Map)
              ? Map<String, dynamic>.from(resData['data']['pagination'] as Map)
              : {'totalPages': 1, 'page': page, 'total': equipment.length});

      return {
        'equipment': equipment,
        'pagination': pagination,
      };
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }
}
