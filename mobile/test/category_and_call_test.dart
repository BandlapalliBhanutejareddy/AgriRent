import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/localization/app_localizations.dart';
import 'package:mobile/features/marketplace/providers/marketplace_provider.dart';

void main() {
  group('Equipment Category & Localization Tests', () {
    test('Canonical categories localize correctly across all 5 languages', () {
      final languages = ['en', 'te', 'hi', 'ta', 'kn'];
      final categories = [
        'TRACTOR',
        'HARVESTER',
        'POWER_TILLERS',
        'SPRAYER',
        'IRRIGATION',
        'CULTIVATOR',
        'IMPLEMENTS',
      ];

      for (final lang in languages) {
        for (final cat in categories) {
          final localized = AppLocalizations.localizedEquipmentCategory(cat, lang);
          expect(localized, isNotEmpty);
          expect(localized, isNot(equals(cat)),
              reason: 'Category $cat should be translated in $lang, not return raw key');
        }
      }
    });

    test('Tractor translations match expectations', () {
      expect(AppLocalizations.localizedEquipmentCategory('TRACTOR', 'en'), 'Tractors');
      expect(AppLocalizations.localizedEquipmentCategory('TRACTOR', 'te'), 'ట్రాక్టర్లు');
      expect(AppLocalizations.localizedEquipmentCategory('TRACTOR', 'hi'), 'ट्रैक्टर');
      expect(AppLocalizations.localizedEquipmentCategory('TRACTOR', 'ta'), 'டிராக்டர்கள்');
      expect(AppLocalizations.localizedEquipmentCategory('TRACTOR', 'kn'), 'ಟ್ರಾಕ್ಟರ್‌ಗಳು');
    });

    test('Private call localization keys exist and translate without raw keys', () {
      final keys = [
        'call_owner',
        'call_farmer',
        'call_privacy_notice',
        'ready_to_call',
        'preparing_secure_call',
        'opening_phone_dialer',
        'call_setup_failed',
        'call_relay_unavailable',
        'open_chat',
        'call',
        'view_all',
        'search_equipment',
      ];

      for (final lang in ['en', 'te', 'hi', 'ta', 'kn']) {
        for (final key in keys) {
          final translated = AppLocalizations.tr(key, lang);
          expect(translated, isNotEmpty);
          expect(translated, isNot(equals(key)),
              reason: 'Key $key should have actual translation in $lang');
        }
      }
    });

    test('MarketplaceState correctly updates and clears selectedCategory', () {
      var state = MarketplaceState();
      expect(state.selectedCategory, isNull);

      state = state.copyWith(selectedCategory: 'TRACTOR');
      expect(state.selectedCategory, 'TRACTOR');

      state = state.copyWith(selectedCategory: 'HARVESTER');
      expect(state.selectedCategory, 'HARVESTER');

      // Clear category
      state = state.copyWith(clearCategory: true);
      expect(state.selectedCategory, isNull);
    });
  });
}
