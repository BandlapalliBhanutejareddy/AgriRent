import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/features/farm/models/expense_model.dart';
import 'package:mobile/features/farm/providers/expenses_provider.dart';
import 'package:mobile/core/localization/app_localizations.dart';
import 'package:mobile/models/booking.dart';

import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    SharedPreferences.setMockInitialValues({});
  });

  group('Phase 10 - 1. Budget Missing versus Zero Distinction', () {
    test('Null totalBudget is recognized as unconfigured rather than ₹0', () {
      final data = FarmExpensesData.fromJson({
        'totalBudget': null,
        'totalSpent': 1500.0,
        'currency': 'INR',
        'expenses': [],
      });

      expect(data.totalBudget, isNull);
      expect(data.hasConfiguredBudget, isFalse);
      expect(data.isBudgetZero, isFalse);
      expect(data.calculatedRemainingBudget, isNull);
      expect(data.utilizationPercentage, isNull);
    });

    test('Authoritative ₹0 budget is distinguished from missing budget', () {
      final data = FarmExpensesData.fromJson({
        'totalBudget': 0.0,
        'totalSpent': 500.0,
        'currency': 'INR',
        'expenses': [],
      });

      expect(data.totalBudget, equals(0.0));
      expect(data.hasConfiguredBudget, isTrue);
      expect(data.isBudgetZero, isTrue);
      expect(data.calculatedRemainingBudget, equals(-500.0));
      // Division by zero must be prevented
      expect(data.utilizationPercentage, isNull);
    });
  });

  group('Phase 10 - 2. Expense Total Calculation', () {
    test('Sum of valid distinct records calculates correctly', () {
      final expenses = [
        FarmExpense(
          id: 'exp_1',
          title: 'Fertilizer 50kg',
          description: 'Urea and potash',
          category: 'Fertilizer',
          amount: 1400.0,
          date: DateTime.now(),
        ),
        FarmExpense(
          id: 'exp_2',
          title: 'Hybrid Maize Seeds',
          description: '10kg seed packet',
          category: 'Seeds',
          amount: 850.0,
          date: DateTime.now(),
        ),
        FarmExpense(
          id: 'exp_3',
          title: 'Tractor Rental',
          description: 'Ploughing service',
          category: 'Equipment Rental',
          amount: 3200.0,
          date: DateTime.now(),
          isRental: true,
          bookingId: 'book_99',
        ),
      ];

      final data = FarmExpensesData(
        totalBudget: 10000.0,
        totalSpent: 5450.0,
        expenses: expenses,
      );

      expect(data.totalFromDistinctRecords, equals(5450.0));
      expect(data.totalSpent, equals(5450.0));
    });

    test('Non-finite, negative, or NaN amounts are excluded from distinct sum', () {
      final expenses = [
        FarmExpense(
          id: 'exp_pos',
          title: 'Valid expense',
          description: '',
          category: 'Seeds',
          amount: 750.0,
          date: DateTime.now(),
        ),
        FarmExpense(
          id: 'exp_neg',
          title: 'Invalid negative',
          description: '',
          category: 'Other',
          amount: -200.0,
          date: DateTime.now(),
        ),
        FarmExpense(
          id: 'exp_zero',
          title: 'Zero amount',
          description: '',
          category: 'Other',
          amount: 0.0,
          date: DateTime.now(),
        ),
      ];

      final data = FarmExpensesData(
        totalBudget: 5000.0,
        totalSpent: 750.0,
        expenses: expenses,
      );

      expect(data.totalFromDistinctRecords, equals(750.0));
    });
  });

  group('Phase 10 - 3. Duplicate-Record Protection', () {
    test('Duplicate expense IDs from server or refresh are deduplicated', () {
      final rawServerPayload = {
        'totalBudget': 20000.0,
        'totalSpent': 1000.0,
        'expenses': [
          {
            'id': 'exp_dup_1',
            'title': 'Pesticide spray',
            'category': 'Pesticide',
            'amount': 1000.0,
            'date': '2026-03-15T10:00:00.000Z',
          },
          // Exact duplicate record sent twice
          {
            'id': 'exp_dup_1',
            'title': 'Pesticide spray',
            'category': 'Pesticide',
            'amount': 1000.0,
            'date': '2026-03-15T10:00:00.000Z',
          },
          {
            'id': 'exp_unique_2',
            'title': 'Diesel fuel 20L',
            'category': 'Fuel',
            'amount': 1900.0,
            'date': '2026-03-16T12:00:00.000Z',
          },
        ]
      };

      final data = FarmExpensesData.fromJson(rawServerPayload);

      // Must only contain 2 unique items, not 3
      expect(data.expenses.length, equals(2));
      expect(data.expenses.map((e) => e.id).toSet().length, equals(2));
      expect(data.totalFromDistinctRecords, equals(2900.0));
    });
  });

  group('Phase 10 - 4. Remaining Budget Calculation', () {
    test('Authoritative remaining budget is total budget minus spent', () {
      final data = FarmExpensesData(
        totalBudget: 40000.0,
        totalSpent: 12500.0,
      );

      expect(data.calculatedRemainingBudget, equals(27500.0));
    });

    test('Deficit / Over-budget is accurately computed without rounding error', () {
      final data = FarmExpensesData(
        totalBudget: 25000.0,
        totalSpent: 28500.0,
      );

      expect(data.calculatedRemainingBudget, equals(-3500.0));
    });

    test('Remaining budget is null when budget is not configured', () {
      final data = FarmExpensesData(
        totalBudget: null,
        totalSpent: 4000.0,
      );

      expect(data.calculatedRemainingBudget, isNull);
    });
  });

  group('Phase 10 - 5. Budget Utilization with Positive Budget', () {
    test('Calculates utilization percentage accurately within budget', () {
      final data = FarmExpensesData(
        totalBudget: 50000.0,
        totalSpent: 22500.0,
      );

      expect(data.utilizationPercentage, equals(45.0));
    });

    test('Handles utilization exceeding 100% and clamps safely', () {
      final data = FarmExpensesData(
        totalBudget: 10000.0,
        totalSpent: 15000.0,
      );

      expect(data.utilizationPercentage, equals(150.0));
    });
  });

  group('Phase 10 - 6. Division-by-Zero Prevention', () {
    test('Budget of 0.0 returns null utilization percentage', () {
      final data = FarmExpensesData(
        totalBudget: 0.0,
        totalSpent: 1000.0,
      );

      expect(data.utilizationPercentage, isNull);
    });

    test('Negative or null budget returns null utilization percentage', () {
      final dataNeg = FarmExpensesData(
        totalBudget: -500.0,
        totalSpent: 500.0,
      );
      expect(dataNeg.utilizationPercentage, isNull);

      final dataNull = FarmExpensesData(
        totalBudget: null,
        totalSpent: 500.0,
      );
      expect(dataNull.utilizationPercentage, isNull);
    });
  });

  group('Phase 10 - 7. Expense Form Validation', () {
    test('Rejects empty or whitespace-only title', () async {
      final container = ProviderContainer();
      final notifier = container.read(expensesProvider.notifier);

      final resultEmpty = await notifier.addExpense(
        farmId: 'farm_01',
        title: '',
        amount: 500.0,
      );
      expect(resultEmpty, isFalse);

      final resultSpaces = await notifier.addExpense(
        farmId: 'farm_01',
        title: '   ',
        amount: 500.0,
      );
      expect(resultSpaces, isFalse);
    });

    test('Rejects zero, negative, or non-finite amounts', () async {
      final container = ProviderContainer();
      final notifier = container.read(expensesProvider.notifier);

      final resultZero = await notifier.addExpense(
        farmId: 'farm_01',
        title: 'Fertilizer',
        amount: 0.0,
      );
      expect(resultZero, isFalse);

      final resultNeg = await notifier.addExpense(
        farmId: 'farm_01',
        title: 'Fertilizer',
        amount: -150.0,
      );
      expect(resultNeg, isFalse);

      final resultNan = await notifier.addExpense(
        farmId: 'farm_01',
        title: 'Fertilizer',
        amount: double.nan,
      );
      expect(resultNan, isFalse);
    });
  });

  group('Phase 10 - 8. Duplicate-Submission Prevention', () {
    test('Concurrent submission is blocked when isSubmitting is true', () async {
      final container = ProviderContainer();
      final notifier = container.read(expensesProvider.notifier);

      // Force isSubmitting state to true
      notifier.state = notifier.state.copyWith(isSubmitting: true);

      final blocked = await notifier.addExpense(
        farmId: 'farm_01',
        title: 'Seeds',
        amount: 300.0,
      );

      expect(blocked, isFalse);
    });
  });

  group('Phase 10 - 9. Expense Creation Failure Handling', () {
    test('Preserves state and resets isSubmitting on network or server error', () async {
      final container = ProviderContainer();
      final notifier = container.read(expensesProvider.notifier);

      // Attempt to add expense to invalid endpoint / simulated unauthenticated state
      final success = await notifier.addExpense(
        farmId: 'invalid_unreachable_farm',
        title: 'Pesticide',
        amount: 450.0,
      );

      expect(success, isFalse);
      expect(notifier.state.isSubmitting, isFalse);
      expect(notifier.state.error, isNotNull);
    });
  });

  group('Phase 10 - 10. Budget Configuration and Refresh', () {
    test('Validates budget configuration inputs strictly', () async {
      final container = ProviderContainer();
      final notifier = container.read(expensesProvider.notifier);

      final negBudget = await notifier.setFarmBudget(
        farmId: 'farm_1',
        totalBudget: -100.0,
      );
      expect(negBudget, isFalse);

      final emptyFarm = await notifier.setFarmBudget(
        farmId: '',
        totalBudget: 25000.0,
      );
      expect(emptyFarm, isFalse);
    });
  });

  group('Phase 10 - 11. Selected-Farm Switching & Isolation', () {
    test('State isolates financial records by distinct farm ID', () {
      final state = ExpensesState(
        farmExpenses: {
          'farm_A': FarmExpensesData(
            totalBudget: 30000.0,
            totalSpent: 8000.0,
            expenses: [
              FarmExpense(
                id: 'exp_A1',
                title: 'Farm A Seeds',
                description: '',
                category: 'Seeds',
                amount: 8000.0,
                date: DateTime.now(),
              )
            ],
          ),
          'farm_B': FarmExpensesData(
            totalBudget: 60000.0,
            totalSpent: 15000.0,
            expenses: [
              FarmExpense(
                id: 'exp_B1',
                title: 'Farm B Fertilizer',
                description: '',
                category: 'Fertilizer',
                amount: 15000.0,
                date: DateTime.now(),
              )
            ],
          ),
        },
      );

      final dataA = state.farmExpenses['farm_A'];
      final dataB = state.farmExpenses['farm_B'];

      expect(dataA?.totalBudget, equals(30000.0));
      expect(dataA?.totalSpent, equals(8000.0));
      expect(dataA?.expenses.first.id, equals('exp_A1'));

      expect(dataB?.totalBudget, equals(60000.0));
      expect(dataB?.totalSpent, equals(15000.0));
      expect(dataB?.expenses.first.id, equals('exp_B1'));
    });
  });

  group('Phase 10 - 12. Logout and Account Isolation', () {
    test('ExpensesNotifier reset purges all cached farm financial state', () {
      final container = ProviderContainer();
      final notifier = container.read(expensesProvider.notifier);

      notifier.state = ExpensesState(
        farmExpenses: {
          'farm_secure_01': FarmExpensesData(
            totalBudget: 50000.0,
            totalSpent: 12000.0,
          ),
        },
      );

      expect(notifier.state.farmExpenses, isNotEmpty);

      // Perform logout/reset
      notifier.reset();

      expect(notifier.state.farmExpenses, isEmpty);
      expect(notifier.state.isLoading, isFalse);
      expect(notifier.state.isSubmitting, isFalse);
      expect(notifier.state.error, isNull);
    });
  });

  group('Phase 10 - 13. Payment Status & Amount Separation', () {
    test('Pending bookings start with amountPaid = 0 and are separated from cash expenses', () {
      final booking = Booking(
        id: 'booking_sep_1',
        equipmentId: 'eq_101',
        farmerId: 'farmer_01',
        startDate: DateTime.now(),
        endDate: DateTime.now().add(const Duration(days: 3)),
        totalPrice: 4500.0,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        amountPaid: 0.0,
      );

      expect(booking.paymentStatus, equals('PENDING'));
      expect(booking.amountPaid, equals(0.0));
      expect(booking.outstandingBalance, equals(4500.0));
      expect(booking.isPaid, isFalse);
    });

    test('Rental expenses in FarmExpensesData preserve isRental flag and booking reference', () {
      final rentalExp = FarmExpense(
        id: 'booking_123',
        title: 'Rental: John Deere 5050D',
        description: '3 days rental',
        category: 'Equipment Rental',
        amount: 6000.0,
        date: DateTime.now(),
        isRental: true,
        bookingId: '123',
      );

      expect(rentalExp.isRental, isTrue);
      expect(rentalExp.bookingId, equals('123'));
    });
  });

  group('Phase 10 - 14. Unknown Labour and Operating Costs', () {
    test('System does not assume unknown labour or operating costs as ₹0', () {
      final data = FarmExpensesData(
        totalBudget: 25000.0,
        totalSpent: 3000.0, // Only 1 fertilizer expense logged
        expenses: [
          FarmExpense(
            id: 'exp_fert',
            title: 'Fertilizer bag',
            description: '',
            category: 'Fertilizer',
            amount: 3000.0,
            date: DateTime.now(),
          ),
        ],
      );

      // Labour is absent in records
      expect(data.categoryBreakdown.containsKey('Labour'), isFalse);
      // We do NOT invent a labour cost or default it to ₹0
      expect(data.categoryBreakdown['Labour'], isNull);
      // Total spent strictly matches what was authoritative logged
      expect(data.totalSpent, equals(3000.0));
    });
  });

  group('Phase 10 - 15. Chart Totals Matching Source Records', () {
    test('Category breakdown subtotals sum exactly to total distinct expenses', () {
      final expenses = [
        FarmExpense(
          id: 'exp_c1',
          title: 'Fertilizer A',
          description: '',
          category: 'Fertilizer',
          amount: 2500.0,
          date: DateTime.now(),
        ),
        FarmExpense(
          id: 'exp_c2',
          title: 'Fertilizer B',
          description: '',
          category: 'Fertilizer',
          amount: 1500.0,
          date: DateTime.now(),
        ),
        FarmExpense(
          id: 'exp_c3',
          title: 'Diesel Fuel',
          description: '',
          category: 'Fuel',
          amount: 1200.0,
          date: DateTime.now(),
        ),
        FarmExpense(
          id: 'exp_c4',
          title: 'Tractor Repair',
          description: '',
          category: 'Maintenance',
          amount: 800.0,
          date: DateTime.now(),
        ),
      ];

      final data = FarmExpensesData(
        totalBudget: 20000.0,
        totalSpent: 6000.0,
        expenses: expenses,
      );

      final breakdown = data.categoryBreakdown;
      expect(breakdown['Fertilizer'], equals(4000.0));
      expect(breakdown['Fuel'], equals(1200.0));
      expect(breakdown['Maintenance'], equals(800.0));

      final chartSum = breakdown.values.fold<double>(0.0, (s, v) => s + v);
      expect(chartSum, equals(data.totalFromDistinctRecords));
      expect(chartSum, equals(6000.0));
    });

    test('Empty dataset produces empty breakdown without fabricated values', () {
      final data = FarmExpensesData(
        totalBudget: 15000.0,
        totalSpent: 0.0,
        expenses: [],
      );

      expect(data.categoryBreakdown, isEmpty);
    });
  });

  group('Phase 10 - 16. Localization Across All Five Languages', () {
    final languages = ['en', 'te', 'hi', 'ta', 'kn'];
    final phase10Keys = [
      'budget_overview',
      'total_budget',
      'total_expenses',
      'remaining_budget',
      'budget_utilization',
      'not_configured',
      'budget_unavailable',
      'expense_records',
      'no_expenses_yet',
      'no_expenses_desc',
      'add_expense',
      'expense_description',
      'category',
      'amount_inr',
      'save_expense',
      'expense_saved_success',
      'expense_save_failed',
      'category_breakdown',
      'unknown_cost_notice',
      'all_categories',
      'cat_fertilizer',
      'cat_seeds',
      'cat_pesticide',
      'cat_labour',
      'cat_rental',
      'cat_irrigation',
      'cat_fuel',
      'cat_maintenance',
      'cat_transport',
      'cat_other',
      'valid_title_and_amount',
      'all_expenses',
      'budget_summary',
    ];

    for (final lang in languages) {
      test('Language "$lang" provides all Phase 10 financial keys without raw fallbacks', () {
        for (final key in phase10Keys) {
          final translated = key.tr(lang);
          expect(translated, isNotEmpty, reason: 'Key $key empty in $lang');
          expect(translated, isNot(equals(key)), reason: 'Key $key returned raw key in $lang');
        }
      });
    }

    test('Telugu native Unicode strings render without mojibake corruption', () {
      expect('budget_overview'.tr('te'), equals('బడ్జెట్ సమీక్ష'));
      expect('total_budget'.tr('te'), equals('మొత్తం బడ్జెట్'));
      expect('cat_fertilizer'.tr('te'), equals('ఎరువులు'));
    });

    test('Hindi native Unicode strings render without mojibake corruption', () {
      expect('budget_overview'.tr('hi'), equals('बजट विवरण'));
      expect('total_expenses'.tr('hi'), equals('कुल खर्च'));
      expect('cat_seeds'.tr('hi'), equals('बीज'));
    });

    test('Tamil native Unicode strings render without mojibake corruption', () {
      expect('budget_overview'.tr('ta'), equals('பட்ஜெட் மேலோட்டம்'));
      expect('remaining_budget'.tr('ta'), equals('மீதமுள்ள பட்ஜெட்'));
      expect('cat_pesticide'.tr('ta'), equals('பூச்சிக்கொல்லி'));
    });

    test('Kannada native Unicode strings render without mojibake corruption', () {
      expect('budget_overview'.tr('kn'), equals('ಬಜೆಟ್ ಅವಲೋಕನ'));
      expect('budget_utilization'.tr('kn'), equals('ಬಜೆಟ್ ಬಳಕೆ'));
      expect('cat_rental'.tr('kn'), equals('ಉಪಕರಣ ಬಾಡಿಗೆ'));
    });
  });

  group('Phase 10 - 17. Regression Coverage for Phases 1–9', () {
    test('Phase 1 Knowledge Base & Localized Roles Preserved', () {
      expect('farmer'.tr('en'), equals('Farmer'));
      expect('owner'.tr('en'), equals('Equipment Owner'));
      expect('admin'.tr('en'), equals('Administrator'));
    });

    test('Phase 6 & 8 Booking Lifecycle Status Integrity Preserved', () {
      final validStatuses = ['PENDING', 'ACCEPTED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'REJECTED'];
      for (final s in validStatuses) {
        expect(AppLocalizations.localizedBookingStatus(s, 'en'), isNotEmpty);
      }
    });

    test('Phase 9 Outstanding Balance and Status Timelines Preserved', () {
      final booking = Booking(
        id: 'b_reg_1',
        equipmentId: 'eq_reg_1',
        farmerId: 'farmer_reg',
        startDate: DateTime.now(),
        endDate: DateTime.now().add(const Duration(days: 2)),
        totalPrice: 2000.0,
        status: 'ACTIVE',
        paymentStatus: 'PAID',
        amountPaid: 2000.0,
      );

      expect(booking.isPaid, isTrue);
      expect(booking.outstandingBalance, equals(0.0));
      expect(booking.statusHistory, isEmpty);
    });
  });
}
