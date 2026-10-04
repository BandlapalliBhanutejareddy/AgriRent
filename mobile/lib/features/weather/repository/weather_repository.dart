import 'package:dio/dio.dart';
import '../models/weather_model.dart';
import '../../../core/api/api_client.dart';

class WeatherRepository {
  Future<WeatherData> getFarmWeather(String farmId) async {
    try {
      final response = await ApiClient().dio.get('/farms/$farmId/weather');
      final dynamic raw = response.data;
      if (raw is Map<String, dynamic>) {
        if (raw['success'] == true && raw['data'] != null && raw['data'] is Map<String, dynamic>) {
          return WeatherData.fromJson(raw['data']);
        }
        if (raw['current'] != null || raw['forecast'] != null) {
          return WeatherData.fromJson(raw);
        }
        throw Exception(raw['error'] ?? 'Failed to load weather');
      }
      throw Exception('Failed to load weather');
    } on DioException catch (e) {
      if (e.response?.data != null && e.response?.data['code'] == 'WEATHER_LOCATION_UNAVAILABLE') {
        throw Exception('WEATHER_LOCATION_UNAVAILABLE');
      }
      throw Exception(e.message ?? 'Failed to load weather');
    } catch (e) {
      if (e.toString().contains('WEATHER_LOCATION_UNAVAILABLE')) {
        rethrow;
      }
      throw Exception(e.toString());
    }
  }
}
