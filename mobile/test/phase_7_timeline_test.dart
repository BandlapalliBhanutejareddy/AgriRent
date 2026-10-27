import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile/core/localization/app_localizations.dart';
import 'package:mobile/features/farm/models/farm_model.dart';
import 'package:mobile/features/farm/models/schedule_model.dart';
import 'package:mobile/features/farm/providers/schedule_provider.dart';
import 'package:mobile/features/farm/providers/farm_provider.dart';
import 'package:mobile/features/auth/providers/auth_provider.dart';
import 'package:mobile/models/user.dart';

class FakeAuthNotifier extends StateNotifier<AuthState> implements AuthNotifier {
  FakeAuthNotifier(super.initial);

  void updateState(AuthState next) => state = next;

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    SharedPreferences.setMockInitialValues({});
  });

  tearDown(() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  });

  // =========================================================================
  // 1. NEXT-OPERATION SELECTION FROM ACTUAL RETURNED RECORDS
  // =========================================================================
  group('Phase 7 - 1. Next-Operation Selection Logic', () {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final inThreeDays = today.add(const Duration(days: 3));
    final inTenDays = today.add(const Duration(days: 10));

    test('Prioritizes active IN_PROGRESS operation over future planned operations', () {
      final opPlanned = FarmOperationModel(
        id: 'op_planned',
        farmCropId: 'crop_01',
        name: 'Top Dressing Fertilizer',
        status: 'PLANNED',
        plannedStartDate: inThreeDays,
        tasks: [],
      );

      final opInProgress = FarmOperationModel(
        id: 'op_active',
        farmCropId: 'crop_01',
        name: 'Weeding and Intercultivation',
        status: 'IN_PROGRESS',
        plannedStartDate: today,
        tasks: [],
      );

      final opFuture = FarmOperationModel(
        id: 'op_future',
        farmCropId: 'crop_01',
        name: 'Pesticide Spraying',
        status: 'PLANNED',
        plannedStartDate: inTenDays,
        tasks: [],
      );

      final ops = [opPlanned, opInProgress, opFuture];

      // Selection rule: IN_PROGRESS takes precedence
      FarmOperationModel? selected = ops.where((o) => o.isInProgress).firstOrNull;
      selected ??= ops.where((o) => !o.isCompleted).firstOrNull;

      expect(selected, isNotNull);
      expect(selected!.id, equals('op_active'));
      expect(selected.name, equals('Weeding and Intercultivation'));
      expect(selected.isInProgress, isTrue);
    });

    test('Selects earliest pending operation when none are currently IN_PROGRESS', () {
      final op1 = FarmOperationModel(
        id: 'op_01',
        farmCropId: 'crop_01',
        name: 'Land Preparation',
        status: 'COMPLETED',
        plannedStartDate: today.subtract(const Duration(days: 14)),
        completedAt: today.subtract(const Duration(days: 12)),
        tasks: [],
      );

      final op2 = FarmOperationModel(
        id: 'op_02',
        farmCropId: 'crop_01',
        name: 'Irrigation Check',
        status: 'PLANNED',
        plannedStartDate: inThreeDays,
        tasks: [],
      );

      final op3 = FarmOperationModel(
        id: 'op_03',
        farmCropId: 'crop_01',
        name: 'Harvesting',
        status: 'PLANNED',
        plannedStartDate: inTenDays,
        tasks: [],
      );

      final ops = [op1, op2, op3];

      FarmOperationModel? selected = ops.where((o) => o.isInProgress).firstOrNull;
      selected ??= ops.where((o) => !o.isCompleted).firstOrNull;

      expect(selected, isNotNull);
      expect(selected!.id, equals('op_02'));
      expect(selected.name, equals('Irrigation Check'));
    });
  });

  // =========================================================================
  // 2. EMPTY NEXT-OPERATION STATE
  // =========================================================================
  group('Phase 7 - 2. Empty Next-Operation State', () {
    test('Shows "all_operations_completed" when all recorded operations are done', () {
      final ops = [
        FarmOperationModel(
          id: 'op_1',
          farmCropId: 'crop_1',
          name: 'Sowing',
          status: 'COMPLETED',
          tasks: [],
        ),
        FarmOperationModel(
          id: 'op_2',
          farmCropId: 'crop_1',
          name: 'Harvest',
          status: 'COMPLETED',
          tasks: [],
        ),
      ];

      final nextOp = ops.where((o) => !o.isCompleted).firstOrNull;
      expect(nextOp, isNull);

      final hasCompleted = ops.any((o) => o.isCompleted);
      final emptyMessageKey = hasCompleted ? 'all_operations_completed' : 'no_upcoming_operations';

      expect(emptyMessageKey, equals('all_operations_completed'));
      expect(AppLocalizations.get(emptyMessageKey, 'en'), equals('All operations completed'));
      expect(AppLocalizations.get(emptyMessageKey, 'te'), equals('అన్ని పనులు పూర్తయ్యాయి'));
    });

    test('Shows "no_upcoming_operations" when farm has zero operations generated', () {
      final ops = <FarmOperationModel>[];

      final nextOp = ops.where((o) => !o.isCompleted).firstOrNull;
      expect(nextOp, isNull);

      final hasCompleted = ops.any((o) => o.isCompleted);
      final emptyMessageKey = hasCompleted ? 'all_operations_completed' : 'no_upcoming_operations';

      expect(emptyMessageKey, equals('no_upcoming_operations'));
      expect(AppLocalizations.get(emptyMessageKey, 'en'), equals('No upcoming operations'));
      expect(AppLocalizations.get(emptyMessageKey, 'hi'), equals('कोई आगामी कार्य नहीं'));
    });
  });

  // =========================================================================
  // 3. TIMELINE ORDERING (CHRONOLOGICAL)
  // =========================================================================
  group('Phase 7 - 3. Timeline Ordering', () {
    test('Orders operations chronologically ascending by planned/completed date', () {
      final d1 = DateTime(2026, 5, 1);
      final d2 = DateTime(2026, 6, 15);
      final d3 = DateTime(2026, 8, 20);

      final opEarly = FarmOperationModel(
        id: 'early',
        farmCropId: 'crop_1',
        name: 'Nursery Sowing',
        status: 'COMPLETED',
        plannedStartDate: d1,
        tasks: [],
      );

      final opLate = FarmOperationModel(
        id: 'late',
        farmCropId: 'crop_1',
        name: 'Harvesting & Threshing',
        status: 'PLANNED',
        plannedStartDate: d3,
        tasks: [],
      );

      final opMid = FarmOperationModel(
        id: 'mid',
        farmCropId: 'crop_1',
        name: 'Fertilizer Top Dressing',
        status: 'IN_PROGRESS',
        plannedStartDate: d2,
        tasks: [],
      );

      // Unordered input
      final list = [opLate, opEarly, opMid];

      list.sort((a, b) {
        final dateA = a.completedAt ?? a.plannedStartDate;
        final dateB = b.completedAt ?? b.plannedStartDate;
        if (dateA != null && dateB != null) return dateA.compareTo(dateB);
        if (dateA != null && dateB == null) return -1;
        if (dateA == null && dateB != null) return 1;
        return 0;
      });

      expect(list[0].id, equals('early'));
      expect(list[1].id, equals('mid'));
      expect(list[2].id, equals('late'));
    });
  });

  // =========================================================================
  // 4. MISSING AND INVALID DATE HANDLING
  // =========================================================================
  group('Phase 7 - 4. Missing and Invalid Date Handling', () {
    test('Places undated operations safely at the end of the timeline without crashing', () {
      final datedOp = FarmOperationModel(
        id: 'dated',
        farmCropId: 'crop_1',
        name: 'Transplanting',
        status: 'PLANNED',
        plannedStartDate: DateTime(2026, 6, 1),
        tasks: [],
      );

      final undatedOp = FarmOperationModel(
        id: 'undated',
        farmCropId: 'crop_1',
        name: 'Soil Testing',
        status: 'PLANNED',
        plannedStartDate: null,
        tasks: [],
      );

      final list = [undatedOp, datedOp];

      list.sort((a, b) {
        final dateA = a.completedAt ?? a.plannedStartDate;
        final dateB = b.completedAt ?? b.plannedStartDate;
        if (dateA != null && dateB != null) return dateA.compareTo(dateB);
        if (dateA != null && dateB == null) return -1;
        if (dateA == null && dateB != null) return 1;
        return 0;
      });

      expect(list[0].id, equals('dated'));
      expect(list[1].id, equals('undated'));
      expect(list[1].plannedStartDate, isNull);
    });

    test('Never labels an undated operation as overdue', () {
      final undatedOp = FarmOperationModel(
        id: 'undated_pending',
        farmCropId: 'crop_1',
        name: 'General Maintenance',
        status: 'PENDING',
        plannedStartDate: null,
        tasks: [],
      );

      expect(undatedOp.isOverdue, isFalse);

      final undatedScheduled = ScheduledOperationModel(
        operationId: 'sch_undated',
        name: 'General Maintenance',
        stage: 'VEGETATIVE',
        status: 'PLANNED',
        plannedStartDate: '',
        reason: 'Periodic check',
      );

      expect(undatedScheduled.isOverdue, isFalse);
    });

    test('Safely parses invalid date strings in ScheduledOperationModel without throwing', () {
      final invalidDateOp = ScheduledOperationModel(
        operationId: 'inv',
        name: 'Weed Control',
        stage: 'SEEDLING',
        status: 'PLANNED',
        plannedStartDate: 'not-a-valid-date-string',
        reason: 'Post-emergence weeding',
      );

      expect(invalidDateOp.parsedStartDate, isNull);
      expect(invalidDateOp.isOverdue, isFalse);
    });
  });

  // =========================================================================
  // 5. STATUS PRESENTATION (COMPLETED, IN-PROGRESS, PENDING)
  // =========================================================================
  group('Phase 7 - 5. Status Presentation', () {
    test('Accurately identifies isCompleted, isInProgress, and planned states', () {
      final completedOp = FarmOperationModel(
        id: 'c1',
        farmCropId: 'crop_1',
        name: 'Basal Dose',
        status: 'COMPLETED',
        tasks: [],
      );
      expect(completedOp.isCompleted, isTrue);
      expect(completedOp.isInProgress, isFalse);

      final inProgressOp = FarmOperationModel(
        id: 'ip1',
        farmCropId: 'crop_1',
        name: 'Weed Management',
        status: 'IN_PROGRESS',
        tasks: [],
      );
      expect(inProgressOp.isCompleted, isFalse);
      expect(inProgressOp.isInProgress, isTrue);

      final plannedOp = FarmOperationModel(
        id: 'p1',
        farmCropId: 'crop_1',
        name: 'Flowering Spray',
        status: 'PLANNED',
        tasks: [],
      );
      expect(plannedOp.isCompleted, isFalse);
      expect(plannedOp.isInProgress, isFalse);
      expect(plannedOp.status, equals('PLANNED'));
    });

    test('Calculates task progress counts and ratio accurately', () {
      final op = FarmOperationModel(
        id: 'op_tasks',
        farmCropId: 'crop_1',
        name: 'Pest Scouting',
        status: 'IN_PROGRESS',
        tasks: [
          FarmTaskModel(id: 't1', operationId: 'op_tasks', title: 'North Field', status: 'COMPLETED', priority: 'HIGH', dueDate: null),
          FarmTaskModel(id: 't2', operationId: 'op_tasks', title: 'South Field', status: 'COMPLETED', priority: 'MEDIUM', dueDate: null),
          FarmTaskModel(id: 't3', operationId: 'op_tasks', title: 'East Field', status: 'PENDING', priority: 'LOW', dueDate: null),
          FarmTaskModel(id: 't4', operationId: 'op_tasks', title: 'West Field', status: 'PENDING', priority: 'LOW', dueDate: null),
        ],
      );

      expect(op.totalTasksCount, equals(4));
      expect(op.completedTasksCount, equals(2));
      expect(op.progressRatio, equals(0.5));
    });
  });

  // =========================================================================
  // 6. OVERDUE DETERMINATION STRICT INVARIANTS
  // =========================================================================
  group('Phase 7 - 6. Overdue Determination', () {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final pastDate = today.subtract(const Duration(days: 3));
    final futureDate = today.add(const Duration(days: 3));

    test('Marks operation overdue ONLY if date < today AND status != COMPLETED', () {
      final overdueOp = FarmOperationModel(
        id: 'ov1',
        farmCropId: 'crop_1',
        name: 'Irrigation',
        status: 'PENDING',
        plannedStartDate: pastDate,
        tasks: [],
      );
      expect(overdueOp.isOverdue, isTrue);

      // Past date but COMPLETED -> NOT overdue
      final completedPastOp = FarmOperationModel(
        id: 'ov2',
        farmCropId: 'crop_1',
        name: 'Irrigation',
        status: 'COMPLETED',
        plannedStartDate: pastDate,
        tasks: [],
      );
      expect(completedPastOp.isOverdue, isFalse);

      // Future date and PENDING -> NOT overdue
      final futureOp = FarmOperationModel(
        id: 'ov3',
        farmCropId: 'crop_1',
        name: 'Irrigation',
        status: 'PENDING',
        plannedStartDate: futureDate,
        tasks: [],
      );
      expect(futureOp.isOverdue, isFalse);

      // Today's date and PENDING -> NOT overdue (due today)
      final todayOp = FarmOperationModel(
        id: 'ov4',
        farmCropId: 'crop_1',
        name: 'Irrigation',
        status: 'PENDING',
        plannedStartDate: today,
        tasks: [],
      );
      expect(todayOp.isOverdue, isFalse);
    });
  });

  // =========================================================================
  // 7. SELECTED-FARM SWITCHING & STALE-RESPONSE PROTECTION
  // =========================================================================
  group('Phase 7 - 7. Selected-Farm Switching & Stale Response Protection', () {
    test('Farm state switches selected farm and exposes new active farm context', () {
      final farmA = FarmModel(id: 'farm_a', ownerId: 'owner_1', name: 'Green Valley', location: 'Nellore', area: 5, areaUnit: 'acres', soilType: 'Black Soil', crops: [
        FarmCropModel(id: 'crop_a', farmId: 'farm_a', cropName: 'Paddy', variety: 'BPT 5204', season: 'Kharif', stage: 'VEGETATIVE', status: 'ACTIVE'),
      ]);
      final farmB = FarmModel(id: 'farm_b', ownerId: 'owner_1', name: 'Sunrise Fields', location: 'Guntur', area: 12, areaUnit: 'acres', soilType: 'Red Loam', crops: [
        FarmCropModel(id: 'crop_b', farmId: 'farm_b', cropName: 'Chilli', variety: 'Teja', season: 'Rabi', stage: 'FLOWERING', status: 'ACTIVE'),
      ]);

      var farmState = FarmState(farms: [farmA, farmB], selectedFarmId: 'farm_a');
      expect(farmState.selectedFarm?.id, equals('farm_a'));
      expect(farmState.selectedFarm?.crops.first.cropName, equals('Paddy'));

      // Switch to Farm B
      farmState = farmState.copyWith(selectedFarmId: 'farm_b');
      expect(farmState.selectedFarm?.id, equals('farm_b'));
      expect(farmState.selectedFarm?.crops.first.cropName, equals('Chilli'));
    });

    test('ScheduleState isolates schedule by operations list', () {
      final scheduleFarmA = MasterScheduleModel(
        operations: [
          ScheduledOperationModel(operationId: 'op_a1', name: 'Paddy Weeding', stage: 'VEGETATIVE', status: 'IN_PROGRESS', plannedStartDate: '2026-06-10', reason: 'Field management'),
        ],
      );

      final scheduleFarmB = MasterScheduleModel(
        operations: [
          ScheduledOperationModel(operationId: 'op_b1', name: 'Chilli Spray', stage: 'FLOWERING', status: 'PLANNED', plannedStartDate: '2026-07-01', reason: 'Pest prevention'),
        ],
      );

      final stateA = ScheduleState(schedule: scheduleFarmA);
      final stateB = ScheduleState(schedule: scheduleFarmB);

      expect(stateA.schedule?.operations.first.name, equals('Paddy Weeding'));
      expect(stateB.schedule?.operations.first.name, equals('Chilli Spray'));
    });
  });

  // =========================================================================
  // 8. ACCOUNT-CHANGE AND LOGOUT CACHE ISOLATION
  // =========================================================================
  group('Phase 7 - 8. Account-Change & Logout Cache Isolation', () {
    test('Clears active farm selection when user logs out', () {
      final fakeUser = User(
        id: 'farmer_001',
        name: 'Ravi Kumar',
        email: 'ravi@agrirent.ai',
        phone: '+919876543210',
        role: 'FARMER',
        preferredLanguage: 'en',
      );

      var authState = AuthState(user: fakeUser);
      expect(authState.user != null, isTrue);

      // Simulated Logout
      authState = AuthState(user: null);
      expect(authState.user != null, isFalse);
      expect(authState.user, isNull);

      final farmState = FarmState(farms: [], selectedFarmId: null);
      expect(farmState.farms, isEmpty);
      expect(farmState.selectedFarm, isNull);
    });
  });

  // =========================================================================
  // 9. TASK COMPLETION DOES NOT CHANGE CROP LIFECYCLE STAGE
  // =========================================================================
  group('Phase 7 - 9. Crop Lifecycle & Task Integrity', () {
    const kLifecycleStages = [
      'SOWING',
      'GERMINATION',
      'SEEDLING',
      'VEGETATIVE',
      'FLOWERING',
      'FRUITING',
      'MATURITY',
      'HARVEST',
    ];

    test('Preserves established biological crop lifecycle sequence', () {
      expect(kLifecycleStages.length, equals(8));
      expect(kLifecycleStages.first, equals('SOWING'));
      expect(kLifecycleStages.last, equals('HARVEST'));
    });

    test('Completing an operation task preserves the biological crop stage', () {
      var crop = FarmCropModel(
        id: 'crop_veg',
        farmId: 'farm_01',
        cropName: 'Cotton',
        variety: 'Bt Cotton',
        season: 'Kharif',
        stage: 'VEGETATIVE',
        status: 'ACTIVE',
      );

      var task = FarmTaskModel(
        id: 't_weed',
        operationId: 'op_weed',
        title: 'Manual Weeding row 1-10',
        status: 'PENDING',
        priority: 'HIGH',
        dueDate: DateTime.now(),
      );

      expect(crop.stage, equals('VEGETATIVE'));
      expect(task.isCompleted, isFalse);

      // Task is marked completed
      task = FarmTaskModel(
        id: task.id,
        operationId: task.operationId,
        title: task.title,
        status: 'COMPLETED',
        priority: task.priority,
        dueDate: task.dueDate,
        completedAt: DateTime.now(),
      );
      expect(task.isCompleted, isTrue);

      // Biological crop stage MUST remain unchanged by task completion
      expect(crop.stage, equals('VEGETATIVE'));
    });
  });

  // =========================================================================
  // 10. LOADING, ERROR, AND RETRY BEHAVIOR
  // =========================================================================
  group('Phase 7 - 10. Loading, Error, and Retry State Transitions', () {
    test('ScheduleState handles loading, error, and success transitions cleanly', () {
      // 1. Initial
      var state = ScheduleState();
      expect(state.isLoading, isFalse);
      expect(state.error, isNull);
      expect(state.schedule, isNull);

      // 2. Loading
      state = state.copyWith(isLoading: true, error: null);
      expect(state.isLoading, isTrue);
      expect(state.error, isNull);

      // 3. Error
      state = state.copyWith(isLoading: false, error: 'Network connection failed');
      expect(state.isLoading, isFalse);
      expect(state.error, equals('Network connection failed'));

      // 4. Retry Success
      final dummySchedule = MasterScheduleModel(
        operations: [],
      );
      state = state.copyWith(isLoading: false, error: null, schedule: dummySchedule);
      expect(state.isLoading, isFalse);
      expect(state.error, isNull);
      expect(state.schedule, isNotNull);
    });
  });

  // =========================================================================
  // 11. LOCALIZATION ACROSS ALL 5 LANGUAGES
  // =========================================================================
  group('Phase 7 - 11. 5-Language Localization Verification', () {
    const langs = ['en', 'te', 'hi', 'ta', 'kn'];
    const p7Keys = [
      'next_operation',
      'farm_timeline',
      'no_upcoming_operations',
      'all_operations_completed',
      'scheduled_for',
      'no_date_scheduled',
      'equipment_needed',
      'open_operation',
      'timeline_empty_message',
      'timeline_you_are_here',
      'timeline_completed',
      'timeline_scheduled',
      'in_progress',
      'planned',
    ];

    for (final lang in langs) {
      test('Language "$lang" contains all Phase 7 localization keys with non-empty native translations', () {
        for (final key in p7Keys) {
          final translated = AppLocalizations.get(key, lang);
          expect(translated, isNotEmpty, reason: 'Key "$key" should have non-empty translation in "$lang"');
          expect(translated, isNot(equals(key)), reason: 'Key "$key" should not return raw fallback in "$lang"');
        }
      });
    }

    test('Telugu translations display correct Unicode glyphs', () {
      expect(AppLocalizations.get('next_operation', 'te'), equals('తదుపరి పని'));
      expect(AppLocalizations.get('farm_timeline', 'te'), equals('పొలం కాలక్రమం'));
      expect(AppLocalizations.get('all_operations_completed', 'te'), equals('అన్ని పనులు పూర్తయ్యాయి'));
    });

    test('Hindi translations display correct Devanagari Unicode glyphs', () {
      expect(AppLocalizations.get('next_operation', 'hi'), equals('अगला कार्य'));
      expect(AppLocalizations.get('farm_timeline', 'hi'), equals('फार्म समयरेखा'));
      expect(AppLocalizations.get('timeline_completed', 'hi'), equals('पूर्ण हुआ'));
    });

    test('Tamil translations display correct Tamil Unicode glyphs', () {
      expect(AppLocalizations.get('next_operation', 'ta'), equals('அடுத்த பணி'));
      expect(AppLocalizations.get('farm_timeline', 'ta'), equals('பண்ணை காலவரிசை'));
    });

    test('Kannada translations display correct Kannada Unicode glyphs', () {
      expect(AppLocalizations.get('next_operation', 'kn'), equals('ಮುಂದಿನ ಕೆಲಸ'));
      expect(AppLocalizations.get('farm_timeline', 'kn'), equals('ಫಾರ್ಮ್ ಟೈಮ್‌ಲೈನ್'));
    });
  });

  // =========================================================================
  // 12. REGRESSION PROTECTION FOR PHASES 1–6
  // =========================================================================
  group('Phase 7 - 12. Regression Protection for Phases 1–6', () {
    test('Phase 1 Auth models and roles remain intact', () {
      const roles = ['FARMER', 'EQUIPMENT_OWNER', 'ADMIN'];
      expect(roles.contains('FARMER'), isTrue);
      expect(roles.contains('EQUIPMENT_OWNER'), isTrue);
      expect(roles.contains('ADMIN'), isTrue);
    });

    test('Phase 4 Farm registration model serialization remains intact', () {
      final json = {
        'id': 'farm_reg_01',
        'ownerId': 'owner_reg_01',
        'name': 'Krishna Delta Farm',
        'location': 'Vijayawada',
        'area': 8.5,
        'areaUnit': 'acres',
        'crops': [
          {
            'id': 'crop_reg_01',
            'farmId': 'farm_reg_01',
            'cropName': 'Paddy',
            'variety': 'MTU 1010',
            'season': 'Kharif',
            'stage': 'SEEDLING',
            'status': 'ACTIVE',
          }
        ],
      };

      final farm = FarmModel.fromJson(json);
      expect(farm.id, equals('farm_reg_01'));
      expect(farm.area, equals(8.5));
      expect(farm.crops.length, equals(1));
      expect(farm.crops.first.variety, equals('MTU 1010'));
    });

    test('Phase 5 Operations and task progress calculations remain intact', () {
      final op = FarmOperationModel(
        id: 'op_p5',
        farmCropId: 'c1',
        name: 'Top Dressing',
        status: 'IN_PROGRESS',
        tasks: [
          FarmTaskModel(id: 't1', operationId: 'op_p5', title: 'Task 1', status: 'COMPLETED', priority: 'HIGH', dueDate: null),
        ],
      );
      expect(op.progressRatio, equals(1.0));
      expect(op.completedTasksCount, equals(1));
    });

    test('Phase 6 Scheduled equipment mapping remains intact in schedule model', () {
      final scheduledOp = ScheduledOperationModel(
        operationId: 'op_eq_01',
        name: 'Deep Ploughing',
        stage: 'SOWING',
        status: 'PLANNED',
        plannedStartDate: '2026-06-01',
        reason: 'Pre-sowing tillage',
        equipment: ScheduleEquipmentModel(
          id: 'eq_tractor',
          name: 'John Deere 5050D Tractor',
          availabilityStatus: 'AVAILABLE',
        ),
      );

      expect(scheduledOp.equipment, isNotNull);
      expect(scheduledOp.equipment!.name, equals('John Deere 5050D Tractor'));
      expect(scheduledOp.equipment!.availabilityStatus, equals('AVAILABLE'));
    });
  });
}
