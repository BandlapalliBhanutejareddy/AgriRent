import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/localization/app_localizations.dart';
import 'package:mobile/models/equipment.dart';
import 'package:mobile/models/booking.dart';
import 'package:mobile/features/profile/providers/owner_provider.dart';
import 'package:mobile/routing/router.dart';

void main() {
  group('Phase 14: Equipment & Booking Model Deserialization & Robustness', () {
    test('Equipment.fromJson handles empty map and missing values safely', () {
      final eq = Equipment.fromJson({});
      expect(eq.id, '');
      expect(eq.title, '');
      expect(eq.category, '');
      expect(eq.pricePerDay, isNull);
      expect(eq.available, false);
    });

    test('Equipment.fromJson parses complete authoritative data', () {
      final json = {
        'id': 'eq-101',
        'title': 'Mahindra 575 DI Tractor',
        'category': 'TRACTOR',
        'pricePerDay': 1500.0,
        'available': true,
        'imageUrl': 'https://example.com/tractor.jpg',
        'ownerId': 'owner-1',
      };
      final eq = Equipment.fromJson(json);
      expect(eq.id, 'eq-101');
      expect(eq.title, 'Mahindra 575 DI Tractor');
      expect(eq.category, 'TRACTOR');
      expect(eq.pricePerDay, 1500.0);
      expect(eq.available, true);
      expect(eq.imageUrl, 'https://example.com/tractor.jpg');
    });

    test('Booking.fromJson handles empty and corrupted inputs safely', () {
      final b = Booking.fromJson('not_a_map');
      expect(b.id, '');
      expect(b.status, 'PENDING');
      expect(b.paymentStatus, 'PENDING');
      expect(b.amountPaid, isNull);
      expect(b.totalPrice, isNull);
    });

    test('Booking.fromJson parses complete authoritative rental data', () {
      final json = {
        'id': 'bk-501',
        'farmerId': 'farmer-1',
        'equipmentId': 'eq-101',
        'startDate': '2026-10-25T08:00:00Z',
        'endDate': '2026-10-28T18:00:00Z',
        'status': 'ACTIVE',
        'totalPrice': 4500.0,
        'paymentStatus': 'PAID',
        'amountPaid': 4500.0,
        'farmer': {'id': 'farmer-1', 'name': 'Ramesh Patel', 'phone': '9876543210'},
        'equipment': {'id': 'eq-101', 'title': 'Mahindra 575 DI', 'category': 'TRACTOR', 'pricePerDay': 1500.0},
      };
      final b = Booking.fromJson(json);
      expect(b.id, 'bk-501');
      expect(b.status, 'ACTIVE');
      expect(b.paymentStatus, 'PAID');
      expect(b.totalPrice, 4500.0);
      expect(b.amountPaid, 4500.0);
      expect(b.outstandingBalance, 0.0);
      expect(b.isPaid, true);
      expect(b.farmer?.name, 'Ramesh Patel');
      expect(b.equipment?.title, 'Mahindra 575 DI');
    });
  });

  group('Phase 14: Owner Dashboard Metrics & Deduplication Calculations', () {
    final eq1 = Equipment(id: 'eq-1', title: 'John Deere Tractor', category: 'TRACTOR', description: 'Tractor description', imageUrl: '', ownerId: 'owner-1', pricePerDay: 2000.0, available: true);
    final eq2 = Equipment(id: 'eq-2', title: 'Paddy Harvester', category: 'HARVESTER', description: 'Harvester description', imageUrl: '', ownerId: 'owner-1', pricePerDay: 4500.0, available: false);
    final eq3 = Equipment(id: 'eq-3', title: 'Power Tiller', category: 'POWER_TILLER', description: 'Tiller description', imageUrl: '', ownerId: 'owner-1', pricePerDay: 1200.0, available: true);

    final bPending = Booking(
      id: 'b-1',
      farmerId: 'f-1',
      equipmentId: 'eq-1',
      startDate: DateTime(2026, 10, 25),
      endDate: DateTime(2026, 10, 27),
      status: 'PENDING',
      paymentStatus: 'PENDING',
      totalPrice: 4000.0,
      amountPaid: 0.0,
    );

    final bActive = Booking(
      id: 'b-2',
      farmerId: 'f-2',
      equipmentId: 'eq-1',
      startDate: DateTime(2026, 10, 20),
      endDate: DateTime(2026, 10, 24),
      status: 'ACTIVE',
      paymentStatus: 'PAID',
      totalPrice: 6000.0,
      amountPaid: 6000.0,
    );

    final bCompleted = Booking(
      id: 'b-3',
      farmerId: 'f-3',
      equipmentId: 'eq-2',
      startDate: DateTime(2026, 10, 10),
      endDate: DateTime(2026, 10, 15),
      status: 'COMPLETED',
      paymentStatus: 'PAID',
      totalPrice: 15000.0,
      amountPaid: 15000.0,
    );

    final bReturnPending = Booking(
      id: 'b-4',
      farmerId: 'f-4',
      equipmentId: 'eq-3',
      startDate: DateTime(2026, 10, 18),
      endDate: DateTime(2026, 10, 22),
      status: 'RETURN_PENDING',
      paymentStatus: 'PARTIAL',
      totalPrice: 3600.0,
      amountPaid: 2000.0,
    );

    final bCancelled = Booking(
      id: 'b-5',
      farmerId: 'f-5',
      equipmentId: 'eq-1',
      startDate: DateTime(2026, 10, 5),
      endDate: DateTime(2026, 10, 6),
      status: 'CANCELLED',
      paymentStatus: 'CANCELLED',
      totalPrice: 2000.0,
      amountPaid: 0.0,
    );

    test('Computes fleet counts correctly (total, active, inactive)', () {
      final state = OwnerState(myEquipment: [eq1, eq2, eq3]);
      expect(state.totalEquipmentCount, 3);
      expect(state.activeListingsCount, 2);
      expect(state.inactiveListingsCount, 1);
    });

    test('Computes booking status counts correctly', () {
      final state = OwnerState(bookings: [bPending, bActive, bCompleted, bReturnPending, bCancelled]);
      expect(state.pendingBookingsCount, 1);
      expect(state.activeRentalsCount, 1);
      expect(state.completedBookingsCount, 1);
      expect(state.returnPendingCount, 1);
    });

    test('Computes equipment-specific booking counts', () {
      final state = OwnerState(
        myEquipment: [eq1, eq2, eq3],
        bookings: [bPending, bActive, bCompleted, bReturnPending, bCancelled],
      );
      // eq-1 has b-1 (pending), b-2 (active), b-5 (cancelled) = 3 total, 1 active
      expect(state.equipmentBookingCount('eq-1'), 3);
      expect(state.equipmentActiveBookingCount('eq-1'), 1);

      // eq-2 has b-3 (completed) = 1 total, 0 active
      expect(state.equipmentBookingCount('eq-2'), 1);
      expect(state.equipmentActiveBookingCount('eq-2'), 0);
    });

    test('recentBookings sorts bookings by start date descending and takes top 5', () {
      final state = OwnerState(bookings: [bCancelled, bCompleted, bReturnPending, bActive, bPending]);
      final recent = state.recentBookings;
      expect(recent.length, 5);
      expect(recent[0].id, 'b-1'); // Oct 25
      expect(recent[1].id, 'b-2'); // Oct 20
      expect(recent[2].id, 'b-4'); // Oct 18
      expect(recent[3].id, 'b-3'); // Oct 10
      expect(recent[4].id, 'b-5'); // Oct 5
    });
  });

  group('Phase 14: Financial Summary Integrity & Accuracy', () {
    test('totalBookingValue excludes cancelled and rejected bookings', () {
      final b1 = Booking(id: '1', farmerId: 'f', equipmentId: 'e', startDate: DateTime.now(), endDate: DateTime.now(), status: 'CONFIRMED', paymentStatus: 'PAID', totalPrice: 5000.0);
      final b2 = Booking(id: '2', farmerId: 'f', equipmentId: 'e', startDate: DateTime.now(), endDate: DateTime.now(), status: 'CANCELLED', paymentStatus: 'CANCELLED', totalPrice: 3000.0);
      final b3 = Booking(id: '3', farmerId: 'f', equipmentId: 'e', startDate: DateTime.now(), endDate: DateTime.now(), status: 'REJECTED', paymentStatus: 'REJECTED', totalPrice: 2000.0);
      final state = OwnerState(bookings: [b1, b2, b3]);

      expect(state.totalBookingValue, 5000.0);
    });

    test('totalAmountPaid preserves amountPaid = 0 as 0 and does not invent paid amounts', () {
      final bPending = Booking(id: '1', farmerId: 'f', equipmentId: 'e', startDate: DateTime.now(), endDate: DateTime.now(), status: 'PENDING', paymentStatus: 'PENDING', totalPrice: 4000.0, amountPaid: 0.0);
      final bPartial = Booking(id: '2', farmerId: 'f', equipmentId: 'e', startDate: DateTime.now(), endDate: DateTime.now(), status: 'ACTIVE', paymentStatus: 'PARTIAL', totalPrice: 6000.0, amountPaid: 2500.0);
      final state = OwnerState(bookings: [bPending, bPartial]);

      expect(state.totalAmountPaid, 2500.0);
      expect(bPending.amountPaid, 0.0);
    });

    test('totalOutstandingBalance correctly calculates unpaid portion of valid bookings', () {
      final b1 = Booking(id: '1', farmerId: 'f', equipmentId: 'e', startDate: DateTime.now(), endDate: DateTime.now(), status: 'ACTIVE', paymentStatus: 'PARTIAL', totalPrice: 10000.0, amountPaid: 4000.0);
      final b2 = Booking(id: '2', farmerId: 'f', equipmentId: 'e', startDate: DateTime.now(), endDate: DateTime.now(), status: 'COMPLETED', paymentStatus: 'PAID', totalPrice: 8000.0, amountPaid: 8000.0);
      final b3 = Booking(id: '3', farmerId: 'f', equipmentId: 'e', startDate: DateTime.now(), endDate: DateTime.now(), status: 'CANCELLED', paymentStatus: 'CANCELLED', totalPrice: 5000.0, amountPaid: 0.0);
      final state = OwnerState(bookings: [b1, b2, b3]);

      // b1 outstanding: 10000 - 4000 = 6000
      // b2 outstanding: 0 (PAID)
      // b3 outstanding: 0 (CANCELLED)
      expect(state.totalOutstandingBalance, 6000.0);
    });

    test('totalRevenue aggregates only qualifying statuses when analytics absent', () {
      final bAccepted = Booking(id: '1', farmerId: 'f', equipmentId: 'e', startDate: DateTime.now(), endDate: DateTime.now(), status: 'ACCEPTED', paymentStatus: 'PENDING', totalPrice: 2000.0);
      final bActive = Booking(id: '2', farmerId: 'f', equipmentId: 'e', startDate: DateTime.now(), endDate: DateTime.now(), status: 'ACTIVE', paymentStatus: 'PAID', totalPrice: 3000.0);
      final bCompleted = Booking(id: '3', farmerId: 'f', equipmentId: 'e', startDate: DateTime.now(), endDate: DateTime.now(), status: 'COMPLETED', paymentStatus: 'PAID', totalPrice: 5000.0);
      final bPending = Booking(id: '4', farmerId: 'f', equipmentId: 'e', startDate: DateTime.now(), endDate: DateTime.now(), status: 'PENDING', paymentStatus: 'PENDING', totalPrice: 4000.0);
      final bCancelled = Booking(id: '5', farmerId: 'f', equipmentId: 'e', startDate: DateTime.now(), endDate: DateTime.now(), status: 'CANCELLED', paymentStatus: 'CANCELLED', totalPrice: 1000.0);

      final state = OwnerState(bookings: [bAccepted, bActive, bCompleted, bPending, bCancelled]);
      // Qualifying: ACCEPTED (2000) + ACTIVE (3000) + COMPLETED (5000) = 10000
      expect(state.totalRevenue, 10000.0);
    });

    test('totalRevenue prioritizes authoritative backend analytics totalRevenue when available', () {
      final b1 = Booking(id: '1', farmerId: 'f', equipmentId: 'e', startDate: DateTime.now(), endDate: DateTime.now(), status: 'COMPLETED', paymentStatus: 'PAID', totalPrice: 5000.0);
      final state = OwnerState(
        bookings: [b1],
        analytics: {'totalRevenue': 25000.0},
      );
      expect(state.totalRevenue, 25000.0);
    });

    test('AppFormatters.formatCurrency accurately formats Rupee values with Indian numbering system', () {
      expect(AppFormatters.formatCurrency(null), 'N/A');
      expect(AppFormatters.formatCurrency(0), '₹0');
      expect(AppFormatters.formatCurrency(500), '₹500');
      expect(AppFormatters.formatCurrency(1500), '₹1,500');
      expect(AppFormatters.formatCurrency(50000), '₹50,000');
      expect(AppFormatters.formatCurrency(100000), '₹1,00,000');
      expect(AppFormatters.formatCurrency(2500000), '₹25,00,000');
    });
  });

  group('Phase 14: Empty, Loading, and Error State Handling', () {
    test('Default OwnerState has zero metrics and null errors', () {
      final state = OwnerState();
      expect(state.myEquipment, isEmpty);
      expect(state.bookings, isEmpty);
      expect(state.analytics, isNull);
      expect(state.isLoading, false);
      expect(state.error, isNull);
      expect(state.totalEquipmentCount, 0);
      expect(state.totalBookingValue, 0.0);
      expect(state.totalRevenue, 0.0);
      expect(state.recentBookings, isEmpty);
    });

    test('copyWith handles error clearing and loading toggles properly', () {
      var state = OwnerState();
      state = state.copyWith(isLoading: true, error: 'Network timeout');
      expect(state.isLoading, true);
      expect(state.error, 'Network timeout');

      state = state.copyWith(isLoading: false, clearError: true);
      expect(state.isLoading, false);
      expect(state.error, isNull);
    });
  });

  group('Phase 14: Security, Role Guards & Access Boundaries', () {
    test('AppRouter prevents FARMER from accessing owner-only dashboard routes', () {
      expect(AppRouter.testRoleRedirect(userRole: 'FARMER', targetPath: '/owner'), '/farmer');
      expect(AppRouter.testRoleRedirect(userRole: 'FARMER', targetPath: '/add-equipment'), '/farmer');
      expect(AppRouter.testRoleRedirect(userRole: 'FARMER', targetPath: '/payments-received'), '/farmer');
    });

    test('AppRouter prevents OWNER from accessing farmer-specific crop/farm setup routes', () {
      expect(AppRouter.testRoleRedirect(userRole: 'OWNER', targetPath: '/farmer'), '/owner');
      expect(AppRouter.testRoleRedirect(userRole: 'OWNER', targetPath: '/farm'), '/owner');
      expect(AppRouter.testRoleRedirect(userRole: 'OWNER', targetPath: '/farm-setup'), '/owner');
      expect(AppRouter.testRoleRedirect(userRole: 'OWNER', targetPath: '/crop-lifecycle'), '/owner');
      expect(AppRouter.testRoleRedirect(userRole: 'OWNER', targetPath: '/ai-assistant'), '/owner');
    });

    test('AppRouter allows OWNER to navigate to permitted owner routes', () {
      expect(AppRouter.testRoleRedirect(userRole: 'OWNER', targetPath: '/owner'), isNull);
      expect(AppRouter.testRoleRedirect(userRole: 'OWNER', targetPath: '/add-equipment'), isNull);
      expect(AppRouter.testRoleRedirect(userRole: 'OWNER', targetPath: '/payments-received'), isNull);
    });
  });

  group('Phase 14: Five-Language Localization Coverage', () {
    const requiredKeys = [
      'owner_dashboard',
      'fleet_owner',
      'owner_banner_subtitle',
      'fleet_overview',
      'tap_to_view_reports',
      'equipment_fleet',
      'pending_requests',
      'active_rentals',
      'completed_rentals',
      'listing_status',
      'manage_fleet',
      'fleet_management',
      'view_booking_requests',
      'rental_history',
      'view_active_rentals',
      'open_notifications',
      'owner_profile',
      'owner_financial_overview',
      'total_booking_value',
      'amount_actually_paid',
      'outstanding_amount',
      'received_rental_revenue',
      'owner_expenses_notice',
      'financial_integrity_notice',
      'action_required_pending',
      'no_bookings_desc',
      'view_payment_receipts',
      'rentals_completed_count',
      'unread_notifications_alert',
      'available_status',
      'unavailable_status',
      'owner_actions',
      'bookings_count_label',
      'active_bookings_count_label',
      'view_all_bookings',
      'not_available_na',
      'hello_user',
      'revenue_generated',
      'no_financial_records_yet',
      'financial_metrics_auto_calculate',
    ];

    const languages = ['en', 'te', 'hi', 'ta', 'kn'];

    for (final lang in languages) {
      test('Language "$lang" covers all Phase 14 keys without missing fallback', () {
        for (final key in requiredKeys) {
          final translated = AppLocalizations.get(key, lang);
          expect(translated, isNotEmpty, reason: 'Key "$key" should be non-empty in language "$lang"');
          expect(translated, isNot(equals(key)), reason: 'Key "$key" was not found in language "$lang" and fell back to raw key name');
        }
      });
    }

    test('Indic languages use valid non-ASCII native Unicode scripts', () {
      for (final lang in ['te', 'hi', 'ta', 'kn']) {
        final sample = AppLocalizations.get('owner_financial_overview', lang);
        expect(sample.codeUnits.any((unit) => unit > 127), isTrue,
            reason: 'Language "$lang" must use native script for "owner_financial_overview"');
      }
    });
  });
}
