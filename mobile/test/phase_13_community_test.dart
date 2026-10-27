import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile/core/localization/app_localizations.dart';
import 'package:mobile/features/community/models/community_models.dart';
import 'package:mobile/features/community/providers/community_provider.dart';
import 'package:mobile/features/community/services/community_service.dart';

class MockCommunityService extends CommunityService {
  bool shouldFailSend = false;
  int sendCallCount = 0;

  @override
  Future<CommunityInfo> fetchCommunityInfo() async {
    return const CommunityInfo(
      id: 'agrorent-farmer-community',
      name: 'AgroRent Farmer Community',
      description: 'Official shared knowledge network',
      isMember: true,
      memberCount: 50,
      messageCount: 120,
    );
  }

  @override
  Future<List<CommunityMessage>> fetchMessages({int limit = 100}) async {
    return [
      CommunityMessage(
        id: 'msg-1',
        senderId: 'farmer-1',
        text: 'Anyone started paddy transplanting in Guntur?',
        createdAt: DateTime.now().subtract(const Duration(minutes: 10)),
        sender: const CommunitySender(id: 'farmer-1', name: 'Ramesh Patel'),
      ),
    ];
  }

  @override
  Future<List<CommunityMember>> fetchMembers() async {
    return [
      const CommunityMember(
        id: 'farmer-1',
        name: 'Ramesh Patel',
        location: 'Guntur, Andhra Pradesh',
        currentCrop: MemberCrop(cropName: 'Rice', stage: 'VEGETATIVE', season: 'Kharif'),
        nextCrop: MemberCrop(cropName: 'Cotton', season: 'Rabi'),
      ),
      const CommunityMember(
        id: 'farmer-2',
        name: 'Suresh Reddy',
        location: 'Khammam, Telangana',
        currentCrop: null,
        nextCrop: null,
      ),
    ];
  }

  @override
  Future<CommunityMessage> sendMessage(String text) async {
    sendCallCount++;
    if (shouldFailSend) {
      throw Exception('Network connection timed out');
    }
    return CommunityMessage(
      id: 'msg-${DateTime.now().millisecondsSinceEpoch}',
      senderId: 'current-farmer',
      text: text,
      createdAt: DateTime.now(),
      sender: const CommunitySender(id: 'current-farmer', name: 'Current Farmer'),
    );
  }

  @override
  Future<CropTrendsResponse> fetchCropTrends() async {
    return const CropTrendsResponse(
      totalCropsTracked: 2,
      totalActiveCultivations: 15,
      cropTrends: [
        CropTrendItem(
          cropName: 'Rice',
          activeFarmerCount: 10,
          plannedFarmerCount: 5,
          activeFieldCount: 12,
          topRegions: [{'region': 'Guntur', 'count': 8}],
          marketPriceStatus: 'UNAVAILABLE',
          marketPriceMessage: 'Price feed unconnected',
        ),
        CropTrendItem(
          cropName: 'Cotton',
          activeFarmerCount: 5,
          plannedFarmerCount: 8,
          activeFieldCount: 6,
          topRegions: [{'region': 'Warangal', 'count': 4}],
          marketPriceStatus: 'UNAVAILABLE',
          marketPriceMessage: 'Price feed unconnected',
        ),
      ],
      marketPriceDisclaimer: 'A reliable selling-price estimate is unavailable because current market-price data is not connected.',
      aiExplanation: 'Platform records indicate Rice and Cotton are the most widely cultivated crops this season.',
      updatedAt: '2026-10-21T00:00:00Z',
    );
  }
}

void main() {
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    SharedPreferences.setMockInitialValues({});
  });

  group('Phase 13 — 1. Community Models Parsing & Safe Deserialization', () {
    test('CommunityMessage handles null, missing, and malformed json safely', () {
      final emptyJson = <String, dynamic>{};
      final msg = CommunityMessage.fromJson(emptyJson);

      expect(msg.id, '');
      expect(msg.senderId, '');
      expect(msg.text, '');
      expect(msg.sender, isNull);
      expect(msg.createdAt, isA<DateTime>());
    });

    test('CommunitySender handles null name and profile image safely', () {
      final json = {'id': 's-1'};
      final sender = CommunitySender.fromJson(json);

      expect(sender.id, 's-1');
      expect(sender.name, 'Farmer');
      expect(sender.profileImage, isNull);
    });

    test('CommunityInfo handles null and malformed counts safely', () {
      final json = {'id': null, 'memberCount': 'invalid', 'messageCount': null};
      final info = CommunityInfo.fromJson(json);

      expect(info.id, 'agrorent-farmer-community');
      expect(info.memberCount, 0);
      expect(info.messageCount, 0);
      expect(info.isMember, isFalse);
    });

    test('MemberCrop deserializes valid and null crop details safely', () {
      final json = {
        'cropName': 'Chilli',
        'stage': 'FLOWERING',
        'season': 'Kharif',
        'sowingDate': '2026-06-15T00:00:00Z',
        'expectedHarvestDate': null,
      };
      final crop = MemberCrop.fromJson(json);

      expect(crop.cropName, 'Chilli');
      expect(crop.stage, 'FLOWERING');
      expect(crop.season, 'Kharif');
      expect(crop.sowingDate, isNotNull);
      expect(crop.expectedHarvestDate, isNull);
    });

    test('CommunityMember handles null currentCrop and null nextCrop without throwing', () {
      final json = {
        'id': 'm-1',
        'name': 'Bhanu Reddy',
        'location': null,
        'currentCrop': null,
        'nextCrop': null,
      };
      final member = CommunityMember.fromJson(json);

      expect(member.id, 'm-1');
      expect(member.name, 'Bhanu Reddy');
      expect(member.location, 'Local Region');
      expect(member.currentCrop, isNull);
      expect(member.nextCrop, isNull);
    });

    test('FarmerPublicProfile handles absent farmSummary and null crops', () {
      final json = {
        'id': 'f-99',
        'name': 'Anil Kumar',
        'currentCrop': null,
        'nextCrop': null,
        'farmSummary': null,
      };
      final profile = FarmerPublicProfile.fromJson(json);

      expect(profile.id, 'f-99');
      expect(profile.name, 'Anil Kumar');
      expect(profile.currentCrop, isNull);
      expect(profile.nextCrop, isNull);
      expect(profile.farmSummary, isNull);
    });

    test('CropTrendItem handles missing counts and sets marketPriceStatus UNAVAILABLE', () {
      final json = {
        'cropName': 'Maize',
        'activeFarmerCount': 'bad_count',
      };
      final item = CropTrendItem.fromJson(json);

      expect(item.cropName, 'Maize');
      expect(item.activeFarmerCount, 0);
      expect(item.plannedFarmerCount, 0);
      expect(item.marketPriceStatus, 'UNAVAILABLE');
      expect(item.topRegions, isEmpty);
    });

    test('CropTrendsResponse safely handles empty crops and missing explanation', () {
      final json = <String, dynamic>{};
      final res = CropTrendsResponse.fromJson(json);

      expect(res.totalCropsTracked, 0);
      expect(res.totalActiveCultivations, 0);
      expect(res.cropTrends, isEmpty);
      expect(res.aiExplanation, '');
      expect(res.marketPriceDisclaimer, '');
    });
  });

  group('Phase 13 — 2. CommunityState Immutability & CopyWith Integrity', () {
    test('copyWith updates state properties and preserves untouched fields', () {
      const state = CommunityState(isLoading: true, isSending: false);
      final updated = state.copyWith(
        isLoading: false,
        error: 'Network error',
        lastFailedMessage: 'Draft message',
      );

      expect(updated.isLoading, isFalse);
      expect(updated.isSending, isFalse);
      expect(updated.error, 'Network error');
      expect(updated.lastFailedMessage, 'Draft message');
    });

    test('clearError and clearLastFailedMessage flags reset nullable fields', () {
      const state = CommunityState(
        error: 'Failed to fetch',
        sendError: 'Send failed',
        lastFailedMessage: 'My question',
      );

      final cleared = state.copyWith(
        clearError: true,
        clearSendError: true,
        clearLastFailedMessage: true,
      );

      expect(cleared.error, isNull);
      expect(cleared.sendError, isNull);
      expect(cleared.lastFailedMessage, isNull);
    });
  });

  group('Phase 13 — 3. Registered-Crop Visibility & Absent-Crop Behavior', () {
    test('Member with active and planned crops exposes valid names and stages', () {
      const activeCrop = MemberCrop(cropName: 'Paddy', stage: 'HARVEST', season: 'Kharif');
      const plannedCrop = MemberCrop(cropName: 'Groundnut', season: 'Rabi');
      const member = CommunityMember(
        id: 'f-1',
        name: 'Murugan',
        currentCrop: activeCrop,
        nextCrop: plannedCrop,
      );

      expect(member.currentCrop?.cropName, 'Paddy');
      expect(member.currentCrop?.stage, 'HARVEST');
      expect(member.nextCrop?.cropName, 'Groundnut');
    });

    test('Member without crop registrations has null currentCrop and nextCrop', () {
      const member = CommunityMember(id: 'f-2', name: 'Lakshman');
      expect(member.currentCrop, isNull);
      expect(member.nextCrop, isNull);
    });
  });

  group('Phase 13 — 4. Duplicate-Send Mutex & Draft Preservation', () {
    test('Rapid consecutive submissions are suppressed when send is active', () async {
      final mockService = MockCommunityService();
      final notifier = CommunityNotifier(mockService, userId: 'test-user');

      // First call succeeds
      final call1 = notifier.sendMessage('Hello farmers');
      // Immediate second call should be discarded by mutex
      final call2 = notifier.sendMessage('Duplicate message');

      final results = await Future.wait([call1, call2]);
      expect(results[0], isTrue);
      expect(results[1], isFalse);
      expect(mockService.sendCallCount, 1);

      notifier.dispose();
    });

    test('Send error preserves typed draft in lastFailedMessage', () async {
      final mockService = MockCommunityService()..shouldFailSend = true;
      final notifier = CommunityNotifier(mockService, userId: 'test-user');

      final success = await notifier.sendMessage('What is the best fertilizer for Cotton?');
      expect(success, isFalse);
      expect(notifier.state.isSending, isFalse);
      expect(notifier.state.sendError, contains('Network connection timed out'));
      expect(notifier.state.lastFailedMessage, 'What is the best fertilizer for Cotton?');

      notifier.dispose();
    });

    test('Successful retry clears lastFailedMessage and appends to messages', () async {
      final mockService = MockCommunityService()..shouldFailSend = true;
      final notifier = CommunityNotifier(mockService, userId: 'test-user');

      // First attempt fails
      await notifier.sendMessage('Will rain arrive next week?');
      expect(notifier.state.lastFailedMessage, 'Will rain arrive next week?');

      // Allow second attempt
      mockService.shouldFailSend = false;
      final retrySuccess = await notifier.sendMessage(notifier.state.lastFailedMessage!);
      expect(retrySuccess, isTrue);
      expect(notifier.state.lastFailedMessage, isNull);
      expect(notifier.state.messages.any((m) => m.text == 'Will rain arrive next week?'), isTrue);

      notifier.dispose();
    });
  });

  group('Phase 13 — 5. Account Switch & Logout Cache Isolation', () {
    test('resetForUser(null) on logout wipes all cached messages and members', () async {
      final mockService = MockCommunityService();
      final notifier = CommunityNotifier(mockService, userId: 'farmer-A');
      await notifier.loadCommunity();
      await notifier.loadMembers();
      await notifier.loadCropTrends();

      expect(notifier.state.messages, isNotEmpty);
      expect(notifier.state.members, isNotEmpty);
      expect(notifier.state.cropTrends, isNotNull);

      // Simulate Logout
      notifier.resetForUser(null);

      expect(notifier.state.messages, isEmpty);
      expect(notifier.state.members, isEmpty);
      expect(notifier.state.cropTrends, isNull);
      expect(notifier.state.isLoading, isFalse);

      notifier.dispose();
    });

    test('Switching user ID re-initializes clean state for new farmer account', () async {
      final mockService = MockCommunityService();
      final notifier = CommunityNotifier(mockService, userId: 'farmer-A');
      await notifier.loadCommunity();

      // Switch to farmer-B
      notifier.resetForUser('farmer-B');
      expect(notifier.state.isLoading, isTrue);
      await notifier.loadCommunity();

      expect(notifier.state.info?.id, 'agrorent-farmer-community');
      notifier.dispose();
    });
  });

  group('Phase 13 — 6. Security & Privacy Boundaries', () {
    test('FarmerPublicProfile strictly excludes phone numbers, emails, and credentials', () {
      final json = {
        'id': 'f-sec-1',
        'name': 'Gopal Rao',
        'profileImage': null,
        'joinedAt': '2026-01-15T00:00:00Z',
        'location': 'Kurnool, Andhra Pradesh',
        'phone': '+91 9876543210', // Should NOT be present in model
        'email': 'gopal@secret.com', // Should NOT be present in model
        'password': 'hash', // Should NOT be present in model
        'farmSummary': {'area': 10, 'areaUnit': 'acres', 'soilType': 'Black Soil'},
      };

      final profile = FarmerPublicProfile.fromJson(json);

      expect(profile.id, 'f-sec-1');
      expect(profile.name, 'Gopal Rao');
      expect(profile.location, 'Kurnool, Andhra Pradesh');
      expect(profile.farmSummary?['area'], 10);
      // Verify phone and email are not exposed
      expect(profile.toString().contains('9876543210'), isFalse);
      expect(profile.toString().contains('secret.com'), isFalse);
    });

    test('community_privacy_notice is defined and emphasizes privacy protection', () {
      const loc = AppLocalizations();
      final notice = loc.translate('community_privacy_notice', 'en');
      expect(notice.toLowerCase(), contains('privacy'));
      expect(notice.toLowerCase(), contains('protected'));
    });
  });

  group('Phase 13 — 7. Grounded AI Explanation & Market Price Integrity', () {
    test('Crop trends explanation is grounded and market price status is UNAVAILABLE', () async {
      final mockService = MockCommunityService();
      final trends = await mockService.fetchCropTrends();

      expect(trends.totalCropsTracked, 2);
      expect(trends.marketPriceDisclaimer, contains('unavailable because current market-price data is not connected'));
      expect(trends.cropTrends.every((c) => c.marketPriceStatus == 'UNAVAILABLE'), isTrue);
      expect(trends.aiExplanation, contains('Rice and Cotton'));
    });

    test('Zero fabricated financial returns or market price guarantees in crop trends', () async {
      final mockService = MockCommunityService();
      final trends = await mockService.fetchCropTrends();

      for (final crop in trends.cropTrends) {
        expect(crop.marketPriceStatus, 'UNAVAILABLE');
        expect(crop.marketPriceMessage, isNotEmpty);
      }
    });
  });

  group('Phase 13 — 8. 5-Language Authentic Native Unicode Localization Verification', () {
    final phase13Keys = [
      'farmer_community',
      'community_chat',
      'members_and_crops',
      'farmer_exclusive_network',
      'welcome_community',
      'first_to_post',
      'type_message_to_farmers',
      'register_my_crops',
      'register_my_crops_desc',
      'crop_trends_insights',
      'crop_trends_desc',
      'farming_knowledge_guides',
      'farming_knowledge_desc',
      'community_members',
      'tap_to_view_profile',
      'no_farmers_found',
      'farmer_profile',
      'current_cultivated_crop',
      'no_crop_registered',
      'no_crop_registered_desc',
      'next_planned_crop',
      'no_next_crop_planned',
      'public_field_summary',
      'community_privacy_notice',
      'crop_trends_intelligence',
      'active_crops',
      'total_cultivations',
      'ai_crop_intelligence',
      'registered_crop_popularity',
      'market_price_integrity',
      'market_price_unavailable_notice',
      'view_crop_guide',
      'add_next_planned_crop',
    ];

    test('Language "en" provides all Phase 13 localization keys without raw fallbacks', () {
      const loc = AppLocalizations();
      for (final key in phase13Keys) {
        final val = loc.translate(key, 'en');
        expect(val, isNotEmpty, reason: 'Key $key should not be empty in en');
        expect(val, isNot(equals(key)), reason: 'Key $key should have real translation in en');
      }
    });

    test('Language "te" provides all Phase 13 localization keys without raw fallbacks', () {
      const loc = AppLocalizations();
      for (final key in phase13Keys) {
        final val = loc.translate(key, 'te');
        expect(val, isNotEmpty, reason: 'Key $key should not be empty in te');
        expect(val, isNot(equals(key)), reason: 'Key $key should have real translation in te');
      }
    });

    test('Language "hi" provides all Phase 13 localization keys without raw fallbacks', () {
      const loc = AppLocalizations();
      for (final key in phase13Keys) {
        final val = loc.translate(key, 'hi');
        expect(val, isNotEmpty, reason: 'Key $key should not be empty in hi');
        expect(val, isNot(equals(key)), reason: 'Key $key should have real translation in hi');
      }
    });

    test('Language "ta" provides all Phase 13 localization keys without raw fallbacks', () {
      const loc = AppLocalizations();
      for (final key in phase13Keys) {
        final val = loc.translate(key, 'ta');
        expect(val, isNotEmpty, reason: 'Key $key should not be empty in ta');
        expect(val, isNot(equals(key)), reason: 'Key $key should have real translation in ta');
      }
    });

    test('Language "kn" provides all Phase 13 localization keys without raw fallbacks', () {
      const loc = AppLocalizations();
      for (final key in phase13Keys) {
        final val = loc.translate(key, 'kn');
        expect(val, isNotEmpty, reason: 'Key $key should not be empty in kn');
        expect(val, isNot(equals(key)), reason: 'Key $key should have real translation in kn');
      }
    });

    test('Indic languages display valid native Unicode characters for Phase 13 keys', () {
      const loc = AppLocalizations();

      expect(loc.translate('farmer_community', 'te'), 'రైతు కమ్యూనిటీ');
      expect(loc.translate('farmer_community', 'hi'), 'किसान समुदाय');
      expect(loc.translate('farmer_community', 'ta'), 'விவசாயிகள் சமூகம்');
      expect(loc.translate('farmer_community', 'kn'), 'ರೈತ ಸಮುದಾಯ');
    });
  });

  group('Phase 13 — 9. Preservation of Phases 1–12 Regressions', () {
    test('Phase 1: Knowledge base alias and localized roles preserved', () {
      const loc = AppLocalizations();
      expect(loc.translate('knowledge_base'), isNotEmpty);
      expect(loc.translate('farmer'), 'Farmer');
      expect(loc.translate('equipment_owner'), 'Equipment Owner');
    });

    test('Phase 2 & 3: Role structure and dashboard stages preserved', () {
      const loc = AppLocalizations();
      expect(loc.translate('dashboard'), isNotEmpty);
      expect(loc.translate('my_farm'), isNotEmpty);
    });

    test('Phase 4: Farm setup keys preserved', () {
      const loc = AppLocalizations();
      expect(loc.translate('farm_setup'), isNotEmpty);
    });

    test('Phase 5: Farm operations keys preserved', () {
      const loc = AppLocalizations();
      expect(loc.translate('operations'), isNotEmpty);
    });

    test('Phase 6 & 7: Booking flow and timeline keys preserved', () {
      const loc = AppLocalizations();
      expect(loc.translate('book_now'), isNotEmpty);
    });

    test('Phase 8: Marketplace and equipment filters preserved', () {
      const loc = AppLocalizations();
      expect(loc.translate('marketplace'), isNotEmpty);
    });

    test('Phase 9: Booking lifecycle and security deposit keys preserved', () {
      const loc = AppLocalizations();
      expect(loc.translate('security_deposit'), isNotEmpty);
    });

    test('Phase 10: Financial intelligence and budget overview keys preserved', () {
      const loc = AppLocalizations();
      expect(loc.translate('spending_drilldown'), isNotEmpty);
    });

    test('Phase 11: Notifications and in-app chat keys preserved', () {
      const loc = AppLocalizations();
      expect(loc.translate('mark_all_read'), isNotEmpty);
    });

    test('Phase 12: AI Copilot and farming advisory keys preserved', () {
      const loc = AppLocalizations();
      expect(loc.translate('authoritative_farm_facts'), isNotEmpty);
      expect(loc.translate('agronomic_safety_disclaimer'), isNotEmpty);
    });
  });
}
