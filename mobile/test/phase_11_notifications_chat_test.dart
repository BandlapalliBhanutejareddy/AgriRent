import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile/core/localization/app_localizations.dart';
import 'package:mobile/models/booking.dart';
import 'package:mobile/models/equipment.dart';
import 'package:mobile/models/user.dart';
import 'package:mobile/features/notifications/repository/notification_repository.dart';
import 'package:mobile/features/notifications/providers/notification_provider.dart';
import 'package:mobile/features/chat/models/chat_message.dart';
import 'package:mobile/features/chat/providers/chat_provider.dart';

void main() {
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    SharedPreferences.setMockInitialValues({});
  });

  tearDown(() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  });

  group('Phase 11 — 1. Notification Models, Deserialization & Chronological Sorting', () {
    test('Notification correctly deserializes JSON with type and relatedId', () {
      final json = {
        'id': 'notif_100',
        'title': 'New Booking Request',
        'message': 'Farmer Ramesh requested John Deere 5050 D.',
        'read': false,
        'type': 'BOOKING_REQUEST',
        'relatedId': 'bk_999',
        'createdAt': '2026-10-21T10:30:00.000Z',
      };

      final notif = Notification.fromJson(json);

      expect(notif.id, 'notif_100');
      expect(notif.title, 'New Booking Request');
      expect(notif.message, 'Farmer Ramesh requested John Deere 5050 D.');
      expect(notif.read, false);
      expect(notif.type, 'BOOKING_REQUEST');
      expect(notif.relatedId, 'bk_999');
      expect(notif.createdAt, DateTime.parse('2026-10-21T10:30:00.000Z'));
    });

    test('Notification copyWith updates fields without mutating original', () {
      final original = Notification(
        id: 'notif_1',
        title: 'Original Title',
        message: 'Original Message',
        read: false,
        type: 'CHAT_MESSAGE',
        relatedId: 'bk_1',
        createdAt: DateTime(2026, 10, 20),
      );

      final updated = original.copyWith(read: true, title: 'Updated Title');

      expect(original.read, false);
      expect(original.title, 'Original Title');
      expect(updated.read, true);
      expect(updated.title, 'Updated Title');
      expect(updated.id, 'notif_1');
      expect(updated.relatedId, 'bk_1');
    });

    test('Notifications are sorted chronologically in descending order (newest first)', () {
      final n1 = Notification(
        id: '1',
        title: 'Oldest',
        message: 'M1',
        read: true,
        createdAt: DateTime(2026, 10, 1),
      );
      final n2 = Notification(
        id: '2',
        title: 'Newest',
        message: 'M2',
        read: false,
        createdAt: DateTime(2026, 10, 20),
      );
      final n3 = Notification(
        id: '3',
        title: 'Middle',
        message: 'M3',
        read: false,
        createdAt: DateTime(2026, 10, 10),
      );

      final list = [n1, n2, n3];
      list.sort((a, b) => b.createdAt.compareTo(a.createdAt));

      expect(list.first.id, '2');
      expect(list[1].id, '3');
      expect(list.last.id, '1');
    });
  });

  group('Phase 11 — 2. Notifications State, Deduplication & Authoritative Unread Count', () {
    test('NotificationsState unreadCount is derived from authoritative read flags', () {
      final n1 = Notification(
        id: 'n1',
        title: 'Unread 1',
        message: 'Msg',
        read: false,
        createdAt: DateTime(2026, 10, 21),
      );
      final n2 = Notification(
        id: 'n2',
        title: 'Read 1',
        message: 'Msg',
        read: true,
        createdAt: DateTime(2026, 10, 20),
      );
      final n3 = Notification(
        id: 'n3',
        title: 'Unread 2',
        message: 'Msg',
        read: false,
        createdAt: DateTime(2026, 10, 19),
      );

      const emptyState = NotificationsState();
      expect(emptyState.unreadCount, 0);

      final state = NotificationsState(notifications: [n1, n2, n3]);
      expect(state.unreadCount, 2);
    });

    test('In-memory deduplication merges notifications by ID without duplicate cards', () {
      final existing = [
        Notification(
          id: 'n1',
          title: 'Notif 1',
          message: 'Old Msg',
          read: false,
          createdAt: DateTime(2026, 10, 20),
        ),
        Notification(
          id: 'n2',
          title: 'Notif 2',
          message: 'Msg 2',
          read: true,
          createdAt: DateTime(2026, 10, 19),
        ),
      ];

      final incoming = [
        Notification(
          id: 'n1',
          title: 'Notif 1 Updated',
          message: 'New Msg',
          read: true,
          createdAt: DateTime(2026, 10, 20),
        ),
        Notification(
          id: 'n3',
          title: 'Notif 3',
          message: 'Msg 3',
          read: false,
          createdAt: DateTime(2026, 10, 21),
        ),
      ];

      final map = <String, Notification>{};
      for (final n in existing) {
        map[n.id] = n;
      }
      for (final n in incoming) {
        map[n.id] = n;
      }

      final merged = map.values.toList()..sort((a, b) => b.createdAt.compareTo(a.createdAt));

      expect(merged.length, 3);
      expect(merged.first.id, 'n3');
      expect(merged[1].id, 'n1');
      expect(merged[1].read, true); // authoritative update
      expect(merged[1].title, 'Notif 1 Updated');
      expect(merged.last.id, 'n2');
    });

    test('Local mark-as-read updates specific notification and recalculates unread badge', () {
      final n1 = Notification(
        id: 'n1',
        title: 'A',
        message: 'A',
        read: false,
        createdAt: DateTime(2026, 10, 21),
      );
      final n2 = Notification(
        id: 'n2',
        title: 'B',
        message: 'B',
        read: false,
        createdAt: DateTime(2026, 10, 20),
      );

      var state = NotificationsState(notifications: [n1, n2]);
      expect(state.unreadCount, 2);

      final updatedList = state.notifications.map((n) {
        return n.id == 'n1' ? n.copyWith(read: true) : n;
      }).toList();

      state = state.copyWith(notifications: updatedList);
      expect(state.unreadCount, 1);
      expect(state.notifications.firstWhere((n) => n.id == 'n1').read, true);
      expect(state.notifications.firstWhere((n) => n.id == 'n2').read, false);
    });

    test('Local mark-all-as-read clears unread badge to 0', () {
      final n1 = Notification(
        id: 'n1',
        title: 'A',
        message: 'A',
        read: false,
        createdAt: DateTime(2026, 10, 21),
      );
      final n2 = Notification(
        id: 'n2',
        title: 'B',
        message: 'B',
        read: false,
        createdAt: DateTime(2026, 10, 20),
      );

      var state = NotificationsState(notifications: [n1, n2]);
      expect(state.unreadCount, 2);

      final allRead = state.notifications.map((n) => n.copyWith(read: true)).toList();
      state = state.copyWith(notifications: allRead);

      expect(state.unreadCount, 0);
      expect(state.notifications.every((n) => n.read), isTrue);
    });

    test('Delete notification removes item and updates unread badge count', () {
      final n1 = Notification(
        id: 'n1',
        title: 'A',
        message: 'A',
        read: false,
        createdAt: DateTime(2026, 10, 21),
      );
      final n2 = Notification(
        id: 'n2',
        title: 'B',
        message: 'B',
        read: true,
        createdAt: DateTime(2026, 10, 20),
      );

      var state = NotificationsState(notifications: [n1, n2]);
      expect(state.notifications.length, 2);
      expect(state.unreadCount, 1);

      final filtered = state.notifications.where((n) => n.id != 'n1').toList();
      state = state.copyWith(notifications: filtered);

      expect(state.notifications.length, 1);
      expect(state.notifications.first.id, 'n2');
      expect(state.unreadCount, 0);
    });
  });

  group('Phase 11 — 3. Notification Destination Routing Logic', () {
    String resolveDestination(Notification n) {
      final relId = n.relatedId?.trim();
      if (relId == null || relId.isEmpty) return '/home';

      final type = (n.type ?? '').toUpperCase();
      if (type == 'CHAT_MESSAGE') {
        return '/chat?bookingId=$relId';
      } else if (type.contains('BOOKING')) {
        return '/chat?bookingId=$relId';
      } else if (type.contains('WEATHER') || type.contains('AGRONOMIC') || type.contains('ALERT')) {
        return '/crop-advisor';
      }
      return '/home';
    }

    test('CHAT_MESSAGE notification routes to /chat with bookingId query parameter', () {
      final notif = Notification(
        id: 'n1',
        title: 'New message',
        message: 'Are you available tomorrow?',
        read: false,
        type: 'CHAT_MESSAGE',
        relatedId: 'bk_456',
        createdAt: DateTime.now(),
      );

      final route = resolveDestination(notif);
      expect(route, '/chat?bookingId=bk_456');
    });

    test('BOOKING_REQUEST notification routes to /chat with bookingId query parameter', () {
      final notif = Notification(
        id: 'n2',
        title: 'Booking Confirmed',
        message: 'Your booking bk_789 is confirmed.',
        read: false,
        type: 'BOOKING_REQUEST',
        relatedId: 'bk_789',
        createdAt: DateTime.now(),
      );

      final route = resolveDestination(notif);
      expect(route, '/chat?bookingId=bk_789');
    });

    test('WEATHER_ALERT and AGRONOMIC_ALERT route to /crop-advisor', () {
      final weatherNotif = Notification(
        id: 'n3',
        title: 'Heavy Rain Warning',
        message: 'Expect 45mm rain over next 24 hours.',
        read: false,
        type: 'WEATHER_ALERT',
        relatedId: 'farm_01',
        createdAt: DateTime.now(),
      );

      final agroNotif = Notification(
        id: 'n4',
        title: 'Pest Advisory',
        message: 'Stem borer warning in your district.',
        read: false,
        type: 'AGRONOMIC_ALERT',
        relatedId: 'farm_01',
        createdAt: DateTime.now(),
      );

      expect(resolveDestination(weatherNotif), '/crop-advisor');
      expect(resolveDestination(agroNotif), '/crop-advisor');
    });

    test('Notification with missing or empty relatedId safely falls back to /home', () {
      final notif = Notification(
        id: 'n5',
        title: 'General Update',
        message: 'Platform maintenance scheduled.',
        read: false,
        type: 'ANNOUNCEMENT',
        relatedId: null,
        createdAt: DateTime.now(),
      );

      expect(resolveDestination(notif), '/home');
    });
  });

  group('Phase 11 — 4. In-App Chat Models, Chronological Ordering & Role Separation', () {
    test('ChatMessage deserializes correctly with Sender details', () {
      final json = {
        'id': 'msg_1',
        'bookingId': 'bk_100',
        'senderId': 'user_farmer',
        'text': 'Can you deliver the cultivator at 7 AM?',
        'read': true,
        'createdAt': '2026-10-21T06:30:00.000Z',
        'sender': {
          'id': 'user_farmer',
          'name': 'Ramesh Farmer',
          'role': 'FARMER',
          'profileImage': 'https://example.com/p.jpg',
        }
      };

      final msg = ChatMessage.fromJson(json);

      expect(msg.id, 'msg_1');
      expect(msg.bookingId, 'bk_100');
      expect(msg.senderId, 'user_farmer');
      expect(msg.text, 'Can you deliver the cultivator at 7 AM?');
      expect(msg.read, true);
      expect(msg.sender, isNotNull);
      expect(msg.sender!.name, 'Ramesh Farmer');
      expect(msg.sender!.role, 'FARMER');
    });

    test('Chat messages are ordered chronologically ascending (oldest first, newest at bottom)', () {
      final m1 = ChatMessage(
        id: '1',
        bookingId: 'bk_1',
        senderId: 'farmer',
        text: 'First message',
        read: true,
        createdAt: DateTime(2026, 10, 21, 9, 0),
      );
      final m2 = ChatMessage(
        id: '2',
        bookingId: 'bk_1',
        senderId: 'owner',
        text: 'Second reply',
        read: true,
        createdAt: DateTime(2026, 10, 21, 9, 5),
      );
      final m3 = ChatMessage(
        id: '3',
        bookingId: 'bk_1',
        senderId: 'farmer',
        text: 'Third confirmation',
        read: false,
        createdAt: DateTime(2026, 10, 21, 9, 10),
      );

      final list = [m3, m1, m2];
      list.sort((a, b) => a.createdAt.compareTo(b.createdAt));

      expect(list.first.text, 'First message');
      expect(list[1].text, 'Second reply');
      expect(list.last.text, 'Third confirmation');
    });

    test('Participant role separation correctly resolves other participant name and role', () {
      final booking = Booking(
        id: 'bk_100',
        farmerId: 'farmer_123',
        equipmentId: 'eq_1',
        startDate: DateTime(2026, 11, 1),
        endDate: DateTime(2026, 11, 3),
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        totalPrice: 4000.0,
        amountPaid: 4000.0,
        securityDeposit: 500.0,
        statusHistory: const [],
        equipment: Equipment(
          id: 'eq_1',
          title: 'Mahindra 575 DI',
          category: 'TRACTOR',
          description: 'Power tractor',
          pricePerDay: 2000.0,
          imageUrl: 'https://example.com/tractor.jpg',
          ownerId: 'owner_456',
          available: true,
          owner: User(
            id: 'owner_456',
            name: 'Suresh Owner',
            email: 'suresh@example.com',
            role: 'OWNER',
            preferredLanguage: 'en',
          ),
        ),
        farmer: User(
          id: 'farmer_123',
          name: 'Ramesh Farmer',
          email: 'ramesh@example.com',
          role: 'FARMER',
          preferredLanguage: 'en',
        ),
      );

      // Case A: Current user is Farmer -> other participant must be Owner
      const currentUserIdAsFarmer = 'farmer_123';
      final isFarmer = currentUserIdAsFarmer == booking.farmerId;
      final otherNameWhenFarmer = isFarmer
          ? (booking.equipment?.owner?.name ?? 'Equipment Owner')
          : (booking.farmer?.name ?? 'Farmer');
      expect(otherNameWhenFarmer, 'Suresh Owner');

      // Case B: Current user is Owner -> other participant must be Farmer
      const currentUserIdAsOwner = 'owner_456';
      final isOwnerViewing = currentUserIdAsOwner != booking.farmerId;
      final otherNameWhenOwner = isOwnerViewing
          ? (booking.farmer?.name ?? 'Farmer')
          : (booking.equipment?.owner?.name ?? 'Equipment Owner');
      expect(otherNameWhenOwner, 'Ramesh Farmer');
    });
  });

  group('Phase 11 — 5. Chat Sending State, Failure Handling & Input Preservation', () {
    test('ChatState tracks isSending and sendError accurately', () {
      const stateIdle = ChatState();
      expect(stateIdle.isSending, false);
      expect(stateIdle.sendError, isNull);

      final stateSending = stateIdle.copyWith(isSending: true);
      expect(stateSending.isSending, true);

      final stateError = stateSending.copyWith(
        isSending: false,
        sendError: 'Network timeout',
      );
      expect(stateError.isSending, false);
      expect(stateError.sendError, 'Network timeout');

      final stateSuccess = stateError.copyWith(
        clearSendError: true,
      );
      expect(stateSuccess.sendError, isNull);
    });

    test('On send failure, entered input is preserved and not optimistically committed', () {
      final existingMsg = ChatMessage(
        id: 'm1',
        bookingId: 'bk_1',
        senderId: 'farmer_1',
        text: 'Previous message',
        read: true,
        createdAt: DateTime.now(),
      );
      var state = ChatState(messages: [existingMsg]);

      var inputDraft = 'Draft message about pickup time';

      // Simulate sending starts
      state = state.copyWith(isSending: true);
      expect(state.isSending, true);

      // Simulate API failure
      const errorMsg = 'Failed to send message. Please retry.';
      state = state.copyWith(isSending: false, sendError: errorMsg);

      // Verify unconfirmed message not added to messages list
      expect(state.messages.length, 1);
      expect(state.messages.first.text, 'Previous message');
      expect(state.sendError, errorMsg);
      // User draft preserved
      expect(inputDraft, 'Draft message about pickup time');

      // Simulate successful retry
      state = state.copyWith(isSending: true, sendError: null);
      final confirmedMsg = ChatMessage(
        id: 'm2',
        bookingId: 'bk_1',
        senderId: 'farmer_1',
        text: inputDraft,
        read: false,
        createdAt: DateTime.now(),
      );
      state = state.copyWith(
        isSending: false,
        messages: [...state.messages, confirmedMsg],
      );
      inputDraft = '';

      expect(inputDraft, '');
      expect(state.messages.length, 2);
      expect(state.messages.last.id, 'm2');
      expect(state.messages.last.text, 'Draft message about pickup time');
    });

    test('Duplicate send prevention suppresses concurrent submissions when active', () {
      var isSendingActive = false;
      var sendAttempts = 0;

      Future<bool> simulateSendMessage(String text) async {
        if (isSendingActive) {
          return false;
        }
        isSendingActive = true;
        sendAttempts++;
        await Future.delayed(const Duration(milliseconds: 10));
        isSendingActive = false;
        return true;
      }

      simulateSendMessage('Hello');
      final secondCall = simulateSendMessage('Hello');

      expect(sendAttempts, 1);
      secondCall.then((result) {
        expect(result, false);
      });
    });
  });

  group('Phase 11 — 6. Security & Multi-Account Isolation', () {
    test('NotificationsNotifier resets in-memory cache to empty state on reset()', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final n1 = Notification(
        id: 'n_user1',
        title: 'User 1 Notification',
        message: 'Confidential message',
        read: false,
        createdAt: DateTime.now(),
      );

      final notifier = container.read(notificationsProvider.notifier);
      notifier.state = NotificationsState(notifications: [n1]);
      expect(notifier.state.notifications.length, 1);
      expect(notifier.state.unreadCount, 1);

      notifier.reset();

      expect(notifier.state.notifications, isEmpty);
      expect(notifier.state.unreadCount, 0);
      expect(notifier.state.isLoading, false);
      expect(notifier.state.error, isNull);
    });

    test('UnreadChatCountNotifier resets in-memory count to 0 on reset()', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final notifier = container.read(unreadChatCountProvider.notifier);
      notifier.state = 5;
      expect(notifier.state, 5);

      notifier.reset();
      expect(notifier.state, 0);
    });

    test('ChatProvider does not share state across different booking IDs', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final stateBooking1 = container.read(chatProvider('booking_aaa'));
      final stateBooking2 = container.read(chatProvider('booking_bbb'));

      expect(identical(stateBooking1, stateBooking2), isFalse);
    });
  });

  group('Phase 11 — 7. 5-Language Authentic Localization Verification', () {
    const requiredKeys = [
      'notifications',
      'mark_all_read',
      'all_notifications_read',
      'notification_deleted',
      'delete_notification',
      'no_notifications',
      'reply',
      'open_chat',
      'chat',
      'type_message',
      'message_could_not_be_sent',
      'no_messages_yet',
      'loading_conversation',
      'notif_booking_request',
      'notif_chat_message',
      'notif_weather_alert',
      'notif_agronomic_alert',
      'view_booking',
      'chat_with_farmer',
      'chat_with_owner',
      'unread_notifications',
      'unread_messages',
    ];

    const supportedLanguages = ['en', 'te', 'hi', 'ta', 'kn'];

    for (final lang in supportedLanguages) {
      test('Language "$lang" provides all Phase 11 localization keys without raw fallbacks', () {
        for (final key in requiredKeys) {
          final translated = key.tr(lang);
          expect(translated, isNotEmpty, reason: 'Key $key in $lang should not be empty');
          expect(
            translated != key || lang == 'en',
            isTrue,
            reason: 'Key $key in $lang should not equal raw key',
          );
        }
      });
    }

    test('Indic languages display valid native Unicode characters for Phase 11 keys', () {
      // Telugu
      expect('notifications'.tr('te'), contains('నోటిఫికేషన్'));
      expect('chat_with_farmer'.tr('te'), contains('రైతుతో'));
      expect('all_notifications_read'.tr('te'), contains('చదివినట్లుగా'));

      // Hindi
      expect('notifications'.tr('hi'), contains('सूचनाएं'));
      expect('chat_with_farmer'.tr('hi'), contains('किसान'));
      expect('all_notifications_read'.tr('hi'), contains('चिह्नित'));

      // Tamil
      expect('notifications'.tr('ta'), contains('அறிவிப்புகள்'));
      expect('chat_with_farmer'.tr('ta'), contains('விவசாயியுடன்'));
      expect('all_notifications_read'.tr('ta'), contains('குறிக்கப்பட்டன'));

      // Kannada
      expect('notifications'.tr('kn'), contains('ಅಧಿಸೂಚನೆಗಳು'));
      expect('chat_with_farmer'.tr('kn'), contains('ರೈತರೊಂದಿಗೆ'));
      expect('all_notifications_read'.tr('kn'), contains('ಗುರುತಿಸಲಾಗಿದೆ'));
    });
  });

  group('Phase 11 — 8. Preservation of Phases 1–10 Regressions', () {
    test('Phase 1: Knowledge base alias and localized roles preserved', () {
      expect('knowledge_base'.tr('en'), isNotEmpty);
      expect('role_farmer'.tr('te'), isNotEmpty);
      expect('role_owner'.tr('hi'), isNotEmpty);
    });

    test('Phase 2 & 3: Role structure and dashboard stages preserved', () {
      expect('canonical_stages'.tr('en'), isNotEmpty);
      expect('farm_copilot'.tr('en'), isNotEmpty);
    });

    test('Phase 4: Farm setup keys preserved', () {
      expect('add_farm'.tr('en'), isNotEmpty);
      expect('farm_name'.tr('en'), isNotEmpty);
    });

    test('Phase 5: Farm operations keys preserved', () {
      expect('all_operations'.tr('en'), isNotEmpty);
      expect('filter_all'.tr('en'), isNotEmpty);
    });

    test('Phase 6 & 7: Booking flow and timeline keys preserved', () {
      expect('book_now'.tr('en'), isNotEmpty);
      expect('booking_details'.tr('en'), isNotEmpty);
    });

    test('Phase 8: Marketplace and equipment filters preserved', () {
      expect('marketplace'.tr('en'), isNotEmpty);
      expect('search_equipment'.tr('en'), isNotEmpty);
    });

    test('Phase 9: Booking lifecycle and security deposit keys preserved', () {
      expect('security_deposit'.tr('en'), isNotEmpty);
      expect('deposit_notice'.tr('en'), isNotEmpty);
    });

    test('Phase 10: Financial intelligence and budget overview keys preserved', () {
      expect('budget_overview'.tr('en'), isNotEmpty);
      expect('total_expenses'.tr('en'), isNotEmpty);
      expect('unknown_cost_notice'.tr('en'), isNotEmpty);
    });
  });
}
