import '../../../core/api/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/errors/api_error_handler.dart';
import '../../../models/equipment.dart';
import '../../../models/booking.dart';

class OwnerRepository {
  final ApiClient _apiClient = ApiClient();

  Future<List<Equipment>> fetchMyEquipment() async {
    try {
      final response = await _apiClient.dio.get(ApiConstants.myEquipment);
      final responseData = response.data['data'] ?? response.data;
      final List<dynamic> rawData = responseData;
      return rawData.map((e) => Equipment.fromJson(e)).toList();
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }

  Future<List<Booking>> fetchOwnerBookings() async {
    try {
      final response = await _apiClient.dio.get(ApiConstants.ownerBookings);
      final responseData = response.data['data'] ?? response.data;
      final List<dynamic> rawData = responseData;
      return rawData.map((e) => Booking.fromJson(e)).toList();
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }

  Future<Equipment> createEquipment(Map<String, dynamic> data) async {
    try {
      final response = await _apiClient.dio.post(ApiConstants.equipment, data: data);
      final responseData = response.data['data'] ?? response.data;
      return Equipment.fromJson(responseData);
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }

  Future<Equipment> updateEquipment(String id, Map<String, dynamic> data) async {
    try {
      final response = await _apiClient.dio.put('${ApiConstants.equipment}/$id', data: data);
      final responseData = response.data['data'] ?? response.data;
      return Equipment.fromJson(responseData);
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }
}
