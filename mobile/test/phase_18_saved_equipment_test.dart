import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile/core/api/api_client.dart';
import 'package:mobile/core/localization/app_localizations.dart';
import 'package:mobile/models/equipment.dart';
import 'package:mobile/models/user.dart';
import 'package:mobile/features/auth/providers/auth_provider.dart';
import 'package:mobile/features/marketplace/providers/saved_equipment_provider.dart';
import 'package:mobile/features/marketplace/ui/saved_equipment_screen.dart';
import 'package:mobile/features/marketplace/ui/widgets/equipment_card.dart';
import 'package:mobile/features/marketplace/ui/equipment_details_screen.dart';

class FakeApiClient implements ApiClient {
  final Dio _dio;
  FakeApiClient(this._dio);

  @override
  Dio get dio => _dio;

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class FakeAuthNotifier extends StateNotifier<AuthState> implements AuthNotifier {
  FakeAuthNotifier([AuthState? initial])
      : super(initial ??
            AuthState(
              user: User(
                id: 'farmer-test-1',
                name: 'Ramu Farmer',
                email: 'ramu@farmer.com',
                role: 'FARMER',
                preferredLanguage: 'en',
              ),
            ));

  @override
  void setUser(User? user) {
    state = state.copyWith(user: user);
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

Equipment createTestEquipment({
  String id = 'eq-101',
  String title = 'Mahindra 575 DI Tractor',
  String category = 'TRACTOR',
  double pricePerDay = 1500.0,
  bool available = true,
  String ownerId = 'owner-201',
}) {
  return Equipment(
    id: id,
    title: title,
    category: category,
    pricePerDay: pricePerDay,
    available: available,
    ownerId: ownerId,
    imageUrl: 'https://example.com/tractor.jpg',
    description: '45 HP high efficiency tractor for deep ploughing and haulage',
    location: 'Guntur, Andhra Pradesh',
    owner: User(
      id: ownerId,
      name: 'Venkata Rao',
      email: 'owner@example.com',
      role: 'OWNER',
      preferredLanguage: 'en',
    ),
  );
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Phase 18: Saved Equipment & Favorites Unit & State Tests', () {
    setUp(() async {
      SharedPreferences.setMockInitialValues({});
    });

    test('Initial State: empty list, empty set, not loading, no error', () {
      final notifier = SavedEquipmentNotifier(autoLoad: false);
      expect(notifier.state.items, isEmpty);
      expect(notifier.state.savedIds, isEmpty);
      expect(notifier.state.isLoading, isFalse);
      expect(notifier.state.error, isNull);
      expect(notifier.isSaved('eq-101'), isFalse);
    });

    test('Optimistic Save: toggleSave immediately inserts item and updates savedIds', () async {
      final dio = Dio();
      dio.interceptors.add(InterceptorsWrapper(
        onRequest: (options, handler) {
          if (options.path.contains('saved/eq-101')) {
            return handler.resolve(Response(
              requestOptions: options,
              data: {'success': true, 'saved': true},
              statusCode: 200,
            ));
          }
          return handler.next(options);
        },
      ));
      final apiClient = FakeApiClient(dio);
      final notifier = SavedEquipmentNotifier(apiClient: apiClient, autoLoad: false);

      final eq = createTestEquipment(id: 'eq-101');
      final future = notifier.toggleSave(eq);

      // Verify optimistic update immediately before future resolves
      expect(notifier.isSaved('eq-101'), isTrue);
      expect(notifier.state.items.length, 1);
      expect(notifier.state.items.first.id, 'eq-101');

      final result = await future;
      expect(result, isTrue);
      expect(notifier.isSaved('eq-101'), isTrue);
    });

    test('Optimistic Unsave: toggleSave immediately removes item from items and savedIds', () async {
      final dio = Dio();
      dio.interceptors.add(InterceptorsWrapper(
        onRequest: (options, handler) {
          if (options.path.contains('saved/eq-101')) {
            return handler.resolve(Response(
              requestOptions: options,
              data: {'success': true, 'saved': false},
              statusCode: 200,
            ));
          }
          return handler.next(options);
        },
      ));
      final apiClient = FakeApiClient(dio);
      final notifier = SavedEquipmentNotifier(apiClient: apiClient, autoLoad: false);

      final eq = createTestEquipment(id: 'eq-101');
      // Seed state as already saved
      notifier.state = notifier.state.copyWith(
        items: [eq],
        savedIds: {'eq-101'},
      );
      expect(notifier.isSaved('eq-101'), isTrue);

      final future = notifier.toggleSave(eq);

      // Verify optimistic removal
      expect(notifier.isSaved('eq-101'), isFalse);
      expect(notifier.state.items, isEmpty);

      final result = await future;
      expect(result, isFalse);
      expect(notifier.isSaved('eq-101'), isFalse);
    });

    test('Revert on Failure: when server returns error, state rolls back to previous state', () async {
      final dio = Dio();
      dio.interceptors.add(InterceptorsWrapper(
        onRequest: (options, handler) {
          if (options.path.contains('saved/eq-101')) {
            return handler.reject(DioException(
              requestOptions: options,
              response: Response(
                requestOptions: options,
                statusCode: 500,
                data: {'error': 'Internal server error'},
              ),
            ));
          }
          return handler.next(options);
        },
      ));
      final apiClient = FakeApiClient(dio);
      final notifier = SavedEquipmentNotifier(apiClient: apiClient, autoLoad: false);

      final eq = createTestEquipment(id: 'eq-101');
      expect(notifier.isSaved('eq-101'), isFalse);

      await expectLater(notifier.toggleSave(eq), throwsA(isA<DioException>()));

      // After rejection, state must be reverted to empty
      expect(notifier.isSaved('eq-101'), isFalse);
      expect(notifier.state.items, isEmpty);
    });

    test('Parsing Saved Equipment List: populates equipment and IDs correctly', () async {
      final dio = Dio();
      dio.interceptors.add(InterceptorsWrapper(
        onRequest: (options, handler) {
          if (options.path == 'saved') {
            return handler.resolve(Response(
              requestOptions: options,
              data: [
                {
                  'id': 'saved-rec-1',
                  'equipment': {
                    'id': 'eq-1',
                    'title': 'John Deere 5050D',
                    'category': 'TRACTORS',
                    'pricePerDay': 2000,
                    'available': true,
                    'ownerId': 'owner-1',
                    'imageUrl': 'https://example.com/jd.jpg',
                    'description': 'Heavy duty tractor',
                    'location': 'Kurnool',
                  }
                },
                {
                  'id': 'saved-rec-2',
                  'equipment': {
                    'id': 'eq-2',
                    'title': 'Kubota Paddy Harvester',
                    'category': 'HARVESTERS',
                    'pricePerDay': 4500,
                    'available': false,
                    'ownerId': 'owner-2',
                    'imageUrl': 'https://example.com/harvester.jpg',
                    'description': 'Grain harvester',
                    'location': 'Nellore',
                  }
                }
              ],
              statusCode: 200,
            ));
          }
          return handler.next(options);
        },
      ));
      final apiClient = FakeApiClient(dio);
      final notifier = SavedEquipmentNotifier(apiClient: apiClient, autoLoad: false);

      await notifier.loadSavedEquipment();

      expect(notifier.state.items.length, 2);
      expect(notifier.state.savedIds, containsAll(['eq-1', 'eq-2']));
      expect(notifier.isSaved('eq-1'), isTrue);
      expect(notifier.isSaved('eq-2'), isTrue);
      expect(notifier.state.items[0].available, isTrue);
      expect(notifier.state.items[1].available, isFalse); // preserves unavailable state accurately
    });

    test('Clear resets all saved items and pending state on logout', () {
      final notifier = SavedEquipmentNotifier(autoLoad: false);
      final eq = createTestEquipment(id: 'eq-101');
      notifier.state = notifier.state.copyWith(
        items: [eq],
        savedIds: {'eq-101'},
      );

      notifier.clear();

      expect(notifier.state.items, isEmpty);
      expect(notifier.state.savedIds, isEmpty);
      expect(notifier.isSaved('eq-101'), isFalse);
    });
  });

  group('Phase 18: SavedEquipmentScreen Widget Tests', () {
    testWidgets('Renders unauthenticated login prompt when user is null', (tester) async {
      final fakeAuth = FakeAuthNotifier(AuthState(user: null));
      final savedNotifier = SavedEquipmentNotifier(autoLoad: false);

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith((ref) => fakeAuth),
            savedEquipmentProvider.overrideWith((ref) => savedNotifier),
          ],
          child: const MaterialApp(
            home: SavedEquipmentScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.lock_outline_rounded), findsOneWidget);
      expect(find.text('Please sign in to save equipment to your favorites.'), findsOneWidget);
      expect(find.byType(ElevatedButton), findsOneWidget);
    });

    testWidgets('Renders empty state with marketplace button when list is empty', (tester) async {
      final fakeAuth = FakeAuthNotifier();
      final savedNotifier = SavedEquipmentNotifier(autoLoad: false);

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith((ref) => fakeAuth),
            savedEquipmentProvider.overrideWith((ref) => savedNotifier),
          ],
          child: const MaterialApp(
            home: SavedEquipmentScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.favorite_border_rounded), findsOneWidget);
      expect(find.text('No saved equipment yet.'), findsOneWidget);
      expect(find.text('Explore Marketplace'), findsOneWidget);
    });

    testWidgets('Renders error state with retry button when error occurs', (tester) async {
      final fakeAuth = FakeAuthNotifier();
      final savedNotifier = SavedEquipmentNotifier(autoLoad: false);
      savedNotifier.state = savedNotifier.state.copyWith(
        error: 'Unable to connect to server',
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith((ref) => fakeAuth),
            savedEquipmentProvider.overrideWith((ref) => savedNotifier),
          ],
          child: const MaterialApp(
            home: SavedEquipmentScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.error_outline), findsOneWidget);
      expect(find.text('Unable to connect to server'), findsOneWidget);
      expect(find.text('Retry'), findsOneWidget);
    });

    testWidgets('Renders list of EquipmentCards when saved items exist', (tester) async {
      final fakeAuth = FakeAuthNotifier();
      final savedNotifier = SavedEquipmentNotifier(autoLoad: false);
      final eq1 = createTestEquipment(id: 'eq-1', title: 'John Deere Tractor');
      final eq2 = createTestEquipment(id: 'eq-2', title: 'Paddy Harvester');

      savedNotifier.state = savedNotifier.state.copyWith(
        items: [eq1, eq2],
        savedIds: {'eq-1', 'eq-2'},
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith((ref) => fakeAuth),
            savedEquipmentProvider.overrideWith((ref) => savedNotifier),
          ],
          child: const MaterialApp(
            home: SavedEquipmentScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byType(EquipmentCard), findsNWidgets(2));
      expect(find.text('John Deere Tractor'), findsOneWidget);
      expect(find.text('Paddy Harvester'), findsOneWidget);
    });
  });

  group('Phase 18: EquipmentCard & Details Heart Button Tests', () {
    testWidgets('Heart button shows red filled icon when equipment is saved', (tester) async {
      final fakeAuth = FakeAuthNotifier();
      final savedNotifier = SavedEquipmentNotifier(autoLoad: false);
      final eq = createTestEquipment(id: 'eq-101');

      savedNotifier.state = savedNotifier.state.copyWith(
        items: [eq],
        savedIds: {'eq-101'},
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith((ref) => fakeAuth),
            savedEquipmentProvider.overrideWith((ref) => savedNotifier),
          ],
          child: MaterialApp(
            home: Scaffold(
              body: EquipmentCard(equipment: eq),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.favorite), findsOneWidget);
    });

    testWidgets('Heart button shows outline icon when equipment is unsaved', (tester) async {
      final fakeAuth = FakeAuthNotifier();
      final savedNotifier = SavedEquipmentNotifier(autoLoad: false);
      final eq = createTestEquipment(id: 'eq-101');

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith((ref) => fakeAuth),
            savedEquipmentProvider.overrideWith((ref) => savedNotifier),
          ],
          child: MaterialApp(
            home: Scaffold(
              body: EquipmentCard(equipment: eq),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.favorite_border), findsOneWidget);
    });

    testWidgets('Heart button shows login snackbar when user is unauthenticated', (tester) async {
      final fakeAuth = FakeAuthNotifier(AuthState(user: null));
      final savedNotifier = SavedEquipmentNotifier(autoLoad: false);
      final eq = createTestEquipment(id: 'eq-101');

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith((ref) => fakeAuth),
            savedEquipmentProvider.overrideWith((ref) => savedNotifier),
          ],
          child: MaterialApp(
            home: Scaffold(
              body: EquipmentCard(equipment: eq),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Tap the heart icon
      await tester.tap(find.byIcon(Icons.favorite_border));
      await tester.pump();

      expect(find.text('Please sign in to save equipment to your favorites.'), findsOneWidget);
      expect(savedNotifier.isSaved('eq-101'), isFalse);
    });

    testWidgets('Details screen favorite action displays correct icon and guards auth', (tester) async {
      final fakeAuth = FakeAuthNotifier(AuthState(user: null));
      final savedNotifier = SavedEquipmentNotifier(autoLoad: false);
      final eq = createTestEquipment(id: 'eq-101');

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith((ref) => fakeAuth),
            savedEquipmentProvider.overrideWith((ref) => savedNotifier),
          ],
          child: MaterialApp(
            home: EquipmentDetailsScreen(equipment: eq),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Tap favorite in AppBar
      await tester.tap(find.byIcon(Icons.favorite_border));
      await tester.pump();

      expect(find.text('Please sign in to save equipment to your favorites.'), findsOneWidget);
    });
  });

  group('Phase 18: 5-Language Localization Verification', () {
    final languages = ['en', 'te', 'hi', 'ta', 'kn'];
    final requiredKeys = [
      'saved_equipment',
      'saved_equipment_subtitle',
      'no_saved_equipment',
      'no_saved_equipment_subtitle',
      'saved_to_favorites',
      'removed_from_favorites',
      'failed_to_update_favorite',
      'please_login_to_save',
      'explore_marketplace',
    ];

    for (final lang in languages) {
      test('Language [$lang] contains all 9 Phase 18 keys with non-empty translation', () {
        for (final key in requiredKeys) {
          final translated = AppLocalizations.get(key, lang);
          expect(translated, isNotEmpty, reason: 'Key "$key" in "$lang" must not be empty');
          expect(translated, isNot(equals(key)), reason: 'Key "$key" in "$lang" was not found in dictionary');
        }
      });
    }

    test('All 5 languages have unique localized titles for saved_equipment', () {
      final titles = languages.map((lang) => AppLocalizations.get('saved_equipment', lang)).toSet();
      // en, te, hi, ta, kn must each produce distinct localized text
      expect(titles.length, 5);
    });
  });
}
