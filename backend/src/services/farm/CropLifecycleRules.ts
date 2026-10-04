export interface StageDuration {
  minDays: number;
  maxDays: number;
  avgDays: number;
}

export interface CropLifecycleDefinition {
  cropName: string;
  supportedStages: string[];
  stageOrder: Record<string, number>;
  stageDurations: Record<string, StageDuration>;
  totalDurationDays: StageDuration;
  requiredOperations: Record<string, string[]>;
  harvestStage: string;
  completionStage: string;
  recommendedEquipmentCategory: Record<string, string>;
}

export const CROP_STAGE_SEQUENCE = [
  'SOWING',
  'GERMINATION',
  'SEEDLING',
  'VEGETATIVE',
  'FLOWERING',
  'FRUITING',
  'MATURITY',
  'HARVEST',
  'POST_HARVEST'
];

export const CROP_LIFECYCLE_RULES: Record<string, CropLifecycleDefinition> = {
  RICE: {
    cropName: 'Rice',
    supportedStages: CROP_STAGE_SEQUENCE,
    stageOrder: {
      SOWING: 1,
      GERMINATION: 2,
      SEEDLING: 3,
      VEGETATIVE: 4,
      FLOWERING: 5,
      FRUITING: 6,
      MATURITY: 7,
      HARVEST: 8,
      POST_HARVEST: 9
    },
    stageDurations: {
      SOWING: { minDays: 1, maxDays: 5, avgDays: 3 },
      GERMINATION: { minDays: 5, maxDays: 10, avgDays: 7 },
      SEEDLING: { minDays: 12, maxDays: 20, avgDays: 15 },
      VEGETATIVE: { minDays: 25, maxDays: 45, avgDays: 35 },
      FLOWERING: { minDays: 15, maxDays: 25, avgDays: 20 },
      FRUITING: { minDays: 15, maxDays: 25, avgDays: 20 },
      MATURITY: { minDays: 10, maxDays: 20, avgDays: 15 },
      HARVEST: { minDays: 3, maxDays: 10, avgDays: 5 },
      POST_HARVEST: { minDays: 5, maxDays: 15, avgDays: 10 }
    },
    totalDurationDays: { minDays: 110, maxDays: 150, avgDays: 130 },
    requiredOperations: {
      SOWING: ['Field Preparation', 'Puddling', 'Nursery Sowing'],
      GERMINATION: ['Water Management', 'Seedling Monitoring'],
      SEEDLING: ['Nursery Weeding', 'Transplanting Preparation'],
      VEGETATIVE: ['Transplanting', 'Main Field Weeding', 'First Fertilizer Application'],
      FLOWERING: ['Pest Control', 'Second Fertilizer Application', 'Water Level Maintenance'],
      FRUITING: ['Grain Filling Monitoring', 'Disease Management'],
      MATURITY: ['Field Drainage', 'Harvesting Preparation'],
      HARVEST: ['Combine Harvesting', 'Threshing'],
      POST_HARVEST: ['Drying', 'Straw Management', 'Storage']
    },
    harvestStage: 'HARVEST',
    completionStage: 'POST_HARVEST',
    recommendedEquipmentCategory: {
      SOWING: 'Tractor',
      VEGETATIVE: 'Rotavator',
      HARVEST: 'Harvester'
    }
  },
  COTTON: {
    cropName: 'Cotton',
    supportedStages: [
      'SOWING',
      'GERMINATION',
      'SEEDLING',
      'VEGETATIVE',
      'FLOWERING',
      'FRUITING',
      'MATURITY',
      'HARVEST',
      'POST_HARVEST'
    ],
    stageOrder: {
      SOWING: 1,
      GERMINATION: 2,
      SEEDLING: 3,
      VEGETATIVE: 4,
      FLOWERING: 5,
      FRUITING: 6,
      MATURITY: 7,
      HARVEST: 8,
      POST_HARVEST: 9
    },
    stageDurations: {
      SOWING: { minDays: 1, maxDays: 7, avgDays: 4 },
      GERMINATION: { minDays: 5, maxDays: 12, avgDays: 8 },
      SEEDLING: { minDays: 15, maxDays: 25, avgDays: 20 },
      VEGETATIVE: { minDays: 35, maxDays: 55, avgDays: 45 },
      FLOWERING: { minDays: 20, maxDays: 35, avgDays: 25 },
      FRUITING: { minDays: 30, maxDays: 50, avgDays: 40 },
      MATURITY: { minDays: 15, maxDays: 30, avgDays: 20 },
      HARVEST: { minDays: 10, maxDays: 25, avgDays: 15 },
      POST_HARVEST: { minDays: 5, maxDays: 15, avgDays: 10 }
    },
    totalDurationDays: { minDays: 150, maxDays: 210, avgDays: 180 },
    requiredOperations: {
      SOWING: ['Ploughing', 'Sowing', 'Basal Fertilization'],
      GERMINATION: ['Thinning', 'Gap Filling'],
      SEEDLING: ['Intercultivation', 'Weed Management'],
      VEGETATIVE: ['Earthing Up', 'Nitrogen Top Dressing'],
      FLOWERING: ['Bollworm Management', 'Micronutrient Spray'],
      FRUITING: ['Boll Development Monitoring', 'Irrigation Management'],
      MATURITY: ['Boll Opening Inspection', 'Pre-Harvest Defoliation'],
      HARVEST: ['Cotton Picking', 'Sorting'],
      POST_HARVEST: ['Stalk Uprooting', 'Field Clearing']
    },
    harvestStage: 'HARVEST',
    completionStage: 'POST_HARVEST',
    recommendedEquipmentCategory: {
      SOWING: 'Tractor',
      VEGETATIVE: 'Sprayer',
      HARVEST: 'Cotton Picker'
    }
  },
  MAIZE: {
    cropName: 'Maize',
    supportedStages: CROP_STAGE_SEQUENCE,
    stageOrder: {
      SOWING: 1,
      GERMINATION: 2,
      SEEDLING: 3,
      VEGETATIVE: 4,
      FLOWERING: 5,
      FRUITING: 6,
      MATURITY: 7,
      HARVEST: 8,
      POST_HARVEST: 9
    },
    stageDurations: {
      SOWING: { minDays: 1, maxDays: 5, avgDays: 3 },
      GERMINATION: { minDays: 4, maxDays: 8, avgDays: 6 },
      SEEDLING: { minDays: 10, maxDays: 18, avgDays: 14 },
      VEGETATIVE: { minDays: 25, maxDays: 40, avgDays: 30 },
      FLOWERING: { minDays: 10, maxDays: 18, avgDays: 14 },
      FRUITING: { minDays: 20, maxDays: 30, avgDays: 25 },
      MATURITY: { minDays: 10, maxDays: 20, avgDays: 15 },
      HARVEST: { minDays: 5, maxDays: 12, avgDays: 8 },
      POST_HARVEST: { minDays: 5, maxDays: 10, avgDays: 7 }
    },
    totalDurationDays: { minDays: 90, maxDays: 130, avgDays: 110 },
    requiredOperations: {
      SOWING: ['Deep Ploughing', 'Ridges & Furrows', 'Sowing'],
      GERMINATION: ['Weed Control', 'Moisture Check'],
      SEEDLING: ['Thinning', 'First Top Dressing'],
      VEGETATIVE: ['Earthing Up', 'Second Top Dressing'],
      FLOWERING: ['Tasseling & Silking Monitoring', 'Fall Armyworm Management'],
      FRUITING: ['Cob Filling Inspection', 'Irrigation'],
      MATURITY: ['Cob Drying Check'],
      HARVEST: ['Cob Harvesting', 'Shelling'],
      POST_HARVEST: ['Grain Drying', 'Bagging']
    },
    harvestStage: 'HARVEST',
    completionStage: 'POST_HARVEST',
    recommendedEquipmentCategory: {
      SOWING: 'Tractor',
      VEGETATIVE: 'Cultivator',
      HARVEST: 'Sheller'
    }
  },
  WHEAT: {
    cropName: 'Wheat',
    supportedStages: CROP_STAGE_SEQUENCE,
    stageOrder: {
      SOWING: 1,
      GERMINATION: 2,
      SEEDLING: 3,
      VEGETATIVE: 4,
      FLOWERING: 5,
      FRUITING: 6,
      MATURITY: 7,
      HARVEST: 8,
      POST_HARVEST: 9
    },
    stageDurations: {
      SOWING: { minDays: 1, maxDays: 5, avgDays: 3 },
      GERMINATION: { minDays: 5, maxDays: 10, avgDays: 7 },
      SEEDLING: { minDays: 15, maxDays: 25, avgDays: 20 },
      VEGETATIVE: { minDays: 30, maxDays: 45, avgDays: 35 },
      FLOWERING: { minDays: 10, maxDays: 18, avgDays: 14 },
      FRUITING: { minDays: 20, maxDays: 30, avgDays: 25 },
      MATURITY: { minDays: 10, maxDays: 20, avgDays: 15 },
      HARVEST: { minDays: 3, maxDays: 10, avgDays: 5 },
      POST_HARVEST: { minDays: 5, maxDays: 10, avgDays: 7 }
    },
    totalDurationDays: { minDays: 110, maxDays: 145, avgDays: 125 },
    requiredOperations: {
      SOWING: ['Seed Bed Preparation', 'Drilling Sowing'],
      GERMINATION: ['Crown Root Initiation Irrigation'],
      SEEDLING: ['First Fertilizer Application'],
      VEGETATIVE: ['Tillering Inspection', 'Weed Control'],
      FLOWERING: ['Flag Leaf Protection', 'Irrigation'],
      FRUITING: ['Milking & Dough Stage Monitoring'],
      MATURITY: ['Grain Hardness Check'],
      HARVEST: ['Combine Harvesting', 'Threshing'],
      POST_HARVEST: ['Cleaning', 'Storage']
    },
    harvestStage: 'HARVEST',
    completionStage: 'POST_HARVEST',
    recommendedEquipmentCategory: {
      SOWING: 'Seed Drill',
      VEGETATIVE: 'Sprayer',
      HARVEST: 'Combine Harvester'
    }
  },
  GROUNDNUT: {
    cropName: 'Groundnut',
    supportedStages: CROP_STAGE_SEQUENCE,
    stageOrder: {
      SOWING: 1,
      GERMINATION: 2,
      SEEDLING: 3,
      VEGETATIVE: 4,
      FLOWERING: 5,
      FRUITING: 6,
      MATURITY: 7,
      HARVEST: 8,
      POST_HARVEST: 9
    },
    stageDurations: {
      SOWING: { minDays: 1, maxDays: 5, avgDays: 3 },
      GERMINATION: { minDays: 5, maxDays: 10, avgDays: 7 },
      SEEDLING: { minDays: 12, maxDays: 20, avgDays: 15 },
      VEGETATIVE: { minDays: 20, maxDays: 35, avgDays: 25 },
      FLOWERING: { minDays: 15, maxDays: 25, avgDays: 20 },
      FRUITING: { minDays: 25, maxDays: 40, avgDays: 30 },
      MATURITY: { minDays: 10, maxDays: 20, avgDays: 15 },
      HARVEST: { minDays: 5, maxDays: 12, avgDays: 8 },
      POST_HARVEST: { minDays: 5, maxDays: 12, avgDays: 8 }
    },
    totalDurationDays: { minDays: 100, maxDays: 140, avgDays: 120 },
    requiredOperations: {
      SOWING: ['Deep Tillage', 'Gypsum Basal Application', 'Sowing'],
      GERMINATION: ['Pre-emergence Weed Control'],
      SEEDLING: ['Intercultivation'],
      VEGETATIVE: ['Earthing Up', 'Gypsum Top Dressing'],
      FLOWERING: ['Pegging Stage Protection'],
      FRUITING: ['Pod Development Inspection'],
      MATURITY: ['Foliage Yellowing Check'],
      HARVEST: ['Pod Uprooting', 'Stripping'],
      POST_HARVEST: ['Pod Drying', 'Decorticating']
    },
    harvestStage: 'HARVEST',
    completionStage: 'POST_HARVEST',
    recommendedEquipmentCategory: {
      SOWING: 'Tractor',
      VEGETATIVE: 'Cultivator',
      HARVEST: 'Groundnut Digger'
    }
  },
  SUGARCANE: {
    cropName: 'Sugarcane',
    supportedStages: CROP_STAGE_SEQUENCE,
    stageOrder: {
      SOWING: 1,
      GERMINATION: 2,
      SEEDLING: 3,
      VEGETATIVE: 4,
      FLOWERING: 5,
      FRUITING: 6,
      MATURITY: 7,
      HARVEST: 8,
      POST_HARVEST: 9
    },
    stageDurations: {
      SOWING: { minDays: 1, maxDays: 10, avgDays: 5 },
      GERMINATION: { minDays: 15, maxDays: 35, avgDays: 25 },
      SEEDLING: { minDays: 30, maxDays: 50, avgDays: 40 },
      VEGETATIVE: { minDays: 120, maxDays: 180, avgDays: 150 },
      FLOWERING: { minDays: 30, maxDays: 60, avgDays: 45 },
      FRUITING: { minDays: 30, maxDays: 60, avgDays: 45 },
      MATURITY: { minDays: 45, maxDays: 90, avgDays: 60 },
      HARVEST: { minDays: 15, maxDays: 30, avgDays: 20 },
      POST_HARVEST: { minDays: 10, maxDays: 20, avgDays: 15 }
    },
    totalDurationDays: { minDays: 300, maxDays: 420, avgDays: 360 },
    requiredOperations: {
      SOWING: ['Furrow Preparation', 'Sett Planting'],
      GERMINATION: ['Gap Filling'],
      SEEDLING: ['Partial Earthing Up'],
      VEGETATIVE: ['Grand Growth Irrigation', 'Heavy Earthing Up', 'Trash Tying'],
      FLOWERING: ['Sucrose Accumulation Check'],
      FRUITING: ['Ripping Monitoring'],
      MATURITY: ['Brix Sugar Level Test'],
      HARVEST: ['Cane Harvesting', 'Transport'],
      POST_HARVEST: ['Ratoon Management']
    },
    harvestStage: 'HARVEST',
    completionStage: 'POST_HARVEST',
    recommendedEquipmentCategory: {
      SOWING: 'Tractor',
      VEGETATIVE: 'Ridger',
      HARVEST: 'Sugarcane Harvester'
    }
  },
  TOMATO: {
    cropName: 'Tomato',
    supportedStages: CROP_STAGE_SEQUENCE,
    stageOrder: {
      SOWING: 1,
      GERMINATION: 2,
      SEEDLING: 3,
      VEGETATIVE: 4,
      FLOWERING: 5,
      FRUITING: 6,
      MATURITY: 7,
      HARVEST: 8,
      POST_HARVEST: 9
    },
    stageDurations: {
      SOWING: { minDays: 1, maxDays: 5, avgDays: 3 },
      GERMINATION: { minDays: 4, maxDays: 8, avgDays: 6 },
      SEEDLING: { minDays: 20, maxDays: 30, avgDays: 25 },
      VEGETATIVE: { minDays: 20, maxDays: 35, avgDays: 25 },
      FLOWERING: { minDays: 15, maxDays: 25, avgDays: 20 },
      FRUITING: { minDays: 20, maxDays: 35, avgDays: 25 },
      MATURITY: { minDays: 10, maxDays: 20, avgDays: 15 },
      HARVEST: { minDays: 20, maxDays: 45, avgDays: 30 },
      POST_HARVEST: { minDays: 3, maxDays: 7, avgDays: 5 }
    },
    totalDurationDays: { minDays: 110, maxDays: 160, avgDays: 135 },
    requiredOperations: {
      SOWING: ['Pro-tray Sowing', 'Nursery Protection'],
      GERMINATION: ['Seedling Drenching'],
      SEEDLING: ['Hardening', 'Transplanting to Main Field'],
      VEGETATIVE: ['Staking & Tying', 'Fertigation'],
      FLOWERING: ['Boron & Calcium Spray'],
      FRUITING: ['Fruit Borer Control', 'Drip Irrigation'],
      MATURITY: ['Color Change Inspection'],
      HARVEST: ['Multiple Pickings', 'Grading'],
      POST_HARVEST: ['Crate Packing', 'Market Dispatch']
    },
    harvestStage: 'HARVEST',
    completionStage: 'POST_HARVEST',
    recommendedEquipmentCategory: {
      SOWING: 'Tractor',
      VEGETATIVE: 'Sprayer',
      HARVEST: 'Sorting Crates'
    }
  },
  CHILLI: {
    cropName: 'Chilli',
    supportedStages: CROP_STAGE_SEQUENCE,
    stageOrder: {
      SOWING: 1,
      GERMINATION: 2,
      SEEDLING: 3,
      VEGETATIVE: 4,
      FLOWERING: 5,
      FRUITING: 6,
      MATURITY: 7,
      HARVEST: 8,
      POST_HARVEST: 9
    },
    stageDurations: {
      SOWING: { minDays: 1, maxDays: 5, avgDays: 3 },
      GERMINATION: { minDays: 5, maxDays: 10, avgDays: 7 },
      SEEDLING: { minDays: 30, maxDays: 45, avgDays: 35 },
      VEGETATIVE: { minDays: 25, maxDays: 40, avgDays: 30 },
      FLOWERING: { minDays: 20, maxDays: 35, avgDays: 25 },
      FRUITING: { minDays: 25, maxDays: 40, avgDays: 30 },
      MATURITY: { minDays: 15, maxDays: 25, avgDays: 20 },
      HARVEST: { minDays: 30, maxDays: 60, avgDays: 45 },
      POST_HARVEST: { minDays: 7, maxDays: 15, avgDays: 10 }
    },
    totalDurationDays: { minDays: 140, maxDays: 200, avgDays: 170 },
    requiredOperations: {
      SOWING: ['Raised Bed Nursery Sowing'],
      GERMINATION: ['Damping Off Protection'],
      SEEDLING: ['Main Field Ridge Preparation', 'Transplanting'],
      VEGETATIVE: ['Thrips & Mite Protection', 'Intercultivation'],
      FLOWERING: ['Flower Drop Control Spray'],
      FRUITING: ['Pod Development Fertilization'],
      MATURITY: ['Pod Color Inspection'],
      HARVEST: ['Green / Red Chilli Picking'],
      POST_HARVEST: ['Sun Drying', 'Bagging']
    },
    harvestStage: 'HARVEST',
    completionStage: 'POST_HARVEST',
    recommendedEquipmentCategory: {
      SOWING: 'Tractor',
      VEGETATIVE: 'Power Sprayer',
      HARVEST: 'Drying Yard'
    }
  }
};

/**
 * Returns crop lifecycle rules for a given crop name, with safe case-insensitive fallback.
 */
export function getCropLifecycleRules(cropName: string): CropLifecycleDefinition {
  const normalized = (cropName || 'RICE').trim().toUpperCase();

  if (CROP_LIFECYCLE_RULES[normalized]) {
    return CROP_LIFECYCLE_RULES[normalized];
  }

  // Default fallback rules (using Rice structure)
  const defaultRules = { ...CROP_LIFECYCLE_RULES.RICE };
  defaultRules.cropName = cropName || 'General Crop';
  return defaultRules;
}
