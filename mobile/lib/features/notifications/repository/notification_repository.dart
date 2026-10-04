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
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      message: json['message']?.toString() ?? '',
      read: json['read'] == true,
      createdAt: json['createdAt'] != null
          ? (DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now())
          : DateTime.now(),
    );
  }
}

class NotificationRepository {
  final ApiClient _apiClient = ApiClient();

  Future<List<Notification>> fetchNotifications() async {
    try {
      final response = await _apiClient.dio.get(ApiConstants.notifications);
      final dynamic raw = response.data;
      final List<dynamic> data = raw is List
          ? raw
          : (raw is Map && raw['data'] is List
              ? raw['data']
              : (raw is Map && raw['notifications'] is List ? raw['notifications'] : []));
      return data
          .whereType<Map>()
          .map((e) => Notification.fromJson(Map<String, dynamic>.from(e)))
          .toList();
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
