import { prisma } from '../../lib/prisma';

export interface FarmerProfileInput {
  crop: string;
  soilType?: string;
  acreage: number | string;
  location?: string;
  season?: string;
  farmingStage?: string;
  cropStage?: string;
  objective?: string;
  budget?: number | string;
  question?: string;
  language?: string;
}

export interface MatchedEquipmentResult {
  id: string;
  title: string;
  category: string;
  pricePerDay: number;
  imageUrl: string;
  location: string | null;
  available: boolean;
  owner: {
    id: string;
    name: string;
    phone: string | null;
  };
  matchScore: number;
  matchTier: string;
  matchReason: string;
  estimatedTotalCost: number;
  recommendedDays: number;
}

export class EquipmentRecommendationService {
  /**
   * Fetch relevant farming knowledge guides and modern techniques from real DB
   */
  public async getRelevantKnowledgeBase(crop: string, stage?: string) {
    try {
      const cropQuery = crop.trim().toLowerCase();
      const guides = await prisma.farmingGuide.findMany({
        where: {
          cropName: { contains: cropQuery, mode: 'insensitive' }
        },
        take: 3
      });

      const techniques = await prisma.modernTechnique.findMany({
        where: {
          relatedCrop: { contains: cropQuery, mode: 'insensitive' }
        },
        take: 3
      });

      return { guides, techniques };
    } catch (err: any) {
      console.warn('[Knowledge Base Retrieval] Error fetching guides:', err.message);
      return { guides: [], techniques: [] };
    }
  }

  /**
   * Alias for recommendEquipment
   */
  /**
   * Dynamic recommendEquipment that derives intent from question and crop stage
   */
  public async recommendEquipment(farmer: FarmerProfileInput): Promise<MatchedEquipmentResult[]> {
    const q = (farmer.question || '').toLowerCase();
    const stage = (farmer.cropStage || farmer.farmingStage || 'LAND_PREPARATION').toUpperCase();
    
    let targetCategories = ['IMPLEMENTS', 'TRACTORS', 'TRACTOR', 'POWER_TILLERS', 'HARVESTERS', 'HARVESTER', 'IRRIGATION', 'CULTIVATOR'];
    
    if (q.includes('land') || q.includes('prep') || q.includes('plough') || q.includes('plow') || q.includes('rotavator') || q.includes('till') || q.includes('levell')) {
      targetCategories = ['IMPLEMENTS', 'CULTIVATOR', 'TRACTORS', 'TRACTOR', 'POWER_TILLERS'];
    } else if (q.includes('flower') || q.includes('spray') || q.includes('pest') || q.includes('disease') || q.includes('protect') || q.includes('insect') || q.includes('weed')) {
      targetCategories = ['IMPLEMENTS', 'POWER_TILLERS', 'TRACTORS', 'TRACTOR'];
    } else if (q.includes('irrigat') || q.includes('water') || q.includes('pump') || q.includes('moist') || q.includes('drip') || q.includes('dry')) {
      targetCategories = ['IRRIGATION', 'IMPLEMENTS', 'POWER_TILLERS'];
    } else if (q.includes('harvest') || q.includes('thresh') || q.includes('cut') || q.includes('reap') || q.includes('yield') || q.includes('trolley')) {
      targetCategories = ['HARVESTERS', 'HARVESTER', 'IMPLEMENTS'];
    } else if (stage.includes('LAND') || stage.includes('PREP')) {
      targetCategories = ['IMPLEMENTS', 'CULTIVATOR', 'TRACTORS', 'TRACTOR'];
    } else if (stage.includes('FLOWER') || stage.includes('VEGETAT')) {
      targetCategories = ['IMPLEMENTS', 'IRRIGATION', 'POWER_TILLERS', 'TRACTORS', 'TRACTOR'];
    } else if (stage.includes('HARVEST')) {
      targetCategories = ['HARVESTERS', 'HARVESTER', 'IMPLEMENTS'];
    }

    return this.matchEquipment(farmer, targetCategories, 2);
  }

  /**
   * Query database for real equipment and calculate Smart Equipment Match Score (0-100)
   */
  public async matchEquipment(
    farmer: FarmerProfileInput,
    recommendedCategories: string[],
    recommendedDays: number = 2
  ): Promise<MatchedEquipmentResult[]> {
    const acreageNum = typeof farmer.acreage === 'number' ? farmer.acreage : parseFloat(String(farmer.acreage)) || 5;
    const budgetNum = farmer.budget ? (typeof farmer.budget === 'number' ? farmer.budget : parseFloat(String(farmer.budget))) : 0;
    const stage = (farmer.cropStage || farmer.farmingStage || 'LAND_PREPARATION').toUpperCase();
    const loc = (farmer.location || '').toLowerCase();
    const crop = (farmer.crop || '').toLowerCase();
    const q = (farmer.question || '').toLowerCase();

    // 1. Fetch ONLY real available equipment from PostgreSQL
    const availableEquipment = await prisma.equipment.findMany({
      where: { available: true },
      include: {
        owner: {
          select: { id: true, name: true, phone: true }
        }
      }
    });

    if (!availableEquipment || availableEquipment.length === 0) {
      return [];
    }

    // 2. Score each equipment item against farmer profile and specific question intent
    const scoredList = availableEquipment.map((item) => {
      let score = 0;

      const itemCategory = (item.category || '').toUpperCase();
      const itemTitle = (item.title || '').toLowerCase();
      const itemDesc = (item.description || '').toLowerCase();
      const itemLoc = (item.location || '').toLowerCase();

      // Specific Question Intent Matching (Max 40 pts)
      let questionMatchBonus = 0;
      if (q.includes('land') || q.includes('prep') || q.includes('plough') || q.includes('rotavator') || q.includes('till') || q.includes('levell')) {
        if (itemTitle.includes('rotavator') || itemTitle.includes('leveller') || itemCategory.includes('CULTIVATOR')) {
          questionMatchBonus = 40;
        } else if (itemCategory.includes('TRACTOR') || itemCategory.includes('IMPLEMENT')) {
          questionMatchBonus = 30;
        }
      } else if (q.includes('flower') || q.includes('spray') || q.includes('pest') || q.includes('protect')) {
        if (itemTitle.includes('sprayer') || itemTitle.includes('boom') || itemTitle.includes('weeder')) {
          questionMatchBonus = 40;
        } else if (itemCategory.includes('IMPLEMENT') || itemCategory.includes('POWER_TILLER')) {
          questionMatchBonus = 25;
        }
      } else if (q.includes('irrigat') || q.includes('water') || q.includes('pump') || q.includes('moist')) {
        if (itemCategory.includes('IRRIGATION') || itemTitle.includes('pump') || itemTitle.includes('water')) {
          questionMatchBonus = 40;
        } else if (itemTitle.includes('sprayer') || itemCategory.includes('IMPLEMENT')) {
          questionMatchBonus = 20;
        }
      } else if (q.includes('budget') || q.includes('cheap') || q.includes('priorit') || q.includes('cost') || q.includes('limit')) {
        // High bonus for affordable tools
        if (item.pricePerDay <= 1000) {
          questionMatchBonus = 40;
        } else if (item.pricePerDay <= 2000) {
          questionMatchBonus = 25;
        } else {
          questionMatchBonus = 5;
        }
      } else if (q.includes('harvest') || q.includes('thresh') || q.includes('yield') || q.includes('reap')) {
        if (itemCategory.includes('HARVEST') || itemTitle.includes('harvester') || itemTitle.includes('thresher')) {
          questionMatchBonus = 40;
        } else if (itemTitle.includes('trolley')) {
          questionMatchBonus = 30;
        }
      } else if (q.includes('precaution') || q.includes('safe') || q.includes('risk') || q.includes('rain')) {
        if (itemTitle.includes('sprayer') || itemCategory.includes('IRRIGATION') || itemTitle.includes('rotavator')) {
          questionMatchBonus = 35;
        } else {
          questionMatchBonus = 20;
        }
      }

      // Weight 1: Category Match (Max 25 pts)
      const isDirectCategoryMatch = recommendedCategories.some(c => 
        itemCategory.includes(c.toUpperCase()) || c.toUpperCase().includes(itemCategory)
      );

      if (isDirectCategoryMatch) {
        score += 25;
      } else {
        score += 10;
      }

      score += questionMatchBonus;

      // Weight 2: Acreage & Scale Suitability (Max 15 pts)
      if (acreageNum <= 10) {
        if (itemTitle.includes('40') || itemTitle.includes('45') || itemTitle.includes('rotavator') || itemTitle.includes('pump') || itemTitle.includes('sprayer') || itemCategory.includes('IMPLEMENT')) {
          score += 15;
        } else {
          score += 10;
        }
      } else {
        if (itemTitle.includes('50') || itemTitle.includes('55') || itemCategory.includes('HARVEST') || itemTitle.includes('boom')) {
          score += 15;
        } else {
          score += 8;
        }
      }

      // Weight 3: Soil & Crop Compatibility (Max 10 pts)
      if (crop && (itemTitle.includes(crop) || itemDesc.includes(crop))) {
        score += 10;
      } else {
        score += 6;
      }

      // Weight 4: Location Match (Max 10 pts)
      if (loc && itemLoc && (itemLoc.includes(loc) || loc.includes(itemLoc))) {
        score += 10;
      } else {
        score += 6;
      }

      // Weight 5: Budget Compatibility (Max 10 pts)
      const estTotalCost = item.pricePerDay * recommendedDays;
      if (budgetNum > 0) {
        if (estTotalCost <= budgetNum) {
          score += 10;
        } else if (estTotalCost <= budgetNum * 1.2) {
          score += 5;
        } else {
          score += 2;
        }
      } else {
        score += 8;
      }

      // Normalize score to 0–100
      const finalScore = Math.min(100, Math.max(0, Math.round(score)));

      // Determine match tier
      let matchTier = 'Possible Match';
      if (finalScore >= 85) matchTier = 'Excellent Match';
      else if (finalScore >= 70) matchTier = 'Very Good Match';
      else if (finalScore >= 55) matchTier = 'Good Match';
      else if (finalScore >= 40) matchTier = 'Possible Match';
      else matchTier = 'Not Recommended';

      const matchReason = `${item.title} (${item.category}) matched for ${farmer.crop || 'Crop'} (Stage: ${stage}, Question context) with ${finalScore}% suitability`;

      return {
        id: item.id,
        title: item.title,
        category: item.category,
        pricePerDay: item.pricePerDay,
        imageUrl: item.imageUrl || '/placeholder.png',
        location: item.location,
        available: item.available,
        owner: {
          id: item.owner.id,
          name: item.owner.name,
          phone: item.owner.phone
        },
        matchScore: finalScore,
        matchTier,
        matchReason,
        estimatedTotalCost: estTotalCost,
        recommendedDays
      };
    });

    // 3. Sort by matchScore descending and return top matches
    return scoredList.sort((a, b) => b.matchScore - a.matchScore).slice(0, 6);
  }
}

export const equipmentRecommendationService = new EquipmentRecommendationService();
