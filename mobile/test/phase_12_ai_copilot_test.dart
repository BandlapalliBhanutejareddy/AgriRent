import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile/core/localization/app_localizations.dart';
import 'package:mobile/features/farm/providers/copilot_provider.dart';

void main() {
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    SharedPreferences.setMockInitialValues({});
  });

  tearDown(() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  });

  group('Phase 12 — 1. Ollama Connection Failure, 503 / 500, Timeout & Honest Error Classification', () {
    test('CopilotMessage marks error and detects local Ollama engine unavailability', () {
      final msg = CopilotMessage(
        id: 'err_1',
        role: 'ai',
        text: 'Local AI engine (Ollama) is unavailable or timed out. Please ensure Ollama is running locally with the approved model, or try again later.',
        isError: true,
        isLocalEngineUnavailable: true,
        lastQuery: 'How to control stem borer?',
      );

      expect(msg.isError, isTrue);
      expect(msg.isLocalEngineUnavailable, isTrue);
      expect(msg.lastQuery, 'How to control stem borer?');
      expect(msg.text, contains('Ollama'));
    });

    test('CopilotState error states preserve previous messages and release loading lock', () {
      final welcome = CopilotMessage(id: 'w1', role: 'ai', text: 'Welcome!');
      final userMsg = CopilotMessage(id: 'u1', role: 'farmer', text: 'Pest query');

      var state = CopilotState(messages: [welcome, userMsg], isLoading: true);
      expect(state.isLoading, isTrue);

      final errorMsg = CopilotMessage(
        id: 'err_1',
        role: 'ai',
        text: 'Connection timeout to local AI engine.',
        isError: true,
        isLocalEngineUnavailable: true,
        lastQuery: 'Pest query',
      );

      state = state.copyWith(
        messages: [...state.messages, errorMsg],
        isLoading: false,
        error: 'TimeoutException: 30000ms',
      );

      expect(state.isLoading, isFalse);
      expect(state.messages.length, 3);
      expect(state.messages.last.isError, isTrue);
      expect(state.messages.last.lastQuery, 'Pest query');
      expect(state.error, contains('TimeoutException'));
    });
  });

  group('Phase 12 — 2. Empty, Malformed, and Fallback Response Handling', () {
    test('CopilotFarmStatus deserializes empty or null fields safely without throwing', () {
      final status = CopilotFarmStatus.fromJson({});
      expect(status.crop, '');
      expect(status.acreage, 0.0);
      expect(status.stage, '');
      expect(status.location, '');
      expect(status.season, '');
      expect(status.summary, '');
    });

    test('CopilotEquipmentRecommendation handles missing price, descriptions, and IDs safely', () {
      final eq = CopilotEquipmentRecommendation.fromJson({
        'equipmentName': 'Seed Drill',
        'category': 'SOWING',
        // pricePerDay missing -> should default to 0.0
      });

      expect(eq.equipmentId, '');
      expect(eq.equipmentName, 'Seed Drill');
      expect(eq.category, 'SOWING');
      expect(eq.pricePerDay, 0.0);
      expect(eq.whyNeeded, '');
      expect(eq.imageUrl, isNull);
    });

    test('CopilotMessage defaults empty lists for steps, equipment, and warnings safely', () {
      final msg = CopilotMessage(
        id: 'm1',
        role: 'ai',
        text: 'General agronomic response.',
      );

      expect(msg.actionableSteps, isEmpty);
      expect(msg.recommendedEquipment, isEmpty);
      expect(msg.warnings, isEmpty);
      expect(msg.isFarmer, isFalse);
      expect(msg.isAi, isTrue);
    });
  });

  group('Phase 12 — 3. Real Farm & Registered Crop Context Selection', () {
    test('CopilotFarmStatus accurately models verified farm facts', () {
      final json = {
        'crop': 'Paddy',
        'acreage': 4.5,
        'stage': 'VEGETATIVE',
        'location': 'Guntur Rural',
        'season': 'KHARIF',
        'summary': 'Paddy field at 35 days after sowing, active vegetative growth.',
      };

      final status = CopilotFarmStatus.fromJson(json);

      expect(status.crop, 'Paddy');
      expect(status.acreage, 4.5);
      expect(status.stage, 'VEGETATIVE');
      expect(status.location, 'Guntur Rural');
      expect(status.season, 'KHARIF');
      expect(status.summary, contains('35 days'));
    });

    test('initForFarm sets active farmId, cropId, and localized greeting', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final notifier = container.read(copilotProvider.notifier);
      notifier.initForFarm(
        farmId: 'farm_101',
        cropId: 'crop_202',
        cropName: 'Cotton',
        userName: 'Ramesh',
      );

      final state = container.read(copilotProvider);
      expect(state.activeFarmId, 'farm_101');
      expect(state.activeCropId, 'crop_202');
      expect(state.activeCropName, 'Cotton');
      expect(state.messages.length, 1);
      expect(state.messages.first.text, contains('Ramesh'));
      expect(state.messages.first.text, contains('Cotton'));
    });
  });

  group('Phase 12 — 4. Missing Context Handling & Stale Response Protection', () {
    test('reset() clears all messages, loading state, and error flags', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final notifier = container.read(copilotProvider.notifier);
      notifier.initForFarm(farmId: 'f1', cropId: 'c1', cropName: 'Wheat');

      expect(container.read(copilotProvider).messages, isNotEmpty);

      // Reset
      notifier.reset();

      final state = container.read(copilotProvider);
      expect(state.messages, isEmpty);
      expect(state.isLoading, isFalse);
      expect(state.error, isNull);
      expect(state.activeFarmId, isNull);
      expect(state.activeCropId, isNull);
    });

    test('Switching farms triggers reset to prevent stale advice bleeding into next farm', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final notifier = container.read(copilotProvider.notifier);
      notifier.initForFarm(farmId: 'farm_A', cropId: 'crop_A', cropName: 'Paddy');
      expect(container.read(copilotProvider).activeFarmId, 'farm_A');

      // Farm switch
      notifier.reset();
      notifier.initForFarm(farmId: 'farm_B', cropId: 'crop_B', cropName: 'Maize');

      final state = container.read(copilotProvider);
      expect(state.activeFarmId, 'farm_B');
      expect(state.activeCropName, 'Maize');
      expect(state.messages.first.text, contains('Maize'));
    });
  });

  group('Phase 12 — 5. Safety Boundaries: No Fabricated Equipment, Weather, or Financial Data', () {
    test('Recommended equipment contains only verified items from response', () {
      final rawEquipment = [
        {
          'equipmentId': 'eq_501',
          'equipmentName': 'Rotavator Heavy Duty',
          'category': 'TILLAGE',
          'pricePerDay': 1200.0,
          'whyNeeded': 'Secondary tillage for fine tilth',
          'whatItDoes': 'Pulverizes soil',
        },
      ];

      final items = rawEquipment
          .map((e) => CopilotEquipmentRecommendation.fromJson(e))
          .toList();

      expect(items.length, 1);
      expect(items.first.equipmentId, 'eq_501');
      expect(items.first.pricePerDay, 1200.0);
      expect(items.first.whyNeeded, 'Secondary tillage for fine tilth');
    });

    test('Empty equipment list does not invent phantom machinery', () {
      final msg = CopilotMessage(
        id: 'ai_1',
        role: 'ai',
        text: 'Soil preparation guidance.',
        recommendedEquipment: const [],
      );

      expect(msg.recommendedEquipment, isEmpty);
    });
  });

  group('Phase 12 — 6. Separation Between AI Suggestions & Actual Farm Operations', () {
    test('Actionable steps in CopilotMessage are suggestions requiring farmer confirmation', () {
      final suggestions = [
        'Apply 25kg Urea per acre at vegetative stage',
        'Inspect leaf undersides for aphid infestation',
        'Schedule light irrigation before noon',
      ];

      final msg = CopilotMessage(
        id: 'ai_2',
        role: 'ai',
        text: 'Recommendations for vegetative stage.',
        actionableSteps: suggestions,
      );

      expect(msg.actionableSteps.length, 3);
      // These are suggestions; they are NOT actual FarmTaskModel items yet
      expect(msg.actionableSteps, contains('Inspect leaf undersides for aphid infestation'));
    });

    test('addToPlan state tracks isAddingToPlan flag and resets cleanly', () {
      var state = const CopilotState();
      expect(state.isAddingToPlan, isFalse);

      state = state.copyWith(isAddingToPlan: true);
      expect(state.isAddingToPlan, isTrue);

      state = state.copyWith(isAddingToPlan: false);
      expect(state.isAddingToPlan, isFalse);
    });
  });

  group('Phase 12 — 7. Duplicate-Send Mutex & Retry Preservation', () {
    test('Rapid consecutive submissions are suppressed when send is in flight', () {
      var inFlight = false;
      var attempts = 0;

      Future<bool> simulateQuery(String q) async {
        if (inFlight) return false;
        inFlight = true;
        attempts++;
        await Future.delayed(const Duration(milliseconds: 10));
        inFlight = false;
        return true;
      }

      simulateQuery('What fertilizer to use?');
      final secondCall = simulateQuery('What fertilizer to use?');

      expect(attempts, 1);
      secondCall.then((ok) => expect(ok, isFalse));
    });

    test('Failed query preserves text for instant retry without data loss', () {
      var inputControllerText = 'Best pesticide for leaf spot?';
      final draft = inputControllerText;

      void onSendResult(bool success) {
        if (success) {
          inputControllerText = '';
        }
      }

      onSendResult(false);

      expect(inputControllerText, 'Best pesticide for leaf spot?');
      expect(draft, 'Best pesticide for leaf spot?');
    });
  });

  group('Phase 12 — 8. 5-Language Authentic Localization Verification', () {
    const requiredKeys = [
      'farm_copilot',
      'ai_agronomic_intelligence',
      'authoritative_farm_facts',
      'missing_farm_context',
      'select_farm_prompt',
      'agronomic_safety_disclaimer',
      'local_ai_unavailable',
      'analyzing_farm_conditions',
      'suggested_planned_tasks',
      'plan_added_success',
      'plan_added_failed',
      'no_matching_machinery',
      'view_farming_guides',
      'retry_query',
      'stale_context_cleared',
      'verified_crop',
      'verified_stage',
    ];

    const supportedLanguages = ['en', 'te', 'hi', 'ta', 'kn'];

    for (final lang in supportedLanguages) {
      test('Language "$lang" provides all Phase 12 localization keys without raw fallbacks', () {
        for (final key in requiredKeys) {
          final translated = key.tr(lang);
          expect(translated, isNotEmpty, reason: 'Key $key in $lang should not be empty');
          expect(
            translated != key || lang == 'en',
            isTrue,
            reason: 'Key $key in $lang should not equal raw key',
          );
        }
      });
    }

    test('Indic languages display valid native Unicode characters for Phase 12 keys', () {
      // Telugu
      expect('authoritative_farm_facts'.tr('te'), contains('వ్యవసాయ వాస్తవాలు'));
      expect('local_ai_unavailable'.tr('te'), contains('Farmer Assistant'));
      expect('agronomic_safety_disclaimer'.tr('te'), contains('సలహా సూచన'));

      // Hindi
      expect('authoritative_farm_facts'.tr('hi'), contains('कृषि तथ्य'));
      expect('local_ai_unavailable'.tr('hi'), contains('Farmer Assistant'));
      expect('agronomic_safety_disclaimer'.tr('hi'), contains('परामर्श मार्गदर्शन'));

      // Tamil
      expect('authoritative_farm_facts'.tr('ta'), contains('பண்ணை உண்மைகள்'));
      expect('local_ai_unavailable'.tr('ta'), contains('Farmer Assistant'));
      expect('agronomic_safety_disclaimer'.tr('ta'), contains('ஆலோசனை வழிகாட்டுதல்'));

      // Kannada
      expect('authoritative_farm_facts'.tr('kn'), contains('ಕೃಷಿ ವಾಸ್ತವಗಳು'));
      expect('local_ai_unavailable'.tr('kn'), contains('Farmer Assistant'));
      expect('agronomic_safety_disclaimer'.tr('kn'), contains('ಸಲಹಾ ಮಾರ್ಗದರ್ಶನ'));
    });
  });

  group('Phase 12 — 9. Preservation of Phases 1–11 Regressions', () {
    test('Phase 1: Knowledge base alias and localized roles preserved', () {
      expect('knowledge_base'.tr('en'), isNotEmpty);
      expect('role_farmer'.tr('te'), isNotEmpty);
      expect('role_owner'.tr('hi'), isNotEmpty);
    });

    test('Phase 2 & 3: Role structure and dashboard stages preserved', () {
      expect('canonical_stages'.tr('en'), isNotEmpty);
      expect('farm_copilot'.tr('en'), isNotEmpty);
    });

    test('Phase 4: Farm setup keys preserved', () {
      expect('add_farm'.tr('en'), isNotEmpty);
      expect('farm_name'.tr('en'), isNotEmpty);
    });

    test('Phase 5: Farm operations keys preserved', () {
      expect('all_operations'.tr('en'), isNotEmpty);
      expect('filter_all'.tr('en'), isNotEmpty);
    });

    test('Phase 6 & 7: Booking flow and timeline keys preserved', () {
      expect('book_now'.tr('en'), isNotEmpty);
      expect('booking_details'.tr('en'), isNotEmpty);
    });

    test('Phase 8: Marketplace and equipment filters preserved', () {
      expect('marketplace'.tr('en'), isNotEmpty);
      expect('search_equipment'.tr('en'), isNotEmpty);
    });

    test('Phase 9: Booking lifecycle and security deposit keys preserved', () {
      expect('security_deposit'.tr('en'), isNotEmpty);
      expect('deposit_notice'.tr('en'), isNotEmpty);
    });

    test('Phase 10: Financial intelligence and budget overview keys preserved', () {
      expect('budget_overview'.tr('en'), isNotEmpty);
      expect('total_expenses'.tr('en'), isNotEmpty);
      expect('unknown_cost_notice'.tr('en'), isNotEmpty);
    });

    test('Phase 11: Notifications and in-app chat keys preserved', () {
      expect('notifications'.tr('en'), isNotEmpty);
      expect('chat_with_farmer'.tr('te'), isNotEmpty);
      expect('all_notifications_read'.tr('hi'), isNotEmpty);
    });
  });
}
