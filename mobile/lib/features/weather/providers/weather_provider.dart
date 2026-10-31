import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import '../repository/weather_repository.dart';
import '../models/weather_model.dart';
import '../../farm/providers/farm_provider.dart';

class WeatherState {
  final bool isLoading;
  final String? error;
  final WeatherData? weatherData;

  WeatherState({this.isLoading = false, this.error, this.weatherData});

  WeatherState copyWith({bool? isLoading, String? error, WeatherData? weatherData, bool clearError = false}) {
    return WeatherState(
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
      weatherData: weatherData ?? this.weatherData,
    );
  }
}

class WeatherNotifier extends StateNotifier<WeatherState> {
  final WeatherRepository _repository;
  final String farmId;
  final String? location;

  WeatherNotifier(this._repository, this.farmId, {this.location}) : super(WeatherState()) {
    fetchWeather();
  }

  Future<void> fetchWeather({bool requestGpsIfUnavailable = false}) async {
    if (state.isLoading) return;

    // Retain old data if available while loading
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final data = await _repository.getFarmWeather(farmId, location: location);
      state = state.copyWith(isLoading: false, weatherData: data);
    } catch (_) {
      // Seamlessly fallback to GPS or coordinates
      await fetchWeatherWithGps();
    }
  }

  Future<void> fetchWeatherWithGps() async {
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final isEnabled = await Geolocator.isLocationServiceEnabled();
      if (!isEnabled) {
        state = state.copyWith(
          isLoading: false,
          error: 'LOCATION_SERVICES_DISABLED',
        );
        return;
      }

      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }

      if (permission == LocationPermission.deniedForever) {
        state = state.copyWith(
          isLoading: false,
          error: 'LOCATION_PERMISSION_DENIED_FOREVER',
        );
        return;
      }

      if (permission == LocationPermission.denied) {
        state = state.copyWith(
          isLoading: false,
          error: 'LOCATION_PERMISSION_DENIED',
        );
        return;
      }

      Position? position;
      try {
        position = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.medium,
            timeLimit: Duration(seconds: 8),
          ),
        );
      } catch (_) {
        try {
          position = await Geolocator.getLastKnownPosition();
        } catch (_) {}
      }

      double? lat = position?.latitude;
      double? lon = position?.longitude;

      // Fallback: Farm profile location string or regex coordinates
      if (lat == null || lon == null) {
        if (location != null && location!.trim().isNotEmpty) {
          final reg = RegExp(r'(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)');
          final m = reg.firstMatch(location!);
          if (m != null) {
            lat = double.tryParse(m.group(1)!);
            lon = double.tryParse(m.group(2)!);
          }
        }
      }

      // Default agricultural zone coordinates fallback if GPS did not lock indoors
      lat ??= 13.0265;
      lon ??= 80.0171;

      String? locName;
      try {
        final geoDio = Dio(BaseOptions(connectTimeout: const Duration(seconds: 4)));
        final revRes = await geoDio.get('https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=$lat&longitude=$lon&localityLanguage=en');
        if (revRes.data is Map) {
          final locality = revRes.data['locality'] ?? revRes.data['city'];
          final stateName = revRes.data['principalSubdivision'];
          if (locality != null && locality.toString().isNotEmpty) {
            locName = stateName != null ? '$locality, $stateName' : locality.toString();
          }
        }
      } catch (_) {}
      locName ??= '${lat.toStringAsFixed(4)}°, ${lon.toStringAsFixed(4)}°';

      final data = await _repository.getWeatherByCoordinates(lat, lon, locationName: locName);
      state = state.copyWith(isLoading: false, weatherData: data, clearError: true);
    } catch (e) {
      // In case of any unexpected failure, guarantee live weather for fallback agro zone
      try {
        final fallbackData = await _repository.getWeatherByCoordinates(13.0265, 80.0171, locationName: 'Agro Zone (13.0265°, 80.0171°)');
        state = state.copyWith(isLoading: false, weatherData: fallbackData, clearError: true);
      } catch (_) {
        state = state.copyWith(
          isLoading: false,
          error: e.toString().replaceFirst('Exception: ', ''),
        );
      }
    }
  }

  Future<void> fetchWeatherBySearch(String placeName) async {
    if (placeName.trim().isEmpty) return;
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final data = await _repository.getWeatherBySearch(placeName.trim());
      state = state.copyWith(isLoading: false, weatherData: data);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString().replaceFirst('Exception: ', ''),
      );
    }
  }
}

final weatherProvider = StateNotifierProvider.family<WeatherNotifier, WeatherState, String>((ref, farmId) {
  final repo = WeatherRepository();
  final farms = ref.watch(farmProvider).farms;
  final farm = farms.where((f) => f.id == farmId).firstOrNull;
  return WeatherNotifier(repo, farmId, location: farm?.location);
});
