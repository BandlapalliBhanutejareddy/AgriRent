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
      final List<dynamic> rawData = response.data;
      return rawData.map((e) => Equipment.fromJson(e)).toList();
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }

  Future<List<Booking>> fetchOwnerBookings() async {
    try {
      final response = await _apiClient.dio.get(ApiConstants.ownerBookings);
      final List<dynamic> rawData = response.data;
      return rawData.map((e) => Booking.fromJson(e)).toList();
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }

  Future<Equipment> createEquipment(Map<String, dynamic> data) async {
    try {
      final response = await _apiClient.dio.post(ApiConstants.equipment, data: data);
      return Equipment.fromJson(response.data);
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }

  Future<Equipment> updateEquipment(String id, Map<String, dynamic> data) async {
    try {
      final response = await _apiClient.dio.put('${ApiConstants.equipment}/$id', data: data);
      return Equipment.fromJson(response.data);
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }
}
