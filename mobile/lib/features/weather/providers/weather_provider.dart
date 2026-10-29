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
    } catch (e) {
      final errStr = e.toString().replaceFirst('Exception: ', '');
      // If location is unavailable or geocoding failed for registered farm, fallback to device GPS
      if (errStr.contains('WEATHER_LOCATION_UNAVAILABLE') || errStr.contains('GEOCODING_FAILED') || farmId == 'current-lookup') {
        try {
          final isEnabled = await Geolocator.isLocationServiceEnabled().catchError((_) => false);
          if (isEnabled) {
            var permission = await Geolocator.checkPermission().catchError((_) => LocationPermission.denied);
            if (permission == LocationPermission.denied && requestGpsIfUnavailable) {
              permission = await Geolocator.requestPermission().catchError((_) => LocationPermission.denied);
            }
            if (permission == LocationPermission.always || permission == LocationPermission.whileInUse) {
              Position? pos;
              try {
                pos = await Geolocator.getCurrentPosition(
                  locationSettings: const LocationSettings(
                    accuracy: LocationAccuracy.medium,
                    timeLimit: Duration(seconds: 7),
                  ),
                );
              } catch (_) {
                pos = await Geolocator.getLastKnownPosition();
              }
              if (pos != null) {
                final gpsData = await _repository.getWeatherByCoordinates(pos.latitude, pos.longitude);
                state = state.copyWith(isLoading: false, weatherData: gpsData);
                return;
              }
            }
          }
        } catch (_) {}
      }

      state = state.copyWith(
        isLoading: false,
        error: errStr,
      );
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
        position = await Geolocator.getLastKnownPosition();
      }

      if (position == null) {
        state = state.copyWith(
          isLoading: false,
          error: 'WEATHER_LOCATION_UNAVAILABLE',
        );
        return;
      }

      final data = await _repository.getWeatherByCoordinates(
        position.latitude,
        position.longitude,
      );
      state = state.copyWith(isLoading: false, weatherData: data);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString().replaceFirst('Exception: ', ''),
      );
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
