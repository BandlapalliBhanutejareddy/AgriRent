import '../../../core/api/api_client.dart';
import '../../../core/errors/api_error_handler.dart';
import '../models/chat_message.dart';

class ChatRepository {
  final ApiClient _apiClient = ApiClient();

  Future<List<ChatMessage>> fetchMessages(String bookingId) async {
    try {
      final response = await _apiClient.dio.get('chat/booking/$bookingId');
      final data = response.data;
      final List<dynamic> list = data is List ? data : (data?['data'] ?? []);
      return list.map((json) => ChatMessage.fromJson(json as Map<String, dynamic>)).toList();
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }

  Future<ChatMessage> sendMessage(String bookingId, String text) async {
    try {
      final response = await _apiClient.dio.post(
        'chat/booking/$bookingId',
        data: {'text': text.trim()},
      );
      final data = response.data?['data'] ?? response.data;
      return ChatMessage.fromJson(data as Map<String, dynamic>);
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }

  Future<void> markAsRead(String bookingId) async {
    try {
      await _apiClient.dio.put('chat/read/$bookingId');
    } catch (e) {
      // Best-effort mark-as-read
    }
  }

  Future<int> getUnreadCount() async {
    try {
      final response = await _apiClient.dio.get('chat/unread-count');
      return (response.data?['unreadCount'] as num?)?.toInt() ?? 0;
    } catch (e) {
      return 0;
    }
  }
}
