import { prisma } from '../../lib/prisma';
import { emitToUser } from '../../lib/socket';
import { WeatherResponse } from './WeatherService';

export class WeatherAlertService {
  /**
   * Evaluate deterministic weather alert rules and generate notifications.
   * Prevents duplicate alerts for the same condition, farm, and forecast date.
   */
  static async evaluate(userId: string, farmId: string, farmName: string, weather: WeatherResponse) {
    if (!weather.success || !weather.data) return;

    const { forecast } = weather.data;
    if (!forecast || forecast.length === 0) return;

    for (const dayForecast of forecast) {
      if (!dayForecast.date) continue;
      
      const forecastDate = dayForecast.date.split('T')[0]; // Extract YYYY-MM-DD

      // RULE 1: HEAVY_RAIN
      // Trigger: daily precipitation >= 50 mm
      if (dayForecast.precipitation !== null && dayForecast.precipitation >= 50) {
        const relatedId = `${farmId}_HEAVY_RAIN_${forecastDate}`;
        const title = 'Heavy Rain Alert';
        const message = `${dayForecast.precipitation} mm rain is expected on ${forecastDate} at ${farmName}. Ensure proper drainage and avoid spraying.`;
        
        await this.createNotificationIfNotExists(userId, title, message, 'HEAVY_RAIN', relatedId);
      }

      // RULE 2: EXTREME_HEAT
      // Trigger: daily maxTemperature >= 40°C
      if (dayForecast.maxTemperature !== null && dayForecast.maxTemperature >= 40) {
        const relatedId = `${farmId}_EXTREME_HEAT_${forecastDate}`;
        const title = 'Extreme Heat Alert';
        const message = `${dayForecast.maxTemperature}°C maximum temperature is expected on ${forecastDate} at ${farmName}. Ensure adequate irrigation to reduce heat stress.`;
        
        await this.createNotificationIfNotExists(userId, title, message, 'EXTREME_HEAT', relatedId);
      }
    }
  }

  private static async createNotificationIfNotExists(
    userId: string, 
    title: string, 
    message: string, 
    type: string, 
    relatedId: string
  ) {
    // Duplicate prevention
    const existing = await prisma.notification.findFirst({
      where: {
        userId,
        type,
        relatedId
      }
    });

    if (!existing) {
      await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type,
          relatedId
        }
      });
      // Import emitToUser inside method or dynamically to avoid circular dependencies if needed, or import at top
      try {
        emitToUser(userId, 'notification', { title, message, type });
      } catch (e) {
        // Socket emit failure should not crash the alert generation
      }
    }
  }
}
