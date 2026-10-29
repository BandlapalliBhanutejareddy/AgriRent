/**
 * WeatherService.ts
 * Reliable, coordinate-accurate weather integration with Open-Meteo
 * Supports:
 * - Direct coordinate lookups (Lat/Lng)
 * - Real geocoding search (town/village/city/district)
 * - Reverse geocoding (coordinates to place name)
 * - 7-day agricultural forecast with timezone determination
 * - Coordinate-scoped in-memory caching (15 min TTL)
 * - Zero fabricated data, no hardcoded location fallbacks
 */

export interface GeocodingLocation {
  id?: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string; // State / Province
  admin2?: string; // District
  displayName: string;
}

export interface CurrentWeather {
  temperature: number | null;
  apparentTemperature: number | null;
  humidity: number | null;
  precipitation: number | null;
  rain: number | null;
  weatherCode: number | null;
  weatherDescription: string;
  windSpeed: number | null;
  windDirection: number | null;
  observedAt: string | null;
}

export interface DailyForecast {
  date: string;
  minTemperature: number | null;
  maxTemperature: number | null;
  precipitation: number | null;
  precipitationProbability: number | null;
  weatherCode: number | null;
  weatherDescription: string;
  sunrise?: string | null;
  sunset?: string | null;
}

export interface WeatherLocationInfo {
  latitude: number;
  longitude: number;
  name: string;
  timezone: string;
  elevation?: number;
}

export interface WeatherData {
  farmId: string;
  location: WeatherLocationInfo;
  current: CurrentWeather;
  forecast: DailyForecast[];
  source: string;
  fetchedAt: string;
  isCached?: boolean;
  lastUpdated?: string;
}

export interface WeatherResponse {
  success: boolean;
  data?: WeatherData;
  error?: string;
  code?: string;
}

interface CacheEntry {
  timestamp: number;
  data: WeatherData;
}

export class WeatherService {
  private static readonly GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
  private static readonly FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
  private static readonly CACHE_TTL_MS = 1000 * 60 * 15; // 15 minutes TTL
  private static cache: Map<string, CacheEntry> = new Map();

  /**
   * Translate WMO Weather Code to human-readable description
   */
  public static getWeatherDescription(code: number | null): string {
    if (code == null) return 'Unknown';
    switch (code) {
      case 0: return 'Clear Sky';
      case 1: return 'Mainly Clear';
      case 2: return 'Partly Cloudy';
      case 3: return 'Overcast';
      case 45: case 48: return 'Foggy';
      case 51: return 'Light Drizzle';
      case 53: return 'Moderate Drizzle';
      case 55: return 'Dense Drizzle';
      case 56: case 57: return 'Freezing Drizzle';
      case 61: return 'Slight Rain';
      case 63: return 'Moderate Rain';
      case 65: return 'Heavy Rain';
      case 66: case 67: return 'Freezing Rain';
      case 71: return 'Slight Snowfall';
      case 73: return 'Moderate Snowfall';
      case 75: return 'Heavy Snowfall';
      case 77: return 'Snow Grains';
      case 80: return 'Slight Rain Showers';
      case 81: return 'Moderate Rain Showers';
      case 82: return 'Violent Rain Showers';
      case 85: case 86: return 'Snow Showers';
      case 95: return 'Thunderstorm';
      case 96: case 99: return 'Thunderstorm with Hail';
      default: return 'Variably Cloudy';
    }
  }

  /**
   * Search for locations using Open-Meteo Geocoding API
   */
  static async geocode(query: string, count = 5): Promise<GeocodingLocation[]> {
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return [];
    }

    try {
      const url = new URL(this.GEOCODE_URL);
      url.searchParams.append('name', query.trim());
      url.searchParams.append('count', String(Math.min(Math.max(count, 1), 10)));
      url.searchParams.append('language', 'en');
      url.searchParams.append('format', 'json');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(url.toString(), {
        signal: controller.signal,
        headers: { Accept: 'application/json' }
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return [];
      }

      const data: any = await response.json();
      if (!data.results || !Array.isArray(data.results)) {
        return [];
      }

      return data.results.map((r: any) => {
        const parts = [r.name];
        if (r.admin2 && r.admin2 !== r.name) parts.push(r.admin2);
        if (r.admin1 && r.admin1 !== r.name && r.admin1 !== r.admin2) parts.push(r.admin1);
        if (r.country) parts.push(r.country);

        return {
          id: r.id,
          name: r.name,
          latitude: parseFloat(Number(r.latitude).toFixed(6)),
          longitude: parseFloat(Number(r.longitude).toFixed(6)),
          country: r.country,
          admin1: r.admin1,
          admin2: r.admin2,
          displayName: parts.join(', ')
        };
      });
    } catch (err: any) {
      console.warn('[WeatherService] Geocode error:', err.message);
      return [];
    }
  }

  /**
   * Resolve coordinates to approximate location name
   */
  static async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    try {
      // Use BigDataCloud free client-side / server reverse geocoding API
      const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data: any = await response.json();
        const parts = [];
        if (data.locality) parts.push(data.locality);
        else if (data.city) parts.push(data.city);
        if (data.principalSubdivision) parts.push(data.principalSubdivision);
        if (data.countryName) parts.push(data.countryName);

        if (parts.length > 0) {
          return parts.join(', ');
        }
      }
    } catch (_) {
      // Network or timeout failure on reverse geocode, fallback safely to coordinate label
    }

    return `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;
  }

  /**
   * Fetch real weather data using exact coordinates
   */
  static async getWeatherByCoordinates(params: {
    latitude: number;
    longitude: number;
    locationName?: string;
    farmId?: string;
    bypassCache?: boolean;
  }): Promise<WeatherResponse> {
    const { latitude, longitude, farmId = 'current-lookup', bypassCache = false } = params;

    if (
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      isNaN(latitude) ||
      isNaN(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return {
        success: false,
        error: 'Invalid coordinates provided. Latitude must be between -90 and 90, Longitude between -180 and 180.',
        code: 'INVALID_COORDINATES'
      };
    }

    // Quantize cache key to 4 decimal places (~11 meters resolution) to avoid cross-location cache collisions
    const cacheKey = `${latitude.toFixed(4)}_${longitude.toFixed(4)}`;
    const now = Date.now();
    const cached = this.cache.get(cacheKey);

    if (!bypassCache && cached && now - cached.timestamp < this.CACHE_TTL_MS) {
      return {
        success: true,
        data: {
          ...cached.data,
          farmId,
          isCached: true,
          lastUpdated: new Date(cached.timestamp).toISOString()
        }
      };
    }

    try {
      const url = new URL(this.FORECAST_URL);
      url.searchParams.append('latitude', latitude.toFixed(6));
      url.searchParams.append('longitude', longitude.toFixed(6));
      url.searchParams.append(
        'current',
        'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m'
      );
      url.searchParams.append(
        'daily',
        'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,sunrise,sunset'
      );
      url.searchParams.append('timezone', 'auto');
      url.searchParams.append('forecast_days', '7');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(url.toString(), {
        signal: controller.signal,
        headers: { Accept: 'application/json' }
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Open-Meteo HTTP ${response.status}: ${response.statusText}`);
      }

      const data: any = await response.json();
      const timezone = data.timezone || 'UTC';
      const elevation = data.elevation;

      // Extract location name if not provided
      let resolvedName = params.locationName;
      if (!resolvedName) {
        resolvedName = await this.reverseGeocode(latitude, longitude);
      }

      // Parse current
      const rawCurrent = data.current || {};
      const currentCode = rawCurrent.weather_code != null ? Number(rawCurrent.weather_code) : null;
      const current: CurrentWeather = {
        temperature: rawCurrent.temperature_2m != null ? Number(rawCurrent.temperature_2m) : null,
        apparentTemperature: rawCurrent.apparent_temperature != null ? Number(rawCurrent.apparent_temperature) : null,
        humidity: rawCurrent.relative_humidity_2m != null ? Number(rawCurrent.relative_humidity_2m) : null,
        precipitation: rawCurrent.precipitation != null ? Number(rawCurrent.precipitation) : null,
        rain: rawCurrent.rain != null ? Number(rawCurrent.rain) : null,
        weatherCode: currentCode,
        weatherDescription: this.getWeatherDescription(currentCode),
        windSpeed: rawCurrent.wind_speed_10m != null ? Number(rawCurrent.wind_speed_10m) : null,
        windDirection: rawCurrent.wind_direction_10m != null ? Number(rawCurrent.wind_direction_10m) : null,
        observedAt: rawCurrent.time ? new Date(rawCurrent.time).toISOString() : new Date().toISOString()
      };

      // Parse 7-day daily forecast
      const rawDaily = data.daily || {};
      const forecast: DailyForecast[] = [];
      const daysCount = rawDaily.time?.length || 0;

      for (let i = 0; i < daysCount; i++) {
        const code = rawDaily.weather_code?.[i] != null ? Number(rawDaily.weather_code[i]) : null;
        forecast.push({
          date: rawDaily.time[i],
          minTemperature: rawDaily.temperature_2m_min?.[i] != null ? Number(rawDaily.temperature_2m_min[i]) : null,
          maxTemperature: rawDaily.temperature_2m_max?.[i] != null ? Number(rawDaily.temperature_2m_max[i]) : null,
          precipitation: rawDaily.precipitation_sum?.[i] != null ? Number(rawDaily.precipitation_sum[i]) : null,
          precipitationProbability:
            rawDaily.precipitation_probability_max?.[i] != null
              ? Number(rawDaily.precipitation_probability_max[i])
              : null,
          weatherCode: code,
          weatherDescription: this.getWeatherDescription(code),
          sunrise: rawDaily.sunrise?.[i] || null,
          sunset: rawDaily.sunset?.[i] || null
        });
      }

      const weatherData: WeatherData = {
        farmId,
        location: {
          latitude: parseFloat(latitude.toFixed(6)),
          longitude: parseFloat(longitude.toFixed(6)),
          name: resolvedName,
          timezone,
          elevation
        },
        current,
        forecast,
        source: 'Open-Meteo (open-meteo.com)',
        fetchedAt: new Date().toISOString(),
        isCached: false,
        lastUpdated: new Date().toISOString()
      };

      // Store in coordinate-keyed cache
      this.cache.set(cacheKey, {
        timestamp: now,
        data: weatherData
      });

      return {
        success: true,
        data: weatherData
      };
    } catch (err: any) {
      console.warn('[WeatherService] Open-Meteo provider error:', err.message);

      // Return cached version if present even if expired
      if (cached) {
        return {
          success: true,
          data: {
            ...cached.data,
            farmId,
            isCached: true,
            lastUpdated: new Date(cached.timestamp).toISOString()
          }
        };
      }

      const isTimeout = err.name === 'TimeoutError' || err.name === 'AbortError';
      return {
        success: false,
        error: isTimeout
          ? 'Weather provider timeout. Please check your connection and retry.'
          : `Weather provider error: ${err.message}`,
        code: isTimeout ? 'WEATHER_PROVIDER_TIMEOUT' : 'WEATHER_PROVIDER_ERROR'
      };
    }
  }

  /**
   * Resolve location text and fetch weather
   */
  static async getFarmWeather(farmId: string, locationQuery: string): Promise<WeatherResponse> {
    if (!locationQuery || typeof locationQuery !== 'string' || locationQuery.trim().length === 0) {
      return {
        success: false,
        error: 'Location text is required to resolve weather.',
        code: 'WEATHER_LOCATION_UNAVAILABLE'
      };
    }

    const trimmed = locationQuery.trim();

    // Check if query is in coordinate format (supports formats with °, direction letters, or "Coordinates:")
    const sanitized = trimmed
      .replace(/Coordinates:\s*/i, '')
      .replace(/°/g, '')
      .replace(/[NSEWnsew]/g, '')
      .trim();

    const coordMatch = sanitized.match(/([-+]?[0-9]+\.?[0-9]*)\s*,\s*([-+]?[0-9]+\.?[0-9]*)/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return this.getWeatherByCoordinates({ latitude: lat, longitude: lng, farmId });
      }
    }

    // Geocode query to real coordinates
    const locations = await this.geocode(trimmed, 1);
    if (locations.length === 0) {
      return {
        success: false,
        error: `Could not resolve location "${trimmed}". Please select a city, village, town, or coordinates on the map.`,
        code: 'GEOCODING_FAILED'
      };
    }

    const matched = locations[0];
    return this.getWeatherByCoordinates({
      latitude: matched.latitude,
      longitude: matched.longitude,
      locationName: matched.displayName,
      farmId
    });
  }

  /**
   * Clear in-memory cache
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Inject cache entry for testing
   */
  static setCacheEntry(key: string, entry: CacheEntry): void {
    this.cache.set(key, entry);
  }
}
