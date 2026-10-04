import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/chat/models/chat_message.dart';
import 'package:mobile/features/chat/providers/chat_provider.dart';

void main() {
  group('Chat Models and State Tests', () {
    test('ChatMessage deserializes correctly from backend JSON', () {
      final json = {
        'id': 'msg-123',
        'bookingId': 'booking-456',
        'senderId': 'user-789',
        'text': 'Hello, is the tractor ready?',
        'read': true,
        'createdAt': '2026-09-26T12:00:00.000Z',
        'sender': {
          'id': 'user-789',
          'name': 'Ramesh Kumar',
          'role': 'OWNER',
          'profileImage': null,
        }
      };

      final msg = ChatMessage.fromJson(json);

      expect(msg.id, 'msg-123');
      expect(msg.bookingId, 'booking-456');
      expect(msg.senderId, 'user-789');
      expect(msg.text, 'Hello, is the tractor ready?');
      expect(msg.read, true);
      expect(msg.sender, isNotNull);
      expect(msg.sender!.name, 'Ramesh Kumar');
      expect(msg.sender!.role, 'OWNER');
    });

    test('ChatState copyWith updates fields properly', () {
      const initial = ChatState(isLoading: true);
      expect(initial.isLoading, true);
      expect(initial.messages, isEmpty);

      final msg = ChatMessage(
        id: '1',
        bookingId: 'b1',
        senderId: 's1',
        text: 'Test message',
        read: false,
        createdAt: DateTime.now(),
      );

      final updated = initial.copyWith(
        isLoading: false,
        messages: [msg],
        error: null,
      );

      expect(updated.isLoading, false);
      expect(updated.messages.length, 1);
      expect(updated.messages.first.text, 'Test message');
      expect(updated.error, isNull);
    });
  });
}
