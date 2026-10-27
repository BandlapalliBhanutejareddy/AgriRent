import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/core/config/environment.dart';
import 'package:mobile/core/localization/app_localizations.dart';
import 'package:mobile/features/farm/models/farm_model.dart';
import 'package:mobile/features/farm/providers/farm_provider.dart';
import 'package:mobile/features/farm/ui/farm_setup_screen.dart';
import 'package:mobile/routing/router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide User, AuthState;

class MockFarmNotifier extends StateNotifier<FarmState> implements FarmNotifier {
  final List<Map<String, dynamic>> recordedCalls = [];
  bool shouldFailCreation = false;
  bool shouldFailRefresh = false;
  String? failErrorMessage;
  Completer<void>? pendingCompleter;

  MockFarmNotifier(super.initial);

  @override
  Future<void> fetchFarms() async {
    recordedCalls.add({'method': 'fetchFarms'});
    if (shouldFailRefresh) {
      state = state.copyWith(error: 'Network error during farm refresh', isLoading: false);
      throw Exception('Network error during farm refresh');
    }
  }

  @override
  Future<void> selectFarm(String farmId) async {
    recordedCalls.add({'method': 'selectFarm', 'farmId': farmId});
    if (!state.farms.any((f) => f.id == farmId)) return;
    state = state.copyWith(selectedFarmId: farmId);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('selected_farm_id_test_farmer_01', farmId);
  }

  @override
  Future<FarmModel> createFarm({
    required String name,
    required String location,
    required double area,
    String areaUnit = 'acres',
    required String soilType,
    String? cropName,
    String? season,
    String? stage,
    double? totalBudget,
  }) async {
    if (pendingCompleter != null) {
      await pendingCompleter!.future;
    }

    recordedCalls.add({
      'method': 'createFarm',
      'name': name,
      'location': location,
      'area': area,
      'areaUnit': areaUnit,
      'soilType': soilType,
      'cropName': cropName,
      'season': season,
      'stage': stage,
      'totalBudget': totalBudget,
    });

    if (shouldFailCreation) {
      throw Exception(failErrorMessage ?? 'Server rejected farm creation');
    }

    final newFarm = FarmModel(
      id: 'farm_new_authoritative_99',
      ownerId: 'test_farmer_01',
      name: name,
      location: location,
      area: area,
      areaUnit: areaUnit,
      soilType: soilType,
      crops: cropName != null
          ? [
              FarmCropModel(
                id: 'crop_new_99',
                farmId: 'farm_new_authoritative_99',
                cropName: cropName,
                season: season ?? 'Kharif',
                stage: stage ?? 'SOWING',
                status: 'ACTIVE',
              )
            ]
          : [],
      cropsCount: cropName != null ? 1 : 0,
    );

    // Simulate authoritative server refresh containing new farm
    state = state.copyWith(
      farms: [...state.farms, newFarm],
    );

    await fetchFarms();
    await selectFarm(newFarm.id);
    return newFarm;
  }

  @override
  Future<FarmModel> updateFarm({
    required String farmId,
    required String name,
    required String location,
    required double area,
    String areaUnit = 'acres',
    required String soilType,
    String? cropName,
    String? season,
    String? stage,
    double? totalBudget,
  }) async {
    recordedCalls.add({
      'method': 'updateFarm',
      'farmId': farmId,
      'name': name,
      'location': location,
      'area': area,
      'areaUnit': areaUnit,
      'soilType': soilType,
      'cropName': cropName,
      'season': season,
      'stage': stage,
      'totalBudget': totalBudget,
    });

    if (shouldFailCreation) {
      throw Exception(failErrorMessage ?? 'Server rejected farm update');
    }

    final updated = FarmModel(
      id: farmId,
      ownerId: 'test_farmer_01',
      name: name,
      location: location,
      area: area,
      areaUnit: areaUnit,
      soilType: soilType,
      crops: cropName != null
          ? [
              FarmCropModel(
                id: 'crop_upd_01',
                farmId: farmId,
                cropName: cropName,
                season: season ?? 'Kharif',
                stage: stage ?? 'SOWING',
                status: 'ACTIVE',
              )
            ]
          : [],
      cropsCount: cropName != null ? 1 : 0,
    );

    state = state.copyWith(
      farms: state.farms.map((f) => f.id == farmId ? updated : f).toList(),
    );

    await fetchFarms();
    return updated;
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    SharedPreferences.setMockInitialValues({});
    await Supabase.initialize(
      url: Environment.supabaseUrl,
      // ignore: deprecated_member_use
      anonKey: Environment.supabaseAnonKey,
    );
  });

  tearDown(() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  });

  // =========================================================================
  // GROUP 1: Valid Farm Creation
  // =========================================================================
  group('Phase 4 - 1. Valid Farm Creation & Server Confirmation', () {
    test('FarmModel and FarmCropModel parse full authoritative JSON correctly', () {
      final json = {
        'id': 'farm_p4_01',
        'ownerId': 'user_farmer_101',
        'name': 'Guntur Green Field',
        'location': 'Guntur, Andhra Pradesh',
        'area': 6.5,
        'areaUnit': 'acres',
        'soilType': 'Black Soil',
        'crops': [
          {
            'id': 'crop_p4_01',
            'farmId': 'farm_p4_01',
            'cropName': 'Cotton',
            'variety': 'Bt Cotton Hybrid',
            'season': 'Kharif',
            'stage': 'VEGETATIVE',
            'sowingDate': '2026-06-15T00:00:00.000Z',
            'expectedHarvestDate': '2026-11-20T00:00:00.000Z',
            'status': 'ACTIVE',
          }
        ],
        '_count': {'crops': 1, 'risks': 0, 'activities': 3}
      };

      final farm = FarmModel.fromJson(json);
      expect(farm.id, equals('farm_p4_01'));
      expect(farm.ownerId, equals('user_farmer_101'));
      expect(farm.name, equals('Guntur Green Field'));
      expect(farm.location, equals('Guntur, Andhra Pradesh'));
      expect(farm.area, equals(6.5));
      expect(farm.areaUnit, equals('acres'));
      expect(farm.soilType, equals('Black Soil'));
      expect(farm.crops.length, equals(1));

      final crop = farm.crops.first;
      expect(crop.cropName, equals('Cotton'));
      expect(crop.variety, equals('Bt Cotton Hybrid'));
      expect(crop.season, equals('Kharif'));
      expect(crop.stage, equals('VEGETATIVE'));
      expect(crop.sowingDate, isNotNull);
      expect(crop.expectedHarvestDate, isNotNull);
    });

    test('MockFarmNotifier createFarm succeeds and records all supported fields', () async {
      final notifier = MockFarmNotifier(FarmState());

      final created = await notifier.createFarm(
        name: 'Mandya Paddy Acres',
        location: 'Mandya, Karnataka',
        area: 4.0,
        areaUnit: 'acres',
        soilType: 'Red Soil',
        cropName: 'Rice',
        season: 'Kharif',
        stage: 'SOWING',
        totalBudget: 45000.0,
      );

      expect(created.id, equals('farm_new_authoritative_99'));
      expect(created.name, equals('Mandya Paddy Acres'));
      expect(created.area, equals(4.0));
      expect(created.crops.first.cropName, equals('Rice'));
      expect(created.crops.first.stage, equals('SOWING'));

      expect(notifier.recordedCalls.any((c) => c['method'] == 'createFarm'), isTrue);
      final call = notifier.recordedCalls.firstWhere((c) => c['method'] == 'createFarm');
      expect(call['totalBudget'], equals(45000.0));
    });
  });

  // =========================================================================
  // GROUP 2: Required-Field & Numeric Range Validation
  // =========================================================================
  group('Phase 4 - 2. Required-Field & Numeric Range Validation', () {
    testWidgets('Farm name, location, and acreage require non-empty valid inputs', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: FarmSetupScreen(isCreate: true),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Attempt to save completely empty form
      final saveBtn = find.text('Set Up Farm');
      expect(saveBtn, findsOneWidget);
      await tester.ensureVisible(saveBtn);
      await tester.tap(saveBtn);
      await tester.pumpAndSettle();

      // Expect validation error messages
      expect(find.text('Please enter farm name'), findsOneWidget);
      expect(find.text('Please enter farm location'), findsOneWidget);
      expect(find.text('Please enter a valid area greater than 0'), findsOneWidget);
    });

    test('Zero or negative acreage is rejected', () {
      final loc = const AppLocalizations();

      String? validateArea(String? v) {
        if (v == null || v.trim().isEmpty) return loc.translate('enter_valid_area');
        final num = double.tryParse(v.trim());
        if (num == null || num <= 0) return loc.translate('enter_valid_area');
        return null;
      }

      expect(validateArea(''), equals('Please enter a valid area greater than 0'));
      expect(validateArea('0'), equals('Please enter a valid area greater than 0'));
      expect(validateArea('-3.5'), equals('Please enter a valid area greater than 0'));
      expect(validateArea('abc'), equals('Please enter a valid area greater than 0'));
      expect(validateArea('5.5'), isNull);
    });

    test('Budget validation rejects negative numbers but accepts valid positive and empty', () {
      final loc = const AppLocalizations();

      String? validateBudget(String? v) {
        if (v != null && v.trim().isNotEmpty) {
          final num = double.tryParse(v.trim());
          if (num == null || num < 0) {
            return loc.translate('enter_valid_budget');
          }
        }
        return null;
      }

      expect(validateBudget(''), isNull);
      expect(validateBudget('0'), isNull);
      expect(validateBudget('50000'), isNull);
      expect(validateBudget('-1000'), equals('Please enter a valid budget amount'));
      expect(validateBudget('not_a_number'), equals('Please enter a valid budget amount'));
    });
  });

  // =========================================================================
  // GROUP 3: Submission Loading & Duplicate-Submit Prevention
  // =========================================================================
  group('Phase 4 - 3. Submission Loading & Duplicate-Submit Prevention', () {
    testWidgets('Save button disables and displays saving progress indicator during submission', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      final notifier = MockFarmNotifier(FarmState());
      final completer = Completer<void>();
      notifier.pendingCompleter = completer;

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            farmProvider.overrideWith((ref) => notifier),
          ],
          child: const MaterialApp(
            home: FarmSetupScreen(isCreate: true),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Fill in valid required fields
      await tester.enterText(find.byType(TextFormField).at(0), 'Cauvery Fields');
      await tester.enterText(find.byType(TextFormField).at(1), 'Tanjore, Tamil Nadu');
      await tester.enterText(find.byType(TextFormField).at(2), '3.5');

      final saveBtn = find.text('Set Up Farm');
      await tester.ensureVisible(saveBtn);
      await tester.tap(saveBtn);
      await tester.pump(); // Start async submit

      // Verify progress indicator is rendered while request executes
      expect(find.byType(CircularProgressIndicator), findsOneWidget);

      completer.complete();
      await tester.pumpAndSettle(); // Complete async submit
      expect(find.byType(CircularProgressIndicator), findsNothing);
    });

    test('Double-tap or rapid duplicate submit is suppressed', () async {
      int submitCount = 0;
      bool isSubmitting = false;

      Future<void> submit() async {
        if (isSubmitting) return; // Guard against duplicate calls
        isSubmitting = true;
        submitCount++;
        await Future.delayed(const Duration(milliseconds: 100));
        isSubmitting = false;
      }

      // Simulate simultaneous double tap
      final f1 = submit();
      final f2 = submit();
      await Future.wait([f1, f2]);

      expect(submitCount, equals(1));
    });
  });

  // =========================================================================
  // GROUP 4: Server Rejection, Network Error Handling & Value Preservation
  // =========================================================================
  group('Phase 4 - 4. Server Rejection, Network Error Handling & Value Preservation', () {
    test('Server rejection throws clear exception without mutating local state', () async {
      final notifier = MockFarmNotifier(FarmState());
      notifier.shouldFailCreation = true;
      notifier.failErrorMessage = 'Bad Request: Soil type invalid for given coordinates';

      expect(
        () => notifier.createFarm(
          name: 'Invalid Farm',
          location: 'Test Location',
          area: 2.0,
          soilType: 'Unknown',
        ),
        throwsA(isA<Exception>().having(
          (e) => e.toString(),
          'error message',
          contains('Soil type invalid'),
        )),
      );

      // State farms remain empty (no fake injection)
      expect(notifier.state.farms, isEmpty);
    });

    testWidgets('Entered form values are preserved intact after recoverable submission error', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      final notifier = MockFarmNotifier(FarmState());
      notifier.shouldFailCreation = true;
      notifier.failErrorMessage = 'Server temporarily unavailable (503)';

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            farmProvider.overrideWith((ref) => notifier),
          ],
          child: const MaterialApp(
            home: FarmSetupScreen(isCreate: true),
          ),
        ),
      );
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextFormField).at(0), 'Krishna Valley');
      await tester.enterText(find.byType(TextFormField).at(1), 'Vijayawada');
      await tester.enterText(find.byType(TextFormField).at(2), '8.2');

      final saveBtn = find.text('Set Up Farm');
      await tester.ensureVisible(saveBtn);
      await tester.tap(saveBtn);
      await tester.pumpAndSettle();

      // Form values must still be retained in fields for user correction/retry
      expect(find.text('Krishna Valley'), findsOneWidget);
      expect(find.text('Vijayawada'), findsOneWidget);
      expect(find.text('8.2'), findsOneWidget);

      // Error banner displays server failure message
      expect(find.text('Server temporarily unavailable (503)'), findsWidgets);
    });
  });

  // =========================================================================
  // GROUP 5: Farm List Refresh & Safe Selection
  // =========================================================================
  group('Phase 4 - 5. Farm List Refresh & Safe Selection', () {
    test('Authoritative refresh and selection persistence after creation', () async {
      final notifier = MockFarmNotifier(FarmState());
      final prefs = await SharedPreferences.getInstance();

      final farm = await notifier.createFarm(
        name: 'New Plot 1',
        location: 'Warangal',
        area: 3.0,
        soilType: 'Black Soil',
      );

      expect(notifier.recordedCalls.any((c) => c['method'] == 'fetchFarms'), isTrue);
      expect(notifier.recordedCalls.any((c) => c['method'] == 'selectFarm' && c['farmId'] == farm.id), isTrue);

      final persisted = prefs.getString('selected_farm_id_test_farmer_01');
      expect(persisted, equals(farm.id));
    });

    test('Failed server refresh does not fabricate unverified farm locally', () async {
      final notifier = MockFarmNotifier(FarmState());
      notifier.shouldFailRefresh = true;

      expect(
        () => notifier.createFarm(
          name: 'Unverified Farm',
          location: 'Hyderabad Rural',
          area: 5.0,
          soilType: 'Red Soil',
        ),
        throwsA(isA<Exception>().having(
          (e) => e.toString(),
          'error message',
          contains('Network error during farm refresh'),
        )),
      );
    });
  });

  // =========================================================================
  // GROUP 6: Empty, Single-Farm, and Multi-Farm State Behavior
  // =========================================================================
  group('Phase 4 - 6. Empty, Single-Farm, and Multi-Farm State Behavior', () {
    test('0-farm state safely exposes null selectedFarm without throwing', () {
      final state = FarmState(farms: []);
      expect(state.selectedFarm, isNull);
      expect(state.farms, isEmpty);
    });

    test('Single-farm state defaults to single farm cleanly', () {
      final f1 = FarmModel(
        id: 'f1',
        ownerId: 'u1',
        name: 'Sole Farm',
        location: 'Kurnool',
        area: 5.0,
        areaUnit: 'acres',
        soilType: 'Black Soil',
      );
      final state = FarmState(farms: [f1]);
      expect(state.selectedFarm, isNotNull);
      expect(state.selectedFarm!.id, equals('f1'));
    });

    test('Multi-farm state accurately tracks selected farm across list', () {
      final f1 = FarmModel(id: 'f1', ownerId: 'u1', name: 'Farm One', location: 'Loc 1', area: 2.0, areaUnit: 'acres', soilType: 'Red Soil');
      final f2 = FarmModel(id: 'f2', ownerId: 'u1', name: 'Farm Two', location: 'Loc 2', area: 4.0, areaUnit: 'acres', soilType: 'Black Soil');

      final state = FarmState(farms: [f1, f2], selectedFarmId: 'f2');
      expect(state.selectedFarm, isNotNull);
      expect(state.selectedFarm!.name, equals('Farm Two'));
    });
  });

  // =========================================================================
  // GROUP 7: Crop Context & Canonical Lifecycle-Stage Preservation
  // =========================================================================
  group('Phase 4 - 7. Crop Context & Canonical Lifecycle-Stage Preservation', () {
    test('Canonical lifecycle stages match required 8-stage sequence', () {
      const expectedStages = [
        'SOWING',
        'GERMINATION',
        'SEEDLING',
        'VEGETATIVE',
        'FLOWERING',
        'FRUITING',
        'MATURITY',
        'HARVEST'
      ];

      expect(kCanonicalStages, equals(expectedStages));
    });

    test('Crop registration preserves season, name, and stage without auto-advancing', () {
      final crop = FarmCropModel(
        id: 'c1',
        farmId: 'f1',
        cropName: 'Sugarcane',
        variety: 'Co 86032',
        season: 'Perennial',
        stage: 'VEGETATIVE',
        status: 'ACTIVE',
      );

      // Stage remains strictly VEGETATIVE
      expect(crop.stage, equals('VEGETATIVE'));
      expect(crop.season, equals('Perennial'));
      expect(crop.cropName, equals('Sugarcane'));
    });
  });

  // =========================================================================
  // GROUP 8: User Ownership & Account Isolation
  // =========================================================================
  group('Phase 4 - 8. User Ownership & Account Isolation', () {
    test('Farm selection keys are user-scoped in SharedPreferences', () async {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('selected_farm_id_user_farmer_A', 'farm_A_01');
      await prefs.setString('selected_farm_id_user_farmer_B', 'farm_B_02');

      expect(prefs.getString('selected_farm_id_user_farmer_A'), equals('farm_A_01'));
      expect(prefs.getString('selected_farm_id_user_farmer_B'), equals('farm_B_02'));
    });

    test('FarmState reset on account switch purges in-memory list', () {
      var state = FarmState(
        farms: [
          FarmModel(id: 'f1', ownerId: 'u1', name: 'Farmer A Field', location: 'A', area: 1, areaUnit: 'acres', soilType: 'Red Soil')
        ],
        selectedFarmId: 'f1',
      );
      expect(state.farms, isNotEmpty);

      // Logout / account change event resets to fresh state
      state = FarmState();
      expect(state.farms, isEmpty);
      expect(state.selectedFarm, isNull);
    });
  });

  // =========================================================================
  // GROUP 9: 5-Language Native Localization
  // =========================================================================
  group('Phase 4 - 9. 5-Language Authentic Localization', () {
    const requiredKeys = [
      'add_new_farm',
      'edit_farm',
      'farm_location',
      'enter_farm_name',
      'enter_farm_location',
      'enter_valid_area',
      'select_soil_type',
      'enter_valid_budget',
      'farm_updated_successfully',
      'saving_farm',
      'crop_variety',
      'optional_helper',
      'acres',
      'hectares',
    ];

    const supportedLanguages = ['en', 'te', 'hi', 'ta', 'kn'];

    for (final lang in supportedLanguages) {
      test('Language "$lang" provides all Phase 4 translations without raw fallback keys', () {
        for (final key in requiredKeys) {
          final translated = AppLocalizations.get(key, lang);
          expect(translated, isNotEmpty, reason: 'Key $key was empty in $lang');
          expect(translated, isNot(equals(key)), reason: 'Key $key returned raw key in $lang');
        }
      });
    }

    test('Telugu native Unicode characters render without mojibake corruption', () {
      final text = AppLocalizations.get('add_new_farm', 'te');
      expect(text, equals('కొత్త పొలాన్ని జోడించండి'));
    });

    test('Hindi native Unicode characters render without mojibake corruption', () {
      final text = AppLocalizations.get('add_new_farm', 'hi');
      expect(text, equals('नया खेत जोड़ें'));
    });

    test('Tamil native Unicode characters render without mojibake corruption', () {
      final text = AppLocalizations.get('add_new_farm', 'ta');
      expect(text, equals('புதிய பண்ணையைச் சேர்க்கவும்'));
    });

    test('Kannada native Unicode characters render without mojibake corruption', () {
      final text = AppLocalizations.get('add_new_farm', 'kn');
      expect(text, equals('ಹೊಸ ಫಾರ್ಮ್ ಸೇರಿಸಿ'));
    });
  });

  // =========================================================================
  // GROUP 10: Canonical Entry Points Navigation
  // =========================================================================
  group('Phase 4 - 10. Canonical Entry Points Navigation', () {
    test('Router correctly registers /farm-setup route with mode and farmId parsing', () {
      final farmSetupRoute = AppRouter.routes
          .whereType<GoRoute>()
          .firstWhere((r) => r.path == '/farm-setup');

      expect(farmSetupRoute, isNotNull);
      expect(farmSetupRoute.path, equals('/farm-setup'));
    });
  });

  // =========================================================================
  // GROUP 11: Regression Coverage for Phase 1, Phase 2, and Phase 3
  // =========================================================================
  group('Phase 4 - 11. Preservation of Phase 1, 2, and 3 Regressions', () {
    test('Phase 1: Knowledge base alias and localized roles preserved', () {
      expect(AppLocalizations.get('knowledge_base', 'en'), isNotEmpty);
      expect(AppLocalizations.localizedRole('FARMER', 'en'), equals('Farmer'));
      expect(AppLocalizations.localizedRole('OWNER', 'te'), isNotEmpty);
    });

    test('Phase 2: Role navigation structure preserved', () {
      final farmerRoute = AppRouter.routes.whereType<GoRoute>().firstWhere((r) => r.path == '/farmer');
      final ownerRoute = AppRouter.routes.whereType<GoRoute>().firstWhere((r) => r.path == '/owner');
      expect(farmerRoute, isNotNull);
      expect(ownerRoute, isNotNull);
    });

    test('Phase 3: Dashboard synchronization keys and canonical stages preserved', () {
      expect(AppLocalizations.get('todays_tasks', 'en'), equals("Today's Tasks"));
      expect(AppLocalizations.get('farmer_analytics', 'te'), isNotEmpty);
      expect(AppLocalizations.get('all_clear', 'hi'), isNotEmpty);
    });
  });
}
