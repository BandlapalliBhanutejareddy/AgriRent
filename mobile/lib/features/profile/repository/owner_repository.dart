import 'dart:convert';
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
      dynamic raw = response.data;
      if (raw is String) {
        try {
          raw = json.decode(raw);
        } catch (_) {}
      }
      final List<dynamic> rawData = raw is List
          ? raw
          : (raw is Map && raw['data'] is List
              ? raw['data']
              : (raw is Map && raw['data'] is Map && raw['data']['data'] is List
                  ? raw['data']['data']
                  : (raw is Map && raw['equipment'] is List
                      ? raw['equipment']
                      : [])));
      return rawData
          .whereType<Map>()
          .map((e) => Equipment.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }

  Future<List<Booking>> fetchOwnerBookings() async {
    try {
      final response = await _apiClient.dio.get(ApiConstants.ownerBookings);
      dynamic raw = response.data;
      if (raw is String) {
        try {
          raw = json.decode(raw);
        } catch (_) {}
      }
      final List<dynamic> rawData = raw is List
          ? raw
          : (raw is Map && raw['data'] is List
              ? raw['data']
              : (raw is Map && raw['data'] is Map && raw['data']['data'] is List
                  ? raw['data']['data']
                  : (raw is Map && raw['bookings'] is List
                      ? raw['bookings']
                      : [])));
      return rawData
          .whereType<Map>()
          .map((e) => Booking.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }

  Future<Equipment> createEquipment(Map<String, dynamic> data) async {
    try {
      final response = await _apiClient.dio.post(ApiConstants.equipment, data: data);
      final dynamic raw = response.data;
      final dynamic responseData = (raw is Map && raw['data'] is Map) ? raw['data'] : (raw is Map ? raw : {});
      return Equipment.fromJson(Map<String, dynamic>.from(responseData));
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }

  Future<Equipment> updateEquipment(String id, Map<String, dynamic> data) async {
    try {
      final response = await _apiClient.dio.put('${ApiConstants.equipment}/$id', data: data);
      final dynamic raw = response.data;
      final dynamic responseData = (raw is Map && raw['data'] is Map) ? raw['data'] : (raw is Map ? raw : {});
      return Equipment.fromJson(Map<String, dynamic>.from(responseData));
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }

  Future<Map<String, dynamic>> fetchAnalytics() async {
    try {
      final response = await _apiClient.dio.get('${ApiConstants.analytics}/owner');
      final dynamic raw = response.data;
      if (raw is Map) {
        return raw['data'] is Map ? Map<String, dynamic>.from(raw['data'] as Map) : Map<String, dynamic>.from(raw);
      }
      return {};
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }

  Future<void> deleteEquipment(String id) async {
    try {
      await _apiClient.dio.delete('${ApiConstants.equipment}/$id');
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }

  Future<void> completeInspection(String bookingId, Map<String, dynamic> data) async {
    try {
      await _apiClient.dio.post('${ApiConstants.bookings}/$bookingId/inspection', data: data);
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }
}
