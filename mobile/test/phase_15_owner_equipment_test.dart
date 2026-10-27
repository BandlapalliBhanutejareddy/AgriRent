import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/localization/app_localizations.dart';
import 'package:mobile/models/equipment.dart';
import 'package:mobile/models/booking.dart';
import 'package:mobile/models/user.dart';
import 'package:mobile/features/profile/providers/owner_provider.dart';
import 'package:mobile/features/profile/repository/owner_repository.dart';
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
  bool shouldThrowOnFetch = false;
  bool shouldThrowOnCreate = false;
  bool shouldThrowOnUpdate = false;
  bool shouldThrowOnDelete = false;
  int createCalls = 0;
  int updateCalls = 0;
  int deleteCalls = 0;
  int fetchCalls = 0;

  @override
  Future<List<Equipment>> fetchMyEquipment() async {
    fetchCalls++;
    if (shouldThrowOnFetch) throw Exception('Failed to fetch equipment');
    return List<Equipment>.from(mockEquipment);
  }

  @override
  Future<List<Booking>> fetchOwnerBookings() async {
    return List<Booking>.from(mockBookings);
  }

  @override
  Future<Map<String, dynamic>> fetchAnalytics() async {
    return Map<String, dynamic>.from(mockAnalytics);
  }

  @override
  Future<Equipment> createEquipment(Map<String, dynamic> data) async {
    createCalls++;
    if (shouldThrowOnCreate) throw Exception('Validation error: Invalid equipment details');
    final newEq = Equipment(
      id: 'eq-created-${DateTime.now().millisecondsSinceEpoch}',
      title: data['title']?.toString() ?? '',
      category: data['category']?.toString() ?? 'OTHER',
      description: data['description']?.toString() ?? '',
      pricePerDay: data['pricePerDay'] != null ? double.tryParse(data['pricePerDay'].toString()) : null,
      imageUrl: data['imageUrl']?.toString() ?? '',
      ownerId: 'owner-1',
      available: data['available'] == true || data['available'] == null,
      location: data['location']?.toString(),
    );
    mockEquipment.add(newEq);
    return newEq;
  }

  @override
  Future<Equipment> updateEquipment(String id, Map<String, dynamic> data) async {
    updateCalls++;
    if (shouldThrowOnUpdate) throw Exception('Server error: Failed to update equipment');
    final index = mockEquipment.indexWhere((e) => e.id == id);
    if (index == -1) {
      final updated = Equipment(
        id: id,
        title: data['title']?.toString() ?? '',
        category: data['category']?.toString() ?? 'OTHER',
        description: data['description']?.toString() ?? '',
        pricePerDay: data['pricePerDay'] != null ? double.tryParse(data['pricePerDay'].toString()) : null,
        imageUrl: data['imageUrl']?.toString() ?? '',
        ownerId: 'owner-1',
        available: data['available'] == true,
      );
      mockEquipment.add(updated);
      return updated;
    }
    final existing = mockEquipment[index];
    final updated = existing.copyWith(
      title: data['title']?.toString(),
      category: data['category']?.toString(),
      description: data['description']?.toString(),
      pricePerDay: data['pricePerDay'] != null ? double.tryParse(data['pricePerDay'].toString()) : null,
      imageUrl: data['imageUrl']?.toString(),
      available: data['available'] != null ? data['available'] == true : null,
      location: data['location']?.toString(),
    );
    mockEquipment[index] = updated;
    return updated;
  }

  @override
  Future<void> deleteEquipment(String id) async {
    deleteCalls++;
    if (shouldThrowOnDelete) throw Exception('Cannot delete equipment with active bookings');
    mockEquipment.removeWhere((e) => e.id == id);
  }

  @override
  Future<void> completeInspection(String bookingId, Map<String, dynamic> data) async {}

  @override
  Future<Booking> updateBookingStatus(String bookingId, String status, {String? note}) async {
    updateCalls++;
    final index = mockBookings.indexWhere((b) => b.id == bookingId);
    if (index != -1) {
      final updated = mockBookings[index].copyWith(status: status);
      mockBookings[index] = updated;
      return updated;
    }
    final dummy = Booking(
      id: bookingId,
      farmerId: 'f-1',
      equipmentId: 'eq-1',
      startDate: DateTime.now(),
      endDate: DateTime.now().add(const Duration(days: 3)),
      status: status,
      paymentStatus: 'PAID',
    );
    mockBookings.add(dummy);
    return dummy;
  }
}

void main() {
  group('Phase 15: Equipment Model Serialization & copyWith', () {
    test('Equipment parses correctly from backend JSON payload', () {
      final json = {
        'id': 'eq-101',
        'title': 'John Deere 5050D Tractor',
        'category': 'TRACTOR',
        'description': '50 HP powerful tractor for tilling',
        'pricePerDay': 2500,
        'imageUrl': 'https://example.com/tractor.jpg',
        'ownerId': 'owner-uuid-1',
        'available': true,
        'location': 'Vijayawada, AP',
        'latitude': 16.5062,
        'longitude': 80.6480,
      };

      final eq = Equipment.fromJson(json);

      expect(eq.id, 'eq-101');
      expect(eq.title, 'John Deere 5050D Tractor');
      expect(eq.category, 'TRACTOR');
      expect(eq.description, '50 HP powerful tractor for tilling');
      expect(eq.pricePerDay, 2500.0);
      expect(eq.imageUrl, 'https://example.com/tractor.jpg');
      expect(eq.ownerId, 'owner-uuid-1');
      expect(eq.available, true);
      expect(eq.location, 'Vijayawada, AP');
      expect(eq.latitude, 16.5062);
      expect(eq.longitude, 80.6480);
    });

    test('Equipment handles null optional fields gracefully', () {
      final json = {
        'id': 'eq-minimal',
        'title': 'Manual Seeder',
        'category': 'SEEDER',
      };

      final eq = Equipment.fromJson(json);

      expect(eq.id, 'eq-minimal');
      expect(eq.title, 'Manual Seeder');
      expect(eq.category, 'SEEDER');
      expect(eq.description, '');
      expect(eq.pricePerDay, isNull);
      expect(eq.imageUrl, '');
      expect(eq.ownerId, '');
      expect(eq.available, false); // defaults to false when omitted from JSON
      expect(eq.location, isNull);
    });

    test('Equipment toJson serializes fields matching backend schema', () {
      final eq = Equipment(
        id: 'eq-202',
        title: 'Harvester Machine',
        category: 'HARVESTER',
        description: 'Multi-crop harvester',
        pricePerDay: 8000.0,
        imageUrl: 'https://example.com/harvester.jpg',
        ownerId: 'owner-2',
        available: false,
        location: 'Guntur',
      );

      final json = eq.toJson();

      expect(json['id'], 'eq-202');
      expect(json['title'], 'Harvester Machine');
      expect(json['category'], 'HARVESTER');
      expect(json['description'], 'Multi-crop harvester');
      expect(json['pricePerDay'], 8000.0);
      expect(json['imageUrl'], 'https://example.com/harvester.jpg');
      expect(json['ownerId'], 'owner-2');
      expect(json['available'], false);
      expect(json['location'], 'Guntur');
    });

    test('Equipment copyWith creates updated immutable instance preserving unchanged fields', () {
      final original = Equipment(
        id: 'eq-303',
        title: 'Rotavator 6 Feet',
        category: 'ROTAVATOR',
        description: 'Heavy duty rotavator',
        pricePerDay: 1500.0,
        imageUrl: 'https://example.com/rot.jpg',
        ownerId: 'owner-1',
        available: true,
      );

      final updated = original.copyWith(
        title: 'Rotavator 7 Feet HD',
        pricePerDay: 1750.0,
        available: false,
      );

      expect(updated.id, 'eq-303');
      expect(updated.title, 'Rotavator 7 Feet HD');
      expect(updated.category, 'ROTAVATOR');
      expect(updated.description, 'Heavy duty rotavator');
      expect(updated.pricePerDay, 1750.0);
      expect(updated.available, false);
      expect(updated.imageUrl, 'https://example.com/rot.jpg');
      expect(updated.ownerId, 'owner-1');
    });
  });

  group('Phase 15: Equipment CRUD & In-Flight Mutex Behavior', () {
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

    test('createEquipment adds listing, refreshes dashboard and updates authoritative state', () async {
      final notifier = container.read(ownerProvider.notifier);

      final success = await notifier.createEquipment({
        'title': 'Sonalika DI 750 III',
        'category': 'TRACTOR',
        'pricePerDay': 2200.0,
        'description': 'High torque tractor',
        'location': 'Kurnool',
      });

      expect(success, true);
      expect(mockRepo.createCalls, 1);
      expect(notifier.state.myEquipment.length, 1);
      expect(notifier.state.myEquipment.first.title, 'Sonalika DI 750 III');
      expect(notifier.state.myEquipment.first.pricePerDay, 2200.0);
      expect(notifier.state.isLoading, false);
      expect(notifier.state.error, isNull);
    });

    test('createEquipment failure returns false and preserves server error message', () async {
      mockRepo.shouldThrowOnCreate = true;
      final notifier = container.read(ownerProvider.notifier);

      final success = await notifier.createEquipment({
        'title': 'Bad Equipment',
        'category': 'TRACTOR',
      });

      expect(success, false);
      expect(notifier.state.isLoading, false);
      expect(notifier.state.error, contains('Validation error'));
      expect(notifier.state.myEquipment, isEmpty);
    });

    test('updateEquipment modifies record and updates dashboard list', () async {
      mockRepo.mockEquipment = [
        Equipment(
          id: 'eq-1',
          title: 'Mahindra 475 DI',
          category: 'TRACTOR',
          description: 'Original description',
          pricePerDay: 1800.0,
          imageUrl: '',
          ownerId: 'owner-1',
          available: true,
        ),
      ];

      final notifier = container.read(ownerProvider.notifier);
      await notifier.fetchDashboardData();
      expect(notifier.state.myEquipment.length, 1);

      final success = await notifier.updateEquipment('eq-1', {
        'title': 'Mahindra 475 DI Upgraded',
        'pricePerDay': 2000.0,
      });

      expect(success, true);
      expect(mockRepo.updateCalls, 1);
      expect(notifier.state.myEquipment.first.title, 'Mahindra 475 DI Upgraded');
      expect(notifier.state.myEquipment.first.pricePerDay, 2000.0);
    });

    test('updateEquipment mutex prevents concurrent duplicate update calls on the same ID', () async {
      mockRepo.mockEquipment = [
        Equipment(
          id: 'eq-mutex-1',
          title: 'Power Tiller',
          category: 'POWER_TILLER',
          description: '',
          pricePerDay: 1200.0,
          imageUrl: '',
          ownerId: 'owner-1',
          available: true,
        ),
      ];

      final notifier = container.read(ownerProvider.notifier);
      await notifier.fetchDashboardData();

      // Launch two updates simultaneously
      final future1 = notifier.updateEquipment('eq-mutex-1', {'pricePerDay': 1300.0});
      final future2 = notifier.updateEquipment('eq-mutex-1', {'pricePerDay': 1400.0});

      final results = await Future.wait([future1, future2]);

      // Exactly one should succeed, second rejected by mutex
      expect(results.contains(true), true);
      expect(results.contains(false), true);
      expect(mockRepo.updateCalls, 1);
      expect(notifier.isEquipmentActionPending('eq-mutex-1'), false);
    });

    test('updateEquipmentAvailability toggles listing status with authoritative refresh', () async {
      mockRepo.mockEquipment = [
        Equipment(
          id: 'eq-avail-1',
          title: 'Sprayer Machine',
          category: 'SPRAYER',
          description: '',
          pricePerDay: 500.0,
          imageUrl: '',
          ownerId: 'owner-1',
          available: true,
        ),
      ];

      final notifier = container.read(ownerProvider.notifier);
      await notifier.fetchDashboardData();
      expect(notifier.state.myEquipment.first.available, true);

      final success = await notifier.updateEquipmentAvailability('eq-avail-1', false);
      expect(success, true);
      expect(notifier.state.myEquipment.first.available, false);
      expect(notifier.state.activeListingsCount, 0);
      expect(notifier.state.inactiveListingsCount, 1);
    });

    test('updateEquipmentAvailability mutex suppresses duplicate rapid toggles', () async {
      mockRepo.mockEquipment = [
        Equipment(
          id: 'eq-avail-mutex',
          title: 'Sprayer Machine',
          category: 'SPRAYER',
          description: '',
          pricePerDay: 500.0,
          imageUrl: '',
          ownerId: 'owner-1',
          available: true,
        ),
      ];

      final notifier = container.read(ownerProvider.notifier);
      await notifier.fetchDashboardData();

      final toggle1 = notifier.updateEquipmentAvailability('eq-avail-mutex', false);
      final toggle2 = notifier.updateEquipmentAvailability('eq-avail-mutex', true);

      final results = await Future.wait([toggle1, toggle2]);
      expect(results.contains(true), true);
      expect(results.contains(false), true);
      expect(notifier.isEquipmentActionPending('eq-avail-mutex'), false);
    });

    test('deleteEquipment removes listing on server success', () async {
      mockRepo.mockEquipment = [
        Equipment(
          id: 'eq-del-1',
          title: 'Old Thresher',
          category: 'THRESHER',
          description: '',
          pricePerDay: 1000.0,
          imageUrl: '',
          ownerId: 'owner-1',
          available: true,
        ),
      ];

      final notifier = container.read(ownerProvider.notifier);
      await notifier.fetchDashboardData();
      expect(notifier.state.myEquipment.length, 1);

      final success = await notifier.deleteEquipment('eq-del-1');
      expect(success, true);
      expect(mockRepo.deleteCalls, 1);
      expect(notifier.state.myEquipment, isEmpty);
      expect(notifier.state.totalEquipmentCount, 0);
    });

    test('deleteEquipment failure retains equipment locally and displays error', () async {
      mockRepo.shouldThrowOnDelete = true;
      mockRepo.mockEquipment = [
        Equipment(
          id: 'eq-del-fail',
          title: 'Booked Tractor',
          category: 'TRACTOR',
          description: '',
          pricePerDay: 2000.0,
          imageUrl: '',
          ownerId: 'owner-1',
          available: true,
        ),
      ];

      final notifier = container.read(ownerProvider.notifier);
      await notifier.fetchDashboardData();

      final success = await notifier.deleteEquipment('eq-del-fail');
      expect(success, false);
      expect(notifier.state.error, contains('Cannot delete equipment'));
      expect(notifier.state.myEquipment.length, 1);
      expect(notifier.isEquipmentActionPending('eq-del-fail'), false);
    });

    test('deleteEquipment mutex prevents rapid double-tap deletion requests', () async {
      mockRepo.mockEquipment = [
        Equipment(
          id: 'eq-del-double',
          title: 'Double Tap Test',
          category: 'TRACTOR',
          description: '',
          pricePerDay: 2000.0,
          imageUrl: '',
          ownerId: 'owner-1',
          available: true,
        ),
      ];

      final notifier = container.read(ownerProvider.notifier);
      await notifier.fetchDashboardData();

      final del1 = notifier.deleteEquipment('eq-del-double');
      final del2 = notifier.deleteEquipment('eq-del-double');

      final results = await Future.wait([del1, del2]);
      expect(results.contains(true), true);
      expect(results.contains(false), true);
      expect(mockRepo.deleteCalls, 1);
    });
  });

  group('Phase 15: Security, Role Guards & State Isolation', () {
    test('AppRouter prevents FARMER from accessing owner-only management routes', () {
      expect(AppRouter.testRoleRedirect(userRole: 'FARMER', targetPath: '/owner'), '/farmer');
      expect(AppRouter.testRoleRedirect(userRole: 'FARMER', targetPath: '/add-equipment'), '/farmer');
      expect(AppRouter.testRoleRedirect(userRole: 'FARMER', targetPath: '/edit-equipment'), '/farmer');
    });

    test('AppRouter permits OWNER to access management routes', () {
      expect(AppRouter.testRoleRedirect(userRole: 'OWNER', targetPath: '/owner'), isNull);
      expect(AppRouter.testRoleRedirect(userRole: 'OWNER', targetPath: '/add-equipment'), isNull);
      expect(AppRouter.testRoleRedirect(userRole: 'OWNER', targetPath: '/edit-equipment'), isNull);
    });

    test('OwnerState resets all equipment data and pending mutexes on logout', () {
      final mockRepo = MockOwnerRepository();
      mockRepo.mockEquipment = [
        Equipment(id: 'eq-sec-1', title: 'Private Tractor', category: 'TRACTOR', description: '', pricePerDay: 2000, imageUrl: '', ownerId: 'owner-A', available: true),
      ];

      final container = ProviderContainer(overrides: [
        ownerRepositoryProvider.overrideWithValue(mockRepo),
        authProvider.overrideWith((ref) => FakeAuthNotifier()),
        ownerProvider.overrideWith((ref) => OwnerNotifier(mockRepo, ref, autoFetch: false)),
      ]);

      final notifier = container.read(ownerProvider.notifier);
      notifier.state = OwnerState(
        myEquipment: mockRepo.mockEquipment,
        pendingEquipmentActions: {'eq-sec-1'},
      );
      expect(notifier.state.myEquipment.length, 1);
      expect(notifier.isEquipmentActionPending('eq-sec-1'), true);

      // Trigger reset
      notifier.reset();
      expect(notifier.state.myEquipment, isEmpty);
      expect(notifier.state.pendingEquipmentActions, isEmpty);
      expect(notifier.isEquipmentActionPending('eq-sec-1'), false);
      expect(notifier.state.totalEquipmentCount, 0);

      container.dispose();
    });

    test('Auth listener triggers reset on logout or user switch', () {
      final mockRepo = MockOwnerRepository();
      final fakeAuth = FakeAuthNotifier(AuthState(
        user: User(
          id: 'u-1',
          name: 'User 1',
          email: 'u1@example.com',
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
        myEquipment: [
          Equipment(id: 'eq-user-1', title: 'Tractor A', category: 'TRACTOR', description: '', pricePerDay: 2000, imageUrl: '', ownerId: 'u-1', available: true),
        ],
      );

      // Simulate logout
      fakeAuth.updateState(AuthState(user: null));
      expect(container.read(ownerProvider).myEquipment, isEmpty);

      container.dispose();
    });
  });

  group('Phase 15: Five-Language Localization Coverage', () {
    const requiredPhase15Keys = [
      'delete_equipment',
      'delete_equipment_confirm',
      'equipment_deleted_success',
      'equipment_added_success',
      'equipment_updated_success',
      'no_equipment_found_matching_filter',
      'clear_filters',
      'availability_updated',
      'failed_to_update_availability',
      'failed_to_delete_equipment',
      'failed_to_update_equipment',
      'failed_to_create_equipment',
      'enter_valid_title',
      'enter_valid_price',
      'deleting',
      'saving_equipment',
      'active_listing',
      'hidden_listing',
      'equipment_action_in_progress',
      'image_size_exceeded',
      'equipment_not_found',
      'return_to_fleet',
      'seeder',
      'plough',
    ];

    const languages = ['en', 'te', 'hi', 'ta', 'kn'];

    for (final lang in languages) {
      test('Language "$lang" provides all Phase 15 keys without falling back to raw key name', () {
        for (final key in requiredPhase15Keys) {
          final translated = AppLocalizations.get(key, lang);
          expect(translated, isNotEmpty, reason: 'Key "$key" should not be empty in "$lang"');
          expect(translated, isNot(equals(key)),
              reason: 'Key "$key" is missing in language "$lang" and fell back to raw key');
        }
      });
    }

    test('Indic languages use valid authentic native Unicode characters without mojibake', () {
      for (final lang in ['te', 'hi', 'ta', 'kn']) {
        final sample = AppLocalizations.get('delete_equipment', lang);
        expect(sample.codeUnits.any((code) => code > 127), isTrue,
            reason: 'Language "$lang" must use native non-ASCII characters');
        expect(sample, isNot(contains('Ã')),
            reason: 'Language "$lang" must not contain mojibake corruption');
      }
    });

    test('AppLocalizations.localizedEquipmentCategory translates SEEDER, PLOUGH and OTHER', () {
      for (final lang in languages) {
        final seeder = AppLocalizations.localizedEquipmentCategory('SEEDER', lang);
        final plough = AppLocalizations.localizedEquipmentCategory('PLOUGH', lang);
        final other = AppLocalizations.localizedEquipmentCategory('OTHER', lang);

        expect(seeder, isNotEmpty);
        expect(plough, isNotEmpty);
        expect(other, isNotEmpty);
      }
    });
  });

  group('Phase 15: Routing & Navigation Integration', () {
    test('Router registers /edit-equipment and /add-equipment routes', () {
      final routes = AppRouter.routes;
      final routePaths = routes.map((r) => (r as dynamic).path).toList();

      expect(routePaths.contains('/add-equipment'), true);
      expect(routePaths.contains('/edit-equipment'), true);
    });
  });
}
