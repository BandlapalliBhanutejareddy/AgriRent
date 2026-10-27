import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile/features/community/models/community_models.dart';
import 'package:mobile/features/community/providers/community_provider.dart';
import 'package:mobile/features/community/services/community_service.dart';

class FakeCommunityService extends CommunityService {
  @override
  Future<CommunityInfo> fetchCommunityInfo() async {
    return const CommunityInfo(
      id: 'agrorent-farmer-community',
      name: 'AgroRent Farmer Community',
      description: 'Community',
      isMember: true,
      memberCount: 10,
      messageCount: 20,
    );
  }

  @override
  Future<List<CommunityMessage>> fetchMessages({int limit = 100}) async {
    return [];
  }

  @override
  Future<List<CommunityMember>> fetchMembers() async {
    return [];
  }
}

void main() {
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    SharedPreferences.setMockInitialValues({});
  });

  group('Farmer Community Model Tests', () {
    test('CommunityMessage deserializes correctly from backend JSON', () {
      final json = {
        'id': 'comm-msg-101',
        'text': 'Has anyone harvested their paddy in Thanjavur yet?',
        'createdAt': '2026-10-10T08:30:00.000Z',
        'senderId': 'farmer-001',
        'sender': {
          'id': 'farmer-001',
          'name': 'Murugan K',
          'profileImage': null,
        },
      };

      final msg = CommunityMessage.fromJson(json);

      expect(msg.id, 'comm-msg-101');
      expect(msg.text, 'Has anyone harvested their paddy in Thanjavur yet?');
      expect(msg.senderId, 'farmer-001');
      expect(msg.sender, isNotNull);
      expect(msg.sender!.name, 'Murugan K');
      expect(msg.createdAt.isUtc || msg.createdAt.isBefore(DateTime.now().add(const Duration(days: 1))), isTrue);
    });

    test('CommunitySender deserializes correctly and serializes to JSON', () {
      final json = {
        'id': 'farmer-002',
        'name': 'Selvam R',
        'profileImage': null,
      };

      final sender = CommunitySender.fromJson(json);

      expect(sender.id, 'farmer-002');
      expect(sender.name, 'Selvam R');
      expect(sender.profileImage, isNull);

      final encoded = sender.toJson();
      expect(encoded['id'], 'farmer-002');
      expect(encoded['name'], 'Selvam R');
    });

    test('CommunityInfo deserializes correctly', () {
      final json = {
        'id': 'agrorent-farmer-community',
        'name': 'AgroRent Farmer Community',
        'description': 'A community for registered farmers',
        'isMember': true,
        'memberCount': 42,
        'messageCount': 105,
      };

      final info = CommunityInfo.fromJson(json);
      expect(info.id, 'agrorent-farmer-community');
      expect(info.name, 'AgroRent Farmer Community');
      expect(info.isMember, true);
      expect(info.memberCount, 42);
      expect(info.messageCount, 105);
    });

    test('CommunityState copyWith correctly updates messages and loading flags', () {
      const initial = CommunityState(isLoading: true);
      expect(initial.isLoading, true);
      expect(initial.messages, isEmpty);
      expect(initial.isSending, false);

      final msg = CommunityMessage(
        id: 'msg-1',
        text: 'Rainfall expected tomorrow',
        createdAt: DateTime.now(),
        senderId: 'f1',
        sender: const CommunitySender(id: 'f1', name: 'Farmer 1'),
      );

      final updated = initial.copyWith(
        isLoading: false,
        messages: [msg],
        error: null,
      );

      expect(updated.isLoading, false);
      expect(updated.messages.length, 1);
      expect(updated.messages.first.text, 'Rainfall expected tomorrow');
      expect(updated.error, isNull);
    });

    test('CommunityMessage parses category tags and classifies equipment demand', () {
      final demandJson = {
        'id': 'msg-demand',
        'text': '[Equipment Demand] Need 50HP John Deere tractor for 2 days in Guntur',
        'createdAt': '2026-10-25T10:00:00.000Z',
        'senderId': 'farmer-10',
      };
      final demandMsg = CommunityMessage.fromJson(demandJson);
      expect(demandMsg.category, 'Equipment Demand');
      expect(demandMsg.cleanText, 'Need 50HP John Deere tractor for 2 days in Guntur');

      final cropJson = {
        'id': 'msg-crop',
        'text': 'Started paddy transplantation with BPT-5204 variety.',
        'createdAt': '2026-10-25T10:05:00.000Z',
        'senderId': 'farmer-11',
      };
      final cropMsg = CommunityMessage.fromJson(cropJson);
      expect(cropMsg.category, 'Crops & Farming');

      final replyJson = {
        'id': 'msg-reply',
        'text': '[Reply to @Murugan] I have an extra seed drill available.',
        'createdAt': '2026-10-25T10:10:00.000Z',
        'senderId': 'farmer-12',
      };
      final replyMsg = CommunityMessage.fromJson(replyJson);
      expect(replyMsg.replyToAuthor, 'Murugan');
      expect(replyMsg.cleanText, 'I have an extra seed drill available.');
    });

    test('CommunityNotifier toggleLike updates state optimistically without refetch', () {
      final notifier = CommunityNotifier(FakeCommunityService(), userId: 'farmer-test');

      expect(notifier.state.likedMessageIds.contains('msg-101'), isFalse);
      expect(notifier.state.extraLikes['msg-101'], isNull);

      // Like
      notifier.toggleLike('msg-101');
      expect(notifier.state.likedMessageIds.contains('msg-101'), isTrue);
      expect(notifier.state.extraLikes['msg-101'], 1);

      // Unlike
      notifier.toggleLike('msg-101');
      expect(notifier.state.likedMessageIds.contains('msg-101'), isFalse);
      expect(notifier.state.extraLikes['msg-101'], 0);

      notifier.dispose();
    });

    test('CommunityNotifier updates search query and category cleanly', () {
      final notifier = CommunityNotifier(FakeCommunityService(), userId: 'farmer-test');

      notifier.setSearchQuery('tractor');
      expect(notifier.state.searchQuery, 'tractor');

      notifier.setSelectedCategory('Equipment Demand');
      expect(notifier.state.selectedCategory, 'Equipment Demand');

      notifier.dispose();
    });
  });
}
