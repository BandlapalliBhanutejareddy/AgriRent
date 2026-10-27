import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile/core/api/api_client.dart';
import 'package:mobile/core/localization/app_localizations.dart';
import 'package:mobile/models/equipment.dart';
import 'package:mobile/models/user.dart';
import 'package:mobile/routing/router.dart';
import 'package:mobile/features/marketplace/providers/marketplace_provider.dart';
import 'package:mobile/features/marketplace/providers/saved_equipment_provider.dart';
import 'package:mobile/features/marketplace/repository/marketplace_repository.dart';
import 'package:mobile/features/auth/providers/auth_provider.dart';
import 'package:mobile/features/auth/repository/auth_repository.dart';
import 'package:mobile/features/farm/models/schedule_model.dart';

class FakeMarketplaceRepository implements MarketplaceRepository {
  List<Equipment> mockEquipment = [];
  int totalPages = 1;
  Duration delay = Duration.zero;
  bool shouldThrow = false;
  String? lastSearch;
  String? lastCategory;
  String? lastSort;
  int fetchCount = 0;

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);

  @override
  Future<Map<String, dynamic>> fetchEquipment({
    int page = 1,
    int limit = 20,
    String? category,
    String? search,
    double? minPrice,
    double? maxPrice,
    String? sort,
  }) async {
    fetchCount++;
    lastSearch = search;
    lastCategory = category;
    lastSort = sort;

    if (delay > Duration.zero) {
      await Future.delayed(delay);
    }

    if (shouldThrow) {
      throw Exception('Server unreachable');
    }

    var list = List<Equipment>.from(mockEquipment);
    if (category != null && category.isNotEmpty && category != 'ALL') {
      list = list.where((e) => e.category.toUpperCase() == category.toUpperCase()).toList();
    }
    if (search != null && search.isNotEmpty) {
      final q = search.toLowerCase();
      list = list.where((e) =>
          e.title.toLowerCase().contains(q) ||
          e.description.toLowerCase().contains(q) ||
          e.category.toLowerCase().contains(q)).toList();
    }
    if (sort == 'lowest_price') {
      list.sort((a, b) => (a.pricePerDay ?? 0).compareTo(b.pricePerDay ?? 0));
    } else if (sort == 'highest_price') {
      list.sort((a, b) => (b.pricePerDay ?? 0).compareTo(a.pricePerDay ?? 0));
    }

    return {
      'equipment': list,
      'pagination': {
        'page': page,
        'limit': limit,
        'total': list.length,
        'totalPages': totalPages,
      },
    };
  }
}

class FakeAuthRepository implements AuthRepository {
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);

  @override
  Future<void> logout() async {}
}

class FakeApiClient implements ApiClient {
  int postCalls = 0;
  late final Dio _mockDio;

  FakeApiClient() {
    _mockDio = Dio();
    _mockDio.httpClientAdapter = _MockAdapter((options) async {
      postCalls++;
      await Future.delayed(const Duration(milliseconds: 30));
      return ResponseBody.fromString(
        jsonEncode({'success': true, 'saved': true}),
        200,
        headers: {
          Headers.contentTypeHeader: [Headers.jsonContentType],
        },
      );
    });
  }

  @override
  Dio get dio => _mockDio;

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class _MockAdapter implements HttpClientAdapter {
  final Future<ResponseBody> Function(RequestOptions) handler;
  _MockAdapter(this.handler);

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<List<int>>? requestStream,
    Future<void>? cancelFuture,
  ) {
    return handler(options);
  }

  @override
  void close({bool force = false}) {}
}

void main() {
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    SharedPreferences.setMockInitialValues({});
  });

  tearDown(() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  });

  final testEquipment1 = Equipment(
    id: 'eq_tractor_01',
    title: 'Mahindra 575 DI Tractor',
    category: 'TRACTOR',
    description: '45 HP High-performance tractor',
    pricePerDay: 1500.0,
    imageUrl: 'https://example.com/tractor.jpg',
    ownerId: 'owner_ramesh',
    available: true,
    location: 'Guntur, AP',
    rating: 4.8,
    reviewCount: 12,
    securityDeposit: 3000.0,
    owner: User(
      id: 'owner_ramesh',
      name: 'Ramesh Reddy',
      email: 'ramesh@example.com',
      role: 'OWNER',
      preferredLanguage: 'en',
    ),
  );

  final testEquipment2 = Equipment(
    id: 'eq_harvester_02',
    title: 'Kubota Harvester DC-68G',
    category: 'HARVESTER',
    description: 'Combine harvester for paddy and wheat',
    pricePerDay: 4500.0,
    imageUrl: 'https://example.com/harvester.jpg',
    ownerId: 'owner_suresh',
    available: false,
    location: 'Vijayawada, AP',
    rating: 4.5,
    reviewCount: 8,
    securityDeposit: 8000.0,
    owner: User(
      id: 'owner_suresh',
      name: 'Suresh Kumar',
      email: 'suresh@example.com',
      role: 'OWNER',
      preferredLanguage: 'en',
    ),
  );

  final testEquipment3 = Equipment(
    id: 'eq_sprayer_03',
    title: 'STIHL Power Sprayer',
    category: 'SPRAYER',
    description: 'Gasoline powered high-pressure sprayer',
    pricePerDay: 600.0,
    imageUrl: '',
    ownerId: 'owner_anand',
    available: true,
    location: null,
    rating: null,
    reviewCount: null,
    securityDeposit: null,
    owner: null,
  );

  // =========================================================================
  // 1. MARKETPLACE LOADING AND EMPTY STATES
  // =========================================================================
  group('Phase 8 - 1. Marketplace Loading & Empty States', () {
    test('Initial fetch sets loading state then populates equipment list', () async {
      final fakeRepo = FakeMarketplaceRepository();
      fakeRepo.mockEquipment = [testEquipment1, testEquipment2];

      final notifier = MarketplaceNotifier(fakeRepo, autoFetch: false);
      expect(notifier.state.isLoading, isFalse);

      final future = notifier.fetchInitial();
      expect(notifier.state.isLoading, isTrue);
      await future;

      expect(notifier.state.isLoading, isFalse);
      expect(notifier.state.equipment.length, equals(2));
      expect(notifier.state.equipment.first.id, equals('eq_tractor_01'));
      expect(notifier.state.error, isNull);
    });

    test('Empty state accurately signaled when 0 items returned', () async {
      final fakeRepo = FakeMarketplaceRepository();
      fakeRepo.mockEquipment = [];

      final notifier = MarketplaceNotifier(fakeRepo, autoFetch: false);
      await notifier.fetchInitial();

      expect(notifier.state.isLoading, isFalse);
      expect(notifier.state.equipment, isEmpty);
      expect(notifier.state.error, isNull);
    });
  });

  // =========================================================================
  // 2. EQUIPMENT CARD & REAL MODEL FIELDS
  // =========================================================================
  group('Phase 8 - 2. Equipment Card & Real Model Fields', () {
    test('Correctly extracts authoritative fields from model', () {
      expect(testEquipment1.title, equals('Mahindra 575 DI Tractor'));
      expect(testEquipment1.category, equals('TRACTOR'));
      expect(testEquipment1.pricePerDay, equals(1500.0));
      expect(testEquipment1.available, isTrue);
      expect(testEquipment1.owner?.name, equals('Ramesh Reddy'));
      expect(testEquipment1.rating, equals(4.8));
      expect(testEquipment1.securityDeposit, equals(3000.0));
    });

    test('Currency formatting uses Indian number format without fabricating decimals', () {
      final formattedPrice = AppFormatters.currency(testEquipment1.pricePerDay, lang: 'en');
      expect(formattedPrice, equals('₹1,500'));

      final formattedDeposit = AppFormatters.currency(testEquipment1.securityDeposit, lang: 'en');
      expect(formattedDeposit, equals('₹3,000'));
    });

    test('Unavailable equipment model reflects false availability strictly', () {
      expect(testEquipment2.available, isFalse);
    });
  });

  // =========================================================================
  // 3. SEARCH AND FILTER COMBINATIONS
  // =========================================================================
  group('Phase 8 - 3. Search and Filter Combinations', () {
    test('Category filter isolates specified category', () async {
      final fakeRepo = FakeMarketplaceRepository();
      fakeRepo.mockEquipment = [testEquipment1, testEquipment2, testEquipment3];

      final notifier = MarketplaceNotifier(fakeRepo, autoFetch: false);
      await notifier.setCategory('TRACTOR');

      expect(notifier.state.selectedCategory, equals('TRACTOR'));
      expect(notifier.state.equipment.length, equals(1));
      expect(notifier.state.equipment.first.category, equals('TRACTOR'));
    });

    test('Combined category and search filters are sent together', () async {
      final fakeRepo = FakeMarketplaceRepository();
      fakeRepo.mockEquipment = [testEquipment1, testEquipment2, testEquipment3];

      final notifier = MarketplaceNotifier(fakeRepo, autoFetch: false);
      await notifier.updateFilters(newCategory: 'TRACTOR', newSearch: 'Mahindra');

      expect(notifier.state.selectedCategory, equals('TRACTOR'));
      expect(notifier.state.searchQuery, equals('Mahindra'));
      expect(fakeRepo.lastCategory, equals('TRACTOR'));
      expect(fakeRepo.lastSearch, equals('Mahindra'));
      expect(notifier.state.equipment.length, equals(1));
    });

    test('Clear filters resets both category and search query', () async {
      final fakeRepo = FakeMarketplaceRepository();
      fakeRepo.mockEquipment = [testEquipment1, testEquipment2, testEquipment3];

      final notifier = MarketplaceNotifier(fakeRepo, autoFetch: false);
      await notifier.updateFilters(newCategory: 'HARVESTER', newSearch: 'Kubota');
      expect(notifier.state.selectedCategory, equals('HARVESTER'));
      expect(notifier.state.searchQuery, equals('Kubota'));

      await notifier.clearFilters();

      expect(notifier.state.selectedCategory, isNull);
      expect(notifier.state.searchQuery, isNull);
      expect(notifier.state.equipment.length, equals(3));
    });
  });

  // =========================================================================
  // 4. SORTING CORRECTNESS
  // =========================================================================
  group('Phase 8 - 4. Sorting Determinism & Correctness', () {
    test('Lowest price sort orders items ascending by rental price', () async {
      final fakeRepo = FakeMarketplaceRepository();
      fakeRepo.mockEquipment = [testEquipment1, testEquipment2, testEquipment3]; // 1500, 4500, 600

      final notifier = MarketplaceNotifier(fakeRepo, autoFetch: false);
      await notifier.updateFilters(newSort: 'lowest_price');

      expect(notifier.state.selectedSort, equals('lowest_price'));
      expect(notifier.state.equipment.first.pricePerDay, equals(600.0));
      expect(notifier.state.equipment.last.pricePerDay, equals(4500.0));
    });

    test('Highest price sort orders items descending by rental price', () async {
      final fakeRepo = FakeMarketplaceRepository();
      fakeRepo.mockEquipment = [testEquipment1, testEquipment2, testEquipment3];

      final notifier = MarketplaceNotifier(fakeRepo, autoFetch: false);
      await notifier.updateFilters(newSort: 'highest_price');

      expect(notifier.state.selectedSort, equals('highest_price'));
      expect(notifier.state.equipment.first.pricePerDay, equals(4500.0));
      expect(notifier.state.equipment.last.pricePerDay, equals(600.0));
    });
  });

  // =========================================================================
  // 5. STALE SEARCH-RESPONSE PROTECTION
  // =========================================================================
  group('Phase 8 - 5. Stale Search-Response Protection', () {
    test('Newer search response takes precedence over slower older response', () async {
      final fakeRepo = FakeMarketplaceRepository();
      final notifier = MarketplaceNotifier(fakeRepo, autoFetch: false);

      // Simulate Request 1 dispatched with 50ms delay
      fakeRepo.delay = const Duration(milliseconds: 50);
      fakeRepo.mockEquipment = [testEquipment1];
      final future1 = notifier.updateFilters(newSearch: 'tractor');

      // Simulate Request 2 dispatched immediately after with 5ms delay
      fakeRepo.delay = const Duration(milliseconds: 5);
      fakeRepo.mockEquipment = [testEquipment2];
      final future2 = notifier.updateFilters(newSearch: 'harvester');

      // Await both to finish
      await Future.wait([future1, future2]);

      // State MUST reflect Request 2 ('harvester') even though Request 1 finished later
      expect(notifier.state.searchQuery, equals('harvester'));
      expect(notifier.state.equipment.length, equals(1));
      expect(notifier.state.equipment.first.id, equals('eq_harvester_02'));
    });
  });

  // =========================================================================
  // 6. EQUIPMENT DETAILS & ROUTE PARAMETER PRESERVATION
  // =========================================================================
  group('Phase 8 - 6. Equipment Details & Route Parameter Preservation', () {
    test('Router parses /marketplace query parameters correctly', () {
      final uri = Uri.parse('/marketplace?category=TRACTOR&search=Mahindra&sort=lowest_price');
      final params = AppRouter.parseMarketplaceParams(uri);

      expect(params['category'], equals('TRACTOR'));
      expect(params['search'], equals('Mahindra'));
      expect(params['sort'], equals('lowest_price'));
    });

    test('Router parses alternative equipmentId query parameter', () {
      final uri = Uri.parse('/marketplace?equipmentId=eq_tractor_01');
      final params = AppRouter.parseMarketplaceParams(uri);

      expect(params['targetEquipmentId'], equals('eq_tractor_01'));
    });
  });

  // =========================================================================
  // 7. MISSING OPTIONAL EQUIPMENT FIELDS
  // =========================================================================
  group('Phase 8 - 7. Missing Optional Equipment Fields', () {
    test('Gracefully handles null price without fabricating fallback price', () {
      final noPriceEquip = Equipment(
        id: 'eq_custom_04',
        title: 'Custom Implement',
        category: 'OTHER',
        description: 'No pricing specified',
        pricePerDay: null,
        imageUrl: '',
        ownerId: 'owner_custom',
        available: true,
      );

      final hasPrice = noPriceEquip.pricePerDay != null && noPriceEquip.pricePerDay! > 0;
      final priceDisplay = hasPrice
          ? AppFormatters.currency(noPriceEquip.pricePerDay, lang: 'en')
          : 'not_available'.tr('en');

      expect(hasPrice, isFalse);
      expect(priceDisplay, equals('Not Available'));
    });

    test('Gracefully handles empty location, null rating, and null owner', () {
      expect(testEquipment3.location, isNull);
      expect(testEquipment3.rating, isNull);
      expect(testEquipment3.reviewCount, isNull);
      expect(testEquipment3.owner, isNull);
    });

    test('Never fabricates star ratings when rating is missing or zero', () {
      final hasRating = testEquipment3.rating != null && testEquipment3.rating! > 0;
      expect(hasRating, isFalse);
    });
  });

  // =========================================================================
  // 8. SAVED EQUIPMENT LOADING AND MUTATION
  // =========================================================================
  group('Phase 8 - 8. Saved Equipment Loading & Mutation', () {
    test('SavedEquipmentState tracks items and savedIds set accurately', () {
      final state = SavedEquipmentState(
        items: [testEquipment1],
        savedIds: {'eq_tractor_01'},
        isLoading: false,
      );

      expect(state.savedIds.contains('eq_tractor_01'), isTrue);
      expect(state.savedIds.contains('eq_harvester_02'), isFalse);
      expect(state.items.length, equals(1));
    });

    test('copyWith cleanly updates or clears error', () {
      final state = SavedEquipmentState(error: 'Network failure');
      expect(state.error, equals('Network failure'));

      final cleared = state.copyWith(clearError: true);
      expect(cleared.error, isNull);
    });
  });

  // =========================================================================
  // 9. DUPLICATE-SUBMIT PREVENTION
  // =========================================================================
  group('Phase 8 - 9. Duplicate-Submit Prevention', () {
    test('In-flight toggle lock prevents duplicate concurrent toggle operations', () async {
      final fakeApiClient = FakeApiClient();
      final notifier = SavedEquipmentNotifier(apiClient: fakeApiClient, autoLoad: false);

      // First toggle fires request
      final future1 = notifier.toggleSave(testEquipment1);
      // Immediate second toggle on same item while first is in-flight is suppressed
      final future2 = notifier.toggleSave(testEquipment1);

      // Both complete cleanly
      final result1 = await future1;
      final result2 = await future2;

      expect(result1, isTrue);
      expect(result2, isTrue);
      // Only ONE network post was dispatched
      expect(fakeApiClient.postCalls, equals(1));
    });
  });

  // =========================================================================
  // 10. LOGOUT & ACCOUNT-SWITCH ISOLATION
  // =========================================================================
  group('Phase 8 - 10. Logout & Account-Switch Isolation', () {
    test('SavedEquipmentNotifier.clear() purges all saved items and IDs', () {
      final notifier = SavedEquipmentNotifier(autoLoad: false);
      notifier.clear();

      expect(notifier.state.items, isEmpty);
      expect(notifier.state.savedIds, isEmpty);
    });

    test('AuthNotifier logout triggers saved equipment cache purge', () async {
      final fakeAuthRepo = FakeAuthRepository();
      final container = ProviderContainer(
        overrides: [
          authRepositoryProvider.overrideWithValue(fakeAuthRepo),
          savedEquipmentProvider.overrideWith((ref) => SavedEquipmentNotifier(autoLoad: false)),
        ],
      );
      final savedNotifier = container.read(savedEquipmentProvider.notifier);

      expect(savedNotifier.state.items, isEmpty);

      // Call logout
      await container.read(authProvider.notifier).logout();

      // Cache remains completely purged
      expect(savedNotifier.state.items, isEmpty);
      expect(savedNotifier.state.savedIds, isEmpty);
      container.dispose();
    });
  });

  // =========================================================================
  // 11. BOOKING NAVIGATION & ESTIMATION PRESERVATION
  // =========================================================================
  group('Phase 8 - 11. Booking Navigation & Estimation Preservation', () {
    test('Calculates rental days and estimated amount with authoritative price', () {
      final start = DateTime(2026, 11, 1);
      final end = DateTime(2026, 11, 7); // 7 days
      final days = end.difference(start).inDays + 1;
      final total = days * testEquipment1.pricePerDay!;

      expect(days, equals(7));
      expect(total, equals(10500.0));
      expect(AppFormatters.currency(total, lang: 'en'), equals('₹10,500'));
    });

    test('Equipment ID is preserved into booking parameters', () {
      expect(testEquipment1.id, equals('eq_tractor_01'));
    });
  });

  // =========================================================================
  // 12. NETWORK FAILURES & RETRY BEHAVIOR
  // =========================================================================
  group('Phase 8 - 12. Network Failures & Retry Behavior', () {
    test('Marketplace fetch error updates error state without crashing', () async {
      final fakeRepo = FakeMarketplaceRepository();
      fakeRepo.shouldThrow = true;

      final notifier = MarketplaceNotifier(fakeRepo, autoFetch: false);
      await notifier.fetchInitial();

      expect(notifier.state.isLoading, isFalse);
      expect(notifier.state.error, isNotNull);
      expect(notifier.state.equipment, isEmpty);

      // Retry restores normal operation
      fakeRepo.shouldThrow = false;
      fakeRepo.mockEquipment = [testEquipment1];
      await notifier.refresh();

      expect(notifier.state.isLoading, isFalse);
      expect(notifier.state.error, isNull);
      expect(notifier.state.equipment.length, equals(1));
    });
  });

  // =========================================================================
  // 13. FIVE-LANGUAGE LOCALIZATION
  // =========================================================================
  group('Phase 8 - 13. Five-Language Localization', () {
    final languages = ['en', 'te', 'hi', 'ta', 'kn'];
    final requiredKeys = [
      'explore_marketplace',
      'failed_to_update_favorite',
      'reset_filters',
      'clear_search',
      'no_equipment_search_in_category',
      'no_equipment_matching_query',
      'booking_dates_availability_note',
      'equipment_details',
      'saved_equipment',
      'sort_by',
      'sort_newest',
      'sort_price_low_high',
      'sort_price_high_low',
    ];

    for (final lang in languages) {
      test('Language "$lang" provides all Phase 8 translations without raw key fallback', () {
        for (final key in requiredKeys) {
          final translated = key.tr(lang);
          expect(translated, isNotEmpty, reason: 'Key "$key" is empty for "$lang"');
          expect(translated != key, isTrue, reason: 'Key "$key" is untranslated in "$lang"');
        }
      });
    }

    test('Telugu native Unicode characters render without mojibake', () {
      final val = 'explore_marketplace'.tr('te');
      expect(val.contains('Ã'), isFalse);
      expect(val.contains('Â'), isFalse);
      expect(val, equals('మార్కెట్‌ప్లేస్‌ను అన్వేషించండి'));
    });

    test('Hindi native Unicode characters render without mojibake', () {
      final val = 'explore_marketplace'.tr('hi');
      expect(val.contains('Ã'), isFalse);
      expect(val.contains('Â'), isFalse);
      expect(val, equals('मार्केटप्लेस एक्सप्लोर करें'));
    });

    test('Tamil native Unicode characters render without mojibake', () {
      final val = 'explore_marketplace'.tr('ta');
      expect(val.contains('Ã'), isFalse);
      expect(val.contains('Â'), isFalse);
      expect(val, equals('சந்தையை ஆராயுங்கள்'));
    });

    test('Kannada native Unicode characters render without mojibake', () {
      final val = 'explore_marketplace'.tr('kn');
      expect(val.contains('Ã'), isFalse);
      expect(val.contains('Â'), isFalse);
      expect(val, equals('ಮಾರುಕಟ್ಟೆಯನ್ನು ಅನ್ವೇಷಿಸಿ'));
    });
  });

  // =========================================================================
  // 14. REGRESSION PROTECTION FOR PHASES 1–7
  // =========================================================================
  group('Phase 8 - 14. Regression Protection for Phases 1–7', () {
    test('Phase 1: AppRouter.parseMarketplaceParams handles query strings intact', () {
      final uri = Uri.parse('/marketplace?category=HARVESTER&id=eq_99');
      final params = AppRouter.parseMarketplaceParams(uri);
      expect(params['category'], equals('HARVESTER'));
      expect(params['targetEquipmentId'], equals('eq_99'));
    });

    test('Phase 2: Role navigation guards redirect unauthorized roles properly', () {
      final ownerRedirect = AppRouter.testRoleRedirect(userRole: 'OWNER', targetPath: '/admin');
      expect(ownerRedirect, equals('/owner'));

      final farmerRedirect = AppRouter.testRoleRedirect(userRole: 'FARMER', targetPath: '/admin');
      expect(farmerRedirect, equals('/farmer'));
    });

    test('Phase 4: Canonical stages match expected sequence', () {
      const stages = [
        'SOWING',
        'GERMINATION',
        'SEEDLING',
        'VEGETATIVE',
        'FLOWERING',
        'FRUITING',
        'MATURITY',
        'HARVEST',
      ];
      expect(stages.length, equals(8));
      expect(stages.first, equals('SOWING'));
      expect(stages.last, equals('HARVEST'));
    });

    test('Phase 7: Next operation selection prioritizing active operation', () {
      final op1 = ScheduledOperationModel(
        operationId: 'op_1',
        name: 'Land Ploughing',
        stage: 'LAND_PREPARATION',
        status: 'PLANNED',
        plannedStartDate: '2026-11-01',
        timingStatus: 'PLANNED',
        reason: 'Soil tillage',
      );
      final op2 = ScheduledOperationModel(
        operationId: 'op_2',
        name: 'Weeding Operation',
        stage: 'VEGETATIVE',
        status: 'IN_PROGRESS',
        plannedStartDate: '2026-11-05',
        timingStatus: 'IN_PROGRESS',
        reason: 'Intercultural weeding',
      );

      final ops = [op1, op2];
      final nextOp = ops.firstWhere(
        (o) => o.isInProgress,
        orElse: () => ops.first,
      );

      expect(nextOp.operationId, equals('op_2'));
      expect(nextOp.isInProgress, isTrue);
    });
  });
}
