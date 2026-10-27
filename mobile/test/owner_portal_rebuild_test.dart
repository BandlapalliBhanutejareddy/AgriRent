import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/constants/agricultural_catalog.dart';
import 'package:mobile/core/localization/app_localizations.dart';
import 'package:mobile/core/services/voice_service.dart';
import 'package:mobile/models/equipment.dart';
import 'package:mobile/models/booking.dart';
import 'package:mobile/models/user.dart';
import 'package:mobile/features/profile/providers/owner_provider.dart';
import 'package:mobile/features/profile/repository/owner_repository.dart';
import 'package:mobile/features/auth/providers/auth_provider.dart';
import 'package:mobile/features/profile/ui/owner_main_screen.dart';

class FakeAuthNotifier extends StateNotifier<AuthState> implements AuthNotifier {
  final bool isSuspended;
  FakeAuthNotifier({this.isSuspended = false})
      : super(AuthState(
          user: User(
            id: 'owner11',
            name: 'Teja Reddy',
            email: 'owner11@gmail.com',
            role: 'OWNER',
            preferredLanguage: 'en',
            isSuspended: isSuspended,
          ),
        ));

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class MockOwnerRepo implements OwnerRepository {
  List<Equipment> mockEquipment = [
    Equipment(
      id: 'eq-cat-1',
      title: 'Tractor 50HP',
      category: 'TRACTORS_AND_POWER_UNITS',
      description: 'Power unit',
      pricePerDay: 2000,
      imageUrl: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9',
      ownerId: 'owner11',
      available: true,
      location: 'Guntur',
    ),
    Equipment(
      id: 'eq-cat-2',
      title: 'Drip System',
      category: 'IRRIGATION_EQUIPMENT',
      description: 'Drip lines',
      pricePerDay: 800,
      imageUrl: 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0',
      ownerId: 'owner11',
      available: false,
      location: 'Tenali',
    ),
  ];

  List<Booking> mockBookings = [
    Booking(
      id: 'b-rebuild-1',
      farmerId: 'farmer-ravi',
      equipmentId: 'eq-cat-1',
      startDate: DateTime.now().add(const Duration(days: 2)),
      endDate: DateTime.now().add(const Duration(days: 4)),
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      totalPrice: 4000.0,
      equipment: Equipment(
        id: 'eq-cat-1',
        title: 'Tractor 50HP',
        category: 'TRACTORS_AND_POWER_UNITS',
        description: '',
        pricePerDay: 2000,
        imageUrl: '',
        ownerId: 'owner11',
        available: true,
      ),
      farmer: User(
        id: 'farmer-ravi',
        name: 'Ravi Kumar',
        email: 'ravi@gmail.com',
        role: 'FARMER',
        preferredLanguage: 'en',
      ),
    ),
  ];

  @override
  Future<List<Equipment>> fetchMyEquipment() async => mockEquipment;

  @override
  Future<List<Booking>> fetchOwnerBookings() async => mockBookings;

  @override
  Future<Map<String, dynamic>> fetchAnalytics() async => {
        'totalBookings': 1,
        'revenue': 4000.0,
      };

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  group('Owner Portal Rebuild Tests', () {
    test('Agricultural Catalog contains all 14 categories with items and images', () {
      expect(AgriculturalCatalog.categories.length, equals(14));
      
      final expectedCategoryIds = [
        'TRACTORS_AND_POWER_UNITS',
        'LAND_PREPARATION',
        'SEEDING_AND_PLANTING',
        'CROP_CARE_AND_INTERCULTURE',
        'IRRIGATION_EQUIPMENT',
        'HARVESTING_EQUIPMENT',
        'THRESHING_AND_POST_HARVEST',
        'MATERIAL_HANDLING_AND_TRANSPORT',
        'SOIL_TESTING_AND_TOOLS',
        'CROP_PROCESSING',
        'STORAGE_EQUIPMENT',
        'HAND_TOOLS',
        'SPECIALIZED_CROP_EQUIPMENT',
        'SAFETY_AND_ACCESSORIES',
      ];

      for (final catId in expectedCategoryIds) {
        final cat = AgriculturalCatalog.categories.where((c) => c.id == catId).firstOrNull;
        expect(cat, isNotNull, reason: 'Category $catId must exist in AgriculturalCatalog');
        expect(cat!.name.isNotEmpty, isTrue);

        final items = AgriculturalCatalog.getItemsForCategory(catId);
        expect(items.isNotEmpty, isTrue, reason: 'Category $catId must have catalog items');
        for (final item in items) {
          expect(item.defaultImageUrl.startsWith('http'), isTrue);
          expect(item.defaultPricePerDay, greaterThan(0));
        }
      }
    });

    test('Voice Service supports all 5 languages with locale mapping', () {
      final voice = VoiceService();
      expect(voice.getLocaleForLanguage('en'), equals('en_IN'));
      expect(voice.getLocaleForLanguage('te'), equals('te_IN'));
      expect(voice.getLocaleForLanguage('hi'), equals('hi_IN'));
      expect(voice.getLocaleForLanguage('ta'), equals('ta_IN'));
      expect(voice.getLocaleForLanguage('kn'), equals('kn_IN'));
    });

    test('Localization contains 5-language keys for restricted account and catalog', () {
      for (final lang in ['en', 'te', 'hi', 'ta', 'kn']) {
        expect('account_restricted'.tr(lang).isNotEmpty, isTrue);
        expect('account_restricted_explanation'.tr(lang).isNotEmpty, isTrue);
        expect('submit_resolution_request'.tr(lang).isNotEmpty, isTrue);
        expect('catalog_image'.tr(lang).isNotEmpty, isTrue);
      }
    });

    testWidgets('Owner Portal renders 14-category equipment and bookings with voice search icons', (tester) async {
      final mockRepo = MockOwnerRepo();
      final container = ProviderContainer(overrides: [
        ownerRepositoryProvider.overrideWithValue(mockRepo),
        authProvider.overrideWith((ref) => FakeAuthNotifier(isSuspended: false)),
        ownerProvider.overrideWith((ref) => OwnerNotifier(mockRepo, ref, autoFetch: false)),
      ]);

      container.read(ownerProvider.notifier).state = OwnerState(
        myEquipment: mockRepo.mockEquipment,
        bookings: mockRepo.mockBookings,
        analytics: {'totalBookings': 1, 'revenue': 4000.0},
      );

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: OwnerMainScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Tap Equipment Tab
      await tester.tap(find.byIcon(Icons.agriculture_outlined));
      await tester.pumpAndSettle();

      // Check equipment cards & microphone voice icon
      expect(find.text('Fleet Management'), findsOneWidget);
      expect(find.text('Tractor 50HP'), findsOneWidget);
      expect(find.text('Drip System'), findsOneWidget);
      expect(find.byIcon(Icons.mic_rounded), findsWidgets);

      // Tap Bookings Tab
      await tester.tap(find.byIcon(Icons.receipt_long_outlined));
      await tester.pumpAndSettle();

      // Check booking card with real farmer display name
      expect(find.text('Booking Details'), findsOneWidget);
      expect(find.text('Tractor 50HP'), findsOneWidget);
      expect(find.text('Ravi Kumar'), findsOneWidget);
      expect(find.text('₹4000'), findsOneWidget);
    });

    testWidgets('Suspended owner account renders Restricted Account screen', (tester) async {
      final mockRepo = MockOwnerRepo();
      final container = ProviderContainer(overrides: [
        ownerRepositoryProvider.overrideWithValue(mockRepo),
        authProvider.overrideWith((ref) => FakeAuthNotifier(isSuspended: true)),
        ownerProvider.overrideWith((ref) => OwnerNotifier(mockRepo, ref, autoFetch: false)),
      ]);

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: OwnerMainScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Should render Account Restricted screen instead of normal dashboard
      expect(find.text('Account Restricted'), findsWidgets);
      expect(find.byIcon(Icons.gavel_rounded), findsOneWidget);
      expect(find.text('Submit Resolution Request'), findsOneWidget);
    });
  });
}
