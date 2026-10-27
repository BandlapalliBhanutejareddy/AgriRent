import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile/core/localization/app_localizations.dart';
import 'package:mobile/models/user.dart';
import 'package:mobile/features/profile/providers/owner_provider.dart';
import 'package:mobile/features/profile/repository/owner_analytics_repository.dart';
import 'package:mobile/features/profile/ui/owner_analytics_dashboard_screen.dart';
import 'package:mobile/features/auth/providers/auth_provider.dart';
import 'package:mobile/routing/router.dart';

class FakeAuthNotifier extends StateNotifier<AuthState> implements AuthNotifier {
  FakeAuthNotifier([AuthState? initial])
      : super(initial ??
            AuthState(
              user: User(
                id: 'owner-test-1',
                name: 'Ramesh Reddy',
                email: 'owner@example.com',
                role: 'OWNER',
                preferredLanguage: 'en',
              ),
            ));

  void updateState(AuthState next) => state = next;

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class MockOwnerAnalyticsRepository implements OwnerAnalyticsRepository {
  Map<String, dynamic> mockAnalyticsData = {};
  List<Map<String, dynamic>> mockPerformanceList = [];
  bool shouldThrow = false;
  String? lastPeriod;
  DateTime? lastStartDate;
  DateTime? lastEndDate;
  int fetchCalls = 0;

  @override
  Future<Map<String, dynamic>> fetchAnalytics({
    String? period,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    fetchCalls++;
    lastPeriod = period;
    lastStartDate = startDate;
    lastEndDate = endDate;
    if (shouldThrow) {
      throw Exception('Database query timeout or service unavailable');
    }
    return Map<String, dynamic>.from(mockAnalyticsData);
  }

  @override
  Future<List<Map<String, dynamic>>> fetchPerformanceMetrics({
    String? sortBy,
    String? order,
  }) async {
    if (shouldThrow) {
      throw Exception('Failed to fetch performance');
    }
    return List<Map<String, dynamic>>.from(mockPerformanceList);
  }
}

Map<String, dynamic> sampleAnalyticsPayload() {
  return {
    'totalListings': 4,
    'activeListings': 3,
    'inactiveListings': 1,
    'totalBookings': 12,
    'completedRentals': 8,
    'pendingRequests': 2,
    'statusBreakdown': {
      'PENDING': 2,
      'ACCEPTED': 1,
      'DISPATCHED': 0,
      'DELIVERED': 0,
      'ACTIVE': 1,
      'COMPLETED': 8,
      'CANCELLED': 0,
      'REJECTED': 0,
    },
    'financialMetrics': {
      'grossBookingValue': 48000.0,
      'realizedEarnings': 32000.0,
      'completedRevenue': 32000.0,
      'pendingPayout': 16000.0,
      'securityDepositsHeld': 10000.0,
      'inspectionDeductions': 1500.0,
      'currency': 'INR',
    },
    'utilizationMetrics': {
      'fleetUtilizationRate': 58.33,
      'totalEquipmentCount': 4,
      'activeEquipmentCount': 3,
      'daysInPeriod': 30,
      'totalFleetAvailableDays': 120,
      'totalDaysBooked': 70,
    },
    'bookingTrends': [
      {'date': '2026-10-01', 'bookings': 2, 'revenue': 8000.0},
      {'date': '2026-10-08', 'bookings': 4, 'revenue': 14000.0},
      {'date': '2026-10-15', 'bookings': 3, 'revenue': 10000.0},
    ],
    'equipmentPerformance': [
      {
        'id': 'eq-1',
        'title': 'John Deere 5050D Tractor',
        'category': 'Tractor',
        'bookings': 6,
        'revenue': 24000.0,
        'daysBooked': 36,
        'utilizationRate': 72.0,
        'rating': 4.8,
        'status': 'ACTIVE',
      },
      {
        'id': 'eq-2',
        'title': 'Mahindra Rotavator 6ft',
        'category': 'Implement',
        'bookings': 4,
        'revenue': 8000.0,
        'daysBooked': 20,
        'utilizationRate': 40.0,
        'rating': 4.5,
        'status': 'ACTIVE',
      },
    ],
    'period': '30d',
  };
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  SharedPreferences.setMockInitialValues({});

  group('Phase 17: OwnerAnalyticsState Data Parsing & Fallback Invariants', () {
    test('Correctly parses complete authoritative analytics payload', () {
      final payload = sampleAnalyticsPayload();
      final state = OwnerAnalyticsState(data: payload, isLoading: false);

      expect(state.totalListings, equals(4));
      expect(state.activeListings, equals(3));
      expect(state.inactiveListings, equals(1));
      expect(state.totalBookings, equals(12));
      expect(state.completedRentals, equals(8));
      expect(state.pendingRequests, equals(2));

      // Financial metrics
      expect(state.grossBookingValue, equals(48000.0));
      expect(state.realizedEarnings, equals(32000.0));
      expect(state.completedRevenue, equals(32000.0));
      expect(state.pendingPayout, equals(16000.0));
      expect(state.securityDepositsHeld, equals(10000.0));
      expect(state.inspectionDeductions, equals(1500.0));

      // Utilization metrics
      expect(state.fleetUtilizationRate, equals(58.33));
      expect(state.statusBreakdown['PENDING'], equals(2));
      expect(state.statusBreakdown['COMPLETED'], equals(8));

      // Trends and equipment performance
      expect(state.bookingTrends.length, equals(3));
      expect(state.bookingTrends[0]['revenue'], equals(8000.0));
      expect(state.equipmentPerformanceList.length, equals(2));
      expect(state.equipmentPerformanceList[0]['title'], equals('John Deere 5050D Tractor'));
      expect(state.equipmentPerformanceList[0]['revenue'], equals(24000.0));
    });

    test('Gracefully defaults empty or missing payload without crashing', () {
      final state = OwnerAnalyticsState(data: null, isLoading: false);

      expect(state.totalListings, equals(0));
      expect(state.activeListings, equals(0));
      expect(state.inactiveListings, equals(0));
      expect(state.totalBookings, equals(0));
      expect(state.completedRentals, equals(0));
      expect(state.pendingRequests, equals(0));
      expect(state.grossBookingValue, equals(0.0));
      expect(state.realizedEarnings, equals(0.0));
      expect(state.completedRevenue, equals(0.0));
      expect(state.pendingPayout, equals(0.0));
      expect(state.securityDepositsHeld, equals(0.0));
      expect(state.inspectionDeductions, equals(0.0));
      expect(state.fleetUtilizationRate, equals(0.0));
      expect(state.statusBreakdown, isEmpty);
      expect(state.bookingTrends, isEmpty);
      expect(state.equipmentPerformanceList, isEmpty);
    });

    test('Backward-compatible fallback to legacy keys when modern blocks are missing', () {
      final legacyPayload = {
        'totalEquipment': 5,
        'activeEquipment': 4,
        'inactiveEquipment': 1,
        'totalBookings': 10,
        'completedBookings': 6,
        'pendingBookings': 2,
        'totalEarnings': 25000.0,
        'pendingValue': 7000.0,
        'utilization': 65.5,
      };

      final state = OwnerAnalyticsState(data: legacyPayload, isLoading: false);
      expect(state.totalListings, equals(5));
      expect(state.activeListings, equals(4));
      expect(state.inactiveListings, equals(1));
      expect(state.totalBookings, equals(10));
      expect(state.completedRentals, equals(6));
      expect(state.pendingRequests, equals(2));
      expect(state.realizedEarnings, equals(25000.0));
      expect(state.pendingPayout, equals(7000.0));
      expect(state.fleetUtilizationRate, equals(65.5));
    });
  });

  group('Phase 17: OwnerAnalyticsNotifier State Management & Lifecycle', () {
    test('Initial fetch sets loading and updates state on success', () async {
      final mockRepo = MockOwnerAnalyticsRepository();
      mockRepo.mockAnalyticsData = sampleAnalyticsPayload();

      final container = ProviderContainer(
        overrides: [
          ownerAnalyticsRepositoryProvider.overrideWithValue(mockRepo),
        ],
      );

      final notifier = container.read(ownerAnalyticsProvider.notifier);
      expect(container.read(ownerAnalyticsProvider).isLoading, isFalse);

      final future = notifier.fetchAnalytics(period: '30d');
      expect(container.read(ownerAnalyticsProvider).isLoading, isTrue);

      await future;

      final finalState = container.read(ownerAnalyticsProvider);
      expect(finalState.isLoading, isFalse);
      expect(finalState.error, isNull);
      expect(finalState.totalBookings, equals(12));
      expect(finalState.realizedEarnings, equals(32000.0));
      expect(mockRepo.fetchCalls, equals(1));
      expect(mockRepo.lastPeriod, equals('30d'));
    });

    test('Fetch failure captures error message and marks isLoading false', () async {
      final mockRepo = MockOwnerAnalyticsRepository();
      mockRepo.shouldThrow = true;

      final container = ProviderContainer(
        overrides: [
          ownerAnalyticsRepositoryProvider.overrideWithValue(mockRepo),
        ],
      );

      final notifier = container.read(ownerAnalyticsProvider.notifier);
      await notifier.fetchAnalytics(period: '7d');

      final finalState = container.read(ownerAnalyticsProvider);
      expect(finalState.isLoading, isFalse);
      expect(finalState.error, contains('Database query timeout'));
    });

    test('Period switching updates selectedPeriod and triggers repository fetch', () async {
      final mockRepo = MockOwnerAnalyticsRepository();
      mockRepo.mockAnalyticsData = sampleAnalyticsPayload();

      final container = ProviderContainer(
        overrides: [
          ownerAnalyticsRepositoryProvider.overrideWithValue(mockRepo),
        ],
      );

      final notifier = container.read(ownerAnalyticsProvider.notifier);
      await notifier.fetchAnalytics(period: '90d');

      expect(container.read(ownerAnalyticsProvider).selectedPeriod, equals('90d'));
      expect(mockRepo.lastPeriod, equals('90d'));
    });
  });

  group('Phase 17: Multi-Language Localization Coverage (en, te, hi, ta, kn)', () {
    final languages = ['en', 'te', 'hi', 'ta', 'kn'];
    final phase17Keys = [
      'analytics_dashboard_title',
      'analytics_overview',
      'realized_earnings',
      'gross_booking_value',
      'pending_payout',
      'completed_rentals',
      'pending_requests',
      'fleet_utilization',
      'total_listings',
      'active_fleet',
      'inactive_fleet',
      'booking_trends',
      'equipment_performance',
      'status_breakdown',
      'period_7d',
      'period_30d',
      'period_90d',
      'period_this_month',
      'period_all',
      'security_deposits_held',
      'inspection_deductions',
      'revenue_payouts_note',
      'no_analytics_data',
      'no_equipment_performance',
      'no_booking_trends',
      'utilization_rate',
      'total_revenue',
      'bookings_count',
      'financial_breakdown',
      'fleet_health',
      'refresh_analytics',
      'analytics_error',
    ];

    for (final lang in languages) {
      test('Language "$lang" covers all Phase 17 localization keys', () {
        for (final key in phase17Keys) {
          final translated = key.tr(lang);
          expect(
            translated,
            isNot(equals(key)),
            reason: 'Key "$key" is missing translation for language "$lang"',
          );
          expect(
            translated.trim(),
            isNotEmpty,
            reason: 'Key "$key" is empty for language "$lang"',
          );
        }
      });
    }

    test('Indic translations do not contain corrupted mojibake characters', () {
      for (final lang in ['te', 'hi', 'ta', 'kn']) {
        final title = 'analytics_dashboard_title'.tr(lang);
        final earnings = 'realized_earnings'.tr(lang);
        final fleet = 'fleet_utilization'.tr(lang);

        expect(title.contains('??') || title.contains('Ã'), isFalse);
        expect(earnings.contains('??') || earnings.contains('Ã'), isFalse);
        expect(fleet.contains('??') || fleet.contains('Ã'), isFalse);
      }
    });
  });

  group('Phase 17: Security & Role-Based Navigation Guards', () {
    test('AppRouter prevents FARMER role from accessing /owner-analytics', () {
      expect(
        AppRouter.testRoleRedirect(userRole: 'FARMER', targetPath: '/owner-analytics'),
        equals('/farmer'),
      );
    });

    test('AppRouter prevents ENTREPRENEUR role from accessing /owner-analytics', () {
      expect(
        AppRouter.testRoleRedirect(userRole: 'ENTREPRENEUR', targetPath: '/owner-analytics'),
        equals('/farmer'),
      );
    });

    test('AppRouter permits OWNER role to access /owner-analytics', () {
      expect(
        AppRouter.testRoleRedirect(userRole: 'OWNER', targetPath: '/owner-analytics'),
        isNull,
      );
    });

    test('AppRouter permits BOTH role to access /owner-analytics', () {
      expect(
        AppRouter.testRoleRedirect(userRole: 'BOTH', targetPath: '/owner-analytics'),
        isNull,
      );
    });
  });

  group('Phase 17: UI Presentation & Interaction States', () {
    testWidgets('Renders KPI cards, financial metrics, and period selectors on success', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      final mockRepo = MockOwnerAnalyticsRepository();
      mockRepo.mockAnalyticsData = sampleAnalyticsPayload();

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            ownerAnalyticsRepositoryProvider.overrideWithValue(mockRepo),
            authProvider.overrideWith((ref) => FakeAuthNotifier()),
          ],
          child: const MaterialApp(
            home: OwnerAnalyticsDashboardScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Check AppBar and Title
      expect(find.text('Analytics & Performance'), findsWidgets);

      // Check Period Selector Chips
      expect(find.text('30 Days'), findsOneWidget);
      expect(find.text('7 Days'), findsOneWidget);
      expect(find.text('90 Days'), findsOneWidget);

      // Check Redesigned Section Headers
      expect(find.text('Section A: Overview'), findsOneWidget);
      expect(find.text('Section B: Earnings'), findsOneWidget);
      expect(find.text('Section C: Equipment Performance'), findsOneWidget);
      expect(find.text('Section D: Rental Activity'), findsOneWidget);

      // Check Equipment Items rendered
      expect(find.text('John Deere 5050D Tractor'), findsOneWidget);
      expect(find.text('Mahindra Rotavator 6ft'), findsOneWidget);
    });

    testWidgets('Renders empty state when no analytics data exists', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      final mockRepo = MockOwnerAnalyticsRepository();
      mockRepo.mockAnalyticsData = {
        'totalListings': 0,
        'activeListings': 0,
        'totalBookings': 0,
        'completedRentals': 0,
        'pendingRequests': 0,
        'bookingTrends': [],
        'equipmentPerformance': [],
      };

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            ownerAnalyticsRepositoryProvider.overrideWithValue(mockRepo),
            authProvider.overrideWith((ref) => FakeAuthNotifier()),
          ],
          child: const MaterialApp(
            home: OwnerAnalyticsDashboardScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Should render empty state card
      expect(find.text('No Analytics Data Available'), findsOneWidget);
      expect(find.text('View All Time Analytics'), findsOneWidget);
    });

    testWidgets('Renders error state with retry button on failure', (tester) async {
      final mockRepo = MockOwnerAnalyticsRepository();
      mockRepo.shouldThrow = true;

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            ownerAnalyticsRepositoryProvider.overrideWithValue(mockRepo),
            authProvider.overrideWith((ref) => FakeAuthNotifier()),
          ],
          child: const MaterialApp(
            home: OwnerAnalyticsDashboardScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Check Error message and Retry Button
      expect(find.text('Database query timeout or service unavailable'), findsOneWidget);
      expect(find.text('Retry'), findsOneWidget);

      // Test Retry interaction
      mockRepo.shouldThrow = false;
      mockRepo.mockAnalyticsData = sampleAnalyticsPayload();

      await tester.tap(find.text('Retry'));
      await tester.pumpAndSettle();

      // Should now render the successful metrics
      expect(find.text('₹32,000'), findsWidgets);
    });
  });
}
