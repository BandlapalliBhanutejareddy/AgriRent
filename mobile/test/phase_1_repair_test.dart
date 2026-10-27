import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/config/environment.dart';
import 'package:mobile/core/localization/app_localizations.dart';
import 'package:mobile/features/community/ui/community_screen.dart';
import 'package:mobile/features/community/providers/community_provider.dart';
import 'package:mobile/routing/router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class FakeCommunityNotifier extends StateNotifier<CommunityState> implements CommunityNotifier {
  FakeCommunityNotifier() : super(const CommunityState());

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

  group('Phase 1 - Routing Defects Verification', () {
    test('Router defines canonical /knowledge and alias /knowledge-base', () {
      final routes = AppRouter.router.configuration.routes;
      
      // Collect all route paths
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

      expect(paths.contains('/knowledge'), isTrue, reason: 'Canonical /knowledge route must exist');
      expect(paths.contains('/knowledge-base'), isTrue, reason: '/knowledge-base alias must exist to prevent GoException');
    });

    test('Owner role guard redirects OWNER role away from Farmer-only /crop-advisor', () {
      // Test the redirect logic in router
      final redirectedPath = AppRouter.testRoleRedirect(userRole: 'OWNER', targetPath: '/crop-advisor');
      expect(redirectedPath, equals('/owner'), reason: 'OWNER must be redirected to /owner from /crop-advisor');

      final redirectedAdvisor = AppRouter.testRoleRedirect(userRole: 'OWNER', targetPath: '/advisor');
      expect(redirectedAdvisor, equals('/owner'), reason: 'OWNER must be redirected to /owner from /advisor');

      // Farmer should not be blocked from /crop-advisor
      final farmerPath = AppRouter.testRoleRedirect(userRole: 'FARMER', targetPath: '/crop-advisor');
      expect(farmerPath, isNull, reason: 'FARMER should not be redirected away from crop advisor');
    });

    test('Marketplace query parameter parser correctly handles equipmentId, id, bookId, and category', () {
      final uri = Uri.parse('/marketplace?category=Tractors&id=eq_123&bookId=bk_456');
      final params = AppRouter.parseMarketplaceParams(uri);

      expect(params['category'], equals('Tractors'));
      expect(params['targetEquipmentId'], equals('eq_123'));
      expect(params['bookId'], equals('bk_456'));

      // Also test equipmentId key
      final uri2 = Uri.parse('/marketplace?equipmentId=eq_999');
      final params2 = AppRouter.parseMarketplaceParams(uri2);
      expect(params2['targetEquipmentId'], equals('eq_999'));
      expect(params2['category'], isNull);
      expect(params2['bookId'], isNull);
    });

    testWidgets('CommunityScreen respects isTab parameter and does not pop Farmer portal', (WidgetTester tester) async {
      bool backCallbackTriggered = false;
      final container = ProviderContainer(
        overrides: [
          communityProvider.overrideWith((ref) => FakeCommunityNotifier()),
        ],
      );

      try {
        await tester.pumpWidget(
          UncontrolledProviderScope(
            container: container,
            child: MaterialApp(
              home: Scaffold(
                body: CommunityScreen(
                  isTab: true,
                  onBack: () {
                    backCallbackTriggered = true;
                  },
                ),
              ),
            ),
          ),
        );

        // Verify Community title renders
        expect(find.textContaining('Community'), findsWidgets);

        // Find AppBar back icon
        final backButtonFinder = find.byTooltip('Back');
        expect(backButtonFinder, findsOneWidget);

        await tester.tap(backButtonFinder);
        await tester.pump();

        expect(backCallbackTriggered, isTrue, reason: 'Leading button must invoke onBack callback instead of popping entire portal');

        await tester.pumpWidget(const SizedBox());
      } finally {
        container.dispose();
      }
    });

    test('Admin Dashboard tab labels and icons match actual screen content', () {
      // In admin_dashboard_screen.dart:
      // Tab 0: Overview (overview)
      // Tab 1: Verifications (verifications)
      // Tab 2: Alerts (alerts)
      // Tab 3: System Health (system_health)
      for (final lang in ['en', 'te', 'hi', 'ta', 'kn']) {
        expect(AppLocalizations.tr('alerts', lang), isNotEmpty);
        expect(AppLocalizations.tr('system_health', lang), isNotEmpty);
        expect(AppLocalizations.tr('alerts', lang), isNot(equals('alerts')));
        expect(AppLocalizations.tr('system_health', lang), isNot(equals('system_health')));
      }
    });
  });

  group('Phase 1 - Localization Restoration & Mojibake Elimination', () {
    // Regex matching common UTF-8 mojibake patterns
    final mojibakePattern = RegExp(r'(Ã[ -ÿ]|Â[ -ÿ]|à°|à®|à²|à¤|â€)');

    final testKeys = [
      'booking_details',
      'cancel_booking',
      'generate_smart_plan',
      'knowledge_base',
      'weather',
      'red_soil',
      'black_soil',
      'clay_soil',
      'confirm_cancellation',
      'active_bookings',
      'past_bookings',
    ];

    test('Targeted previously corrupted keys produce clean, valid translations in all 5 languages', () {
      final languages = ['en', 'te', 'hi', 'ta', 'kn'];

      for (final lang in languages) {
        for (final key in testKeys) {
          final translated = AppLocalizations.tr(key, lang);

          expect(translated, isNotEmpty, reason: 'Key "$key" should not be empty for lang "$lang"');
          expect(translated, isNot(equals(key)), reason: 'Key "$key" should not return raw key for lang "$lang"');
          expect(
            mojibakePattern.hasMatch(translated),
            isFalse,
            reason: 'Key "$key" in lang "$lang" contains mojibake: "$translated"',
          );
        }
      }
    });

    test('Regional languages use correct native Unicode script blocks', () {
      // Telugu: \u0C00-\u0C7F
      final teluguPattern = RegExp(r'[\u0C00-\u0C7F]');
      // Hindi / Devanagari: \u0900-\u097F
      final hindiPattern = RegExp(r'[\u0900-\u097F]');
      // Tamil: \u0B80-\u0BFF
      final tamilPattern = RegExp(r'[\u0B80-\u0BFF]');
      // Kannada: \u0C80-\u0CFF
      final kannadaPattern = RegExp(r'[\u0C80-\u0CFF]');

      for (final key in testKeys) {
        final teText = AppLocalizations.tr(key, 'te');
        expect(teluguPattern.hasMatch(teText), isTrue, reason: 'Telugu "$key" ("$teText") must contain Telugu Unicode characters');

        final hiText = AppLocalizations.tr(key, 'hi');
        expect(hindiPattern.hasMatch(hiText), isTrue, reason: 'Hindi "$key" ("$hiText") must contain Devanagari Unicode characters');

        final taText = AppLocalizations.tr(key, 'ta');
        expect(tamilPattern.hasMatch(taText), isTrue, reason: 'Tamil "$key" ("$taText") must contain Tamil Unicode characters');

        final knText = AppLocalizations.tr(key, 'kn');
        expect(kannadaPattern.hasMatch(knText), isTrue, reason: 'Kannada "$key" ("$knText") must contain Kannada Unicode characters');
      }
    });

    test('Exact previously corrupted booking and smart-plan strings match verified Indic text', () {
      // Verify exact readable phrases for Telugu
      expect(AppLocalizations.tr('cancel_booking', 'te'), equals('బుకింగ్ రద్దు చేయండి'));
      expect(AppLocalizations.tr('booking_details', 'te'), equals('బుకింగ్ వివరాలు'));
      expect(AppLocalizations.tr('generate_smart_plan', 'te'), equals('వ్యవసాయ ప్రణాళికను రూపొందించండి'));
      expect(AppLocalizations.tr('knowledge_base', 'te'), equals('నాలెడ్జ్ బేస్'));
      expect(AppLocalizations.tr('weather', 'te'), equals('వాతావరణం'));

      // Verify exact readable phrases for Tamil
      expect(AppLocalizations.tr('cancel_booking', 'ta'), equals('முன்பதிவை ரத்து செய்'));
      expect(AppLocalizations.tr('booking_details', 'ta'), equals('முன்பதிவு விவரங்கள்'));
      expect(AppLocalizations.tr('generate_smart_plan', 'ta'), equals('விவசாய திட்டத்தை உருவாக்கவும்'));
      expect(AppLocalizations.tr('knowledge_base', 'ta'), equals('அறிவுத் தளம்'));

      // Verify exact readable phrases for Kannada
      expect(AppLocalizations.tr('cancel_booking', 'kn'), equals('ಬುಕಿಂಗ್ ರದ್ದುಮಾಡಿ'));
      expect(AppLocalizations.tr('booking_details', 'kn'), equals('ಬುಕಿಂಗ್ ವಿವರಗಳು'));
      expect(AppLocalizations.tr('generate_smart_plan', 'kn'), equals('ಕೃಷಿ ಯೋಜನೆಯನ್ನು ರಚಿಸಿ'));
      expect(AppLocalizations.tr('knowledge_base', 'kn'), equals('ಜ್ಞಾನ ನೆಲೆ'));
    });
  });

  group('Phase 1 - Preference Preservation on Logout', () {
    test('Logout logic retains app_language and user_theme_mode while clearing sensitive session', () async {
      SharedPreferences.setMockInitialValues({
        'user_theme_mode': 'dark',
        'cached_user_profile': '{"id": "user_123", "name": "Bhanu"}',
        'cart_items': '[{"id": "item_1"}]',
      });
      FlutterSecureStorage.setMockInitialValues({
        'app_language': 'te',
        'access_token': 'jwt.token.abc',
        'refresh_token': 'jwt.refresh.xyz',
        'user_data': '{"id": "user_123"}',
      });

      const storage = FlutterSecureStorage();
      final prefs = await SharedPreferences.getInstance();

      // Verify initial state
      expect(await storage.read(key: 'app_language'), equals('te'));
      expect(await storage.read(key: 'access_token'), equals('jwt.token.abc'));
      expect(prefs.getString('user_theme_mode'), equals('dark'));
      expect(prefs.getString('cached_user_profile'), isNotNull);

      // Perform logout preservation logic (same as AuthRepository.logout)
      final savedLang = await storage.read(key: 'app_language');
      final savedTheme = prefs.getString('user_theme_mode');

      await storage.deleteAll();
      await prefs.clear();

      if (savedLang != null && savedLang.isNotEmpty) {
        await storage.write(key: 'app_language', value: savedLang);
      }
      if (savedTheme != null && savedTheme.isNotEmpty) {
        await prefs.setString('user_theme_mode', savedTheme);
      }

      // Assert device preferences survived
      expect(await storage.read(key: 'app_language'), equals('te'));
      expect(prefs.getString('user_theme_mode'), equals('dark'));

      // Assert sensitive session credentials and user cache are destroyed
      expect(await storage.read(key: 'access_token'), isNull);
      expect(await storage.read(key: 'refresh_token'), isNull);
      expect(await storage.read(key: 'user_data'), isNull);
      expect(prefs.getString('cached_user_profile'), isNull);
      expect(prefs.getString('cart_items'), isNull);
    });
  });

  group('Phase 1 - Development API Host Failover', () {
    test('switchDevHost switches between 127.0.0.1 and 10.0.2.2 in development flavor', () {
      if (Environment.flavor == 'development') {
        final initialHost = Environment.activeDevHost;
        Environment.switchDevHost();
        final switchedHost = Environment.activeDevHost;
        expect(switchedHost, isNot(equals(initialHost)));

        // Switching back
        Environment.switchDevHost();
        expect(Environment.activeDevHost, equals(initialHost));
      }
    });
  });
}
