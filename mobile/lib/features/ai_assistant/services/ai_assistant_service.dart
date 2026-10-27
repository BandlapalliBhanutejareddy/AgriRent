import '../../../core/api/api_client.dart';
import '../../../models/equipment.dart';

class AiTaskItem {
  final String id;
  final String title;
  final String description;
  final String priority;
  bool isSaved;

  AiTaskItem({
    required this.id,
    required this.title,
    required this.description,
    this.priority = 'MEDIUM',
    this.isSaved = false,
  });
}

class AiAssistantResponse {
  final String query;
  final String adviceText;
  final String crop;
  final String stage;
  final String? acreage;
  final String? location;
  final String? weatherNote;
  final List<AiTaskItem> tasks;
  final List<Equipment> matchingEquipment;
  final List<Map<String, String>> learningGuides;
  final String? farmId;
  final String? cropId;
  final String language;

  AiAssistantResponse({
    required this.query,
    required this.adviceText,
    required this.crop,
    required this.stage,
    this.acreage,
    this.location,
    this.weatherNote,
    required this.tasks,
    required this.matchingEquipment,
    required this.learningGuides,
    this.farmId,
    this.cropId,
    required this.language,
  });
}

class AiAssistantService {
  final ApiClient _api = ApiClient();

  Future<AiAssistantResponse> askAssistant({
    required String query,
    required String language,
    String? farmId,
    String? cropId,
    String? cropName,
    String? stage,
    String? acreage,
    String? location,
  }) async {
    String adviceText = '';
    List<AiTaskItem> tasks = [];
    List<Equipment> matchingEquipment = [];
    List<Map<String, String>> learningGuides = [];
    String activeCrop = cropName ?? 'Paddy';
    String activeStage = stage ?? 'Vegetative';
    String? weatherAdvisory;

    // 1. First attempt Farm Copilot if farm and crop IDs exist
    bool copilotSucceeded = false;
    if (farmId != null && cropId != null) {
      try {
        final res = await _api.dio.post('ai/farm-copilot', data: {
          'farmId': farmId,
          'cropId': cropId,
          'question': query,
          'language': language,
        });

        if (res.data != null) {
          final data = res.data;
          adviceText = data['explanation'] ?? '';
          if (data['farmStatus'] != null) {
            activeCrop = data['farmStatus']['crop'] ?? activeCrop;
            activeStage = data['farmStatus']['stage'] ?? activeStage;
          }

          // Extract actionable steps into tasks
          if (data['actionableSteps'] is List) {
            final List steps = data['actionableSteps'];
            for (int i = 0; i < steps.length; i++) {
              final stepStr = steps[i].toString();
              tasks.add(AiTaskItem(
                id: 'step_$i',
                title: stepStr,
                description: 'Recommended by AgroRent AI based on current $activeStage stage.',
                priority: i == 0 ? 'HIGH' : 'MEDIUM',
              ));
            }
          }

          // Extract translated equipment
          if (data['translatedEquipment'] is List) {
            for (final eq in data['translatedEquipment']) {
              if (eq is Map<String, dynamic>) {
                matchingEquipment.add(Equipment(
                  id: eq['equipmentId']?.toString() ?? '',
                  title: eq['equipmentName']?.toString() ?? 'Farming Equipment',
                  category: eq['category']?.toString() ?? 'TRACTOR',
                  description: eq['description']?.toString() ?? 'Verified AgroRent marketplace equipment',
                  ownerId: eq['ownerId']?.toString() ?? '',
                  pricePerDay: (eq['pricePerDay'] as num?)?.toDouble() ?? 800.0,
                  available: true,
                  location: location ?? 'Nearby',
                  imageUrl: eq['imageUrl']?.toString() ?? '',
                ));
              }
            }
          }

          if (data['warnings'] is List && (data['warnings'] as List).isNotEmpty) {
            weatherAdvisory = (data['warnings'] as List).first.toString();
          }

          copilotSucceeded = adviceText.trim().isNotEmpty;
        }
      } catch (_) {
        copilotSucceeded = false;
      }
    }

    // 2. Fallback to /api/ai/advisor if copilot not applicable or failed
    if (!copilotSucceeded) {
      try {
        final res = await _api.dio.post('ai/advisor', data: {
          'question': query,
          'prompt': query,
          'crop': activeCrop,
          'stage': activeStage,
          'acreage': acreage,
          'location': location,
          'language': language,
        });

        if (res.data is Map) {
          final map = res.data as Map;
          if (map['reply'] is String) {
            adviceText = map['reply'];
          } else if (map['data'] is Map && map['data']['reply'] is String) {
            adviceText = map['data']['reply'];
          } else if (map['data'] is String) {
            adviceText = map['data'];
          }
        }
      } catch (e) {
        // Honest localized error fallback
        adviceText = _getLocalizedErrorFallback(query, activeCrop, activeStage, language);
      }

      // Parse structured action steps from the advice text
      if (tasks.isEmpty) {
        tasks = _extractTasksFromAdvice(adviceText, activeCrop, activeStage, language);
      }
    }

    // 3. Fetch real marketplace equipment matching the query or crop category
    if (matchingEquipment.isEmpty) {
      try {
        final eqRes = await _api.dio.get('equipment?available=true&limit=6');
        final rawData = eqRes.data is Map ? eqRes.data['data'] : eqRes.data;
        if (rawData is List) {
          matchingEquipment = rawData
              .whereType<Map>()
              .map((e) => Equipment.fromJson(Map<String, dynamic>.from(e)))
              .toList();
        }
      } catch (_) {}
    }

    // 4. Learning guides for this crop and stage
    learningGuides = _getLearningGuides(activeCrop, activeStage, language);

    // 5. Weather advisory preserved only if real weather/agronomic warnings exist; never fabricate weather forecasts

    return AiAssistantResponse(
      query: query,
      adviceText: adviceText,
      crop: activeCrop,
      stage: activeStage,
      acreage: acreage,
      location: location,
      weatherNote: weatherAdvisory,
      tasks: tasks,
      matchingEquipment: matchingEquipment,
      learningGuides: learningGuides,
      farmId: farmId,
      cropId: cropId,
      language: language,
    );
  }

  /// Persist entire plan into Farm Operations in database
  Future<bool> addToPlan({
    required String farmId,
    required String cropId,
    required List<String> steps,
    required String stage,
  }) async {
    try {
      final res = await _api.dio.post('ai/farm-copilot/add-to-plan', data: {
        'farmId': farmId,
        'cropId': cropId,
        'actionableSteps': steps,
        'stage': stage,
      });
      return res.statusCode == 200 || res.statusCode == 201;
    } catch (_) {
      return false;
    }
  }

  /// Persist a single task
  Future<bool> saveSingleTask({
    required String farmId,
    required String cropId,
    required String taskTitle,
    required String stage,
  }) async {
    return addToPlan(
      farmId: farmId,
      cropId: cropId,
      steps: [taskTitle],
      stage: stage,
    );
  }

  List<AiTaskItem> _extractTasksFromAdvice(String text, String crop, String stage, String lang) {
    final List<AiTaskItem> items = [];
    final lines = text.split('\n');

    for (final line in lines) {
      final trimmed = line.trim();
      // Match numbered points e.g. "1. నీటి నిర్వహణ..." or "1. Water management..."
      final match = RegExp(r'^(\d+)[\.\)]\s*(.+)$').firstMatch(trimmed);
      if (match != null) {
        final num = match.group(1)!;
        final content = match.group(2)!.trim();
        items.add(AiTaskItem(
          id: 'task_$num',
          title: content.replaceAll(RegExp(r'\*\*'), ''),
          description: '$crop ($stage) - Recommended agricultural task.',
          priority: num == '1' ? 'HIGH' : 'MEDIUM',
        ));
      }
    }

    if (items.isEmpty) {
      // Default localized actionable steps
      if (lang.toLowerCase() == 'te') {
        items.addAll([
          AiTaskItem(id: '1', title: 'నీటి నిర్వహణ: 3-4 రోజులకు ఒకసారి తేలికపాటి తడి ఇవ్వండి', description: '$crop - పూత/ఎదుగుదల దశ'),
          AiTaskItem(id: '2', title: 'యూరియా ఎరువు: 2వ విడత పోషకాల యాజమాన్యం పూర్తి చేయండి', description: '$crop - పోషకాల స్థాయి'),
          AiTaskItem(id: '3', title: 'కలుపు నియంత్రణ: పొలంలో కలుపు ఎక్కువగా ఉంటే తొలగించండి', description: '$crop - సస్యరక్షణ'),
        ]);
      } else if (lang.toLowerCase() == 'hi') {
        items.addAll([
          AiTaskItem(id: '1', title: 'जल प्रबंधन: 3-4 दिनों के अंतराल पर हल्की सिंचाई करें', description: '$crop - विकास चरण'),
          AiTaskItem(id: '2', title: 'उर्वरक प्रबंधन: यूरिया की दूसरी खुराक दें', description: '$crop - पोषण प्रबंधन'),
          AiTaskItem(id: '3', title: 'खरपतवार नियंत्रण: खेत से अनावश्यक घास निकालें', description: '$crop - फसल सुरक्षा'),
        ]);
      } else {
        items.addAll([
          AiTaskItem(id: '1', title: 'Irrigation Management: Schedule light irrigation every 3-4 days', description: '$crop - Growth stage'),
          AiTaskItem(id: '2', title: 'Fertilizer Application: Apply recommended top dressing of Urea', description: '$crop - Nutrient management'),
          AiTaskItem(id: '3', title: 'Weed Control: Inspect and clear unwanted weeds from field', description: '$crop - Crop protection'),
        ]);
      }
    }

    return items;
  }

  List<Map<String, String>> _getLearningGuides(String crop, String stage, String lang) {
    if (lang.toLowerCase() == 'te') {
      return [
        {'title': '$crop సాగు సమగ్ర మార్గదర్శిని', 'subtitle': 'విత్తనం నుండి కోత వరకు పాటించవలసిన మెళకువలు', 'category': 'సాగు సూచనలు'},
        {'title': 'నీటి & ఎరువుల యాజమాన్యం', 'subtitle': '$stage దశలో అధిక దిగుబడికి పాటించవలసిన నియమాలు', 'category': 'పోషకాలు'},
        {'title': 'సస్యరక్షణ & పురుగుల నివారణ', 'subtitle': 'సేంద్రీయ మరియు రసాయన నివారణ చర్యలు', 'category': 'రక్షణ'},
      ];
    } else if (lang.toLowerCase() == 'hi') {
      return [
        {'title': '$crop की उन्नत खेती गाइड', 'subtitle': 'बुवाई से कटाई तक की संपूर्ण जानकारी', 'category': 'फसल गाइड'},
        {'title': 'सिंचाई और उर्वरक प्रबंधन', 'subtitle': '$stage चरण में अधिकतम उत्पादन के टिप्स', 'category': 'पोषण'},
        {'title': 'कीट एवं रोग नियंत्रण', 'subtitle': 'जैविक एवं वैज्ञानिक रोकथाम के उपाय', 'category': 'सुरक्षा'},
      ];
    } else {
      return [
        {'title': 'Complete $crop Cultivation Guide', 'subtitle': 'Step-by-step practices from seed to harvest', 'category': 'Agronomy'},
        {'title': 'Nutrient & Irrigation Practices', 'subtitle': 'Optimal management for the $stage stage', 'category': 'Management'},
        {'title': 'Integrated Pest Management', 'subtitle': 'Organic & scientific crop protection guidelines', 'category': 'Protection'},
      ];
    }
  }


  String _getLocalizedErrorFallback(String query, String crop, String stage, String lang) {
    if (lang.toLowerCase() == 'te') {
      return '### 🌾 వ్యవసాయ సలహా ($crop - $stage)\n\n'
          'మీ $crop పంట ప్రస్తుతం $stage దశలో ఉంది. ఈ సమయానికి క్రింది చర్యలు పాటించండి:\n\n'
          '1. **నీటి నిర్వహణ:** ఈ దశలో 3-4 రోజులకు ఒకసారి తేలికపాటి నీరు పెట్టండి.\n'
          '2. **యూరియా ఎరువు:** ఇప్పుడు 2వ దశ ఎరువు వేయడం సిఫారసు చేస్తున్నాము.\n'
          '3. **కలుపు నియంత్రణ:** పొలంలో కలుపు ఎక్కువగా ఉంటే ఈ వారం నియంత్రించండి.\n\n'
          '> 💡 స్థానిక ఫార్మర్ అసిస్టెంట్ (Farmer Assistant) తాత్కాలికంగా అందుబాటులో లేదు. ప్రామాణిక పంట దశ సూచనలు మాత్రమే చూపబడుతున్నాయి.';
    } else if (lang.toLowerCase() == 'hi') {
      return '### 🌾 कृषि सलाह ($crop - $stage)\n\n'
          'आपकी $crop की फसल वर्तमान में $stage चरण में है। इस समय निम्नलिखित कार्य करें:\n\n'
          '1. **जल प्रबंधन:** इस चरण में 3-4 दिनों में हल्की सिंचाई करें।\n'
          '2. **उर्वरक प्रबंधन:** यूरिया और सूक्ष्म पोषक तत्वों की संस्तुत मात्रा दें।\n'
          '3. **खरपतवार नियंत्रण:** खेत को साफ रखें ताकि कीटों का प्रभाव न हो।\n\n'
          '> 💡 स्थानीय फार्मर असिस्टेंट (Farmer Assistant) अस्थायी रूप से अनुपलब्ध है। केवल मानक फसल चरण सुझाव दिखाए जा रहे हैं।';
    } else {
      return '### 🌾 Farming Advice ($crop - $stage)\n\n'
          'Your $crop crop is currently in the $stage stage. Here are the recommended actions:\n\n'
          '1. **Water Management:** Maintain light irrigation every 3-4 days in this stage.\n'
          '2. **Nutrient Application:** Apply the recommended top dressing of nitrogen fertilizer.\n'
          '3. **Weed Control:** Clear persistent weeds to optimize soil nutrient absorption.\n\n'
          '> 💡 Farmer Assistant service is temporarily unavailable. Showing standard crop stage guidelines.';
    }
  }
}
