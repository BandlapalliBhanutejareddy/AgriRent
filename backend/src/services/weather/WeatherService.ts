export interface WeatherResponse {
  success: boolean;
  data?: {
    farmId: string;
    location: {
      latitude: number;
      longitude: number;
      name: string;
    };
    current: {
      temperature: number | null;
      apparentTemperature: number | null;
      humidity: number | null;
      precipitation: number | null;
      rain: number | null;
      weatherCode: number | null;
      windSpeed: number | null;
      windDirection: number | null;
      observedAt: string | null;
    };
    forecast: Array<{
      date: string;
      minTemperature: number | null;
      maxTemperature: number | null;
      precipitation: number | null;
      precipitationProbability: number | null;
      weatherCode: number | null;
    }>;
    source: string;
    fetchedAt: string;
  };
  error?: string;
  code?: string;
}

export class WeatherService {
  private static readonly GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
  private static readonly FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

  /**
   * Resolve a text location to coordinates using Open-Meteo Geocoding API
   */
  static async geocodeLocation(locationText: string): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const url = new URL(this.GEOCODE_URL);
      url.searchParams.append('name', locationText);
      url.searchParams.append('count', '1');
      url.searchParams.append('language', 'en');
      url.searchParams.append('format', 'json');

      const response = await fetch(url.toString());
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return {
          latitude: data.results[0].latitude,
          longitude: data.results[0].longitude,
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  /**
   * Get weather data for a specific farm
   */
  static async getFarmWeather(farmId: string, locationText: string): Promise<WeatherResponse> {
    try {
      const coords = await this.geocodeLocation(locationText);
      if (!coords) {
        return {
          success: false,
          error: 'Weather location could not be resolved to coordinates.',
          code: 'WEATHER_LOCATION_UNAVAILABLE'
        };
      }

      const url = new URL(this.FORECAST_URL);
      url.searchParams.append('latitude', coords.latitude.toString());
      url.searchParams.append('longitude', coords.longitude.toString());
      url.searchParams.append('current', 'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m');
      url.searchParams.append('daily', 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max');
      url.searchParams.append('timezone', 'auto');

      const response = await fetch(url.toString(), {
        signal: AbortSignal.timeout(10000) // 10s timeout
      });

      if (!response.ok) {
        return {
          success: false,
          error: 'Weather provider returned an invalid response.',
          code: 'WEATHER_PROVIDER_INVALID_RESPONSE'
        };
      }

      const data = await response.json();

      // Normalize current
      const currentRaw = data.current || {};
      const current = {
        temperature: currentRaw.temperature_2m ?? null,
        apparentTemperature: currentRaw.apparent_temperature ?? null,
        humidity: currentRaw.relative_humidity_2m ?? null,
        precipitation: currentRaw.precipitation ?? null,
        rain: currentRaw.rain ?? null,
        weatherCode: currentRaw.weather_code ?? null,
        windSpeed: currentRaw.wind_speed_10m ?? null,
        windDirection: currentRaw.wind_direction_10m ?? null,
        observedAt: currentRaw.time ? new Date(currentRaw.time).toISOString() : null,
      };

      // Normalize daily forecast
      const dailyRaw = data.daily || {};
      const forecast = [];
      const daysCount = dailyRaw.time?.length || 0;
      
      for (let i = 0; i < daysCount; i++) {
        forecast.push({
          date: dailyRaw.time[i],
          minTemperature: dailyRaw.temperature_2m_min?.[i] ?? null,
          maxTemperature: dailyRaw.temperature_2m_max?.[i] ?? null,
          precipitation: dailyRaw.precipitation_sum?.[i] ?? null,
          precipitationProbability: dailyRaw.precipitation_probability_max?.[i] ?? null,
          weatherCode: dailyRaw.weather_code?.[i] ?? null,
        });
      }

      return {
        success: true,
        data: {
          farmId,
          location: {
            latitude: coords.latitude,
            longitude: coords.longitude,
            name: locationText
          },
          current,
          forecast,
          source: 'Open-Meteo',
          fetchedAt: new Date().toISOString()
        }
      };
    } catch (error: any) {
      console.error('Weather service error:', error);
      if (error.name === 'TimeoutError') {
        return {
          success: false,
          error: 'Weather provider timeout.',
          code: 'WEATHER_PROVIDER_TIMEOUT'
        };
      }
      return {
        success: false,
        error: 'Failed to retrieve weather data.',
        code: 'WEATHER_SERVICE_ERROR'
      };
    }
  }
}
