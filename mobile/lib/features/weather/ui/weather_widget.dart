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
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (weatherState.isLoading && weatherState.weatherData == null) {
      return _buildLoadingState(lang, isDark);
    }

    if (weatherState.error != null) {
      return _buildErrorState(context, ref, lang, weatherState.error!, isDark);
    }

    if (weatherState.weatherData == null) {
      return const SizedBox.shrink();
    }

    final data = weatherState.weatherData!;
    final current = data.current;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E3528) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? Colors.white10 : const Color(0xFFE2E8F0),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 3),
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
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 16,
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                        letterSpacing: -0.5,
                      ),
                    ),
                  ],
                ),
                IconButton(
                  icon: Icon(Icons.refresh, color: isDark ? Colors.white70 : const Color(0xFF64748B)),
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
            Divider(height: 1, color: isDark ? Colors.white12 : const Color(0xFFF1F5F9)),

          Padding(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.location_on, size: 14, color: isDark ? Colors.white70 : const Color(0xFF64748B)),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        data.location.name,
                        style: TextStyle(
                          color: isDark ? Colors.white70 : const Color(0xFF64748B),
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
                          style: TextStyle(
                            fontSize: 32,
                            fontWeight: FontWeight.w800,
                            color: isDark ? Colors.white : const Color(0xFF0F172A),
                            letterSpacing: -1,
                          ),
                        ),
                        Text(
                          _getWeatherConditionKey(current.weatherCode).tr(lang),
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: isDark ? Colors.white70 : const Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  '${'feels_like'.tr(lang)} ${current.apparentTemperature != null ? '${current.apparentTemperature}°C' : 'not_available'.tr(lang)}',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: isDark ? Colors.white60 : const Color(0xFF475569),
                  ),
                ),
                const SizedBox(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildWeatherDetail('humidity'.tr(lang), current.humidity != null ? '${current.humidity}%' : '-', Icons.water_drop_outlined, isDark),
                    _buildWeatherDetail('rain'.tr(lang), current.rain != null ? '${current.rain} mm' : '-', Icons.umbrella_outlined, isDark),
                    _buildWeatherDetail('wind'.tr(lang), current.windSpeed != null ? '${current.windSpeed} km/h' : '-', Icons.air_outlined, isDark),
                  ],
                ),
                const SizedBox(height: 20),
                Text(
                  '${'updated'.tr(lang)} ${_formatDate(data.fetchedAt)}',
                  style: TextStyle(
                    fontSize: 11,
                    color: isDark ? Colors.white38 : const Color(0xFF94A3B8),
                  ),
                ),
              ],
            ),
          ),
          
          if (data.forecast.isNotEmpty) ...[
            Divider(height: 1, color: isDark ? Colors.white12 : const Color(0xFFF1F5F9)),
            Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'forecast'.tr(lang).toUpperCase(),
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 12,
                      color: isDark ? Colors.white70 : const Color(0xFF64748B),
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
                        return _buildForecastCard(day, lang, isDark);
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

  Widget _buildForecastCard(DailyForecast day, String lang, bool isDark) {
    DateTime? date;
    try {
      date = DateTime.parse(day.date);
    } catch (_) {}

    return Container(
      width: 100,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF16281E) : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isDark ? Colors.white12 : const Color(0xFFF1F5F9)),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            date != null ? DateFormat('MMM d').format(date) : '-',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: isDark ? Colors.white70 : const Color(0xFF475569),
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
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: isDark ? Colors.white : const Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.water_drop, size: 10, color: isDark ? Colors.white60 : const Color(0xFF64748B)),
              const SizedBox(width: 2),
              Text(
                '${day.precipitationProbability ?? 0}%',
                style: TextStyle(
                  fontSize: 10,
                  color: isDark ? Colors.white60 : const Color(0xFF64748B),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildWeatherDetail(String label, String value, IconData icon, bool isDark) {
    return Column(
      children: [
        Icon(icon, size: 20, color: isDark ? const Color(0xFF4ADE80) : const Color(0xFF64748B)),
        const SizedBox(height: 8),
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: isDark ? Colors.white : const Color(0xFF0F172A),
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            color: isDark ? Colors.white70 : const Color(0xFF64748B),
          ),
        ),
      ],
    );
  }

  Widget _buildLoadingState(String lang, bool isDark) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E3528) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDark ? Colors.white10 : const Color(0xFFE2E8F0)),
      ),
      child: const Center(
        child: CircularProgressIndicator(color: Color(0xFF22C55E)),
      ),
    );
  }

  Widget _buildErrorState(BuildContext context, WidgetRef ref, String lang, String error, bool isDark) {
    bool isLocationError = error.contains('WEATHER_LOCATION_UNAVAILABLE');
    String msg = isLocationError ? 'location_unavailable'.tr(lang) : 'temporarily_unavailable'.tr(lang);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E3528) : const Color(0xFFFEF2F2),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDark ? Colors.white12 : const Color(0xFFFECACA)),
      ),
      child: Column(
        children: [
          const Icon(Icons.cloud_off, size: 32, color: Color(0xFFEF4444)),
          const SizedBox(height: 12),
          Text(
            'weather_unavailable'.tr(lang),
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: isDark ? const Color(0xFFFCA5A5) : const Color(0xFF991B1B),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            msg,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 12,
              color: isDark ? const Color(0xFFF87171) : const Color(0xFF991B1B),
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () {
              ref.read(weatherProvider(farmId).notifier).fetchWeather();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: isDark ? const Color(0xFF7F1D1D) : const Color(0xFFFEE2E2),
              foregroundColor: isDark ? Colors.white : const Color(0xFF991B1B),
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
