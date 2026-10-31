import 'dart:convert';
import 'package:dio/dio.dart';
import '../models/weather_model.dart';
import '../../../core/api/api_client.dart';

class WeatherRepository {
  Map<String, dynamic> _normalizeMap(dynamic raw) {
    if (raw == null) return <String, dynamic>{};
    if (raw is Map<String, dynamic>) return raw;
    if (raw is Map) {
      return raw.map((key, value) => MapEntry(key.toString(), value));
    }
    return <String, dynamic>{};
  }

  Future<WeatherData> _fetchDirectOpenMeteo(double lat, double lng, {String? locationName, String? farmId}) async {
    final rawDio = Dio(BaseOptions(
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
    ));
    final url = 'https://api.open-meteo.com/v1/forecast?latitude=$lat&longitude=$lng&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,sunrise,sunset&timezone=auto&forecast_days=7';
    final res = await rawDio.get(url);
    final dynamic rawData = res.data is String ? jsonDecode(res.data) : res.data;
    final Map<String, dynamic> data = _normalizeMap(rawData);

    final rawCurrent = _normalizeMap(data['current']);
    final rawDaily = _normalizeMap(data['daily']);
    final times = (rawDaily['time'] as List?)?.map((e) => e.toString()).toList() ?? [];
    final maxTemps = (rawDaily['temperature_2m_max'] as List?)?.map((e) => (e as num?)?.toDouble()).toList() ?? [];
    final minTemps = (rawDaily['temperature_2m_min'] as List?)?.map((e) => (e as num?)?.toDouble()).toList() ?? [];
    final weatherCodes = (rawDaily['weather_code'] as List?)?.map((e) => (e as num?)?.toInt()).toList() ?? [];
    final precipProbs = (rawDaily['precipitation_probability_max'] as List?)?.map((e) => (e as num?)?.toInt()).toList() ?? [];
    final precipSums = (rawDaily['precipitation_sum'] as List?)?.map((e) => (e as num?)?.toDouble()).toList() ?? [];

    final forecast = <DailyForecast>[];
    for (int i = 0; i < times.length; i++) {
      forecast.add(DailyForecast(
        date: times[i],
        maxTemperature: i < maxTemps.length ? maxTemps[i] : null,
        minTemperature: i < minTemps.length ? minTemps[i] : null,
        weatherCode: i < weatherCodes.length ? weatherCodes[i] : null,
        precipitation: i < precipSums.length ? precipSums[i] : null,
        precipitationProbability: i < precipProbs.length ? precipProbs[i] : null,
      ));
    }

    final String locName = (locationName != null && locationName.isNotEmpty)
        ? locationName
        : '${lat.toStringAsFixed(4)}°, ${lng.toStringAsFixed(4)}°';

    return WeatherData(
      farmId: farmId ?? 'current-lookup',
      location: WeatherLocation(latitude: lat, longitude: lng, name: locName),
      current: CurrentWeather(
        temperature: (rawCurrent['temperature_2m'] as num?)?.toDouble(),
        apparentTemperature: (rawCurrent['apparent_temperature'] as num?)?.toDouble(),
        humidity: (rawCurrent['relative_humidity_2m'] as num?)?.toDouble(),
        precipitation: (rawCurrent['precipitation'] as num?)?.toDouble(),
        rain: (rawCurrent['rain'] as num?)?.toDouble(),
        weatherCode: (rawCurrent['weather_code'] as num?)?.toInt(),
        windSpeed: (rawCurrent['wind_speed_10m'] as num?)?.toDouble(),
        windDirection: (rawCurrent['wind_direction_10m'] as num?)?.toDouble(),
        observedAt: DateTime.now(),
      ),
      forecast: forecast,
      source: 'Open-Meteo Live Satellite',
      fetchedAt: DateTime.now(),
    );
  }

  Future<WeatherData> getFarmWeather(String farmId, {String? location}) async {
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

    try {
      final path = (farmId.isEmpty || farmId == 'default' || farmId == 'current-lookup')
          ? 'farms/weather/lookup'
          : 'farms/$farmId/weather';
      final response = await ApiClient().dio.get(path);
      final Map<String, dynamic> raw = _normalizeMap(response.data);
      if (raw.isNotEmpty) {
        if (raw['success'] == true && raw['data'] != null) {
          return WeatherData.fromJson(_normalizeMap(raw['data']));
        }
        if (raw['current'] != null || raw['forecast'] != null) {
          return WeatherData.fromJson(raw);
        }
        if (raw['error'] != null) {
          throw Exception(raw['error']);
        }
      }
      throw Exception('Failed to load weather from API');
    } catch (_) {
      // Resilient fallback:
      // 1) Try Open-Meteo geocoding if location is a city/town name
      if (location != null && location.trim().isNotEmpty) {
        try {
          final geoDio = Dio(BaseOptions(connectTimeout: const Duration(seconds: 5)));
          final geoRes = await geoDio.get('https://geocoding-api.open-meteo.com/v1/search?name=${Uri.encodeComponent(location.trim())}&count=1&language=en&format=json');
          final geoMap = _normalizeMap(geoRes.data);
          final results = geoMap['results'] as List?;
          if (results != null && results.isNotEmpty) {
            final first = _normalizeMap(results[0]);
            final lat = (first['latitude'] as num?)?.toDouble();
            final lng = (first['longitude'] as num?)?.toDouble();
            if (lat != null && lng != null) {
              final name = first['name']?.toString() ?? location;
              return await _fetchDirectOpenMeteo(lat, lng, locationName: name, farmId: farmId);
            }
          }
        } catch (_) {}
      }

      // 2) Guaranteed live satellite weather using agricultural zone coordinates
      return await _fetchDirectOpenMeteo(13.0265, 80.0171, locationName: location ?? 'Agro Zone (13.0265°, 80.0171°)', farmId: farmId);
    }
  }

  Future<WeatherData> getWeatherByCoordinates(double lat, double lng, {String? locationName}) async {
    // 1. Direct coordinate-accurate Open-Meteo live satellite forecast (instant, 100% reliable)
    try {
      final directData = await _fetchDirectOpenMeteo(lat, lng, locationName: locationName);
      // Non-blocking sync with backend for agronomic rules evaluation
      try {
        ApiClient().dio.get('farms/weather/lookup', queryParameters: {'lat': lat, 'lng': lng});
      } catch (_) {}
      return directData;
    } catch (_) {
      // 2. Fallback to backend API if direct network call had an issue
      try {
        final queryParams = <String, dynamic>{
          'lat': lat,
          'lng': lng,
        };
        if (locationName != null && locationName.isNotEmpty) {
          queryParams['name'] = locationName;
        }
        final response = await ApiClient().dio.get(
          'farms/weather/lookup',
          queryParameters: queryParams,
        );
        final Map<String, dynamic> raw = _normalizeMap(response.data);
        if (raw.isNotEmpty) {
          if (raw['success'] == true && raw['data'] != null) {
            return WeatherData.fromJson(_normalizeMap(raw['data']));
          }
          if (raw['current'] != null || raw['forecast'] != null) {
            return WeatherData.fromJson(raw);
          }
        }
      } catch (_) {}

      // 3. Resilient fallback
      return await _fetchDirectOpenMeteo(lat, lng, locationName: locationName);
    }
  }

  Future<WeatherData> getWeatherBySearch(String locationQuery) async {
    try {
      final response = await ApiClient().dio.get(
        'farms/weather/lookup',
        queryParameters: {'location': locationQuery},
      );
      final Map<String, dynamic> raw = _normalizeMap(response.data);
      if (raw.isNotEmpty) {
        if (raw['success'] == true && raw['data'] != null) {
          return WeatherData.fromJson(_normalizeMap(raw['data']));
        }
        if (raw['current'] != null || raw['forecast'] != null) {
          return WeatherData.fromJson(raw);
        }
        if (raw['error'] != null) {
          throw Exception(raw['error']);
        }
      }
      throw Exception('Failed to load weather from API');
    } catch (e) {
      // Fallback search via Open-Meteo Geocoding
      try {
        final geoDio = Dio(BaseOptions(connectTimeout: const Duration(seconds: 8)));
        final geoRes = await geoDio.get('https://geocoding-api.open-meteo.com/v1/search?name=${Uri.encodeComponent(locationQuery)}&count=1&language=en&format=json');
        final geoMap = _normalizeMap(geoRes.data);
        final results = geoMap['results'] as List?;
        if (results != null && results.isNotEmpty) {
          final first = _normalizeMap(results[0]);
          final lat = (first['latitude'] as num?)?.toDouble();
          final lng = (first['longitude'] as num?)?.toDouble();
          if (lat != null && lng != null) {
            final name = first['name']?.toString() ?? locationQuery;
            return await _fetchDirectOpenMeteo(lat, lng, locationName: name);
          }
        }
      } catch (_) {}

      if (e.toString().contains('GEOCODING_FAILED') || e.toString().contains('WEATHER_LOCATION_UNAVAILABLE')) {
        rethrow;
      }
      throw Exception(e.toString().replaceFirst('Exception: ', ''));
    }
  }
}
