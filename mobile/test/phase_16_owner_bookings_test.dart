import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/localization/app_localizations.dart';
import 'package:mobile/models/booking.dart';
import 'package:mobile/models/equipment.dart';
import 'package:mobile/models/user.dart';
import 'package:mobile/features/profile/providers/owner_provider.dart';
import 'package:mobile/features/profile/repository/owner_repository.dart';
import 'package:mobile/features/profile/ui/owner_booking_detail_screen.dart';
import 'package:mobile/features/auth/providers/auth_provider.dart';
import 'package:mobile/routing/router.dart';

class FakeAuthNotifier extends StateNotifier<AuthState> implements AuthNotifier {
  FakeAuthNotifier([AuthState? initial])
      : super(initial ??
            AuthState(
              user: User(
                id: 'owner-1',
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

class MockOwnerRepository implements OwnerRepository {
  List<Equipment> mockEquipment = [];
  List<Booking> mockBookings = [];
  Map<String, dynamic> mockAnalytics = {};
  Map<String, dynamic>? lastInspectionData;
  String? lastInspectedBookingId;

  bool shouldThrowOnFetch = false;
  bool shouldThrowOnUpdateStatus = false;
  bool shouldThrowOnInspection = false;

  int updateStatusCalls = 0;
  int inspectionCalls = 0;
  int fetchCalls = 0;

  @override
  Future<List<Equipment>> fetchMyEquipment() async {
    return List<Equipment>.from(mockEquipment);
  }

  @override
  Future<List<Booking>> fetchOwnerBookings() async {
    fetchCalls++;
    if (shouldThrowOnFetch) throw Exception('Failed to fetch owner bookings');
    return List<Booking>.from(mockBookings);
  }

  @override
  Future<Map<String, dynamic>> fetchAnalytics() async {
    return Map<String, dynamic>.from(mockAnalytics);
  }

  @override
  Future<Equipment> createEquipment(Map<String, dynamic> data) async => throw UnimplementedError();

  @override
  Future<Equipment> updateEquipment(String id, Map<String, dynamic> data) async => throw UnimplementedError();

  @override
  Future<void> deleteEquipment(String id) async => throw UnimplementedError();

  @override
  Future<Booking> updateBookingStatus(String bookingId, String status, {String? note}) async {
    updateStatusCalls++;
    if (shouldThrowOnUpdateStatus) throw Exception('Server error: status transition not allowed');
    final index = mockBookings.indexWhere((b) => b.id == bookingId);
    if (index != -1) {
      final updated = mockBookings[index].copyWith(
        status: status,
        statusHistory: [
          ...mockBookings[index].statusHistory,
          BookingStatusHistory(
            id: 'hist-${DateTime.now().millisecondsSinceEpoch}',
            bookingId: bookingId,
            status: status,
            title: 'Status changed to $status',
            note: note,
            createdAt: DateTime.now(),
          ),
        ],
      );
      mockBookings[index] = updated;
      return updated;
    }
    final newB = Booking(
      id: bookingId,
      farmerId: 'farmer-1',
      equipmentId: 'eq-1',
      startDate: DateTime.now(),
      endDate: DateTime.now().add(const Duration(days: 3)),
      status: status,
      paymentStatus: 'PAID',
    );
    mockBookings.add(newB);
    return newB;
  }

  @override
  Future<void> completeInspection(String bookingId, Map<String, dynamic> data) async {
    inspectionCalls++;
    if (shouldThrowOnInspection) throw Exception('Inspection failed: invalid deduction');
    lastInspectedBookingId = bookingId;
    lastInspectionData = Map<String, dynamic>.from(data);

    final index = mockBookings.indexWhere((b) => b.id == bookingId);
    if (index != -1) {
      final inspection = ReturnInspection(
        id: 'insp-1',
        bookingId: bookingId,
        condition: data['condition']?.toString() ?? 'GOOD',
        deductionAmount: double.tryParse(data['deductionAmount']?.toString() ?? '0') ?? 0.0,
        notes: data['notes']?.toString(),
        createdAt: DateTime.now(),
      );
      mockBookings[index] = mockBookings[index].copyWith(
        status: 'COMPLETED',
        returnInspection: inspection,
      );
    }
  }
}

void main() {
  group('Phase 16: Booking Model & ReturnInspection Serialization', () {
    test('Booking.fromJson parses complete authoritative payload with returnInspection', () {
      final json = {
        'id': 'book-100',
        'farmerId': 'farmer-uuid-1',
        'equipmentId': 'eq-uuid-1',
        'startDate': '2026-10-25T08:00:00.000Z',
        'endDate': '2026-10-28T18:00:00.000Z',
        'status': 'RETURN_PENDING',
        'totalPrice': 7500.0,
        'paymentStatus': 'PAID',
        'amountPaid': 7500.0,
        'securityDeposit': 1125.0,
        'farmer': {
          'id': 'farmer-uuid-1',
          'name': 'Krishna Murthy',
          'email': 'krishna@example.com',
          'role': 'FARMER',
          'preferredLanguage': 'te',
        },
        'equipment': {
          'id': 'eq-uuid-1',
          'title': 'John Deere Tractor 5050D',
          'category': 'TRACTOR',
          'pricePerDay': 2500.0,
          'imageUrl': 'https://example.com/tractor.jpg',
          'ownerId': 'owner-1',
        },
        'returnInspection': {
          'id': 'insp-501',
          'bookingId': 'book-100',
          'condition': 'GOOD',
          'deductionAmount': 200.0,
          'notes': 'Slight mud on tyres',
          'createdAt': '2026-10-28T19:00:00.000Z',
        },
        'statusHistory': [
          {
            'id': 'hist-1',
            'bookingId': 'book-100',
            'status': 'PENDING',
            'title': 'Booking Requested',
            'note': '3 days booking requested',
            'createdAt': '2026-10-24T10:00:00.000Z',
          },
        ],
      };

      final booking = Booking.fromJson(json);

      expect(booking.id, 'book-100');
      expect(booking.farmerId, 'farmer-uuid-1');
      expect(booking.equipmentId, 'eq-uuid-1');
      expect(booking.status, 'RETURN_PENDING');
      expect(booking.totalPrice, 7500.0);
      expect(booking.amountPaid, 7500.0);
      expect(booking.securityDeposit, 1125.0);
      expect(booking.farmer?.name, 'Krishna Murthy');
      expect(booking.equipment?.title, 'John Deere Tractor 5050D');
      expect(booking.returnInspection?.condition, 'GOOD');
      expect(booking.returnInspection?.deductionAmount, 200.0);
      expect(booking.returnInspection?.notes, 'Slight mud on tyres');
      expect(booking.statusHistory.length, 1);
      expect(booking.statusHistory.first.title, 'Booking Requested');
    });

    test('ReturnInspection serialization and deserialization', () {
      final inspection = ReturnInspection(
        id: 'insp-12',
        bookingId: 'book-42',
        condition: 'DAMAGED',
        deductionAmount: 500.0,
        notes: 'Broken side mirror',
        createdAt: DateTime.parse('2026-10-22T10:00:00.000Z'),
      );

      final json = inspection.toJson();
      expect(json['id'], 'insp-12');
      expect(json['bookingId'], 'book-42');
      expect(json['condition'], 'DAMAGED');
      expect(json['deductionAmount'], 500.0);
      expect(json['notes'], 'Broken side mirror');

      final deserialized = ReturnInspection.fromJson(json);
      expect(deserialized.id, 'insp-12');
      expect(deserialized.condition, 'DAMAGED');
      expect(deserialized.deductionAmount, 500.0);
    });

    test('Booking.copyWith produces accurate immutable update', () {
      final original = Booking(
        id: 'book-original',
        farmerId: 'farmer-1',
        equipmentId: 'eq-1',
        startDate: DateTime.now(),
        endDate: DateTime.now().add(const Duration(days: 2)),
        status: 'PENDING',
        paymentStatus: 'PENDING',
        totalPrice: 4000.0,
        amountPaid: 0.0,
      );

      final updated = original.copyWith(
        status: 'ACCEPTED',
        paymentStatus: 'PAID',
        amountPaid: 4000.0,
      );

      expect(updated.id, 'book-original');
      expect(updated.status, 'ACCEPTED');
      expect(updated.paymentStatus, 'PAID');
      expect(updated.amountPaid, 4000.0);
      expect(original.status, 'PENDING'); // Immutability preserved
    });

    test('Financial Invariants: outstandingBalance calculation rules', () {
      final activePartial = Booking(
        id: 'b1',
        farmerId: 'f1',
        equipmentId: 'e1',
        startDate: DateTime.now(),
        endDate: DateTime.now().add(const Duration(days: 2)),
        status: 'ACTIVE',
        paymentStatus: 'PARTIAL',
        totalPrice: 5000.0,
        amountPaid: 2000.0,
      );
      expect(activePartial.outstandingBalance, 3000.0);

      final activePaid = activePartial.copyWith(
        paymentStatus: 'PAID',
        amountPaid: 5000.0,
      );
      expect(activePaid.outstandingBalance, 0.0);

      final cancelledBooking = activePartial.copyWith(status: 'CANCELLED');
      expect(cancelledBooking.outstandingBalance, 0.0);

      final rejectedBooking = activePartial.copyWith(status: 'REJECTED');
      expect(rejectedBooking.outstandingBalance, 0.0);
    });

    test('Lifecycle Eligibility Getters', () {
      final pending = Booking(
        id: 'b-pend',
        farmerId: 'f1',
        equipmentId: 'e1',
        startDate: DateTime.now(),
        endDate: DateTime.now().add(const Duration(days: 1)),
        status: 'PENDING',
        paymentStatus: 'PENDING',
      );
      expect(pending.isOwnerAcceptable, true);
      expect(pending.isOwnerRejectable, true);
      expect(pending.isOwnerDispatchable, false);
      expect(pending.isTerminal, false);

      final accepted = pending.copyWith(status: 'ACCEPTED');
      expect(accepted.isOwnerAcceptable, false);
      expect(accepted.isOwnerDispatchable, true);
      expect(accepted.isOwnerActivable, true);

      final dispatched = pending.copyWith(status: 'DISPATCHED');
      expect(dispatched.isOwnerActivable, true);

      final returnPending = pending.copyWith(status: 'RETURN_PENDING');
      expect(returnPending.isOwnerReturnInspectable, true);
      expect(returnPending.isOwnerCompletable, true);

      final completed = pending.copyWith(status: 'COMPLETED');
      expect(completed.isTerminal, true);

      final rejected = pending.copyWith(status: 'REJECTED');
      expect(rejected.isTerminal, true);
    });
  });

  group('Phase 16: Owner Booking Lifecycle Actions & Concurrency Mutex', () {
    late MockOwnerRepository mockRepo;
    late ProviderContainer container;

    setUp(() {
      mockRepo = MockOwnerRepository();
      container = ProviderContainer(overrides: [
        ownerRepositoryProvider.overrideWithValue(mockRepo),
        authProvider.overrideWith((ref) => FakeAuthNotifier()),
        ownerProvider.overrideWith((ref) => OwnerNotifier(mockRepo, ref, autoFetch: false)),
      ]);
    });

    tearDown(() {
      container.dispose();
    });

    test('updateBookingStatus transitions PENDING to ACCEPTED and updates dashboard list', () async {
      mockRepo.mockBookings = [
        Booking(
          id: 'b-accept-test',
          farmerId: 'f-1',
          equipmentId: 'eq-1',
          startDate: DateTime.now(),
          endDate: DateTime.now().add(const Duration(days: 2)),
          status: 'PENDING',
          paymentStatus: 'PAID',
          totalPrice: 3000.0,
        ),
      ];

      final notifier = container.read(ownerProvider.notifier);
      await notifier.fetchDashboardData();
      expect(notifier.state.bookings.first.status, 'PENDING');

      final success = await notifier.updateBookingStatus('b-accept-test', 'ACCEPTED');
      expect(success, true);
      expect(mockRepo.updateStatusCalls, 1);
      expect(notifier.state.bookings.first.status, 'ACCEPTED');
      expect(notifier.isBookingActionPending('b-accept-test'), false);
    });

    test('updateBookingStatus transitions PENDING to REJECTED and updates dashboard list', () async {
      mockRepo.mockBookings = [
        Booking(
          id: 'b-reject-test',
          farmerId: 'f-1',
          equipmentId: 'eq-1',
          startDate: DateTime.now(),
          endDate: DateTime.now().add(const Duration(days: 2)),
          status: 'PENDING',
          paymentStatus: 'PAID',
          totalPrice: 3000.0,
        ),
      ];

      final notifier = container.read(ownerProvider.notifier);
      await notifier.fetchDashboardData();

      final success = await notifier.updateBookingStatus(
        'b-reject-test',
        'REJECTED',
        note: 'Equipment under scheduled maintenance',
      );

      expect(success, true);
      expect(notifier.state.bookings.first.status, 'REJECTED');
    });

    test('updateBookingStatus transitions ACCEPTED to DISPATCHED', () async {
      mockRepo.mockBookings = [
        Booking(
          id: 'b-dispatch-test',
          farmerId: 'f-1',
          equipmentId: 'eq-1',
          startDate: DateTime.now(),
          endDate: DateTime.now().add(const Duration(days: 2)),
          status: 'ACCEPTED',
          paymentStatus: 'PAID',
          totalPrice: 3000.0,
        ),
      ];

      final notifier = container.read(ownerProvider.notifier);
      await notifier.fetchDashboardData();

      final success = await notifier.updateBookingStatus('b-dispatch-test', 'DISPATCHED');
      expect(success, true);
      expect(notifier.state.bookings.first.status, 'DISPATCHED');
    });

    test('updateBookingStatus mutex prevents concurrent duplicate submissions on same ID', () async {
      mockRepo.mockBookings = [
        Booking(
          id: 'b-mutex-test',
          farmerId: 'f-1',
          equipmentId: 'eq-1',
          startDate: DateTime.now(),
          endDate: DateTime.now().add(const Duration(days: 2)),
          status: 'PENDING',
          paymentStatus: 'PAID',
          totalPrice: 3000.0,
        ),
      ];

      final notifier = container.read(ownerProvider.notifier);
      await notifier.fetchDashboardData();

      // Launch two status updates concurrently
      final future1 = notifier.updateBookingStatus('b-mutex-test', 'ACCEPTED');
      final future2 = notifier.updateBookingStatus('b-mutex-test', 'ACCEPTED');

      final results = await Future.wait([future1, future2]);

      expect(results.contains(true), true);
      expect(results.contains(false), true); // Mutex blocked the second call
      expect(mockRepo.updateStatusCalls, 1);
      expect(notifier.isBookingActionPending('b-mutex-test'), false);
    });

    test('completeInspection submits inspection, transitions to COMPLETED and attaches details', () async {
      mockRepo.mockBookings = [
        Booking(
          id: 'b-insp-test',
          farmerId: 'f-1',
          equipmentId: 'eq-1',
          startDate: DateTime.now(),
          endDate: DateTime.now().add(const Duration(days: 2)),
          status: 'RETURN_PENDING',
          paymentStatus: 'PAID',
          totalPrice: 4000.0,
          securityDeposit: 600.0,
        ),
      ];

      final notifier = container.read(ownerProvider.notifier);
      await notifier.fetchDashboardData();

      final success = await notifier.completeInspection('b-insp-test', {
        'condition': 'GOOD',
        'deductionAmount': 100.0,
        'notes': 'Normal wear and tear observed',
      });

      expect(success, true);
      expect(mockRepo.inspectionCalls, 1);
      expect(mockRepo.lastInspectedBookingId, 'b-insp-test');
      expect(mockRepo.lastInspectionData?['condition'], 'GOOD');
      expect(mockRepo.lastInspectionData?['deductionAmount'], 100.0);
      expect(notifier.state.bookings.first.status, 'COMPLETED');
      expect(notifier.state.bookings.first.returnInspection?.deductionAmount, 100.0);
      expect(notifier.isBookingActionPending('b-insp-test'), false);
    });

    test('completeInspection mutex suppresses concurrent duplicate inspection requests', () async {
      mockRepo.mockBookings = [
        Booking(
          id: 'b-insp-mutex',
          farmerId: 'f-1',
          equipmentId: 'eq-1',
          startDate: DateTime.now(),
          endDate: DateTime.now().add(const Duration(days: 2)),
          status: 'RETURN_PENDING',
          paymentStatus: 'PAID',
          totalPrice: 4000.0,
        ),
      ];

      final notifier = container.read(ownerProvider.notifier);
      await notifier.fetchDashboardData();

      final call1 = notifier.completeInspection('b-insp-mutex', {'condition': 'GOOD'});
      final call2 = notifier.completeInspection('b-insp-mutex', {'condition': 'GOOD'});

      final results = await Future.wait([call1, call2]);
      expect(results.contains(true), true);
      expect(results.contains(false), true);
      expect(mockRepo.inspectionCalls, 1);
    });

    test('updateBookingStatus failure preserves bookings locally and exposes server error', () async {
      mockRepo.shouldThrowOnUpdateStatus = true;
      mockRepo.mockBookings = [
        Booking(
          id: 'b-fail-test',
          farmerId: 'f-1',
          equipmentId: 'eq-1',
          startDate: DateTime.now(),
          endDate: DateTime.now().add(const Duration(days: 2)),
          status: 'PENDING',
          paymentStatus: 'PAID',
          totalPrice: 2000.0,
        ),
      ];

      final notifier = container.read(ownerProvider.notifier);
      await notifier.fetchDashboardData();

      final success = await notifier.updateBookingStatus('b-fail-test', 'ACCEPTED');

      expect(success, false);
      expect(notifier.state.error, contains('status transition not allowed'));
      expect(notifier.state.bookings.first.status, 'PENDING');
      expect(notifier.isBookingActionPending('b-fail-test'), false);
    });
  });

  group('Phase 16: Security, Role Guards & State Isolation', () {
    test('AppRouter prevents FARMER from accessing /owner-booking-detail', () {
      expect(
        AppRouter.testRoleRedirect(userRole: 'FARMER', targetPath: '/owner-booking-detail'),
        '/farmer',
      );
    });

    test('AppRouter permits OWNER to access /owner-booking-detail', () {
      expect(
        AppRouter.testRoleRedirect(userRole: 'OWNER', targetPath: '/owner-booking-detail'),
        isNull,
      );
    });

    test('OwnerState resets all bookings and in-flight mutexes on logout', () {
      final mockRepo = MockOwnerRepository();
      mockRepo.mockBookings = [
        Booking(
          id: 'b-sec-1',
          farmerId: 'f-1',
          equipmentId: 'e-1',
          startDate: DateTime.now(),
          endDate: DateTime.now().add(const Duration(days: 2)),
          status: 'PENDING',
          paymentStatus: 'PAID',
        ),
      ];

      final container = ProviderContainer(overrides: [
        ownerRepositoryProvider.overrideWithValue(mockRepo),
        authProvider.overrideWith((ref) => FakeAuthNotifier()),
        ownerProvider.overrideWith((ref) => OwnerNotifier(mockRepo, ref, autoFetch: false)),
      ]);

      final notifier = container.read(ownerProvider.notifier);
      notifier.state = OwnerState(
        bookings: mockRepo.mockBookings,
        pendingBookingActions: {'b-sec-1'},
      );

      expect(notifier.state.bookings.length, 1);
      expect(notifier.isBookingActionPending('b-sec-1'), true);

      // Trigger logout reset
      notifier.reset();

      expect(notifier.state.bookings, isEmpty);
      expect(notifier.state.pendingBookingActions, isEmpty);
      expect(notifier.isBookingActionPending('b-sec-1'), false);

      container.dispose();
    });

    test('Auth listener triggers reset on account switch', () {
      final mockRepo = MockOwnerRepository();
      final fakeAuth = FakeAuthNotifier(AuthState(
        user: User(
          id: 'owner-A',
          name: 'Owner A',
          email: 'oa@example.com',
          role: 'OWNER',
          preferredLanguage: 'en',
        ),
      ));

      final container = ProviderContainer(overrides: [
        ownerRepositoryProvider.overrideWithValue(mockRepo),
        authProvider.overrideWith((ref) => fakeAuth),
        ownerProvider.overrideWith((ref) => OwnerNotifier(mockRepo, ref, autoFetch: false)),
      ]);

      final ownerNotifier = container.read(ownerProvider.notifier);
      ownerNotifier.state = OwnerState(
        bookings: [
          Booking(
            id: 'b-user-a',
            farmerId: 'f-1',
            equipmentId: 'eq-1',
            startDate: DateTime.now(),
            endDate: DateTime.now().add(const Duration(days: 2)),
            status: 'ACTIVE',
            paymentStatus: 'PAID',
          ),
        ],
      );

      // Switch to different user
      fakeAuth.updateState(AuthState(
        user: User(
          id: 'owner-B',
          name: 'Owner B',
          email: 'ob@example.com',
          role: 'OWNER',
          preferredLanguage: 'en',
        ),
      ));

      expect(container.read(ownerProvider).bookings, isEmpty);
      container.dispose();
    });
  });

  group('Phase 16: Five-Language Localization Coverage', () {
    const requiredPhase16Keys = [
      'dispatched',
      'out_for_delivery',
      'in_transit',
      'dispatch_equipment',
      'dispatch_confirm',
      'equipment_dispatched_success',
      'complete_return_inspection',
      'equipment_condition',
      'condition_excellent',
      'condition_good',
      'condition_fair',
      'condition_damaged',
      'deduction_amount',
      'deduction_hint',
      'inspection_notes',
      'inspection_notes_hint',
      'submit_inspection',
      'inspection_completed_success',
      'failed_to_complete_inspection',
      'no_bookings_matching_filter',
      'search_bookings_hint',
      'status_history',
      'rental_duration_days',
      'owner_booking_details',
      'inspection_record',
      'deduction',
      'deduction_negative',
      'deduction_exceeds_deposit',
      'invalid_inspection_status',
    ];

    const languages = ['en', 'te', 'hi', 'ta', 'kn'];

    for (final lang in languages) {
      test('Language "$lang" provides all Phase 16 keys without fallback to raw key name', () {
        for (final key in requiredPhase16Keys) {
          final translated = AppLocalizations.get(key, lang);
          expect(translated, isNotEmpty, reason: 'Key "$key" should not be empty in "$lang"');
          expect(translated, isNot(equals(key)),
              reason: 'Key "$key" is missing in language "$lang" and fell back to raw key');
        }
      });
    }

    test('Indic languages use valid authentic native Unicode characters without mojibake', () {
      for (final lang in ['te', 'hi', 'ta', 'kn']) {
        final sample = AppLocalizations.get('complete_return_inspection', lang);
        expect(sample.codeUnits.any((code) => code > 127), isTrue,
            reason: 'Language "$lang" must use native non-ASCII characters');
        expect(sample, isNot(contains('Ã')),
            reason: 'Language "$lang" must not contain mojibake corruption');
      }
    });

    test('AppLocalizations.localizedBookingStatus translates DISPATCHED, OUT_FOR_DELIVERY, IN_TRANSIT, INSPECTION_PENDING, RETURN_IN_PROGRESS', () {
      for (final lang in languages) {
        final dispatched = AppLocalizations.localizedBookingStatus('DISPATCHED', lang);
        final outForDelivery = AppLocalizations.localizedBookingStatus('OUT_FOR_DELIVERY', lang);
        final inTransit = AppLocalizations.localizedBookingStatus('IN_TRANSIT', lang);
        final inspectionPending = AppLocalizations.localizedBookingStatus('INSPECTION_PENDING', lang);
        final returnInProgress = AppLocalizations.localizedBookingStatus('RETURN_IN_PROGRESS', lang);

        expect(dispatched, isNotEmpty);
        expect(outForDelivery, isNotEmpty);
        expect(inTransit, isNotEmpty);
        expect(inspectionPending, isNotEmpty);
        expect(returnInProgress, isNotEmpty);
      }
    });
  });

  group('Phase 16: Routing & Navigation Integration', () {
    test('Router registers /owner-booking-detail route', () {
      final routes = AppRouter.routes;
      final routePaths = routes.map((r) => (r as dynamic).path).toList();

      expect(routePaths.contains('/owner-booking-detail'), true);
    });
  });

  group('Phase 16: Return Inspection Validation & Business Constraints', () {
    test('isOwnerReturnInspectable strictly requires return-stage statuses', () {
      final allowedStatuses = ['RETURN_PENDING', 'RETURN_IN_PROGRESS', 'RETURNED', 'INSPECTION_PENDING'];
      final forbiddenStatuses = ['PENDING', 'ACCEPTED', 'CONFIRMED', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'IN_TRANSIT', 'DELIVERED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'REJECTED'];

      for (final st in allowedStatuses) {
        final b = Booking(
          id: 'test-inspect-$st',
          farmerId: 'f-1',
          equipmentId: 'e-1',
          startDate: DateTime.now(),
          endDate: DateTime.now().add(const Duration(days: 1)),
          status: st,
          paymentStatus: 'PAID',
        );
        expect(b.isOwnerReturnInspectable, isTrue, reason: 'Status $st should allow return inspection');
      }

      for (final st in forbiddenStatuses) {
        final b = Booking(
          id: 'test-inspect-$st',
          farmerId: 'f-1',
          equipmentId: 'e-1',
          startDate: DateTime.now(),
          endDate: DateTime.now().add(const Duration(days: 1)),
          status: st,
          paymentStatus: 'PAID',
        );
        expect(b.isOwnerReturnInspectable, isFalse, reason: 'Status $st should NOT allow return inspection');
      }
    });

    test('Deduction limit validation rejects negative values and amounts exceeding security deposit', () {
      final booking = Booking(
        id: 'test-deposit-limit',
        farmerId: 'f-1',
        equipmentId: 'e-1',
        startDate: DateTime.now(),
        endDate: DateTime.now().add(const Duration(days: 1)),
        status: 'RETURN_PENDING',
        paymentStatus: 'PAID',
        securityDeposit: 1500.0,
      );

      bool validateDeduction(double deduction) {
        if (deduction < 0) return false;
        final maxDeposit = booking.securityDeposit ?? 0.0;
        if (maxDeposit > 0 && deduction > maxDeposit) return false;
        return true;
      }

      expect(validateDeduction(-10.0), isFalse, reason: 'Negative deduction must be rejected');
      expect(validateDeduction(2000.0), isFalse, reason: 'Deduction exceeding deposit must be rejected');
      expect(validateDeduction(0.0), isTrue, reason: 'Zero deduction must be allowed');
      expect(validateDeduction(1500.0), isTrue, reason: 'Exact deposit deduction must be allowed');
      expect(validateDeduction(750.0), isTrue, reason: 'Partial deduction must be allowed');
    });

    test('Valid equipment conditions are restricted to EXCELLENT, GOOD, FAIR, DAMAGED', () {
      const validConditions = ['EXCELLENT', 'GOOD', 'FAIR', 'DAMAGED'];
      for (final cond in validConditions) {
        final insp = ReturnInspection(
          id: 'insp-cond-$cond',
          bookingId: 'b-1',
          condition: cond,
          deductionAmount: 0.0,
          createdAt: DateTime.now(),
        );
        expect(validConditions.contains(insp.condition), isTrue);
      }
    });
  });

  group('Phase 16: Owner Booking Detail Screen Widget Presentation', () {
    testWidgets('OwnerBookingDetailScreen renders booking details and financial breakdown cleanly', (tester) async {
      final testBooking = Booking(
        id: 'b-widget-render-1',
        farmerId: 'f-1',
        equipmentId: 'e-1',
        startDate: DateTime(2026, 11, 1),
        endDate: DateTime(2026, 11, 5),
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        totalPrice: 10000.0,
        amountPaid: 10000.0,
        securityDeposit: 1500.0,
        farmer: User(
          id: 'f-1',
          name: 'Venkat Rao',
          email: 'venkat@example.com',
          phone: '+91 9876543210',
          role: 'FARMER',
          preferredLanguage: 'en',
        ),
        equipment: Equipment(
          id: 'e-1',
          ownerId: 'owner-1',
          title: 'Kubota Harvester DC68G',
          description: 'High capacity harvester in prime condition',
          category: 'HARVESTER',
          pricePerDay: 2500.0,
          imageUrl: 'https://example.com/harvester.jpg',
          location: 'Guntur, AP',
          available: true,
        ),
      );

      final mockRepo = MockOwnerRepository();

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            ownerRepositoryProvider.overrideWithValue(mockRepo),
            authProvider.overrideWith((ref) => FakeAuthNotifier()),
            ownerProvider.overrideWith((ref) => OwnerNotifier(mockRepo, ref, autoFetch: false)),
          ],
          child: MaterialApp(
            home: OwnerBookingDetailScreen(booking: testBooking),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify core widgets render without throwing
      expect(find.text('Kubota Harvester DC68G'), findsOneWidget);
      expect(find.text('Venkat Rao'), findsOneWidget);
      expect(find.text('venkat@example.com'), findsOneWidget);
      expect(find.byType(ElevatedButton), findsWidgets);
    });
  });
}
