/**
 * WeatherAlertService.ts
 * Deterministic agricultural risk engine generating actionable crop and weather alerts.
 * Grounded in ICAR, CRIDA, and IMD Agromet agronomic standards.
 */

import { prisma } from '../../lib/prisma';
import { emitToUser } from '../../lib/socket';
import { WeatherResponse } from './WeatherService';

export interface AlertGenerationContext {
  userId: string;
  farmId: string;
  farmName: string;
  location?: string;
  crops?: Array<{
    id: string;
    cropName: string;
    stage: string;
    sowingDate?: Date | null;
  }>;
}

export class WeatherAlertService {
  /**
   * Evaluate all weather and crop alert rules against real forecast data
   */
  static async evaluate(userId: string, farmId: string, farmName: string, weather: WeatherResponse) {
    if (!weather.success || !weather.data) return;

    try {
      // 1. Fetch farmer preferences
      const preferences = await prisma.farmerAlertPreference.findUnique({
        where: { userId }
      });

      // 2. Fetch farm crops if any
      const farm = await prisma.farm.findUnique({
        where: { id: farmId },
        include: { crops: { where: { status: 'ACTIVE' } } }
      });

      const crops = farm?.crops || [];
      const { forecast, current, location } = weather.data;
      const today = new Date().toISOString().split('T')[0];

      // ============================================================
      // RULE 1: HEAVY RAINFALL RISK (ICAR / IMD Agromet)
      // Rationale: Daily rainfall >= 35 mm saturates root zone, causes water stagnation
      // and severe tractor wheel slippage / compaction during field passes.
      // ============================================================
      if (preferences?.heavyRainAlerts !== false && forecast && forecast.length > 0) {
        for (const day of forecast) {
          if (!day.date) continue;
          const forecastDate = day.date.split('T')[0];
          const precip = day.precipitation ?? 0;
          const prob = day.precipitationProbability ?? 0;

          if (precip >= 35 || (precip >= 20 && prob >= 75)) {
            const isCritical = precip >= 50;
            await this.createFarmerAlertIfNotExists({
              userId,
              farmId,
              location: location?.name,
              category: 'WEATHER_HEAVY_RAIN',
              severity: isCritical ? 'CRITICAL' : 'WARNING',
              title: `${isCritical ? 'Severe' : 'Heavy'} Rainfall Warning (${precip} mm)`,
              description: `Forecast predicts ${precip} mm precipitation with ${prob}% probability on ${forecastDate} at ${farmName}. Heavy water ingress expected.`,
              recommendedAction: 'Postpone tractor tillage, rotavator passes, and direct seeding. Inspect field bunds and ensure surface drainage outlets are unblocked to prevent root asphyxiation.',
              expiresAt: new Date(new Date(day.date).getTime() + 24 * 60 * 60 * 1000)
            });
            break; // One heavy rain alert per forecast window
          }
        }
      }

      // ============================================================
      // RULE 2: STRONG WIND ADVISORY (CIBRC Spray Drift Standard)
      // Rationale: Surface wind >= 20 km/h causes pesticide droplet drift > 30m,
      // leading to chemical wastage, reduced pest control, and environmental risk.
      // ============================================================
      if (preferences?.strongWindAlerts !== false) {
        const wind = current?.windSpeed ?? 0;
        if (wind >= 20) {
          await this.createFarmerAlertIfNotExists({
            userId,
            farmId,
            location: location?.name,
            category: 'WEATHER_STRONG_WIND',
            severity: 'WARNING',
            title: `High Wind Spray Drift Risk (${wind} km/h)`,
            description: `Current surface wind speed is ${wind} km/h at ${farmName}. Standard pesticide application is unsafe above 15 km/h.`,
            recommendedAction: 'Pause all tractor boom sprayers, drone spraying, and knapsack operations until wind subsides to prevent off-target chemical drift.',
            expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000) // 6h expiry
          });
        }
      }

      // ============================================================
      // RULE 3: HEAT STRESS & EVAPOTRANSPIRATION RISK (CRIDA Standard)
      // Rationale: Ambient temp >= 38°C drastically increases vapor pressure deficit,
      // inducing flower drop, pollen sterility, and rapid canopy moisture depletion.
      // ============================================================
      if (preferences?.heatStressAlerts !== false && forecast && forecast.length > 0) {
        for (const day of forecast) {
          if (!day.date) continue;
          const maxT = day.maxTemperature ?? 0;
          if (maxT >= 38) {
            const isExtreme = maxT >= 42;
            await this.createFarmerAlertIfNotExists({
              userId,
              farmId,
              location: location?.name,
              category: 'WEATHER_HEAT_STRESS',
              severity: isExtreme ? 'CRITICAL' : 'WARNING',
              title: `${isExtreme ? 'Severe' : 'Elevated'} Heat Stress Risk (${maxT}°C)`,
              description: `Maximum daytime temperature is forecast to reach ${maxT}°C on ${day.date.split('T')[0]} at ${farmName}.`,
              recommendedAction: 'Apply light irrigation during early morning (before 8:00 AM) or evening to lower soil temperature and mitigate canopy desiccation.',
              expiresAt: new Date(new Date(day.date).getTime() + 24 * 60 * 60 * 1000)
            });
            break;
          }
        }
      }

      // ============================================================
      // RULE 4: FROST / COLD SHOCK RISK (Horticultural Crop Standard)
      // Rationale: Minimum temperatures <= 4°C induce ice crystal formation
      // in sensitive horticultural and vegetable foliage.
      // ============================================================
      if (preferences?.frostAlerts !== false && forecast && forecast.length > 0) {
        for (const day of forecast) {
          if (!day.date) continue;
          const minT = day.minTemperature;
          if (minT !== null && minT <= 4) {
            await this.createFarmerAlertIfNotExists({
              userId,
              farmId,
              location: location?.name,
              category: 'WEATHER_FROST',
              severity: 'CRITICAL',
              title: `Frost & Cold Shock Warning (${minT}°C)`,
              description: `Minimum temperature is forecast to drop to ${minT}°C on ${day.date.split('T')[0]} at ${farmName}.`,
              recommendedAction: 'Provide light night-time sprinkler irrigation or smoke cover to maintain canopy temperature above the freezing threshold.',
              expiresAt: new Date(new Date(day.date).getTime() + 24 * 60 * 60 * 1000)
            });
            break;
          }
        }
      }

      // ============================================================
      // RULE 5: PROLONGED DRY SPELL & IRRIGATION SCHEDULING
      // Rationale: 5+ consecutive days with rain < 1 mm and max temp >= 32°C.
      // ============================================================
      if (preferences?.dryConditionsAlerts !== false && forecast && forecast.length >= 5) {
        const dryDays = forecast.slice(0, 5).filter(d => (d.precipitation ?? 0) < 1 && (d.maxTemperature ?? 0) >= 32);
        if (dryDays.length >= 5) {
          await this.createFarmerAlertIfNotExists({
            userId,
            farmId,
            location: location?.name,
            category: 'WEATHER_DRY_SPELL',
            severity: 'ADVISORY',
            title: 'Prolonged Dry Conditions Advisory',
            description: `Forecast projects continuous dry conditions with temperatures averaging >32°C over the next 5 days at ${farmName}.`,
            recommendedAction: 'Check topsoil moisture in the root zone. Schedule furrow or drip irrigation to prevent moisture stress before wilting occurs.',
            expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
          });
        }
      }

      // ============================================================
      // RULE 6: CROP-SPECIFIC GROWTH STAGE & WEEDING/HARVEST REMINDERS
      // ============================================================
      if (preferences?.cropStageAlerts !== false && crops.length > 0) {
        for (const crop of crops) {
          const stage = (crop.stage || '').toUpperCase();
          const cropName = crop.cropName;

          if (stage === 'FLOWERING') {
            await this.createFarmerAlertIfNotExists({
              userId,
              farmId,
              farmCropId: crop.id,
              cropName,
              location: location?.name,
              category: 'CROP_STAGE_REMINDER',
              severity: 'ADVISORY',
              title: `Critical Flowering Stage Management — ${cropName}`,
              description: `${cropName} is in the moisture-critical flowering stage. Moisture deficit at flowering causes spikelet sterility and yield drop.`,
              recommendedAction: 'Maintain a consistent 2-3 cm shallow water layer (or field capacity soil moisture). Avoid any heavy nitrogen top-dressing.',
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            });
          } else if (stage === 'HARVEST' || stage === 'MATURITY') {
            await this.createFarmerAlertIfNotExists({
              userId,
              farmId,
              farmCropId: crop.id,
              cropName,
              location: location?.name,
              category: 'CROP_HARVEST_PLANNING',
              severity: 'ADVISORY',
              title: `Harvest Logistics & Combine Availability — ${cropName}`,
              description: `${cropName} is reaching harvest maturity. Dry weather over upcoming days offers an optimal harvesting window.`,
              recommendedAction: 'Confirm combine harvester rental in AgroRent marketplace 48 hours prior to harvest to lock in preferred dates.',
              expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
            });
          }
        }
      }
    } catch (err: any) {
      console.warn('[WeatherAlertService] Rule evaluation warning:', err.message);
    }
  }

  /**
   * Save alert in database with deduplication (prevents duplicate alerts within active window)
   */
  private static async createFarmerAlertIfNotExists(alertData: {
    userId: string;
    farmId?: string;
    farmCropId?: string;
    cropName?: string;
    location?: string;
    category: string;
    severity: string;
    title: string;
    description: string;
    recommendedAction?: string;
    expiresAt?: Date;
  }) {
    const { userId, farmId, category, title, description, recommendedAction, severity, cropName, location, expiresAt, farmCropId } = alertData;

    // Deduplication check: check if same category & title was issued in the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await prisma.farmerAlert.findFirst({
      where: {
        userId,
        category,
        title,
        createdAt: { gte: oneDayAgo }
      }
    });

    if (existing) {
      return; // Deduplicated
    }

    // Persist to FarmerAlert table
    const newAlert = await prisma.farmerAlert.create({
      data: {
        userId,
        farmId: farmId || null,
        farmCropId: farmCropId || null,
        cropName: cropName || null,
        location: location || null,
        category,
        severity,
        title,
        description,
        recommendedAction: recommendedAction || null,
        expiresAt: expiresAt || null
      }
    });

    // Also mirror into Notification table for uniform in-app platform hub
    const notif = await prisma.notification.create({
      data: {
        userId,
        title: `${severity === 'CRITICAL' ? '🚨 ' : severity === 'WARNING' ? '⚠️ ' : '🌾 '}${title}`,
        message: `${description} Action: ${recommendedAction || 'Review advisory in Alert Center.'}`,
        relatedId: newAlert.id,
        type: category
      }
    });

    // Real-time WebSocket delivery
    try {
      emitToUser(userId, 'farmer_alert', newAlert);
      emitToUser(userId, 'new_notification', notif);
    } catch (_) {}
  }
}
