import 'package:dio/dio.dart';
import '../../../core/api/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/errors/api_error_handler.dart';
import '../../../models/booking.dart';

class BookingRepository {
  final ApiClient _apiClient;

  BookingRepository([ApiClient? apiClient]) : _apiClient = apiClient ?? ApiClient();

  Future<Booking> createBooking({
    required String equipmentId,
    required DateTime startDate,
    required DateTime endDate,
  }) async {
    try {
      final response = await _apiClient.dio.post(ApiConstants.bookings, data: {
        'equipmentId': equipmentId,
        'startDate': startDate.toIso8601String(),
        'endDate': endDate.toIso8601String(),
      });
      final responseData = response.data['data'] ?? response.data;
      return Booking.fromJson(responseData);
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }

  Future<Map<String, dynamic>> checkAvailability(String equipmentId) async {
    try {
      final response = await _apiClient.dio.get(
        '${ApiConstants.bookings}/availability',
        queryParameters: {'equipmentId': equipmentId},
      );
      final raw = response.data;
      return (raw is Map<String, dynamic>) ? raw : <String, dynamic>{};
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }

  Future<Booking> updateBookingStatus(String bookingId, String status, {String? note}) async {
    try {
      final payload = <String, dynamic>{'status': status};
      if (note != null && note.trim().isNotEmpty) {
        payload['note'] = note.trim();
      }
      final response = await _apiClient.dio.put('${ApiConstants.bookings}/$bookingId/status', data: payload);
      final responseData = response.data['data'] ?? response.data;
      return Booking.fromJson(responseData);
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

  Future<List<Booking>> fetchMyRentals(String role) async {
    try {
      final response = await _apiClient.dio.get('${ApiConstants.bookings}?role=$role');
      final dynamic raw = response.data;
      final List<dynamic> data = raw is List
          ? raw
          : (raw is Map && raw['data'] is List
              ? raw['data']
              : (raw is Map && raw['data'] is Map && raw['data']['data'] is List
                  ? raw['data']['data']
                  : []));
      return data
          .whereType<Map>()
          .map((json) => Booking.fromJson(Map<String, dynamic>.from(json)))
          .toList();
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }

  Future<Booking> fetchBookingById(String bookingId) async {
    try {
      Response response;
      try {
        response = await _apiClient.dio.get('${ApiConstants.bookings}/$bookingId/tracking');
      } catch (_) {
        // Fallback to primary booking route if tracking route is not returned
        response = await _apiClient.dio.get('${ApiConstants.bookings}/$bookingId');
      }
      final dynamic raw = response.data;
      final dynamic responseData = (raw is Map && raw['data'] is Map) ? raw['data'] : (raw is Map ? raw : {});
      return Booking.fromJson(Map<String, dynamic>.from(responseData));
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }

  Future<List<Booking>> fetchOwnerBookings() async {
    try {
      final response = await _apiClient.dio.get(ApiConstants.ownerBookings);
      final dynamic raw = response.data;
      final List<dynamic> data = raw is List
          ? raw
          : (raw is Map && raw['data'] is List
              ? raw['data']
              : (raw is Map && raw['data'] is Map && raw['data']['data'] is List
                  ? raw['data']['data']
                  : []));
      return data
          .whereType<Map>()
          .map((json) => Booking.fromJson(Map<String, dynamic>.from(json)))
          .toList();
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }
}
