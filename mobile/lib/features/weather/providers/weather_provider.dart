import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../repository/weather_repository.dart';
import '../models/weather_model.dart';

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

  WeatherNotifier(this._repository, this.farmId) : super(WeatherState()) {
    fetchWeather();
  }

  Future<void> fetchWeather() async {
    if (state.isLoading) return;

    // Retain old data if available while loading
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final data = await _repository.getFarmWeather(farmId);
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
  return WeatherNotifier(repo, farmId);
});
