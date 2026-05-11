const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Clear existing to avoid dupes
  await prisma.farmingGuide.deleteMany();
  await prisma.modernTechnique.deleteMany();

  // Seed Farming Guides
  const guides = [
    // Rice
    { 
      cropName: 'Rice', 
      stepOrder: 1, 
      stepTitle: 'Land Preparation', 
      description: 'Plough the field twice to a depth of 20-25 cm and level it properly for uniform water distribution.', 
      imageUrl: 'https://images.unsplash.com/photo-1590005354167-6da97870c91d?auto=format&fit=crop&q=80&w=800',
      smartTip: 'Ensure the soil is moist but not waterlogged before starting the first plough.',
      recommendedEquipment: 'Heavy Duty Tractor, Disc Plough'
    },
    { 
      cropName: 'Rice', 
      stepOrder: 2, 
      stepTitle: 'Seed Selection', 
      description: 'Use certified high-yield variety seeds. Treat seeds with fungicides before sowing to prevent root rot.', 
      imageUrl: 'https://images.unsplash.com/photo-1536633100223-7431e21b033d?auto=format&fit=crop&q=80&w=800',
      smartTip: 'Floating seeds in salt water can help identify and remove hollow, low-quality grains.',
      recommendedEquipment: 'Seed Cleaner, Treatment Drum'
    },
    { 
      cropName: 'Rice', 
      stepOrder: 3, 
      stepTitle: 'Sowing/Transplanting', 
      description: 'Transplant 25-30 day old seedlings in rows with a spacing of 20x15 cm for optimal sunlight exposure.', 
      imageUrl: 'https://images.unsplash.com/photo-1563510332-9a03893699b0?auto=format&fit=crop&q=80&w=800',
      smartTip: 'Maintain a consistent depth of 2-3 cm for transplanting to ensure quick recovery.',
      recommendedEquipment: 'Rice Transplanter'
    },
    { 
      cropName: 'Rice', 
      stepOrder: 4, 
      stepTitle: 'Water Management', 
      description: 'Maintain 2-5 cm of standing water during the early growth stages. Drain water 10 days before harvesting.', 
      imageUrl: 'https://images.unsplash.com/photo-1566393028639-d108a42c46a7?auto=format&fit=crop&q=80&w=800',
      smartTip: 'Alternate wetting and drying can save up to 30% of water without reducing yield.',
      recommendedEquipment: 'Water Pump, Leveler'
    },
    
    // Wheat
    { 
      cropName: 'Wheat', 
      stepOrder: 1, 
      stepTitle: 'Sowing Time', 
      description: 'Optimal sowing time is between Nov 1-15. Late sowing significantly reduces yield potential.', 
      imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=800',
      smartTip: 'Treat seeds with Vitavax or Bavistin to prevent loose smut disease.',
      recommendedEquipment: 'Seed Drill, Tractor'
    },
    { 
      cropName: 'Wheat', 
      stepOrder: 2, 
      stepTitle: 'Irrigation', 
      description: 'First irrigation should be given at the Crown Root Initiation (CRI) stage, usually 21 days after sowing.', 
      imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800',
      smartTip: 'Avoid heavy irrigation during the CRI stage as it can cause nutrient leaching.',
      recommendedEquipment: 'Sprinkler System'
    },
    { 
      cropName: 'Wheat', 
      stepOrder: 3, 
      stepTitle: 'Harvesting', 
      description: 'Harvest when grains are hard and moisture content is around 14-16% to ensure long storage life.', 
      imageUrl: 'https://images.unsplash.com/photo-1444858291040-58f756a3bdd6?auto=format&fit=crop&q=80&w=800',
      smartTip: 'Harvesting in the morning helps reduce grain shattering loss.',
      recommendedEquipment: 'Combine Harvester'
    },

    // Corn
    { 
      cropName: 'Corn', 
      stepOrder: 1, 
      stepTitle: 'Planting Depth', 
      description: 'Plant seeds at a depth of 5-7 cm in moist soil. Use a precision planter for uniform spacing.', 
      imageUrl: 'https://images.unsplash.com/photo-1551730459-92db2a308d6a?auto=format&fit=crop&q=80&w=800',
      smartTip: 'Deep planting (7cm) is better in dry conditions to reach deeper soil moisture.',
      recommendedEquipment: 'Pneumatic Planter'
    },
    { 
      cropName: 'Corn', 
      stepOrder: 2, 
      stepTitle: 'Fertilization', 
      description: 'Apply Nitrogen in three splits: basal, knee-high stage, and tasseling stage for maximum nutrient uptake.', 
      imageUrl: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&q=80&w=800',
      smartTip: 'Top-dressing with urea should be done when the soil is moist for better absorption.',
      recommendedEquipment: 'Fertilizer Spreader'
    },

    // Cotton
    { 
      cropName: 'Cotton', 
      stepOrder: 1, 
      stepTitle: 'Soil Preparation', 
      description: 'Requires deep black soil with good drainage. Avoid waterlogged areas as they cause boll rot.', 
      imageUrl: 'https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&q=80&w=800',
      smartTip: 'Sub-soiling once in 3 years helps break the hard pan and improves root penetration.',
      recommendedEquipment: 'Subsoiler, Harrow'
    },
    { 
      cropName: 'Cotton', 
      stepOrder: 2, 
      stepTitle: 'Spacing', 
      description: 'Maintain 60-90 cm between rows and 30-45 cm between plants to allow for mechanical picking.', 
      imageUrl: 'https://images.unsplash.com/photo-1599406001711-d0b8f79f299f?auto=format&fit=crop&q=80&w=800',
      smartTip: 'High-density planting system (HDPS) can significantly increase yield in rainfed areas.',
      recommendedEquipment: 'Planter, Inter-cultivator'
    },

    // Potato
    { 
      cropName: 'Potato', 
      stepOrder: 1, 
      stepTitle: 'Seed Sprouting', 
      description: 'Place seed potatoes in a cool, light place for 4 weeks to develop short, green sprouts.', 
      imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=800',
      smartTip: 'Sprouted seeds (chitting) lead to earlier harvests and better tuber numbers.',
      recommendedEquipment: 'Chitting Trays'
    },
    { 
      cropName: 'Potato', 
      stepOrder: 2, 
      stepTitle: 'Earthing Up', 
      description: 'Draw soil around the stems when they reach 20cm tall to prevent tubers from turning green.', 
      imageUrl: 'https://images.unsplash.com/photo-1622383529357-3703c6b2da8a?auto=format&fit=crop&q=80&w=800',
      smartTip: 'Earthing up also helps in weed control and prevents tuber moth infestation.',
      recommendedEquipment: 'Ridger, Cultivator'
    },
  ];

  for (const guide of guides) {
    await prisma.farmingGuide.create({ data: guide });
  }

  // Seed Modern Techniques
  const techniques = [
    { title: 'Drip Irrigation', description: 'Saves water and fertilizer by allowing water to drip slowly to the roots of plants. Best for vegetables and fruit crops.', relatedCrop: 'Tomato', equipmentSuggestion: 'Drip Kit, Water Pump', imageUrl: 'https://images.unsplash.com/photo-1463123081488-729f608246e0?auto=format&fit=crop&q=80&w=800' },
    { title: 'Smart Harvesting', description: 'Use automated harvesters with GPS sensors to reduce grain loss during collection and mapping yield quality.', relatedCrop: 'Wheat', equipmentSuggestion: 'Combine Harvester', imageUrl: 'https://images.unsplash.com/photo-1472141521881-95d0e87e2e39?auto=format&fit=crop&q=80&w=800' },
    { title: 'Machine Planting', description: 'Increases precision and reduces labor costs by using mechanical seeders that ensure uniform depth and spacing.', relatedCrop: 'Corn', equipmentSuggestion: 'Seed Drill, Planter', imageUrl: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=800' },
    { title: 'Smart Fertilizer Usage', description: 'Use soil testing kits and leaf color charts to apply the exact amount of nutrients needed, reducing waste.', relatedCrop: 'Rice', equipmentSuggestion: 'Fertilizer Spreader', imageUrl: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&q=80&w=800' },
  ];

  for (const tech of techniques) {
    await prisma.modernTechnique.create({ data: tech });
  }

  console.log('Seed completed successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
