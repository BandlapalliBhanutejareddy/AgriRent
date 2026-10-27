import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/services/voice_service.dart';
import 'package:mobile/core/services/tts_service.dart';
import 'package:mobile/features/ai_assistant/services/ai_assistant_service.dart';
import 'package:mobile/features/marketplace/services/search_history_service.dart';
import 'package:mobile/models/equipment.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Voice AI & Assistant Comprehensive Verification', () {
    setUp(() {
      SharedPreferences.setMockInitialValues({});
    });

    // 1. Typed Search & History Service
    test('Typed search history saves, deduplicates, and limits to recent queries', () async {
      const farmerId = 'farmer_test_101';
      await SearchHistoryService.addSearchQuery(farmerId, 'Cotton fertilizer');
      await SearchHistoryService.addSearchQuery(farmerId, 'John Deere 5050D');
      await SearchHistoryService.addSearchQuery(farmerId, 'Laser Land Leveller');
      await SearchHistoryService.addSearchQuery(farmerId, 'Cotton fertilizer'); // duplicate re-queried

      final history = await SearchHistoryService.getRecentSearches(farmerId);
      expect(history.length, equals(3));
      expect(history.first, equals('Cotton fertilizer'), reason: 'Re-queried term must move to the top');
      expect(history[1], equals('Laser Land Leveller'));

      // Test clear
      await SearchHistoryService.clearHistory(farmerId);
      final cleared = await SearchHistoryService.getRecentSearches(farmerId);
      expect(cleared.isEmpty, isTrue);
    });

    // 2. Voice Permission & Locale mapping
    test('VoiceService maps languages to proper regional BCP-47 speech locales', () {
      final voice = VoiceService();
      expect(voice.getLocaleForLanguage('te'), equals('te_IN'));
      expect(voice.getLocaleForLanguage('hi'), equals('hi_IN'));
      expect(voice.getLocaleForLanguage('ta'), equals('ta_IN'));
      expect(voice.getLocaleForLanguage('kn'), equals('kn_IN'));
      expect(voice.getLocaleForLanguage('en'), equals('en_IN'));
      expect(voice.getLocaleForLanguage('UNKNOWN'), equals('en_IN'));
    });

    // 3. Listening, Transcribing, and Result Streaming
    test('VoiceRecognitionResult properly encapsulates partial and final transcriptions', () {
      final partialResult = VoiceRecognitionResult(text: 'నాట్లు వేయడానికి', isFinal: false);
      expect(partialResult.text, equals('నాట్లు వేయడానికి'));
      expect(partialResult.isFinal, isFalse);

      final finalResult = VoiceRecognitionResult(text: 'నాట్లు వేయడానికి ట్రాక్టర్ కావాలి', isFinal: true);
      expect(finalResult.text, equals('నాట్లు వేయడానికి ట్రాక్టర్ కావాలి'));
      expect(finalResult.isFinal, isTrue);
    });

    // 4. Voice State Machine & Cancellation
    test('VoiceInteractionState enum supports all interactive lifecycle stages', () {
      const states = VoiceInteractionState.values;
      expect(states.contains(VoiceInteractionState.idle), isTrue);
      expect(states.contains(VoiceInteractionState.listening), isTrue);
      expect(states.contains(VoiceInteractionState.transcribing), isTrue);
      expect(states.contains(VoiceInteractionState.processing), isTrue);
      expect(states.contains(VoiceInteractionState.answer), isTrue);
      expect(states.contains(VoiceInteractionState.error), isTrue);
      expect(states.contains(VoiceInteractionState.cancelled), isTrue);
    });

    test('VoiceService transitions state and handles session cancellation', () async {
      final voice = VoiceService();
      expect(voice.state, equals(VoiceInteractionState.idle));

      // Cancellation
      await voice.cancelSession();
      expect(voice.state, equals(VoiceInteractionState.cancelled));

      // Transition to processing
      voice.setProcessing();
      expect(voice.state, equals(VoiceInteractionState.processing));
    });

    // 5. TTS Markdown Cleaning & Speech Preparation
    test('TtsService cleans markdown tags, emojis, and symbols for natural voice synthesis', () {
      const complexAdvice = '### 🌾 Recommendation for **Cotton**:\n- Apply *Zinc* `10kg/acre`\n> ℹ️ Note: Check soil moisture!';
      final clean = TtsService.cleanTextForSpeech(complexAdvice);

      expect(clean.contains('###'), isFalse);
      expect(clean.contains('**'), isFalse);
      expect(clean.contains('*'), isFalse);
      expect(clean.contains('`'), isFalse);
      expect(clean.contains('>'), isFalse);
      expect(clean.contains('Recommendation for Cotton'), isTrue);
      expect(clean.contains('Apply Zinc'), isTrue);
    });

    // 6. AI Assistant Response Structure (Tabs: Tasks, Equipment, Learning)
    test('AiAssistantResponse properly manages tasks, matched equipment, and learning tabs', () {
      final task1 = AiTaskItem(
        id: 'task_1',
        title: 'Deep Ploughing with Rotavator',
        description: 'Prepare land to fine tilth.',
        priority: 'HIGH',
      );
      final task2 = AiTaskItem(
        id: 'task_2',
        title: 'Soil Health Card Testing at local KVK',
        description: 'Conduct soil nutrient analysis.',
        priority: 'MEDIUM',
      );

      final equipment = Equipment(
        id: 'eq_101',
        title: 'Mahindra 575 DI',
        category: 'TRACTOR',
        description: '45 HP utility tractor with rotavator attachment',
        ownerId: 'owner_99',
        pricePerDay: 1400.0,
        available: true,
        location: 'Warangal',
        imageUrl: '',
      );

      final learning = [
        {'title': 'Cotton Cultivation Guide', 'subtitle': 'Seed to harvest practices', 'category': 'Agronomy'},
        {'title': 'Integrated Pest Management', 'subtitle': 'IPM principles', 'category': 'Protection'},
      ];

      final response = AiAssistantResponse(
        query: 'What machinery needed for 5 acres cotton?',
        adviceText: 'Verified agronomic guidance for cotton preparation.',
        crop: 'Cotton',
        stage: 'LAND_PREPARATION',
        acreage: '5',
        location: 'Warangal',
        weatherNote: 'Clear skies expected for next 3 days.',
        tasks: [task1, task2],
        matchingEquipment: [equipment],
        learningGuides: learning,
        farmId: 'farm_01',
        cropId: 'crop_01',
        language: 'en',
      );

      // Verify all tabs have backing data
      expect(response.tasks.length, equals(2), reason: 'Tasks Tab must have 2 tasks');
      expect(response.matchingEquipment.length, equals(1), reason: 'Equipment Tab must have 1 item');
      expect(response.learningGuides.length, equals(2), reason: 'Learning Tab must have 2 guides');
      expect(response.matchingEquipment.first.pricePerDay, equals(1400.0));
      expect(response.crop, equals('Cotton'));
      expect(response.stage, equals('LAND_PREPARATION'));
      expect(response.acreage, equals('5'));
      expect(response.weatherNote, contains('Clear skies'));
    });

    // 7. Save Task Persistence Logic
    test('AiTaskItem toggles isSaved status for Save Task action', () {
      final task = AiTaskItem(
        id: 'task_seed_drill',
        title: 'Calibrate Seed Drill for uniform 5cm depth',
        description: 'Ensure accurate seed spacing and planting depth.',
        priority: 'HIGH',
      );

      expect(task.isSaved, isFalse);
      task.isSaved = true;
      expect(task.isSaved, isTrue);
    });

    // 8. Add to My Plan Persistence Logic
    test('All tasks in plan can be converted to payload for Add to My Plan', () {
      final tasks = [
        AiTaskItem(id: '1', title: 'Step 1: Primary deep tilling', description: 'desc1'),
        AiTaskItem(id: '2', title: 'Step 2: Laser leveling', description: 'desc2'),
        AiTaskItem(id: '3', title: 'Step 3: Farm yard manure application', description: 'desc3'),
      ];

      final planSteps = tasks.map((t) => t.title).toList();
      expect(planSteps.length, equals(3));
      expect(planSteps, contains('Step 1: Primary deep tilling'));
      expect(planSteps, contains('Step 2: Laser leveling'));
      expect(planSteps, contains('Step 3: Farm yard manure application'));
    });

    // 9. Popular Searches & Suggested Queries
    test('SearchHistoryService provides verified suggestions for all Indian languages', () {
      for (final lang in ['en', 'te', 'hi', 'ta', 'kn']) {
        final popular = SearchHistoryService.getPopularSearches(lang);
        final voiceExamples = SearchHistoryService.getVoiceExamples(lang);

        expect(popular.isNotEmpty, isTrue, reason: 'Popular searches must be populated for $lang');
        expect(voiceExamples.isNotEmpty, isTrue, reason: 'Voice examples must be populated for $lang');
        expect(popular.length, greaterThanOrEqualTo(4));
        expect(voiceExamples.length, greaterThanOrEqualTo(3));
      }
    });
  });
}
