import 'package:flutter/material.dart';

class EquipmentCategoryDefinition {
  final String id;
  final String name;
  final IconData icon;
  final String description;

  const EquipmentCategoryDefinition({
    required this.id,
    required this.name,
    required this.icon,
    required this.description,
  });
}

class EquipmentCatalogItem {
  final String id;
  final String name;
  final String categoryId;
  final double defaultPricePerDay;
  final String description;
  final String defaultImageUrl;
  final IconData icon;

  const EquipmentCatalogItem({
    required this.id,
    required this.name,
    required this.categoryId,
    required this.defaultPricePerDay,
    required this.description,
    required this.defaultImageUrl,
    required this.icon,
  });
}

class AgriculturalCatalog {
  // 14 Core Agricultural Categories
  static const List<EquipmentCategoryDefinition> categories = [
    EquipmentCategoryDefinition(
      id: 'TRACTORS_AND_POWER_UNITS',
      name: 'Tractors & Power Units',
      icon: Icons.agriculture_rounded,
      description: 'Primary motive power units for farming operations',
    ),
    EquipmentCategoryDefinition(
      id: 'LAND_PREPARATION',
      name: 'Land Preparation Equipment',
      icon: Icons.terrain_rounded,
      description: 'Ploughs, tillers, harrows & land levelers',
    ),
    EquipmentCategoryDefinition(
      id: 'SEEDING_AND_PLANTING',
      name: 'Seeding & Planting Equipment',
      icon: Icons.grass_rounded,
      description: 'Precision seed drills, planters & transplanters',
    ),
    EquipmentCategoryDefinition(
      id: 'CROP_CARE_AND_INTERCULTURE',
      name: 'Crop Care & Inter-Culture Equipment',
      icon: Icons.sanitizer_rounded,
      description: 'Weeders, inter-cultivators & boom sprayers',
    ),
    EquipmentCategoryDefinition(
      id: 'IRRIGATION_EQUIPMENT',
      name: 'Irrigation Equipment',
      icon: Icons.water_drop_rounded,
      description: 'Water pumps, drip sets, rain guns & pipes',
    ),
    EquipmentCategoryDefinition(
      id: 'HARVESTING_EQUIPMENT',
      name: 'Harvesting Equipment',
      icon: Icons.content_cut_rounded,
      description: 'Combine harvesters, reapers & crop diggers',
    ),
    EquipmentCategoryDefinition(
      id: 'THRESHING_AND_POST_HARVEST',
      name: 'Threshing & Post-Harvest Equipment',
      icon: Icons.cyclone_rounded,
      description: 'Multi-crop threshers, shellers & dryers',
    ),
    EquipmentCategoryDefinition(
      id: 'MATERIAL_HANDLING_AND_TRANSPORT',
      name: 'Material Handling & Transport',
      icon: Icons.local_shipping_rounded,
      description: 'Trolleys, tippers, carriers & conveyors',
    ),
    EquipmentCategoryDefinition(
      id: 'SOIL_TESTING_AND_TOOLS',
      name: 'Soil Testing & Measurement Tools',
      icon: Icons.science_rounded,
      description: 'pH meters, soil moisture testers & GPS survey kits',
    ),
    EquipmentCategoryDefinition(
      id: 'CROP_PROCESSING',
      name: 'Crop Processing Equipment',
      icon: Icons.factory_rounded,
      description: 'Mills, oil expellers, ginners & juicers',
    ),
    EquipmentCategoryDefinition(
      id: 'STORAGE_EQUIPMENT',
      name: 'Storage Equipment',
      icon: Icons.warehouse_rounded,
      description: 'Silos, cold storage rooms, crates & bins',
    ),
    EquipmentCategoryDefinition(
      id: 'HAND_TOOLS',
      name: 'Hand Tools',
      icon: Icons.build_rounded,
      description: 'Hoes, spades, shovels, sickles & shears',
    ),
    EquipmentCategoryDefinition(
      id: 'SPECIALIZED_CROP_EQUIPMENT',
      name: 'Specialized Crop Equipment',
      icon: Icons.eco_rounded,
      description: 'Paddy transplanters, cotton pickers & cane planters',
    ),
    EquipmentCategoryDefinition(
      id: 'SAFETY_AND_ACCESSORIES',
      name: 'Safety & Accessories',
      icon: Icons.health_and_safety_rounded,
      description: 'Protective gear, boots, masks & toolboxes',
    ),
  ];

  // Complete Catalog of Standard Equipment Types
  static const List<EquipmentCatalogItem> catalogItems = [
    // 1. Tractors & Power Units
    EquipmentCatalogItem(
      id: 'tractor_35_50',
      name: 'Tractor (35–50 HP)',
      categoryId: 'TRACTORS_AND_POWER_UNITS',
      defaultPricePerDay: 1500,
      description: 'Medium utility tractor suitable for ploughing, haulage, and sowing operations.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=800&auto=format&fit=crop&q=80',
      icon: Icons.agriculture_rounded,
    ),
    EquipmentCatalogItem(
      id: 'tractor_50_75',
      name: 'Tractor (50–75 HP)',
      categoryId: 'TRACTORS_AND_POWER_UNITS',
      defaultPricePerDay: 2200,
      description: 'Heavy duty tractor designed for rotavators, heavy tillage, and commercial trailers.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&auto=format&fit=crop&q=80',
      icon: Icons.agriculture_rounded,
    ),
    EquipmentCatalogItem(
      id: 'tractor_75_plus',
      name: 'Tractor (75+ HP)',
      categoryId: 'TRACTORS_AND_POWER_UNITS',
      defaultPricePerDay: 3200,
      description: 'High horsepower flagship tractor for large-scale combine harvesters and deep subsoiling.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1530267981375-f0de937f5f13?w=800&auto=format&fit=crop&q=80',
      icon: Icons.agriculture_rounded,
    ),
    EquipmentCatalogItem(
      id: 'power_tiller',
      name: 'Power Tiller',
      categoryId: 'TRACTORS_AND_POWER_UNITS',
      defaultPricePerDay: 800,
      description: 'Rotary tiller walk-behind machine ideal for wet paddy preparation and hilly terrain.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1589820296156-2454bb8a6ad1?w=800&auto=format&fit=crop&q=80',
      icon: Icons.agriculture_rounded,
    ),
    EquipmentCatalogItem(
      id: 'mini_tractor',
      name: 'Mini Tractor',
      categoryId: 'TRACTORS_AND_POWER_UNITS',
      defaultPricePerDay: 1100,
      description: 'Compact 4WD tractor designed for orchards, vineyards, and narrow field inter-cultivation.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80',
      icon: Icons.agriculture_rounded,
    ),

    // 2. Land Preparation Equipment
    EquipmentCatalogItem(
      id: 'mb_plough',
      name: 'Mould Board Plough',
      categoryId: 'LAND_PREPARATION',
      defaultPricePerDay: 600,
      description: 'Heavy-duty primary inversion plough for deep soil turning and burying trash.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80',
      icon: Icons.terrain_rounded,
    ),
    EquipmentCatalogItem(
      id: 'disc_plough',
      name: 'Disc Plough',
      categoryId: 'LAND_PREPARATION',
      defaultPricePerDay: 650,
      description: 'Independently rotating concave disc plough ideal for stony and root-bound dry soil.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80',
      icon: Icons.terrain_rounded,
    ),
    EquipmentCatalogItem(
      id: 'rotavator',
      name: 'Rotavator',
      categoryId: 'LAND_PREPARATION',
      defaultPricePerDay: 900,
      description: 'Rotary tiller with curved blades for pulverizing soil into a fine seedbed in one pass.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1589820296156-2454bb8a6ad1?w=800&auto=format&fit=crop&q=80',
      icon: Icons.terrain_rounded,
    ),
    EquipmentCatalogItem(
      id: 'cultivator',
      name: 'Cultivator',
      categoryId: 'LAND_PREPARATION',
      defaultPricePerDay: 500,
      description: 'Spring-loaded 9-tine or 11-tine secondary tillage cultivator for stirring and aerating soil.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1589820296156-2454bb8a6ad1?w=800&auto=format&fit=crop&q=80',
      icon: Icons.terrain_rounded,
    ),
    EquipmentCatalogItem(
      id: 'harrow',
      name: 'Harrow',
      categoryId: 'LAND_PREPARATION',
      defaultPricePerDay: 550,
      description: 'Disc or drag harrow to shatter clods and smooth the field surface before seeding.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80',
      icon: Icons.terrain_rounded,
    ),
    EquipmentCatalogItem(
      id: 'laser_leveler',
      name: 'Laser Land Leveler',
      categoryId: 'LAND_PREPARATION',
      defaultPricePerDay: 1800,
      description: 'Precision laser-guided land leveler for 30% water conservation and uniform seed germination.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&auto=format&fit=crop&q=80',
      icon: Icons.terrain_rounded,
    ),
    EquipmentCatalogItem(
      id: 'ridger',
      name: 'Ridger',
      categoryId: 'LAND_PREPARATION',
      defaultPricePerDay: 450,
      description: 'Creates straight ridges and furrows for sugarcane, potato, and row-crop irrigation.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80',
      icon: Icons.terrain_rounded,
    ),

    // 3. Seeding & Planting Equipment
    EquipmentCatalogItem(
      id: 'seed_drill',
      name: 'Seed Drill',
      categoryId: 'SEEDING_AND_PLANTING',
      defaultPricePerDay: 750,
      description: 'Calibrated seed drill for uniform sowing depth and optimal row spacing.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1589820296156-2454bb8a6ad1?w=800&auto=format&fit=crop&q=80',
      icon: Icons.grass_rounded,
    ),
    EquipmentCatalogItem(
      id: 'zero_till_drill',
      name: 'Zero Till Seed Drill',
      categoryId: 'SEEDING_AND_PLANTING',
      defaultPricePerDay: 950,
      description: 'Direct sowing drill into standing crop stubble without preparatory tillage.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1589820296156-2454bb8a6ad1?w=800&auto=format&fit=crop&q=80',
      icon: Icons.grass_rounded,
    ),
    EquipmentCatalogItem(
      id: 'planter',
      name: 'Planter',
      categoryId: 'SEEDING_AND_PLANTING',
      defaultPricePerDay: 800,
      description: 'Pneumatic precision planter for maize, cotton, and sunflower seeds.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1589820296156-2454bb8a6ad1?w=800&auto=format&fit=crop&q=80',
      icon: Icons.grass_rounded,
    ),
    EquipmentCatalogItem(
      id: 'rice_transplanter',
      name: 'Rice Transplanter',
      categoryId: 'SEEDING_AND_PLANTING',
      defaultPricePerDay: 2000,
      description: 'Automated 4-row or 6-row paddy seedling transplanter for uniform spacing and high yield.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1530267981375-f0de937f5f13?w=800&auto=format&fit=crop&q=80',
      icon: Icons.grass_rounded,
    ),
    EquipmentCatalogItem(
      id: 'vegetable_transplanter',
      name: 'Vegetable Transplanter',
      categoryId: 'SEEDING_AND_PLANTING',
      defaultPricePerDay: 1200,
      description: 'Precision transplanter for tomato, chilly, onion, and brinjal seedlings.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1589820296156-2454bb8a6ad1?w=800&auto=format&fit=crop&q=80',
      icon: Icons.grass_rounded,
    ),
    EquipmentCatalogItem(
      id: 'potato_planter',
      name: 'Potato Planter',
      categoryId: 'SEEDING_AND_PLANTING',
      defaultPricePerDay: 1100,
      description: 'Automatic cup-type potato tuber planter with fertilizer placement and ridge maker.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80',
      icon: Icons.grass_rounded,
    ),
    EquipmentCatalogItem(
      id: 'manual_seed_planter',
      name: 'Manual Seed Planter',
      categoryId: 'SEEDING_AND_PLANTING',
      defaultPricePerDay: 250,
      description: 'Handheld jab planter for small acreage zero-till seed and fertilizer dispensing.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&auto=format&fit=crop&q=80',
      icon: Icons.grass_rounded,
    ),

    // 4. Crop Care & Inter-Culture Equipment
    EquipmentCatalogItem(
      id: 'hand_weeder',
      name: 'Hand Weeder',
      categoryId: 'CROP_CARE_AND_INTERCULTURE',
      defaultPricePerDay: 150,
      description: 'Manual blade weeder for removing weeds between closely planted rows.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&auto=format&fit=crop&q=80',
      icon: Icons.sanitizer_rounded,
    ),
    EquipmentCatalogItem(
      id: 'cono_weeder',
      name: 'Cono Weeder',
      categoryId: 'CROP_CARE_AND_INTERCULTURE',
      defaultPricePerDay: 200,
      description: 'Conical rotor weeder designed specifically for System of Rice Intensification (SRI).',
      defaultImageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&auto=format&fit=crop&q=80',
      icon: Icons.sanitizer_rounded,
    ),
    EquipmentCatalogItem(
      id: 'inter_cultivator',
      name: 'Inter-cultivator',
      categoryId: 'CROP_CARE_AND_INTERCULTURE',
      defaultPricePerDay: 700,
      description: 'Adjustable mini cultivator to aerate soil and uproot weeds between standing crop rows.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1589820296156-2454bb8a6ad1?w=800&auto=format&fit=crop&q=80',
      icon: Icons.sanitizer_rounded,
    ),
    EquipmentCatalogItem(
      id: 'power_weeder',
      name: 'Power Weeder',
      categoryId: 'CROP_CARE_AND_INTERCULTURE',
      defaultPricePerDay: 750,
      description: 'Engine-driven rotary weeder for sugarcane, cotton, and vegetables.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1589820296156-2454bb8a6ad1?w=800&auto=format&fit=crop&q=80',
      icon: Icons.sanitizer_rounded,
    ),
    EquipmentCatalogItem(
      id: 'manual_sprayer',
      name: 'Manual Sprayer',
      categoryId: 'CROP_CARE_AND_INTERCULTURE',
      defaultPricePerDay: 200,
      description: '16-liter knapsack hand-operated sprayer with high-pressure brass nozzle.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1589820296156-2454bb8a6ad1?w=800&auto=format&fit=crop&q=80',
      icon: Icons.sanitizer_rounded,
    ),
    EquipmentCatalogItem(
      id: 'engine_power_sprayer',
      name: 'Engine Power Sprayer',
      categoryId: 'CROP_CARE_AND_INTERCULTURE',
      defaultPricePerDay: 500,
      description: '2-stroke / 4-stroke motorized sprayer delivering fine mist coverage across 25 acres/day.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=800&auto=format&fit=crop&q=80',
      icon: Icons.sanitizer_rounded,
    ),
    EquipmentCatalogItem(
      id: 'tractor_boom_sprayer',
      name: 'Tractor-Mounted Boom Sprayer',
      categoryId: 'CROP_CARE_AND_INTERCULTURE',
      defaultPricePerDay: 1300,
      description: 'PTO-driven hydraulic folding boom sprayer spanning 12 meters with anti-drift nozzles.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&auto=format&fit=crop&q=80',
      icon: Icons.sanitizer_rounded,
    ),

    // 5. Irrigation Equipment
    EquipmentCatalogItem(
      id: 'diesel_water_pump',
      name: 'Diesel Water Pump',
      categoryId: 'IRRIGATION_EQUIPMENT',
      defaultPricePerDay: 600,
      description: 'Portable 5HP diesel engine water pump for drawing water from canals, rivers, and ponds.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=800&auto=format&fit=crop&q=80',
      icon: Icons.water_drop_rounded,
    ),
    EquipmentCatalogItem(
      id: 'electric_submersible_pump',
      name: 'Electric Submersible Pump',
      categoryId: 'IRRIGATION_EQUIPMENT',
      defaultPricePerDay: 500,
      description: 'High head borehole submersible pump for deep ground water extraction.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop&q=80',
      icon: Icons.water_drop_rounded,
    ),
    EquipmentCatalogItem(
      id: 'centrifugal_pump',
      name: 'Centrifugal Pump',
      categoryId: 'IRRIGATION_EQUIPMENT',
      defaultPricePerDay: 400,
      description: 'Monoblock centrifugal pump for surface irrigation and pressure boosting.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
      icon: Icons.water_drop_rounded,
    ),
    EquipmentCatalogItem(
      id: 'drip_irrigation_kit',
      name: 'Drip Irrigation System',
      categoryId: 'IRRIGATION_EQUIPMENT',
      defaultPricePerDay: 900,
      description: 'Clogging-resistant inline drip lateral pipes and venturi injector for micro-irrigation.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=800&auto=format&fit=crop&q=80',
      icon: Icons.water_drop_rounded,
    ),
    EquipmentCatalogItem(
      id: 'sprinkler_system',
      name: 'Sprinkler System',
      categoryId: 'IRRIGATION_EQUIPMENT',
      defaultPricePerDay: 700,
      description: 'Rotating impact sprinkler heads with quick-coupling lightweight aluminum or HDPE pipes.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=800&auto=format&fit=crop&q=80',
      icon: Icons.water_drop_rounded,
    ),
    EquipmentCatalogItem(
      id: 'rain_gun',
      name: 'Rain Gun Sprinkler',
      categoryId: 'IRRIGATION_EQUIPMENT',
      defaultPricePerDay: 850,
      description: 'High-discharge 360-degree rain gun covering up to 1.5 acres per setting for sugarcane & wheat.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=800&auto=format&fit=crop&q=80',
      icon: Icons.water_drop_rounded,
    ),
    EquipmentCatalogItem(
      id: 'hdpe_pipes',
      name: 'HDPE Pipes and Fittings',
      categoryId: 'IRRIGATION_EQUIPMENT',
      defaultPricePerDay: 350,
      description: 'Portable quick-latch HDPE flexible pipes for field water conveyance without transmission losses.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861564?w=800&auto=format&fit=crop&q=80',
      icon: Icons.water_drop_rounded,
    ),

    // 6. Harvesting Equipment
    EquipmentCatalogItem(
      id: 'combine_harvester',
      name: 'Grain Combine Harvester',
      categoryId: 'HARVESTING_EQUIPMENT',
      defaultPricePerDay: 4500,
      description: 'Self-propelled grain combine for cutting, threshing, cleaning, and grain unloading in one operation.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1530267981375-f0de937f5f13?w=800&auto=format&fit=crop&q=80',
      icon: Icons.content_cut_rounded,
    ),
    EquipmentCatalogItem(
      id: 'reaper',
      name: 'Reaper',
      categoryId: 'HARVESTING_EQUIPMENT',
      defaultPricePerDay: 1200,
      description: 'Front-mounted crop reaper for paddy, wheat, and pulses with side windrowing.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1530267981375-f0de937f5f13?w=800&auto=format&fit=crop&q=80',
      icon: Icons.content_cut_rounded,
    ),
    EquipmentCatalogItem(
      id: 'reaper_binder',
      name: 'Reaper Binder',
      categoryId: 'HARVESTING_EQUIPMENT',
      defaultPricePerDay: 1800,
      description: 'Reaps grain stalks and automatically ties them into neat bundles for easy drying.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1530267981375-f0de937f5f13?w=800&auto=format&fit=crop&q=80',
      icon: Icons.content_cut_rounded,
    ),
    EquipmentCatalogItem(
      id: 'maize_harvester',
      name: 'Maize Harvester',
      categoryId: 'HARVESTING_EQUIPMENT',
      defaultPricePerDay: 3500,
      description: 'Specialized 2-row maize picker for harvesting, dehulling, and chopping corn stalks.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1530267981375-f0de937f5f13?w=800&auto=format&fit=crop&q=80',
      icon: Icons.content_cut_rounded,
    ),
    EquipmentCatalogItem(
      id: 'sugarcane_harvester',
      name: 'Sugarcane Harvester',
      categoryId: 'HARVESTING_EQUIPMENT',
      defaultPricePerDay: 6000,
      description: 'Heavy tracked mechanical chopper harvester with leaf extractors for cane plantations.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1530267981375-f0de937f5f13?w=800&auto=format&fit=crop&q=80',
      icon: Icons.content_cut_rounded,
    ),
    EquipmentCatalogItem(
      id: 'potato_harvester',
      name: 'Potato Harvester',
      categoryId: 'HARVESTING_EQUIPMENT',
      defaultPricePerDay: 1600,
      description: 'Vibrating elevator digger that exposes potato tubers onto the soil surface without skinning.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80',
      icon: Icons.content_cut_rounded,
    ),
    EquipmentCatalogItem(
      id: 'groundnut_digger',
      name: 'Groundnut Digger',
      categoryId: 'HARVESTING_EQUIPMENT',
      defaultPricePerDay: 1100,
      description: 'Tractor-drawn shaker digger for lifting groundnut vines and separating soil clods.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80',
      icon: Icons.content_cut_rounded,
    ),

    // 7. Threshing & Post-Harvest Equipment
    EquipmentCatalogItem(
      id: 'multicrop_thresher',
      name: 'Multi-Crop Thresher',
      categoryId: 'THRESHING_AND_POST_HARVEST',
      defaultPricePerDay: 1400,
      description: 'PTO or motor operated thresher for wheat, soya, gram, maize, and mustard with blower cleaning.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&auto=format&fit=crop&q=80',
      icon: Icons.cyclone_rounded,
    ),
    EquipmentCatalogItem(
      id: 'paddy_thresher',
      name: 'Paddy Thresher',
      categoryId: 'THRESHING_AND_POST_HARVEST',
      defaultPricePerDay: 900,
      description: 'Axial-flow spike tooth thresher specifically calibrated to avoid broken rice grain kernels.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&auto=format&fit=crop&q=80',
      icon: Icons.cyclone_rounded,
    ),
    EquipmentCatalogItem(
      id: 'maize_sheller',
      name: 'Maize Sheller',
      categoryId: 'THRESHING_AND_POST_HARVEST',
      defaultPricePerDay: 700,
      description: 'High capacity dehusked corn sheller with husk and cob separation.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&auto=format&fit=crop&q=80',
      icon: Icons.cyclone_rounded,
    ),
    EquipmentCatalogItem(
      id: 'groundnut_thresher',
      name: 'Groundnut Thresher',
      categoryId: 'THRESHING_AND_POST_HARVEST',
      defaultPricePerDay: 850,
      description: 'Peanut pod plucker separating pods cleanly from roots and dried haulms.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&auto=format&fit=crop&q=80',
      icon: Icons.cyclone_rounded,
    ),
    EquipmentCatalogItem(
      id: 'grain_cleaner',
      name: 'Grain Cleaner',
      categoryId: 'THRESHING_AND_POST_HARVEST',
      defaultPricePerDay: 650,
      description: 'Multi-screen vibratory winnowing machine that removes chaff, dust, and undersized seed.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&auto=format&fit=crop&q=80',
      icon: Icons.cyclone_rounded,
    ),
    EquipmentCatalogItem(
      id: 'grain_dryer',
      name: 'Grain Dryer',
      categoryId: 'THRESHING_AND_POST_HARVEST',
      defaultPricePerDay: 1500,
      description: 'Recirculating batch hot air dryer reducing harvest grain moisture to 12% safe storage level.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&auto=format&fit=crop&q=80',
      icon: Icons.cyclone_rounded,
    ),
    EquipmentCatalogItem(
      id: 'destoner',
      name: 'Destoner',
      categoryId: 'THRESHING_AND_POST_HARVEST',
      defaultPricePerDay: 800,
      description: 'Specific gravity destoner machine to separate stones, glass, and metal contaminants from grain.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&auto=format&fit=crop&q=80',
      icon: Icons.cyclone_rounded,
    ),

    // 8. Material Handling & Transport
    EquipmentCatalogItem(
      id: 'tractor_trolley',
      name: 'Tractor Trolley',
      categoryId: 'MATERIAL_HANDLING_AND_TRANSPORT',
      defaultPricePerDay: 800,
      description: 'Heavy gauge steel double-axle farm trolley for transporting harvest, manure, and supplies.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=800&auto=format&fit=crop&q=80',
      icon: Icons.local_shipping_rounded,
    ),
    EquipmentCatalogItem(
      id: 'tipper_trailer',
      name: 'Tipper Trailer',
      categoryId: 'MATERIAL_HANDLING_AND_TRANSPORT',
      defaultPricePerDay: 1100,
      description: 'Hydraulic tipping trailer for quick and effortless unloading of bulk grain and soil.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=800&auto=format&fit=crop&q=80',
      icon: Icons.local_shipping_rounded,
    ),
    EquipmentCatalogItem(
      id: 'fertilizer_carrier',
      name: 'Seed/Fertilizer Carrier',
      categoryId: 'MATERIAL_HANDLING_AND_TRANSPORT',
      defaultPricePerDay: 400,
      description: 'Corrosion-resistant farm cart with high-flotation turf tires to prevent soil compaction.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=800&auto=format&fit=crop&q=80',
      icon: Icons.local_shipping_rounded,
    ),
    EquipmentCatalogItem(
      id: 'mini_dumper',
      name: 'Mini Dumper',
      categoryId: 'MATERIAL_HANDLING_AND_TRANSPORT',
      defaultPricePerDay: 900,
      description: 'Tracked power barrow with hydraulic dump box for navigating muddy orchard trenches.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=800&auto=format&fit=crop&q=80',
      icon: Icons.local_shipping_rounded,
    ),
    EquipmentCatalogItem(
      id: 'wheelbarrow',
      name: 'Wheelbarrow',
      categoryId: 'MATERIAL_HANDLING_AND_TRANSPORT',
      defaultPricePerDay: 100,
      description: 'Single-wheel pneumatic tire wheelbarrow for manure, harvest, and garden tool transport.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&auto=format&fit=crop&q=80',
      icon: Icons.local_shipping_rounded,
    ),
    EquipmentCatalogItem(
      id: 'sack_trolley',
      name: 'Sack Trolley',
      categoryId: 'MATERIAL_HANDLING_AND_TRANSPORT',
      defaultPricePerDay: 120,
      description: 'Heavy duty 200kg rated 2-wheel hand truck for moving grain bags and chemical drums.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&auto=format&fit=crop&q=80',
      icon: Icons.local_shipping_rounded,
    ),
    EquipmentCatalogItem(
      id: 'conveyor_belt',
      name: 'Conveyor Belt',
      categoryId: 'MATERIAL_HANDLING_AND_TRANSPORT',
      defaultPricePerDay: 1200,
      description: 'Mobile inclined cleated rubber conveyor for loading trucks and stacking bags in warehouses.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&auto=format&fit=crop&q=80',
      icon: Icons.local_shipping_rounded,
    ),

    // 9. Soil Testing & Measurement Tools
    EquipmentCatalogItem(
      id: 'soil_testing_kit',
      name: 'Soil Testing Kit',
      categoryId: 'SOIL_TESTING_AND_TOOLS',
      defaultPricePerDay: 300,
      description: 'Diagnostic reagent kit to test soil Nitrogen (N), Phosphorus (P), Potassium (K), and pH.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
      icon: Icons.science_rounded,
    ),
    EquipmentCatalogItem(
      id: 'ph_meter',
      name: 'pH Meter',
      categoryId: 'SOIL_TESTING_AND_TOOLS',
      defaultPricePerDay: 150,
      description: 'Digital spear tip probe measuring soil and irrigation water acidity/alkalinity instantly.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80',
      icon: Icons.science_rounded,
    ),
    EquipmentCatalogItem(
      id: 'soil_moisture_meter',
      name: 'Soil Moisture Meter',
      categoryId: 'SOIL_TESTING_AND_TOOLS',
      defaultPricePerDay: 180,
      description: 'TDR probe giving immediate volumetric water content percentage in root zones.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?w=800&auto=format&fit=crop&q=80',
      icon: Icons.science_rounded,
    ),
    EquipmentCatalogItem(
      id: 'ec_meter',
      name: 'EC Meter',
      categoryId: 'SOIL_TESTING_AND_TOOLS',
      defaultPricePerDay: 150,
      description: 'Electrical conductivity meter for detecting fertilizer salinity and water quality.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?w=800&auto=format&fit=crop&q=80',
      icon: Icons.science_rounded,
    ),
    EquipmentCatalogItem(
      id: 'soil_auger',
      name: 'Soil Sampling Auger',
      categoryId: 'SOIL_TESTING_AND_TOOLS',
      defaultPricePerDay: 100,
      description: 'Stainless steel core sampler for pulling undisturbed soil specimens down to 1 meter depth.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=800&auto=format&fit=crop&q=80',
      icon: Icons.science_rounded,
    ),
    EquipmentCatalogItem(
      id: 'measuring_tape',
      name: 'Measuring Tape',
      categoryId: 'SOIL_TESTING_AND_TOOLS',
      defaultPricePerDay: 50,
      description: '50-meter heavy-duty fiberglass field surveyor tape with ground stake.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=800&auto=format&fit=crop&q=80',
      icon: Icons.science_rounded,
    ),
    EquipmentCatalogItem(
      id: 'land_survey_gps',
      name: 'Land Survey GPS',
      categoryId: 'SOIL_TESTING_AND_TOOLS',
      defaultPricePerDay: 600,
      description: 'Handheld RTK-enabled GNSS unit for sub-meter boundary mapping and acreage calculation.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&auto=format&fit=crop&q=80',
      icon: Icons.science_rounded,
    ),

    // 10. Crop Processing Equipment
    EquipmentCatalogItem(
      id: 'rice_mill',
      name: 'Rice Mill',
      categoryId: 'CROP_PROCESSING',
      defaultPricePerDay: 1200,
      description: 'Compact commercial paddy dehuller, polisher, and bran separator in one pass.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&auto=format&fit=crop&q=80',
      icon: Icons.factory_rounded,
    ),
    EquipmentCatalogItem(
      id: 'flour_mill',
      name: 'Flour Mill (Atta Chakki)',
      categoryId: 'CROP_PROCESSING',
      defaultPricePerDay: 600,
      description: 'Traditional stone chakki or stainless pulverizer for wheat, millet, and maize flour.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&auto=format&fit=crop&q=80',
      icon: Icons.factory_rounded,
    ),
    EquipmentCatalogItem(
      id: 'oil_expeller',
      name: 'Groundnut/Sesame Oil Expeller',
      categoryId: 'CROP_PROCESSING',
      defaultPricePerDay: 1400,
      description: 'Cold-press screw expeller for high-purity oil extraction from mustard, peanut, and sesame.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&auto=format&fit=crop&q=80',
      icon: Icons.factory_rounded,
    ),
    EquipmentCatalogItem(
      id: 'dal_mill',
      name: 'Dal Mill',
      categoryId: 'CROP_PROCESSING',
      defaultPricePerDay: 900,
      description: 'Pulse dehusker and split-polishing machine for pigeon pea, chickpea, and mung beans.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&auto=format&fit=crop&q=80',
      icon: Icons.factory_rounded,
    ),
    EquipmentCatalogItem(
      id: 'cotton_ginning',
      name: 'Cotton Ginning Machine',
      categoryId: 'CROP_PROCESSING',
      defaultPricePerDay: 1300,
      description: 'Roller gin to cleanly separate lint fibers from cottonseed without damaging staple length.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&auto=format&fit=crop&q=80',
      icon: Icons.factory_rounded,
    ),
    EquipmentCatalogItem(
      id: 'sugarcane_juicer',
      name: 'Sugarcane Juicer',
      categoryId: 'CROP_PROCESSING',
      defaultPricePerDay: 500,
      description: '3-roller heavy stainless steel crusher for high percentage juice recovery.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&auto=format&fit=crop&q=80',
      icon: Icons.factory_rounded,
    ),
    EquipmentCatalogItem(
      id: 'spice_grinder',
      name: 'Spice Grinder',
      categoryId: 'CROP_PROCESSING',
      defaultPricePerDay: 400,
      description: 'Hammer mill spice pulverizer for turmeric, chilly, coriander, and black pepper processing.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&auto=format&fit=crop&q=80',
      icon: Icons.factory_rounded,
    ),

    // 11. Storage Equipment
    EquipmentCatalogItem(
      id: 'grain_storage_bin',
      name: 'Grain Storage Bin',
      categoryId: 'STORAGE_EQUIPMENT',
      defaultPricePerDay: 200,
      description: 'Airtight galvanized sheet steel bin pest-proofed for on-farm wheat and paddy storage.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
      icon: Icons.warehouse_rounded,
    ),
    EquipmentCatalogItem(
      id: 'silo',
      name: 'Silo',
      categoryId: 'STORAGE_EQUIPMENT',
      defaultPricePerDay: 800,
      description: 'Aerated metal storage silo with temperature sensors and bottom discharge chute.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
      icon: Icons.warehouse_rounded,
    ),
    EquipmentCatalogItem(
      id: 'cold_storage_room',
      name: 'Cold Storage Room',
      categoryId: 'STORAGE_EQUIPMENT',
      defaultPricePerDay: 1500,
      description: 'Temperature and humidity controlled modular refrigeration unit for fruits and vegetables.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
      icon: Icons.warehouse_rounded,
    ),
    EquipmentCatalogItem(
      id: 'onion_storage',
      name: 'Onion Storage Unit',
      categoryId: 'STORAGE_EQUIPMENT',
      defaultPricePerDay: 350,
      description: 'Naturally ventilated thatched bottom-aerated storage structure to prevent rot and sprouting.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
      icon: Icons.warehouse_rounded,
    ),
    EquipmentCatalogItem(
      id: 'vegetable_crates',
      name: 'Vegetable Crate',
      categoryId: 'STORAGE_EQUIPMENT',
      defaultPricePerDay: 20,
      description: 'Food-grade stackable plastic crates for damage-free fruit and vegetable transport.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
      icon: Icons.warehouse_rounded,
    ),
    EquipmentCatalogItem(
      id: 'gunny_bags',
      name: 'Gunny Bags',
      categoryId: 'STORAGE_EQUIPMENT',
      defaultPricePerDay: 10,
      description: 'Breathable standard 50kg jute burlap sacks for grain bagging and storage.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
      icon: Icons.warehouse_rounded,
    ),
    EquipmentCatalogItem(
      id: 'pallets',
      name: 'Pallets',
      categoryId: 'STORAGE_EQUIPMENT',
      defaultPricePerDay: 25,
      description: 'Treated wooden or plastic warehouse pallets to keep grain bags elevated from damp floors.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
      icon: Icons.warehouse_rounded,
    ),

    // 12. Hand Tools
    EquipmentCatalogItem(
      id: 'hoe',
      name: 'Hoe',
      categoryId: 'HAND_TOOLS',
      defaultPricePerDay: 60,
      description: 'Forged carbon steel agricultural hoe for clearing weed patches and earthing up soil.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&auto=format&fit=crop&q=80',
      icon: Icons.build_rounded,
    ),
    EquipmentCatalogItem(
      id: 'spade',
      name: 'Spade',
      categoryId: 'HAND_TOOLS',
      defaultPricePerDay: 70,
      description: 'Flat rectangular blade digging spade for trenching, edging beds, and clean cutting sod.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&auto=format&fit=crop&q=80',
      icon: Icons.build_rounded,
    ),
    EquipmentCatalogItem(
      id: 'shovel',
      name: 'Shovel',
      categoryId: 'HAND_TOOLS',
      defaultPricePerDay: 70,
      description: 'Curved scoop shovel for moving loose compost, gravel, fertilizer, and sand.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&auto=format&fit=crop&q=80',
      icon: Icons.build_rounded,
    ),
    EquipmentCatalogItem(
      id: 'rake',
      name: 'Rake',
      categoryId: 'HAND_TOOLS',
      defaultPricePerDay: 50,
      description: 'Heavy duty 14-tine steel bow rake for leveling soil and removing crop stones.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&auto=format&fit=crop&q=80',
      icon: Icons.build_rounded,
    ),
    EquipmentCatalogItem(
      id: 'sickle',
      name: 'Sickle',
      categoryId: 'HAND_TOOLS',
      defaultPricePerDay: 50,
      description: 'Serrated stainless steel harvest sickle for cutting paddy, wheat, and green fodder.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&auto=format&fit=crop&q=80',
      icon: Icons.build_rounded,
    ),
    EquipmentCatalogItem(
      id: 'pruning_shears',
      name: 'Pruning Shears',
      categoryId: 'HAND_TOOLS',
      defaultPricePerDay: 80,
      description: 'Bypass secateurs with hardened high-carbon blades for trimming fruit tree branches.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&auto=format&fit=crop&q=80',
      icon: Icons.build_rounded,
    ),
    EquipmentCatalogItem(
      id: 'axe',
      name: 'Axe',
      categoryId: 'HAND_TOOLS',
      defaultPricePerDay: 90,
      description: 'Drop-forged chopping axe with ergonomic fiberglass shock-absorbing handle.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&auto=format&fit=crop&q=80',
      icon: Icons.build_rounded,
    ),
    EquipmentCatalogItem(
      id: 'garden_fork',
      name: 'Garden Fork',
      categoryId: 'HAND_TOOLS',
      defaultPricePerDay: 60,
      description: '4-tine digging fork for breaking heavy clay soil without slicing earthworms or root crops.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&auto=format&fit=crop&q=80',
      icon: Icons.build_rounded,
    ),
    EquipmentCatalogItem(
      id: 'trowel',
      name: 'Trowel',
      categoryId: 'HAND_TOOLS',
      defaultPricePerDay: 40,
      description: 'Handheld scoop trowel for transplanting vegetable seedlings and potting soil.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&auto=format&fit=crop&q=80',
      icon: Icons.build_rounded,
    ),

    // 13. Specialized Crop Equipment
    EquipmentCatalogItem(
      id: 'paddy_transplanter_spec',
      name: 'Paddy Transplanter',
      categoryId: 'SPECIALIZED_CROP_EQUIPMENT',
      defaultPricePerDay: 2200,
      description: 'Riding-type high-speed paddy transplanter with automatic mat-feed fingers.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1530267981375-f0de937f5f13?w=800&auto=format&fit=crop&q=80',
      icon: Icons.eco_rounded,
    ),
    EquipmentCatalogItem(
      id: 'sugarcane_planter',
      name: 'Sugarcane Planter',
      categoryId: 'SPECIALIZED_CROP_EQUIPMENT',
      defaultPricePerDay: 2400,
      description: 'Integrated sett cutter, fertilizer applicator, fungicide sprayer, and furrow coverer.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80',
      icon: Icons.eco_rounded,
    ),
    EquipmentCatalogItem(
      id: 'cotton_picker',
      name: 'Cotton Picker',
      categoryId: 'SPECIALIZED_CROP_EQUIPMENT',
      defaultPricePerDay: 5000,
      description: 'Spindle-type self-propelled cotton harvester preserving lint purity from dry bolls.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1530267981375-f0de937f5f13?w=800&auto=format&fit=crop&q=80',
      icon: Icons.eco_rounded,
    ),
    EquipmentCatalogItem(
      id: 'tea_harvester',
      name: 'Tea Harvester',
      categoryId: 'SPECIALIZED_CROP_EQUIPMENT',
      defaultPricePerDay: 750,
      description: 'Dual-man handheld reciprocating blade tea leaf plucker with collection bag.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&auto=format&fit=crop&q=80',
      icon: Icons.eco_rounded,
    ),
    EquipmentCatalogItem(
      id: 'coffee_harvester',
      name: 'Coffee Harvester',
      categoryId: 'SPECIALIZED_CROP_EQUIPMENT',
      defaultPricePerDay: 900,
      description: 'Mechanical selective branch vibrating harvester for ripe coffee cherries.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=800&auto=format&fit=crop&q=80',
      icon: Icons.eco_rounded,
    ),
    EquipmentCatalogItem(
      id: 'banana_harvester',
      name: 'Banana Harvester',
      categoryId: 'SPECIALIZED_CROP_EQUIPMENT',
      defaultPricePerDay: 600,
      description: 'Hydraulic boom clamp with pneumatic cutter to safely lower heavy fruit bunches.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80',
      icon: Icons.eco_rounded,
    ),
    EquipmentCatalogItem(
      id: 'vegetable_harvester',
      name: 'Vegetable Harvester',
      categoryId: 'SPECIALIZED_CROP_EQUIPMENT',
      defaultPricePerDay: 1300,
      description: 'Under-root lifter and soft-belt elevator for carrots, radishes, and leafy greens.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80',
      icon: Icons.eco_rounded,
    ),

    // 14. Safety & Accessories
    EquipmentCatalogItem(
      id: 'safety_gloves',
      name: 'Gloves',
      categoryId: 'SAFETY_AND_ACCESSORIES',
      defaultPricePerDay: 30,
      description: 'Heavy chemical and thorn resistant nitrile dipped work gloves.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=800&auto=format&fit=crop&q=80',
      icon: Icons.health_and_safety_rounded,
    ),
    EquipmentCatalogItem(
      id: 'gum_boots',
      name: 'Gum Boots',
      categoryId: 'SAFETY_AND_ACCESSORIES',
      defaultPricePerDay: 50,
      description: 'Knee-high waterproof PVC rubber safety gumboots with steel toe cap.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
      icon: Icons.health_and_safety_rounded,
    ),
    EquipmentCatalogItem(
      id: 'respirator_mask',
      name: 'Mask',
      categoryId: 'SAFETY_AND_ACCESSORIES',
      defaultPricePerDay: 40,
      description: 'Dual cartridge active carbon respirator mask for pesticide and chemical spraying.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1586942593568-29361efcd571?w=800&auto=format&fit=crop&q=80',
      icon: Icons.health_and_safety_rounded,
    ),
    EquipmentCatalogItem(
      id: 'safety_goggles',
      name: 'Safety Goggles',
      categoryId: 'SAFETY_AND_ACCESSORIES',
      defaultPricePerDay: 30,
      description: 'Anti-fog UV-protective splash-proof polycarbonate eye protection goggles.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80',
      icon: Icons.health_and_safety_rounded,
    ),
    EquipmentCatalogItem(
      id: 'sun_hat',
      name: 'Hat',
      categoryId: 'SAFETY_AND_ACCESSORIES',
      defaultPricePerDay: 20,
      description: 'Wide-brim UV-blocking ventilated sun hat with neck protection flap for field work.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800&auto=format&fit=crop&q=80',
      icon: Icons.health_and_safety_rounded,
    ),
    EquipmentCatalogItem(
      id: 'reflective_jacket',
      name: 'Reflective Jacket',
      categoryId: 'SAFETY_AND_ACCESSORIES',
      defaultPricePerDay: 40,
      description: 'High visibility fluorescent safety vest with retroreflective stripes for road haulage.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1578873375972-00b865d1d64e?w=800&auto=format&fit=crop&q=80',
      icon: Icons.health_and_safety_rounded,
    ),
    EquipmentCatalogItem(
      id: 'farm_toolbox',
      name: 'Toolbox',
      categoryId: 'SAFETY_AND_ACCESSORIES',
      defaultPricePerDay: 150,
      description: 'Heavy duty steel mechanic toolbox complete with metric spanners, socket set & grease gun.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?w=800&auto=format&fit=crop&q=80',
      icon: Icons.health_and_safety_rounded,
    ),
    EquipmentCatalogItem(
      id: 'first_aid_kit',
      name: 'First Aid Kit',
      categoryId: 'SAFETY_AND_ACCESSORIES',
      defaultPricePerDay: 50,
      description: 'OSHA compliant agricultural first aid kit with antiseptic, eyewash, burn gel & bandages.',
      defaultImageUrl: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=800&auto=format&fit=crop&q=80',
      icon: Icons.health_and_safety_rounded,
    ),
  ];

  /// Seamless Legacy Category Normalizer
  static String normalizeCategory(String rawCategory) {
    final cleaned = rawCategory.trim().toUpperCase().replaceAll(' ', '_');
    switch (cleaned) {
      case 'TRACTOR':
      case 'TRACTORS':
      case 'TRACTORS_AND_POWER_UNITS':
        return 'TRACTORS_AND_POWER_UNITS';
      case 'PLOUGH':
      case 'PLOUGHS':
      case 'CULTIVATOR':
      case 'CULTIVATORS':
      case 'LAND_PREPARATION':
      case 'LAND_PREPARATION_EQUIPMENT':
        return 'LAND_PREPARATION';
      case 'SEEDER':
      case 'SEEDERS':
      case 'SEEDING':
      case 'SEEDING_AND_PLANTING':
      case 'SEEDING_&_PLANTING':
        return 'SEEDING_AND_PLANTING';
      case 'SPRAYER':
      case 'SPRAYERS':
      case 'CROP_CARE':
      case 'CROP_CARE_AND_INTERCULTURE':
      case 'CROP_CARE_&_INTER-CULTURE_EQUIPMENT':
        return 'CROP_CARE_AND_INTERCULTURE';
      case 'IRRIGATION':
      case 'IRRIGATION_EQUIPMENT':
        return 'IRRIGATION_EQUIPMENT';
      case 'HARVESTER':
      case 'HARVESTERS':
      case 'HARVESTING':
      case 'HARVESTING_EQUIPMENT':
        return 'HARVESTING_EQUIPMENT';
      case 'THRESHER':
      case 'THRESHERS':
      case 'THRESHING':
      case 'THRESHING_AND_POST_HARVEST':
      case 'THRESHING_&_POST-HARVEST_EQUIPMENT':
        return 'THRESHING_AND_POST_HARVEST';
      case 'TRANSPORT':
      case 'MATERIAL_HANDLING':
      case 'MATERIAL_HANDLING_AND_TRANSPORT':
      case 'MATERIAL_HANDLING_&_TRANSPORT':
        return 'MATERIAL_HANDLING_AND_TRANSPORT';
      case 'SOIL_TESTING':
      case 'SOIL_TESTING_AND_TOOLS':
      case 'SOIL_TESTING_&_MEASUREMENT_TOOLS':
        return 'SOIL_TESTING_AND_TOOLS';
      case 'CROP_PROCESSING':
      case 'CROP_PROCESSING_EQUIPMENT':
        return 'CROP_PROCESSING';
      case 'STORAGE':
      case 'STORAGE_EQUIPMENT':
        return 'STORAGE_EQUIPMENT';
      case 'HAND_TOOLS':
      case 'TOOLS':
        return 'HAND_TOOLS';
      case 'SPECIALIZED':
      case 'SPECIALIZED_CROP_EQUIPMENT':
        return 'SPECIALIZED_CROP_EQUIPMENT';
      case 'SAFETY':
      case 'SAFETY_AND_ACCESSORIES':
      case 'SAFETY_&_ACCESSORIES':
        return 'SAFETY_AND_ACCESSORIES';
      default:
        return 'TRACTORS_AND_POWER_UNITS';
    }
  }

  /// Get Category Definition
  static EquipmentCategoryDefinition getCategory(String categoryId) {
    final norm = normalizeCategory(categoryId);
    return categories.firstWhere(
      (c) => c.id == norm,
      orElse: () => categories.first,
    );
  }

  /// Get Catalog Items for a given Category
  static List<EquipmentCatalogItem> getItemsForCategory(String categoryId) {
    final norm = normalizeCategory(categoryId);
    return catalogItems.where((item) => item.categoryId == norm).toList();
  }

  /// Find Catalog Item by Title or ID
  static EquipmentCatalogItem? findItem(String query) {
    final q = query.trim().toLowerCase();
    for (final item in catalogItems) {
      if (item.id.toLowerCase() == q || item.name.toLowerCase() == q || item.name.toLowerCase().contains(q)) {
        return item;
      }
    }
    return null;
  }

  /// Resolve Best Matching Image URL
  static String resolveImageUrl({required String category, String? title, String? existingUrl}) {
    if (existingUrl != null && existingUrl.isNotEmpty && !existingUrl.contains('placeholder')) {
      return existingUrl;
    }
    if (title != null && title.isNotEmpty) {
      final matched = findItem(title);
      if (matched != null) return matched.defaultImageUrl;
    }
    final catItems = getItemsForCategory(category);
    if (catItems.isNotEmpty) {
      return catItems.first.defaultImageUrl;
    }
    return 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=800&auto=format&fit=crop&q=80';
  }
}
