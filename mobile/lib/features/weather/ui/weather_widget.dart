import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:geolocator/geolocator.dart';
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
    bool isLocationServiceDisabled = error.contains('LOCATION_SERVICES_DISABLED');
    bool isPermissionDeniedForever = error.contains('LOCATION_PERMISSION_DENIED_FOREVER');
    bool isPermissionDenied = error.contains('LOCATION_PERMISSION_DENIED');
    bool isLocationUnavailable = error.contains('WEATHER_LOCATION_UNAVAILABLE') || error.contains('GEOCODING_FAILED');

    String title;
    String msg;

    if (isLocationServiceDisabled) {
      title = 'Location Service Disabled';
      msg = 'Please turn on GPS / Location on your device to fetch live field weather.';
    } else if (isPermissionDeniedForever) {
      title = 'Location Permission Denied';
      msg = 'Location permission is permanently denied. Please enable it in App Settings.';
    } else if (isPermissionDenied) {
      title = 'Location Permission Required';
      msg = 'AgroRent needs location access to stream field-level weather.';
    } else if (isLocationUnavailable) {
      title = 'weather_unavailable'.tr(lang);
      msg = 'Location coordinates unavailable for this farm. Detect via GPS or enter your city/town.';
    } else {
      title = 'weather_unavailable'.tr(lang);
      msg = 'temporarily_unavailable'.tr(lang);
    }

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
          const Icon(Icons.cloud_off, size: 36, color: Color(0xFFEF4444)),
          const SizedBox(height: 12),
          Text(
            title,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: isDark ? const Color(0xFFFCA5A5) : const Color(0xFF991B1B),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            msg,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 12.5,
              color: isDark ? const Color(0xFFF87171) : const Color(0xFF991B1B),
              height: 1.35,
            ),
          ),
          const SizedBox(height: 16),
          // Action Buttons
          if (isLocationServiceDisabled) ...[
            ElevatedButton.icon(
              onPressed: () => Geolocator.openLocationSettings(),
              icon: const Icon(Icons.location_on_rounded, size: 18),
              label: const Text('Turn On Location'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF16A34A),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 8),
            TextButton.icon(
              onPressed: () => _showSearchDialog(context, ref, lang, isDark),
              icon: const Icon(Icons.search_rounded, size: 16),
              label: const Text('Enter Location Manually'),
              style: TextButton.styleFrom(
                foregroundColor: isDark ? Colors.white70 : const Color(0xFF334155),
              ),
            ),
          ] else if (isPermissionDeniedForever) ...[
            ElevatedButton.icon(
              onPressed: () => Geolocator.openAppSettings(),
              icon: const Icon(Icons.settings_rounded, size: 18),
              label: const Text('Open App Settings'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2563EB),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 8),
            TextButton.icon(
              onPressed: () => _showSearchDialog(context, ref, lang, isDark),
              icon: const Icon(Icons.search_rounded, size: 16),
              label: const Text('Enter Location Manually'),
              style: TextButton.styleFrom(
                foregroundColor: isDark ? Colors.white70 : const Color(0xFF334155),
              ),
            ),
          ] else ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      ref.read(weatherProvider(farmId).notifier).fetchWeatherWithGps();
                    },
                    icon: const Icon(Icons.my_location_rounded, size: 16),
                    label: const Text('Use GPS', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF16A34A),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 0,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _showSearchDialog(context, ref, lang, isDark),
                    icon: const Icon(Icons.search_rounded, size: 16),
                    label: const Text('Search', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: isDark ? Colors.white : const Color(0xFF0F172A),
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                      side: BorderSide(color: isDark ? Colors.white24 : const Color(0xFFCBD5E1)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            TextButton.icon(
              onPressed: () {
                ref.read(weatherProvider(farmId).notifier).fetchWeather();
              },
              icon: const Icon(Icons.refresh_rounded, size: 16),
              label: Text('try_again'.tr(lang), style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
              style: TextButton.styleFrom(
                foregroundColor: isDark ? const Color(0xFFFCA5A5) : const Color(0xFF991B1B),
              ),
            ),
          ],
        ],
      ),
    );
  }

  void _showSearchDialog(BuildContext context, WidgetRef ref, String lang, bool isDark) {
    final textController = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: isDark ? const Color(0xFF1E2B22) : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(
          'Search Field Location',
          style: TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w800,
            color: isDark ? Colors.white : const Color(0xFF0F172A),
          ),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Enter your city, town, village, or coordinates (e.g. Poonamallee, Chennai, Guntur, Vijayawada):',
              style: TextStyle(
                fontSize: 12.5,
                color: isDark ? Colors.white70 : const Color(0xFF475569),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: textController,
              autofocus: true,
              style: TextStyle(color: isDark ? Colors.white : Colors.black87),
              decoration: InputDecoration(
                hintText: 'City, town, or coordinates...',
                hintStyle: TextStyle(color: isDark ? Colors.white38 : Colors.grey),
                prefixIcon: const Icon(Icons.location_city_rounded, size: 20),
                filled: true,
                fillColor: isDark ? const Color(0xFF2B3A2F) : const Color(0xFFF1F5F9),
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Cancel', style: TextStyle(color: isDark ? Colors.white60 : Colors.grey.shade600)),
          ),
          ElevatedButton(
            onPressed: () {
              final query = textController.text.trim();
              if (query.isNotEmpty) {
                Navigator.pop(ctx);
                ref.read(weatherProvider(farmId).notifier).fetchWeatherBySearch(query);
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF16A34A),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Get Weather', style: TextStyle(fontWeight: FontWeight.w700)),
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
