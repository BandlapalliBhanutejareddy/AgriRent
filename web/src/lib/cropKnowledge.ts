export interface AgronomicStage {
  stage: string;
  name: string;
  reason: string;
  tasks: string[];
  precautions: string[];
  machine: string;
  machineCategory: string;
  labourEstimate: string;
  durationDays: number;
}

export interface CropGuideData {
  name: string;
  scientificName: string;
  emoji: string;
  seasons: string;
  idealSoil: string;
  idealPh: string;
  durationDays: string;
  costPerAcre: string;
  yieldPerAcre: string;
  overview: string;
  stages: AgronomicStage[];
}

export const CROP_KNOWLEDGE: Record<string, CropGuideData> = {
  rice: {
    name: 'Rice (Paddy)',
    scientificName: 'Oryza sativa',
    emoji: '🌾',
    seasons: 'Kharif (June - Nov), Rabi (Nov - April)',
    idealSoil: 'Clayey loam to heavy alluvial soil with high water retention capacity',
    idealPh: '5.5 - 6.8',
    durationDays: '115 - 145 Days',
    costPerAcre: '₹22,000 - ₹28,000',
    yieldPerAcre: '24 - 30 Quintals / Acre',
    overview: 'Rice is India’s primary staple food crop, requiring standing water during early vegetative stages, precise nursery preparation or mechanized dry seeding, balanced NPK with zinc supplementation, and timely mechanized harvesting.',
    stages: [
      {
        stage: 'SOWING',
        name: 'Primary Tillage & Wet Puddling',
        reason: 'Puddling breaks capillary pore spaces to form an impervious hardpan that prevents deep water percolation.',
        tasks: [
          'Perform deep summer ploughing using a mouldboard plough to eliminate soil-borne pests.',
          'Flood the field with 5-7 cm water and run a tractor-mounted rotavator for puddling.',
          'Level the field evenly using a laser land leveller for uniform water coverage.'
        ],
        precautions: ['Avoid over-tilling light soils', 'Ensure laser levelling slope does not exceed 0.1%'],
        machine: '50 HP 4WD Tractor & Rotavator / Laser Leveller',
        machineCategory: 'Tillage & Levelling',
        labourEstimate: '3-4 labourers / acre',
        durationDays: 2
      },
      {
        stage: 'GERMINATION',
        name: 'Nursery Raising & Seed Priming',
        reason: 'Seed treatment protects early seedlings from seed-borne pathogens like blast and brown spot.',
        tasks: [
          'Treat certified seeds with Trichoderma viride (10g/kg) or Carbendazim (2g/kg).',
          'Prepare wet nursery beds of 1m width with drainage channels between beds.',
          'Broadcast pre-germinated seeds evenly across beds.'
        ],
        precautions: ['Protect nursery from bird damage and excessive direct midday heat.'],
        machine: 'Cono-Weeder & Knapsack Sprayer',
        machineCategory: 'Protection',
        labourEstimate: '2 labourers / acre',
        durationDays: 3
      },
      {
        stage: 'SEEDLING',
        name: 'Mechanical Transplanting / SRI Planting',
        reason: 'Uniform plant density (25-33 hills/sq.m) optimizes solar radiation interception and tiller generation.',
        tasks: [
          'Transplant 18-21 day old seedlings at 2-3 seedlings per hill.',
          'Maintain 20cm x 15cm spacing for optimal aeration and weeding.',
          'Keep shallow water layer (2-3 cm) during the first week for root anchorage.'
        ],
        precautions: ['Do not transplant older seedlings (>25 days) to avoid reduced effective tillering.'],
        machine: '4-Row / 8-Row Ride-On Rice Transplanter',
        machineCategory: 'Planting & Sowing',
        labourEstimate: '2-3 machine operators',
        durationDays: 1
      },
      {
        stage: 'VEGETATIVE',
        name: 'Active Tillering & Nutrient Top-Dressing',
        reason: 'Nitrogen application during active tillering promotes productive panicle-bearing tillers.',
        tasks: [
          'Top dress Urea (30 kg/acre) along with Zinc Sulphate (10 kg/acre).',
          'Run a mechanical cono-weeder between rows to incorporate weeds as green manure.',
          'Maintain alternate wetting and drying (AWD) to strengthen root systems.'
        ],
        precautions: ['Drain standing water 24 hours prior to fertilizer top-dressing.'],
        machine: 'Cono-Weeder & Fertilizer Broadcaster',
        machineCategory: 'Inter-Cultivation',
        labourEstimate: '2 labourers / acre',
        durationDays: 2
      },
      {
        stage: 'FLOWERING',
        name: 'Panicle Emergence & Disease Guard',
        reason: 'Flowering is the most moisture-sensitive stage; moisture stress causes high chaffy grain percentages.',
        tasks: [
          'Maintain constant 5 cm water depth during heading and anthesis.',
          'Scout for bacterial leaf blight and false smut; spray recommended bio-fungicide if necessary.',
          'Avoid foliar sprays during mid-morning when anthesis is active.'
        ],
        precautions: ['Never let the soil dry out during the 15-day flowering window.'],
        machine: 'High-Clearance Boom Sprayer',
        machineCategory: 'Crop Protection',
        labourEstimate: '1-2 operators',
        durationDays: 2
      },
      {
        stage: 'FRUITING',
        name: 'Grain Milk & Dough Stage',
        reason: 'Carbohydrate translocation from flag leaves into grains defines final 1000-grain weight.',
        tasks: [
          'Apply 0:0:50 (Potassium Sulphate) foliar spray (1%) for enhanced grain lustre and weight.',
          'Monitor for brown planthopper (BPH) at the base of tillers.',
          'Reduce water depth gradually as grains enter the hard dough stage.'
        ],
        precautions: ['Ensure spray droplets reach the base of tillers for BPH management.'],
        machine: 'Battery Powered Knapsack / Mist Sprayer',
        machineCategory: 'Crop Protection',
        labourEstimate: '1 labourer / acre',
        durationDays: 1
      },
      {
        stage: 'MATURITY',
        name: 'Pre-Harvest Drainage & Ripening',
        reason: 'Draining the field 10-12 days before harvest hardens the ground for heavy machinery traversal.',
        tasks: [
          'Completely drain field water 10-14 days before expected harvest date.',
          'Monitor grain moisture until it drops to 20-22% in the standing crop.',
          'Check that 85% of panicles have turned golden yellow.'
        ],
        precautions: ['Do not delay harvest past 20% moisture to prevent grain shattering and lodging.'],
        machine: 'Grain Moisture Meter',
        machineCategory: 'Quality Control',
        labourEstimate: '1 surveyor',
        durationDays: 1
      },
      {
        stage: 'HARVEST',
        name: 'Combine Harvesting & Threshing',
        reason: 'Mechanized harvesting eliminates grain shattering losses and reduces harvest duration from days to hours.',
        tasks: [
          'Deploy a rubber-track combine harvester to cut, thresh, and clean paddy in a single pass.',
          'Collect paddy grains into clean bags and dry in sun to safe storage moisture (12-14%).',
          'Use a straw chopper/baler to collect paddy straw instead of field burning.'
        ],
        precautions: ['Operate harvester only when morning dew has dried off.'],
        machine: 'Track Combine Harvester & Straw Baler',
        machineCategory: 'Harvesting',
        labourEstimate: '2 operators + 4 baggers',
        durationDays: 1
      }
    ]
  },
  wheat: {
    name: 'Wheat',
    scientificName: 'Triticum aestivum',
    emoji: '🌾',
    seasons: 'Rabi (November - April)',
    idealSoil: 'Well-drained fertile loamy soils with good organic matter',
    idealPh: '6.0 - 7.5',
    durationDays: '110 - 130 Days',
    costPerAcre: '₹18,000 - ₹24,000',
    yieldPerAcre: '18 - 24 Quintals / Acre',
    overview: 'Wheat is India’s major Rabi cereal. Success hinges on timely November sowing (CRI stage at 21 days), zero-tillage seed drill placement, and precise crown root irrigation.',
    stages: [
      {
        stage: 'SOWING',
        name: 'Zero-Till Sowing & Seed Placement',
        reason: 'Direct sowing with Happy Seeder or Zero-Till Drill retains paddy residue moisture and saves ₹3,500/acre in tillage.',
        tasks: [
          'Treat seeds with Carboxin + Thiram (2g/kg) and Azotobacter culture.',
          'Sow using a tractor-mounted Zero-Till Seed-cum-Fertilizer Drill at 4-5 cm depth.',
          'Maintain 20 cm row-to-row spacing with 40-45 kg/acre seed rate.'
        ],
        precautions: ['Do not place seeds deeper than 5 cm to ensure vigorous coleoptile emergence.'],
        machine: '45 HP Tractor with Happy Seeder / Zero-Till Drill',
        machineCategory: 'Planting & Sowing',
        labourEstimate: '2 operators / acre',
        durationDays: 1
      },
      {
        stage: 'GERMINATION',
        name: 'Emergence & First Irrigation (CRI Stage)',
        reason: 'Crown Root Initiation (CRI) at 20-22 days after sowing is the single most critical irrigation stage.',
        tasks: [
          'Apply light, uniform first irrigation at 21 days after sowing.',
          'Scout for termite activity; apply Chlorpyrifos if required.',
          'Inspect seedling emergence uniformity across drill rows.'
        ],
        precautions: ['Water stagnation for more than 24 hours at CRI causes permanent seedling yellowing.'],
        machine: 'Sprinkler Irrigation Unit / Solar Submersible Pump',
        machineCategory: 'Irrigation',
        labourEstimate: '1 labourer / acre',
        durationDays: 1
      },
      {
        stage: 'VEGETATIVE',
        name: 'Tillering & First Nitrogen Top Dressing',
        reason: 'Provides nitrogen surge to stimulate crown tillering and root spread.',
        tasks: [
          'Broadcast 40 kg/acre Urea right after soil reaches workable moisture after first irrigation.',
          'Spray Clodinafop-propargyl for grassy weed control (Phalaris minor).',
          'Provide second irrigation at late tillering (40-45 days).'
        ],
        precautions: ['Apply herbicide only when weeds are at 2-3 leaf stage.'],
        machine: 'Tractor Mounted Boom Sprayer',
        machineCategory: 'Crop Protection',
        labourEstimate: '2 labourers / acre',
        durationDays: 1
      },
      {
        stage: 'FLOWERING',
        name: 'Heading & Anthesis Management',
        reason: 'Terminal heat during flowering causes grain floret sterility and reduced grain count.',
        tasks: [
          'Provide irrigation at heading/flowering stage (60-70 days).',
          'Spray 0.5% Potassium Nitrate (13:0:45) to mitigate terminal temperature spikes.',
          'Monitor for yellow rust symptoms on leaf surfaces.'
        ],
        precautions: ['Do not irrigate during high wind speeds (>15 km/h) to prevent crop lodging.'],
        machine: 'Weather Sensor / Tractor Boom Sprayer',
        machineCategory: 'Advisory & Spraying',
        labourEstimate: '1-2 operators',
        durationDays: 1
      },
      {
        stage: 'HARVEST',
        name: 'Combine Harvesting & Straw Reaping',
        reason: 'Grain moisture drops rapidly in April heat; combine harvesting prevents shatter loss and creates high-value bhusa.',
        tasks: [
          'Deploy combine harvester when grains snap cleanly between teeth (moisture <14%).',
          'Run a tractor straw reaper over remaining stubble to convert straw into fine cattle feed (bhusa).',
          'Store grain in dry, aerated hermetic bags or steel bins with aluminium phosphide fumigation.'
        ],
        precautions: ['Avoid harvesting during humid morning hours.'],
        machine: 'Multi-Crop Combine Harvester & Straw Reaper',
        machineCategory: 'Harvesting',
        labourEstimate: '2 operators + 3 labourers',
        durationDays: 1
      }
    ]
  },
  maize: {
    name: 'Maize (Corn)',
    scientificName: 'Zea mays',
    emoji: '🌽',
    seasons: 'Kharif, Rabi, and Spring',
    idealSoil: 'Deep, well-drained fertile loamy soils rich in organic matter',
    idealPh: '6.0 - 7.5',
    durationDays: '95 - 115 Days',
    costPerAcre: '₹17,000 - ₹22,000',
    yieldPerAcre: '28 - 35 Quintals / Acre',
    overview: 'Maize is high-yielding and versatile as grain and silage. Key requirements include ridge and furrow planting, Fall Armyworm (FAW) pest trapping, and combine de-cobbing.',
    stages: [
      {
        stage: 'SOWING',
        name: 'Ridge Sowing & Basal Placement',
        reason: 'Ridge planting prevents waterlogging during monsoon downpours while promoting deep rooting.',
        tasks: [
          'Plough with disc harrow followed by cultivator and ridger.',
          'Sow hybrid seeds at 60 cm row-to-row and 20 cm plant-to-plant spacing.',
          'Place DAP (50 kg) + MOP (25 kg) 5 cm to the side and 5 cm below seed.'
        ],
        precautions: ['Never mix seeds directly with high-nitrogen fertilizers.'],
        machine: 'Ridge Planter / Pneumatic Precision Planter',
        machineCategory: 'Planting & Sowing',
        labourEstimate: '2 operators / acre',
        durationDays: 1
      },
      {
        stage: 'VEGETATIVE',
        name: 'Knee-High Stage & Fall Armyworm Defense',
        reason: 'Fall Armyworm (Spodoptera frugiperda) feeds voraciously in the central whorl at this stage.',
        tasks: [
          'Install pheromone traps (5 traps/acre) for FAW pest monitoring.',
          'Apply Emamectin Benzoate (0.4g/litre) targeted directly into the whorl.',
          'Earth up soil around plant roots using a tractor-mounted ridger.'
        ],
        precautions: ['Direct spray nozzle right into the leaf whorl.'],
        machine: 'Targeted High-Pressure Knapsack Sprayer',
        machineCategory: 'Protection',
        labourEstimate: '2 labourers / acre',
        durationDays: 1
      },
      {
        stage: 'FLOWERING',
        name: 'Tasseling & Silking Stage',
        reason: 'Pollen shedding and silk emergence is the highest water-demand stage in the entire maize crop cycle.',
        tasks: [
          'Ensure soil moisture is maintained at 70-80% field capacity.',
          'Top dress remaining Nitrogen dose (Urea 30 kg/acre).',
          'Inspect ear development and check for cob borers.'
        ],
        precautions: ['Water deficit during silking can reduce yield by up to 40%.'],
        machine: 'Drip Irrigation / Furrow Irrigation System',
        machineCategory: 'Irrigation',
        labourEstimate: '1 labourer / acre',
        durationDays: 1
      },
      {
        stage: 'HARVEST',
        name: 'Cob Harvesting & Shelling',
        reason: 'Harvesting when the black layer appears at the seed base ensures physiological maturity.',
        tasks: [
          'Harvest cobs when husks turn dry paper-white and black layer forms on kernel tips.',
          'Run a tractor-PTO operated maize sheller to de-husk and de-seed cleanly.',
          'Dry kernels to 12% moisture before bagging.'
        ],
        precautions: ['Do not store kernels above 13% moisture to prevent aflatoxin contamination.'],
        machine: 'Combine Harvester with Corn Head / Power Maize Sheller',
        machineCategory: 'Harvesting',
        labourEstimate: '3 operators / acre',
        durationDays: 1
      }
    ]
  },
  cotton: {
    name: 'Cotton',
    scientificName: 'Gossypium hirsutum',
    emoji: '🌱',
    seasons: 'Kharif (May - November)',
    idealSoil: 'Deep black cotton soil (Vertisols) or fertile alluvial soils',
    idealPh: '6.5 - 8.5',
    durationDays: '150 - 180 Days',
    costPerAcre: '₹26,000 - ₹34,000',
    yieldPerAcre: '10 - 14 Quintals / Acre',
    overview: 'Cotton is the white gold of Indian agriculture. Critical success factors are pink bollworm resistance, balanced micro-nutrients (Boron and Magnesium), and high-efficiency boom spraying.',
    stages: [
      {
        stage: 'SOWING',
        name: 'Broadbed Furrow Bed Preparation & Sowing',
        reason: 'BBF system ensures drainage in heavy rainfall and facilitates furrow irrigation in dry spells.',
        tasks: [
          'Subsoiling every 3 years followed by rotavator preparation.',
          'Form broad beds of 120 cm width with 30 cm furrows.',
          'Dibble Bt cotton hybrid seeds at 90 cm x 60 cm spacing.'
        ],
        precautions: ['Maintain non-Bt cotton refuge border rows as per IRM guidelines.'],
        machine: 'Subsoiler & BBF Planter',
        machineCategory: 'Tillage & Sowing',
        labourEstimate: '3 labourers / acre',
        durationDays: 2
      },
      {
        stage: 'FLOWERING',
        name: 'Square Formation & Boll Development',
        reason: 'Shedding of squares and young bolls occurs due to micro-nutrient deficiency or moisture stress.',
        tasks: [
          'Foliar spray of 1% Magnesium Sulphate + 0.2% Borax at square formation.',
          'Install pheromone traps for Pink Bollworm (Pectinophora gossypiella).',
          'Inter-cultivate with mini-tractor rotavator to control weeds.'
        ],
        precautions: ['Avoid high synthetic pyrethroid sprays to prevent secondary pest flare-ups.'],
        machine: 'Mini Tractor with Inter-Row Cultivator',
        machineCategory: 'Inter-Cultivation',
        labourEstimate: '2 operators / acre',
        durationDays: 1
      },
      {
        stage: 'HARVEST',
        name: 'Selective Boll Picking',
        reason: 'Picking fully opened, dry bolls prevents leaf trash contamination and preserves fiber staple grade.',
        tasks: [
          'Pick cotton bolls after 10:00 AM when dew has fully evaporated.',
          'Separate stained or insect-damaged bolls from clean white lint.',
          'Store in clean cotton cloth bags, avoiding plastic or polypropylene fiber contamination.'
        ],
        precautions: ['Never pack cotton with plastic twine or synthetic fibers.'],
        machine: 'Cotton Cleaning Table & Mechanical Baler',
        machineCategory: 'Post-Harvest',
        labourEstimate: '6-8 pickers / acre',
        durationDays: 3
      }
    ]
  },
  sugarcane: {
    name: 'Sugarcane',
    scientificName: 'Saccharum officinarum',
    emoji: '🎋',
    seasons: 'Autumn (Oct), Spring (Feb-March), Adsali (July)',
    idealSoil: 'Deep loamy soil with minimum 1 meter depth and good internal drainage',
    idealPh: '6.5 - 7.8',
    durationDays: '330 - 360 Days',
    costPerAcre: '₹42,000 - ₹55,000',
    yieldPerAcre: '400 - 550 Quintals / Acre (40-55 Tonnes)',
    overview: 'High-biomass commercial cash crop requiring trench opening, 2-bud sett planting with fungicide dipping, drip fertigation, and heavy mechanical earthing up.',
    stages: [
      {
        stage: 'SOWING',
        name: 'Deep Trench Furrowing & Sett Planting',
        reason: 'Wide-row trench system (120-150 cm) allows mechanical inter-culture and high tillering.',
        tasks: [
          'Open deep furrows (30 cm depth) at 4-5 feet spacing using a trench maker.',
          'Cut healthy seed cane into 2-bud setts; dip setts in Carbendazim (1g/L) for 15 mins.',
          'Place setts end-to-end along trenches and cover with 5 cm loose soil.'
        ],
        precautions: ['Discard setts with bored holes or dried eyes.'],
        machine: '55 HP Tractor with Sugarcane Trench Digger & Sett Cutter',
        machineCategory: 'Planting & Sowing',
        labourEstimate: '4 operators + 4 labourers',
        durationDays: 2
      },
      {
        stage: 'VEGETATIVE',
        name: 'Earthing Up & Trash Mulching',
        reason: 'Heavy earthing up converts furrows into ridges, burying prop roots and preventing lodging.',
        tasks: [
          'Perform first earthing up at 45 days and final earthing up at 90-120 days.',
          'Apply trash mulching between cane rows to conserve soil moisture.',
          'Administer drip fertigation with soluble N-P-K according to crop phase.'
        ],
        precautions: ['Complete final earthing up before the grand growth stage begins.'],
        machine: 'Sugarcane Earthing Up Ridger & Mini-Tractor',
        machineCategory: 'Inter-Cultivation',
        labourEstimate: '2 operators / acre',
        durationDays: 1
      },
      {
        stage: 'HARVEST',
        name: 'Base Cutting & Mill Dispatch',
        reason: 'Sugar concentration is highest in bottom nodes; cut at ground level to maximize tonnage and juice Brix.',
        tasks: [
          'Test juice Brix with hand refractometer; harvest when Brix exceeds 18%.',
          'Cut canes flush with ground level to prevent ratoon stubble rotting.',
          'Dispatch harvested cane to sugar mill within 24-36 hours to avoid sugar inversion.'
        ],
        precautions: ['Do not burn trash before harvesting to prevent juice quality deterioration.'],
        machine: 'Mechanical Sugarcane Harvester & Tractor Trolleys',
        machineCategory: 'Harvesting',
        labourEstimate: 'Sugarcane Harvester crew',
        durationDays: 2
      }
    ]
  },
  tomato: {
    name: 'Tomato',
    scientificName: 'Solanum lycopersicum',
    emoji: '🍅',
    seasons: 'Kharif, Rabi, and Summer',
    idealSoil: 'Sandy loam to clay loam soils with high organic matter',
    idealPh: '6.0 - 7.0',
    durationDays: '100 - 130 Days',
    costPerAcre: '₹35,000 - ₹48,000',
    yieldPerAcre: '180 - 250 Quintals / Acre',
    overview: 'High-value horticulture crop. Demands raised bed silver-black mulch, trellising / staking for indeterminate hybrids, drip fertigation, and preventative blight management.',
    stages: [
      {
        stage: 'SOWING',
        name: 'Raised Bed Preparation & Plastic Mulch Laying',
        reason: 'Silver-black plastic mulch controls 98% of weeds, prevents soil moisture evaporation, and deters thrips.',
        tasks: [
          'Prepare fine tilth beds of 90 cm top width, 30 cm height, spaced 120 cm apart.',
          'Incorporate 10 tonnes well-decomposed FYM and basal fertilizer.',
          'Lay inline drip lines and 25-micron silver-black plastic mulch sheet with holes at 45 cm.'
        ],
        precautions: ['Ensure drip lateral lines are leak-tested before laying mulch.'],
        machine: 'Bed Former with Mulch Layer Machine',
        machineCategory: 'Bed Preparation',
        labourEstimate: '3 labourers / acre',
        durationDays: 1
      },
      {
        stage: 'FLOWERING',
        name: 'Staking & Trellising Support',
        reason: 'Keeps foliage and fruits off the moist ground, eliminating soil rot and improving fruit grade.',
        tasks: [
          'Erect bamboo poles or GI wire trellising along bed rows.',
          'Tie growing tomato vines using jute twine or plant clips.',
          'Prune auxiliary side shoots (suckers) up to 30 cm from ground level.'
        ],
        precautions: ['Do not damage root collar during staking pole insertion.'],
        machine: 'Power Pruner & Trellising Kits',
        machineCategory: 'Crop Management',
        labourEstimate: '4 labourers / acre',
        durationDays: 2
      },
      {
        stage: 'HARVEST',
        name: 'Breaker / Turning Stage Picking',
        reason: 'Picking at breaker stage (pink blush at blossom end) provides 7-10 days transport shelf life.',
        tasks: [
          'Harvest fruits individually with calyx intact into plastic crates.',
          'Grade fruits by size, firmness, and uniform colour.',
          'Store in shade at 12-15°C prior to mandi transport.'
        ],
        precautions: ['Never drop fruits into deep bamboo baskets to avoid internal bruising.'],
        machine: 'Ventilated Harvest Crates & Sorting Table',
        machineCategory: 'Post-Harvest',
        labourEstimate: '6 pickers / acre',
        durationDays: 3
      }
    ]
  },
  potato: {
    name: 'Potato',
    scientificName: 'Solanum tuberosum',
    emoji: '🥔',
    seasons: 'Rabi (October - March)',
    idealSoil: 'Loose, friable, well-aerated sandy loam with rich organic humus',
    idealPh: '5.2 - 6.5',
    durationDays: '90 - 110 Days',
    costPerAcre: '₹38,000 - ₹50,000',
    yieldPerAcre: '120 - 160 Quintals / Acre',
    overview: 'High-value tuber crop sensitive to late blight and soil compaction. Success requires certified disease-free seed tubers, automated potato planters, earthing up, and mechanical digger-elevators.',
    stages: [
      {
        stage: 'SOWING',
        name: 'Automated Ridging & Tuber Planting',
        reason: 'Automatic seed placement maintains exact 60 cm x 20 cm spacing and consistent 5-7 cm depth.',
        tasks: [
          'Treat sprouted seed tubers with Mancozeb (2.5g/L) to prevent black scurf.',
          'Use an automated 2-row tractor potato planter with fertilizer placement.',
          'Ensure ridge tops are rounded and soil is friable.'
        ],
        precautions: ['Plant only well-chitted tubers with green, sturdy sprouts (1-1.5 cm).'],
        machine: '2-Row Automatic Potato Planter & 45 HP Tractor',
        machineCategory: 'Planting & Sowing',
        labourEstimate: '2 operators + 2 helpers',
        durationDays: 1
      },
      {
        stage: 'VEGETATIVE',
        name: 'Earthing Up & Late Blight Prophylaxis',
        reason: 'Earthing up prevents tuber greening from sunlight exposure and provides loose soil for tuber bulking.',
        tasks: [
          'Perform mechanical earthing up at 30 days when plants are 15-20 cm high.',
          'Prophylactic spray of Mancozeb (2.5g/L) before weather conditions turn foggy/cold.',
          'Maintain uniform light irrigations at 7-10 day intervals.'
        ],
        precautions: ['Tubers exposed to sunlight produce toxic solanine (green skins) and become unmarketable.'],
        machine: 'Tractor Mounted Potato Ridger / Earther',
        machineCategory: 'Inter-Cultivation',
        labourEstimate: '2 operators / acre',
        durationDays: 1
      },
      {
        stage: 'HARVEST',
        name: 'Dehaulming & Mechanical Digging',
        reason: 'Dehaulming (cutting vines) 10-12 days before digging hardens tuber skin for long cold-storage life.',
        tasks: [
          'Cut vines (dehaulm) 10 days before harvest date; allow skins to cure in soil.',
          'Run a tractor PTO-driven potato digger-elevator to lift tubers cleanly without slicing.',
          'Heap harvested tubers under shade for 7 days for skin curing before cold storage transport.'
        ],
        precautions: ['Do not harvest from water-saturated soil to prevent soft rot in storage.'],
        machine: 'Tractor PTO-Driven Potato Digger Elevator',
        machineCategory: 'Harvesting',
        labourEstimate: '2 operators + 6 sorters',
        durationDays: 1
      }
    ]
  },
  onion: {
    name: 'Onion',
    scientificName: 'Allium cepa',
    emoji: '🧅',
    seasons: 'Rabi (Nov-May), Kharif (June-Nov), Late Kharif (Aug-Feb)',
    idealSoil: 'Well-drained deep friable sandy loam rich in organic matter',
    idealPh: '6.5 - 7.5',
    durationDays: '120 - 150 Days',
    costPerAcre: '₹28,000 - ₹38,000',
    yieldPerAcre: '100 - 140 Quintals / Acre',
    overview: 'High commercial value bulb crop. Requires flat bed or BBF transplanting, sulfur nutrition (20 kg/acre) for pungent bulb firmness, thrips control, and neck-fall curing.',
    stages: [
      {
        stage: 'SOWING',
        name: 'Nursery Raising & BBF Transplanting',
        reason: 'Broadbed furrow planting (15cm x 10cm) prevents bulb rot during irrigations and accommodates 250,000 plants/ha.',
        tasks: [
          'Transplant 6-7 week old stocky seedlings into prepared broad beds.',
          'Apply basal fertilizer with 20 kg/acre elemental Sulphur.',
          'Provide immediate light irrigation for seedling establishment.'
        ],
        precautions: ['Clip top 1/3 of seedling leaves if seedlings are overgrown before transplanting.'],
        machine: 'Mini-Tractor Bed Former & Drip Irrigation',
        machineCategory: 'Bed Preparation',
        labourEstimate: '8-10 transplanters / acre',
        durationDays: 2
      },
      {
        stage: 'VEGETATIVE',
        name: 'Bulb Development & Thrips Management',
        reason: 'Thrips tabaci cause silvering of foliage, severely impacting photosynthesis and bulb size.',
        tasks: [
          'Install blue sticky traps (10/acre) for thrips monitoring.',
          'Spray Fipronil (1.5 ml/L) or Spinosad with a non-ionic sticker.',
          'Stop nitrogen application 45 days after transplanting to prevent thick necks.'
        ],
        precautions: ['Excess nitrogen during bulb swelling causes hollow hearts and poor storage capability.'],
        machine: 'Battery Powered Knapsack Sprayer',
        machineCategory: 'Crop Protection',
        labourEstimate: '1-2 operators',
        durationDays: 1
      },
      {
        stage: 'HARVEST',
        name: 'Neck Fall Inspection & Field Curing',
        reason: 'Harvesting when 50-70% of plant tops fall naturally ensures mature, tight outer scales that resist rotting.',
        tasks: [
          'Stop all irrigation 10-14 days before harvest.',
          'Uproot bulbs by hand or with a light tractor under-cutter blade.',
          'Cure bulbs in shade with tops covering bulbs for 5-7 days before clipping tops to 2.5 cm.'
        ],
        precautions: ['Do not cut onion tops flush with the bulb; leave 2.5 cm neck to seal internal tissues.'],
        machine: 'Tractor Under-Cutter Bar & Curing Crates',
        machineCategory: 'Harvesting & Curing',
        labourEstimate: '6 labourers / acre',
        durationDays: 2
      }
    ]
  }
};
