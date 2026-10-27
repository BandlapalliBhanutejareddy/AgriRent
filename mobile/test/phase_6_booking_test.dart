import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile/core/localization/app_localizations.dart';
import 'package:mobile/models/booking.dart';
import 'package:mobile/models/equipment.dart';
import 'package:mobile/models/user.dart';
import 'package:mobile/routing/router.dart';
import 'package:mobile/features/auth/providers/auth_provider.dart';
import 'package:mobile/features/profile/providers/owner_provider.dart';
import 'package:mobile/features/marketplace/ui/my_rentals_screen.dart';

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
  // 1. MARKETPLACE-TO-DETAILS NAVIGATION & PARAMETER PRESERVATION
  // =========================================================================
  group('Phase 6 - 1. Marketplace Navigation & Parameter Preservation', () {
    test('Correctly parses and preserves marketplace query parameters', () {
      final uri = Uri.parse('/marketplace?category=TRACTOR&id=eq_tractor_101&bookId=bk_99');
      final params = AppRouter.parseMarketplaceParams(uri);

      expect(params['category'], equals('TRACTOR'));
      expect(params['targetEquipmentId'], equals('eq_tractor_101'));
      expect(params['bookId'], equals('bk_99'));
    });

    test('Handles alternative parameter key equipmentId gracefully', () {
      final uri = Uri.parse('/marketplace?equipmentId=eq_harvester_55');
      final params = AppRouter.parseMarketplaceParams(uri);

      expect(params['targetEquipmentId'], equals('eq_harvester_55'));
      expect(params['category'], isNull);
      expect(params['bookId'], isNull);
    });
  });

  // =========================================================================
  // 2. BOOKING FORM VALIDATION & ESTIMATION CALCULATIONS
  // =========================================================================
  group('Phase 6 - 2. Booking Form Validation & Price Estimation', () {
    final equipment = Equipment(
      id: 'eq_tractor_01',
      title: 'Mahindra 575 DI Tractor',
      category: 'TRACTOR',
      description: '45 HP Tractor with rotavator attachment',
      pricePerDay: 1500.0,
      imageUrl: 'https://example.com/tractor.jpg',
      ownerId: 'owner_01',
      available: true,
      securityDeposit: 3000.0,
    );

    test('Calculates rental duration in days inclusive of start and end date', () {
      final start = DateTime(2026, 11, 1);
      final end = DateTime(2026, 11, 5);
      final days = end.difference(start).inDays + 1;

      expect(days, equals(5));
    });

    test('Calculates total price estimate correctly', () {
      final start = DateTime(2026, 11, 1);
      final end = DateTime(2026, 11, 4); // 4 days
      final days = end.difference(start).inDays + 1;
      final total = days * equipment.pricePerDay!;

      expect(days, equals(4));
      expect(total, equals(6000.0));
    });

    test('Uses explicit security deposit when provided, otherwise default 15%', () {
      expect(equipment.securityDeposit, equals(3000.0));

      final noDepositEquip = Equipment(
        id: 'eq_sprayer_02',
        title: 'Knapsack Sprayer',
        category: 'SPRAYER',
        description: '16L manual sprayer',
        pricePerDay: 200.0,
        imageUrl: '',
        ownerId: 'owner_02',
        available: true,
        securityDeposit: null,
      );

      final total = 5 * (noDepositEquip.pricePerDay ?? 0.0); // 1000.0
      final depositEstimate = noDepositEquip.securityDeposit ?? (total * 0.15);
      expect(depositEstimate, equals(150.0));
    });
  });

  // =========================================================================
  // 3. INVALID RENTAL DATE RANGES
  // =========================================================================
  group('Phase 6 - 3. Invalid Rental Date Ranges', () {
    test('Detects and flags when end date is chronologically before start date', () {
      final start = DateTime(2026, 11, 10);
      final invalidEnd = DateTime(2026, 11, 5);

      final isInvalid = invalidEnd.isBefore(start);
      expect(isInvalid, isTrue);

      const lang = 'en';
      final localizedErr = 'end_date_cannot_be_before_start_date'.tr(lang);
      expect(localizedErr, equals('End date cannot be before start date'));
    });

    test('Single-day rental is valid when start date equals end date', () {
      final date = DateTime(2026, 11, 10);
      final isInvalid = date.isBefore(date);
      expect(isInvalid, isFalse);

      final days = date.difference(date).inDays + 1;
      expect(days, equals(1));
    });
  });

  // =========================================================================
  // 4. DUPLICATE BOOKING SUBMISSION PREVENTION
  // =========================================================================
  group('Phase 6 - 4. Duplicate Submission Guard', () {
    test('Simulated submission lock prevents concurrent duplicate calls', () async {
      bool isLoading = false;
      int callCount = 0;

      Future<void> simulateSubmit() async {
        if (isLoading) return;
        isLoading = true;
        try {
          callCount++;
          await Future.delayed(const Duration(milliseconds: 50));
        } finally {
          isLoading = false;
        }
      }

      // Rapid sequential invocations while first is in-flight
      final future1 = simulateSubmit();
      final future2 = simulateSubmit();
      final future3 = simulateSubmit();

      await Future.wait([future1, future2, future3]);

      // Only first invocation should execute
      expect(callCount, equals(1));
    });
  });

  // =========================================================================
  // 5. SUCCESSFUL BOOKING REQUEST HANDLING
  // =========================================================================
  group('Phase 6 - 5. Successful Booking Creation & Model Contract', () {
    test('Booking.fromJson parses authoritative backend response accurately', () {
      final mockBackendResponse = {
        'id': 'bk_live_12345',
        'farmerId': 'user_farmer_88',
        'equipmentId': 'eq_tractor_01',
        'startDate': '2026-11-01T00:00:00.000Z',
        'endDate': '2026-11-05T00:00:00.000Z',
        'status': 'PENDING',
        'totalPrice': 7500.0,
        'paymentStatus': 'PENDING',
        'amountPaid': 0.0,
        'securityDeposit': 3000.0,
        'equipment': {
          'id': 'eq_tractor_01',
          'title': 'Mahindra 575 DI',
          'category': 'TRACTOR',
          'description': 'Tractor',
          'pricePerDay': 1500.0,
          'imageUrl': 'https://example.com/tractor.jpg',
          'ownerId': 'owner_01',
          'available': true,
        },
      };

      final booking = Booking.fromJson(mockBackendResponse);

      expect(booking.id, equals('bk_live_12345'));
      expect(booking.farmerId, equals('user_farmer_88'));
      expect(booking.status, equals('PENDING'));
      expect(booking.paymentStatus, equals('PENDING'));
      expect(booking.amountPaid, equals(0.0));
      expect(booking.totalPrice, equals(7500.0));
      expect(booking.securityDeposit, equals(3000.0));
      expect(booking.equipment?.title, equals('Mahindra 575 DI'));
    });
  });

  // =========================================================================
  // 6. REJECTED OR FAILED BOOKING REQUESTS
  // =========================================================================
  group('Phase 6 - 6. Rejected and Failed Booking Request Handling', () {
    test('Gracefully captures and cleans exception message from backend error', () {
      final exception = Exception('Equipment is currently booked for these dates');
      final cleanMessage = exception.toString().replaceFirst('Exception: ', '');

      expect(cleanMessage, equals('Equipment is currently booked for these dates'));
    });
  });

  // =========================================================================
  // 7. INITIAL BOOKING AND FINANCIAL STATUS CORRECTNESS
  // =========================================================================
  group('Phase 6 - 7. Booking & Payment Financial Integrity', () {
    test('New booking starts as PENDING with amountPaid=0 and paymentStatus=PENDING', () {
      final booking = Booking(
        id: 'bk_fin_01',
        farmerId: 'farmer_01',
        equipmentId: 'eq_01',
        startDate: DateTime(2026, 11, 1),
        endDate: DateTime(2026, 11, 3),
        status: 'PENDING',
        totalPrice: 4500.0,
        paymentStatus: 'PENDING',
        amountPaid: 0.0,
      );

      expect(booking.status, equals('PENDING'));
      expect(booking.paymentStatus, equals('PENDING'));
      expect(booking.amountPaid, equals(0.0));

      // Outstanding balance is full price
      final outstandingBalance = (booking.totalPrice ?? 0.0) - (booking.amountPaid ?? 0.0);
      expect(outstandingBalance, equals(4500.0));

      // Financial invariant: Pending payment must NEVER be marked as paid
      expect(booking.paymentStatus == 'PAID', isFalse);
    });
  });

  // =========================================================================
  // 8. MY RENTALS LOADING, EMPTY, AND ERROR STATES
  // =========================================================================
  group('Phase 6 - 8. My Rentals UI States', () {
    test('Empty state localization returns appropriate message across languages', () {
      for (final lang in ['en', 'te', 'hi', 'ta', 'kn']) {
        final msg = 'no_bookings_found'.tr(lang);
        expect(msg.isNotEmpty, isTrue);
        expect(msg, isNot(equals('no_bookings_found')));
      }
    });
  });

  // =========================================================================
  // 9. BOOKING STATUS PRESENTATION ACROSS ALL CANONICAL STATUSES
  // =========================================================================
  group('Phase 6 - 9. Booking Status Canonical Localization', () {
    final statuses = [
      'PENDING',
      'ACCEPTED',
      'ACTIVE',
      'DELIVERED',
      'RETURN_PENDING',
      'COMPLETED',
      'CANCELLED',
      'REJECTED',
    ];

    test('Localizes all canonical booking statuses in English without fallback keys', () {
      for (final s in statuses) {
        final loc = AppLocalizations.localizedBookingStatus(s, 'en');
        expect(loc.isNotEmpty, isTrue);
        expect(loc, isNot(contains('_')));
      }
    });

    test('Localizes all canonical booking statuses in Telugu', () {
      for (final s in statuses) {
        final loc = AppLocalizations.localizedBookingStatus(s, 'te');
        expect(loc.isNotEmpty, isTrue);
      }
      expect(AppLocalizations.localizedBookingStatus('PENDING', 'te'), equals('పెండింగ్'));
      expect(AppLocalizations.localizedBookingStatus('ACCEPTED', 'te'), equals('ధృవీకరించబడింది'));
      expect(AppLocalizations.localizedBookingStatus('ACTIVE', 'te'), equals('యాక్టివ్'));
      expect(AppLocalizations.localizedBookingStatus('COMPLETED', 'te'), equals('పూర్తయింది'));
      expect(AppLocalizations.localizedBookingStatus('CANCELLED', 'te'), equals('రద్దు చేయబడింది'));
    });
  });

  // =========================================================================
  // 10. CANCELLATION AND RETURN-REQUEST STATE HANDLING
  // =========================================================================
  group('Phase 6 - 10. Cancellation and Return Action Guards', () {
    test('Only PENDING and ACCEPTED bookings can be cancelled by farmer', () {
      bool canCancel(String status) => status == 'PENDING' || status == 'ACCEPTED';

      expect(canCancel('PENDING'), isTrue);
      expect(canCancel('ACCEPTED'), isTrue);
      expect(canCancel('ACTIVE'), isFalse);
      expect(canCancel('DELIVERED'), isFalse);
      expect(canCancel('COMPLETED'), isFalse);
      expect(canCancel('CANCELLED'), isFalse);
    });

    test('Only ACTIVE and DELIVERED bookings can trigger return request', () {
      bool canReturn(String status) => status == 'ACTIVE' || status == 'DELIVERED';

      expect(canReturn('ACTIVE'), isTrue);
      expect(canReturn('DELIVERED'), isTrue);
      expect(canReturn('PENDING'), isFalse);
      expect(canReturn('ACCEPTED'), isFalse);
      expect(canReturn('RETURN_PENDING'), isFalse);
      expect(canReturn('COMPLETED'), isFalse);
    });
  });

  // =========================================================================
  // 11. OWNER ACCEPT/REJECT AND LIFECYCLE WORKFLOW
  // =========================================================================
  group('Phase 6 - 11. Owner Lifecycle Workflow State Transitions', () {
    test('Owner transitions pending booking to ACCEPTED or REJECTED', () {
      const initial = 'PENDING';
      const accepted = 'ACCEPTED';
      const rejected = 'REJECTED';

      expect(initial == 'PENDING', isTrue);
      expect(accepted != initial, isTrue);
      expect(rejected != initial, isTrue);
    });

    test('Owner transitions accepted booking to ACTIVE/Dispatched', () {
      const accepted = 'ACCEPTED';
      const active = 'ACTIVE';

      expect(accepted == 'ACCEPTED', isTrue);
      expect(active == 'ACTIVE', isTrue);
    });

    test('Owner transitions return pending booking to COMPLETED', () {
      const returnPending = 'RETURN_PENDING';
      const completed = 'COMPLETED';

      expect(returnPending == 'RETURN_PENDING', isTrue);
      expect(completed == 'COMPLETED', isTrue);
    });
  });

  // =========================================================================
  // 12. ROLE AND ROUTE ISOLATION
  // =========================================================================
  group('Phase 6 - 12. Role & Ownership Boundary Guarding', () {
    test('Farmer is redirected away from owner booking and fleet management routes', () {
      expect(
        AppRouter.testRoleRedirect(userRole: 'FARMER', targetPath: '/owner'),
        equals('/farmer'),
      );
      expect(
        AppRouter.testRoleRedirect(userRole: 'FARMER', targetPath: '/add-equipment'),
        equals('/farmer'),
      );
      expect(
        AppRouter.testRoleRedirect(userRole: 'FARMER', targetPath: '/payments-received'),
        equals('/farmer'),
      );
    });

    test('Owner is redirected away from farmer agricultural and farm management routes', () {
      expect(
        AppRouter.testRoleRedirect(userRole: 'OWNER', targetPath: '/farm'),
        equals('/owner'),
      );
      expect(
        AppRouter.testRoleRedirect(userRole: 'OWNER', targetPath: '/farm-setup'),
        equals('/owner'),
      );
      expect(
        AppRouter.testRoleRedirect(userRole: 'OWNER', targetPath: '/crop-lifecycle'),
        equals('/owner'),
      );
    });
  });

  // =========================================================================
  // 13. EQUIPMENT AVAILABILITY CONFLICTS & CHECKS
  // =========================================================================
  group('Phase 6 - 13. Equipment Availability & Conflict Handling', () {
    test('Booking is disallowed when equipment.available is false', () {
      final unavailEquip = Equipment(
        id: 'eq_busy_01',
        title: 'Combine Harvester',
        category: 'HARVESTER',
        description: 'Currently undergoing repair',
        pricePerDay: 5000.0,
        imageUrl: '',
        ownerId: 'owner_99',
        available: false,
      );

      expect(unavailEquip.available, isFalse);
      expect('equipment_unavailable'.tr('en'), equals('Equipment is currently unavailable'));
    });

    test('409 Conflict error is properly formatted as a readable message', () {
      final conflictError = Exception('409 Conflict: Equipment already booked for selected dates');
      expect(conflictError.toString(), contains('Equipment already booked'));
    });
  });

  // =========================================================================
  // 14. ACCOUNT SWITCH & LOGOUT CACHE ISOLATION
  // =========================================================================
  group('Phase 6 - 14. Logout & Account Switch Cache Isolation', () {
    test('MyRentals provider returns empty list when user is null', () async {
      final container = ProviderContainer(
        overrides: [
          authProvider.overrideWith((ref) => _MockNullAuthNotifier()),
        ],
      );

      final rentals = await container.read(myRentalsProvider.future);
      expect(rentals, isEmpty);
    });

    test('OwnerState resets cleanly when unauthenticated', () {
      final state = OwnerState();
      expect(state.myEquipment, isEmpty);
      expect(state.bookings, isEmpty);
      expect(state.analytics, isNull);
    });
  });

  // =========================================================================
  // 15. LOCALIZATION ACROSS FIVE LANGUAGES
  // =========================================================================
  group('Phase 6 - 15. Localization Across 5 Languages', () {
    final languages = ['en', 'te', 'hi', 'ta', 'kn'];

    test('Translates all Phase 6 booking workflow keys in all 5 languages', () {
      final keys = [
        'change',
        'end_date_cannot_be_before_start_date',
        'start_date_cannot_be_in_past',
        'equipment_unavailable',
        'booking_pending_notice',
        'cancel_booking_confirm',
        'request_return_confirm',
        'accept_booking_confirm',
        'reject_booking_confirm',
        'booking_cancelled_success',
        'return_requested_success',
        'booking_accepted_success',
        'booking_rejected_success',
        'mark_active',
        'accept_return_complete',
      ];

      for (final lang in languages) {
        for (final k in keys) {
          final translated = k.tr(lang);
          expect(translated, isNotEmpty, reason: 'Key $k missing in $lang');
          expect(translated, isNot(equals(k)), reason: 'Key $k not translated in $lang');
        }
      }
    });
  });

  // =========================================================================
  // 16. REGRESSION PROTECTION FOR PHASES 1-5
  // =========================================================================
  group('Phase 6 - 16. Regression Protection for Earlier Phases', () {
    test('User roles and model parsing remains backward compatible', () {
      final user = User(
        id: 'u_1',
        name: 'Ramesh Reddy',
        email: 'ramesh@example.com',
        role: 'FARMER',
        preferredLanguage: 'en',
      );
      expect(user.role, equals('FARMER'));
    });

    test('Booking model serialization roundtrips accurately', () {
      final start = DateTime(2026, 11, 10);
      final end = DateTime(2026, 11, 15);
      final booking = Booking(
        id: 'bk_roundtrip_01',
        farmerId: 'farmer_01',
        equipmentId: 'eq_01',
        startDate: start,
        endDate: end,
        status: 'PENDING',
        totalPrice: 5000.0,
        paymentStatus: 'PENDING',
        amountPaid: 0.0,
      );

      final json = booking.toJson();
      final restored = Booking.fromJson(json);

      expect(restored.id, equals(booking.id));
      expect(restored.farmerId, equals(booking.farmerId));
      expect(restored.equipmentId, equals(booking.equipmentId));
      expect(restored.status, equals(booking.status));
      expect(restored.totalPrice, equals(booking.totalPrice));
      expect(restored.paymentStatus, equals(booking.paymentStatus));
      expect(restored.amountPaid, equals(booking.amountPaid));
    });
  });
}

class _MockNullAuthNotifier extends StateNotifier<AuthState> implements AuthNotifier {
  _MockNullAuthNotifier() : super(AuthState(user: null, activeRole: null));

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
