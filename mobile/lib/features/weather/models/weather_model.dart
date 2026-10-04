class WeatherData {
  final String farmId;
  final WeatherLocation location;
  final CurrentWeather current;
  final List<DailyForecast> forecast;
  final String source;
  final DateTime fetchedAt;

  WeatherData({
    required this.farmId,
    required this.location,
    required this.current,
    required this.forecast,
    required this.source,
    required this.fetchedAt,
  });

  factory WeatherData.fromJson(Map<String, dynamic> json) {
    return WeatherData(
      farmId: json['farmId'] ?? '',
      location: WeatherLocation.fromJson(json['location'] ?? {}),
      current: CurrentWeather.fromJson(json['current'] ?? {}),
      forecast: (json['forecast'] as List?)?.map((e) => DailyForecast.fromJson(e)).toList() ?? [],
      source: json['source'] ?? '',
      fetchedAt: json['fetchedAt'] != null ? DateTime.parse(json['fetchedAt']) : DateTime.now(),
    );
  }
}

class WeatherLocation {
  final double latitude;
  final double longitude;
  final String name;

  WeatherLocation({required this.latitude, required this.longitude, required this.name});

  factory WeatherLocation.fromJson(Map<String, dynamic> json) {
    return WeatherLocation(
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0.0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0.0,
      name: json['name'] ?? '',
    );
  }
}

class CurrentWeather {
  final double? temperature;
  final double? apparentTemperature;
  final double? humidity;
  final double? precipitation;
  final double? rain;
  final int? weatherCode;
  final double? windSpeed;
  final double? windDirection;
  final DateTime? observedAt;

  CurrentWeather({
    this.temperature,
    this.apparentTemperature,
    this.humidity,
    this.precipitation,
    this.rain,
    this.weatherCode,
    this.windSpeed,
    this.windDirection,
    this.observedAt,
  });

  factory CurrentWeather.fromJson(Map<String, dynamic> json) {
    return CurrentWeather(
      temperature: (json['temperature'] as num?)?.toDouble(),
      apparentTemperature: (json['apparentTemperature'] as num?)?.toDouble(),
      humidity: (json['humidity'] as num?)?.toDouble(),
      precipitation: (json['precipitation'] as num?)?.toDouble(),
      rain: (json['rain'] as num?)?.toDouble(),
      weatherCode: json['weatherCode'] as int?,
      windSpeed: (json['windSpeed'] as num?)?.toDouble(),
      windDirection: (json['windDirection'] as num?)?.toDouble(),
      observedAt: json['observedAt'] != null ? DateTime.tryParse(json['observedAt']) : null,
    );
  }
}

class DailyForecast {
  final String date;
  final double? minTemperature;
  final double? maxTemperature;
  final double? precipitation;
  final int? precipitationProbability;
  final int? weatherCode;

  DailyForecast({
    required this.date,
    this.minTemperature,
    this.maxTemperature,
    this.precipitation,
    this.precipitationProbability,
    this.weatherCode,
  });

  factory DailyForecast.fromJson(Map<String, dynamic> json) {
    return DailyForecast(
      date: json['date'] ?? '',
      minTemperature: (json['minTemperature'] as num?)?.toDouble(),
      maxTemperature: (json['maxTemperature'] as num?)?.toDouble(),
      precipitation: (json['precipitation'] as num?)?.toDouble(),
      precipitationProbability: json['precipitationProbability'] as int?,
      weatherCode: json['weatherCode'] as int?,
    );
  }
}
