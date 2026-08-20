import '../../../core/api/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/errors/api_error_handler.dart';

class Notification {
  final String id;
  final String title;
  final String message;
  final bool read;
  final DateTime createdAt;

  Notification({
    required this.id,
    required this.title,
    required this.message,
    required this.read,
    required this.createdAt,
  });

  factory Notification.fromJson(Map<String, dynamic> json) {
    return Notification(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      message: json['message'] ?? '',
      read: json['read'] ?? false,
      createdAt: DateTime.parse(json['createdAt']),
    );
  }
}

class NotificationRepository {
  final ApiClient _apiClient = ApiClient();

  Future<List<Notification>> fetchNotifications() async {
    try {
      final response = await _apiClient.dio.get(ApiConstants.notifications);
      final List<dynamic> data = response.data;
      return data.map((e) => Notification.fromJson(e)).toList();
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }

  Future<void> markAsRead(String id) async {
    try {
      await _apiClient.dio.put('${ApiConstants.notifications}/$id/read');
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }
}
