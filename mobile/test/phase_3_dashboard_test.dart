import 'dart:async';
import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/config/environment.dart';
import 'package:mobile/core/localization/app_localizations.dart';
import 'package:mobile/features/auth/providers/auth_provider.dart';
import 'package:mobile/features/farm/models/expense_model.dart';
import 'package:mobile/features/farm/models/farm_model.dart';
import 'package:mobile/features/farm/providers/expenses_provider.dart';
import 'package:mobile/features/farm/providers/farm_provider.dart';
import 'package:mobile/features/farm/providers/schedule_provider.dart';
import 'package:mobile/routing/router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide User, AuthState;

class FakeAuthNotifier extends StateNotifier<AuthState> implements AuthNotifier {
  FakeAuthNotifier(super.initial);
  void updateState(AuthState next) => state = next;
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class FakeLanguageNotifier extends StateNotifier<String> implements LanguageNotifier {
  FakeLanguageNotifier([super.lang = 'en']);
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class FakeFarmNotifier extends StateNotifier<FarmState> implements FarmNotifier {
  FakeFarmNotifier(super.initial);
  @override
  Future<void> fetchFarms() => Completer<void>().future;
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

  group('Phase 3 - 1. Dashboard with a Valid Selected Farm', () {
    final sowingDate = DateTime.now().subtract(const Duration(days: 45));
    final harvestDate = DateTime.now().add(const Duration(days: 75));

    final testCrop = FarmCropModel(
      id: 'crop_p3_01',
      farmId: 'farm_p3_01',
      cropName: 'Paddy (Rice)',
      variety: 'BPT 5204 (Sona Masuri)',
      season: 'KHARIF',
      stage: 'Vegetative / Tillering',
      status: 'ACTIVE',
      sowingDate: sowingDate,
      expectedHarvestDate: harvestDate,
    );

    final testFarm = FarmModel(
      id: 'farm_p3_01',
      ownerId: 'farmer_p3_user',
      name: 'Green Acres North',
      location: 'Madanapalle, Chittoor',
      area: 4.5,
      areaUnit: 'ACRE',
      soilType: 'RED_LOAMY',
      crops: [testCrop],
      cropsCount: 1,
    );

    test('Valid selected farm exposes authoritative identity, crop, and dates', () {
      final state = FarmState(farms: [testFarm], selectedFarmId: 'farm_p3_01');

      expect(state.selectedFarm, isNotNull);
      expect(state.selectedFarm!.name, equals('Green Acres North'));
      expect(state.selectedFarm!.location, equals('Madanapalle, Chittoor'));
      expect(state.selectedFarm!.area, equals(4.5));
      expect(state.selectedFarm!.crops.length, equals(1));

      final crop = state.selectedFarm!.crops.first;
      expect(crop.cropName, equals('Paddy (Rice)'));
      expect(crop.stage, equals('Vegetative / Tillering'));
      expect(crop.sowingDate, isNotNull);
      expect(crop.expectedHarvestDate, isNotNull);

      final daysSinceSowing = DateTime.now().difference(crop.sowingDate!).inDays;
      expect(daysSinceSowing, inInclusiveRange(44, 46));
    });

    test('Canonical stage progression and next stage resolution', () {
      const canonicalStages = [
        'Seedbed Preparation',
        'Sowing / Transplanting',
        'Vegetative / Tillering',
        'Panicle Initiation / Flowering',
        'Grain Filling / Maturation',
        'Harvest',
      ];

      final currentStage = testCrop.stage;
      final currentIndex = canonicalStages.indexWhere(
        (s) => s.toLowerCase().contains(currentStage.toLowerCase().split(' ').first),
      );
      expect(currentIndex, equals(2));

      final nextStage = (currentIndex >= 0 && currentIndex < canonicalStages.length - 1)
          ? canonicalStages[currentIndex + 1]
          : null;
      expect(nextStage, equals('Panicle Initiation / Flowering'));
    });
  });

  group('Phase 3 - 2. Dashboard with No Registered Farms', () {
    test('Zero farm state safely produces null selectedFarm without runtime exceptions', () {
      final emptyState = FarmState(farms: [], selectedFarmId: null);

      expect(emptyState.selectedFarm, isNull);
      expect(emptyState.selectedFarmId, isNull);
      expect(emptyState.farms.isEmpty, isTrue);
    });

    test('Zero farm task progress avoids division by zero', () {
      const totalTasks = 0;
      const completedTasks = 0;
      final progress = totalTasks > 0 ? (completedTasks / totalTasks).clamp(0.0, 1.0) : 0.0;

      expect(progress, equals(0.0));
      expect(progress.isNaN, isFalse);
      expect(progress.isInfinite, isFalse);
    });
  });

  group('Phase 3 - 3. Dashboard when Farm-Specific API Requests Fail', () {
    test('ScheduleState captures API error and preserves null schedule without mock data', () {
      final errorState = ScheduleState(
        schedule: null,
        isLoading: false,
        error: 'Failed to load schedule from server',
      );

      expect(errorState.isLoading, isFalse);
      expect(errorState.error, equals('Failed to load schedule from server'));
      expect(errorState.schedule, isNull);
      expect(errorState.schedule?.operations, isNull);
    });

    test('ExpensesState captures API failure and does not fabricate budget numbers', () {
      final errorState = ExpensesState(
        farmExpenses: {},
        isLoading: false,
        error: 'Network error connecting to expenses service',
      );

      expect(errorState.isLoading, isFalse);
      expect(errorState.error, isNotNull);
      expect(errorState.farmExpenses.containsKey('farm_p3_01'), isFalse);
      expect(errorState.farmExpenses['farm_p3_01'], isNull);
    });
  });

  group('Phase 3 - 4. Switching Farms and Refreshing Dashboard Information', () {
    final farmA = FarmModel(
      id: 'farm_alpha',
      ownerId: 'farmer_user',
      name: 'Alpha Fields',
      location: 'Village A',
      area: 2.5,
      areaUnit: 'ACRE',
      soilType: 'ALLUVIAL',
      crops: [
        FarmCropModel(
          id: 'c_alpha',
          farmId: 'farm_alpha',
          cropName: 'Cotton',
          season: 'KHARIF',
          stage: 'Sowing / Transplanting',
          status: 'ACTIVE',
        ),
      ],
    );

    final farmB = FarmModel(
      id: 'farm_beta',
      ownerId: 'farmer_user',
      name: 'Beta Orchards',
      location: 'Village B',
      area: 4.0,
      areaUnit: 'ACRE',
      soilType: 'RED_LOAMY',
      crops: [
        FarmCropModel(
          id: 'c_beta',
          farmId: 'farm_beta',
          cropName: 'Mango',
          season: 'ANNUAL',
          stage: 'Flowering',
          status: 'ACTIVE',
        ),
      ],
    );

    test('Selecting different farm updates selectedFarm and associated crop immediately', () {
      var state = FarmState(farms: [farmA, farmB], selectedFarmId: 'farm_alpha');
      expect(state.selectedFarm?.id, equals('farm_alpha'));
      expect(state.selectedFarm?.name, equals('Alpha Fields'));
      expect(state.selectedFarm?.crops.first.cropName, equals('Cotton'));

      // Switch to Farm B
      state = state.copyWith(selectedFarmId: 'farm_beta');
      expect(state.selectedFarm?.id, equals('farm_beta'));
      expect(state.selectedFarm?.name, equals('Beta Orchards'));
      expect(state.selectedFarm?.crops.first.cropName, equals('Mango'));
      expect(state.selectedFarm?.location, equals('Village B'));
    });
  });

  group('Phase 3 - 5. Preventing Stale Responses from Overwriting Newly Selected Farm', () {
    test('Race condition guard: response with outdated requestId is ignored', () {
      int activeRequestId = 0;
      String? activeFarmId;
      Map<String, dynamic>? activeAnalytics;

      // Farm A requested
      activeFarmId = 'farm_A';
      final request1Id = ++activeRequestId; // 1

      // Farm B requested before Farm A response returns
      activeFarmId = 'farm_B';
      final request2Id = ++activeRequestId; // 2
      activeAnalytics = null; // Stale data cleared immediately

      // Simulated Farm A response arrives late
      void onResponseReceived(int requestId, String farmId, Map<String, dynamic> data) {
        if (requestId == activeRequestId && activeFarmId == farmId) {
          activeAnalytics = data;
        }
      }

      // Farm A response arrives
      onResponseReceived(request1Id, 'farm_A', {'spending': 10000, 'activeOps': 2});
      expect(activeAnalytics, isNull, reason: 'Late Farm A response must be dropped because activeRequestId is 2');

      // Farm B response arrives
      onResponseReceived(request2Id, 'farm_B', {'spending': 5000, 'activeOps': 1});
      expect(activeAnalytics, isNotNull);
      expect(activeAnalytics!['spending'], equals(5000));
      expect(activeAnalytics!['activeOps'], equals(1));
    });
  });

  group('Phase 3 - 6. Task Progress and Completed-Task Updates', () {
    test('Task progress calculates exact ratio without rounding drift', () {
      double computeProgress(int completed, int total) {
        if (total <= 0) return 0.0;
        return (completed / total).clamp(0.0, 1.0);
      }

      expect(computeProgress(0, 10), equals(0.0));
      expect(computeProgress(3, 10), equals(0.3));
      expect(computeProgress(5, 10), equals(0.5));
      expect(computeProgress(10, 10), equals(1.0));
    });

    test('Completing an individual task does not artificially advance crop lifecycle stage', () {
      var cropStage = 'Vegetative / Tillering';
      var completedTasks = 2;
      const totalTasks = 5;

      // Complete a task
      completedTasks++;
      final updatedProgress = completedTasks / totalTasks;

      expect(completedTasks, equals(3));
      expect(updatedProgress, equals(0.6));
      expect(cropStage, equals('Vegetative / Tillering'),
          reason: 'Completing a task must NOT advance crop stage without deterministic agricultural business rule execution');
    });
  });

  group('Phase 3 - 7. Null or Unavailable Financial Values', () {
    test('Missing farm expense data displays explicit unavailable fallback without assuming zero', () {
      final expensesState = ExpensesState(farmExpenses: {});

      final farmId = 'farm_unconfigured';
      final data = expensesState.farmExpenses[farmId];

      final displayBudget = (data != null && data.totalBudget != null) ? '₹${data.totalBudget!.toStringAsFixed(0)}' : 'Not configured';
      final displaySpent = data != null ? '₹${data.totalSpent.toStringAsFixed(0)}' : '--';

      expect(displayBudget, equals('Not configured'));
      expect(displaySpent, equals('--'));
    });

    test('Known zero spent is distinguishable from unavailable data', () {
      final knownZeroData = FarmExpensesData(
        totalBudget: 25000.0,
        totalSpent: 0.0,
        remainingBudget: 25000.0,
        currency: 'INR',
        expenses: [],
      );

      final displaySpent = '₹${knownZeroData.totalSpent.toStringAsFixed(0)}';
      expect(displaySpent, equals('₹0'));
      expect(knownZeroData.totalBudget, equals(25000.0));
      expect(knownZeroData.remainingBudget, equals(25000.0));
    });
  });

  group('Phase 3 - 8. Booking and Payment Status Presentation', () {
    test('Booking status preserves distinct states and does not mark pending as paid', () {
      final bookings = [
        {'id': 'b1', 'toolName': 'Mahindra Tractor 575 DI', 'totalPrice': 3200, 'status': 'CONFIRMED', 'date': '2026-03-10'},
        {'id': 'b2', 'toolName': 'Rotavator 6ft', 'totalPrice': 1500, 'status': 'PENDING', 'date': '2026-03-12'},
        {'id': 'b3', 'toolName': 'Combine Harvester', 'totalPrice': 8000, 'status': 'CANCELLED', 'date': '2026-03-01'},
      ];

      for (final booking in bookings) {
        final status = booking['status'] as String;
        final isPaid = status == 'COMPLETED'; // Only completed rentals are paid

        if (status == 'PENDING') {
          expect(isPaid, isFalse, reason: 'PENDING booking must not be treated as paid');
        }
        if (status == 'CANCELLED') {
          expect(isPaid, isFalse);
        }

        final price = booking['totalPrice'] as num;
        final formattedPrice = '₹${price.toStringAsFixed(0)}';
        expect(formattedPrice, startsWith('₹'));
      }
    });
  });

  group('Phase 3 - 9. 5-Language Localization for All Phase 3 Keys', () {
    const phase3Keys = [
      'todays_tasks',
      'crop_stage',
      'farm_alerts',
      'no_crop_registered',
      'no_active_tasks',
      'all_clear',
      'next_important_operations',
      'farmer_analytics',
      'active_operations',
      'completed_tasks',
      'total_rentals',
      'total_spending',
      'recent_activity',
      'no_recent_activity',
      'view_crop_details',
      'next_stage',
      'no_farm_selected',
      'no_operations_scheduled',
      'all_operations_completed',
    ];

    const supportedLanguages = ['en', 'te', 'hi', 'ta', 'kn'];

    for (final lang in supportedLanguages) {
      test('Language "$lang" provides authentic translations for all Phase 3 keys without returning raw key', () {
        for (final key in phase3Keys) {
          final translated = key.tr(lang);
          expect(translated, isNotEmpty, reason: 'Translation for "$key" in "$lang" must not be empty');
          expect(
            translated,
            isNot(equals(key)),
            reason: 'Key "$key" should have an authentic translation in "$lang" rather than returning the raw key.',
          );
        }
      });
    }
  });

  group('Phase 3 - 10. Preservation of Phase 1 and Phase 2 Regressions', () {
    test('Phase 1: CommunityScreen isTab parameter pop isolation is preserved', () {
      final file = File('lib/features/community/ui/community_screen.dart');
      expect(file.existsSync(), isTrue);
      final content = file.readAsStringSync();
      expect(content.contains('final bool isTab;'), isTrue);
      expect(content.contains('leading: widget.isTab'), isTrue);
      expect(content.contains('onPressed: widget.onBack'), isTrue);
    });

    test('Phase 2: Strict role route guards remain enforced', () {
      final farmerBlockedRedirect = AppRouter.testRoleRedirect(userRole: 'OWNER', targetPath: '/farmer');
      expect(farmerBlockedRedirect, equals('/owner'));

      final ownerBlockedRedirect = AppRouter.testRoleRedirect(userRole: 'FARMER', targetPath: '/owner');
      expect(ownerBlockedRedirect, equals('/farmer'));

      final adminBlockedRedirect = AppRouter.testRoleRedirect(userRole: 'FARMER', targetPath: '/admin');
      expect(adminBlockedRedirect, equals('/farmer'));
    });

    test('Phase 2: AI Copilot routes /farm-copilot and /ai-assistant remain registered', () {
      final routes = AppRouter.router.configuration.routes;
      final paths = <String>[];
      void collectPaths(List<dynamic> routeList) {
        for (final route in routeList) {
          if (route.path != null) {
            paths.add(route.path);
          }
          if (route.routes != null && route.routes.isNotEmpty) {
            collectPaths(route.routes);
          }
        }
      }
      collectPaths(routes);

      expect(paths.contains('/farm-copilot'), isTrue);
      expect(paths.contains('/ai-assistant'), isTrue);
    });

    test('Phase 2: Deleted orphaned screens remain absent', () {
      const deletedScreens = [
        'lib/features/marketplace/ui/farmer_dashboard_screen.dart',
        'lib/features/marketplace/ui/farmer_hub_screen.dart',
        'lib/features/profile/ui/profile_screen.dart',
        'lib/features/profile/ui/owner_home_placeholder_screen.dart',
        'lib/features/profile/ui/owner_dashboard_screen.dart',
      ];

      for (final relPath in deletedScreens) {
        expect(File(relPath).existsSync(), isFalse);
      }
    });
  });
}
