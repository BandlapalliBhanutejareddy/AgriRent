import 'package:dio/dio.dart';
import '../models/weather_model.dart';
import '../../../core/api/api_client.dart';

class WeatherRepository {
  Future<WeatherData> getFarmWeather(String farmId, {String? location}) async {
    try {
      // 1. If location is provided and contains coordinate patterns (e.g. "13.0266°, 80.0156°" or "13.0266, 80.0156")
      if (location != null && location.trim().isNotEmpty) {
        final sanitized = location
            .replaceAll(RegExp(r'Coordinates:\s*', caseSensitive: false), '')
            .replaceAll('°', '')
            .replaceAll(RegExp(r'[NSEWnsew]'), '')
            .trim();
        final coordMatch = RegExp(r'([-+]?[0-9]+\.?[0-9]*)\s*,\s*([-+]?[0-9]+\.?[0-9]*)').firstMatch(sanitized);
        if (coordMatch != null) {
          final lat = double.tryParse(coordMatch.group(1) ?? '');
          final lng = double.tryParse(coordMatch.group(2) ?? '');
          if (lat != null && lng != null && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            return await getWeatherByCoordinates(lat, lng, locationName: location);
          }
        }
      }

      final path = (farmId.isEmpty || farmId == 'default' || farmId == 'current-lookup')
          ? '/farms/weather/lookup'
          : '/farms/$farmId/weather';
      final response = await ApiClient().dio.get(path);
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

  Future<WeatherData> getWeatherByCoordinates(double lat, double lng, {String? locationName}) async {
    try {
      final queryParams = <String, dynamic>{
        'lat': lat,
        'lng': lng,
      };
      if (locationName != null && locationName.isNotEmpty) {
        queryParams['name'] = locationName;
      }
      final response = await ApiClient().dio.get(
        '/farms/weather/lookup',
        queryParameters: queryParams,
      );
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

  Future<WeatherData> getWeatherBySearch(String locationQuery) async {
    try {
      final response = await ApiClient().dio.get(
        '/farms/weather/lookup',
        queryParameters: {'location': locationQuery},
      );
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
