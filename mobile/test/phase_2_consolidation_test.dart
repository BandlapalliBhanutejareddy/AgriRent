import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/config/environment.dart';
import 'package:mobile/core/localization/app_localizations.dart';
import 'package:mobile/features/admin/ui/admin_dashboard_screen.dart';
import 'package:mobile/features/auth/providers/auth_provider.dart';
import 'package:mobile/features/farm/models/farm_model.dart';
import 'package:mobile/features/farm/providers/farm_provider.dart';
import 'package:mobile/features/marketplace/providers/marketplace_provider.dart';
import 'package:mobile/features/marketplace/ui/farmer_main_screen.dart';
import 'package:mobile/features/marketplace/ui/farmer_marketplace_screen.dart';
import 'package:mobile/features/marketplace/ui/my_rentals_screen.dart';
import 'package:mobile/features/notifications/providers/notification_provider.dart';
import 'package:mobile/features/profile/providers/owner_provider.dart';
import 'package:mobile/features/profile/ui/owner_main_screen.dart';
import 'package:mobile/features/weather/providers/weather_provider.dart';
import 'package:mobile/models/booking.dart';
import 'package:mobile/models/user.dart';
import 'package:mobile/routing/router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide User, AuthState;

class FakeAuthNotifier extends StateNotifier<AuthState> implements AuthNotifier {
  FakeAuthNotifier(super.initial);

  void updateState(AuthState next) => state = next;

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class FakeLanguageNotifier extends StateNotifier<String> implements LanguageNotifier {
  FakeLanguageNotifier([super.lang = 'en']);

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class FakeUnreadCountNotifier extends StateNotifier<int> implements UnreadCountNotifier {
  FakeUnreadCountNotifier([super.initial = 0]);

  @override
  Future<void> refresh() async {}

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class FakeOwnerNotifier extends StateNotifier<OwnerState> implements OwnerNotifier {
  FakeOwnerNotifier() : super(OwnerState());

  @override
  Future<void> fetchDashboardData() async {}

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class FakeWeatherNotifier extends StateNotifier<WeatherState> implements WeatherNotifier {
  FakeWeatherNotifier() : super(WeatherState());

  @override
  Future<void> fetchWeather({bool requestGpsIfUnavailable = false}) async {}

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class FakeMarketplaceNotifier extends StateNotifier<MarketplaceState> implements MarketplaceNotifier {
  FakeMarketplaceNotifier() : super(MarketplaceState());

  @override
  Future<void> fetchInitial({String? category}) async {}

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class FakeFarmNotifier extends StateNotifier<FarmState> implements FarmNotifier {
  FakeFarmNotifier() : super(FarmState());

  @override
  Future<void> fetchFarms() => Completer<void>().future;

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    SharedPreferences.setMockInitialValues({});
    await Supabase.initialize(
      url: Environment.supabaseUrl,
      // ignore: deprecated_member_use
      anonKey: Environment.supabaseAnonKey,
    );
  });

  group('Phase 2 - Multi-Field Farm Experience & State Persistence', () {
    final mockCrop1 = FarmCropModel(
      id: 'crop_01',
      farmId: 'farm_01',
      cropName: 'Paddy (Rice)',
      season: 'KHARIF',
      stage: 'GROWING',
      status: 'ACTIVE',
    );

    final mockCrop2 = FarmCropModel(
      id: 'crop_02',
      farmId: 'farm_02',
      cropName: 'Groundnut',
      season: 'RABI',
      stage: 'SEEDLING',
      status: 'ACTIVE',
    );

    final farm1 = FarmModel(
      id: 'farm_01',
      ownerId: 'farmer_user_1',
      name: 'North Field',
      location: 'Madanapalle, AP',
      area: 3.5,
      areaUnit: 'ACRE',
      soilType: 'RED_LOAMY',
      crops: [mockCrop1],
      cropsCount: 1,
    );

    final farm2 = FarmModel(
      id: 'farm_02',
      ownerId: 'farmer_user_1',
      name: 'South Orchard',
      location: 'Punganur, AP',
      area: 5.0,
      areaUnit: 'ACRE',
      soilType: 'BLACK_COTTON',
      crops: [mockCrop2],
      cropsCount: 1,
    );

    test('Zero farm state returns null selectedFarm without crashing', () {
      final state = FarmState(farms: []);
      expect(state.selectedFarm, isNull, reason: 'Empty farms list must have null selectedFarm');
      expect(state.selectedFarmId, isNull);
    });

    test('Multiple farms: selectedFarm defaults to first farm if no explicit ID set', () {
      final state = FarmState(farms: [farm1, farm2]);
      expect(state.selectedFarm, isNotNull);
      expect(state.selectedFarm!.id, equals('farm_01'));
      expect(state.selectedFarm!.name, equals('North Field'));
    });

    test('Multiple farms: selectedFarm resolves explicitly selected farm by ID', () {
      final state = FarmState(
        farms: [farm1, farm2],
        selectedFarmId: 'farm_02',
      );
      expect(state.selectedFarm, isNotNull);
      expect(state.selectedFarm!.id, equals('farm_02'));
      expect(state.selectedFarm!.name, equals('South Orchard'));
    });

    test('Multiple farms: falls back gracefully to first farm if selectedFarmId is invalid', () {
      final state = FarmState(
        farms: [farm1, farm2],
        selectedFarmId: 'non_existent_id',
      );
      expect(state.selectedFarm, isNotNull);
      expect(state.selectedFarm!.id, equals('farm_01'));
    });

    test('selectFarm updates state and persists selection scoped to authenticated user', () async {
      SharedPreferences.setMockInitialValues({});
      final mockUser = User(
        id: 'usr_farmer_99',
        name: 'Ramesh Reddy',
        email: 'ramesh@agrirent.ai',
        role: 'FARMER',
        preferredLanguage: 'en',
      );

      final container = ProviderContainer(
        overrides: [
          authProvider.overrideWith((ref) => FakeAuthNotifier(
                AuthState(user: mockUser),
              )),
        ],
      );

      final notifier = container.read(farmProvider.notifier);
      // Manually set initial farms in notifier state
      notifier.state = FarmState(farms: [farm1, farm2], selectedFarmId: 'farm_01');

      expect(notifier.state.selectedFarm?.id, equals('farm_01'));

      // Switch to farm_02
      await notifier.selectFarm('farm_02');

      expect(notifier.state.selectedFarmId, equals('farm_02'));
      expect(notifier.state.selectedFarm?.id, equals('farm_02'));

      // Verify persistence in SharedPreferences with user-scoped key
      final prefs = await SharedPreferences.getInstance();
      final persistedKey = 'selected_farm_id_${mockUser.id}';
      expect(prefs.getString(persistedKey), equals('farm_02'));
    });

    test('Logout/account switch cleanly clears in-memory farm state to isolate user data', () {
      final userA = User(id: 'user_A', name: 'Farmer A', email: 'a@a.com', role: 'FARMER', preferredLanguage: 'en');
      final userB = User(id: 'user_B', name: 'Farmer B', email: 'b@b.com', role: 'FARMER', preferredLanguage: 'en');

      final authNotifier = FakeAuthNotifier(
        AuthState(user: userA),
      );

      final container = ProviderContainer(
        overrides: [
          authProvider.overrideWith((ref) => authNotifier),
        ],
      );

      final farmNotifier = container.read(farmProvider.notifier);
      farmNotifier.state = FarmState(farms: [farm1, farm2], selectedFarmId: 'farm_01');
      expect(farmNotifier.state.farms.isNotEmpty, isTrue);

      // Trigger user switch in authProvider
      authNotifier.updateState(AuthState(user: userB));

      // FarmNotifier listener should reset state
      expect(farmNotifier.state.farms.isEmpty, isTrue, reason: 'Farms must be cleared on user account switch');
      expect(farmNotifier.state.selectedFarmId, isNull);
    });
  });

  group('Phase 2 - Role Navigation Structure & Preservation', () {
    testWidgets('FarmerMainScreen defines 5 primary destinations with Marketplace at tab 2', (WidgetTester tester) async {
      final container = ProviderContainer(
        overrides: [
          languageProvider.overrideWith((ref) => FakeLanguageNotifier('en')),
          unreadNotificationsCountProvider.overrideWith((ref) => FakeUnreadCountNotifier(0)),
          weatherProvider.overrideWith((ref, farmId) => FakeWeatherNotifier()),
          marketplaceProvider.overrideWith((ref) => FakeMarketplaceNotifier()),
          farmProvider.overrideWith((ref) => FakeFarmNotifier()),
          myRentalsProvider.overrideWith((ref) async => <Booking>[]),
        ],
      );

      try {
        await tester.pumpWidget(
          UncontrolledProviderScope(
            container: container,
            child: const MaterialApp(
              home: FarmerMainScreen(),
            ),
          ),
        );

        // Verify NavigationBar has 5 destinations
        final navBarFinder = find.byType(NavigationBar);
        expect(navBarFinder, findsOneWidget);

        final navBar = tester.widget<NavigationBar>(navBarFinder);
        expect(navBar.destinations.length, equals(5), reason: 'Farmer navigation must have exactly 5 destinations');

        // Verify IndexedStack preserves screens
        final indexedStackFinder = find.byType(IndexedStack);
        expect(indexedStackFinder, findsOneWidget);
        final indexedStack = tester.widget<IndexedStack>(indexedStackFinder);
        expect(indexedStack.children.length, equals(5));

        // Verify tab 2 is FarmerMarketplaceScreen
        expect(indexedStack.children[2], isA<FarmerMarketplaceScreen>());

        await tester.pumpWidget(const SizedBox());
      } finally {
        container.dispose();
      }
    });

    testWidgets('OwnerMainScreen defines 4 primary destinations and removed dead communication tab', (WidgetTester tester) async {
      final container = ProviderContainer(
        overrides: [
          languageProvider.overrideWith((ref) => FakeLanguageNotifier('en')),
          unreadNotificationsCountProvider.overrideWith((ref) => FakeUnreadCountNotifier(0)),
          ownerProvider.overrideWith((ref) => FakeOwnerNotifier()),
        ],
      );

      try {
        await tester.pumpWidget(
          UncontrolledProviderScope(
            container: container,
            child: const MaterialApp(
              home: OwnerMainScreen(),
            ),
          ),
        );

        final navBarFinder = find.byType(NavigationBar);
        expect(navBarFinder, findsOneWidget);

        final navBar = tester.widget<NavigationBar>(navBarFinder);
        expect(navBar.destinations.length, equals(4), reason: 'Owner navigation must have exactly 4 destinations (Home, Equipment, Bookings, More)');

        final indexedStackFinder = find.byType(IndexedStack);
        expect(indexedStackFinder, findsOneWidget);
        final indexedStack = tester.widget<IndexedStack>(indexedStackFinder);
        expect(indexedStack.children.length, equals(4));

        await tester.pumpWidget(const SizedBox());
        await tester.pump(const Duration(seconds: 1));
      } finally {
        container.dispose();
      }
    });

    testWidgets('AdminDashboardScreen uses PopScope and IndexedStack for state preservation', (WidgetTester tester) async {
      final container = ProviderContainer(
        overrides: [
          languageProvider.overrideWith((ref) => FakeLanguageNotifier('en')),
          adminStatsProvider.overrideWith((ref) async => <String, dynamic>{}),
          adminUsersProvider.overrideWith((ref) async => <dynamic>[]),
          adminAlertsProvider.overrideWith((ref) async => <String, dynamic>{}),
          adminHealthProvider.overrideWith((ref) async => <dynamic>[]),
          adminDataQualityProvider.overrideWith((ref) async => <dynamic>[]),
          adminEquipmentProvider.overrideWith((ref) async => <dynamic>[]),
          adminBookingsProvider.overrideWith((ref) async => <dynamic>[]),
          adminAuditLogsProvider.overrideWith((ref) async => <dynamic>[]),
        ],
      );

      try {
        await tester.pumpWidget(
          UncontrolledProviderScope(
            container: container,
            child: const MaterialApp(
              home: AdminDashboardScreen(),
            ),
          ),
        );

        // Verify PopScope wrapper via widget predicate
        expect(find.byWidgetPredicate((w) => w is PopScope), findsOneWidget);

        // Verify IndexedStack for 5 tabs
        final indexedStackFinder = find.byType(IndexedStack);
        expect(indexedStackFinder, findsOneWidget);
        final indexedStack = tester.widget<IndexedStack>(indexedStackFinder);
        expect(indexedStack.children.length, equals(5), reason: 'Admin dashboard must have 5 tabs preserved in IndexedStack');

        await tester.pumpWidget(const SizedBox());
      } finally {
        container.dispose();
      }
    });
  });

  group('Phase 2 - Strict Role-Based Route Guards', () {
    test('OWNER role is strictly blocked from all Farmer-only routes', () {
      const farmerRoutes = [
        '/farmer',
        '/farm',
        '/farm-plan',
        '/farm-setup',
        '/crop-lifecycle',
        '/stage-details',
        '/operations',
        '/operation-detail',
        '/crop-advisor',
        '/advisor',
        '/farm-copilot',
        '/ai-assistant',
      ];

      for (final route in farmerRoutes) {
        final redirect = AppRouter.testRoleRedirect(userRole: 'OWNER', targetPath: route);
        expect(
          redirect,
          equals('/owner'),
          reason: 'OWNER must be redirected to /owner when accessing $route',
        );
      }
    });

    test('FARMER role is strictly blocked from Owner-only routes', () {
      const ownerRoutes = [
        '/owner',
        '/add-equipment',
        '/edit-equipment',
        '/payments-received',
      ];

      for (final route in ownerRoutes) {
        final redirect = AppRouter.testRoleRedirect(userRole: 'FARMER', targetPath: route);
        expect(
          redirect,
          equals('/farmer'),
          reason: 'FARMER must be redirected to /farmer when accessing $route',
        );
      }
    });

    test('Non-owner role accessing /owner routes redirects to /farmer', () {
      final redirect = AppRouter.testRoleRedirect(userRole: 'FARMER', targetPath: '/owner');
      expect(redirect, equals('/farmer'));
    });

    test('Non-admin role accessing /admin routes redirects to role home', () {
      final farmerRedirect = AppRouter.testRoleRedirect(userRole: 'FARMER', targetPath: '/admin');
      expect(farmerRedirect, equals('/farmer'));

      final ownerRedirect = AppRouter.testRoleRedirect(userRole: 'OWNER', targetPath: '/admin');
      expect(ownerRedirect, equals('/owner'));
    });
  });

  group('Phase 2 - AI Copilot Canonical Integration', () {
    test('Router defines canonical /farm-copilot and /ai-assistant routes', () {
      final routes = AppRouter.router.configuration.routes;
      final paths = <String>[];
      void collectPaths(List<dynamic> routeList) {
        for (final route in routeList) {
          if (route.path != null) {
            paths.add(route.path);
          }
          if (route.routes != null && route.routes.isNotEmpty) {
            collectPaths(route.routes);
          }
        }
      }
      collectPaths(routes);

      expect(paths.contains('/farm-copilot'), isTrue, reason: '/farm-copilot must be registered');
      expect(paths.contains('/ai-assistant'), isTrue, reason: '/ai-assistant must be registered');
    });

    test('Farm Copilot query params farmId and cropId parse correctly', () {
      final uri = Uri.parse('/farm-copilot?farmId=farm_test_99&cropId=crop_test_44');
      expect(uri.queryParameters['farmId'], equals('farm_test_99'));
      expect(uri.queryParameters['cropId'], equals('crop_test_44'));
    });

    test('AI Assistant query parameter parses from URI correctly', () {
      final uri = Uri.parse('/ai-assistant?query=Pest%20Management%20Tips');
      expect(uri.queryParameters['query'], equals('Pest Management Tips'));
    });
  });

  group('Phase 2 - 5-Language Authentic Localization', () {
    const phase2Keys = [
      'my_farm',
      'select_farm',
      'switch_field',
      'no_farm_added',
      'set_up_farm',
      'edit',
      'farm_plan_operations',
      'farm_copilot',
    ];

    const supportedLanguages = ['en', 'te', 'hi', 'ta', 'kn'];

    for (final lang in supportedLanguages) {
      test('Language "$lang" provides authentic translations for all Phase 2 keys without fallback', () {
        for (final key in phase2Keys) {
          final translated = key.tr(lang);
          expect(translated, isNotEmpty);
          expect(
            translated,
            isNot(equals(key)),
            reason: 'Key "$key" should have an authentic translation in "$lang" rather than returning the raw key.',
          );
        }
      });
    }
  });

  group('Phase 2 - Screen Cleanup Verification', () {
    test('All 5 orphaned prototype screens are permanently deleted from mobile/lib', () {
      const deletedScreens = [
        'lib/features/marketplace/ui/farmer_dashboard_screen.dart',
        'lib/features/marketplace/ui/farmer_hub_screen.dart',
        'lib/features/profile/ui/profile_screen.dart',
        'lib/features/profile/ui/owner_home_placeholder_screen.dart',
        'lib/features/profile/ui/owner_dashboard_screen.dart',
      ];

      for (final relPath in deletedScreens) {
        final file = File(relPath);
        expect(
          file.existsSync(),
          isFalse,
          reason: '$relPath was an orphaned prototype screen and must be removed.',
        );
      }
    });
  });
}

