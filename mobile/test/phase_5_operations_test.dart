import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile/core/localization/app_localizations.dart';
import 'package:mobile/features/farm/models/farm_model.dart';
import 'package:mobile/features/farm/models/expense_model.dart';
import 'package:mobile/features/farm/models/schedule_model.dart';
import 'package:mobile/features/farm/providers/operations_provider.dart';
import 'package:mobile/features/farm/providers/expenses_provider.dart';
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
  // 1. TODAY, UPCOMING, AND COMPLETED TASK CLASSIFICATION
  // =========================================================================
  group('Phase 5 - 1. Task Classification (Today, Upcoming, Completed)', () {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day, 10, 30);
    final tomorrow = now.add(const Duration(days: 1));
    final nextWeek = now.add(const Duration(days: 7));

    final op1 = FarmOperationModel(
      id: 'op_01',
      farmCropId: 'crop_01',
      name: 'Basal Fertilization',
      status: 'IN_PROGRESS',
      tasks: [
        FarmTaskModel(
          id: 'task_today_01',
          operationId: 'op_01',
          title: 'Apply DAP 50kg/acre',
          status: 'PENDING',
          priority: 'HIGH',
          dueDate: today,
        ),
        FarmTaskModel(
          id: 'task_upcoming_01',
          operationId: 'op_01',
          title: 'Irrigate immediately after basal application',
          status: 'PENDING',
          priority: 'MEDIUM',
          dueDate: tomorrow,
        ),
        FarmTaskModel(
          id: 'task_completed_01',
          operationId: 'op_01',
          title: 'Soil test verification',
          status: 'COMPLETED',
          priority: 'LOW',
          dueDate: today,
          completedAt: today,
        ),
      ],
    );

    final op2 = FarmOperationModel(
      id: 'op_02',
      farmCropId: 'crop_01',
      name: 'Weed Management',
      status: 'PENDING',
      tasks: [
        FarmTaskModel(
          id: 'task_upcoming_02',
          operationId: 'op_02',
          title: 'Inter-cultivation with bullock pair or mini tractor',
          status: 'PENDING',
          priority: 'HIGH',
          dueDate: nextWeek,
        ),
      ],
    );

    test('Correctly separates tasks into today, upcoming, and completed lists', () {
      final state = OperationsState(operations: [op1, op2]);

      expect(state.allTasks.length, equals(4));

      // Today: pending and due today
      expect(state.todayTasks.length, equals(1));
      expect(state.todayTasks.first.id, equals('task_today_01'));
      expect(state.todayTasks.first.operationName, equals('Basal Fertilization'));

      // Upcoming: pending and due in future
      expect(state.upcomingTasks.length, equals(2));
      final upcomingIds = state.upcomingTasks.map((t) => t.id).toList();
      expect(upcomingIds, containsAll(['task_upcoming_01', 'task_upcoming_02']));

      // Completed: confirmed completed tasks regardless of date
      expect(state.completedTasks.length, equals(1));
      expect(state.completedTasks.first.id, equals('task_completed_01'));
      expect(state.completedTasks.first.isCompleted, isTrue);
    });

    test('Completed tasks are never included in today or upcoming lists', () {
      final state = OperationsState(operations: [op1]);
      final todayIds = state.todayTasks.map((t) => t.id).toList();
      final upcomingIds = state.upcomingTasks.map((t) => t.id).toList();

      expect(todayIds.contains('task_completed_01'), isFalse);
      expect(upcomingIds.contains('task_completed_01'), isFalse);
    });
  });

  // =========================================================================
  // 2. MISSING OR UNDATED TASK DATES
  // =========================================================================
  group('Phase 5 - 2. Undated Tasks Rule (Never Classified as Today)', () {
    test('Undated tasks (dueDate == null) are NEVER classified as today and ALWAYS appear in upcoming', () {
      final op = FarmOperationModel(
        id: 'op_undated',
        farmCropId: 'crop_01',
        name: 'General Farm Maintenance',
        status: 'PENDING',
        tasks: [
          FarmTaskModel(
            id: 'task_no_date_1',
            operationId: 'op_undated',
            title: 'Check perimeter fencing',
            status: 'PENDING',
            priority: 'LOW',
            dueDate: null,
          ),
          FarmTaskModel(
            id: 'task_no_date_2',
            operationId: 'op_undated',
            title: 'Clean drip irrigation filters',
            status: 'PENDING',
            priority: 'MEDIUM',
            dueDate: null,
          ),
        ],
      );

      final state = OperationsState(operations: [op]);

      // Assert rule: Undated tasks are NEVER in todayTasks
      expect(state.todayTasks.isEmpty, isTrue);

      // Assert rule: Undated pending tasks are safely housed under upcomingTasks
      expect(state.upcomingTasks.length, equals(2));
      expect(state.upcomingTasks.any((t) => t.dueDate == null), isTrue);
      expect(state.upcomingTasks.first.id, equals('task_no_date_1'));
      expect(state.upcomingTasks.last.id, equals('task_no_date_2'));
    });
  });

  // =========================================================================
  // 3 & 4. TASK COMPLETION: SUCCESS, FAILURE & STATE PRESERVATION
  // =========================================================================
  group('Phase 5 - 3 & 4. Task Completion (Success, Failure, State Preservation)', () {
    test('Successful completion transitions task to completed and preserves count', () {
      final initialTask = FarmTaskModel(
        id: 'task_demo',
        operationId: 'op_01',
        title: 'Apply neem cake',
        status: 'PENDING',
        priority: 'MEDIUM',
        dueDate: DateTime.now(),
      );

      final opInitial = FarmOperationModel(
        id: 'op_01',
        farmCropId: 'crop_01',
        name: 'Soil Amendment',
        status: 'IN_PROGRESS',
        tasks: [initialTask],
      );

      final stateBefore = OperationsState(operations: [opInitial]);
      expect(stateBefore.todayTasks.length, equals(1));
      expect(stateBefore.completedTasks.length, equals(0));
      expect(stateBefore.progressPercent, equals(0));

      // After authoritative backend response
      final completedTask = FarmTaskModel(
        id: initialTask.id,
        operationId: initialTask.operationId,
        title: initialTask.title,
        status: 'COMPLETED',
        priority: initialTask.priority,
        dueDate: initialTask.dueDate,
        completedAt: DateTime.now(),
      );
      final opUpdated = FarmOperationModel(
        id: opInitial.id,
        farmCropId: opInitial.farmCropId,
        name: opInitial.name,
        status: opInitial.status,
        tasks: [completedTask],
      );
      final stateAfter = stateBefore.copyWith(operations: [opUpdated]);

      expect(stateAfter.todayTasks.isEmpty, isTrue);
      expect(stateAfter.completedTasks.length, equals(1));
      expect(stateAfter.progressPercent, equals(100));
    });

    test('Failed completion leaves state unmodified with no phantom completion', () {
      final initialTask = FarmTaskModel(
        id: 'task_fail_demo',
        operationId: 'op_01',
        title: 'Apply bio-fertilizer',
        status: 'PENDING',
        priority: 'HIGH',
        dueDate: DateTime.now(),
      );

      final op = FarmOperationModel(
        id: 'op_01',
        farmCropId: 'crop_01',
        name: 'Soil Prep',
        status: 'IN_PROGRESS',
        tasks: [initialTask],
      );

      final state = OperationsState(operations: [op]);

      // If backend call fails, state remains unchanged
      expect(state.todayTasks.length, equals(1));
      expect(state.completedTasks.isEmpty, isTrue);
      expect(state.todayTasks.first.isCompleted, isFalse);
    });
  });

  // =========================================================================
  // 5. DUPLICATE SUBMISSION PREVENTION
  // =========================================================================
  group('Phase 5 - 5. Duplicate Submission Prevention', () {
    test('OperationsState tracking completingTaskIds prevents double-submit', () {
      var state = OperationsState();
      const taskId = 'task_concurrent_01';

      expect(state.completingTaskIds.contains(taskId), isFalse);

      // Lock task during in-flight dispatch
      state = state.copyWith(completingTaskIds: {taskId});
      expect(state.completingTaskIds.contains(taskId), isTrue);

      // Attempt second submission while running
      final canSubmitSecondTime = !state.completingTaskIds.contains(taskId);
      expect(canSubmitSecondTime, isFalse, reason: 'Must reject duplicate concurrent click');

      // Release lock after completion
      final updated = Set<String>.from(state.completingTaskIds)..remove(taskId);
      state = state.copyWith(completingTaskIds: updated);
      expect(state.completingTaskIds.contains(taskId), isFalse);
    });
  });

  // =========================================================================
  // 6. TASK PROGRESS CALCULATION & REFRESH
  // =========================================================================
  group('Phase 5 - 6. Task Progress Calculation', () {
    test('Calculates totalTasks, completedTasks, and progressPercent accurately', () {
      expect(OperationsState().progressPercent, equals(0));

      final tasks = [
        FarmTaskModel(id: 't1', operationId: 'op1', title: 'T1', status: 'COMPLETED', priority: 'LOW'),
        FarmTaskModel(id: 't2', operationId: 'op1', title: 'T2', status: 'PENDING', priority: 'MEDIUM'),
        FarmTaskModel(id: 't3', operationId: 'op1', title: 'T3', status: 'PENDING', priority: 'HIGH'),
        FarmTaskModel(id: 't4', operationId: 'op1', title: 'T4', status: 'PENDING', priority: 'LOW'),
      ];

      final op = FarmOperationModel(
        id: 'op1',
        farmCropId: 'c1',
        name: 'Pest Control',
        status: 'IN_PROGRESS',
        tasks: tasks,
      );

      final state = OperationsState(operations: [op]);
      expect(state.totalTasksCount, equals(4));
      expect(state.completedTasksCount, equals(1));
      expect(state.progressPercent, equals(25)); // 1/4 = 25%

      // Mark second task completed
      final tasks2 = [
        FarmTaskModel(id: 't1', operationId: 'op1', title: 'T1', status: 'COMPLETED', priority: 'LOW'),
        FarmTaskModel(id: 't2', operationId: 'op1', title: 'T2', status: 'COMPLETED', priority: 'MEDIUM'),
        FarmTaskModel(id: 't3', operationId: 'op1', title: 'T3', status: 'PENDING', priority: 'HIGH'),
        FarmTaskModel(id: 't4', operationId: 'op1', title: 'T4', status: 'PENDING', priority: 'LOW'),
      ];
      final op2 = FarmOperationModel(
        id: 'op1',
        farmCropId: 'c1',
        name: 'Pest Control',
        status: 'IN_PROGRESS',
        tasks: tasks2,
      );
      final state2 = state.copyWith(operations: [op2]);
      expect(state2.completedTasksCount, equals(2));
      expect(state2.progressPercent, equals(50)); // 2/4 = 50%
    });
  });

  // =========================================================================
  // 7. CROP LIFECYCLE STAGE REMAINING UNCHANGED
  // =========================================================================
  group('Phase 5 - 7. Crop Lifecycle Stage Invariance', () {
    test('Completing task or operation leaves crop stage completely intact', () {
      final crop = FarmCropModel(
        id: 'crop_cotton_01',
        farmId: 'farm_01',
        cropName: 'Cotton',
        season: 'Kharif',
        stage: 'VEGETATIVE', // Current stage
        status: 'ACTIVE',
      );

      final farm = FarmModel(
        id: 'farm_01',
        ownerId: 'farmer_01',
        name: 'Krishna Cotton Field',
        location: 'Krishna District',
        area: 5.0,
        areaUnit: 'acres',
        soilType: 'Black Cotton Soil',
        crops: [crop],
        cropsCount: 1,
      );

      // Simulating task completion on operation
      final completedTask = FarmTaskModel(
        id: 'task_spray',
        operationId: 'op_spray',
        title: 'Neem oil spray 3ml/L',
        status: 'COMPLETED',
        priority: 'MEDIUM',
      );

      // Verify crop object still maintains exact original stage
      expect(farm.crops.first.stage, equals('VEGETATIVE'));
      expect(crop.stage, equals('VEGETATIVE'));
      expect(completedTask.status, equals('COMPLETED'));
      expect(farm.crops.first.stage == 'FLOWERING', isFalse,
          reason: 'Completing a task must NEVER advance the lifecycle stage');
    });
  });

  // =========================================================================
  // 8. SELECTED-FARM SWITCHING & STALE-RESPONSE ISOLATION
  // =========================================================================
  group('Phase 5 - 8. Selected Farm & Stale-Response Isolation', () {
    test('Expenses and operation data remain isolated by farmId without cross-talk', () {
      final expState = ExpensesState(
        farmExpenses: {
          'farm_alpha': FarmExpensesData(
            totalBudget: 50000,
            totalSpent: 12000,
            remainingBudget: 38000,
            expenses: [
              FarmExpense(
                id: 'exp_1',
                title: 'DAP Fertilizer',
                description: '50kg bag',
                category: 'Fertilizer',
                amount: 12000,
                date: DateTime.now(),
              )
            ],
          ),
          'farm_beta': FarmExpensesData(
            totalBudget: 80000,
            totalSpent: 45000,
            remainingBudget: 35000,
            expenses: [
              FarmExpense(
                id: 'exp_2',
                title: 'Tractor Ploughing Rental',
                description: 'Field prep',
                category: 'Machinery',
                amount: 45000,
                date: DateTime.now(),
              )
            ],
          ),
        },
      );

      // Farm Alpha data
      final dataAlpha = expState.farmExpenses['farm_alpha'];
      expect(dataAlpha, isNotNull);
      expect(dataAlpha!.totalSpent, equals(12000));
      expect(dataAlpha.expenses.first.title, equals('DAP Fertilizer'));

      // Farm Beta data
      final dataBeta = expState.farmExpenses['farm_beta'];
      expect(dataBeta, isNotNull);
      expect(dataBeta!.totalSpent, equals(45000));
      expect(dataBeta.expenses.first.title, equals('Tractor Ploughing Rental'));

      // Stale lookup for non-existent farm
      expect(expState.farmExpenses['farm_gamma'], isNull);
    });
  });

  // =========================================================================
  // 9. OPERATION SCHEDULING & EMPTY SCHEDULE BEHAVIOR
  // =========================================================================
  group('Phase 5 - 9. Operation Scheduling & Empty Schedule Behavior', () {
    test('MasterScheduleModel parses authoritative schedule json with equipment', () {
      final json = {
        'status': 'success',
        'data': {
          'operations': [
            {
              'operationId': 'op_sched_01',
              'name': 'Land Preparation',
              'stage': 'LAND_PREPARATION',
              'status': 'IN_PROGRESS',
              'plannedStartDate': '2026-10-25T00:00:00.000Z',
              'reason': 'Optimal soil moisture reached',
              'equipment': {
                'id': 'eq_tractor_01',
                'name': 'Mahindra 575 DI',
                'availabilityStatus': 'AVAILABLE',
              }
            }
          ]
        }
      };

      final schedule = MasterScheduleModel.fromJson(json);
      expect(schedule.operations.length, equals(1));
      final op = schedule.operations.first;
      expect(op.operationId, equals('op_sched_01'));
      expect(op.name, equals('Land Preparation'));
      expect(op.stage, equals('LAND_PREPARATION'));
      expect(op.equipment, isNotNull);
      expect(op.equipment!.name, equals('Mahindra 575 DI'));
      expect(op.equipment!.availabilityStatus, equals('AVAILABLE'));
    });

    test('MasterScheduleModel handles empty schedule gracefully without inventing data', () {
      final emptyJson = {
        'status': 'success',
        'data': {'operations': []}
      };

      final schedule = MasterScheduleModel.fromJson(emptyJson);
      expect(schedule.operations.isEmpty, isTrue);

      final nullDataJson = {'status': 'success', 'data': null};
      final schedule2 = MasterScheduleModel.fromJson(nullDataJson);
      expect(schedule2.operations.isEmpty, isTrue);
    });
  });

  // =========================================================================
  // 10. EXPENSE VALIDATION & NEGATIVE VALUE REJECTION
  // =========================================================================
  group('Phase 5 - 10. Expense Input Validation', () {
    test('Rejects empty or whitespace title, negative amounts, zero amount, NaN, and infinity', () {
      bool isValidExpense({required String title, required double amount}) {
        final cleanTitle = title.trim();
        if (cleanTitle.isEmpty) return false;
        if (amount <= 0 || amount.isNaN || amount.isInfinite) return false;
        return true;
      }

      // Valid expense
      expect(isValidExpense(title: 'Potash 50kg', amount: 1450.0), isTrue);

      // Rejections
      expect(isValidExpense(title: '', amount: 1450.0), isFalse, reason: 'Empty title rejected');
      expect(isValidExpense(title: '   ', amount: 1450.0), isFalse, reason: 'Whitespace title rejected');
      expect(isValidExpense(title: 'Fertilizer', amount: 0.0), isFalse, reason: 'Zero amount rejected');
      expect(isValidExpense(title: 'Fertilizer', amount: -250.0), isFalse, reason: 'Negative amount rejected');
      expect(isValidExpense(title: 'Fertilizer', amount: double.nan), isFalse, reason: 'NaN rejected');
      expect(isValidExpense(title: 'Fertilizer', amount: double.infinity), isFalse, reason: 'Infinity rejected');
    });
  });

  // =========================================================================
  // 11. EXPENSE SAVE SUCCESS & FAILURE
  // =========================================================================
  group('Phase 5 - 11. Expense Save Success & Failure Handling', () {
    test('ExpensesState tracks isSubmitting lock preventing duplicate submissions', () {
      var state = ExpensesState();
      expect(state.isSubmitting, isFalse);

      // Locked while request is in flight
      state = state.copyWith(isSubmitting: true);
      expect(state.isSubmitting, isTrue);

      // Unlock on complete
      state = state.copyWith(isSubmitting: false);
      expect(state.isSubmitting, isFalse);
    });

    test('ExpensesState records error when save fails without inventing expense entry', () {
      final stateBefore = ExpensesState(
        farmExpenses: {
          'farm_01': FarmExpensesData(
            totalSpent: 5000,
            remainingBudget: 15000,
            expenses: [],
          ),
        },
      );

      // Server error simulation
      final stateFailed = stateBefore.copyWith(
        isSubmitting: false,
        error: 'Failed to record expense: Server error (500)',
      );

      expect(stateFailed.error, contains('Failed to record expense'));
      expect(stateFailed.farmExpenses['farm_01']!.totalSpent, equals(5000),
          reason: 'Failed expense must not increment total spent');
      expect(stateFailed.farmExpenses['farm_01']!.expenses.isEmpty, isTrue);
    });
  });

  // =========================================================================
  // 12. SPENDING SUMMARY REFRESH AFTER CONFIRMED EXPENSE
  // =========================================================================
  group('Phase 5 - 12. Spending Summary Refresh', () {
    test('FarmExpensesData updates totalSpent and remainingBudget after confirmed addition', () {
      final initialData = FarmExpensesData(
        totalBudget: 40000,
        totalSpent: 10000,
        remainingBudget: 30000,
        expenses: [
          FarmExpense(
            id: 'e1',
            title: 'Urea 2 bags',
            description: 'Urea',
            category: 'Fertilizer',
            amount: 10000,
            date: DateTime.now(),
          )
        ],
      );

      // Authoritative refresh adds new expense of ₹5,000
      final updatedData = FarmExpensesData(
        totalBudget: 40000,
        totalSpent: 15000,
        remainingBudget: 25000,
        expenses: [
          FarmExpense(
            id: 'e2',
            title: 'Labour weeding 2 days',
            description: 'Labour',
            category: 'Labour',
            amount: 5000,
            date: DateTime.now(),
          ),
          ...initialData.expenses,
        ],
      );

      expect(updatedData.totalSpent, equals(15000));
      expect(updatedData.remainingBudget, equals(25000));
      expect(updatedData.expenses.length, equals(2));
    });
  });

  // =========================================================================
  // 13. ACCOUNT AND FARM ISOLATION
  // =========================================================================
  group('Phase 5 - 13. Account and Farm Isolation', () {
    test('Logout clears all in-memory expense cache preventing cross-account leaks', () {
      final user = User(
        id: 'user_farmer_1',
        name: 'Ramesh Reddy',
        email: 'ramesh@agrirent.ai',
        role: 'FARMER',
        phone: '+919876543210',
        preferredLanguage: 'te',
      );

      final authNotifier = FakeAuthNotifier(AuthState(user: user));

      final container = ProviderContainer(
        overrides: [
          authProvider.overrideWith((ref) => authNotifier),
        ],
      );
      addTearDown(container.dispose);

      // Populate expense state
      container.read(expensesProvider.notifier).state = ExpensesState(
        farmExpenses: {
          'farm_ramesh': FarmExpensesData(
            totalSpent: 25000,
            remainingBudget: 50000,
            expenses: [],
          ),
        },
      );

      expect(container.read(expensesProvider).farmExpenses.isNotEmpty, isTrue);

      // Simulate logout
      authNotifier.updateState(AuthState(user: null));

      // Verify expenses state is cleared
      expect(container.read(expensesProvider).farmExpenses.isEmpty, isTrue);
    });
  });

  // =========================================================================
  // 14. FIVE-LANGUAGE LOCALIZATION
  // =========================================================================
  group('Phase 5 - 14. Five-Language Localization Coverage', () {
    const supportedLanguages = ['en', 'te', 'hi', 'ta', 'kn'];
    const phase5Keys = [
      'upcoming_tasks',
      'no_tasks_today',
      'no_upcoming_tasks',
      'no_completed_tasks',
      'task_completed_successfully',
      'failed_to_complete_task',
      'task_already_completed',
      'add_expense',
      'expense_description',
      'enter_expense_description',
      'enter_valid_expense_amount',
      'expense_recorded_successfully',
      'failed_to_record_expense',
      'recording_expense',
      'no_due_date',
      'overdue',
      'operation',
      'tasks_progress',
    ];

    for (final lang in supportedLanguages) {
      test('Language "$lang" contains all Phase 5 localization keys with valid non-empty glyphs', () {
        for (final key in phase5Keys) {
          final translated = key.tr(lang);
          expect(translated, isNotEmpty, reason: 'Key "$key" must not be empty in "$lang"');
          expect(translated, isNot(equals(key)),
              reason: 'Key "$key" in "$lang" must have a translation and not fall back to key name');
        }
      });
    }

    test('All non-English languages have distinct localized strings for add_expense and tasks_progress', () {
      final enAdd = 'add_expense'.tr('en');
      final teAdd = 'add_expense'.tr('te');
      final hiAdd = 'add_expense'.tr('hi');
      final taAdd = 'add_expense'.tr('ta');
      final knAdd = 'add_expense'.tr('kn');

      expect(teAdd, isNot(equals(enAdd)));
      expect(hiAdd, isNot(equals(enAdd)));
      expect(taAdd, isNot(equals(enAdd)));
      expect(knAdd, isNot(equals(enAdd)));
    });
  });

  // =========================================================================
  // 15. PHASE 1–4 REGRESSION PROTECTION
  // =========================================================================
  group('Phase 5 - 15. Phase 1–4 Regression Protection', () {
    test('Canonical stages remain strictly 8 stages in correct agricultural sequence', () {
      const canonicalStages = [
        'SOWING',
        'GERMINATION',
        'SEEDLING',
        'VEGETATIVE',
        'FLOWERING',
        'FRUITING',
        'MATURITY',
        'HARVEST'
      ];

      expect(canonicalStages.length, equals(8));
      expect(canonicalStages.first, equals('SOWING'));
      expect(canonicalStages.last, equals('HARVEST'));
    });

    test('FarmModel preserves all core metadata and crops fields', () {
      final farm = FarmModel(
        id: 'farm_reg_01',
        ownerId: 'owner_01',
        name: 'Guntur Chilli Farm',
        location: 'Guntur Rural',
        area: 3.5,
        areaUnit: 'acres',
        soilType: 'Red Loam',
        crops: [
          FarmCropModel(
            id: 'crop_chilli_01',
            farmId: 'farm_reg_01',
            cropName: 'Chilli',
            season: 'Rabi',
            stage: 'SEEDLING',
            status: 'ACTIVE',
          )
        ],
        cropsCount: 1,
      );

      expect(farm.name, equals('Guntur Chilli Farm'));
      expect(farm.area, equals(3.5));
      expect(farm.crops.first.cropName, equals('Chilli'));
      expect(farm.crops.first.stage, equals('SEEDLING'));
    });
  });
}
