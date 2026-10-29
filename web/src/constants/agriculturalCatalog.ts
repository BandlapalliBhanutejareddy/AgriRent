export interface EquipmentCategoryDefinition {
  id: string;
  name: string;
  description: string;
  iconName: string;
}

export interface EquipmentCatalogItem {
  id: string;
  name: string;
  categoryId: string;
  defaultPricePerDay: number;
  description: string;
  defaultImageUrl: string;
}

export const AGRICULTURAL_CATEGORIES: EquipmentCategoryDefinition[] = [
  {
    id: 'TRACTORS_AND_POWER_UNITS',
    name: 'Tractors & Power Units',
    description: 'Primary motive power units for farming operations',
    iconName: 'Tractor'
  },
  {
    id: 'LAND_PREPARATION',
    name: 'Land Preparation Equipment',
    description: 'Ploughs, rotavators, tillers, harrows & land levellers',
    iconName: 'Layers'
  },
  {
    id: 'SEEDING_AND_PLANTING',
    name: 'Seeding & Planting Equipment',
    description: 'Precision seed drills, planters & transplanters',
    iconName: 'Sprout'
  },
  {
    id: 'CROP_CARE_AND_INTERCULTURE',
    name: 'Crop Care & Inter-Culture Equipment',
    description: 'Weeders, inter-cultivators & boom sprayers',
    iconName: 'ShieldAlert'
  },
  {
    id: 'IRRIGATION_EQUIPMENT',
    name: 'Irrigation Equipment',
    description: 'Water pumps, drip sets, rain guns & pipes',
    iconName: 'Droplets'
  },
  {
    id: 'HARVESTING_EQUIPMENT',
    name: 'Harvesting Equipment',
    description: 'Combine harvesters, reapers & crop diggers',
    iconName: 'Scissors'
  },
  {
    id: 'THRESHING_AND_POST_HARVEST',
    name: 'Threshing & Post-Harvest Equipment',
    description: 'Multi-crop threshers, shellers, balers & dryers',
    iconName: 'RefreshCw'
  },
  {
    id: 'MATERIAL_HANDLING_AND_TRANSPORT',
    name: 'Material Handling & Transport',
    description: 'Trolleys, tippers, carriers & conveyors',
    iconName: 'Truck'
  },
  {
    id: 'SOIL_TESTING_AND_TOOLS',
    name: 'Soil Testing & Measurement Tools',
    description: 'pH meters, soil moisture testers & GPS survey kits',
    iconName: 'Activity'
  },
  {
    id: 'CROP_PROCESSING',
    name: 'Crop Processing Equipment',
    description: 'Mills, oil expellers, chaff cutters & cleaners',
    iconName: 'Cpu'
  },
  {
    id: 'STORAGE_EQUIPMENT',
    name: 'Storage Equipment',
    description: 'Silos, cold storage rooms, crates & bins',
    iconName: 'Archive'
  },
  {
    id: 'HAND_TOOLS',
    name: 'Hand Tools',
    description: 'Hoes, spades, shovels, sickles & shears',
    iconName: 'Wrench'
  },
  {
    id: 'SPECIALIZED_CROP_EQUIPMENT',
    name: 'Specialized Crop Equipment',
    description: 'Paddy transplanters, cotton pickers & cane planters',
    iconName: 'Sparkles'
  },
  {
    id: 'SAFETY_AND_ACCESSORIES',
    name: 'Safety & Accessories',
    description: 'PPE, safety helmets, protective suits, gloves & boots',
    iconName: 'Shield'
  }
];

export const EQUIPMENT_CATALOG_ITEMS: EquipmentCatalogItem[] = [
  // 1. Tractors & Power Units
  {
    id: 'tractor_35_50',
    name: 'Tractor (35–50 HP)',
    categoryId: 'TRACTORS_AND_POWER_UNITS',
    defaultPricePerDay: 1500,
    description: 'Medium utility tractor suitable for ploughing, haulage, and sowing operations.',
    defaultImageUrl: 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'tractor_50_75',
    name: 'Tractor (50–75 HP)',
    categoryId: 'TRACTORS_AND_POWER_UNITS',
    defaultPricePerDay: 2200,
    description: 'Heavy duty tractor designed for rotavators, heavy tillage, and commercial trailers.',
    defaultImageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'tractor_75_plus',
    name: 'Tractor (75+ HP)',
    categoryId: 'TRACTORS_AND_POWER_UNITS',
    defaultPricePerDay: 3200,
    description: 'High horsepower flagship tractor for large-scale combine harvesters and deep subsoiling.',
    defaultImageUrl: 'https://images.unsplash.com/photo-1530267981375-f0de937f5f13?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'power_tiller',
    name: 'Power Tiller',
    categoryId: 'TRACTORS_AND_POWER_UNITS',
    defaultPricePerDay: 800,
    description: 'Rotary tiller walk-behind machine ideal for wet paddy preparation and hilly terrain.',
    defaultImageUrl: 'https://images.unsplash.com/photo-1589820296156-2454bb8a6ad1?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'mini_tractor',
    name: 'Mini Tractor',
    categoryId: 'TRACTORS_AND_POWER_UNITS',
    defaultPricePerDay: 1100,
    description: 'Compact 4WD tractor designed for orchards, vineyards, and narrow field inter-cultivation.',
    defaultImageUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80'
  },

  // 2. Land Preparation Equipment
  {
    id: 'rotavator',
    name: 'Rotavator',
    categoryId: 'LAND_PREPARATION',
    defaultPricePerDay: 900,
    description: 'Rotary tiller with curved blades for pulverizing soil into a fine seedbed in one pass.',
    defaultImageUrl: 'https://images.unsplash.com/photo-1589820296156-2454bb8a6ad1?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'cultivator',
    name: 'Cultivator',
    categoryId: 'LAND_PREPARATION',
    defaultPricePerDay: 500,
    description: 'Spring-loaded 9-tine or 11-tine secondary tillage cultivator for stirring and aerating soil.',
    defaultImageUrl: 'https://images.unsplash.com/photo-1589820296156-2454bb8a6ad1?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'mb_plough',
    name: 'Mould Board Plough',
    categoryId: 'LAND_PREPARATION',
    defaultPricePerDay: 600,
    description: 'Heavy-duty primary inversion plough for deep soil turning and burying trash.',
    defaultImageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'disc_plough',
    name: 'Disc Plough',
    categoryId: 'LAND_PREPARATION',
    defaultPricePerDay: 650,
    description: 'Independently rotating concave disc plough ideal for stony and root-bound dry soil.',
    defaultImageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'laser_leveler',
    name: 'Laser Land Leveler',
    categoryId: 'LAND_PREPARATION',
    defaultPricePerDay: 1800,
    description: 'Precision laser-guided land leveler for 30% water conservation and uniform seed germination.',
    defaultImageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'harrow',
    name: 'Disc Harrow',
    categoryId: 'LAND_PREPARATION',
    defaultPricePerDay: 550,
    description: 'Disc or drag harrow to shatter clods and smooth the field surface before seeding.',
    defaultImageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'ridger',
    name: 'Ridger & Bed Maker',
    categoryId: 'LAND_PREPARATION',
    defaultPricePerDay: 450,
    description: 'Creates straight ridges, raised beds, and furrows for potato and row-crop irrigation.',
    defaultImageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80'
  },

  // 3. Seeding & Planting Equipment
  {
    id: 'seed_drill',
    name: 'Seed Drill',
    categoryId: 'SEEDING_AND_PLANTING',
    defaultPricePerDay: 750,
    description: 'Calibrated seed drill for uniform sowing depth and optimal row spacing.',
    defaultImageUrl: 'https://images.unsplash.com/photo-1589820296156-2454bb8a6ad1?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'zero_till_drill',
    name: 'Zero Till Seed Drill / Happy Seeder',
    categoryId: 'SEEDING_AND_PLANTING',
    defaultPricePerDay: 950,
    description: 'Direct sowing drill into standing crop stubble without preparatory tillage.',
    defaultImageUrl: 'https://images.unsplash.com/photo-1589820296156-2454bb8a6ad1?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'rice_transplanter',
    name: 'Rice Transplanter',
    categoryId: 'SEEDING_AND_PLANTING',
    defaultPricePerDay: 2000,
    description: 'Automated 4-row or 6-row paddy seedling transplanter for uniform spacing and high yield.',
    defaultImageUrl: 'https://images.unsplash.com/photo-1530267981375-f0de937f5f13?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'planter',
    name: 'Precision Planter',
    categoryId: 'SEEDING_AND_PLANTING',
    defaultPricePerDay: 800,
    description: 'Pneumatic precision planter for maize, cotton, and sunflower seeds.',
    defaultImageUrl: 'https://images.unsplash.com/photo-1589820296156-2454bb8a6ad1?w=800&auto=format&fit=crop&q=80'
  },

  // 4. Crop Care & Inter-Culture
  {
    id: 'tractor_boom_sprayer',
    name: 'Tractor-Mounted Boom Sprayer',
    categoryId: 'CROP_CARE_AND_INTERCULTURE',
    defaultPricePerDay: 1300,
    description: 'PTO-driven hydraulic folding boom sprayer spanning 12 meters with anti-drift nozzles.',
    defaultImageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'power_sprayer',
    name: 'Engine Power Sprayer',
    categoryId: 'CROP_CARE_AND_INTERCULTURE',
    defaultPricePerDay: 500,
    description: '2-stroke / 4-stroke motorized sprayer delivering fine mist coverage across 25 acres/day.',
    defaultImageUrl: 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'power_weeder',
    name: 'Power Weeder / Brush Cutter',
    categoryId: 'CROP_CARE_AND_INTERCULTURE',
    defaultPricePerDay: 750,
    description: 'Engine-driven rotary weeder and brush cutter for sugarcane, cotton, and orchards.',
    defaultImageUrl: 'https://images.unsplash.com/photo-1589820296156-2454bb8a6ad1?w=800&auto=format&fit=crop&q=80'
  },

  // 5. Irrigation Equipment
  {
    id: 'water_pump',
    name: 'Water Pump (Diesel / Electric)',
    categoryId: 'IRRIGATION_EQUIPMENT',
    defaultPricePerDay: 600,
    description: 'Portable high-discharge water pump for drawing water from canals, rivers, and borewells.',
    defaultImageUrl: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'drip_irrigation_kit',
    name: 'Drip & Sprinkler Irrigation Kit',
    categoryId: 'IRRIGATION_EQUIPMENT',
    defaultPricePerDay: 850,
    description: 'Micro-irrigation laterals, rain guns, and impact sprinkler sets for uniform water delivery.',
    defaultImageUrl: 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=800&auto=format&fit=crop&q=80'
  },

  // 6. Harvesting Equipment
  {
    id: 'combine_harvester',
    name: 'Combine Harvester',
    categoryId: 'HARVESTING_EQUIPMENT',
    defaultPricePerDay: 4500,
    description: 'Self-propelled grain combine for cutting, threshing, cleaning, and grain unloading in one operation.',
    defaultImageUrl: 'https://images.unsplash.com/photo-1530267981375-f0de937f5f13?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'reaper',
    name: 'Crop Reaper & Binder',
    categoryId: 'HARVESTING_EQUIPMENT',
    defaultPricePerDay: 1200,
    description: 'Front-mounted crop reaper for paddy, wheat, and pulses with side windrowing.',
    defaultImageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80'
  },

  // 7. Threshing & Post-Harvest
  {
    id: 'thresher',
    name: 'Multi-Crop Thresher',
    categoryId: 'THRESHING_AND_POST_HARVEST',
    defaultPricePerDay: 1600,
    description: 'Tractor-driven thresher suitable for wheat, soybean, maize, mustard, and gram.',
    defaultImageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'baler',
    name: 'Straw Baler',
    categoryId: 'THRESHING_AND_POST_HARVEST',
    defaultPricePerDay: 2000,
    description: 'Round or square straw baler for collecting and compressing crop residue into commercial bales.',
    defaultImageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80'
  },

  // 8. Material Handling & Transport
  {
    id: 'trailer',
    name: 'Agricultural Trailer / Trolley',
    categoryId: 'MATERIAL_HANDLING_AND_TRANSPORT',
    defaultPricePerDay: 700,
    description: 'Heavy duty hydraulic tipping trailer for farm transport and harvesting haulage.',
    defaultImageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&auto=format&fit=crop&q=80'
  }
];

// Helper to resolve an equipment image
export function getEquipmentDefaultImage(equipmentName: string, categoryId?: string): string {
  // Check exact catalog match first
  const match = EQUIPMENT_CATALOG_ITEMS.find(
    item => item.name.toLowerCase() === equipmentName.toLowerCase() || item.id === equipmentName
  );
  if (match) return match.defaultImageUrl;

  // Partial match by name
  const partial = EQUIPMENT_CATALOG_ITEMS.find(
    item => equipmentName.toLowerCase().includes(item.name.toLowerCase()) || item.name.toLowerCase().includes(equipmentName.toLowerCase())
  );
  if (partial) return partial.defaultImageUrl;

  // Category fallback
  const cat = (categoryId || '').toUpperCase();
  if (cat.includes('TRACTOR')) return 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=800&auto=format&fit=crop&q=80';
  if (cat.includes('HARVEST')) return 'https://images.unsplash.com/photo-1530267981375-f0de937f5f13?w=800&auto=format&fit=crop&q=80';
  if (cat.includes('IRRIGATION')) return 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=800&auto=format&fit=crop&q=80';
  if (cat.includes('LAND') || cat.includes('PLOUGH') || cat.includes('ROTAVATOR')) return 'https://images.unsplash.com/photo-1589820296156-2454bb8a6ad1?w=800&auto=format&fit=crop&q=80';
  if (cat.includes('SEED')) return 'https://images.unsplash.com/photo-1589820296156-2454bb8a6ad1?w=800&auto=format&fit=crop&q=80';

  return 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=800&auto=format&fit=crop&q=80';
}
