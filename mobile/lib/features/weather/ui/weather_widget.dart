import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/localization/app_localizations.dart';
import '../providers/weather_provider.dart';
import '../models/weather_model.dart';

class WeatherWidget extends ConsumerWidget {
  final String farmId;

  const WeatherWidget({super.key, required this.farmId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(languageProvider);
    final weatherState = ref.watch(weatherProvider(farmId));

    if (weatherState.isLoading && weatherState.weatherData == null) {
      return _buildLoadingState(lang);
    }

    if (weatherState.error != null) {
      return _buildErrorState(context, ref, lang, weatherState.error!);
    }

    if (weatherState.weatherData == null) {
      return const SizedBox.shrink();
    }

    final data = weatherState.weatherData!;
    final current = data.current;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 20,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.all(20.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.wb_sunny_outlined, color: Color(0xFFF59E0B), size: 24),
                    const SizedBox(width: 8),
                    Text(
                      'weather'.tr(lang).toUpperCase(),
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 16,
                        color: Color(0xFF0F172A),
                        letterSpacing: -0.5,
                      ),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.refresh, color: Color(0xFF64748B)),
                  onPressed: () {
                    ref.read(weatherProvider(farmId).notifier).fetchWeather();
                  },
                ),
              ],
            ),
          ),
          
          if (weatherState.isLoading)
            const LinearProgressIndicator(
              backgroundColor: Colors.transparent,
              valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF22C55E)),
              minHeight: 2,
            )
          else
            const Divider(height: 1, color: Color(0xFFF1F5F9)),

          Padding(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.location_on, size: 14, color: Color(0xFF64748B)),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        data.location.name,
                        style: const TextStyle(
                          color: Color(0xFF64748B),
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Icon(
                      _getWeatherIcon(current.weatherCode),
                      size: 48,
                      color: const Color(0xFF3B82F6),
                    ),
                    const SizedBox(width: 16),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          current.temperature != null ? '${current.temperature}°C' : 'not_available'.tr(lang),
                          style: const TextStyle(
                            fontSize: 32,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF0F172A),
                            letterSpacing: -1,
                          ),
                        ),
                        Text(
                          _getWeatherConditionKey(current.weatherCode).tr(lang),
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  '${'feels_like'.tr(lang)} ${current.apparentTemperature != null ? '${current.apparentTemperature}°C' : 'not_available'.tr(lang)}',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFF475569),
                  ),
                ),
                const SizedBox(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildWeatherDetail('humidity'.tr(lang), current.humidity != null ? '${current.humidity}%' : '-', Icons.water_drop_outlined),
                    _buildWeatherDetail('rain'.tr(lang), current.rain != null ? '${current.rain} mm' : '-', Icons.umbrella_outlined),
                    _buildWeatherDetail('wind'.tr(lang), current.windSpeed != null ? '${current.windSpeed} km/h' : '-', Icons.air_outlined),
                  ],
                ),
                const SizedBox(height: 20),
                Text(
                  '${'updated'.tr(lang)} ${_formatDate(data.fetchedAt)}',
                  style: const TextStyle(
                    fontSize: 11,
                    color: Color(0xFF94A3B8),
                  ),
                ),
              ],
            ),
          ),
          
          if (data.forecast.isNotEmpty) ...[
            const Divider(height: 1, color: Color(0xFFF1F5F9)),
            Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'forecast'.tr(lang).toUpperCase(),
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 12,
                      color: Color(0xFF64748B),
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    height: 120,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: data.forecast.length,
                      separatorBuilder: (context, index) => const SizedBox(width: 12),
                      itemBuilder: (context, index) {
                        final day = data.forecast[index];
                        return _buildForecastCard(day, lang);
                      },
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildForecastCard(DailyForecast day, String lang) {
    DateTime? date;
    try {
      date = DateTime.parse(day.date);
    } catch (_) {}

    return Container(
      width: 100,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            date != null ? DateFormat('MMM d').format(date) : '-',
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: Color(0xFF475569),
            ),
          ),
          const SizedBox(height: 8),
          Icon(
            _getWeatherIcon(day.weatherCode),
            size: 24,
            color: const Color(0xFF3B82F6),
          ),
          const SizedBox(height: 8),
          Text(
            '${day.maxTemperature?.round() ?? '-'}° / ${day.minTemperature?.round() ?? '-'}°',
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.water_drop, size: 10, color: Color(0xFF64748B)),
              const SizedBox(width: 2),
              Text(
                '${day.precipitationProbability ?? 0}%',
                style: const TextStyle(
                  fontSize: 10,
                  color: Color(0xFF64748B),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildWeatherDetail(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(icon, size: 20, color: const Color(0xFF64748B)),
        const SizedBox(height: 8),
        Text(
          value,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: Color(0xFF0F172A),
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            color: Color(0xFF64748B),
          ),
        ),
      ],
    );
  }

  Widget _buildLoadingState(String lang) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: const Center(
        child: CircularProgressIndicator(color: Color(0xFF3B82F6)),
      ),
    );
  }

  Widget _buildErrorState(BuildContext context, WidgetRef ref, String lang, String error) {
    bool isLocationError = error.contains('WEATHER_LOCATION_UNAVAILABLE');
    String msg = isLocationError ? 'location_unavailable'.tr(lang) : 'temporarily_unavailable'.tr(lang);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF2F2),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFFECACA)),
      ),
      child: Column(
        children: [
          const Icon(Icons.cloud_off, size: 32, color: Color(0xFFEF4444)),
          const SizedBox(height: 12),
          Text(
            'weather_unavailable'.tr(lang),
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: Color(0xFF991B1B),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            msg,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 12,
              color: Color(0xFF991B1B),
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () {
              ref.read(weatherProvider(farmId).notifier).fetchWeather();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFFEE2E2),
              foregroundColor: const Color(0xFF991B1B),
              elevation: 0,
            ),
            child: Text('try_again'.tr(lang), style: const TextStyle(fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    return DateFormat('MMM d, h:mm a').format(date);
  }

  String _getWeatherConditionKey(int? code) {
    if (code == null) return 'not_available';
    switch (code) {
      case 0: return 'clear_sky';
      case 1:
      case 2: return 'partly_cloudy';
      case 3: return 'cloudy';
      case 45:
      case 48: return 'fog';
      case 51:
      case 53:
      case 55: return 'drizzle';
      case 61:
      case 63:
      case 65: return 'rain';
      case 71:
      case 73:
      case 75: return 'snow';
      case 80:
      case 81:
      case 82: return 'rain_showers';
      case 95: return 'thunderstorm';
      case 96:
      case 99: return 'thunderstorm_with_hail';
      default: return 'not_available';
    }
  }

  IconData _getWeatherIcon(int? code) {
    if (code == null) return Icons.cloud_off;
    switch (code) {
      case 0: return Icons.wb_sunny;
      case 1:
      case 2: return Icons.cloud_queue;
      case 3: return Icons.cloud;
      case 45:
      case 48: return Icons.foggy;
      case 51:
      case 53:
      case 55: return Icons.grain;
      case 61:
      case 63:
      case 65: return Icons.water_drop;
      case 71:
      case 73:
      case 75: return Icons.ac_unit;
      case 80:
      case 81:
      case 82: return Icons.shower;
      case 95: return Icons.thunderstorm;
      case 96:
      case 99: return Icons.thunderstorm;
      default: return Icons.cloud_circle;
    }
  }
}
