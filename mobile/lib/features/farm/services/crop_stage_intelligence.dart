class StageIntelligence {
  final String cropName;
  final String stage;
  final String stagePurpose;
  final List<String> whatToDoNow;
  final List<String> importantChecks;
  final List<String> commonProblems;
  final List<String> precautions;
  final String nextStage;
  final String nextStageRequirements;
  final List<String> relatedOperations;
  final List<String> relatedEquipmentCategories;
  final Map<String, String> equipmentReasons;
  final List<LearningVideo> learningVideos;

  const StageIntelligence({
    required this.cropName,
    required this.stage,
    required this.stagePurpose,
    required this.whatToDoNow,
    required this.importantChecks,
    required this.commonProblems,
    required this.precautions,
    required this.nextStage,
    required this.nextStageRequirements,
    required this.relatedOperations,
    required this.relatedEquipmentCategories,
    required this.equipmentReasons,
    required this.learningVideos,
  });
}

class LearningVideo {
  final String title;
  final String channel;
  final String duration;
  final String relevance;
  final String searchQuery;
  final String? videoUrl;

  const LearningVideo({
    required this.title,
    required this.channel,
    required this.duration,
    required this.relevance,
    required this.searchQuery,
    this.videoUrl,
  });

  String get effectiveUrl =>
      videoUrl ?? 'https://www.youtube.com/results?search_query=${Uri.encodeComponent(searchQuery)}';
}

class CropStageIntelligenceService {
  static const List<String> canonicalStages = [
    'SOWING',
    'GERMINATION',
    'SEEDLING',
    'VEGETATIVE',
    'FLOWERING',
    'FRUITING',
    'MATURITY',
    'HARVEST',
  ];

  static StageIntelligence getStageDetails(String cropName, String stage) {
    final normalizedCrop = cropName.trim().toUpperCase();
    final normalizedStage = stage.trim().toUpperCase();

    switch (normalizedCrop) {
      case 'RICE':
      case 'PADDY':
        return _getRiceStage(normalizedStage);
      case 'COTTON':
        return _getCottonStage(normalizedStage);
      case 'MAIZE':
      case 'CORN':
        return _getMaizeStage(normalizedStage);
      case 'WHEAT':
        return _getWheatStage(normalizedStage);
      case 'TOMATO':
        return _getTomatoStage(normalizedStage);
      case 'CHILLI':
      case 'CHILI':
        return _getChilliStage(normalizedStage);
      case 'SUGARCANE':
        return _getSugarcaneStage(normalizedStage);
      case 'GROUNDNUT':
      case 'PEANUT':
        return _getGroundnutStage(normalizedStage);
      default:
        return _getDefaultStage(cropName, normalizedStage);
    }
  }

  // ---------------------------------------------------------------------------
  // RICE (PADDY)
  // ---------------------------------------------------------------------------
  static StageIntelligence _getRiceStage(String stage) {
    switch (stage) {
      case 'SOWING':
        return StageIntelligence(
          cropName: 'Rice',
          stage: 'SOWING',
          stagePurpose: 'Field preparation, puddling, and nursery sowing to achieve optimal seedling establishment.',
          whatToDoNow: [
            'Complete primary deep ploughing and puddling to break hardpan and retain water.',
            'Treat pre-soaked paddy seeds with Trichoderma viride or Carbendazim to protect against seed-borne pathogens.',
            'Broadcast treated seeds uniformly on prepared raised nursery beds or direct-seeded puddles.',
            'Apply basal dose of phosphatic and potassic fertilizers as per soil test recommendations.',
            'Ensure a thin film of water (1-2 cm) is maintained across the nursery bed.'
          ],
          importantChecks: [
            'Soil puddle quality and hardpan formation',
            'Water standing depth (must not exceed 2 cm during seed drop)',
            'Seed germination percentage before sowing',
            'Drainage channels around nursery beds',
          ],
          commonProblems: [
            'Uneven water stagnation causing seed decay',
            'Bird or rodent damage to newly broadcasted seeds',
            'Seedling rot / damping off in poorly drained nursery beds',
          ],
          precautions: [
            'Avoid deep standing water immediately after sowing to prevent seed displacement.',
            'Do not apply excessive urea during nursery sowing as it promotes weak, tender seedlings.',
          ],
          nextStage: 'GERMINATION',
          nextStageRequirements: 'Verify uniform radicle and plumule emergence within 4 to 6 days.',
          relatedOperations: ['Puddling & Land Preparation', 'Nursery Sowing', 'Basal Fertilizer Application'],
          relatedEquipmentCategories: ['TRACTOR', 'IMPLEMENTS', 'POWER_TILLERS'],
          equipmentReasons: {
            'TRACTOR': 'Heavy-duty puddling and deep ploughing of flooded paddy fields',
            'IMPLEMENTS': 'Rotavator & Disc Harrow for thorough soil churning and mud leveling',
            'POWER_TILLERS': 'Ideal for nursery bed preparation and tight corner tilling',
          },
          learningVideos: [
            LearningVideo(
              title: 'Paddy Nursery Bed Preparation and Sowing Technique',
              channel: 'ICAR Agronomy Extension',
              duration: '8:45',
              relevance: 'Standard practices for disease-free, vigorous paddy nursery raising.',
              searchQuery: 'rice nursery preparation and sowing methods ICAR',
            ),
            LearningVideo(
              title: 'Direct Seeded Rice (DSR) & Puddling Operations',
              channel: 'Agricultural Technology Center',
              duration: '12:20',
              relevance: 'Tractor and rotavator adjustments for optimal paddy puddling.',
              searchQuery: 'paddy puddling tractor rotavator direct seeding',
            ),
          ],
        );

      case 'GERMINATION':
        return StageIntelligence(
          cropName: 'Rice',
          stage: 'GERMINATION',
          stagePurpose: 'Initial sprout emergence and root anchorage in moist soil.',
          whatToDoNow: [
            'Maintain saturated soil moisture without standing water to allow young sprouts to breathe.',
            'Inspect sprouts daily for uniform emergence and vigor.',
            'Provide light evening irrigation if top soil shows drying cracks.',
            'Keep nursery area clear of stray animals and birds.'
          ],
          importantChecks: [
            'Sprout emergence percentage (target >85%)',
            'Soil surface moisture without waterlogging',
            'Absence of fungal mycelium or damping-off patches',
          ],
          commonProblems: [
            'Soil crusting hindering coleoptile emergence',
            'Pythium seedling blight under cold or excessively wet conditions',
          ],
          precautions: [
            'Do not submerge young sprouts underwater for more than 12 hours.',
            'Avoid walking on soft nursery beds to prevent root damage.',
          ],
          nextStage: 'SEEDLING',
          nextStageRequirements: 'Seedlings reach 2-3 leaf stage with healthy green pigmentation.',
          relatedOperations: ['Nursery Water Regulation', 'Sprout Inspection'],
          relatedEquipmentCategories: ['IRRIGATION', 'POWER_TILLERS'],
          equipmentReasons: {
            'IRRIGATION': 'Water pumps for gentle nursery bed moisture management',
            'POWER_TILLERS': 'Maintaining bunds and surrounding drainage channels',
          },
          learningVideos: [
            LearningVideo(
              title: 'Rice Germination & Nursery Water Management',
              channel: 'Agronomy Today',
              duration: '6:30',
              relevance: 'How to manage soil moisture and prevent damping-off during germination.',
              searchQuery: 'rice germination water management seedling care',
            ),
          ],
        );

      case 'SEEDLING':
        return StageIntelligence(
          cropName: 'Rice',
          stage: 'SEEDLING',
          stagePurpose: 'Seedling growth (3-4 leaf stage) in nursery and preparation for main field transplanting.',
          whatToDoNow: [
            'Maintain 2-3 cm standing water in nursery to keep soil soft for easy seedling pulling.',
            'Apply light nitrogen top-dressing (Zinc Sulphate @ 10kg/acre if deficiency symptoms appear).',
            'Spray prophylactic fungicide if brown spot or blast lesions are observed.',
            'Prepare the main field with final puddling and leveling 2 days before transplanting.',
            'Uproot healthy seedlings gently when they reach 20-25 days old (4-leaf stage).'
          ],
          importantChecks: [
            'Seedling height and stem thickness (15-20 cm height is ideal)',
            'Absence of thrips or leaf folder egg masses',
            'Main field leveling and readiness',
          ],
          commonProblems: [
            'Yellowing of leaves due to zinc or nitrogen deficiency',
            'Stem borer dead hearts or thrips feeding damage',
          ],
          precautions: [
            'Do not delay transplanting beyond 30 days to avoid reduced tillering potential.',
            'Do not damage root crown while pulling nursery seedlings.',
          ],
          nextStage: 'VEGETATIVE',
          nextStageRequirements: 'Main field transplanted at 2-3 seedlings per hill with 20x15 cm spacing.',
          relatedOperations: ['Nursery Weeding', 'Main Field Leveling', 'Seedling Transplanting'],
          relatedEquipmentCategories: ['IMPLEMENTS', 'TRACTOR', 'IRRIGATION'],
          equipmentReasons: {
            'IMPLEMENTS': 'Paddy transplanter for rapid, uniform row spacing and mechanical efficiency',
            'TRACTOR': 'Main field laser leveling and final puddling pass',
            'IRRIGATION': 'Water pump to maintain 3-5 cm field submergence during transplanting',
          },
          learningVideos: [
            LearningVideo(
              title: 'Rice Transplanting Best Practices & Machine Operations',
              channel: 'Farm Tech India',
              duration: '10:15',
              relevance: 'Step-by-step nursery uprooting, spacing, and mechanical transplanter guide.',
              searchQuery: 'rice transplanting methods machine transplanter vs manual',
            ),
          ],
        );

      case 'VEGETATIVE':
        return StageIntelligence(
          cropName: 'Rice',
          stage: 'VEGETATIVE',
          stagePurpose: 'Active tillering, rapid root expansion, and maximum canopy development.',
          whatToDoNow: [
            'Maintain 3-5 cm standing water during active tillering to suppress weeds and encourage root growth.',
            'Complete first mechanical weeding using a cono-weeder or power weeder at 15-20 days after transplanting.',
            'Apply second split of Nitrogen (Urea @ 30-35 kg/acre) and Zinc Sulphate if not applied earlier.',
            'Scout weekly for yellow stem borer, leaf folder, and bacterial leaf blight.',
            'Drain the field for 2-3 days mid-tillering (alternate wetting & drying) to encourage deep root anchoring.'
          ],
          importantChecks: [
            'Tiller count per hill (target 15-20 productive tillers)',
            'Standing water depth (3-5 cm)',
            'Leaf color chart (LCC) index for precise nitrogen timing',
            'Stem borer egg masses on leaf tips',
          ],
          commonProblems: [
            'Yellow Stem Borer causing dead hearts',
            'Leaf Folder rolling leaves and scraping chlorophyll',
            'Sheath Blight and Brown Spot lesions during humid weather',
          ],
          precautions: [
            'Do not allow fields to dry to deep crack stage during active tillering.',
            'Avoid excessive nitrogen application which increases pest susceptibility and lodging.',
          ],
          nextStage: 'FLOWERING',
          nextStageRequirements: 'Panicle initiation visible at the base of the main tiller stem.',
          relatedOperations: ['Weeding & Cono-weeding', 'Nitrogen Top Dressing', 'Irrigation & Drainage', 'Pest Control Spraying'],
          relatedEquipmentCategories: ['POWER_TILLERS', 'IMPLEMENTS', 'IRRIGATION'],
          equipmentReasons: {
            'POWER_TILLERS': 'Cono-weeder & power weeder attachments for inter-row weed incorporation',
            'IMPLEMENTS': 'Tractor-mounted boom sprayer for uniform protective crop spraying',
            'IRRIGATION': 'Reliable water pump for alternating wetting and drying cycles',
          },
          learningVideos: [
            LearningVideo(
              title: 'Rice Vegetative Stage: Tillering & Nutrient Management',
              channel: 'Agronomy Knowledge Extension',
              duration: '14:10',
              relevance: 'Comprehensive guide to achieving maximum productive tillers in paddy.',
              searchQuery: 'rice vegetative tillering fertilizer weed management',
            ),
            LearningVideo(
              title: 'Stem Borer and Leaf Folder Management in Paddy',
              channel: 'Plant Health Clinics',
              duration: '9:45',
              relevance: 'Identification and IPM strategies for vegetative rice insect pests.',
              searchQuery: 'rice stem borer leaf folder control IPM',
            ),
          ],
        );

      case 'FLOWERING':
        return StageIntelligence(
          cropName: 'Rice',
          stage: 'FLOWERING',
          stagePurpose: 'Panicle emergence (booting), anthesis, and pollination.',
          whatToDoNow: [
            'Maintain continuous 5 cm standing water to ensure smooth panicle exertion and pollen viability.',
            'Apply final booster dose of Potash (MOP @ 15-20 kg/acre) to improve grain weight and disease resistance.',
            'Scout during early morning for Gundhi bug (Rice Earhead bug) and False Smut.',
            'Apply prophylactic spray against Neck Blast and Brown Planthopper (BPH) if weather is cloudy and humid.'
          ],
          importantChecks: [
            'Flag leaf health and panicle emergence percentage',
            'Presence of Gundhi bug at milking onset',
            'Brown Planthopper colonies at the base of the plant clumps',
          ],
          commonProblems: [
            'Gundhi bug sucking sap from developing milk grains causing chaffy grains',
            'Neck Blast cutting off nutrient flow to the panicle',
            'Brown Planthopper (BPH) hopper burn',
          ],
          precautions: [
            'Never allow the field to undergo water stress during flowering; even 2 days of drought causes high sterility.',
            'Avoid spraying chemicals during mid-day peak pollination hours (10:00 AM to 1:00 PM).',
          ],
          nextStage: 'FRUITING',
          nextStageRequirements: '90% of panicles fully exerted and petals/anthers withered.',
          relatedOperations: ['Water Level Maintenance', 'Potash Booster Application', 'Earhead Bug Spraying'],
          relatedEquipmentCategories: ['IMPLEMENTS', 'IRRIGATION'],
          equipmentReasons: {
            'IMPLEMENTS': 'Knapsack/Boom sprayer for targeted canopy protection against BPH and blast',
            'IRRIGATION': 'Continuous irrigation supply to prevent flower abortion and sterility',
          },
          learningVideos: [
            LearningVideo(
              title: 'Paddy Flowering & Booting Stage Critical Management',
              channel: 'National Rice Research Extension',
              duration: '11:05',
              relevance: 'Water maintenance, Gundhi bug control, and neck blast prevention.',
              searchQuery: 'rice flowering stage panicle management gundhi bug',
            ),
          ],
        );

      case 'FRUITING':
        return StageIntelligence(
          cropName: 'Rice',
          stage: 'FRUITING',
          stagePurpose: 'Grain filling through milk, dough, and solid grain stages.',
          whatToDoNow: [
            'Maintain 2-3 cm shallow water during milk stage and saturated moisture during dough stage.',
            'Inspect grain filling by squeezing upper and lower panicle grains.',
            'Spray 1% Potassium Nitrate (13-0-45) to enhance 1000-grain weight and luster.',
            'Control late-season False Smut and Rodent infestation in field bunds.'
          ],
          importantChecks: [
            'Grain hardness transitioning from milky to dough state',
            'Absence of False Smut yellow/green spore balls',
            'Bund integrity and rodent burrow activity',
          ],
          commonProblems: [
            'False Smut contaminating grain quality',
            'Grain discoloration due to Helminthosporium / sheath rot',
            'Rodent cutting of mature tillers',
          ],
          precautions: [
            'Do not apply chemical pesticides close to harvest window (adhere to waiting period).',
            'Begin gradual field drainage as grains harden into dough stage.',
          ],
          nextStage: 'MATURITY',
          nextStageRequirements: 'Grains in upper 80% of panicles become golden yellow and hard.',
          relatedOperations: ['Grain Filling Irrigation', 'Late-season Pest Check', 'Field Drainage Planning'],
          relatedEquipmentCategories: ['IRRIGATION', 'IMPLEMENTS'],
          equipmentReasons: {
            'IRRIGATION': 'Final controlled watering before drainage',
            'IMPLEMENTS': 'Sprayers for micronutrient enhancement and grain luster',
          },
          learningVideos: [
            LearningVideo(
              title: 'Rice Grain Filling (Milk & Dough Stage) Best Practices',
              channel: 'Agri Extension Services',
              duration: '8:50',
              relevance: 'Maximizing grain weight, preventing false smut, and pre-drainage steps.',
              searchQuery: 'rice grain filling milk dough stage management',
            ),
          ],
        );

      case 'MATURITY':
        return StageIntelligence(
          cropName: 'Rice',
          stage: 'MATURITY',
          stagePurpose: 'Complete grain hardening, moisture reduction, and harvest readiness.',
          whatToDoNow: [
            'Completely drain the field 10-14 days before expected harvest date to harden the soil for machinery.',
            'Check grain moisture content (ideal harvest moisture is 20-22%).',
            'Ensure 85-90% of panicles have turned straw-golden yellow.',
            'Inspect combine harvester access routes and clean threshing floor/drying yards.',
            'Book combine harvester and tractor transport in advance.'
          ],
          importantChecks: [
            'Grain moisture percentage (20-22% target)',
            'Soil dryness to support heavy combine harvester weight without sinking',
            'Absence of late lodging due to wind',
          ],
          commonProblems: [
            'Over-drying in field leading to grain shattering and milling breakage',
            'Field lodging if unseasonal rains occur before harvest',
          ],
          precautions: [
            'Do not leave mature crop standing too long after physiological maturity.',
            'Ensure complete water drainage to allow harvester traction.',
          ],
          nextStage: 'HARVEST',
          nextStageRequirements: 'Grains fully hard and field dried for machinery entry.',
          relatedOperations: ['Complete Field Drainage', 'Grain Moisture Testing', 'Machinery Booking'],
          relatedEquipmentCategories: ['HARVESTERS', 'TRACTOR'],
          equipmentReasons: {
            'HARVESTERS': 'Tracked or wheeled Combine Harvester booking for timely cutting and threshing',
            'TRACTOR': 'Tractor Trolley preparation for quick field-to-storage grain transit',
          },
          learningVideos: [
            LearningVideo(
              title: 'Judging Paddy Harvest Readiness & Moisture Management',
              channel: 'Rice Farming Institute',
              duration: '7:40',
              relevance: 'How to test grain hardness, avoid shattering losses, and prepare fields.',
              searchQuery: 'paddy maturity harvest readiness moisture testing',
            ),
          ],
        );

      case 'HARVEST':
        return StageIntelligence(
          cropName: 'Rice',
          stage: 'HARVEST',
          stagePurpose: 'Reaping, threshing, winnowing, drying, and grain storage.',
          whatToDoNow: [
            'Operate Combine Harvester during sunny, clear weather when morning dew has dried.',
            'Adjust harvester drum speed and concave clearance to minimize cracked and broken grains.',
            'Sun-dry harvested paddy on clean tarpaulins to bring moisture down to 12-14% for storage.',
            'Collect and bale rice straw or incorporate into soil; avoid open field stubble burning.',
            'Bag dried paddy in clean moisture-proof gunny bags and store on elevated wooden pallets.'
          ],
          importantChecks: [
            'Harvester grain loss behind cutter bar (<1.5%)',
            'Storage grain moisture (must reach <14% before bagging)',
            'Cleanliness of storage bags and absence of weevils',
          ],
          commonProblems: [
            'High moisture storage causing fungal heating and yellow grain discoloration',
            'Grain shattering if cutting during hot afternoon sun',
          ],
          precautions: [
            'Never bag wet grain above 14% moisture.',
            'Do not burn crop residue; use balers or happy seeders for conservation agriculture.',
          ],
          nextStage: 'POST_HARVEST',
          nextStageRequirements: 'Grain safely stored in warehouse and straw cleared for next crop cycle.',
          relatedOperations: ['Combine Harvesting', 'Threshing & Cleaning', 'Sun Drying & Storage', 'Straw Baling'],
          relatedEquipmentCategories: ['HARVESTERS', 'TRACTOR', 'IMPLEMENTS'],
          equipmentReasons: {
            'HARVESTERS': 'Combine Harvester (tracked/wheeled) for single-pass cutting, threshing, and cleaning',
            'TRACTOR': 'Tractor with high-capacity hydraulic tipping trolley for grain haulage',
            'IMPLEMENTS': 'Straw Baler & Mulcher to clear and package rice straw without burning',
          },
          learningVideos: [
            LearningVideo(
              title: 'Modern Paddy Combine Harvesting & Post-Harvest Drying',
              channel: 'Agri Machinery Today',
              duration: '15:20',
              relevance: 'Minimizing machine losses, drum settings, and moisture-safe drying.',
              searchQuery: 'rice combine harvester operations drying storage',
            ),
          ],
        );

      default:
        return _getDefaultStage('Rice', stage);
    }
  }

  // ---------------------------------------------------------------------------
  // COTTON
  // ---------------------------------------------------------------------------
  static StageIntelligence _getCottonStage(String stage) {
    switch (stage) {
      case 'SOWING':
        return StageIntelligence(
          cropName: 'Cotton',
          stage: 'SOWING',
          stagePurpose: 'Deep tillage, ridge & furrow formation, seed treatment, and dibbling.',
          whatToDoNow: [
            'Deep plough the field with MB plough to eradicate perennial weeds and expose pest pupae.',
            'Form ridges and furrows at 90x60 cm or 120x45 cm spacing according to soil type.',
            'Treat seeds with Imidacloprid (for sucking pests) and Pseudomonas fluorescens.',
            'Dibble 1-2 seeds per hill at 3-5 cm depth in moist soil along ridge shoulders.',
            'Apply recommended basal dose of SSP and MOP fertilizers.'
          ],
          importantChecks: ['Soil moisture at 5 cm depth', 'Ridge height and uniformity', 'Seed germination viability (>80%)'],
          commonProblems: ['Pre-emergence seed rot in waterlogged soils', 'Termite attacks on newly sown seeds'],
          precautions: ['Do not sow cotton seeds deeper than 5 cm.', 'Ensure field has excellent surface drainage.'],
          nextStage: 'GERMINATION',
          nextStageRequirements: 'Cotyledons emerged above soil surface across >85% of hills.',
          relatedOperations: ['Deep Ploughing', 'Ridge & Furrow Making', 'Dibbling Sowing'],
          relatedEquipmentCategories: ['TRACTOR', 'IMPLEMENTS'],
          equipmentReasons: {
            'TRACTOR': 'Primary deep tillage and subsoiling for deep taproot penetration',
            'IMPLEMENTS': 'Ridger and Furrow maker for precision cotton bed formation',
          },
          learningVideos: [
            LearningVideo(
              title: 'Cotton Sowing and Ridge Preparation Guide',
              channel: 'Central Institute for Cotton Research (CICR)',
              duration: '10:30',
              relevance: 'Seed treatment, ideal spacing, and ridge dibbling technique.',
              searchQuery: 'cotton sowing ridge furrow dibbling CICR',
            ),
          ],
        );

      case 'GERMINATION':
        return StageIntelligence(
          cropName: 'Cotton',
          stage: 'GERMINATION',
          stagePurpose: 'Cotyledon emergence and root radical establishment.',
          whatToDoNow: [
            'Inspect field for uniform emergence 5-7 days after sowing.',
            'Perform gap-filling within 10 days using soaked seeds if hills missed germination.',
            'Maintain moderate moisture along furrows without flooding seedling crowns.',
          ],
          importantChecks: ['Emerged stand percentage per acre', 'Absence of cutworms and seedling blight'],
          commonProblems: ['Rhizoctonia collar rot in excessive moisture', 'Cutworm damaging emerging cotyledons'],
          precautions: ['Do not allow water to stand on seedling ridges.', 'Complete gap-filling early to avoid uneven canopy.'],
          nextStage: 'SEEDLING',
          nextStageRequirements: 'Seedlings reach 2-4 true leaf stage.',
          relatedOperations: ['Gap Filling', 'Furrow Moisture Regulation'],
          relatedEquipmentCategories: ['IRRIGATION', 'POWER_TILLERS'],
          equipmentReasons: {
            'IRRIGATION': 'Light furrow irrigation management',
            'POWER_TILLERS': 'Minor bund and furrow clearing',
          },
          learningVideos: [
            LearningVideo(
              title: 'Cotton Germination and Early Stand Care',
              channel: 'Cotton Extension Wing',
              duration: '7:15',
              relevance: 'Gap filling and protecting emerging cotton sprouts.',
              searchQuery: 'cotton germination gap filling seedling care',
            ),
          ],
        );

      case 'SEEDLING':
        return StageIntelligence(
          cropName: 'Cotton',
          stage: 'SEEDLING',
          stagePurpose: 'Thinning to single plant per hill and early weed control.',
          whatToDoNow: [
            'Thin out excess seedlings at 15-20 days, retaining one vigorous plant per hill.',
            'Perform first shallow intercultivation to aerate the root zone and uproot young weeds.',
            'Apply prophylactic spray if early sucking pests (thrips, aphids, jassids) appear.',
            'Apply first split of Nitrogen top dressing.'
          ],
          importantChecks: ['Plant population per acre (target ~7,000-10,000 plants/acre)', 'Jassid nymph population on leaf underside'],
          commonProblems: ['Jassids causing leaf hopper burn (yellow margins and curling)', 'Thrips causing leaf crinkling'],
          precautions: ['Never delay thinning; overcrowded plants become lanky and weak.', 'Do not cultivate too deep near taproot.'],
          nextStage: 'VEGETATIVE',
          nextStageRequirements: 'Primary monopodial and sympodial branches initiating.',
          relatedOperations: ['Thinning', 'Intercultivation & Weeding', 'Sucking Pest Spray'],
          relatedEquipmentCategories: ['POWER_TILLERS', 'IMPLEMENTS', 'TRACTOR'],
          equipmentReasons: {
            'POWER_TILLERS': 'Inter-row power weeder for rapid weed removal between cotton rows',
            'IMPLEMENTS': 'Battery/Power knapsack sprayer for targeted sucking pest control',
            'TRACTOR': 'Mini tractor cultivator for intercultivation without damaging plants',
          },
          learningVideos: [
            LearningVideo(
              title: 'Cotton Thinning and Early Sucking Pest Management',
              channel: 'Agronomy Today',
              duration: '9:20',
              relevance: 'Thinning timing and managing jassids and thrips effectively.',
              searchQuery: 'cotton thinning sucking pest management jassid thrips',
            ),
          ],
        );

      case 'VEGETATIVE':
        return StageIntelligence(
          cropName: 'Cotton',
          stage: 'VEGETATIVE',
          stagePurpose: 'Main stem elongation, branch formation, and earthing-up.',
          whatToDoNow: [
            'Perform earthing-up at 40-45 days to support the plant stem and facilitate drainage furrows.',
            'Apply second split of Nitrogen and Boron micronutrient spray.',
            'Monitor closely for whitefly, jassids, and aphids using yellow sticky traps.',
            'Provide furrow irrigation at 10-12 day intervals depending on rainfall.'
          ],
          importantChecks: ['Canopy vigor and sympodial branch count', 'Whitefly nymph count on middle leaves', 'Soil moisture in root zone'],
          commonProblems: ['Whitefly causing sooty mold and transmitting Cotton Leaf Curl Virus (CLCuV)', 'Square shed due to moisture stress'],
          precautions: ['Avoid broad-spectrum synthetic pyrethroids early to conserve natural beneficial predators.', 'Ensure good field drainage during heavy rains.'],
          nextStage: 'FLOWERING',
          nextStageRequirements: 'Square (flower bud) formation clearly visible at sympodial nodes.',
          relatedOperations: ['Earthing Up', 'Nitrogen Top Dressing', 'Whitefly Spraying', 'Furrow Irrigation'],
          relatedEquipmentCategories: ['IMPLEMENTS', 'TRACTOR', 'IRRIGATION'],
          equipmentReasons: {
            'IMPLEMENTS': 'Tractor-mounted boom sprayer or high-clearance sprayer for dense canopy coverage',
            'TRACTOR': 'Tractor with ridger attachment for sturdy earthing-up',
            'IRRIGATION': 'Furrow irrigation pump and drip systems',
          },
          learningVideos: [
            LearningVideo(
              title: 'Cotton Vegetative Stage: Earthing Up and Canopy Management',
              channel: 'Cotton Krishi Vigyan',
              duration: '11:40',
              relevance: 'Fertilizer schedule, earthing up mechanics, and whitefly IPM.',
              searchQuery: 'cotton vegetative stage earthing up whitefly management',
            ),
          ],
        );

      case 'FLOWERING':
        return StageIntelligence(
          cropName: 'Cotton',
          stage: 'FLOWERING',
          stagePurpose: 'Square maturation, blooming, and pink/spotted bollworm monitoring.',
          whatToDoNow: [
            'Install pheromone traps (4-5 per acre) to detect Pink Bollworm (PBW) moth emergence.',
            'Spray 1% 19-19-19 and 0.5% Boron during peak flowering to prevent square and flower drop.',
            'Inspect rosette flowers daily and destroy pink bollworm infested blossoms.',
            'Maintain adequate soil moisture; drought at flowering causes heavy square drop.'
          ],
          importantChecks: ['Rosette flower count (PBW indicator)', 'Pheromone trap daily moth catch (>8 moths/trap/night threshold)', 'Flower shed rate'],
          commonProblems: ['Pink Bollworm larvae boring into flower buds and young bolls', 'Square drop due to high heat or water stress'],
          precautions: ['Do not spray during morning pollinator activity.', 'Maintain optimal soil moisture to avoid abortion of squares.'],
          nextStage: 'FRUITING',
          nextStageRequirements: 'Successful boll set across >75% of flowering nodes.',
          relatedOperations: ['Pheromone Trap Installation', 'Foliar Nutrient Spraying', 'Bollworm Management', 'Regulated Irrigation'],
          relatedEquipmentCategories: ['IMPLEMENTS', 'IRRIGATION'],
          equipmentReasons: {
            'IMPLEMENTS': 'High-pressure sprayer for thorough flower and square penetration',
            'IRRIGATION': 'Controlled furrow or drip irrigation to sustain flowering',
          },
          learningVideos: [
            LearningVideo(
              title: 'Cotton Flowering Stage: Pink Bollworm Detection and Control',
              channel: 'ICAR-CICR Cotton Channel',
              duration: '13:15',
              relevance: 'Installing pheromone traps, rosette flower scout, and IPM sprays.',
              searchQuery: 'cotton pink bollworm management flowering stage ICAR',
            ),
          ],
        );

      case 'FRUITING':
        return StageIntelligence(
          cropName: 'Cotton',
          stage: 'FRUITING',
          stagePurpose: 'Boll development, fiber elongation, and boll rot prevention.',
          whatToDoNow: [
            'Apply Potassium Nitrate (13-0-45 @ 10g/L) and Magnesium Sulphate to boost boll weight and fiber quality.',
            'Inspect developing green bolls for boreholes and internal PBW larvae.',
            'Provide light irrigation during boll filling; do not over-irrigate to avoid boll rot.',
            'Nip terminal shoots (detopping) at 85-90 days to divert energy to boll development.'
          ],
          importantChecks: ['Boll weight and retention count', 'Internal boll locule damage', 'Reddening of leaves (Magnesium deficiency)'],
          commonProblems: ['Pink bollworm locule damage resulting in stained lint', 'Internal boll rot in dense humid canopies'],
          precautions: ['Detop only the main apical bud, do not cut sympodial branches.', 'Avoid nitrogen application late in boll development.'],
          nextStage: 'MATURITY',
          nextStageRequirements: 'Lower bolls reach full size and start cracking open.',
          relatedOperations: ['Boll Booster Spray', 'Detopping', 'Bollworm Protective Spray'],
          relatedEquipmentCategories: ['IMPLEMENTS', 'IRRIGATION'],
          equipmentReasons: {
            'IMPLEMENTS': 'Foliar spray equipment for nutrient and boll protection',
            'IRRIGATION': 'Critical boll filling water supply',
          },
          learningVideos: [
            LearningVideo(
              title: 'Cotton Boll Development and Nutrition Guide',
              channel: 'Agronomy Knowledge Extension',
              duration: '10:05',
              relevance: 'Foliar sprays for big bolls and avoiding leaf reddening.',
              searchQuery: 'cotton boll development foliar spray magnesium boron',
            ),
          ],
        );

      case 'MATURITY':
        return StageIntelligence(
          cropName: 'Cotton',
          stage: 'MATURITY',
          stagePurpose: 'Boll opening, fiber drying, and picking preparation.',
          whatToDoNow: [
            'Withhold irrigation completely once 50% of bolls have naturally opened.',
            'Keep cotton field clean and clear from fallen leaves and debris.',
            'Plan manual or mechanical picking during dry sunny hours.',
            'Prepare clean cloth bags for pickers; avoid synthetic plastic bags.'
          ],
          importantChecks: ['Percentage of opened bolls (target >60% for first picking)', 'Moisture in seed cotton lint', 'Absence of trash'],
          commonProblems: ['Yellow/stained cotton from honeydew or late bollworm', 'Trash and leaf contamination during windy conditions'],
          precautions: ['Do not pick damp cotton with morning dew.', 'Never use plastic/fertilizer bags for cotton storage to prevent contamination.'],
          nextStage: 'HARVEST',
          nextStageRequirements: 'Fluffy dry bolls ready for first clean picking.',
          relatedOperations: ['Field Drainage', 'Harvest Planning', 'Storage Bag Preparation'],
          relatedEquipmentCategories: ['TRACTOR', 'IMPLEMENTS'],
          equipmentReasons: {
            'TRACTOR': 'Tractor trolley for bulk seed cotton transportation to ginning mills',
            'IMPLEMENTS': 'Weighing scales and moisture meters for quality testing',
          },
          learningVideos: [
            LearningVideo(
              title: 'Judging Cotton Harvest Readiness & Clean Picking',
              channel: 'Cotton Quality Council',
              duration: '8:30',
              relevance: 'Harvest timing, avoiding contamination, and storage precautions.',
              searchQuery: 'cotton harvest picking readiness clean cotton practices',
            ),
          ],
        );

      case 'HARVEST':
        return StageIntelligence(
          cropName: 'Cotton',
          stage: 'HARVEST',
          stagePurpose: 'Multi-stage picking of fluffy clean cotton, grading, and stalk shredding.',
          whatToDoNow: [
            'Pick cotton in 2-3 passes, selecting only fully opened, fluffy bolls.',
            'Separate clean white cotton from stained/damaged bolls into distinct sacks.',
            'Sun-dry picked seed cotton for 2-3 days on clean tarpaulins to reduce moisture to <8%.',
            'Uproot or shred cotton stalks immediately after final picking using a tractor rotary slasher to break pest cycles.'
          ],
          importantChecks: ['Seed cotton moisture content (<8%)', 'Trash content and fiber cleanliness', 'Complete destruction of leftover green bolls to kill diapause PBW'],
          commonProblems: ['Fungal staining if stored damp', 'Pink bollworm carryover to next season if stalks are left standing in field'],
          precautions: ['Uproot and destroy all stalks after final pick; never leave ratoon cotton.', 'Store in dry, rodent-proof godowns.'],
          nextStage: 'POST_HARVEST',
          nextStageRequirements: 'Field cleared with rotary shredder and seed cotton marketed.',
          relatedOperations: ['Cotton Picking', 'Grading & Sun Drying', 'Stalk Shredding & Field Clearing'],
          relatedEquipmentCategories: ['TRACTOR', 'IMPLEMENTS'],
          equipmentReasons: {
            'TRACTOR': 'Tractor with rotary slasher/mulcher for post-harvest cotton stalk destruction',
            'IMPLEMENTS': 'Tractor trolley for direct mill delivery',
          },
          learningVideos: [
            LearningVideo(
              title: 'Clean Cotton Picking Techniques and Stalk Management',
              channel: 'ICAR-CICR',
              duration: '12:45',
              relevance: 'Standard clean picking guidelines, grading, and shredder operation.',
              searchQuery: 'cotton picking grading stalk shredder rotary slasher',
            ),
          ],
        );

      default:
        return _getDefaultStage('Cotton', stage);
    }
  }

  // ---------------------------------------------------------------------------
  // MAIZE (CORN)
  // ---------------------------------------------------------------------------
  static StageIntelligence _getMaizeStage(String stage) {
    switch (stage) {
      case 'SOWING':
        return StageIntelligence(
          cropName: 'Maize',
          stage: 'SOWING',
          stagePurpose: 'Seedbed preparation, ridges & furrows, seed treatment, and sowing with seed drill.',
          whatToDoNow: [
            'Plough field twice with cultivator and rotavator to achieve a fine, clod-free tilth.',
            'Open ridges and furrows at 60x20 cm spacing.',
            'Treat hybrid maize seeds with Cyantraniliprole / Thiamethoxam to protect against Fall Armyworm.',
            'Dibble seed at 4-5 cm depth on the side of the ridge at 1/3rd height from the bottom.',
            'Apply basal dose of DAP, MOP, and Zinc Sulphate (@ 10kg/acre).'
          ],
          importantChecks: ['Soil tilth and clod size', 'Sowing depth (4-5 cm)', 'Basal fertilizer placement 5 cm away from seeds'],
          commonProblems: ['Bird predation on freshly sown seeds', 'Seed rot if waterlogged in furrow bottom'],
          precautions: ['Do not sow in deep standing water in the bottom of the furrow.', 'Do not mix zinc fertilizer directly with phosphatic fertilizers.'],
          nextStage: 'GERMINATION',
          nextStageRequirements: 'Coleoptile emergence across field within 4 to 6 days.',
          relatedOperations: ['Fine Seedbed Preparation', 'Ridge & Furrow Making', 'Precision Sowing'],
          relatedEquipmentCategories: ['TRACTOR', 'IMPLEMENTS'],
          equipmentReasons: {
            'TRACTOR': 'Tractor for deep ploughing and rotavating to create loose, aerated seedbed',
            'IMPLEMENTS': 'Pneumatic Planter / Seed Drill with fertilizer attachment for uniform depth',
          },
          learningVideos: [
            LearningVideo(
              title: 'Hybrid Maize Sowing and Seed Treatment Protocol',
              channel: 'Indian Institute of Maize Research (IIMR)',
              duration: '9:30',
              relevance: 'Fall armyworm seed treatment and tractor planter setup.',
              searchQuery: 'maize sowing seed drill planter seed treatment IIMR',
            ),
          ],
        );

      case 'GERMINATION':
        return StageIntelligence(
          cropName: 'Maize',
          stage: 'GERMINATION',
          stagePurpose: 'Sprout emergence and primary root system establishment.',
          whatToDoNow: [
            'Inspect field for uniform emergence at 5 days post-sowing.',
            'Carry out gap filling within 7-8 days with pre-soaked seeds.',
            'Provide light life-irrigation in furrows if soil surface is dry.',
          ],
          importantChecks: ['Uniformity of emerged stand (>90%)', 'Absence of surface crusting'],
          commonProblems: ['Crusting preventing emergence after heavy rain', 'Ants or termites attacking seeds'],
          precautions: ['Do not over-water; young maize roots are sensitive to waterlogging.'],
          nextStage: 'SEEDLING',
          nextStageRequirements: 'Seedlings reach V2 to V4 leaf stage (knee-high onset).',
          relatedOperations: ['Life Irrigation', 'Stand Inspection'],
          relatedEquipmentCategories: ['IRRIGATION', 'POWER_TILLERS'],
          equipmentReasons: {
            'IRRIGATION': 'Light furrow irrigation pump management',
            'POWER_TILLERS': 'Furrow clearing',
          },
          learningVideos: [
            LearningVideo(
              title: 'Maize Germination & Stand Establishment',
              channel: 'Maize Agronomy Center',
              duration: '6:50',
              relevance: 'Checking early stand uniformity and life irrigation timing.',
              searchQuery: 'maize germination early care gap filling',
            ),
          ],
        );

      case 'SEEDLING':
        return StageIntelligence(
          cropName: 'Maize',
          stage: 'SEEDLING',
          stagePurpose: 'V3-V5 stage, thinning, and mandatory Fall Armyworm (FAW) whorl scouting.',
          whatToDoNow: [
            'Thin out weak plants at 12-15 days, retaining one vigorous plant every 20 cm.',
            'Scout central whorls for Fall Armyworm (FAW) pinholes and sawdust-like frass.',
            'Apply whorl application of Emamectin Benzoate or Chlorantraniliprole if FAW is detected.',
            'Apply first top-dressing of Urea (30 kg/acre).'
          ],
          importantChecks: ['Fall Armyworm whorl damage percentage (threshold >5%)', 'Weed competition in inter-row spaces'],
          commonProblems: ['Fall Armyworm (Spodoptera frugiperda) devastating central leaf whorls'],
          precautions: ['Direct insecticidal sprays directly into the leaf whorl, not just broadcast on top.'],
          nextStage: 'VEGETATIVE',
          nextStageRequirements: 'V6 to V8 knee-high stage with thick stalk development.',
          relatedOperations: ['Thinning', 'FAW Whorl Spraying', 'First Nitrogen Top Dressing'],
          relatedEquipmentCategories: ['IMPLEMENTS', 'POWER_TILLERS'],
          equipmentReasons: {
            'IMPLEMENTS': 'Knapsack sprayer with nozzle directed into leaf whorls for FAW control',
            'POWER_TILLERS': 'Inter-row power weeder for weed eradication',
          },
          learningVideos: [
            LearningVideo(
              title: 'Fall Armyworm (FAW) Control in Maize: Whorl Application',
              channel: 'ICAR Maize Directorate',
              duration: '11:15',
              relevance: 'Identification, scouting thresholds, and targeted whorl spray technique.',
              searchQuery: 'maize fall armyworm identification control whorl spray ICAR',
            ),
          ],
        );

      case 'VEGETATIVE':
        return StageIntelligence(
          cropName: 'Maize',
          stage: 'VEGETATIVE',
          stagePurpose: 'Knee-high to grand growth (V8-V12), rapid biomass accumulation, and earthing-up.',
          whatToDoNow: [
            'Perform earthing-up at 30-35 days to provide anchorage and prevent root lodging.',
            'Apply second split of Urea (35 kg/acre) before earthing up.',
            'Maintain regular furrow irrigation every 8-10 days.',
            'Scout for FAW and Stem Borer; apply biocontrol (Trichogramma cards) or targeted sprays.'
          ],
          importantChecks: ['Plant height and stalk girth', 'Brace root formation at basal nodes', 'Absence of zinc deficiency (white bud symptom)'],
          commonProblems: ['Stem borer tunneling into main stalk', 'Weed smothering during rapid growth'],
          precautions: ['Earthing-up is critical; without it, heavy winds will cause severe crop lodging.'],
          nextStage: 'FLOWERING',
          nextStageRequirements: 'Tassel emergence at top of plant and silk emergence in leaf axils.',
          relatedOperations: ['Earthing Up & Ridging', 'Second Top Dressing', 'Furrow Irrigation'],
          relatedEquipmentCategories: ['TRACTOR', 'IMPLEMENTS', 'IRRIGATION'],
          equipmentReasons: {
            'TRACTOR': 'Tractor ridger for rapid earthing-up along crop rows',
            'IMPLEMENTS': 'Boom sprayer for canopy nutrition and pest control',
            'IRRIGATION': 'Furrow irrigation pumps to prevent moisture stress',
          },
          learningVideos: [
            LearningVideo(
              title: 'Knee-High Maize Care: Earthing Up and Fertilizer Top Dressing',
              channel: 'Farm Tech Extension',
              duration: '10:45',
              relevance: 'Proper earthing up mechanics and nutrient timing for maximum cob size.',
              searchQuery: 'maize knee high stage earthing up fertilizer irrigation',
            ),
          ],
        );

      case 'FLOWERING':
        return StageIntelligence(
          cropName: 'Maize',
          stage: 'FLOWERING',
          stagePurpose: 'Tasseling (pollen shed) and silking (ovule fertilization).',
          whatToDoNow: [
            'Ensure zero moisture stress during tasseling and silking (most critical water stage).',
            'Apply final booster dose of Potash (MOP @ 15 kg/acre) to optimize grain filling.',
            'Inspect silks for FAW larvae feeding on silk tips.',
            'Ensure synchronized pollen shed and silk reception.'
          ],
          importantChecks: ['Silk emergence and freshness (moist, receptive silks)', 'Absence of silk clipping by FAW or beetles', 'Adequate soil moisture'],
          commonProblems: ['Drought stress causing desynchronization (tasseling completes before silks emerge)', 'FAW eating silks leading to barren cobs'],
          precautions: ['Even 2 days of drought during silking reduces cob yield by 40-50%. Maintain irrigation!'],
          nextStage: 'FRUITING',
          nextStageRequirements: 'Silks turn brown and dry, indicating completed fertilization.',
          relatedOperations: ['Critical Flowering Irrigation', 'Silk Protection Spray', 'Potash Application'],
          relatedEquipmentCategories: ['IRRIGATION', 'IMPLEMENTS'],
          equipmentReasons: {
            'IRRIGATION': 'Heavy furrow irrigation to sustain pollination and prevent cob sterility',
            'IMPLEMENTS': 'Sprayers for silk protection against FAW',
          },
          learningVideos: [
            LearningVideo(
              title: 'Maize Tasseling and Silking: Critical Water and Pest Management',
              channel: 'Maize Research Center',
              duration: '9:15',
              relevance: 'Why silking moisture is paramount to avoid missing grain lines on cobs.',
              searchQuery: 'maize tasseling silking stage water management pollen',
            ),
          ],
        );

      case 'FRUITING':
        return StageIntelligence(
          cropName: 'Maize',
          stage: 'FRUITING',
          stagePurpose: 'Grain filling (milky, dough, and dent stages) in developing cobs.',
          whatToDoNow: [
            'Maintain good furrow moisture through the dough stage.',
            'Inspect developing cobs by pulling back husk tip to verify tip-filling.',
            'Spray 1% Potassium Nitrate (13-0-45) to enhance test weight and grain density.',
            'Control cob borer and bird damage as grains enter milk stage.'
          ],
          importantChecks: ['Grain denting progress', 'Cob size and full tip filling', 'Absence of ear rot fungi'],
          commonProblems: ['Cob rot (Fusarium) during unseasonal late rains', 'Bird and rodent damage to sweet milky grains'],
          precautions: ['Gradually taper off irrigation as grains pass dent stage.'],
          nextStage: 'MATURITY',
          nextStageRequirements: 'Black layer formation at grain attachment base.',
          relatedOperations: ['Grain Filling Irrigation', 'Cob Inspection', 'Foliar Nutrient Spray'],
          relatedEquipmentCategories: ['IRRIGATION', 'IMPLEMENTS'],
          equipmentReasons: {
            'IRRIGATION': 'Final furrow watering before pre-harvest dry-down',
            'IMPLEMENTS': 'Sprayers for foliar potassium application',
          },
          learningVideos: [
            LearningVideo(
              title: 'Maize Grain Filling (Milk to Dent Stage) Best Practices',
              channel: 'Agronomy Knowledge Network',
              duration: '8:40',
              relevance: 'Maximizing cob test weight and checking the grain milk line.',
              searchQuery: 'maize grain filling milk dent stage cob filling',
            ),
          ],
        );

      case 'MATURITY':
        return StageIntelligence(
          cropName: 'Maize',
          stage: 'MATURITY',
          stagePurpose: 'Physiological maturity (black layer formation), husk drying, and field dry-down.',
          whatToDoNow: [
            'Withhold irrigation completely to allow natural field drying.',
            'Check for black layer at the base of kernels (indicates max dry matter accumulation).',
            'Verify outer husk leaves have turned dry, papery brown.',
            'Book maize sheller / combine harvester and transport vehicles in advance.'
          ],
          importantChecks: ['Kernel moisture content (target 18-20% for harvest)', 'Black layer presence in scraped kernels', 'Standing stalk strength'],
          commonProblems: ['Stalk lodging if left over-mature in wet conditions', 'Aflatoxin development if infected cobs are left in humid field'],
          precautions: ['Harvest promptly once grain moisture hits 20% to avoid field losses.'],
          nextStage: 'HARVEST',
          nextStageRequirements: 'Grains hard and moisture below 20%.',
          relatedOperations: ['Black Layer Verification', 'Harvest Scheduling'],
          relatedEquipmentCategories: ['HARVESTERS', 'TRACTOR'],
          equipmentReasons: {
            'HARVESTERS': 'Maize Combine Harvester / De-husker for mechanical harvest',
            'TRACTOR': 'Tractor with high-walled trolley for bulky cob transport',
          },
          learningVideos: [
            LearningVideo(
              title: 'Identifying Black Layer & Maize Maturity for Harvest',
              channel: 'IIMR Extension',
              duration: '7:20',
              relevance: 'How to check physiological maturity and plan threshing.',
              searchQuery: 'maize black layer maturity harvest moisture test',
            ),
          ],
        );

      case 'HARVEST':
        return StageIntelligence(
          cropName: 'Maize',
          stage: 'HARVEST',
          stagePurpose: 'Cob picking, dehusking, shelling, grain drying, and stalk residue mulching.',
          whatToDoNow: [
            'Harvest cobs mechanically with combine or manually pluck mature dry cobs.',
            'Operate tractor-driven maize dehusker-cum-sheller to separate clean grain from cobs.',
            'Sun-dry separated grains on tarpaulins to achieve <12% moisture for safe storage.',
            'Shred remaining maize stalks with a tractor flail mower or rotavator to enrich soil organic matter.'
          ],
          importantChecks: ['Shelling damage (broken grain percentage <2%)', 'Stored grain moisture (<12%)', 'Aflatoxin-free clean grain'],
          commonProblems: ['Grain cracking in sheller due to high drum RPM', 'Storage weevils (Sitophilus zeamais) in humid godowns'],
          precautions: ['Never store maize grain with moisture above 13% (risk of toxic aflatoxin).', 'Do not burn maize stalks; chop and incorporate.'],
          nextStage: 'POST_HARVEST',
          nextStageRequirements: 'Grain safely bagged at <12% moisture and field ready for next crop.',
          relatedOperations: ['Cob Harvesting', 'Dehusking & Shelling', 'Grain Drying & Bagging', 'Stalk Mulching'],
          relatedEquipmentCategories: ['HARVESTERS', 'TRACTOR', 'IMPLEMENTS'],
          equipmentReasons: {
            'HARVESTERS': 'Tractor PTO-operated Maize Dehusker-cum-Sheller for fast grain separation',
            'TRACTOR': 'Tractor for hauling and powering post-harvest machinery',
            'IMPLEMENTS': 'Flail Mower / Mulcher to chop and recycle tough maize stalks',
          },
          learningVideos: [
            LearningVideo(
              title: 'Modern Maize Harvesting, Shelling and Safe Storage',
              channel: 'Agricultural Machinery Channel',
              duration: '13:50',
              relevance: 'Setting up maize shellers, reducing grain damage, and storage drying.',
              searchQuery: 'maize harvesting dehusker sheller machine storage moisture',
            ),
          ],
        );

      default:
        return _getDefaultStage('Maize', stage);
    }
  }

  // ---------------------------------------------------------------------------
  // TOMATO
  // ---------------------------------------------------------------------------
  static StageIntelligence _getTomatoStage(String stage) {
    switch (stage) {
      case 'SOWING':
        return StageIntelligence(
          cropName: 'Tomato',
          stage: 'SOWING',
          stagePurpose: 'Pro-tray nursery sowing in cocopeat, greenhouse protection, and seedling raising.',
          whatToDoNow: [
            'Fill 98-cell pro-trays with sterilized, enriched cocopeat and neem cake mixture.',
            'Sow 1 treated hybrid tomato seed per cell at 0.5 cm depth.',
            'Stack sown trays for 3-4 days in dark until radicle emergence, then transfer to shade net.',
            'Irrigate gently with a fine rose can twice daily.',
            'Plough main field and lay drip irrigation laterals with silver-black mulch film.'
          ],
          importantChecks: ['Cocopeat moisture without waterlogging', 'Net house aphid/whitefly protection', 'Main field drip system pressure'],
          commonProblems: ['Damping off (Pythium) in excessively wet cocopeat', 'Whitefly transmitting Leaf Curl Virus in open nursery'],
          precautions: ['Always raise tomato seedlings in 40-mesh insect-proof shade nets.', 'Do not sow seeds too deep.'],
          nextStage: 'GERMINATION',
          nextStageRequirements: 'Cotyledons emerged in >90% of tray cells.',
          relatedOperations: ['Pro-tray Sowing', 'Shade Net Protection', 'Main Field Mulching'],
          relatedEquipmentCategories: ['IMPLEMENTS', 'TRACTOR', 'IRRIGATION'],
          equipmentReasons: {
            'IMPLEMENTS': 'Bed maker and plastic mulch laying machine for main field preparation',
            'TRACTOR': 'Deep rotavator tillage for raised vegetable beds',
            'IRRIGATION': 'Drip irrigation filter and lateral setup',
          },
          learningVideos: [
            LearningVideo(
              title: 'Tomato Pro-tray Nursery Raising and Mulching Guide',
              channel: 'Indian Institute of Horticultural Research (IIHR)',
              duration: '11:20',
              relevance: 'Sterilized cocopeat pro-tray sowing and raised bed mulching.',
              searchQuery: 'tomato pro tray nursery sowing mulching IIHR',
            ),
          ],
        );

      case 'SEEDLING':
      case 'GERMINATION':
        return StageIntelligence(
          cropName: 'Tomato',
          stage: stage,
          stagePurpose: 'Seedling hardening in nursery and transplanting onto mulched raised beds.',
          whatToDoNow: [
            'Harden 20-25 day old seedlings by reducing irrigation 3 days prior to transplanting.',
            'Dip seedling roots in Pseudomonas fluorescens or Trichoderma slurry.',
            'Transplant in evening hours onto raised beds with 120x45 cm spacing.',
            'Provide immediate drip fertigation with 19-19-19 starter solution.',
          ],
          importantChecks: ['Seedling vigor and root ball firmness', 'Drip dripper alignment directly at plant base', 'Soil moisture under mulch'],
          commonProblems: ['Transplant shock in hot afternoon sun', 'Cutworms cutting young stems at soil level'],
          precautions: ['Always transplant in the late afternoon (4:00 PM onwards) to reduce shock.'],
          nextStage: 'VEGETATIVE',
          nextStageRequirements: 'Seedlings established with active new shoot growth.',
          relatedOperations: ['Seedling Hardening', 'Transplanting to Raised Beds', 'Starter Fertigation'],
          relatedEquipmentCategories: ['IRRIGATION', 'IMPLEMENTS'],
          equipmentReasons: {
            'IRRIGATION': 'Drip fertigation system with venturi injector',
            'IMPLEMENTS': 'Battery knapsack sprayer for starter root drenching',
          },
          learningVideos: [
            LearningVideo(
              title: 'Tomato Transplanting on Mulch Beds & Starter Nutrition',
              channel: 'Horticulture Tech',
              duration: '9:40',
              relevance: 'Root dipping, evening transplanting, and early fertigation schedule.',
              searchQuery: 'tomato transplanting mulch raised bed drip fertigation',
            ),
          ],
        );

      case 'VEGETATIVE':
        return StageIntelligence(
          cropName: 'Tomato',
          stage: 'VEGETATIVE',
          stagePurpose: 'Staking, trellis tying, fertigation, and sucker pruning.',
          whatToDoNow: [
            'Install bamboo poles/GI wire trellises and stake tomato plants at 20-25 days after transplanting.',
            'Prune lower lateral suckers to maintain 2-3 main productive stems.',
            'Run weekly drip fertigation with 19-19-19, Magnesium Sulphate, and Micronutrients.',
            'Spray for Tuta absoluta (pinworm), whitefly, and early blight prevention.'
          ],
          importantChecks: ['Staking tie firmness without strangling stems', 'Tuta absoluta leaf mines and pheromone trap counts', 'Uniformity of drip flow'],
          commonProblems: ['Tuta absoluta leaf miner boring into leaves and stems', 'Tomato Leaf Curl Virus (ToLCV) caused by whiteflies'],
          precautions: ['Staking is mandatory for indeterminate hybrids to avoid soil-borne fruit rots.', 'Avoid overhead sprinkler irrigation (promotes blight).'],
          nextStage: 'FLOWERING',
          nextStageRequirements: 'First flower clusters (trusses) blooming vigorously.',
          relatedOperations: ['Staking & Trellising', 'Pruning Lateral Suckers', 'Drip Fertigation', 'Tuta Absoluta Spraying'],
          relatedEquipmentCategories: ['IMPLEMENTS', 'IRRIGATION'],
          equipmentReasons: {
            'IMPLEMENTS': 'Motorized power sprayer for dense vegetable canopy penetration',
            'IRRIGATION': 'Automated drip irrigation and fertigation system',
          },
          learningVideos: [
            LearningVideo(
              title: 'Tomato Staking, Trellising and Pruning Best Practices',
              channel: 'Vegetable Farming Hub',
              duration: '12:15',
              relevance: 'How to build GI wire trellis, prune suckers, and control Tuta absoluta.',
              searchQuery: 'tomato staking trellising pruning fertigation tuta absoluta',
            ),
          ],
        );

      case 'FLOWERING':
        return StageIntelligence(
          cropName: 'Tomato',
          stage: 'FLOWERING',
          stagePurpose: 'Truss flowering, pollination, fruit set, and blossom end rot prevention.',
          whatToDoNow: [
            'Foliar spray Boron (1g/L) and Planofix / NAA to enhance fruit set and reduce flower drop.',
            'Fertigate with Calcium Nitrate through drip to prevent Blossom End Rot (black bottom fruit).',
            'Maintain uniform drip moisture; fluctuating moisture triggers severe flower and fruit drop.',
            'Install pheromone traps for Helicoverpa fruit borer.'
          ],
          importantChecks: ['Flower set percentage per truss', 'Blossom end condition of developing marble-sized fruits', 'Calcium levels in fertigation'],
          commonProblems: ['Blossom End Rot (calcium deficiency under water fluctuation)', 'Helicoverpa armigera boring into young green fruits'],
          precautions: ['Never let soil dry out between irrigations during flowering.', 'Do not spray chemical insecticides during peak bee foraging hours.'],
          nextStage: 'FRUITING',
          nextStageRequirements: 'Marble to lemon-sized green tomatoes developing uniformly across trusses.',
          relatedOperations: ['Calcium & Boron Fertigation', 'Fruit Borer Monitoring', 'Regulated Drip Scheduling'],
          relatedEquipmentCategories: ['IRRIGATION', 'IMPLEMENTS'],
          equipmentReasons: {
            'IRRIGATION': 'Precise drip irrigation to avoid moisture stress cycles',
            'IMPLEMENTS': 'Fine mist knapsack sprayer for micronutrient and hormone spray',
          },
          learningVideos: [
            LearningVideo(
              title: 'Tomato Flowering Stage: Preventing Flower Drop & Blossom End Rot',
              channel: 'Horticulture Agronomy Extension',
              duration: '10:50',
              relevance: 'Calcium-Boron application, water balance, and fruit borer prevention.',
              searchQuery: 'tomato flower drop prevention blossom end rot calcium boron',
            ),
          ],
        );

      case 'FRUITING':
        return StageIntelligence(
          cropName: 'Tomato',
          stage: 'FRUITING',
          stagePurpose: 'Fruit sizing, firmness accumulation, and ripening onset (breaker stage).',
          whatToDoNow: [
            'Fertigate with high-potassium grade (0-0-50 Potassium Sulphate) to boost fruit size and red color.',
            'Scout for fruit borer boreholes; remove and bury infested green fruits.',
            'Maintain continuous staking support as heavy fruit trusses develop.',
            'Ensure shade or canopy cover to prevent fruit sunscald in high temperature.'
          ],
          importantChecks: ['Fruit size, firmness, and skin glossiness', 'Absence of fruit borer entry holes', 'Proper trellis tie support'],
          commonProblems: ['Fruit borer ruining marketable fruits', 'Fruit cracking due to sudden heavy irrigation after dry spell'],
          precautions: ['Maintain constant drip moisture to prevent skin cracking.', 'Observe strict pre-harvest intervals for any spray.'],
          nextStage: 'MATURITY',
          nextStageRequirements: 'First fruits reach breaker / pink stage (color turn).',
          relatedOperations: ['Potassium Fertigation', 'Fruit Borer Protection', 'Trellis Reinforcement'],
          relatedEquipmentCategories: ['IRRIGATION', 'IMPLEMENTS'],
          equipmentReasons: {
            'IRRIGATION': 'Consistent drip delivery for uniform fruit expansion',
            'IMPLEMENTS': 'Foliar sprayers for fruit finishing nutrients',
          },
          learningVideos: [
            LearningVideo(
              title: 'Tomato Fruit Sizing, Color Development and Borer Control',
              channel: 'Modern Vegetable Farmer',
              duration: '9:30',
              relevance: 'Potassium nutrition, preventing fruit cracking, and IPM sprays.',
              searchQuery: 'tomato fruit sizing color development fruit borer cracking',
            ),
          ],
        );

      case 'MATURITY':
      case 'HARVEST':
        return StageIntelligence(
          cropName: 'Tomato',
          stage: stage,
          stagePurpose: 'Multi-pass selective picking, grading, packing in plastic crates, and marketing.',
          whatToDoNow: [
            'Harvest fruits at Breaker / Turning stage for long-distance transport; Red Ripe for local market.',
            'Pick early in the morning by gently twisting fruit with calyx intact.',
            'Place harvested tomatoes carefully into ventilated plastic crates (avoid over-stacking).',
            'Grade tomatoes by size, color uniformity, and skin blemish freedom.',
            'Continue drip fertigation (0-0-50) to support subsequent flushes of younger trusses.'
          ],
          importantChecks: ['Harvest stage color (breaker vs red ripe)', 'Crate packing quality without fruit bruising', 'Post-harvest shelf life'],
          commonProblems: ['Fruit bruising during rough handling in field', 'Post-harvest sour rot in hot storage'],
          precautions: ['Never dump tomatoes on bare ground.', 'Use standard 20 kg plastic crates, not gunny bags.'],
          nextStage: 'POST_HARVEST',
          nextStageRequirements: 'Harvest cycles completed and old vines dismantled for next crop.',
          relatedOperations: ['Selective Picking', 'Grading & Crate Packing', 'Cold Chain Transport'],
          relatedEquipmentCategories: ['IMPLEMENTS', 'TRACTOR'],
          equipmentReasons: {
            'IMPLEMENTS': 'Ventilated plastic harvesting crates and electronic grading scales',
            'TRACTOR': 'Tractor with trailer for rapid transit to wholesale mandi',
          },
          learningVideos: [
            LearningVideo(
              title: 'Tomato Harvesting, Sorting, Grading and Crate Packaging',
              channel: 'IIHR Vegetable Post-Harvest Division',
              duration: '11:00',
              relevance: 'Breaker stage picking, crate handling, and maximizing market realization.',
              searchQuery: 'tomato harvesting grading crate packing market post harvest',
            ),
          ],
        );

      default:
        return _getDefaultStage('Tomato', stage);
    }
  }

  // ---------------------------------------------------------------------------
  // WHEAT
  // ---------------------------------------------------------------------------
  static StageIntelligence _getWheatStage(String stage) {
    switch (stage) {
      case 'SOWING':
        return StageIntelligence(
          cropName: 'Wheat',
          stage: 'SOWING',
          stagePurpose: 'Seedbed preparation and seed drilling with basal fertilization.',
          whatToDoNow: [
            'Prepare well-pulverized seedbed with 2 cultivator passes and 1 rotavator pass.',
            'Treat seed with Carboxin / Thiram (2.5g/kg) and Azotobacter biofertilizer.',
            'Sow using zero-till seed drill or conventional drill at 5 cm depth with 20-22 cm row spacing.',
            'Apply basal dose of DAP (50 kg/acre) and MOP (20 kg/acre) placed below seeds.'
          ],
          importantChecks: ['Soil moisture for germination', 'Sowing depth (must not exceed 5-6 cm)'],
          commonProblems: ['Deep sowing causing delayed and weak coleoptile emergence', 'Termites in dry sandy loam soils'],
          precautions: ['Do not sow wheat deeper than 5 cm; dwarf varieties have short coleoptiles.'],
          nextStage: 'GERMINATION',
          nextStageRequirements: 'Uniform emergence across rows within 5 to 7 days.',
          relatedOperations: ['Tillage & Pulverization', 'Zero-Till Seed Drilling', 'Basal Fertilization'],
          relatedEquipmentCategories: ['TRACTOR', 'IMPLEMENTS'],
          equipmentReasons: {
            'TRACTOR': 'Tractor for seedbed preparation and pulling seed drill',
            'IMPLEMENTS': 'Zero-Till Seed-cum-Fertilizer Drill for precision seed placement',
          },
          learningVideos: [
            LearningVideo(
              title: 'Wheat Sowing with Zero-Till Seed Drill and Basal Nutrition',
              channel: 'Indian Institute of Wheat and Barley Research (IIWBR)',
              duration: '10:15',
              relevance: 'Seed drill calibration, depth adjustment, and seed treatment.',
              searchQuery: 'wheat sowing zero till seed drill machine IIWBR',
            ),
          ],
        );

      case 'GERMINATION':
      case 'SEEDLING':
        return StageIntelligence(
          cropName: 'Wheat',
          stage: stage,
          stagePurpose: 'Crown Root Initiation (CRI) stage (20-25 days) - most critical first irrigation.',
          whatToDoNow: [
            'Provide the first and most critical Crown Root Initiation (CRI) irrigation at 21 days after sowing.',
            'Top-dress first split of Urea (30-35 kg/acre) immediately after CRI irrigation once soil permits.',
            'Inspect for broadleaf and grassy weeds (Phalaris minor / Gulli danda).',
            'Apply recommended post-emergence herbicide (e.g. Clodinafop / Metsulfuron) at 30-35 days.'
          ],
          importantChecks: ['Crown root development (white roots below soil surface)', 'Phalaris minor weed density', 'Soil moisture level'],
          commonProblems: ['Delaying CRI irrigation causes drastic reduction in tiller count and yield', 'Herbicide resistance in Phalaris minor'],
          precautions: ['Never delay the 21-day CRI irrigation; it defines total tiller potential.'],
          nextStage: 'VEGETATIVE',
          nextStageRequirements: 'Vigorous tillering with 5-8 tillers per plant.',
          relatedOperations: ['CRI Irrigation', 'First Nitrogen Top Dressing', 'Post-emergence Weed Spray'],
          relatedEquipmentCategories: ['IRRIGATION', 'IMPLEMENTS'],
          equipmentReasons: {
            'IRRIGATION': 'Tubewell/canal irrigation pumps for critical CRI watering',
            'IMPLEMENTS': 'Tractor-mounted boom sprayer with flat fan nozzles for herbicide spray',
          },
          learningVideos: [
            LearningVideo(
              title: 'Wheat CRI Stage: First Irrigation and Fertilizer Timing',
              channel: 'Wheat Agronomy Center',
              duration: '8:45',
              relevance: 'Why 21-day CRI watering is vital and how to apply urea post-watering.',
              searchQuery: 'wheat CRI stage first irrigation fertilizer weed control',
            ),
          ],
        );

      case 'VEGETATIVE':
        return StageIntelligence(
          cropName: 'Wheat',
          stage: 'VEGETATIVE',
          stagePurpose: 'Jointing and stem elongation stage, maximum tillering, and second top-dressing.',
          whatToDoNow: [
            'Provide second irrigation at jointing stage (40-45 days).',
            'Apply second split of Urea (30 kg/acre) before jointing irrigation.',
            'Scout for Yellow Rust (Puccinia striiformis) yellow powder stripes on leaves.',
            'Spray Propiconazole (Tilt @ 1ml/L) immediately if yellow rust pustules are noticed.'
          ],
          importantChecks: ['Tiller survival and canopy closure', 'Yellow rust stripe symptoms on lower leaves', 'Aphid colonies on leaf sheaths'],
          commonProblems: ['Yellow Rust spreading rapidly under cool, humid, cloudy weather', 'Foliar aphid outbreaks'],
          precautions: ['Check susceptible varieties daily for yellow rust during January-February.'],
          nextStage: 'FLOWERING',
          nextStageRequirements: 'Flag leaf emerged and earhead emerging from boot leaf.',
          relatedOperations: ['Jointing Stage Irrigation', 'Second Urea Application', 'Yellow Rust Protective Spray'],
          relatedEquipmentCategories: ['IRRIGATION', 'IMPLEMENTS'],
          equipmentReasons: {
            'IRRIGATION': 'Jointing stage furrow/flood irrigation supply',
            'IMPLEMENTS': 'Tractor boom sprayer for yellow rust fungicide spraying',
          },
          learningVideos: [
            LearningVideo(
              title: 'Wheat Jointing Stage & Yellow Rust Management',
              channel: 'IIWBR Wheat Directorate',
              duration: '11:30',
              relevance: 'Rust identification, fungicide spray timing, and irrigation scheduling.',
              searchQuery: 'wheat jointing stage yellow rust identification fungicide spray',
            ),
          ],
        );

      case 'FLOWERING':
      case 'FRUITING':
        return StageIntelligence(
          cropName: 'Wheat',
          stage: stage,
          stagePurpose: 'Booting, flowering (anthesis), and grain filling (milking/dough).',
          whatToDoNow: [
            'Provide critical irrigation at flowering (65-70 days) and milking stage (85 days).',
            'Spray 0.5% Potassium Nitrate (13-0-45) or 1% Urea to counter terminal heat stress.',
            'Ensure soil is not waterlogged to prevent lodging during late-season winds.',
            'Monitor for armyworm and head blight.'
          ],
          importantChecks: ['Grain milk line progress', 'Flag leaf greenness (source of 70% grain starch)', 'Soil moisture in root zone'],
          commonProblems: ['Terminal heat stress in March causing shriveled grains', 'Lodging if irrigated during high winds'],
          precautions: ['Do not irrigate on windy days to avoid catastrophic crop lodging.'],
          nextStage: 'MATURITY',
          nextStageRequirements: 'Grains harden and turn golden amber; straw loses green color.',
          relatedOperations: ['Milking Stage Irrigation', 'Terminal Heat Spray', 'Aphid Control'],
          relatedEquipmentCategories: ['IRRIGATION', 'IMPLEMENTS'],
          equipmentReasons: {
            'IRRIGATION': 'Light irrigation during calm weather to prevent terminal heat desiccation',
            'IMPLEMENTS': 'Foliar sprayers for anti-heat stress potassium sprays',
          },
          learningVideos: [
            LearningVideo(
              title: 'Wheat Flowering & Milking: Beating Terminal Heat Stress',
              channel: 'Agronomy Today',
              duration: '9:50',
              relevance: 'Irrigation timing on calm days and potassium sprays for heavy grains.',
              searchQuery: 'wheat flowering milking stage terminal heat management',
            ),
          ],
        );

      case 'MATURITY':
      case 'HARVEST':
        return StageIntelligence(
          cropName: 'Wheat',
          stage: stage,
          stagePurpose: 'Grain hardening, combine harvesting, and straw reaper/baler operations.',
          whatToDoNow: [
            'Stop irrigation 15 days before harvest to allow full golden dry-down.',
            'Harvest using Combine Harvester when grain moisture reaches 10-12%.',
            'Run Tractor Straw Reaper / Baler immediately behind combine to produce valuable wheat bhusa (fodder).',
            'Bag clean grain in moisture-proof gunny bags and store in fumigated warehouse.'
          ],
          importantChecks: ['Grain cracking hardness (shatters cleanly between teeth)', 'Straw moisture for reaper operation (<12%)'],
          commonProblems: ['Grain shattering if delayed in field during hot April winds', 'Storage khapra beetle / grain borer'],
          precautions: ['Never burn wheat stubble; run straw reaper to recover fodder worth ₹4,000-6,000/acre.'],
          nextStage: 'POST_HARVEST',
          nextStageRequirements: 'Grain stored safely and straw baled/collected.',
          relatedOperations: ['Combine Harvesting', 'Straw Reaping & Baling', 'Grain Bagging & Storage'],
          relatedEquipmentCategories: ['HARVESTERS', 'TRACTOR', 'IMPLEMENTS'],
          equipmentReasons: {
            'HARVESTERS': 'Combine Harvester for rapid non-stop wheat harvesting and threshing',
            'TRACTOR': 'Tractor for running PTO Straw Reaper and hauling grain trolleys',
            'IMPLEMENTS': 'Straw Reaper / Straw Baler for clean cattle fodder packaging',
          },
          learningVideos: [
            LearningVideo(
              title: 'Wheat Combine Harvesting & Straw Reaper Fodder Making',
              channel: 'Farm Tech India',
              duration: '14:20',
              relevance: 'Combine settings, straw reaper operation, and safe grain storage.',
              searchQuery: 'wheat combine harvester straw reaper machine operation',
            ),
          ],
        );

      default:
        return _getDefaultStage('Wheat', stage);
    }
  }

  // ---------------------------------------------------------------------------
  // CHILLI, SUGARCANE, GROUNDNUT & GENERIC FALLBACK
  // ---------------------------------------------------------------------------
  static StageIntelligence _getChilliStage(String stage) {
    return _getTomatoStage(stage); // Shares solanaceous nursery, staking, fertigation, picking pattern
  }

  static StageIntelligence _getSugarcaneStage(String stage) {
    return _getDefaultStage('Sugarcane', stage);
  }

  static StageIntelligence _getGroundnutStage(String stage) {
    return _getDefaultStage('Groundnut', stage);
  }

  static StageIntelligence _getDefaultStage(String cropName, String stage) {
    final cleanCrop = cropName.isEmpty ? 'Crop' : cropName;
    final cleanStage = stage.isEmpty ? 'ACTIVE' : stage;

    final stageTitle = cleanStage[0] + cleanStage.substring(1).toLowerCase();

    return StageIntelligence(
      cropName: cleanCrop,
      stage: cleanStage,
      stagePurpose: '$cleanCrop is currently progressing through the $stageTitle stage. Focus on crop-specific nutrient, water, and protection requirements.',
      whatToDoNow: [
        'Inspect soil moisture and provide regulated irrigation suited to $stageTitle stage.',
        'Complete scheduled fertilizer application and micronutrient foliar sprays.',
        'Scout crop canopy for early weed competition and pest infestations.',
        'Record completed tasks and verify field drainage channels are clear.',
        'Book required farming machinery ahead of time for upcoming operations.'
      ],
      importantChecks: [
        'Soil moisture and root zone aeration',
        'Canopy vigor and leaf health',
        'Pest and disease symptoms on fresh growth',
      ],
      commonProblems: [
        'Unbalanced nutrient supply causing stunted growth',
        'Weed pressure competing for moisture and sunlight',
      ],
      precautions: [
        'Adhere to recommended application rates and safety waiting periods.',
        'Avoid waterlogging during sensitive growth phases.',
      ],
      nextStage: _getNextCanonicalStage(cleanStage),
      nextStageRequirements: 'Complete pending stage operations and verify physiological growth milestones.',
      relatedOperations: ['$stageTitle Field Operation', 'Nutrient Management', 'Irrigation & Drainage', 'Protective Spraying'],
      relatedEquipmentCategories: ['TRACTOR', 'IMPLEMENTS', 'IRRIGATION'],
      equipmentReasons: {
        'TRACTOR': 'Tractor for field operations and implement haulage',
        'IMPLEMENTS': 'Cultivators and sprayers for crop maintenance',
        'IRRIGATION': 'Water pumps for regulated irrigation',
      },
      learningVideos: [
        LearningVideo(
          title: '$cleanCrop $stageTitle Stage Management Guide',
          channel: 'Agricultural Extension Services',
          duration: '10:00',
          relevance: 'Expert agronomic practices for $cleanCrop during $stageTitle stage.',
          searchQuery: '$cleanCrop $cleanStage farming management practices',
        ),
      ],
    );
  }

  static String _getNextCanonicalStage(String currentStage) {
    final idx = canonicalStages.indexOf(currentStage.toUpperCase());
    if (idx != -1 && idx < canonicalStages.length - 1) {
      return canonicalStages[idx + 1];
    }
    return 'HARVEST';
  }
}
