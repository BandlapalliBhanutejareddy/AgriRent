const { prisma } = require('../dist/lib/prisma');

async function seedTomatoAndTechniques() {
  console.log('--- Seeding Tomato Farming Guides & Modern Techniques ---');

  const tomatoGuides = [
    {
      cropName: 'Tomato',
      stepOrder: 1,
      stepTitle: 'Land Preparation & Raised Beds',
      description: 'Plough field 2-3 times with disc plough and rotavator to achieve fine tilth. Form 15 cm raised beds with 60 cm width for optimal drainage and root aeration.',
      imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?auto=format&fit=crop&q=80&w=800',
      smartTip: 'Incorporate 10-12 tons of well-rotted FYM per acre during final ploughing.',
      recommendedEquipment: 'Tractor, Disc Plough, Rotavator, Bed Maker'
    },
    {
      cropName: 'Tomato',
      stepOrder: 2,
      stepTitle: 'Nursery Raising & Seed Treatment',
      description: 'Sow certified hybrid seeds in 98-cell pro-trays filled with sterilized coco-peat and vermicompost. Treat seeds with Trichoderma viride (4g/kg) to prevent damping-off.',
      imageUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&q=80&w=800',
      smartTip: 'Keep pro-trays inside a 40-mesh insect-proof net house to protect emerging seedlings from whitefly vectors.',
      recommendedEquipment: 'Pro-trays, Shade Net, Water Canister'
    },
    {
      cropName: 'Tomato',
      stepOrder: 3,
      stepTitle: 'Transplanting & Staking Support',
      description: 'Transplant 25-30 day sturdy seedlings during late afternoon at 60 cm x 45 cm spacing. Install wooden or bamboo stakes with GI wire within 3 weeks to support indeterminate vine growth.',
      imageUrl: 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?auto=format&fit=crop&q=80&w=800',
      smartTip: 'Irrigate immediately after transplanting to minimize transplant shock.',
      recommendedEquipment: 'Staking Poles, Trellis Twine, Drip Line'
    },
    {
      cropName: 'Tomato',
      stepOrder: 4,
      stepTitle: 'Drip Fertigation & Water Scheduling',
      description: 'Apply water soluble fertilizers (19:19:19 and calcium nitrate) via venturi fertigation system. Maintain uniform moisture to prevent fruit cracking and blossom end rot.',
      imageUrl: 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?auto=format&fit=crop&q=80&w=800',
      smartTip: 'Foliar spray of 0.2% Borax during flowering significantly boosts fruit set.',
      recommendedEquipment: 'Venturi Fertigation Unit, Drip Laterals, Filter'
    },
    {
      cropName: 'Tomato',
      stepOrder: 5,
      stepTitle: 'Integrated Pest & Disease Management',
      description: 'Erect 10 yellow sticky traps per acre for whiteflies and install 4 Helicoverpa pheromone traps. Spray neem oil (3ml/L) preventively for leaf miners and mites.',
      imageUrl: 'https://images.unsplash.com/photo-1592178036777-50b86a87c1be?auto=format&fit=crop&q=80&w=800',
      smartTip: 'Spray fungicides during early morning hours and rotate chemical modes of action to prevent resistance.',
      recommendedEquipment: 'Battery Knapsack Sprayer, Pheromone Traps, Sticky Cards'
    },
    {
      cropName: 'Tomato',
      stepOrder: 6,
      stepTitle: 'Harvesting & Post-Harvest Handling',
      description: 'Harvest fruits at breaker to turning stage for distant transport or red-ripe for local mandis. Gently place picked fruits into ventilated plastic crates under shade.',
      imageUrl: 'https://images.unsplash.com/photo-1546470427-0d4db154ceb7?auto=format&fit=crop&q=80&w=800',
      smartTip: 'Never leave harvested tomatoes in direct sun as heat accelerates softening and reduces market shelf-life.',
      recommendedEquipment: 'Plastic Harvest Crates, Grading Table'
    }
  ];

  for (const guide of tomatoGuides) {
    const existing = await prisma.farmingGuide.findFirst({
      where: { cropName: 'Tomato', stepOrder: guide.stepOrder }
    });
    if (!existing) {
      await prisma.farmingGuide.create({ data: guide });
      console.log(`Created Tomato Guide: Step ${guide.stepOrder} - ${guide.stepTitle}`);
    } else {
      await prisma.farmingGuide.update({
        where: { id: existing.id },
        data: guide
      });
      console.log(`Updated Tomato Guide: Step ${guide.stepOrder}`);
    }
  }

  const modernTechniques = [
    {
      title: 'Drip Irrigation & Fertigation',
      description: 'Supplies precise water and soluble nutrients directly to crop root zones. Reduces water consumption by up to 50% and fertilizer wastage by 35%.',
      relatedCrop: 'Tomato, Chilli, Cotton, Sugarcane',
      equipmentSuggestion: 'Drip Lateral System, Venturi Injector, Sand & Disc Filter',
      imageUrl: 'https://images.unsplash.com/photo-1463123081488-729f608246e0?auto=format&fit=crop&q=80&w=800'
    },
    {
      title: 'Silver-Black Plastic Mulching',
      description: '25-30 micron polyethylene mulching film suppresses weeds completely, retains soil moisture, reflects solar heat and eliminates manual weeding costs.',
      relatedCrop: 'Tomato, Potato, Corn, Watermelon',
      equipmentSuggestion: 'Tractor-drawn Mulch Laying Machine, Hole Puncher',
      imageUrl: 'https://images.unsplash.com/photo-1622383563227-04401ab4e5ea?auto=format&fit=crop&q=80&w=800'
    },
    {
      title: 'Soil Testing & Integrated Nutrient Management (INM)',
      description: 'Scientific laboratory testing of soil pH, electrical conductivity, organic carbon, and macro/micronutrients. Eliminates over-application of synthetic urea and DAP.',
      relatedCrop: 'All Crops (Rice, Wheat, Cotton, Corn)',
      equipmentSuggestion: 'Digital Soil Testing Kit, Soil Sampling Auger',
      imageUrl: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&q=80&w=800'
    },
    {
      title: 'Integrated Pest Management (IPM)',
      description: 'Combines bio-agents (Trichoderma, Pseudomonas), pheromone traps, bird perches, and botanicals before resorting to targeted green-label chemical sprays.',
      relatedCrop: 'Cotton, Tomato, Rice, Chilli',
      equipmentSuggestion: 'Pheromone Lure Traps, Solar Insect Light Traps',
      imageUrl: 'https://images.unsplash.com/photo-1592178036777-50b86a87c1be?auto=format&fit=crop&q=80&w=800'
    },
    {
      title: 'Crop Rotation & Legume Intercropping',
      description: 'Systematic rotation of cereal crops with pulses (chickpea, cowpea, redgram) to fix atmospheric nitrogen and break repetitive soil-borne pathogen cycles.',
      relatedCrop: 'Rice-Wheat, Cotton-Pigeonpea, Corn-Soybean',
      equipmentSuggestion: 'Multi-Crop Seed Drill, Cultivator',
      imageUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=800'
    },
    {
      title: 'Protected Cultivation (Polyhouses & Shade Nets)',
      description: 'Naturally ventilated polyhouses with micro-sprinklers provide weather independence, prevent pest attacks, and enable high-value off-season vegetable production.',
      relatedCrop: 'Tomato, Capsicum, Cucumber, Flowers',
      equipmentSuggestion: 'Polyhouse Structure, Fogging Nozzles, Climate Controller',
      imageUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&q=80&w=800'
    },
    {
      title: 'Precision Tensiometer Irrigation',
      description: 'Using soil moisture sensors and tensiometers to irrigate only when soil suction reaches crop-specific thresholds, preventing aeration stress and root rot.',
      relatedCrop: 'Wheat, Potato, Tomato, Sugarcane',
      equipmentSuggestion: 'Soil Moisture Sensors, Smart Automated Valve Actuator',
      imageUrl: 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?auto=format&fit=crop&q=80&w=800'
    },
    {
      title: 'Weather-Informed Farming Operations',
      description: 'Synchronizing spraying, irrigation, and harvesting windows with 7-day meteorological rain, temperature, and wind speed forecasts to prevent wash-off.',
      relatedCrop: 'All Crops',
      equipmentSuggestion: 'Automatic Farm Weather Station, Rain Gauge',
      imageUrl: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?auto=format&fit=crop&q=80&w=800'
    },
    {
      title: 'Appropriate Smallholder Mechanization',
      description: 'Deploying matched horsepower power tillers, motorized weeders, and raised bed seed drills that reduce labor drudgery on fragmented family holdings.',
      relatedCrop: 'Rice, Wheat, Vegetables',
      equipmentSuggestion: 'Power Tiller, Walk-Behind Weeder, Mini Tractor',
      imageUrl: 'https://images.unsplash.com/photo-1590005354167-6da97870c91d?auto=format&fit=crop&q=80&w=800'
    },
    {
      title: 'Farm Ponds & Rainwater Harvesting',
      description: 'Farm excavation of lined ponds collecting monsoon runoff. Provides life-saving protective irrigation during dry spells while recharging groundwater.',
      relatedCrop: 'Rainfed Crops, Cotton, Pulses',
      equipmentSuggestion: 'Backhoe Loader, HDPE Pond Lining Sheet, Solar Pump',
      imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800'
    }
  ];

  for (const tech of modernTechniques) {
    const existing = await prisma.modernTechnique.findFirst({
      where: { title: tech.title }
    });
    if (!existing) {
      await prisma.modernTechnique.create({ data: tech });
      console.log(`Created Technique: ${tech.title}`);
    } else {
      await prisma.modernTechnique.update({
        where: { id: existing.id },
        data: tech
      });
      console.log(`Updated Technique: ${tech.title}`);
    }
  }

  console.log('✅ Tomato Guides & Modern Techniques seeding completed.');
  await prisma.$disconnect();
}

seedTomatoAndTechniques().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
