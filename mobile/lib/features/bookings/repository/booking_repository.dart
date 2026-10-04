import '../../../core/api/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/errors/api_error_handler.dart';
import '../../../models/booking.dart';

class BookingRepository {
  final ApiClient _apiClient = ApiClient();

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

  Future<Booking> updateBookingStatus(String bookingId, String status) async {
    try {
      final response = await _apiClient.dio.put('${ApiConstants.bookings}/$bookingId/status', data: {
        'status': status,
      });
      final responseData = response.data['data'] ?? response.data;
      return Booking.fromJson(responseData);
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
      final response = await _apiClient.dio.get('${ApiConstants.bookings}/$bookingId/tracking');
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
