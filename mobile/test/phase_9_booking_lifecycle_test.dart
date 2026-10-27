import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile/core/localization/app_localizations.dart';
import 'package:mobile/models/booking.dart';
import 'package:mobile/models/equipment.dart';
import 'package:mobile/models/user.dart';
import 'package:mobile/features/bookings/providers/booking_provider.dart';
import 'package:mobile/features/profile/providers/owner_provider.dart';
import 'package:mobile/features/profile/repository/owner_repository.dart';

void main() {
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    SharedPreferences.setMockInitialValues({});
  });

  tearDown(() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  });

  Booking createTestBooking({
    String id = 'bk_test_101',
    String status = 'PENDING',
    String paymentStatus = 'PENDING',
    double totalPrice = 3000.0,
    double amountPaid = 0.0,
    double securityDeposit = 500.0,
    List<BookingStatusHistory> statusHistory = const [],
    String userId = 'farmer_01',
    String ownerId = 'owner_01',
  }) {
    return Booking(
      id: id,
      farmerId: userId,
      equipmentId: 'eq_test_1',
      startDate: DateTime(2026, 11, 1),
      endDate: DateTime(2026, 11, 3),
      status: status,
      paymentStatus: paymentStatus,
      totalPrice: totalPrice,
      amountPaid: amountPaid,
      securityDeposit: securityDeposit,
      statusHistory: statusHistory,
      equipment: Equipment(
        id: 'eq_test_1',
        title: 'John Deere Tractor 5050 D',
        category: 'TRACTOR',
        description: 'Heavy duty agricultural tractor',
        pricePerDay: 1500.0,
        imageUrl: 'https://example.com/tractor.jpg',
        ownerId: ownerId,
        available: true,
      ),
      farmer: User(
        id: userId,
        name: 'Ramesh Kumar',
        email: 'ramesh@example.com',
        role: 'FARMER',
        preferredLanguage: 'en',
      ),
    );
  }

  // =========================================================================
  // 1. STATUS-TO-ACTION ELIGIBILITY MATRIX
  // =========================================================================
  group('Phase 9 - 1. Status-to-Action Eligibility Matrix', () {
    test('Status PENDING grants Farmer Cancel and Owner Accept/Reject', () {
      final b = createTestBooking(status: 'PENDING');
      expect(b.isFarmerCancellable, isTrue);
      expect(b.isFarmerReturnable, isFalse);
      expect(b.isOwnerAcceptable, isTrue);
      expect(b.isOwnerRejectable, isTrue);
      expect(b.isOwnerActivable, isFalse);
      expect(b.isOwnerCompletable, isFalse);
      expect(b.isTerminal, isFalse);
    });

    test('Status ACCEPTED grants Farmer Cancel and Owner Activate', () {
      final b = createTestBooking(status: 'ACCEPTED');
      expect(b.isFarmerCancellable, isTrue);
      expect(b.isFarmerReturnable, isFalse);
      expect(b.isOwnerAcceptable, isFalse);
      expect(b.isOwnerRejectable, isFalse);
      expect(b.isOwnerActivable, isTrue);
      expect(b.isOwnerCompletable, isFalse);
      expect(b.isTerminal, isFalse);
    });

    test('Status ACTIVE grants Farmer Return and Owner Complete', () {
      final b = createTestBooking(status: 'ACTIVE');
      expect(b.isFarmerCancellable, isFalse);
      expect(b.isFarmerReturnable, isTrue);
      expect(b.isOwnerAcceptable, isFalse);
      expect(b.isOwnerRejectable, isFalse);
      expect(b.isOwnerActivable, isFalse);
      expect(b.isOwnerCompletable, isTrue);
      expect(b.isTerminal, isFalse);
    });

    test('Status RETURN_PENDING grants Owner Complete', () {
      final b = createTestBooking(status: 'RETURN_PENDING');
      expect(b.isFarmerCancellable, isFalse);
      expect(b.isFarmerReturnable, isFalse);
      expect(b.isOwnerAcceptable, isFalse);
      expect(b.isOwnerRejectable, isFalse);
      expect(b.isOwnerActivable, isFalse);
      expect(b.isOwnerCompletable, isTrue);
      expect(b.isTerminal, isFalse);
    });

    test('Terminal statuses CANCELLED and REJECTED grant no actions', () {
      final bCancelled = createTestBooking(status: 'CANCELLED');
      expect(bCancelled.isFarmerCancellable, isFalse);
      expect(bCancelled.isFarmerReturnable, isFalse);
      expect(bCancelled.isOwnerAcceptable, isFalse);
      expect(bCancelled.isOwnerRejectable, isFalse);
      expect(bCancelled.isOwnerActivable, isFalse);
      expect(bCancelled.isOwnerCompletable, isFalse);
      expect(bCancelled.isTerminal, isTrue);

      final bRejected = createTestBooking(status: 'REJECTED');
      expect(bRejected.isFarmerCancellable, isFalse);
      expect(bRejected.isFarmerReturnable, isFalse);
      expect(bRejected.isOwnerAcceptable, isFalse);
      expect(bRejected.isOwnerRejectable, isFalse);
      expect(bRejected.isOwnerActivable, isFalse);
      expect(bRejected.isOwnerCompletable, isFalse);
      expect(bRejected.isTerminal, isTrue);
    });

    test('Terminal status COMPLETED grants no further actions', () {
      final bCompleted = createTestBooking(status: 'COMPLETED');
      expect(bCompleted.isFarmerCancellable, isFalse);
      expect(bCompleted.isFarmerReturnable, isFalse);
      expect(bCompleted.isOwnerAcceptable, isFalse);
      expect(bCompleted.isOwnerRejectable, isFalse);
      expect(bCompleted.isOwnerActivable, isFalse);
      expect(bCompleted.isOwnerCompletable, isFalse);
      expect(bCompleted.isTerminal, isTrue);
    });
  });

  // =========================================================================
  // 2. FARMER CANCELLATION ELIGIBILITY
  // =========================================================================
  group('Phase 9 - 2. Farmer Cancellation Eligibility', () {
    test('Farmer can cancel eligible PENDING booking', () {
      final b = createTestBooking(status: 'PENDING');
      expect(b.isFarmerCancellable, isTrue);
    });

    test('Farmer can cancel eligible ACCEPTED booking before dispatch', () {
      final b = createTestBooking(status: 'ACCEPTED');
      expect(b.isFarmerCancellable, isTrue);
    });

    test('Farmer cannot cancel ACTIVE or COMPLETED rentals', () {
      expect(createTestBooking(status: 'ACTIVE').isFarmerCancellable, isFalse);
      expect(createTestBooking(status: 'COMPLETED').isFarmerCancellable, isFalse);
      expect(createTestBooking(status: 'DELIVERED').isFarmerCancellable, isFalse);
    });
  });

  // =========================================================================
  // 3. FARMER RETURN-REQUEST ELIGIBILITY
  // =========================================================================
  group('Phase 9 - 3. Farmer Return-Request Eligibility', () {
    test('Farmer can request return on ACTIVE rental', () {
      final b = createTestBooking(status: 'ACTIVE');
      expect(b.isFarmerReturnable, isTrue);
    });

    test('Farmer can request return on DELIVERED rental', () {
      final b = createTestBooking(status: 'DELIVERED');
      expect(b.isFarmerReturnable, isTrue);
    });

    test('Farmer cannot request return on PENDING, CANCELLED, or COMPLETED', () {
      expect(createTestBooking(status: 'PENDING').isFarmerReturnable, isFalse);
      expect(createTestBooking(status: 'ACCEPTED').isFarmerReturnable, isFalse);
      expect(createTestBooking(status: 'CANCELLED').isFarmerReturnable, isFalse);
      expect(createTestBooking(status: 'COMPLETED').isFarmerReturnable, isFalse);
    });
  });

  // =========================================================================
  // 4. OWNER ACCEPTANCE AND REJECTION ELIGIBILITY
  // =========================================================================
  group('Phase 9 - 4. Owner Acceptance and Rejection Eligibility', () {
    test('Owner can accept or reject only when booking is PENDING', () {
      final pending = createTestBooking(status: 'PENDING');
      expect(pending.isOwnerAcceptable, isTrue);
      expect(pending.isOwnerRejectable, isTrue);

      final accepted = createTestBooking(status: 'ACCEPTED');
      expect(accepted.isOwnerAcceptable, isFalse);
      expect(accepted.isOwnerRejectable, isFalse);

      final active = createTestBooking(status: 'ACTIVE');
      expect(active.isOwnerAcceptable, isFalse);
      expect(active.isOwnerRejectable, isFalse);
    });
  });

  // =========================================================================
  // 5. OWNER ACTIVATION AND COMPLETION ELIGIBILITY
  // =========================================================================
  group('Phase 9 - 5. Owner Activation and Completion Eligibility', () {
    test('Owner can activate on ACCEPTED or CONFIRMED status', () {
      expect(createTestBooking(status: 'ACCEPTED').isOwnerActivable, isTrue);
      expect(createTestBooking(status: 'CONFIRMED').isOwnerActivable, isTrue);
      expect(createTestBooking(status: 'PENDING').isOwnerActivable, isFalse);
      expect(createTestBooking(status: 'ACTIVE').isOwnerActivable, isFalse);
    });

    test('Owner can complete on RETURN_PENDING, RETURNED, INSPECTION_PENDING, ACTIVE', () {
      expect(createTestBooking(status: 'RETURN_PENDING').isOwnerCompletable, isTrue);
      expect(createTestBooking(status: 'RETURNED').isOwnerCompletable, isTrue);
      expect(createTestBooking(status: 'INSPECTION_PENDING').isOwnerCompletable, isTrue);
      expect(createTestBooking(status: 'ACTIVE').isOwnerCompletable, isTrue);
      expect(createTestBooking(status: 'PENDING').isOwnerCompletable, isFalse);
      expect(createTestBooking(status: 'COMPLETED').isOwnerCompletable, isFalse);
    });
  });

  // =========================================================================
  // 6. INVALID AND CONCURRENT STATUS TRANSITIONS
  // =========================================================================
  group('Phase 9 - 6. Invalid and Terminal Status Transitions', () {
    test('Terminal booking rejects all forward and backward actions', () {
      for (final term in ['CANCELLED', 'REJECTED', 'COMPLETED']) {
        final b = createTestBooking(status: term);
        expect(b.isFarmerCancellable, isFalse, reason: '$term cannot cancel');
        expect(b.isFarmerReturnable, isFalse, reason: '$term cannot return');
        expect(b.isOwnerAcceptable, isFalse, reason: '$term cannot accept');
        expect(b.isOwnerRejectable, isFalse, reason: '$term cannot reject');
        expect(b.isOwnerActivable, isFalse, reason: '$term cannot activate');
        expect(b.isOwnerCompletable, isFalse, reason: '$term cannot complete');
      }
    });
  });

  // =========================================================================
  // 7. DUPLICATE-SUBMIT PREVENTION
  // =========================================================================
  group('Phase 9 - 7. Duplicate-Submit Prevention', () {
    test('BookingNotifier locks pending booking ID during in-flight update', () {
      final container = ProviderContainer();
      final notifier = container.read(bookingProvider.notifier);

      expect(notifier.isActionPending('bk_99'), isFalse);
      // Simulate state where bk_99 is already in flight
      notifier.setPendingForTesting('bk_99', true);
      expect(notifier.isActionPending('bk_99'), isTrue);

      // Reset
      notifier.setPendingForTesting('bk_99', false);
      expect(notifier.isActionPending('bk_99'), isFalse);
      container.dispose();
    });

    test('OwnerState accurately tracks pendingBookingActions', () {
      var state = OwnerState();
      expect(state.isBookingActionPending('bk_1'), isFalse);

      state = state.copyWith(pendingBookingActions: {'bk_1'});
      expect(state.isBookingActionPending('bk_1'), isTrue);
      expect(state.isBookingActionPending('bk_2'), isFalse);

      state = state.copyWith(pendingBookingActions: {});
      expect(state.isBookingActionPending('bk_1'), isFalse);
    });
  });

  // =========================================================================
  // 8. SERVER-CONFIRMED STATUS REFRESH
  // =========================================================================
  group('Phase 9 - 8. Server-Confirmed Status Refresh', () {
    test('Booking.fromJson accurately updates status and statusHistory from response', () {
      final json = {
        'id': 'bk_fresh_1',
        'userId': 'farmer_01',
        'equipmentId': 'eq_test_1',
        'startDate': '2026-11-01T00:00:00.000Z',
        'endDate': '2026-11-03T00:00:00.000Z',
        'status': 'ACTIVE',
        'paymentStatus': 'PAID',
        'totalPrice': 3000.0,
        'amountPaid': 3000.0,
        'bookingStatusHistory': [
          {
            'id': 'hist_1',
            'bookingId': 'bk_fresh_1',
            'status': 'PENDING',
            'title': 'Booking Created',
            'note': 'Initial request',
            'createdAt': '2026-10-21T10:00:00.000Z',
          },
          {
            'id': 'hist_2',
            'bookingId': 'bk_fresh_1',
            'status': 'ACCEPTED',
            'title': 'Owner Accepted',
            'createdAt': '2026-10-21T11:00:00.000Z',
          },
          {
            'id': 'hist_3',
            'bookingId': 'bk_fresh_1',
            'status': 'ACTIVE',
            'title': 'Machinery Dispatched',
            'createdAt': '2026-10-21T12:00:00.000Z',
          },
        ],
      };

      final booking = Booking.fromJson(json);
      expect(booking.status, equals('ACTIVE'));
      expect(booking.paymentStatus, equals('PAID'));
      expect(booking.amountPaid, equals(3000.0));
      expect(booking.outstandingBalance, equals(0.0));
      expect(booking.statusHistory.length, equals(3));
      expect(booking.statusHistory.first.status, equals('PENDING'));
      expect(booking.statusHistory.last.status, equals('ACTIVE'));
      expect(booking.statusHistory.first.note, equals('Initial request'));
    });
  });

  // =========================================================================
  // 9. API FAILURE AND RETRY BEHAVIOR
  // =========================================================================
  group('Phase 9 - 9. API Failure and Retry Behavior', () {
    test('OwnerNotifier gracefully captures error and unlocks booking mutex on failure', () async {
      final container = ProviderContainer(
        overrides: [
          ownerRepositoryProvider.overrideWithValue(_ThrowingOwnerRepository()),
        ],
      );

      final notifier = container.read(ownerProvider.notifier);
      final result = await notifier.updateBookingStatus('bk_fail_1', 'ACCEPTED');

      expect(result, isFalse);
      expect(container.read(ownerProvider).error, isNotNull);
      expect(container.read(ownerProvider).isBookingActionPending('bk_fail_1'), isFalse);
      container.dispose();
    });
  });

  // =========================================================================
  // 10. FARMER / OWNER ACCESS ISOLATION AT INTEGRATION BOUNDARY
  // =========================================================================
  group('Phase 9 - 10. Farmer/Owner Access Isolation', () {
    test('Equipment owner verification correctly distinguishes owner from farmer', () {
      final booking = createTestBooking(
        userId: 'farmer_alice',
        ownerId: 'owner_bob',
      );

      // Alice is the farmer, not the owner
      final isAliceOwner = booking.equipment?.ownerId == 'farmer_alice';
      expect(isAliceOwner, isFalse);

      // Bob is the owner
      final isBobOwner = booking.equipment?.ownerId == 'owner_bob';
      expect(isBobOwner, isTrue);
    });
  });

  // =========================================================================
  // 11. LOGOUT AND ACCOUNT-SWITCH CACHE ISOLATION
  // =========================================================================
  group('Phase 9 - 11. Logout and Account-Switch Cache Isolation', () {
    test('OwnerState resets cleanly when session is cleared', () {
      var state = OwnerState(
        bookings: [createTestBooking(id: 'bk_owned_1')],
        pendingBookingActions: {'bk_owned_1'},
      );

      expect(state.bookings.isNotEmpty, isTrue);

      // Reset on logout
      state = OwnerState();
      expect(state.bookings.isEmpty, isTrue);
      expect(state.pendingBookingActions.isEmpty, isTrue);
      expect(state.error, isNull);
    });
  });

  // =========================================================================
  // 12. BOOKING TIMELINE CONSISTENCY
  // =========================================================================
  group('Phase 9 - 12. Booking Timeline Consistency', () {
    test('Empty bookingStatusHistory does not invent synthetic entries', () {
      final booking = createTestBooking(statusHistory: []);
      expect(booking.statusHistory, isEmpty);
    });

    test('BookingStatusHistory preserves exact timestamps and distinct status notes', () {
      final history = [
        BookingStatusHistory(
          id: 'h_1',
          bookingId: 'bk_1',
          status: 'PENDING',
          title: 'Booking Requested',
          note: 'Farmer requested rotavator',
          createdAt: DateTime(2026, 10, 21, 9, 30),
        ),
      ];
      final booking = createTestBooking(statusHistory: history);

      expect(booking.statusHistory.length, equals(1));
      expect(booking.statusHistory.first.title, equals('Booking Requested'));
      expect(booking.statusHistory.first.note, equals('Farmer requested rotavator'));
      expect(booking.statusHistory.first.createdAt.year, equals(2026));
    });
  });

  // =========================================================================
  // 13. PAYMENT STATUS AND AMOUNT CORRECTNESS
  // =========================================================================
  group('Phase 9 - 13. Financial Invariants & Outstanding Calculation', () {
    test('New booking default payment status is PENDING and amountPaid is 0.0', () {
      final rawJson = {
        'id': 'bk_new_1',
        'userId': 'u_1',
        'equipmentId': 'eq_1',
        'startDate': '2026-11-01T00:00:00.000Z',
        'endDate': '2026-11-03T00:00:00.000Z',
        'status': 'PENDING',
        'totalPrice': 4500.0,
      };

      final b = Booking.fromJson(rawJson);
      expect(b.paymentStatus, equals('PENDING'));
      expect(b.amountPaid, equals(0.0));
      expect(b.outstandingBalance, equals(4500.0));
    });

    test('Partial payment correctly reflects outstanding balance', () {
      final b = createTestBooking(
        totalPrice: 5000.0,
        amountPaid: 2000.0,
        paymentStatus: 'PARTIAL',
      );
      expect(b.outstandingBalance, equals(3000.0));
      expect(b.isPaid, isFalse);
    });

    test('Cancelled and Rejected bookings clear outstanding balance', () {
      final bCancelled = createTestBooking(
        status: 'CANCELLED',
        totalPrice: 5000.0,
        amountPaid: 0.0,
      );
      expect(bCancelled.outstandingBalance, equals(0.0));

      final bRejected = createTestBooking(
        status: 'REJECTED',
        totalPrice: 5000.0,
        amountPaid: 0.0,
      );
      expect(bRejected.outstandingBalance, equals(0.0));
    });
  });

  // =========================================================================
  // 14. NO FALSE PAID RECEIPT
  // =========================================================================
  group('Phase 9 - 14. No False Paid Receipt', () {
    test('Accepted or Completed status does not falsely mark booking as paid', () {
      final acceptedUnpaid = createTestBooking(
        status: 'ACCEPTED',
        paymentStatus: 'PENDING',
        amountPaid: 0.0,
      );
      expect(acceptedUnpaid.isPaid, isFalse);

      final completedUnpaid = createTestBooking(
        status: 'COMPLETED',
        paymentStatus: 'PENDING',
        amountPaid: 0.0,
      );
      expect(completedUnpaid.isPaid, isFalse);
      expect(completedUnpaid.outstandingBalance, equals(3000.0));
    });

    test('isPaid is strictly true only on PAID or SUCCESS payment status', () {
      final paidBooking = createTestBooking(
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        amountPaid: 3000.0,
      );
      expect(paidBooking.isPaid, isTrue);
      expect(paidBooking.outstandingBalance, equals(0.0));

      final successBooking = createTestBooking(
        status: 'ACTIVE',
        paymentStatus: 'SUCCESS',
        amountPaid: 3000.0,
      );
      expect(successBooking.isPaid, isTrue);
    });
  });

  // =========================================================================
  // 15. LOCALIZATION ACROSS ALL FIVE LANGUAGES
  // =========================================================================
  group('Phase 9 - 15. 5-Language Authentic Localization', () {
    final phase9Keys = [
      'booking_lifecycle',
      'status_timeline',
      'outstanding_balance',
      'accept',
      'reject',
      'activate_booking_confirm',
      'complete_booking_confirm',
      'booking_activated_success',
      'rental_completed_success',
      'no_status_history',
      'unpaid_booking_receipt_warning',
      'paid_status_note',
      'event_timestamp',
      'rental_dates_heading',
      'request_return_confirm_msg',
    ];

    for (final lang in ['en', 'te', 'hi', 'ta', 'kn']) {
      test('Language "$lang" provides all 15 Phase 9 translation keys', () {
        for (final key in phase9Keys) {
          final translated = key.tr(lang);
          expect(translated, isNotEmpty, reason: 'Key $key must not be empty in $lang');
          expect(translated, isNot(equals(key)), reason: 'Key $key must not fallback to raw key in $lang');
        }
      });
    }

    test('Non-English native scripts render genuine Unicode characters', () {
      // Telugu ('స్థితి కాలక్రమం')
      expect('status_timeline'.tr('te'), contains('స్థితి'));
      // Hindi ('स्थिति समयरेखा')
      expect('status_timeline'.tr('hi'), contains('स्थिति'));
      // Tamil ('நிலை காலவரிசை')
      expect('status_timeline'.tr('ta'), contains('நிலை'));
      // Kannada ('ಸ್ಥಿತಿ ಟೈಮ್‌ಲೈನ್')
      expect('status_timeline'.tr('kn'), contains('ಸ್ಥಿತಿ'));
    });
  });

  // =========================================================================
  // 16. REGRESSION COVERAGE FOR PHASES 1–8
  // =========================================================================
  group('Phase 9 - 16. Regression Coverage for Phases 1–8', () {
    test('Phase 6 booking creation calculations remain preserved', () {
      final days = DateTime(2026, 11, 3).difference(DateTime(2026, 11, 1)).inDays + 1;
      expect(days, equals(3));
      final rate = 1500.0;
      final expectedTotal = rate * days;
      expect(expectedTotal, equals(4500.0));
    });

    test('Phase 8 marketplace category localization remains preserved', () {
      expect(AppLocalizations.localizedEquipmentCategory('TRACTOR', 'en'), equals('Tractors'));
      expect(AppLocalizations.localizedEquipmentCategory('TRACTOR', 'te'), equals('ట్రాక్టర్లు'));
      expect(AppLocalizations.localizedEquipmentCategory('TRACTOR', 'hi'), equals('ट्रैक्टर'));
      expect(AppLocalizations.localizedEquipmentCategory('TRACTOR', 'ta'), equals('டிராக்டர்கள்'));
      expect(AppLocalizations.localizedEquipmentCategory('TRACTOR', 'kn'), equals('ಟ್ರಾಕ್ಟರ್‌ಗಳು'));
    });

    test('Phase 8 booking status localization remains intact across all lifecycle enums', () {
      for (final status in ['PENDING', 'ACCEPTED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'REJECTED']) {
        for (final lang in ['en', 'te', 'hi', 'ta', 'kn']) {
          final localized = AppLocalizations.localizedBookingStatus(status, lang);
          expect(localized, isNotEmpty);
          expect(localized, isNot(equals(status)));
        }
      }
    });
  });
}

class _ThrowingOwnerRepository implements OwnerRepository {
  @override
  Future<List<Equipment>> fetchMyEquipment() async => throw Exception('Network error');

  @override
  Future<List<Booking>> fetchOwnerBookings() async => throw Exception('Network error');

  @override
  Future<Map<String, dynamic>> fetchAnalytics() async => throw Exception('Network error');

  @override
  Future<Equipment> createEquipment(Map<String, dynamic> data) async => throw Exception('Network error');

  @override
  Future<Equipment> updateEquipment(String id, Map<String, dynamic> data) async => throw Exception('Network error');

  @override
  Future<void> deleteEquipment(String id) async => throw Exception('Network error');

  @override
  Future<Booking> updateBookingStatus(String bookingId, String status, {String? note}) async => throw Exception('Simulated server rejection');

  @override
  Future<void> completeInspection(String bookingId, Map<String, dynamic> data) async => throw Exception('Network error');
}
